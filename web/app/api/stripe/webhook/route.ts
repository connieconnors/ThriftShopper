import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "../../../../lib/supabaseClient";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "No signature" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.type) {
      case "account.updated":
        const account = event.data.object as Stripe.Account;
        await handleAccountUpdated(account);
        break;

      case "checkout.session.completed":
        // Handle successful checkout if needed
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  try {
    // Find the profile with this Stripe account ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_account_id", account.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile not found for Stripe account:", account.id);
      return;
    }

    // Determine onboarding status
    let onboardingStatus = "pending";
    if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
      onboardingStatus = "completed";
    } else if (account.requirements?.currently_due && account.requirements.currently_due.length > 0) {
      onboardingStatus = "needs_verification";
    }

    // Update the profile
    await supabase
      .from("profiles")
      .update({ stripe_onboarding_status: onboardingStatus })
      .eq("id", profile.id);

    console.log(`Updated profile ${profile.id} with onboarding status: ${onboardingStatus}`);
  } catch (error) {
    console.error("Error handling account.updated:", error);
  }
}

