import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

async function getCurrentUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  let token = authHeader?.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;
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
  if (!token) return null;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function PATCH(request: NextRequest) {
  const userId = await getCurrentUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { messageIds } = body;
  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    return NextResponse.json({ error: "messageIds array required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("seller_user_id", userId)
    .in("id", messageIds);

  if (error) {
    console.error("Mark read error:", error);
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
