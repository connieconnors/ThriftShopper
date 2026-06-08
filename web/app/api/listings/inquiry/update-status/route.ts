import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

const VALID = ["pending", "reserved", "sold", "cancelled"] as const;

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { inquiryId, status } = await request.json();
    if (!inquiryId || !status || !VALID.includes(status)) {
      return NextResponse.json(
        { error: "inquiryId and valid status required" },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    const { data: inquiry, error: fetchError } = await admin
      .from("listing_inquiries")
      .select("*")
      .eq("id", inquiryId)
      .single();

    if (fetchError || !inquiry) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    if (inquiry.seller_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: updated, error: updateError } = await admin
      .from("listing_inquiries")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inquiryId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update inquiry" },
        { status: 500 }
      );
    }

    if (status === "sold") {
      await admin
        .from("listings")
        .update({
          status: "sold",
          sold_at: new Date().toISOString(),
          buyer_id: inquiry.buyer_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", inquiry.listing_id)
        .eq("seller_id", user.id);
    }

    return NextResponse.json({ success: true, inquiry: updated });
  } catch (error) {
    console.error("Update inquiry error:", error);
    return NextResponse.json(
      { error: "Failed to update inquiry" },
      { status: 500 }
    );
  }
}
