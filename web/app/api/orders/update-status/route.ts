import { NextRequest, NextResponse } from "next/server";
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

export async function POST(request: NextRequest) {
  try {
    const auth = await createAuthenticatedSupabaseClient(request);
    if ("error" in auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { supabase, userId } = auth;
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

    const { data: order, error: orderError } = await supabase
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

    if (order.seller_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const currentStatus = String(order.status ?? "paid");
    if (!VALID_TRANSITIONS[currentStatus]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot change status from ${currentStatus} to ${status}` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      status,
      updated_at: now,
    };

    if (status === "shipped") {
      updateData.shipped_at = now;
      updateData.tracking_number = trackingNumber;
    }

    if (status === "completed") {
      updateData.completed_at = now;
    }

    if (status === "delivered") {
      updateData.completed_at = now;
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating order:", updateError);
      return NextResponse.json(
        { error: "We couldn't update this order. Please try again." },
        { status: 500 }
      );
    }

    if (status === "shipped" || status === "delivered") {
      const { data: listing } = await supabase
        .from("listings")
        .select("title")
        .eq("id", order.listing_id)
        .maybeSingle();

      if (status === "shipped" && order.buyer_id) {
        const { data: buyerProfile } = await supabase
          .from("profiles")
          .select("email, display_name")
          .eq("user_id", order.buyer_id)
          .maybeSingle();

        const { data: sellerProfile } = await supabase
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
        const { data: sellerProfile } = await supabase
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
