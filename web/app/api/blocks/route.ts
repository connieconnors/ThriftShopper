import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getCurrentUserId, getServiceSupabase } from "@/lib/serverAuth";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function GET(request: Request) {
  const userId = await getCurrentUserId(request);
  if (!userId) {
    return NextResponse.json({ blockedUserIds: [] });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("user_blocks")
    .select("blocked_user_id")
    .eq("blocker_id", userId);

  if (error) {
    return NextResponse.json({ error: "Failed to load blocks" }, { status: 500 });
  }

  return NextResponse.json({
    blockedUserIds: (data ?? []).map((row) => row.blocked_user_id),
  });
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const blockedUserId =
      typeof body.blockedUserId === "string" ? body.blockedUserId : null;
    const sourceListingId =
      typeof body.sourceListingId === "string" ? body.sourceListingId : null;
    const reportReason =
      typeof body.reportReason === "string" ? body.reportReason : "Blocked by user";

    if (!blockedUserId) {
      return NextResponse.json({ error: "blockedUserId is required" }, { status: 400 });
    }

    if (blockedUserId === userId) {
      return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const { error: blockError } = await supabase.from("user_blocks").upsert(
      {
        blocker_id: userId,
        blocked_user_id: blockedUserId,
        source_listing_id: sourceListingId,
      },
      { onConflict: "blocker_id,blocked_user_id" }
    );

    if (blockError) {
      console.error("[blocks] insert error:", blockError);
      return NextResponse.json({ error: "Failed to block user" }, { status: 500 });
    }

    await supabase.from("reports").insert({
      reporter_id: userId,
      listing_id: sourceListingId,
      reported_user_id: blockedUserId,
      reason: "Inappropriate content",
      details: `User blocked this seller. Context: ${reportReason}`,
      status: "pending",
    });

    if (resend) {
      const { data: blocker } = await supabase
        .from("profiles")
        .select("email, display_name")
        .eq("user_id", userId)
        .maybeSingle();

      try {
        await resend.emails.send({
          from: "ThriftShopper <noreply@thriftshopper.com>",
          to: "support@thriftshopper.com",
          subject: `[Block] User blocked seller ${blockedUserId}`,
          text: [
            "A user blocked another user (review within 24 hours if needed)",
            "",
            `Blocker: ${blocker?.display_name ?? userId} (${blocker?.email ?? "unknown"})`,
            `Blocked user ID: ${blockedUserId}`,
            `Source listing: ${sourceListingId ?? "—"}`,
          ].join("\n"),
        });
      } catch (emailErr) {
        console.error("[blocks] notify email failed:", emailErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[blocks] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
