import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  resolveSellerActionType,
  contactConfirmationMessage,
  pickupConfirmationMessage,
  isPickupAction,
} from "../../../../lib/sellerActionType";
import { sendListingInquiryEmail } from "../../../../lib/emails/sendEmail";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    }
  );
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const listingId = body?.listingId as string | undefined;
    const inquiryType = body?.inquiryType as "reserve" | "contact" | undefined;
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const buyerPhone =
      typeof body?.buyerPhone === "string" ? body.buyerPhone.trim() : "";

    if (!listingId || !inquiryType || !["reserve", "contact"].includes(inquiryType)) {
      return NextResponse.json(
        { error: "listingId and inquiryType (reserve|contact) are required" },
        { status: 400 }
      );
    }

    if (inquiryType === "contact" && !message) {
      return NextResponse.json(
        { error: "Please include a message for the seller" },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    const { data: listing, error: listingError } = await admin
      .from("listings")
      .select("id, title, price, seller_id, status, seller_name")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.status !== "active") {
      return NextResponse.json(
        { error: "This item is no longer available" },
        { status: 400 }
      );
    }

    if (listing.seller_id === user.id) {
      return NextResponse.json(
        { error: "You cannot reserve your own listing" },
        { status: 400 }
      );
    }

    const { data: sellerProfile } = await admin
      .from("profiles")
      .select(
        "display_name, email, seller_action_type, payment_mode, payment_pickup_label, stripe_account_id, stripe_onboarding_status"
      )
      .eq("user_id", listing.seller_id)
      .maybeSingle();

    const sellerActionType = resolveSellerActionType(sellerProfile);

    if (inquiryType === "reserve" && !isPickupAction(sellerActionType)) {
      return NextResponse.json(
        { error: "This listing does not support in-store reservation" },
        { status: 400 }
      );
    }

    if (inquiryType === "contact" && sellerActionType === "stripe_checkout") {
      return NextResponse.json(
        { error: "Use Buy Now for this listing" },
        { status: 400 }
      );
    }

    const { data: buyerProfile } = await admin
      .from("profiles")
      .select("display_name, email")
      .eq("user_id", user.id)
      .maybeSingle();

    const pickupLabel =
      sellerProfile?.payment_pickup_label?.trim() ||
      sellerProfile?.display_name?.trim() ||
      listing.seller_name ||
      "the seller";

    const { data: inquiry, error: insertError } = await admin
      .from("listing_inquiries")
      .insert({
        listing_id: listingId,
        seller_id: listing.seller_id,
        buyer_id: user.id,
        inquiry_type: inquiryType,
        status: inquiryType === "reserve" ? "reserved" : "pending",
        buyer_name: buyerProfile?.display_name || user.email?.split("@")[0] || null,
        buyer_email: buyerProfile?.email || user.email || null,
        buyer_phone: buyerPhone || null,
        message: message || null,
        pickup_location_name: inquiryType === "reserve" ? pickupLabel : null,
        listing_title: listing.title,
        listing_price: listing.price,
      })
      .select("id, inquiry_type, status, pickup_location_name")
      .single();

    if (insertError) {
      console.error("listing_inquiries insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create reservation", details: insertError.message },
        { status: 500 }
      );
    }

    const sellerEmail = sellerProfile?.email;
    if (sellerEmail) {
      sendListingInquiryEmail(sellerEmail, {
        sellerName: sellerProfile?.display_name || "Seller",
        buyerName: buyerProfile?.display_name || user.email || "A buyer",
        buyerEmail: buyerProfile?.email || user.email || "",
        buyerPhone: buyerPhone || undefined,
        listingTitle: listing.title,
        listingPrice: Number(listing.price),
        inquiryType,
        message: message || undefined,
        pickupLocationName:
          inquiryType === "reserve" ? pickupLabel : undefined,
      }).catch((err: unknown) => console.error("Inquiry email failed:", err));
    }

    const confirmationMessage =
      inquiryType === "reserve"
        ? pickupConfirmationMessage(sellerActionType, pickupLabel)
        : contactConfirmationMessage();

    return NextResponse.json({
      success: true,
      inquiryId: inquiry.id,
      inquiryType: inquiry.inquiry_type,
      status: inquiry.status,
      pickupLocationName: inquiry.pickup_location_name,
      confirmationMessage,
    });
  } catch (error) {
    console.error("Create inquiry error:", error);
    return NextResponse.json(
      { error: "Failed to submit inquiry" },
      { status: 500 }
    );
  }
}
