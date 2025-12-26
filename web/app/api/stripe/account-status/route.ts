import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("❌ Missing Supabase environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Get the session from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized - No authorization header" },
        { status: 401 }
      );
    }
    
    // Get user from Authorization header token
    const token = authHeader.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }
    
    // Create an authenticated Supabase client with the user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, // Explicitly set apikey header
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

    // Get user's profile with stripe_account_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, stripe_account_id")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (profileError) {
      console.error("Profile lookup error:", profileError);
      return NextResponse.json(
        { error: `Profile lookup failed: ${profileError.message}` },
        { status: 500 }
      );
    }
    
    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    console.log("🔍 Checking Stripe status for profile:", {
      profile_id: profile.user_id,
      stripe_account_id: profile.stripe_account_id,
    });

    // If no Stripe account ID, return status indicating setup needed
    if (!profile.stripe_account_id) {
      console.log("❌ No stripe_account_id found");
      return NextResponse.json({
        details_submitted: false,
        charges_enabled: false,
        payouts_enabled: false,
        account_id: null,
      });
    }

    // Retrieve account from Stripe
    try {
      const account = await stripe.accounts.retrieve(profile.stripe_account_id);
      
      console.log("✅ Stripe account retrieved:", {
        profile_id: profile.user_id,
        stripe_account_id: profile.stripe_account_id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
      });

      // Update profile with Stripe status (only if columns exist)
      try {
        const updateData: any = {
          stripe_charges_enabled: account.charges_enabled,
          stripe_payouts_enabled: account.payouts_enabled,
          stripe_details_submitted: account.details_submitted,
        };

        // Set onboarded_at if details are submitted and it wasn't set before
        if (account.details_submitted) {
          try {
            const { data: currentProfile } = await supabase
              .from("profiles")
              .select("stripe_onboarded_at")
              .eq("user_id", user.id)
              .single();
            
            if (!currentProfile?.stripe_onboarded_at) {
              updateData.stripe_onboarded_at = new Date().toISOString();
            }
          } catch (err) {
            // Column may not exist yet - that's okay
            console.log("⚠️ stripe_onboarded_at column may not exist yet");
          }
        }

        const updateResult = await supabase
          .from("profiles")
          .update(updateData)
          .eq("user_id", user.id);

        // If update fails due to missing columns, that's okay - we still return the status
        if (updateResult.error) {
          console.log("⚠️ Could not update Stripe status columns (may not exist yet):", updateResult.error.message);
        }
      } catch (err) {
        // Columns may not exist yet - that's okay, we still return the status
        console.log("⚠️ Stripe status columns may not exist yet, skipping database update");
      }

      return NextResponse.json({
        details_submitted: account.details_submitted,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        account_id: account.id,
      });
    } catch (stripeError: any) {
      console.error("❌ Error retrieving Stripe account:", stripeError);
      return NextResponse.json(
        { error: `Stripe error: ${stripeError.message}` },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Error checking Stripe status:", error);
    const message = error instanceof Error ? error.message : "Failed to check Stripe status";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

