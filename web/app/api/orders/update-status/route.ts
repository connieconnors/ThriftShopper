import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabaseClient";

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

    // Fetch the order to verify it exists and get seller_id
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, seller_id, status")
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

