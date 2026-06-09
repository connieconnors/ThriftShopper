import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendItemShippedEmail } from "../../../../lib/emails/sendEmail";
import { sendPaymentReceivedEmail } from "../../../../lib/emails/sendEmail";
import { createAuthenticatedSupabaseClient } from "../../../../lib/supabaseServerAuth";

const VALID_STATUSES = ["paid", "shipped", "delivered", "completed", "cancelled"] as const;

const VALID_TRANSITIONS: Record<string, string[]> = {
  paid: ["shipped", "completed", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  completed: [],
  cancelled: [],
};

function getSupabaseAdmin() {
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function normalizeOrderStatus(status: string | null | undefined): string {
  return String(status ?? "paid").trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const auth = await createAuthenticatedSupabaseClient(request);
    if ("error" in auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = auth;
    const body = await request.json();
    const orderId = body?.orderId != null ? String(body.orderId) : "";
    const status = body?.status as string | undefined;
    const trackingNumberRaw = body?.trackingNumber;
    const trackingNumber =
      typeof trackingNumberRaw === "string" && trackingNumberRaw.trim()
        ? trackingNumberRaw.trim()
        : null;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Missing required fields: orderId and status" },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id, seller_id, buyer_id, listing_id, amount, status")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      console.error("Error fetching order:", orderError);
      return NextResponse.json(
        { error: "We couldn't update this order. Please try again." },
        { status: 500 }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: "We couldn't find this order. Please refresh and try again." },
        { status: 404 }
      );
    }

    if (String(order.seller_id) !== String(userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const currentStatus = normalizeOrderStatus(order.status);
    if (!VALID_TRANSITIONS[currentStatus]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot change status from ${currentStatus} to ${status}` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = { status };

    if (status === "shipped") {
      updateData.shipped_at = now;
      updateData.tracking_number = trackingNumber;
    }

    if (status === "completed" || status === "delivered") {
      updateData.completed_at = now;
    }

    const { data: updatedOrder, error: updateError } = await admin
      .from("orders")
      .update(updateData)
      .eq("id", orderId)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error("Error updating order:", updateError);
      return NextResponse.json(
        { error: "We couldn't update this order. Please try again." },
        { status: 500 }
      );
    }

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "We couldn't update this order. Please try again." },
        { status: 500 }
      );
    }

    if (status === "shipped" || status === "delivered") {
      const { data: listing } = await admin
        .from("listings")
        .select("title")
        .eq("id", order.listing_id)
        .maybeSingle();

      if (status === "shipped" && order.buyer_id) {
        const { data: buyerProfile } = await admin
          .from("profiles")
          .select("email, display_name")
          .eq("user_id", order.buyer_id)
          .maybeSingle();

        const { data: sellerProfile } = await admin
          .from("profiles")
          .select("display_name")
          .eq("user_id", order.seller_id)
          .maybeSingle();

        if (buyerProfile?.email) {
          const trackingUrl = trackingNumber
            ? `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${trackingNumber}`
            : undefined;

          sendItemShippedEmail(buyerProfile.email, {
            buyerName: buyerProfile.display_name || "there",
            orderId: String(order.id),
            itemName: listing?.title || "your item",
            trackingNumber: trackingNumber || "",
            carrierName: undefined,
            trackingUrl,
            estimatedDelivery: undefined,
            sellerName: sellerProfile?.display_name || "the seller",
          }).catch((err) => {
            console.error("Error sending item shipped email:", err);
          });
        }
      }

      if (status === "delivered" && order.seller_id) {
        const { data: sellerProfile } = await admin
          .from("profiles")
          .select("email, display_name")
          .eq("user_id", order.seller_id)
          .maybeSingle();

        if (sellerProfile?.email) {
          sendPaymentReceivedEmail(sellerProfile.email, {
            sellerName: sellerProfile.display_name || "there",
            itemName: listing?.title || "your item",
            orderId: String(order.id),
            amount: order.amount || 0,
            paymentDate: new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            stripeDashboardUrl: "https://dashboard.stripe.com/payments",
          }).catch((err) => {
            console.error("Error sending payment received email:", err);
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error: unknown) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "We couldn't update this order. Please try again." },
      { status: 500 }
    );
  }
}
