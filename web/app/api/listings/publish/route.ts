import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import {
  listingNeedsShippingAmountFix,
  SELLER_LISTING_NEEDS_SHIPPING_MESSAGE,
} from "../../../../lib/shippingPreferences";
import { resolveSellerActionType } from "../../../../lib/sellerActionType";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized - No authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const { data: { user }, error: tokenError } = await supabase.auth.getUser();
    if (tokenError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { listingId } = await request.json();
    if (!listingId) {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 }
      );
    }

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, seller_id, status, custom_shipping_policy, seller_action_type")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    if (listing.seller_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized - You can only publish your own listings" },
        { status: 403 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "stripe_account_id, stripe_details_submitted, stripe_charges_enabled, stripe_onboarding_status, display_name, shipping_info, seller_action_type, payment_mode, payment_pickup_label"
      )
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    if (
      listingNeedsShippingAmountFix(
        listing.custom_shipping_policy,
        profile.shipping_info
      )
    ) {
      return NextResponse.json(
        {
          error: SELLER_LISTING_NEEDS_SHIPPING_MESSAGE,
          code: "SHIPPING_NOT_CONFIGURED",
        },
        { status: 400 }
      );
    }

    let stripeAccountId = profile.stripe_account_id;
    let isStripeReady = false;

    if (stripeAccountId) {
      try {
        const account = await stripe.accounts.retrieve(stripeAccountId);
        isStripeReady =
          account.details_submitted === true || account.charges_enabled === true;

        await supabase
          .from("profiles")
          .update({
            stripe_details_submitted: account.details_submitted,
            stripe_charges_enabled: account.charges_enabled,
            stripe_payouts_enabled: account.payouts_enabled,
          })
          .eq("user_id", user.id);
      } catch (stripeError) {
        console.warn("⚠️ Stripe account verification failed:", stripeError);
        stripeAccountId = null;
      }
    }

    const sellerActionType = resolveSellerActionType(profile, listing.seller_action_type);
    const requiresStripeCheckout = sellerActionType === "stripe_checkout";

    if (requiresStripeCheckout && !isStripeReady) {
      return NextResponse.json(
        {
          error: "Connect payments to start selling.",
          code: "STRIPE_NOT_COMPLETE",
          message:
            "Connect Stripe to publish Buy Online listings, or change how buyers pay in Seller Settings.",
        },
        { status: 409 }
      );
    }

    const updateData: Record<string, unknown> = {
      status: "active",
      updated_at: new Date().toISOString(),
      seller_stripe_account_id: stripeAccountId,
      seller_name: profile.display_name || null,
    };

    const { error: updateError } = await supabase
      .from("listings")
      .update(updateData)
      .eq("id", listingId)
      .eq("seller_id", user.id);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to publish listing: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Listing published successfully",
    });
  } catch (error: unknown) {
    console.error("Error publishing listing:", error);
    const message =
      error instanceof Error ? error.message : "Failed to publish listing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
