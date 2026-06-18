/**
 * Pre-publish content moderation via Anthropic (text + primary listing image).
 * Called before a listing goes live to satisfy UGC safety requirements.
 */

export type ModerationListingInput = {
  title?: string | null;
  description?: string | null;
  story_text?: string | null;
  category?: string | null;
  imageUrl?: string | null;
};

export const CONTENT_MODERATION_REJECTED = "CONTENT_MODERATION_REJECTED";
export const CONTENT_MODERATION_PENDING_REVIEW =
  "CONTENT_MODERATION_PENDING_REVIEW";

export const MODERATION_PENDING_REVIEW_MESSAGE =
  "Your listing is pending content review and is not visible in the marketplace yet. If you have questions, contact support@thriftshopper.com";

export function formatModerationRejectionUserMessage(reason: string): string {
  return `We couldn't publish this listing. Reason: ${reason}. If you believe this is an error, contact support@thriftshopper.com`;
}

export type ModerationResult =
  | { approved: true }
  | { approved: false; reason: string; categories?: string[] };

const MODERATION_MODEL = "claude-3-5-haiku-20241022";

const PROHIBITED_SUMMARY = `
ThriftShopper is a vintage/thrift marketplace. Reject listings that violate our Prohibited Items Policy:
- Weapons: firearms, ammunition, explosives, fireworks
- Illegal goods: stolen property, drugs, drug paraphernalia, counterfeit documents
- Regulated: prescription medications, alcohol, tobacco, vape/nicotine
- Dangerous materials: hazardous chemicals, radioactive materials, recalled products
- Counterfeit luxury goods and trademark-infringing replicas
- Human remains or body parts
- Hate-group merchandise, extremist propaganda, material promoting violence or discrimination
- Explicit sexual content, nudity intended to arouse, or sexually exploitative material
- Scams, spam, or deceptive listings unrelated to legitimate secondhand goods

Allow normal vintage clothing, furniture, books, jewelry, collectibles, and typical thrift items.
Reject only when content clearly violates policy — do not reject ambiguous vintage items.
`.trim();

function buildModerationPrompt(listing: ModerationListingInput): string {
  const textParts = [
    listing.title && `Title: ${listing.title}`,
    listing.description && `Description: ${listing.description}`,
    listing.category && `Category: ${listing.category}`,
    listing.story_text && `Story: ${listing.story_text}`,
  ].filter(Boolean);

  return `${PROHIBITED_SUMMARY}

Review this listing before it is published. Check the title, description, story (if any), and product photo.

${textParts.length > 0 ? textParts.join("\n\n") : "No text fields provided."}

Respond with JSON only, no markdown:
{"approved": true}
or
{"approved": false, "reason": "Brief seller-facing explanation", "categories": ["category1"]}

Use categories like: weapons, drugs, regulated, counterfeit, hate, explicit, illegal, scam, other.
Keep reason under 200 characters and helpful for the seller.`;
}

async function fetchImageAsBase64(
  imageUrl: string
): Promise<{ base64: string; mediaType: string } | null> {
  try {
    const response = await fetch(imageUrl, {
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      console.warn("Moderation: image fetch failed", response.status, imageUrl);
      return null;
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const mediaType = contentType.split(";")[0].trim();
    if (!mediaType.startsWith("image/")) {
      console.warn("Moderation: URL is not an image", mediaType);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > 5 * 1024 * 1024) {
      console.warn("Moderation: image too large for vision check");
      return null;
    }

    return { base64: buffer.toString("base64"), mediaType };
  } catch (error) {
    console.warn("Moderation: image fetch error", error);
    return null;
  }
}

function parseModerationResponse(text: string): ModerationResult {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Moderation response was not valid JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    approved?: boolean;
    reason?: string;
    categories?: string[];
  };

  if (parsed.approved === true) {
    return { approved: true };
  }

  if (parsed.approved === false) {
    return {
      approved: false,
      reason:
        parsed.reason?.trim() ||
        "This listing does not meet our marketplace guidelines. See our Prohibited Items Policy.",
      categories: parsed.categories,
    };
  }

  throw new Error("Moderation response missing approved field");
}

/**
 * Moderate listing content before publish. Throws on API/infrastructure errors.
 * When ANTHROPIC_API_KEY is missing, logs a warning and approves (dev fallback).
 */
export async function moderateListingForPublish(
  listing: ModerationListingInput
): Promise<ModerationResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Content review is temporarily unavailable");
    }
    console.warn(
      "⚠️ ANTHROPIC_API_KEY not set — skipping pre-publish moderation (dev only)"
    );
    return { approved: true };
  }

  const prompt = buildModerationPrompt(listing);
  const messageContent: Array<
    | { type: "text"; text: string }
    | {
        type: "image";
        source: { type: "base64"; media_type: string; data: string };
      }
  > = [{ type: "text", text: prompt }];

  if (listing.imageUrl) {
    const imageData = await fetchImageAsBase64(listing.imageUrl);
    if (imageData) {
      messageContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: imageData.mediaType,
          data: imageData.base64,
        },
      });
    }
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODERATION_MODEL,
      max_tokens: 512,
      messages: [{ role: "user", content: messageContent }],
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error("Moderation API error:", response.status, errorText);
    throw new Error(
      response.status >= 500
        ? "Content review is temporarily unavailable. Please try again shortly."
        : "Content review failed. Please try again."
    );
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  const responseText = data.content
    ?.filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("\n")
    .trim();

  if (!responseText) {
    throw new Error("Empty moderation response");
  }

  return parseModerationResponse(responseText);
}
