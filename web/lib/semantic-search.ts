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

const SYNONYM_MAP: Record<string, string> = {
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
Return a clean list of search term groups with synonyms.

Rules:
- Remove filler words, hedges, and conversational phrases.
- Extract only meaningful search terms.
- Normalize synonyms to a primary term (e.g., "funky" -> "whimsical").
- Return each term with variants (synonyms, close variations, or related terms).
- Do NOT categorize by mood/style/intent or choose columns.

Query: "${query}"

Return ONLY valid JSON:
{
  "terms": [
    { "term": "whimsical", "variants": ["funky", "playful"] },
    { "term": "vintage", "variants": ["antique", "retro"] }
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

    const existing = termGroups.get(canonical) || new Set<string>();
    existing.add(word);
    existing.add(canonical);
    termGroups.set(canonical, existing);
  });

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

  const minMatchesRequired =
    termGroups.length >= 3 ? Math.ceil(termGroups.length * 0.7) : termGroups.length;

  const scored = listings
    .map((listing) => {
      const matchResults = termGroups.map((group) =>
        matchTermGroup(listing, group)
      );

      const matchedCount = matchResults.filter((result) => result.matched).length;
      if (matchedCount < minMatchesRequired) {
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
        score: score + matchedCount * 2,
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

  const listingMoods = normalizeTagColumn(listing.moods).map((tag) => normalizeTerm(tag));
  const listingStyles = normalizeTagColumn(listing.styles).map((tag) => normalizeTerm(tag));
  const listingIntents = normalizeTagColumn(listing.intents).map((tag) => normalizeTerm(tag));
  const tagPool = [...listingMoods, ...listingStyles, ...listingIntents].filter(Boolean);

  const keywordPool = [
    ...(listing.ai_suggested_keywords || []),
    ...(listing.keywords || []),
  ].map((keyword) => normalizeTerm(keyword)).filter(Boolean);

  const textPool = normalizeText([
    listing.title,
    listing.description,
    listing.story_text,
    listing.category,
  ]
    .filter(Boolean)
    .join(' '));

  const aiTextPool = normalizeText([
    (listing as { ai_generated_title?: string | null }).ai_generated_title,
    (listing as { ai_generated_description?: string | null }).ai_generated_description,
  ]
    .filter(Boolean)
    .join(' '));

  const matchesTag = variants.some((term) => tagPool.includes(term));
  if (matchesTag) {
    return { matched: true, weight: 3 };
  }

  const matchesKeyword = variants.some((term) => keywordPool.includes(term));
  if (matchesKeyword) {
    return { matched: true, weight: 2 };
  }

  const matchesText = variants.some((term) => textPool.includes(term));
  if (matchesText) {
    return { matched: true, weight: 1 };
  }

  const matchesAiText = variants.some((term) => aiTextPool.includes(term));
  if (matchesAiText) {
    return { matched: true, weight: 0.5 };
  }

  return { matched: false, weight: 0 };
}
