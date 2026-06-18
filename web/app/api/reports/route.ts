import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getCurrentUserId, getServiceSupabase } from "@/lib/serverAuth";
import { REPORT_REASONS } from "@/lib/moderation";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const listingId = typeof body.listingId === "string" ? body.listingId : null;
    const reportedUserId =
      typeof body.reportedUserId === "string" ? body.reportedUserId : null;
    const reason = typeof body.reason === "string" ? body.reason : "";
    const details =
      typeof body.details === "string" ? body.details.trim() || null : null;

    if (!reportedUserId) {
      return NextResponse.json({ error: "reportedUserId is required" }, { status: 400 });
    }

    if (!REPORT_REASONS.includes(reason as (typeof REPORT_REASONS)[number])) {
      return NextResponse.json({ error: "Invalid report reason" }, { status: 400 });
    }

    if (reportedUserId === userId) {
      return NextResponse.json({ error: "Cannot report yourself" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const { data: report, error: insertError } = await supabase
      .from("reports")
      .insert({
        reporter_id: userId,
        listing_id: listingId,
        reported_user_id: reportedUserId,
        reason,
        details,
        status: "pending",
      })
      .select("id, created_at")
      .single();

    if (insertError) {
      console.error("[reports] insert error:", insertError);
      return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
    }

    if (resend) {
      const { data: reporter } = await supabase
        .from("profiles")
        .select("email, display_name")
        .eq("user_id", userId)
        .maybeSingle();

      try {
        await resend.emails.send({
          from: "ThriftShopper <noreply@thriftshopper.com>",
          to: "support@thriftshopper.com",
          subject: `[Report] ${reason} — listing ${listingId ?? "n/a"}`,
          text: [
            "New user report (review within 24 hours)",
            "",
            `Report ID: ${report.id}`,
            `Reason: ${reason}`,
            `Listing ID: ${listingId ?? "—"}`,
            `Reported user ID: ${reportedUserId}`,
            `Reporter: ${reporter?.display_name ?? userId} (${reporter?.email ?? "unknown"})`,
            details ? `Details: ${details}` : "",
            "",
            `Submitted: ${report.created_at}`,
          ]
            .filter(Boolean)
            .join("\n"),
        });
      } catch (emailErr) {
        console.error("[reports] notify email failed:", emailErr);
      }
    }

    return NextResponse.json({ ok: true, reportId: report.id });
  } catch (err) {
    console.error("[reports] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
