// web/lib/semantic-search.ts
/**
 * Semantic Search for ThriftShopper
 * Uses OpenAI to interpret natural language queries and search across all item fields
 */

import { supabase } from './supabase';
import type { Listing } from './types';
import { normalizeTagColumn } from './utils/tagNormalizer';

interface SemanticSearchResult {
  listings: Listing[];
  interpretation?: {
    keywords: string[];
    intents: string[];
    styles: string[];
    moods: string[];
    priceRange?: { min?: number; max?: number };
    categories: string[];
  };
}

/**
 * Main semantic search function
 * Takes a natural language query and returns relevant listings
 */
export async function semanticSearch(
  query: string,
  options: { limit?: number } = {}
): Promise<SemanticSearchResult> {
  const { limit = 24 } = options;

  try {
    // Step 1: Use OpenAI to interpret the natural language query
    const interpretation = await interpretQuery(query);
    
    console.log('🔍 Semantic search interpretation:', interpretation);

    // Step 2: Build a comprehensive database query
    const listings = await searchWithInterpretation(interpretation, limit);

    return {
      listings,
      interpretation,
    };
  } catch (error) {
    console.error('Semantic search error:', error);
    // Fallback to basic keyword search with local interpretation
    // This handles simple queries like "whimsical" or "vintage" without OpenAI
    return fallbackKeywordSearch(query, limit);
  }
}

/**
 * Uses OpenAI to interpret the natural language query
 * Extracts: keywords, moods, styles, intents, categories, price hints
 */
async function interpretQuery(query: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `You are a search assistant for a vintage/secondhand marketplace called ThriftShopper.
Analyze this search query and extract structured information to help find relevant items.

Search query: "${query}"

Extract:
1. **keywords**: General search terms (brands, materials, objects, descriptors)
2. **intents**: Purpose tags like "gifting", "selfish", "home-decor", "collection", "functional"
3. **styles**: Style tags like "vintage", "retro", "mid-century", "bohemian", "modern", "whimsical", "minimalist", "rustic", "industrial", "art-deco"
4. **moods**: Mood tags like "cozy", "elegant", "playful", "romantic", "edgy", "serene", "nostalgic", "quirky", "sophisticated"
5. **categories**: Product categories like "Kitchen & Dining", "Home Decor", "Collectibles", "Books & Media", "Furniture", "Art", "Electronics", "Fashion", "Jewelry", "Toys & Games", "Sports & Outdoors"
6. **priceRange**: If price is mentioned (e.g. "under $50", "cheap", "luxury")

Return ONLY valid JSON:
{
  "keywords": ["word1", "word2"],
  "intents": ["intent1"],
  "styles": ["style1"],
  "moods": ["mood1"],
  "categories": ["category1"],
  "priceRange": { "min": 0, "max": 50 }
}

Examples:
- "whimsical gift for mom that is vintage" → keywords: ["mom", "mother"], intents: ["gifting"], styles: ["whimsical", "vintage"], moods: ["playful"], categories: []
- "cozy mug for myself" → keywords: ["mug"], intents: ["selfish"], styles: [], moods: ["cozy"], categories: ["Kitchen & Dining"]
- "retro stereo under $100" → keywords: ["stereo"], intents: [], styles: ["retro"], moods: [], categories: ["Electronics"], priceRange: {"max": 100}
- "collectible gift" → keywords: [], intents: ["gifting", "collection"], styles: [], moods: [], categories: ["Collectibles"]

IMPORTANT: 
- "collectible" should map to categories: ["Collectibles"] AND/OR intents: ["collection"]
- Do NOT put "collectible" or "gift" in keywords - they are specific tag types!`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // Faster and cheaper for this task
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent extraction
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    console.error('OpenAI API error:', response.status, errorText);
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error('Invalid OpenAI response:', data);
    throw new Error('Invalid OpenAI API response');
  }
  
  const content = data.choices[0].message.content.trim();
  
  // Extract JSON from markdown code blocks if present
  const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                    content.match(/(\{[\s\S]*\})/);
  
  if (!jsonMatch) {
    throw new Error('Could not parse OpenAI response');
  }

  const interpretation = JSON.parse(jsonMatch[1]);
  
  return {
    keywords: interpretation.keywords || [],
    intents: interpretation.intents || [],
    styles: interpretation.styles || [],
    moods: interpretation.moods || [],
    categories: interpretation.categories || [],
    priceRange: interpretation.priceRange,
  };
}

/**
 * Searches the database using the interpreted query
 * Combines keyword matching with tag filtering
 */
async function searchWithInterpretation(
  interpretation: Awaited<ReturnType<typeof interpretQuery>>,
  limit: number
): Promise<Listing[]> {
  let query = supabase
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
    .order('created_at', { ascending: false });

  // Build keyword search conditions (search across ALL text fields)
  // Distinguish between real keywords (like "mug", "stereo") and tag-only queries (like "whimsical", "vintage")
  const hasRealKeywords = interpretation.keywords.length > 0;
  const isTagOnlyQuery = !hasRealKeywords && (
    interpretation.moods.length > 0 || 
    interpretation.styles.length > 0 || 
    interpretation.intents.length > 0
  );
  
  if (hasRealKeywords) {
    // Real keywords: search title/description and include tags as additional search terms
    const allSearchTerms = [
      ...interpretation.keywords,
      ...interpretation.moods,
      ...interpretation.styles,
      ...interpretation.intents
    ];
    
    const orConditions = allSearchTerms
      .map((keyword: string) => {
        const escaped = keyword.toLowerCase().replace(/[%_]/g, '\\$&');
        return [
          `title.ilike.*${escaped}*`,
          `description.ilike.*${escaped}*`,
          `category.ilike.*${escaped}*`,
          `condition.ilike.*${escaped}*`,
          `specifications.ilike.*${escaped}*`,
        ].join(',');
      })
      .join(',');
    
    query = query.or(orConditions);
  }
  // For tag-only queries: don't add database filters - fetch all active items
  // Client-side filtering will check the tags (moods, styles, intents columns)
  // This matches how the mood wheel works - it filters all loaded listings by tags

  // Apply price range filter
  if (interpretation.priceRange) {
    if (interpretation.priceRange.min !== undefined) {
      query = query.gte('price', interpretation.priceRange.min);
    }
    if (interpretation.priceRange.max !== undefined) {
      query = query.lte('price', interpretation.priceRange.max);
    }
  }

  // Apply category filter
  if (interpretation.categories.length > 0) {
    const categoryConditions = interpretation.categories
      .map((cat: string) => `category.ilike.*${cat}*`)
      .join(',');
    query = query.or(categoryConditions);
  }

  // Only apply limit if we have real keywords (keyword search is already filtered)
  // For tag-only queries, fetch more items and filter client-side, then limit
  if (hasRealKeywords) {
    query = query.limit(limit);
  } else {
    // Fetch more items for tag filtering (same as browse page limit)
    // This ensures we get all potential matches for client-side tag filtering
    query = query.limit(500);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Database query error:', error);
    return [];
  }

  if (!data || data.length === 0) {
    console.log('📭 No items found in database query');
    return [];
  }

  console.log('📦 Database returned', data.length, 'items');

  // Client-side filtering for array fields (moods, styles, intents)
  // This is necessary because Supabase's array contains queries can be complex
  let results = data as Listing[];

  // Filter by moods/styles/intents if specified
  const hasArrayFilters = 
    interpretation.moods.length > 0 ||
    interpretation.styles.length > 0 ||
    interpretation.intents.length > 0;

  if (hasArrayFilters) {
    // Require items to match at least one from EACH specified tag type
    // "collectible gift" = must have BOTH collection intent AND gifting intent (or match category)
    console.log('🔍 Filtering', results.length, 'items by tags:', {
      needMoods: interpretation.moods,
      needStyles: interpretation.styles,
      needIntents: interpretation.intents,
      needCategories: interpretation.categories
    });

    const filtered = results
      .map(listing => {
        try {
          // Normalize tags from database (they might be strings like "{tag1,tag2}" or arrays)
          const listingMoods = normalizeTagColumn(listing.moods).map(m => m.toLowerCase());
          const listingStyles = normalizeTagColumn(listing.styles).map(s => s.toLowerCase());
          const listingIntents = normalizeTagColumn(listing.intents).map(i => i.toLowerCase());

        // Combine all tags from the listing (same as mood wheel filter)
        const allListingTags = [...listingMoods, ...listingStyles, ...listingIntents];
        
        // For single-tag queries (like "whimsical"), search across ALL tag types like the mood wheel
        // For multi-tag queries, require matching the specific tag types
        const isSingleTagQuery = 
          (interpretation.moods.length > 0 && interpretation.styles.length === 0 && interpretation.intents.length === 0) ||
          (interpretation.moods.length === 0 && interpretation.styles.length > 0 && interpretation.intents.length === 0) ||
          (interpretation.moods.length === 0 && interpretation.styles.length === 0 && interpretation.intents.length > 0);
        
        let matchesMood: boolean;
        let matchesStyle: boolean;
        let matchesIntent: boolean;
        
        if (isSingleTagQuery) {
          // Single tag query: search across ALL tag types (moods, styles, intents) like mood wheel
          const allQueryTags = [
            ...interpretation.moods.map((m: string) => m.toLowerCase()),
            ...interpretation.styles.map((s: string) => s.toLowerCase()),
            ...interpretation.intents.map((i: string) => i.toLowerCase())
          ];
          const matchesAnyTag = allQueryTags.some((tag: string) => 
            allListingTags.includes(tag)
          );
          matchesMood = matchesAnyTag;
          matchesStyle = matchesAnyTag;
          matchesIntent = matchesAnyTag;
        } else {
          // Multi-tag query: require matching specific tag types
          matchesMood = interpretation.moods.length === 0 || 
            interpretation.moods.some((mood: string) => listingMoods.includes(mood.toLowerCase()));

          matchesStyle = interpretation.styles.length === 0 || 
            interpretation.styles.some((style: string) => listingStyles.includes(style.toLowerCase()));

          matchesIntent = interpretation.intents.length === 0 || 
            interpretation.intents.some((intent: string) => listingIntents.includes(intent.toLowerCase()));
        }
        
        // Bonus: check if item is in the right category for "collectible"
        const matchesCategory = interpretation.categories.length === 0 ||
          interpretation.categories.some((cat: string) => 
            (listing.category || '').toLowerCase().includes(cat.toLowerCase())
          );

        // Score for ranking (more matches = higher score)
        let score = 0;
        
        if (isSingleTagQuery) {
          // For single-tag queries, score based on tag matches across all types
          const allQueryTags = [
            ...interpretation.moods.map((m: string) => m.toLowerCase()),
            ...interpretation.styles.map((s: string) => s.toLowerCase()),
            ...interpretation.intents.map((i: string) => i.toLowerCase())
          ];
          const tagMatches = allQueryTags.filter((tag: string) => 
            allListingTags.includes(tag)
          ).length;
          score = tagMatches * 3; // Higher weight for direct tag matches
        } else {
          // Multi-tag query: score by specific tag types
          const moodMatches = interpretation.moods.filter((mood: string) => 
            listingMoods.includes(mood.toLowerCase())
          ).length;
          const styleMatches = interpretation.styles.filter((style: string) => 
            listingStyles.includes(style.toLowerCase())
          ).length;
          const intentMatches = interpretation.intents.filter((intent: string) => 
            listingIntents.includes(intent.toLowerCase())
          ).length;
          
          // Scoring: items matching MORE criteria rank higher
          score = (moodMatches * 3) + (styleMatches * 2) + (intentMatches * 3);
          
          // Boost items that match ALL intents (e.g., both "collection" AND "gifting")
          if (interpretation.intents.length > 1 && intentMatches === interpretation.intents.length) {
            score += 5; // Bonus for matching all intents
          }
        }
        
        const categoryMatches = interpretation.categories.filter((cat: string) =>
          (listing.category || '').toLowerCase().includes(cat.toLowerCase())
        ).length;
        score += categoryMatches * 2;

        const passes = matchesMood && matchesStyle && matchesIntent && matchesCategory;
        
        // Log first few items for debugging
        if (results.indexOf(listing) < 5) {
          console.log(`  Item "${listing.title}":`, {
            category: listing.category,
            moods: listingMoods,
            styles: listingStyles,
            intents: listingIntents,
            matchesMood,
            matchesStyle,
            matchesIntent,
            matchesCategory,
            passes,
            score
          });
        }

          return { 
            listing, 
            score,
            matchesMood,
            matchesStyle,
            matchesIntent,
            matchesCategory
          };
        } catch (error) {
          console.error('Error processing listing:', listing.title, error);
          return {
            listing,
            score: 0,
            matchesMood: false,
            matchesStyle: false,
            matchesIntent: false,
            matchesCategory: false
          };
        }
      })
      // MUST match ALL specified tag types
      .filter(item => item.matchesMood && item.matchesStyle && item.matchesIntent && item.matchesCategory)
      // Sort by score (items matching more tags appear first)
      .sort((a, b) => b.score - a.score);

    console.log('✅ After filtering:', filtered.length, 'items match all tag requirements');
    
    results = filtered.map(item => item.listing);
    
    // Apply limit after client-side filtering for tag-only queries
    // This ensures we get all matches like the mood wheel does
    if (interpretation.keywords.length === 0 && results.length > limit) {
      results = results.slice(0, limit);
    }
  }

  // If we have keywords but no results, try a broader search
  if (results.length === 0 && interpretation.keywords.length > 0) {
    console.log('No results with strict filtering, trying broader search...');
    // Remove array filters and just use keyword search
    return searchWithInterpretation(
      { ...interpretation, moods: [], styles: [], intents: [] },
      limit
    );
  }

  return results;
}

/**
 * Fallback to basic keyword search if semantic search fails
 * Now with local interpretation for common terms
 */
async function fallbackKeywordSearch(
  query: string,
  limit: number
): Promise<SemanticSearchResult> {
  console.log('🔄 Using fallback keyword search with local interpretation');
  
  // Simple local interpretation without OpenAI
  const interpretation = localInterpretQuery(query);
  console.log('🧠 Local interpretation:', interpretation);
  
  // Use the same search logic but with local interpretation
  return {
    listings: await searchWithInterpretation(interpretation, limit),
    interpretation
  };
}

/**
 * Local query interpretation without OpenAI
 * Handles common search terms
 */
function localInterpretQuery(query: string): Awaited<ReturnType<typeof interpretQuery>> {
  const lowerQuery = query.toLowerCase().trim();
  // Split by spaces and filter out very short words, but keep single-word queries
  const words = lowerQuery.split(/\s+/).filter(w => w.length > 0);
  
  const interpretation = {
    keywords: [] as string[],
    intents: [] as string[],
    styles: [] as string[],
    moods: [] as string[],
    categories: [] as string[],
    priceRange: undefined as { min?: number; max?: number } | undefined
  };
  
  // Intent keywords - these describe WHY someone wants the item
  const intentMap: Record<string, string[]> = {
    'gift': ['gifting'],
    'gifting': ['gifting'],
    'myself': ['selfish'],
    'personal': ['selfish'],
    'decor': ['home-decor'],
    'decoration': ['home-decor'],
    'collect': ['collection'],
    'collectible': ['collection'],  // Someone wants to collect it
    'collectibles': ['collection'],
    'collector': ['collection'],
    'functional': ['functional'],
    'display': ['home-decor']
  };
  
  // Style keywords
  const styleMap: Record<string, string> = {
    'vintage': 'vintage',
    'retro': 'retro',
    'antique': 'antique',
    'mid-century': 'mid-century',
    'modern': 'modern',
    'rustic': 'rustic',
    'industrial': 'industrial',
    'bohemian': 'bohemian',
    'minimalist': 'minimalist',
    'art-deco': 'art-deco'
  };
  
  // Mood keywords
  const moodMap: Record<string, string> = {
    'cozy': 'cozy',
    'elegant': 'elegant',
    'whimsical': 'whimsical',
    'playful': 'playful',
    'romantic': 'romantic',
    'quirky': 'quirky',
    'sophisticated': 'sophisticated'
  };
  
  // Category keywords
  const categoryMap: Record<string, string> = {
    'collectible': 'Collectibles',
    'collectibles': 'Collectibles',
    'book': 'Books & Media',
    'furniture': 'Furniture',
    'lamp': 'Home Decor',
    'art': 'Art',
    'fashion': 'Fashion',
    'jewelry': 'Jewelry',
    'electronics': 'Electronics'
  };
  
  // Process each word
  words.forEach(word => {
    // Check if it's an intent
    if (intentMap[word]) {
      interpretation.intents.push(...intentMap[word]);
      return;
    }
    
    // Check if it's a style
    if (styleMap[word]) {
      interpretation.styles.push(styleMap[word]);
      return;
    }
    
    // Check if it's a mood
    if (moodMap[word]) {
      interpretation.moods.push(moodMap[word]);
      return;
    }
    
    // Check if it's a category
    if (categoryMap[word]) {
      interpretation.categories.push(categoryMap[word]);
      return;
    }
    
    // Otherwise it's a keyword to search text fields
    interpretation.keywords.push(word);
  });
  
  // Remove duplicates
  interpretation.intents = [...new Set(interpretation.intents)];
  interpretation.styles = [...new Set(interpretation.styles)];
  interpretation.moods = [...new Set(interpretation.moods)];
  interpretation.categories = [...new Set(interpretation.categories)];
  
  // Price detection
  const priceMatch = lowerQuery.match(/under\s+\$?(\d+)|<\s*\$?(\d+)|less than\s+\$?(\d+)/);
  if (priceMatch) {
    const price = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3]);
    interpretation.priceRange = { max: price };
  }
  
  return interpretation;
}

