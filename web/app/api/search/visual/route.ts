import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithClaude, analyzeWithGoogleVision, analyzeWithOpenAI } from '@/lib/seller-upload-service';
import { extractTermGroups, searchListingsByTerms, TermGroup } from '@/lib/semantic-search';

type VisionTerms = {
  source: 'openai' | 'claude' | 'google';
  terms: string[];
};

function normalizeTerm(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toTermGroups(terms: string[]): TermGroup[] {
  return terms
    .map((term) => normalizeTerm(term))
    .filter(Boolean)
    .map((term) => ({ term, variants: [term] }));
}

function mergeTermGroups(groups: TermGroup[]): TermGroup[] {
  const merged = new Map<string, Set<string>>();

  groups.forEach((group) => {
    const key = normalizeTerm(group.term);
    if (!key) return;
    const existing = merged.get(key) || new Set<string>();
    existing.add(key);
    group.variants.forEach((variant) => {
      const normalized = normalizeTerm(variant);
      if (normalized) {
        existing.add(normalized);
      }
    });
    merged.set(key, existing);
  });

  return Array.from(merged.entries()).map(([term, variants]) => ({
    term,
    variants: Array.from(variants),
  }));
}

function collectVisionTerms(payload: {
  attributes?: string[];
  styles?: string[];
  moods?: string[];
  intents?: string[];
  category?: string;
  title?: string;
}): string[] {
  const terms = new Set<string>();

  (payload.attributes || []).forEach((term) => terms.add(term));
  (payload.styles || []).forEach((term) => terms.add(term));
  (payload.moods || []).forEach((term) => terms.add(term));
  (payload.intents || []).forEach((term) => terms.add(term));
  if (payload.category) terms.add(payload.category);
  if (payload.title) terms.add(payload.title);

  return Array.from(terms);
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, query, limit } = await request.json();

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
    }

    const requestedLimit = limit || 24;

    const [openAIResult, claudeResult, googleResult] = await Promise.allSettled([
      process.env.OPENAI_API_KEY ? analyzeWithOpenAI(imageUrl) : Promise.resolve(null),
      process.env.ANTHROPIC_API_KEY ? analyzeWithClaude(imageUrl) : Promise.resolve(null),
      process.env.VISION_API_KEY ? analyzeWithGoogleVision(imageUrl) : Promise.resolve(null),
    ]);

    const openAITerms = openAIResult.status === 'fulfilled' && openAIResult.value
      ? collectVisionTerms(openAIResult.value)
      : [];

    const claudeTerms = claudeResult.status === 'fulfilled' && claudeResult.value
      ? collectVisionTerms(claudeResult.value)
      : [];

    const googleTerms = googleResult.status === 'fulfilled' && googleResult.value
      ? collectVisionTerms(googleResult.value)
      : [];

    const visionTermGroups = mergeTermGroups([
      ...toTermGroups(openAITerms),
      ...toTermGroups(claudeTerms),
      ...toTermGroups(googleTerms),
    ]);

    const queryTerms = query && typeof query === 'string'
      ? await extractTermGroups(query)
      : { termGroups: [], source: 'local' as const };

    const combined = mergeTermGroups([
      ...queryTerms.termGroups,
      ...visionTermGroups,
    ]);

    const result = await searchListingsByTerms(combined, {
      limit: requestedLimit,
      sourceQuery: query || '',
    });

    const visionDebug: VisionTerms[] = [
      { source: 'openai', terms: openAITerms },
      { source: 'claude', terms: claudeTerms },
      { source: 'google', terms: googleTerms },
    ];

    console.log('🖼️ Visual search image:', imageUrl);
    if (query) {
      console.log('🎤 Visual search query:', query);
    }
    console.log('🔎 Vision terms:', visionDebug);
    console.log('🧩 Combined terms:', combined.map((term) => term.term));
    console.log('🎯 Visual search results:', result.listings.length);

    return NextResponse.json({
      ...result,
      debug: {
        ...result.debug,
        vision: visionDebug,
      },
    });
  } catch (error) {
    console.error('Visual search API error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
