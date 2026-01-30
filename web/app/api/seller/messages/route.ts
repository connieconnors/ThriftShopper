import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

function getAuthToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.replace("Bearer ", "");
  return null;
}

async function getAuthTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) {
    if (!cookie.name.includes("supabase") && !cookie.name.includes("auth")) continue;
    try {
      const parsed = JSON.parse(cookie.value);
      if (parsed.access_token) return parsed.access_token;
    } catch {
      if (cookie.value.startsWith("eyJ")) return cookie.value;
    }
  }
  return null;
}

async function getCurrentUserId(request: Request): Promise<string | null> {
  let token = getAuthToken(request);
  if (!token) token = await getAuthTokenFromCookies();
  if (!token) {
    console.log("[seller/messages] No auth token in header or cookies");
    return null;
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error("[seller/messages] Auth error:", authError.message);
    return null;
  }
  if (!user?.id) {
    console.log("[seller/messages] No user from getUser()");
    return null;
  }
  console.log("[seller/messages] Authenticated user:", user.id);
  return user.id;
}

export async function GET(request: Request) {
  const userId = await getCurrentUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Try with read_at first; if column doesn't exist (42703), query without it
    const columnsWithReadAt = "id, listing_id, buyer_user_id, buyer_email, subject, message_body, created_at, read_at";
    const columnsWithoutReadAt = "id, listing_id, buyer_user_id, buyer_email, subject, message_body, created_at";

    let list: Array<Record<string, unknown> & { listing_id: string; buyer_user_id: string; read_at?: string | null }>;
    let hasReadAt = true;

    const { data: messages, error } = await supabase
      .from("messages")
      .select(columnsWithReadAt)
      .eq("seller_user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "42703" && error.message?.includes("read_at")) {
        console.log("[seller/messages] read_at column missing, querying without it");
        hasReadAt = false;
        const { data: messagesFallback, error: err2 } = await supabase
          .from("messages")
          .select(columnsWithoutReadAt)
          .eq("seller_user_id", userId)
          .order("created_at", { ascending: false });
        if (err2) {
          console.error("[seller/messages] Fallback fetch error:", err2);
          return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
        }
        list = (messagesFallback ?? []).map((m) => ({ ...m, read_at: null }));
      } else {
        console.error("[seller/messages] Messages fetch error:", error.code, error.message);
        return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
      }
    } else {
      list = messages ?? [];
    }

    console.log("[seller/messages] Fetched", list.length, "messages for seller", userId);

    const listingIds = [...new Set(list.map((m) => m.listing_id).filter(Boolean))];
    const buyerIds = [...new Set(list.map((m) => m.buyer_user_id).filter(Boolean))];

    let listings: { id: string; title: string }[] = [];
    if (listingIds.length > 0) {
      const { data: listData, error: listError } = await supabase
        .from("listings")
        .select("id, title")
        .in("id", listingIds);
      if (listError) {
        console.error("[seller/messages] Listings fetch error:", listError);
        return NextResponse.json({ error: "Failed to load listing details" }, { status: 500 });
      }
      listings = listData ?? [];
      console.log("[seller/messages] Joined", listings.length, "listings");
    }

    let profiles: { user_id: string; display_name: string | null }[] = [];
    if (buyerIds.length > 0) {
      const { data: profData, error: profError } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", buyerIds);
      if (profError) {
        console.error("[seller/messages] Profiles fetch error:", profError);
        return NextResponse.json({ error: "Failed to load buyer details" }, { status: 500 });
      }
      profiles = profData ?? [];
      console.log("[seller/messages] Joined", profiles.length, "profiles");
    }

    const listingMap = Object.fromEntries(listings.map((l) => [l.id, l.title]));
    const profileMap = Object.fromEntries(profiles.map((p) => [p.user_id, p.display_name ?? "A buyer"]));

    const enriched = list.map((m) => ({
      ...m,
      listing_title: listingMap[m.listing_id] ?? "Listing",
      buyer_display_name: profileMap[m.buyer_user_id] ?? "A buyer",
    }));

    const unreadCount = hasReadAt
      ? list.filter((m) => !m.read_at).length
      : 0;

    console.log("[seller/messages] Returning", enriched.length, "messages, unreadCount:", unreadCount);
    return NextResponse.json({ messages: enriched, unreadCount });
  } catch (err) {
    console.error("[seller/messages] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
