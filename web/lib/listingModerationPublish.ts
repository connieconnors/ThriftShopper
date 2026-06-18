import type { SupabaseClient } from "@supabase/supabase-js";
import {
  moderateListingForPublish,
  type ModerationListingInput,
  CONTENT_MODERATION_REJECTED,
  CONTENT_MODERATION_PENDING_REVIEW,
  formatModerationRejectionUserMessage,
  MODERATION_PENDING_REVIEW_MESSAGE,
} from "./contentModeration";

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
