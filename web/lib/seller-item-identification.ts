/**
 * GoShed-style single-answer item identification for ThriftShopper seller upload.
 * Uses Claude Opus 4.5 — one confident identification, not multi-hypothesis hedging.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
export const SELLER_IDENTIFICATION_MODEL = 'claude-opus-4-5';

const VALID_CATEGORIES = [
  'Kitchen & Dining',
  'Home Decor',
  'Collectibles',
  'Books & Media',
  'Furniture',
  'Art',
  'Electronics',
  'Fashion',
  'Jewelry',
  'Toys & Games',
  'Sports & Outdoors',
  'General',
] as const;

export type SellerItemIdentification = {
  item_label: string;
  likely_brand_or_maker: string | null;
  likely_era_or_style: string | null;
  materials: string | null;
  distinguishing_details: string;
  condition_observations: string | null;
  marketplace_title: string;
  marketplace_description: string;
  category: string;
  suggested_keywords: string[];
  confidence: 'high' | 'medium' | 'low';
  uncertainty_notes: string | null;
};

export type IdentificationEnrichment = {
  title: string;
  description: string;
  category: string;
  attributes: string[];
  estimatedPrice: number | null;
  styles?: string[];
  moods?: string[];
  intents?: string[];
  era?: string;
  rawIdentification: SellerItemIdentification;
};

const IDENTIFICATION_SYSTEM_PROMPT = `You are an expert at identifying household, vintage, and collectible items for the ThriftShopper resale marketplace. Analyze the image and respond with a valid JSON object only (no markdown, no extra text).

Your job is to answer confidently: "What is this item?" Name specific makes, models, eras, and brands when visible evidence supports them (logos, decals, distinctive silhouettes, maker marks). Prefer specific labels like "Vintage Ford Thunderbird die-cast model car with Texaco Fire Chief Gasoline decals" over generic labels like "model convertible car."

Describe only what is clearly visible in the in-focus item. Do not guess about partially obscured items in stacks. If brand or maker is uncertain, name the closest identifiable type and note uncertainty in uncertainty_notes rather than inventing a brand.

Required JSON keys:
- item_label: short, specific label for the main item (e.g. "Vintage Ford Thunderbird die-cast model car")
- likely_brand_or_maker: brand or manufacturer if visible on the item or packaging, else null
- likely_era_or_style: era or style period if apparent (e.g. "1950s", "mid-century"), else null
- materials: materials if clearly visible (e.g. "die-cast metal"), else null
- distinguishing_details: visible details that identify this item (decals, markings, color, features)
- condition_observations: only if wear or damage is clearly visible, else null
- marketplace_title: buyer-friendly listing title, max 80 characters; include brand, model, and era when known
- marketplace_description: 1-2 sentences for buyers; mention brand, era, and distinguishing features when visible; warm, practical tone
- category: exactly one of: Kitchen & Dining, Home Decor, Collectibles, Books & Media, Furniture, Art, Electronics, Fashion, Jewelry, Toys & Games, Sports & Outdoors, General
- suggested_keywords: 4-8 plain-language discovery keywords buyers might search (e.g. die-cast, Thunderbird, Texaco, Fire Chief, collectible)
- confidence: exactly one of "high", "medium", or "low"
- uncertainty_notes: only if confidence is not high — brief note on what would help confirm; otherwise null`;

function detectMediaType(buf: Buffer): string {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.length >= 12 && buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return 'image/webp';
  if (buf.length >= 6 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';
  return 'image/jpeg';
}

function getImageDimensions(buf: Buffer): { width: number; height: number } | null {
  if (buf.length >= 24 && buf[0] === 0x89 && buf[1] === 0x50) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buf[i + 1];
      if (marker >= 0xc0 && marker <= 0xc3) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      const len = buf.readUInt16BE(i + 2);
      if (len < 2) break;
      i += 2 + len;
    }
  }
  return null;
}

async function fetchImageAsBase64(imageUrl: string): Promise<{
  base64: string;
  mediaType: string;
  byteSize: number;
  dimensions: { width: number; height: number } | null;
}> {
  const imageResponse = await fetch(imageUrl, { signal: AbortSignal.timeout(30_000) });
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  const byteSize = imageBuffer.byteLength;
  if (byteSize > 4_500_000) {
    throw new Error(`Image too large for identification: ${Math.round(byteSize / 1024)}KB (max ~4.5MB)`);
  }

  const buf = Buffer.from(imageBuffer);
  const base64 = buf.toString('base64');
  const contentType = imageResponse.headers.get('content-type');
  const mediaType =
    contentType && contentType.startsWith('image/') ? contentType.split(';')[0]!.trim() : detectMediaType(buf);

  return {
    base64,
    mediaType,
    byteSize,
    dimensions: getImageDimensions(buf),
  };
}

function parseIdentificationJson(rawText: string): SellerItemIdentification {
  let content = rawText.trim();
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    content = content.substring(firstBrace, lastBrace + 1);
  }
  content = content.replace(/,(\s*[}\]])/g, '$1');

  const parsed = JSON.parse(content) as Record<string, unknown>;
  const required = [
    'item_label',
    'marketplace_title',
    'marketplace_description',
    'category',
    'distinguishing_details',
    'confidence',
  ];
  for (const key of required) {
    if (!(key in parsed)) {
      throw new Error(`Missing required field: ${key}`);
    }
  }

  const confidence = String(parsed.confidence).toLowerCase();
  if (!['high', 'medium', 'low'].includes(confidence)) {
    throw new Error(`Invalid confidence: ${parsed.confidence}`);
  }

  let category = String(parsed.category).trim();
  if (!VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])) {
    category = 'General';
  }

  const keywords = Array.isArray(parsed.suggested_keywords)
    ? parsed.suggested_keywords.map((k) => String(k).trim()).filter(Boolean)
    : [];

  const nullableString = (v: unknown): string | null => {
    if (v == null || v === '') return null;
    return String(v).trim() || null;
  };

  return {
    item_label: String(parsed.item_label).trim(),
    likely_brand_or_maker: nullableString(parsed.likely_brand_or_maker),
    likely_era_or_style: nullableString(parsed.likely_era_or_style),
    materials: nullableString(parsed.materials),
    distinguishing_details: String(parsed.distinguishing_details).trim(),
    condition_observations: nullableString(parsed.condition_observations),
    marketplace_title: String(parsed.marketplace_title).trim().slice(0, 80),
    marketplace_description: String(parsed.marketplace_description).trim(),
    category,
    suggested_keywords: keywords,
    confidence: confidence as SellerItemIdentification['confidence'],
    uncertainty_notes: nullableString(parsed.uncertainty_notes),
  };
}

export function mapIdentificationToEnrichment(
  identification: SellerItemIdentification
): IdentificationEnrichment {
  const attributes = [...identification.suggested_keywords];
  if (identification.likely_brand_or_maker) {
    attributes.unshift(identification.likely_brand_or_maker);
  }

  const styles: string[] = [];
  if (identification.likely_era_or_style) {
    styles.push(identification.likely_era_or_style);
  }
  const labelLower = identification.item_label.toLowerCase();
  if (labelLower.includes('vintage') && !styles.some((s) => s.toLowerCase().includes('vintage'))) {
    styles.push('vintage');
  }
  if (labelLower.includes('antique') && !styles.some((s) => s.toLowerCase().includes('antique'))) {
    styles.push('antique');
  }

  const title =
    identification.marketplace_title ||
    identification.item_label ||
    'New Listing';

  let description = identification.marketplace_description;
  if (identification.uncertainty_notes && identification.confidence !== 'high') {
    description = `${description} ${identification.uncertainty_notes}`.trim();
  }

  return {
    title,
    description,
    category: identification.category,
    attributes: [...new Set(attributes.map((a) => a.trim()).filter(Boolean))],
    estimatedPrice: null,
    styles,
    moods: [],
    intents: [],
    era: identification.likely_era_or_style ?? undefined,
    rawIdentification: identification,
  };
}

export async function identifySellerItem(imageUrl: string): Promise<IdentificationEnrichment> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const { base64, mediaType, byteSize, dimensions } = await fetchImageAsBase64(imageUrl);

  console.log('[seller-upload:identify] image prepared for AI', {
    imageUrl,
    byteSize,
    byteSizeKb: Math.round(byteSize / 1024),
    dimensions,
    mediaType,
    model: SELLER_IDENTIFICATION_MODEL,
  });

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-url-access': 'false',
    },
    body: JSON.stringify({
      model: SELLER_IDENTIFICATION_MODEL,
      max_tokens: 1536,
      system: IDENTIFICATION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: 'Identify this item for a ThriftShopper listing. Return the JSON object as specified.',
            },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('[seller-upload:identify] Anthropic API error:', response.status, errText.slice(0, 500));
    throw new Error(`Identification API failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const rawText = data.content?.find((b) => b.type === 'text')?.text?.trim() ?? '';
  if (!rawText) {
    throw new Error('Identification API returned empty response');
  }

  const identification = parseIdentificationJson(rawText);
  const enrichment = mapIdentificationToEnrichment(identification);

  console.log('[seller-upload:identify] Opus result', {
    imageUrl,
    model: SELLER_IDENTIFICATION_MODEL,
    rawOpusIdentification: identification,
    mappedListing: {
      title: enrichment.title,
      description: enrichment.description,
      category: enrichment.category,
      attributes: enrichment.attributes,
      styles: enrichment.styles,
    },
    fallbackUsed: false,
  });

  return enrichment;
}
