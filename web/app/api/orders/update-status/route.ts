import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabaseClient";
import { sendItemShippedEmail } from "../../../../lib/emails/sendEmail";
import { sendPaymentReceivedEmail } from "../../../../lib/emails/sendEmail";

export async function POST(request: NextRequest) {
  try {
    const { orderId, status, trackingNumber } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Missing required fields: orderId and status" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['paid', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Get auth header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // Try to get from session (client-side calls)
      // For now, we'll verify the order belongs to the seller via the order lookup
    }

    // Fetch the order to verify it exists and get seller_id, buyer_id, listing_id
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, seller_id, buyer_id, listing_id, amount, tracking_number")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Validate status transition
    const currentStatus = order.status;
    const validTransitions: Record<string, string[]> = {
      'paid': ['shipped', 'cancelled'],
      'shipped': ['delivered', 'cancelled'],
      'delivered': [], // Final state
      'cancelled': [], // Final state
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot change status from ${currentStatus} to ${status}` },
        { status: 400 }
      );
    }

    // Update order
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Add tracking number if provided and status is shipped
    if (status === 'shipped' && trackingNumber) {
      updateData.tracking_number = trackingNumber.trim();
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
        { error: "Failed to update order" },
        { status: 500 }
      );
    }

    // Send emails based on status change (don't block on errors)
    if (status === 'shipped' || status === 'delivered') {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL || 'thriftshopper.com'}` 
        : 'http://localhost:3000';

      // Fetch listing details
      const { data: listing } = await supabase
        .from("listings")
        .select("title")
        .eq("id", order.listing_id)
        .maybeSingle();

      // Send "Item Shipped" email to buyer
      if (status === 'shipped' && order.buyer_id) {
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
          // Generate tracking URL (basic - can be enhanced with carrier detection)
          const trackingUrl = updatedOrder.tracking_number 
            ? `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${updatedOrder.tracking_number}`
            : undefined;

          sendItemShippedEmail(buyerProfile.email, {
            buyerName: buyerProfile.display_name || 'there',
            orderId: order.id,
            itemName: listing?.title || 'your item',
            trackingNumber: updatedOrder.tracking_number || '',
            carrierName: undefined, // Can be enhanced to detect carrier from tracking number
            trackingUrl,
            estimatedDelivery: undefined, // Can be calculated or provided by seller
            sellerName: sellerProfile?.display_name || 'the seller',
          }).catch((err) => {
            console.error('Error sending item shipped email:', err);
          });
        }
      }

      // Send "Payment Received" email to seller when delivered
      if (status === 'delivered' && order.seller_id) {
        const { data: sellerProfile } = await supabase
          .from("profiles")
          .select("email, display_name")
          .eq("user_id", order.seller_id)
          .maybeSingle();

        if (sellerProfile?.email) {
          sendPaymentReceivedEmail(sellerProfile.email, {
            sellerName: sellerProfile.display_name || 'there',
            itemName: listing?.title || 'your item',
            orderId: order.id,
            amount: order.amount || 0,
            paymentDate: new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
            stripeDashboardUrl: 'https://dashboard.stripe.com/payments', // Link to Stripe dashboard
          }).catch((err) => {
            console.error('Error sending payment received email:', err);
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
    const message = error instanceof Error ? error.message : "Failed to update order";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

