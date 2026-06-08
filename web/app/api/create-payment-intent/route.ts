import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "../../../lib/supabaseClient";
import {
  calculatePlatformFeeCents,
  getEffectiveSellerFeeRate,
} from "../../../lib/marketplaceFees";
import {
  resolveCheckoutShipping,
  serializeShippingPreferences,
  BUYER_SHIPPING_UNAVAILABLE_MESSAGE,
} from "../../../lib/shippingPreferences";
import { resolveSellerActionType } from "../../../lib/sellerActionType";

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

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select(
        "id, title, price, seller_id, status, seller_stripe_account_id, custom_shipping_policy, seller_action_type"
      )
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

    const { data: sellerPaymentProfile } = await supabase
      .from("profiles")
      .select(
        "seller_action_type, payment_mode, payment_pickup_label, stripe_account_id, stripe_onboarding_status"
      )
      .eq("user_id", listing.seller_id)
      .maybeSingle();

    const sellerActionType = resolveSellerActionType(
      sellerPaymentProfile,
      listing.seller_action_type
    );
    if (sellerActionType !== "stripe_checkout") {
      return NextResponse.json(
        {
          error: "This item is not available for in-app checkout.",
          code: "CHECKOUT_NOT_AVAILABLE",
        },
        { status: 409 }
      );
    }

    if (!listing.seller_stripe_account_id) {
      console.warn("❌ Listing missing seller_stripe_account_id:", listingId);
      return NextResponse.json(
        {
          error: "Seller has not completed payout setup.",
          code: "STRIPE_NOT_COMPLETE",
        },
        { status: 409 }
      );
    }

    try {
      const account = await stripe.accounts.retrieve(
        listing.seller_stripe_account_id
      );
      const isStripeConnectedEnough =
        account.details_submitted === true || account.charges_enabled === true;

      if (!isStripeConnectedEnough) {
        return NextResponse.json(
          {
            error: "Seller has not completed payout setup.",
            code: "STRIPE_NOT_COMPLETE",
          },
          { status: 409 }
        );
      }
    } catch (stripeError: unknown) {
      console.error("❌ Error verifying Stripe account:", stripeError);
      return NextResponse.json(
        {
          error: "Seller has not completed payout setup.",
          code: "STRIPE_NOT_COMPLETE",
        },
        { status: 409 }
      );
    }

    const { data: sellerProfile } = await supabase
      .from("profiles")
      .select("seller_fee_rate, shipping_info")
      .eq("user_id", listing.seller_id)
      .maybeSingle();

    const resolved = resolveCheckoutShipping(
      listing.price,
      listing.custom_shipping_policy,
      sellerProfile?.shipping_info
    );

    if (resolved.isCheckoutBlocked) {
      return NextResponse.json(
        {
          error: BUYER_SHIPPING_UNAVAILABLE_MESSAGE,
          code: "SHIPPING_NOT_CONFIGURED",
        },
        { status: 400 }
      );
    }

    const sellerFeeRate = getEffectiveSellerFeeRate(
      sellerProfile?.seller_fee_rate
    );

    const itemSubtotalCents = Math.round(resolved.itemSubtotal * 100);
    const shippingCents = Math.round(resolved.shippingAmount * 100);
    const amountInCents = itemSubtotalCents + shippingCents;

    // Marketplace fee on item price only — shipping passes through to seller
    const platformFeeAmount = calculatePlatformFeeCents(
      itemSubtotalCents,
      sellerFeeRate
    );
    const sellerTransferCents = amountInCents - platformFeeAmount;

    const paymentIntentConfig: Stripe.PaymentIntentCreateParams = {
      amount: amountInCents,
      currency: "usd",
      transfer_data: {
        destination: listing.seller_stripe_account_id,
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
        seller_amount: sellerTransferCents.toString(),
        item_subtotal: resolved.itemSubtotal.toString(),
        shipping_amount: resolved.shippingAmount.toString(),
        buyer_total: resolved.buyerTotal.toString(),
        shipping_policy: serializeShippingPreferences(resolved.preferences),
        buyer_id: userId || "",
        shipping_name: shippingInfo?.name || "",
        shipping_address: shippingInfo?.address || "",
        shipping_city: shippingInfo?.city || "",
        shipping_state: shippingInfo?.state || "",
        shipping_zip: shippingInfo?.zip || "",
        shipping_phone: shippingInfo?.phone || "",
      },
    };

    if (platformFeeAmount > 0) {
      paymentIntentConfig.application_fee_amount = platformFeeAmount;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentConfig);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: resolved.buyerTotal,
      itemSubtotal: resolved.itemSubtotal,
      shippingAmount: resolved.shippingAmount,
      shippingLineLabel: resolved.shippingLineLabel,
      platformFee: platformFeeAmount / 100,
      sellerAmount: sellerTransferCents / 100,
    });
  } catch (error: unknown) {
    console.error("Error creating payment intent:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
