import Stripe from "stripe";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";            // IMPORTANT: Stripe SDK needs Node runtime
export const dynamic = "force-dynamic";     // avoid caching / static optimization

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

// Use service role for webhook (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function createOrderFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const paymentIntentId = paymentIntent.id;
  const metadata = paymentIntent.metadata;

  // Extract order data from payment intent metadata
  const listingId = metadata.listing_id;
  const sellerId = metadata.seller_id;
  const amount = paymentIntent.amount / 100; // Convert from cents

  if (!listingId || !sellerId) {
    console.warn("⚠️ Payment intent missing required metadata:", {
      paymentIntentId,
      listingId,
      sellerId,
    });
    return;
  }

  // Check if order already exists (idempotent)
  const { data: existingOrder } = await supabaseAdmin
    .from("orders")
    .select("id, buyer_id")
    .eq("payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (existingOrder) {
    console.log("✅ Order already exists for payment intent:", existingOrder.id);
    return;
  }

  // Get buyer_id from payment intent customer or metadata
  // For now, we'll need buyer_id in metadata or fetch from payment intent
  const buyerId = metadata.buyer_id;
  if (!buyerId) {
    console.warn("⚠️ Payment intent missing buyer_id in metadata");
    return;
  }

  // Fetch listing to get full details
  const { data: listing, error: listingError } = await supabaseAdmin
    .from("listings")
    .select("id, title, price, seller_id")
    .eq("id", listingId)
    .single();

  if (listingError || !listing) {
    console.error("❌ Listing not found for payment intent:", listingId);
    return;
  }

  // Parse shipping info from metadata
  const shippingInfo = {
    name: metadata.shipping_name || null,
    address: metadata.shipping_address || null,
    city: metadata.shipping_city || null,
    state: metadata.shipping_state || null,
    zip: metadata.shipping_zip || null,
    phone: metadata.shipping_phone || null,
  };

  // Create order (idempotent - will fail if duplicate payment_intent_id)
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      buyer_id: buyerId,
      seller_id: sellerId,
      listing_id: listingId,
      amount: amount || listing.price,
      status: "paid",
      payment_intent_id: paymentIntentId,
      shipping_name: shippingInfo.name,
      shipping_address: shippingInfo.address,
      shipping_city: shippingInfo.city,
      shipping_state: shippingInfo.state,
      shipping_zip: shippingInfo.zip,
      shipping_phone: shippingInfo.phone,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (orderError) {
    // Check if it's a duplicate (idempotent check)
    if (orderError.code === "23505" || orderError.message?.includes("duplicate")) {
      console.log("✅ Order already exists (duplicate key)");
      return;
    }
    console.error("❌ Error creating order from webhook:", orderError);
    throw orderError;
  }

  // Update listing status to sold
  await supabaseAdmin
    .from("listings")
    .update({ status: "sold" })
    .eq("id", listingId);

  console.log("✅ Order created from webhook:", order.id);
}

export async function POST(req: Request) {
  const sig = (await headers()).get("stripe-signature");
  if (!sig) {
    return new Response("Missing stripe-signature", { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return new Response("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });
  }

  let event: Stripe.Event;

  try {
    // IMPORTANT: must be raw body for signature verification
    const body = await req.text();

    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err?.message || err);
    return new Response(`Webhook Error: ${err?.message || "Invalid signature"}`, {
      status: 400,
    });
  }

  try {
    // Handle events you care about
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("✅ checkout.session.completed", session.id);
        // TODO: Handle checkout session completion if we use Checkout Sessions
        // For now, we use Payment Intents, so this is a no-op
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("✅ payment_intent.succeeded", paymentIntent.id);
        
        // Safety net: Create order if it doesn't exist
        // This handles cases where payment succeeded but order creation failed client-side
        try {
          await createOrderFromPaymentIntent(paymentIntent);
        } catch (err: any) {
          console.error("❌ Error creating order from webhook:", err);
          // Don't fail the webhook - log and continue
        }
        break;
      }

      case "account.updated": {
        const acct = event.data.object as Stripe.Account;
        console.log("✅ account.updated", acct.id);
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return new Response("ok", { status: 200 });
  } catch (err: any) {
    console.error("❌ Webhook handler error:", err?.message || err);
    return new Response("Webhook handler failed", { status: 500 });
  }
}