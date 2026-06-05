import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    );

    const {
      data: { user },
      error: tokenError,
    } = await supabase.auth.getUser();

    if (tokenError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { listingId } = await request.json();
    if (!listingId) {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 }
      );
    }

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, title, status, seller_id")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.seller_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (listing.status !== "sold") {
      return NextResponse.json(
        { error: "Only sold listings can be relisted" },
        { status: 400 }
      );
    }

    // Void open orders for this listing so it can be sold again — buyer history keeps the row
    const { error: ordersError } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("listing_id", listingId)
      .eq("seller_id", user.id)
      .in("status", ["paid", "pending", "shipped", "delivered"]);

    if (ordersError) {
      console.error("Relist: failed to cancel orders:", ordersError);
      return NextResponse.json(
        { error: "Failed to update order records" },
        { status: 500 }
      );
    }

    const { error: listingUpdateError } = await supabase
      .from("listings")
      .update({
        status: "active",
        sold_at: null,
        buyer_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", listingId)
      .eq("seller_id", user.id);

    if (listingUpdateError) {
      console.error("Relist: failed to update listing:", listingUpdateError);
      return NextResponse.json(
        { error: "Failed to relist item" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      listingId,
      message: "Item is live again. Any open orders were marked cancelled.",
    });
  } catch (error) {
    console.error("Relist error:", error);
    return NextResponse.json(
      { error: "Failed to relist item" },
      { status: 500 }
    );
  }
}
