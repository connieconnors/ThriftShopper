import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export async function POST(request: NextRequest) {
  try {
    // Get the session from Authorization header
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
    
    // Verify the user
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

    // Fetch the listing to verify ownership
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, seller_id, status")
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

    // Check Stripe status - Beta gating: must have stripe_account_id AND (details_submitted OR charges_enabled)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_account_id, stripe_details_submitted, stripe_charges_enabled, display_name")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const hasStripeAccount = !!profile.stripe_account_id;
    const isStripeConnectedEnough = hasStripeAccount && 
      (profile.stripe_details_submitted === true || profile.stripe_charges_enabled === true);

    if (!isStripeConnectedEnough) {
      // If we have an account ID but status might be stale, refresh from Stripe
      if (hasStripeAccount) {
        try {
          const account = await stripe.accounts.retrieve(profile.stripe_account_id);
          const isActuallyConnected = account.details_submitted === true || account.charges_enabled === true;
          
          if (!isActuallyConnected) {
            return NextResponse.json(
              { 
                error: "Connect payouts with Stripe to publish listings.",
                code: "STRIPE_NOT_COMPLETE"
              },
              { status: 403 }
            );
          }
          
          // Update profile with fresh status
          await supabase
            .from("profiles")
            .update({
              stripe_details_submitted: account.details_submitted,
              stripe_charges_enabled: account.charges_enabled,
              stripe_payouts_enabled: account.payouts_enabled,
            })
            .eq("user_id", user.id);
        } catch (stripeError) {
          return NextResponse.json(
            { 
              error: "Connect payouts with Stripe to publish listings.",
              code: "STRIPE_NOT_COMPLETE"
            },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { 
            error: "Connect payouts with Stripe to publish listings.",
            code: "STRIPE_NOT_COMPLETE"
          },
          { status: 403 }
        );
      }
    }

    // Update listing status to active AND denormalize seller Stripe data
    const updateData: any = {
      status: 'active',
      updated_at: new Date().toISOString(),
      seller_stripe_account_id: profile.stripe_account_id, // Denormalize for checkout
      seller_name: profile.display_name || null, // Denormalize seller name for UI
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
      message: "Listing published successfully"
    });
  } catch (error: unknown) {
    console.error("Error publishing listing:", error);
    const message = error instanceof Error ? error.message : "Failed to publish listing";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

