import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

async function getCurrentUserId(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  let token: string | null = authHeader?.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;
  if (!token) {
    const cookieStore = await cookies();
    for (const cookie of cookieStore.getAll()) {
      if (cookie.name.includes("supabase") || cookie.name.includes("auth")) {
        try {
          const parsed = JSON.parse(cookie.value);
          if (parsed.access_token) {
            token = parsed.access_token;
            break;
          }
        } catch {
          if (cookie.value.startsWith("eyJ")) {
            token = cookie.value;
            break;
          }
        }
      }
    }
  }
  if (!token) {
    console.log("[seller/unread-count] No auth token");
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
    console.error("[seller/unread-count] Auth error:", authError.message);
    return null;
  }
  if (!user?.id) {
    console.log("[seller/unread-count] No user from getUser()");
    return null;
  }
  console.log("[seller/unread-count] Authenticated user:", user.id);
  return user.id;
}

export async function GET(request: Request) {
  const userId = await getCurrentUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("seller_user_id", userId)
    .is("read_at", null);

  if (error) {
    if (error.code === "42703" && error.message?.includes("read_at")) {
      console.log("[seller/unread-count] read_at column missing, returning 0");
      return NextResponse.json({ unreadCount: 0 });
    }
    console.error("[seller/unread-count] Query error:", error.code, error.message);
    return NextResponse.json({ error: "Failed to get unread count" }, { status: 500 });
  }

  const unreadCount = count ?? 0;
  console.log("[seller/unread-count] Unread count:", unreadCount);
  return NextResponse.json({ unreadCount });
}
