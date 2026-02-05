import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "../../../lib/supabaseClient";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export async function POST(request: NextRequest) {
  try {
    const { listingId, shippingInfo, userId } = await request.json();

    if (!listingId) {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 }
      );
    }

    // Fetch the listing to get the price and denormalized seller Stripe info
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, title, price, seller_id, status, seller_stripe_account_id")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    if (listing.status !== "active") {
      return NextResponse.json(
        { error: "This item is no longer available" },
        { status: 400 }
      );
    }

    // Beta gating: Check if seller has completed Stripe setup
    // Use denormalized seller_stripe_account_id from listing (no profile fetch needed)
    if (!listing.seller_stripe_account_id) {
      console.warn("❌ Listing missing seller_stripe_account_id:", listingId);
      return NextResponse.json(
        { 
          error: "Seller has not completed payout setup.",
          code: "STRIPE_NOT_COMPLETE"
        },
        { status: 409 }
      );
    }

    // Verify Stripe account status directly from Stripe API
    try {
      const account = await stripe.accounts.retrieve(listing.seller_stripe_account_id);
      const isStripeConnectedEnough = account.details_submitted === true || account.charges_enabled === true;

      if (!isStripeConnectedEnough) {
        return NextResponse.json(
          { 
            error: "Seller has not completed payout setup.",
            code: "STRIPE_NOT_COMPLETE"
          },
          { status: 409 }
        );
      }
    } catch (stripeError: any) {
      console.error("❌ Error verifying Stripe account:", stripeError);
      // If we can't verify, err on the side of caution
      return NextResponse.json(
        { 
          error: "Seller has not completed payout setup.",
          code: "STRIPE_NOT_COMPLETE"
        },
        { status: 409 }
      );
    }

    // Fetch seller's fee rate from profile (beta: 0, later e.g. 0.04)
    const { data: sellerProfile } = await supabase
      .from("profiles")
      .select("seller_fee_rate")
      .eq("user_id", listing.seller_id)
      .maybeSingle();

    const sellerFeeRate = Number(sellerProfile?.seller_fee_rate ?? 0);

    // Calculate amount in cents (Stripe requires cents)
    const amountInCents = Math.round(listing.price * 100);

    // Platform fee = amount × seller_fee_rate (application_fee_amount in Stripe)
    const platformFeeAmount = Math.round(amountInCents * sellerFeeRate);
    const sellerAmount = amountInCents - platformFeeAmount;

    // Create payment intent with Stripe Connect
    // This splits the payment: platform fee stays with you, rest goes to seller
    const paymentIntentConfig: Stripe.PaymentIntentCreateParams = {
      amount: amountInCents,
      currency: "usd",
      transfer_data: {
        destination: listing.seller_stripe_account_id, // Use denormalized Stripe account ID from listing
      },
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        listing_id: listingId,
        listing_title: listing.title,
        seller_id: listing.seller_id,
        seller_stripe_account: listing.seller_stripe_account_id,
        platform_fee: platformFeeAmount.toString(),
        seller_fee_rate: sellerFeeRate.toString(),
        seller_amount: sellerAmount.toString(),
        buyer_id: userId || "",
        shipping_name: shippingInfo?.name || "",
        shipping_address: shippingInfo?.address || "",
        shipping_city: shippingInfo?.city || "",
        shipping_state: shippingInfo?.state || "",
        shipping_zip: shippingInfo?.zip || "",
        shipping_phone: shippingInfo?.phone || "",
      },
    };

    // Only add application_fee_amount if there's a fee (founding sellers have 0% for 6 months)
    if (platformFeeAmount > 0) {
      paymentIntentConfig.application_fee_amount = platformFeeAmount;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentConfig);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: listing.price,
      platformFee: platformFeeAmount / 100, // Convert back to dollars for display
      sellerAmount: sellerAmount / 100, // Convert back to dollars for display
    });
  } catch (error: unknown) {
    console.error("Error creating payment intent:", error);
    const message = error instanceof Error ? error.message : "Failed to create payment";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

