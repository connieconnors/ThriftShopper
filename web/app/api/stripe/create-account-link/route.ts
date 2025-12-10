import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
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
    
    // Get user from Authorization header token
    const token = authHeader.replace("Bearer ", "");
    
    // Create an authenticated Supabase client with the user's token
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

    // Get user's profile (using user_id - the actual column name in your database)
    console.log("Looking up profile for user:", user.id);
    
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, stripe_account_id, display_name, email")
      .eq("user_id", user.id)
      .maybeSingle();
    
    console.log("Profile query result:", { 
      hasData: !!profile, 
      error: profileError?.message,
      errorCode: profileError?.code 
    });

    if (profileError) {
      console.error("Profile lookup error:", profileError);
      return NextResponse.json(
        { error: `Profile lookup failed: ${profileError.message}` },
        { status: 500 }
      );
    }
    
    let finalProfile = profile;
    
    if (!finalProfile) {
      console.error("No profile found for user:", user.id);
      // Don't try to create profile here - it should exist from signup
      // If it doesn't exist, the user needs to complete seller onboarding first
      return NextResponse.json(
        { error: "Profile not found. Please complete seller onboarding first." },
        { status: 404 }
      );
    }

    let accountId = finalProfile.stripe_account_id;
    const profileId = finalProfile.user_id; // Use user_id (the actual column name)

    // Create Stripe Connect account if it doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "standard",
        country: "US", // Adjust based on your needs
        email: finalProfile.email || user.email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          user_id: user.id,
          profile_id: profileId,
        },
      });

      accountId = account.id;

      // Save the account ID to the profile
      await supabase
        .from("profiles")
        .update({ stripe_account_id: accountId })
        .eq("user_id", user.id);
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/sell?stripe_refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/sell?stripe_success=true`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      url: accountLink.url,
      accountId: accountId,
    });
  } catch (error: unknown) {
    console.error("Error creating Stripe account link:", error);
    const message = error instanceof Error ? error.message : "Failed to create account link";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

