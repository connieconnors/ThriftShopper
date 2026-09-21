import type { SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import {
  moderateListingForPublish,
  ModerationApiError,
  type ModerationListingInput,
  CONTENT_MODERATION_REJECTED,
  CONTENT_MODERATION_PENDING_REVIEW,
  formatModerationRejectionUserMessage,
  MODERATION_PENDING_REVIEW_MESSAGE,
} from "./contentModeration";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const MODERATION_ALERT_EMAIL_TIMEOUT_MS = 5_000;

/** Safe for ops email: only Error.message / string; never raw API bodies or headers. */
function formatModerationAlertErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown error";

  const redacted = raw
    .replace(/sk-[A-Za-z0-9_-]+/g, "[REDACTED]")
    .replace(/x-api-key:\s*\S+/gi, "x-api-key: [REDACTED]")
    .replace(/authorization:\s*\S+/gi, "authorization: [REDACTED]")
    .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]")
    .replace(/"type"\s*:\s*"error"[\s\S]*/gi, "[REDACTED API response]")
    .trim();

  return redacted.slice(0, 500) || "Unknown error";
}

function formatAnthropicFailureDetails(error: unknown): {
  httpStatus: string;
  errorType: string;
} {
  if (error instanceof ModerationApiError) {
    return {
      httpStatus: String(error.httpStatus),
      errorType: error.anthropicErrorType ?? "not present",
    };
  }
  return {
    httpStatus: "no HTTP response",
    errorType: "no HTTP response",
  };
}

async function notifyModerationFailureAlert(
  listingId: string,
  error: unknown
): Promise<void> {
  if (!resend) return;

  const { httpStatus, errorType } = formatAnthropicFailureDetails(error);

  const sendPromise = resend.emails.send({
    from: "ThriftShopper <noreply@thriftshopper.com>",
    to: "support@thriftshopper.com",
    subject: `[Moderation] Listing pending review — ${listingId}`,
    text: [
      "Pre-publish content moderation failed. Listing was set to pending_review.",
      "",
      `Listing ID: ${listingId}`,
      `HTTP status: ${httpStatus}`,
      `Anthropic error type: ${errorType}`,
      `Error: ${formatModerationAlertErrorMessage(error)}`,
      "",
      `Time: ${new Date().toISOString()}`,
    ].join("\n"),
  });

  await Promise.race([
    sendPromise,
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("Moderation alert email timed out")),
        MODERATION_ALERT_EMAIL_TIMEOUT_MS
      );
    }),
  ]);
}

export { CONTENT_MODERATION_REJECTED, CONTENT_MODERATION_PENDING_REVIEW };

export type ModerationPublishResult =
  | { outcome: "approved" }
  | {
      outcome: "rejected";
      status: 422 | 500;
      body: {
        error: string;
        code: typeof CONTENT_MODERATION_REJECTED;
        categories?: string[];
      };
    }
  | {
      outcome: "pending_review";
      status: 409;
      body: {
        success: false;
        error: string;
        code: typeof CONTENT_MODERATION_PENDING_REVIEW;
      };
    };

async function setListingStatus(
  supabase: SupabaseClient,
  listingId: string,
  sellerId: string,
  status: string
): Promise<string | null> {
  const { error } = await supabase
    .from("listings")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .eq("seller_id", sellerId);

  if (error) {
    console.error(`Failed to set listing status to ${status}:`, error);
    return error.message;
  }
  return null;
}

/**
 * Run pre-publish moderation and persist rejected / pending_review statuses.
 * Returns approved when the listing may proceed to active.
 */
export async function runPrePublishModeration(
  supabase: SupabaseClient,
  listingId: string,
  sellerId: string,
  listing: ModerationListingInput
): Promise<ModerationPublishResult> {
  let moderationResult;
  try {
    moderationResult = await moderateListingForPublish(listing);
  } catch (moderationError) {
    console.error("Pre-publish moderation failed:", moderationError);
    const dbError = await setListingStatus(
      supabase,
      listingId,
      sellerId,
      "pending_review"
    );
    try {
      await notifyModerationFailureAlert(listingId, moderationError);
    } catch (emailErr) {
      console.error("[moderation] alert email failed:", emailErr);
    }
    if (dbError) {
      return {
        outcome: "pending_review",
        status: 409,
        body: {
          success: false,
          error: `Content review is temporarily unavailable. Please try again. (${dbError})`,
          code: CONTENT_MODERATION_PENDING_REVIEW,
        },
      };
    }
    return {
      outcome: "pending_review",
      status: 409,
      body: {
        success: false,
        error: MODERATION_PENDING_REVIEW_MESSAGE,
        code: CONTENT_MODERATION_PENDING_REVIEW,
      },
    };
  }

  if (!moderationResult.approved) {
    console.warn("Listing rejected by moderation:", {
      listingId,
      reason: moderationResult.reason,
      categories: moderationResult.categories,
    });

    const userMessage = formatModerationRejectionUserMessage(
      moderationResult.reason
    );
    const dbError = await setListingStatus(
      supabase,
      listingId,
      sellerId,
      "rejected"
    );
    if (dbError) {
      return {
        outcome: "rejected",
        status: 500,
        body: {
          error: `Could not save rejection status: ${dbError}`,
          code: CONTENT_MODERATION_REJECTED,
          categories: moderationResult.categories,
        },
      };
    }

    return {
      outcome: "rejected",
      status: 422,
      body: {
        error: userMessage,
        code: CONTENT_MODERATION_REJECTED,
        categories: moderationResult.categories,
      },
    };
  }

  return { outcome: "approved" };
}
