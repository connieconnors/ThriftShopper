import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ sellerId: string }> };

/** Public seller track record for Quick View (sold count + member since). */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { sellerId } = await context.params;
    if (!sellerId) {
      return NextResponse.json({ error: "sellerId required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const [{ count, error: countError }, { data: profile, error: profileError }] =
      await Promise.all([
        admin
          .from("listings")
          .select("id", { count: "exact", head: true })
          .eq("seller_id", sellerId)
          .eq("status", "sold"),
        admin
          .from("profiles")
          .select("created_at")
          .eq("user_id", sellerId)
          .maybeSingle(),
      ]);

    if (countError) {
      console.error("Seller stats count error:", countError);
    }
    if (profileError) {
      console.error("Seller stats profile error:", profileError);
    }

    const createdAt = profile?.created_at ?? null;
    const sellingSinceYear = createdAt
      ? new Date(createdAt).getFullYear()
      : null;

    return NextResponse.json({
      soldCount: countError ? null : count ?? 0,
      sellingSinceYear: Number.isFinite(sellingSinceYear) ? sellingSinceYear : null,
    });
  } catch (error) {
    console.error("Seller stats error:", error);
    return NextResponse.json({ error: "Failed to load seller stats" }, { status: 500 });
  }
}
