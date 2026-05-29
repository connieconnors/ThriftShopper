import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const OPEN_SELLER_ORDER_STATUSES = ["paid", "shipped"];

function getServiceRoleKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || null;
}

export async function POST(request: NextRequest) {
  try {
    const serviceRoleKey = getServiceRoleKey();
    if (!serviceRoleKey) {
      console.error("Delete account: SUPABASE_SERVICE_ROLE_KEY is not configured");
      return NextResponse.json(
        { error: "Account deletion is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );

    const { data: openSellerOrders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("seller_id", userId)
      .in("status", OPEN_SELLER_ORDER_STATUSES)
      .limit(1);

    if (ordersError) {
      console.error("Delete account: failed to check orders", ordersError);
      return NextResponse.json(
        { error: "We couldn't verify your account status. Please try again." },
        { status: 500 }
      );
    }

    if (openSellerOrders && openSellerOrders.length > 0) {
      return NextResponse.json(
        {
          error:
            "You have open orders to fulfill. Please complete or resolve them before deleting your account, or contact support@thriftshopper.com for help.",
        },
        { status: 409 }
      );
    }

    const cleanupSteps: Array<{ table: string; run: () => Promise<{ error: unknown | null }> }> = [
      {
        table: "favorites",
        run: async () => {
          const { error } = await supabaseAdmin.from("favorites").delete().eq("user_id", userId);
          return { error };
        },
      },
      {
        table: "messages",
        run: async () => {
          const { error: buyerError } = await supabaseAdmin
            .from("messages")
            .delete()
            .eq("buyer_user_id", userId);
          if (buyerError) return { error: buyerError };

          const { error: sellerError } = await supabaseAdmin
            .from("messages")
            .delete()
            .eq("seller_user_id", userId);
          return { error: sellerError };
        },
      },
      {
        table: "listings",
        run: async () => {
          const { data: sellerListings, error: listingsSelectError } = await supabaseAdmin
            .from("listings")
            .select("id")
            .eq("seller_id", userId);

          if (listingsSelectError) return { error: listingsSelectError };

          const listingIds = (sellerListings ?? []).map((row) => row.id).filter(Boolean);
          if (listingIds.length === 0) return { error: null };

          const { data: orderRows, error: orderListingsError } = await supabaseAdmin
            .from("orders")
            .select("listing_id")
            .in("listing_id", listingIds);

          if (orderListingsError) return { error: orderListingsError };

          const protectedListingIds = new Set(
            (orderRows ?? []).map((row) => row.listing_id).filter(Boolean)
          );
          const deletableListingIds = listingIds.filter((id) => !protectedListingIds.has(id));

          if (deletableListingIds.length > 0) {
            const { error: deleteListingsError } = await supabaseAdmin
              .from("listings")
              .delete()
              .in("id", deletableListingIds);

            if (deleteListingsError) return { error: deleteListingsError };
          }

          if (protectedListingIds.size > 0) {
            const { error: hideListingsError } = await supabaseAdmin
              .from("listings")
              .update({ status: "hidden" })
              .in("id", Array.from(protectedListingIds));

            if (hideListingsError) return { error: hideListingsError };
          }

          return { error: null };
        },
      },
      {
        table: "profiles",
        run: async () => {
          const { error: byUserIdError } = await supabaseAdmin
            .from("profiles")
            .delete()
            .eq("user_id", userId);

          if (!byUserIdError) return { error: null };

          const { error: byIdError } = await supabaseAdmin
            .from("profiles")
            .delete()
            .eq("id", userId);

          return { error: byIdError };
        },
      },
    ];

    for (const step of cleanupSteps) {
      const { error } = await step.run();
      if (error) {
        const message = error instanceof Object && "message" in error ? String((error as { message: string }).message) : String(error);
        console.error(`Delete account: cleanup failed on ${step.table}`, error);

        if (message.includes("does not exist") || message.includes("Could not find the table")) {
          continue;
        }

        return NextResponse.json(
          {
            error:
              "We couldn't remove all account data. Please contact support@thriftshopper.com and we'll help you finish deleting your account.",
          },
          { status: 500 }
        );
      }
    }

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error("Delete account: auth.admin.deleteUser failed", deleteAuthError);
      return NextResponse.json(
        {
          error:
            "Your profile data was removed, but we couldn't finish closing your login. Please contact support@thriftshopper.com.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account: unexpected error", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again or contact support@thriftshopper.com." },
      { status: 500 }
    );
  }
}
