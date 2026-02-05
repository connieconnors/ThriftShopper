import Stripe from "stripe";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

/**
 * Stripe Webhook Handler
 * 
 * Route: /api/stripe/webhook
 * 
 * For local testing with Stripe CLI:
 *   stripe listen --forward-to http://localhost:3000/api/stripe/webhook
 * 
 * Copy the webhook signing secret from Stripe CLI output and set it as:
 *   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
 */

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
  // Support both snake_case and camelCase for listing ID
  const listingId = metadata.listing_id || metadata.listingId;
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

  // Fee snapshot: prefer metadata (set at payment intent creation), else fetch profile
  let effectiveRate = Number(metadata.seller_fee_rate ?? NaN);
  if (Number.isNaN(effectiveRate)) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("seller_fee_rate")
      .eq("user_id", sellerId)
      .maybeSingle();
    effectiveRate = Number(profile?.seller_fee_rate ?? 0);
  }
  const orderAmountDollars = amount || Number(listing.price);
  const platformFeeAmount = Math.round(orderAmountDollars * effectiveRate * 100) / 100;
  const stripeProcessingFee = orderAmountDollars * 0.029 + 0.3;
  const sellerPayoutAmount = Math.round((orderAmountDollars - platformFeeAmount - stripeProcessingFee) * 100) / 100;

  // Create order (idempotent - will fail if duplicate payment_intent_id)
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      buyer_id: buyerId,
      seller_id: sellerId,
      listing_id: listingId,
      amount: orderAmountDollars,
      status: "paid",
      payment_intent_id: paymentIntentId,
      seller_fee_rate: effectiveRate,
      platform_fee_amount: platformFeeAmount,
      seller_payout_amount: sellerPayoutAmount,
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

  // Note: Listing status update is handled in payment_intent.succeeded handler
  // This function only creates the order record
  
  console.log("✅ Order created from webhook:", order.id);
}

export async function POST(req: Request) {
  // MINIMAL TOP-OF-HANDLER LOG - This must appear if route is hit
  console.log("🚨 [WEBHOOK] POST handler called at", new Date().toISOString());
  console.log("🚨 [WEBHOOK] Route: /api/stripe/webhook");
  
  const sig = (await headers()).get("stripe-signature");
  if (!sig) {
    console.error("❌ [WEBHOOK] Missing stripe-signature header");
    return new Response("Missing stripe-signature", { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("❌ [WEBHOOK] Missing STRIPE_WEBHOOK_SECRET environment variable");
    return new Response("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });
  }

  console.log("🔔 [WEBHOOK] Signature and secret present, verifying...");

  let event: Stripe.Event;

  try {
    // IMPORTANT: must be raw body for signature verification
    const body = await req.text();

    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    console.log("✅ [WEBHOOK] Signature verified, event type:", event.type);
  } catch (err: any) {
    console.error("❌ [WEBHOOK] Signature verification failed:", err?.message || err);
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
        
        // Extract listingId from metadata or client_reference_id
        const listingId = session.metadata?.listingId || session.client_reference_id;
        
        if (!listingId) {
          console.warn("⚠️ Checkout session missing listingId in metadata or client_reference_id:", session.id);
          break;
        }

        // Update listing status to sold and set sold_at timestamp
        const { error: updateError } = await supabaseAdmin
          .from("listings")
          .update({ 
            status: "sold",
            sold_at: new Date().toISOString()
          })
          .eq("id", listingId);

        if (updateError) {
          console.error("❌ Error updating listing status from checkout session:", updateError);
        } else {
          console.log("✅ Listing marked as sold from checkout session:", listingId);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const listingId = paymentIntent.metadata?.listing_id;
        
        console.log("📦 [WEBHOOK] payment_intent.succeeded");
        console.log("   payment_intent.id:", paymentIntent.id);
        console.log("   listing_id:", listingId);
        
        if (!listingId) {
          console.warn("⚠️ Payment intent missing listing_id in metadata:", paymentIntent.id);
          console.log("   Available metadata keys:", Object.keys(paymentIntent.metadata || {}));
          break;
        }

        // Update listing status to sold and set sold_at timestamp
        const { error: updateError } = await supabaseAdmin
          .from("listings")
          .update({ 
            status: "sold",
            sold_at: new Date().toISOString()
          })
          .eq("id", listingId);

        if (updateError) {
          console.error("❌ [WEBHOOK] Failed to update listing:", {
            listingId,
            error: updateError.message,
            code: updateError.code,
          });
        } else {
          console.log("✅ [WEBHOOK] Listing updated successfully:", {
            listingId,
            status: "sold",
            sold_at: new Date().toISOString(),
          });
          // Temporary confirmation log
          console.log("🔍 [TEMPORARY] Listing update confirmed - check Supabase for status='sold' and sold_at IS NOT NULL");
        }
        
        // Safety net: Create order if it doesn't exist (separate concern)
        try {
          await createOrderFromPaymentIntent(paymentIntent);
        } catch (err: any) {
          console.error("❌ Error creating order from webhook:", err);
          // Don't fail the webhook - order creation is separate
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