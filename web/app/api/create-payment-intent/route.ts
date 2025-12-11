import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "../../../lib/supabaseClient";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export async function POST(request: NextRequest) {
  try {
    const { listingId, shippingInfo } = await request.json();

    if (!listingId) {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 }
      );
    }

    // Fetch the listing to get the price and seller info
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, title, price, seller_id, status")
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

    // Get seller's profile with Stripe account info
    // Note: seller_id in listings table = user_id in profiles table
    const { data: sellerProfile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, stripe_account_id, stripe_onboarding_status")
      .eq("user_id", listing.seller_id)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching seller profile:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch seller information" },
        { status: 500 }
      );
    }

    if (!sellerProfile) {
      return NextResponse.json(
        { error: "Seller profile not found" },
        { status: 404 }
      );
    }

    // Check if seller has completed Stripe onboarding
    if (sellerProfile.stripe_onboarding_status !== "completed") {
      return NextResponse.json(
        { 
          error: "Seller has not completed payout setup. Please contact the seller.",
          requiresStripeSetup: true 
        },
        { status: 400 }
      );
    }

    if (!sellerProfile.stripe_account_id) {
      return NextResponse.json(
        { 
          error: "Seller's Stripe account is not configured",
          requiresStripeSetup: true 
        },
        { status: 400 }
      );
    }

    // Calculate amount in cents (Stripe requires cents)
    const amountInCents = Math.round(listing.price * 100);
    
    // Calculate platform fee (10% of sale price)
    const platformFeePercent = 0.10;
    const platformFeeAmount = Math.round(amountInCents * platformFeePercent);
    
    // Amount that goes to seller (90% of sale price)
    const sellerAmount = amountInCents - platformFeeAmount;

    // Create payment intent with Stripe Connect
    // This splits the payment: platform fee stays with you, rest goes to seller
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      application_fee_amount: platformFeeAmount, // Platform fee (10%)
      transfer_data: {
        destination: sellerProfile.stripe_account_id, // Seller's Stripe Connect account
      },
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        listing_id: listingId,
        listing_title: listing.title,
        seller_id: listing.seller_id,
        seller_stripe_account: sellerProfile.stripe_account_id,
        platform_fee: platformFeeAmount.toString(),
        seller_amount: sellerAmount.toString(),
        shipping_name: shippingInfo?.name || "",
        shipping_address: shippingInfo?.address || "",
        shipping_city: shippingInfo?.city || "",
        shipping_state: shippingInfo?.state || "",
        shipping_zip: shippingInfo?.zip || "",
        shipping_phone: shippingInfo?.phone || "",
      },
    });

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

