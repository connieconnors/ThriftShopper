// web/lib/semantic-search.ts
/**
 * Voice Search for ThriftShopper
 * Extracts search terms and matches them across all discoverable fields
 */

import { supabase } from './supabase';
import type { Listing } from './types';
import { normalizeTagColumn } from './utils/tagNormalizer';

export type TermGroup = {
  term: string;
  variants: string[];
};

type TermSource = 'openai' | 'local' | 'vision';

interface SemanticSearchInterpretation {
  originalQuery: string;
  termGroups: TermGroup[];
  source: TermSource;
}

interface SemanticSearchDebug {
  columnsSearched: string[];
  termMatchCounts: Record<string, number>;
  minMatchesRequired: number;
  totalListingsScanned: number;
  directMatches: number;
}

interface SemanticSearchResult {
  listings: Listing[];
  interpretation?: SemanticSearchInterpretation;
  debug?: SemanticSearchDebug;
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'with', 'without', 'for', 'to', 'of', 'in', 'on',
  'at', 'by', 'from', 'near', 'around', 'like', 'want', 'looking', 'searching', 'find',
  'me', 'my', 'we', 'our', 'your', 'you', 'i', 'im', 'its', 'it', 'this', 'that', 'these',
  'those', 'please', 'just', 'really', 'very', 'maybe', 'something', 'anything'
]);

const OPTIONAL_STYLE_TERMS = new Set([
  'ceramic',
  'glass',
  'brass',
  'wood',
  'metal',
  'steel',
  'iron',
  'porcelain',
  'crystal',
  // Colors
  'red',
  'blue',
  'green',
  'yellow',
  'pink',
  'black',
  'white',
  'gold',
  'silver',
  'copper',
  'bronze',
  'purple',
  'orange',
  'teal',
  'burgundy',
  'navy',
  'cream',
  'beige',
  'brown',
  'gray',
  'grey',
  // Patterns
  'floral',
  'geometric',
  'striped',
  'polka-dot',
  'paisley',
  'plaid',
  'checkered',
  'abstract',
  // Conditions/eras
  'vintage',
  'antique',
  'retro',
  'modern',
  'contemporary',
  'new',
  'pristine',
  'excellent',
  'good',
]);

const SYNONYM_MAP: Record<string, string> = {
  // Existing whimsical/vintage synonyms
  funky: 'whimsical',
  playful: 'whimsical',
  quirky: 'whimsical',
  cute: 'whimsical',
  magical: 'whimsical',
  antique: 'vintage',
  retro: 'vintage',
  classic: 'vintage',
  nostalgic: 'vintage',
  midcentury: 'mid-century',
  midcenturymodern: 'mid-century',
  mid: 'mid',
  deco: 'art-deco',
  // JEWELRY & ACCESSORIES
  necklace: 'jewelry',
  bracelet: 'jewelry',
  earrings: 'jewelry',
  ring: 'jewelry',
  brooch: 'jewelry',
  pendant: 'jewelry',
  pearls: 'jewelry',
  gemstone: 'jewelry',
  handbag: 'accessory',
  purse: 'accessory',
  bag: 'accessory',
  accessory: 'accessory',
  accessories: 'accessory',
  // FAUX/COSTUME -> JEWELRY
  faux: 'jewelry',
  costume: 'jewelry',
  pearl: 'jewelry',
  // KITCHEN & DINING
  glassware: 'kitchen',
  drinkware: 'kitchen',
  serveware: 'kitchen',
  dinnerware: 'kitchen',
  cookware: 'kitchen',
  tableware: 'kitchen',
  utensils: 'kitchen',
  dishes: 'kitchen',
  plates: 'kitchen',
  bowls: 'kitchen',
  cups: 'kitchen',
  mugs: 'kitchen',
  // BEVERAGE -> KITCHEN
  coffee: 'kitchen',
  tea: 'kitchen',
  teapot: 'kitchen',
  coffeepot: 'kitchen',
  mug: 'kitchen',
  cup: 'kitchen',
  // HOME DECOR
  vase: 'decor',
  figurine: 'decor',
  sculpture: 'decor',
  ornament: 'decor',
  planter: 'decor',
  candle: 'decor',
  frame: 'decor',
  // COLLECTIBLES
  porcelain: 'collectible',
  ceramic: 'collectible',
  crystal: 'collectible',
};

/**
 * Main semantic search function
 * Takes a natural language query and returns relevant listings
 */
export async function semanticSearch(
  query: string,
  options: { limit?: number } = {}
): Promise<SemanticSearchResult> {
  const { limit = 24 } = options;
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return { listings: [], interpretation: undefined };
  }

  try {
    const { termGroups, source } = await extractSearchTerms(trimmedQuery);
    const normalizedTerms = normalizeTermGroups(termGroups);

    const { listings, debug } = await searchWithTerms(
      trimmedQuery,
      normalizedTerms,
      limit
    );

    return {
      listings,
      interpretation: {
        originalQuery: trimmedQuery,
        termGroups: normalizedTerms,
        source,
      },
      debug,
    };
  } catch (error) {
    console.error('Semantic search error:', error);
    const fallbackTerms = localExtractTerms(trimmedQuery);
    const normalizedTerms = normalizeTermGroups(fallbackTerms);
    const { listings, debug } = await searchWithTerms(
      trimmedQuery,
      normalizedTerms,
      limit
    );

    return {
      listings,
      interpretation: {
        originalQuery: trimmedQuery,
        termGroups: normalizedTerms,
        source: 'local',
      },
      debug,
    };
  }
}

export async function extractTermGroups(query: string): Promise<{
  termGroups: TermGroup[];
  source: TermSource;
}> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return { termGroups: [], source: 'local' };
  }

  try {
    const { termGroups, source } = await extractSearchTerms(trimmedQuery);
    return { termGroups: normalizeTermGroups(termGroups), source };
  } catch (error) {
    console.error('Term extraction error:', error);
    return { termGroups: normalizeTermGroups(localExtractTerms(trimmedQuery)), source: 'local' };
  }
}

export async function searchListingsByTerms(
  termGroups: TermGroup[],
  options: { limit?: number; sourceQuery?: string } = {}
): Promise<SemanticSearchResult> {
  const { limit = 24, sourceQuery = '' } = options;
  const normalizedTerms = normalizeTermGroups(termGroups);
  const { listings, debug } = await searchWithTerms(sourceQuery, normalizedTerms, limit);

  return {
    listings,
    interpretation: {
      originalQuery: sourceQuery,
      termGroups: normalizedTerms,
      source: 'vision',
    },
    debug,
  };
}

async function extractSearchTerms(query: string): Promise<{ termGroups: TermGroup[]; source: TermSource }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { termGroups: localExtractTerms(query), source: 'local' };
  }

  const prompt = `You are extracting buyer search terms for a secondhand marketplace.
Return a clean list of search term groups containing ONLY the words the user actually said.

Rules:
- Remove filler words, hedges, and conversational phrases.
- Extract only meaningful terms the user explicitly said.
- Do NOT infer additional terms or related concepts.
- Do NOT expand into categories or adjacent items.
- Do NOT add synonyms or variants beyond the literal words spoken/typed.
- Do NOT categorize by mood/style/intent or choose columns.

Examples:
- "kitchen" -> ["kitchen"]
- "whimsical vintage lamp" -> ["whimsical", "vintage", "lamp"]

Query: "${query}"

Return ONLY valid JSON:
{
  "terms": [
    { "term": "whimsical", "variants": [] },
    { "term": "vintage", "variants": [] }
  ]
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    console.error('OpenAI API error:', response.status, errorText);
    return { termGroups: localExtractTerms(query), source: 'local' };
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    return { termGroups: localExtractTerms(query), source: 'local' };
  }

  const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
    content.match(/(\{[\s\S]*\})/);

  if (!jsonMatch) {
    return { termGroups: localExtractTerms(query), source: 'local' };
  }

  const parsed = JSON.parse(jsonMatch[1]);
  const termGroups: TermGroup[] = Array.isArray(parsed?.terms)
    ? parsed.terms.map((term: TermGroup) => ({
        term: String(term.term || '').trim(),
        variants: Array.isArray(term.variants) ? term.variants.map((v) => String(v).trim()) : [],
      }))
    : [];

  if (process.env.NODE_ENV !== 'production') {
    termGroups.forEach((group) => {
      console.log('[termExtraction:openai]', {
        originalTerm: group.term,
        variants: group.variants,
      });
    });
  }

  if (termGroups.length === 0) {
    return { termGroups: localExtractTerms(query), source: 'local' };
  }

  return { termGroups, source: 'openai' };
}

function normalizeTermGroups(termGroups: TermGroup[]): TermGroup[] {
  const normalized: TermGroup[] = [];
  const seen = new Set<string>();

  termGroups.forEach((group) => {
    const base = normalizeTerm(group.term);
    if (!base) return;

    const variants = Array.from(
      new Set([
        base,
        ...group.variants.map((variant) => normalizeTerm(variant)).filter(Boolean),
      ])
    ).filter(Boolean);

    const normalizedBase = SYNONYM_MAP[base] || base;
    const finalBase = normalizeTerm(normalizedBase);
    if (!finalBase || seen.has(finalBase)) {
      if (!finalBase) return;
      if (seen.has(finalBase)) return;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[termNormalization]', {
        originalTerm: group.term,
        mappedTerm: normalizedBase,
        finalTerm: finalBase,
      });
    }

    normalized.push({
      term: finalBase,
      variants: Array.from(new Set([finalBase, ...variants])),
    });
    seen.add(finalBase);
  });

  return normalized;
}

function localExtractTerms(query: string): TermGroup[] {
  const normalized = normalizeText(query);
  const rawWords = normalized.split(' ').filter(Boolean);
  const termGroups = new Map<string, Set<string>>();

  rawWords.forEach((word) => {
    if (STOP_WORDS.has(word)) return;
    const canonical = SYNONYM_MAP[word] || word;
    if (!canonical) return;

    if (process.env.NODE_ENV !== 'production') {
      console.log('[termExtraction:local]', {
        originalTerm: word,
        mappedTerm: canonical,
        finalTerm: canonical,
      });
    }

    const existing = termGroups.get(canonical) || new Set<string>();
    existing.add(word);
    existing.add(canonical);
    termGroups.set(canonical, existing);
  });

  if (normalized.includes('party') && !termGroups.has('gift')) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[termExtraction:local]', {
        originalTerm: 'party',
        mappedTerm: 'gift',
        finalTerm: 'gift',
      });
    }
    termGroups.set('gift', new Set(['gift']));
  }

  return Array.from(termGroups.entries()).map(([term, variants]) => ({
    term,
    variants: Array.from(variants),
  }));
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTerm(value: string): string {
  const normalized = normalizeText(value);
  return normalized.length > 1 ? normalized : '';
}

type MatchResult = {
  matched: boolean;
  weight: number;
};

async function searchWithTerms(
  query: string,
  termGroups: TermGroup[],
  limit: number
): Promise<{ listings: Listing[]; debug: SemanticSearchDebug }> {
  const columnsSearched = [
    'moods',
    'styles',
    'intents',
    'title',
    'description',
    'story_text',
    'category',
    'ai_suggested_keywords',
    'keywords',
    'ai_generated_title',
    'ai_generated_description',
  ];

  if (termGroups.length === 0) {
    return {
      listings: [],
      debug: {
        columnsSearched,
        termMatchCounts: {},
        minMatchesRequired: 0,
        totalListingsScanned: 0,
        directMatches: 0,
      },
    };
  }

  const fetchLimit = Math.max(limit * 20, 200, 500);
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      profiles:seller_id (
        display_name,
        location_city,
        avatar_url,
        ts_badge,
        rating,
        review_count
      )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(fetchLimit);

  if (error) {
    console.error('Database query error:', error);
    return {
      listings: [],
      debug: {
        columnsSearched,
        termMatchCounts: {},
        minMatchesRequired: 0,
        totalListingsScanned: 0,
        directMatches: 0,
      },
    };
  }

  const listings = (data || []) as Listing[];
  const termMatchCounts: Record<string, number> = {};
  termGroups.forEach((group) => {
    termMatchCounts[group.term] = 0;
  });

  const requiredTerms = termGroups.filter((group) => !OPTIONAL_STYLE_TERMS.has(group.term));
  const optionalOnly = requiredTerms.length === 0;
  const effectiveRequiredTerms = optionalOnly ? termGroups : requiredTerms;
  const requiredTermSet = new Set(effectiveRequiredTerms.map((group) => group.term));

  const minMatchesRequired = optionalOnly
    ? 1
    : effectiveRequiredTerms.length >= 3
      ? Math.ceil(effectiveRequiredTerms.length * 0.7)
      : effectiveRequiredTerms.length;

  const scored = listings
    .map((listing) => {
      const matchResults = termGroups.map((group) =>
        matchTermGroup(listing, group)
      );

      const matchedRequiredCount = matchResults.filter((result, index) => {
        const term = termGroups[index]?.term;
        return result.matched && term ? requiredTermSet.has(term) : false;
      }).length;

      if (matchedRequiredCount < minMatchesRequired) {
        return null;
      }

      matchResults.forEach((result, index) => {
        if (result.matched) {
          const term = termGroups[index]?.term;
          if (term) {
            termMatchCounts[term] = (termMatchCounts[term] || 0) + 1;
          }
        }
      });

      const score = matchResults.reduce((sum, result) => sum + result.weight, 0);
      return {
        listing,
        score: score + matchedRequiredCount * 2,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b?.score || 0) - (a?.score || 0));

  const results = scored.slice(0, limit).map((item) => item!.listing);

  return {
    listings: results,
    debug: {
      columnsSearched,
      termMatchCounts,
      minMatchesRequired,
      totalListingsScanned: listings.length,
      directMatches: results.length,
    },
  };
}

function matchTermGroup(listing: Listing, termGroup: TermGroup): MatchResult {
  const variants = termGroup.variants.map((variant) => normalizeTerm(variant)).filter(Boolean);
  if (variants.length === 0) {
    return { matched: false, weight: 0 };
  }

  // HIGH PRIORITY: Tags (moods, styles, intents)
  const listingMoods = normalizeTagColumn(listing.moods).map((tag) => normalizeTerm(tag));
  const listingStyles = normalizeTagColumn(listing.styles).map((tag) => normalizeTerm(tag));
  const listingIntents = normalizeTagColumn(listing.intents).map((tag) => normalizeTerm(tag));
  const tagPool = [...listingMoods, ...listingStyles, ...listingIntents].filter(Boolean);

  if (process.env.NODE_ENV !== 'production') {
    variants.forEach((term) => {
      const wordRegex = new RegExp(`\\b${escapeRegex(term)}\\b`, 'i');
      const categoryValue = listing.category ?? null;
      const categoryNormalized = categoryValue ? normalizeText(categoryValue) : null;
      const categoryMatch = categoryNormalized ? wordRegex.test(categoryNormalized) : false;
      const styleMatch = listingStyles.includes(term);
      console.log('[matchTermGroup]', {
        term,
        category: categoryValue,
        categoryNormalized,
        categoryMatch,
        styles: listingStyles,
        styleMatch,
      });
    });
  }

  const matchesTag = variants.some((term) => tagPool.includes(term));
  if (matchesTag) {
    return { matched: true, weight: 3 };
  }

  // HIGH PRIORITY: Keywords
  const keywordPool = [
    ...(listing.ai_suggested_keywords || []),
    ...(listing.keywords || []),
  ].map((keyword) => normalizeTerm(keyword)).filter(Boolean);

  const matchesKeyword = variants.some((term) => keywordPool.includes(term));
  if (matchesKeyword) {
    return { matched: true, weight: 2 };
  }

  // HIGH PRIORITY: Title, Description, Story, Category - WORD BOUNDARY MATCHING
  const textFields = [
    listing.title,
    listing.description,
    listing.story_text,
    listing.category,
  ].filter((field): field is string => Boolean(field));
  const normalizedTextFields = textFields.map((field) => normalizeText(field));

  const matchesText = variants.some((term) => {
    const wordRegex = new RegExp(`\\b${escapeRegex(term)}\\b`, 'i');
    return normalizedTextFields.some((field) => wordRegex.test(field));
  });

  if (matchesText) {
    return { matched: true, weight: 1 };
  }

  // LOW PRIORITY: AI-generated text
  const aiTextFields = [
    (listing as { ai_generated_title?: string | null }).ai_generated_title,
    (listing as { ai_generated_description?: string | null }).ai_generated_description,
  ].filter((field): field is string => Boolean(field));
  const normalizedAiTextFields = aiTextFields.map((field) => normalizeText(field));

  const matchesAiText = variants.some((term) => {
    const wordRegex = new RegExp(`\\b${escapeRegex(term)}\\b`, 'i');
    return normalizedAiTextFields.some((field) => wordRegex.test(field));
  });

  if (matchesAiText) {
    return { matched: true, weight: 0.5 };
  }

  return { matched: false, weight: 0 };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
