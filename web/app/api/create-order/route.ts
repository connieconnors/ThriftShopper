import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabaseClient";

export async function POST(request: NextRequest) {
  try {
    const { 
      listingId, 
      paymentIntentId, 
      amount, 
      shippingInfo,
      userId
    } = await request.json();

    if (!listingId || !paymentIntentId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch the listing to get seller info
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, title, seller_id, price")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    // Create order record
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        buyer_id: userId,
        seller_id: listing.seller_id,
        listing_id: listingId,
        amount: amount || listing.price,
        status: "paid",
        payment_intent_id: paymentIntentId,
        shipping_name: shippingInfo?.name || null,
        shipping_address: shippingInfo?.address || null,
        shipping_city: shippingInfo?.city || null,
        shipping_state: shippingInfo?.state || null,
        shipping_zip: shippingInfo?.zip || null,
        shipping_phone: shippingInfo?.phone || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    // Update listing status to sold
    await supabase
      .from("listings")
      .update({ status: "sold" })
      .eq("id", listingId);

    return NextResponse.json({
      orderId: order.id,
      success: true,
    });
  } catch (error: unknown) {
    console.error("Error creating order:", error);
    const message = error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

