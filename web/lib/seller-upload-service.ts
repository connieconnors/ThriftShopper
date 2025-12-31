// ThriftShopper Seller Upload Service
// Saves to listings table in Supabase

import { createClient } from '@supabase/supabase-js';

// Use the correct environment variable names
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// CRITICAL: Must use service role key to bypass RLS for server-side operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseServiceKey) {
  console.error('❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE not set!');
  console.error('This will cause RLS policy violations. Please set the service role key in your environment variables.');
  throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE environment variable is required for server-side operations');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to determine if text/marking is brand/manufacturer vs pattern/label
function isBrandOrManufacturer(text: string, textAnnotations: any[], materialStoplist: Set<string>): boolean {
  const lowerText = text.toLowerCase();
  
  // Common pattern/label indicators (not brands)
  const patternIndicators = ['pattern', 'design', 'style', 'collection', 'series', 'line'];
  const labelIndicators = ['label', 'tag', 'sticker', 'marking', 'inscription', 'engraving'];
  
  // Check if text contains pattern/label indicators
  if (patternIndicators.some(indicator => lowerText.includes(indicator))) {
    return false; // Likely a pattern name
  }
  
  if (labelIndicators.some(indicator => lowerText.includes(indicator))) {
    return false; // Likely just a label
  }
  
  // Check if it's a material word (already filtered above, but double-check)
  if (materialStoplist.has(lowerText)) {
    return false;
  }
  
  // Check context from text annotations - if text appears with brand-like context
  // (e.g., "UNION PACIFIC" on a train car might be a brand, but "Union Pacific" as a pattern name is less likely)
  const fullText = textAnnotations[0]?.description || '';
  const context = fullText.toLowerCase();
  
  // If text appears with trademark-like indicators or company indicators, likely a brand
  const brandIndicators = ['©', '®', '™', 'inc', 'llc', 'corp', 'company', 'manufacturer', 'made by'];
  if (brandIndicators.some(indicator => context.includes(indicator))) {
    return true;
  }
  
  // If text is all caps or has proper capitalization (like "Union Pacific"), more likely a brand
  if (text === text.toUpperCase() || (text[0] === text[0].toUpperCase() && text.includes(' '))) {
    // Check if it's a known pattern name (like "Union Pacific" railroad pattern)
    // For now, we'll be conservative and only return true if it's clearly not a pattern
    // In practice, "UNION PACIFIC" on a train item is likely a brand/manufacturer reference
    return true; // Assume brand unless proven otherwise
  }
  
  // Default: if we can't determine, return false (don't assume it's a brand)
  return false;
}

// Meta tag stoplist - these are phrase-y descriptions, not actual tags
// Keep these ideas in descriptions, not tags
// Tags must serve buyer discovery, not be labels or classifications
const metaTagStoplist = new Set([
  'possibly part of a set',
  'detailed construction',
  'general features',
  'typical shape',
  'aged appearance',
  'possibly',
  'part of a set',
  'detailed',
  'construction',
  'general',
  'features',
  'typical',
  'shape',
  'aged',
  'appearance',
  'lettering', // Often redundant with brand name
  'text visible',
  'markings visible',
  'visible text',
  'visible markings',
  'realistic design',
  'wear consistent with age',
  'miniature',
  'toy',
  'design resembles',
  'construction quality',
  'collectible',
  'collectibility',
  'condition',
  'wear',
  'patina',
  'age',
  // Category labels (not for discovery tags)
  'railroad name',
  'object',
  'design',
  'model train',
  'tender car',
  'train car',
  'railroad',
  'train',
  'model',
  'car',
  'vehicle',
  // Physical attributes (not for discovery tags)
  'color',
  'colour',
  'material',
  'size',
]);

// Banned generic tags that don't help buyers (from prompt rules)
const bannedTags = new Set([
  'black color',
  'wheels',
  'train car shape',
  'rectangular shape',
  'wheels visible',
  'black',
  'white',
  'red',
  'blue',
  'green',
  'yellow',
  'rectangular',
  'round',
  'square',
  'circular',
  'visible',
  'color',
  'shape',
]);

// Extract canonical brand name from tag (handles variations like "Union Pacific", "Union Pacific text", etc.)
function extractCanonicalBrand(tag: string): string | null {
  const lowerTag = tag.toLowerCase().trim();
  
  // Remove common modifiers/suffixes that don't change the brand identity
  const brandModifiers = ['text', 'lettering', 'marking', 'markings', 'logo', 'label', 'inscription'];
  let cleaned = lowerTag;
  
  // Remove trailing modifiers
  for (const modifier of brandModifiers) {
    const pattern = new RegExp(`\\s+${modifier}$`);
    if (pattern.test(cleaned)) {
      cleaned = cleaned.replace(pattern, '');
      break; // Only remove one modifier
    }
  }
  
  // If the cleaned tag is substantially different (more than just a modifier), return null
  // This means it's not a brand variation
  if (cleaned.length < 3) return null;
  
  return cleaned;
}

// Check if tag passes the new validation rules:
// Tags are NOT labels or classifications - they must serve buyer discovery ("Why would someone click this?")
// Must reflect ONE of: collecting community, style/aesthetic, nostalgic/emotional association, buyer use/display context
function isValidTagForDisplay(tag: string, listingTitle: string = ''): boolean {
  const lowerTag = tag.toLowerCase().trim();
  const lowerTitle = listingTitle.toLowerCase().trim();
  
  // Reject category labels
  const categoryLabels = ['railroad name', 'toy', 'object', 'design', 'model train', 'tender car', 'train car', 'railroad', 'train', 'model', 'car', 'vehicle'];
  if (categoryLabels.some(label => lowerTag === label || lowerTag.includes(` ${label}`) || lowerTag.includes(`${label} `))) {
    return false;
  }
  
  // Reject obvious physical attributes (color, shape, material)
  const physicalAttributeWords = ['color', 'colour', 'shape', 'material', 'size', 'large', 'small', 'big', 'tiny', 'red', 'blue', 'green', 'black', 'white', 'yellow', 'rectangular', 'round', 'square', 'circular', 'wood', 'metal', 'plastic', 'glass', 'fabric'];
  if (physicalAttributeWords.some(word => lowerTag === word || lowerTag.includes(` ${word}`) || lowerTag.includes(`${word} `))) {
    return false;
  }
  
  // Reject if tag restates the title or brand
  if (lowerTitle) {
    // Check if tag exactly matches any multi-word phrase from title (e.g., "Union Pacific" in title = reject "Union Pacific" tag)
    const titleWords = lowerTitle.split(/\s+/).filter(w => w.length >= 2);
    // Check for exact phrase matches (brand names, multi-word identifiers)
    for (let i = 0; i < titleWords.length; i++) {
      for (let j = i + 1; j <= titleWords.length; j++) {
        const titlePhrase = titleWords.slice(i, j).join(' ');
        if (titlePhrase.length >= 3 && lowerTag === titlePhrase) {
          return false; // Tag exactly matches a phrase from title
        }
      }
    }
    
    // Also check for single-word matches (if tag is a significant word from title)
    const tagWords = lowerTag.split(/\s+/).filter(w => w.length > 3);
    const significantTitleWords = lowerTitle.split(/\s+/).filter(w => w.length > 3);
    const matchingWords = tagWords.filter(tw => significantTitleWords.includes(tw));
    if (matchingWords.length >= Math.min(2, tagWords.length) || (tagWords.length === 1 && matchingWords.length === 1)) {
      return false; // Tag restates the title
    }
  }
  
  // Reject construction/quality/condition/technical descriptor tags
  if (/\s+(construction|quality|condition|wear|age|patina|detailed|features|design|specification|attribute)$/.test(lowerTag)) {
    return false;
  }
  
  // Tags must reflect ONE of the following discovery purposes:
  
  // 1. Collecting community (e.g., "railroad nostalgia", "railfan", "train enthusiast", "Americana collector")
  const collectingCommunityIndicators = ['collector', 'collecting', 'collectible', 'enthusiast', 'fan', 'nostalgia', 'nostalgic', 'americana', 'vintage', 'retro', 'collector piece', 'collector shelf', 'railfan', 'railroad nostalgia'];
  if (collectingCommunityIndicators.some(indicator => lowerTag.includes(indicator))) {
    return true;
  }
  
  // 2. Style or aesthetic (e.g., "mid-century", "industrial", "farmhouse", "classic", "vintage style")
  const styleIndicators = ['style', 'aesthetic', 'design', 'mid-century', 'industrial', 'farmhouse', 'classic', 'vintage', 'modern', 'retro', 'rustic', 'minimalist'];
  // But reject if it's just "design" or "style" alone (too generic)
  if (lowerTag.includes('style') || lowerTag.includes('aesthetic') || lowerTag.includes('design')) {
    // Only accept if it's combined with a specific style term (e.g., "industrial design", "mid-century style")
    if (lowerTag.split(/\s+/).length >= 2) {
      return true;
    }
  }
  // Accept known style terms even without "style" suffix
  const knownStyles = ['mid-century', 'industrial', 'farmhouse', 'rustic', 'minimalist', 'art-deco', 'bauhaus', 'modernist', 'classic', 'vintage', 'retro'];
  if (knownStyles.some(style => lowerTag.includes(style))) {
    return true;
  }
  
  // 3. Nostalgic or emotional association (e.g., "cozy", "playful", "nostalgic", "childhood memory")
  const emotionalIndicators = ['cozy', 'playful', 'nostalgic', 'nostalgia', 'sentimental', 'charming', 'whimsical', 'warm', 'comforting', 'memorable', 'childhood', 'memory'];
  if (emotionalIndicators.some(indicator => lowerTag.includes(indicator))) {
    return true;
  }
  
  // 4. Buyer use or display context (e.g., "shelf display", "desk accessory", "gift for collector", "display piece")
  const useContextIndicators = ['display', 'shelf', 'desk', 'gift', 'decoration', 'decorative', 'accessory', 'showcase', 'showpiece', 'centerpiece', 'layout', 'diorama', 'scene', 'classic toy display', 'collector shelf piece', 'railfan gift'];
  if (useContextIndicators.some(indicator => lowerTag.includes(indicator))) {
    return true;
  }
  
  // If tag doesn't match any of the four discovery purposes, reject it
  return false;
}

// Deduplicate brand tags - ensure brand name appears at most once
function deduplicateBrandTags(tags: string[]): string[] {
  const normalizeTag = (tag: string): string => String(tag).toLowerCase().trim();
  
  // Group tags by canonical brand
  const brandGroups = new Map<string, string[]>(); // canonical brand -> array of tags with that brand
  const nonBrandTags: string[] = [];
  
  for (const tag of tags) {
    const canonical = extractCanonicalBrand(tag);
    if (canonical) {
      if (!brandGroups.has(canonical)) {
        brandGroups.set(canonical, []);
      }
      brandGroups.get(canonical)!.push(tag);
    } else {
      nonBrandTags.push(tag);
    }
  }
  
  // For each brand group, keep only the shortest/most canonical form
  const deduplicatedBrands: string[] = [];
  for (const [canonical, variations] of brandGroups.entries()) {
    // Sort by length (prefer shorter), then alphabetically
    const sorted = variations.sort((a, b) => {
      if (a.length !== b.length) return a.length - b.length;
      return a.localeCompare(b);
    });
    // Keep only the first (shortest) variation
    deduplicatedBrands.push(sorted[0]);
  }
  
  return [...deduplicatedBrands, ...nonBrandTags];
}

// Rank and select tags by informativeness, distinctiveness, and buyer browsing value
function rankAndSelectTags(
  idTags: string[],
  styleTags: string[],
  moodTags: string[],
  listingTitle: string = ''
): { idTags: string[]; styleTags: string[]; moodTags: string[] } {
  // Helper function to normalize and clean a single tag
  const normalizeTag = (tag: string): string => {
    return String(tag).toLowerCase().trim();
  };

  // Helper function to filter meta tags and banned tags
  const isValidTag = (tag: string): boolean => {
    const lowerTag = normalizeTag(tag);
    
    // Filter empty tags
    if (lowerTag.length === 0) return false;
    
    // Filter meta tags (phrase-y descriptions)
    if (metaTagStoplist.has(lowerTag)) return false;
    // Check if tag contains meta tag phrases
    for (const metaTag of metaTagStoplist) {
      if (lowerTag.includes(metaTag) || metaTag.includes(lowerTag)) {
        return false;
      }
    }
    
    // Filter banned generic tags
    if (bannedTags.has(lowerTag)) return false;
    for (const banned of bannedTags) {
      if (lowerTag === banned || lowerTag.startsWith(banned + ' ') || lowerTag.endsWith(' ' + banned)) {
        return false;
      }
    }
    
    // Filter phrase-y descriptions (meta tags) - check for common patterns
    const phrasePatterns = [
      /^detailed\s+/,
      /^possibly\s+/,
      /^typical\s+/,
      /^general\s+/,
      /\s+construction$/,
      /\s+features?$/,
      /\s+appearance$/,
      /\s+lettering$/,
    ];
    if (phrasePatterns.some(pattern => pattern.test(lowerTag))) {
      return false;
    }
    
    return true;
  };

  // Helper function to remove duplicates (case-insensitive)
  const deduplicateTags = (tags: string[]): string[] => {
    const normalized = tags.map(normalizeTag).filter(isValidTag);
    const seen = new Set<string>();
    const deduplicated: string[] = [];
    for (const tag of normalized) {
      if (!seen.has(tag)) {
        seen.add(tag);
        // Find original tag (preserve original casing if available)
        const originalTag = tags.find(t => normalizeTag(t) === tag) || tag;
        deduplicated.push(originalTag);
      }
    }
    return deduplicated;
  };

  // Helper function to score a tag by informativeness
  // Higher score = more distinctive, reusable, helpful for buyer browsing
  const scoreTag = (tag: string, allTags: string[]): number => {
    const lowerTag = normalizeTag(tag);
    let score = 0;
    
    // Prefer shorter, punchy tags over long descriptions (distinctive)
    // But also value specificity (multi-word tags that are specific)
    const wordCount = lowerTag.split(/\s+/).length;
    if (wordCount === 1) {
      score += 10; // Single words are most reusable
    } else if (wordCount === 2) {
      score += 8; // Two-word phrases are good (e.g., "mid-century", "art-deco")
    } else {
      score += 5; // Longer phrases are less reusable
      // Penalize very long tags (likely descriptions, not tags)
      if (tag.length > 25) {
        score -= 10;
      }
    }
    
    // Prefer tags that are reusable across listings (not item-specific)
    // Single words and compound words (with hyphens) are more reusable
    if (/^[a-z]+(-[a-z]+)*$/.test(lowerTag)) {
      score += 5; // Simple compound words are reusable
    }
    
    // Penalize tags that sound like descriptions or contain redundant modifiers
    if (/\s+(construction|features|appearance|details|markings|lettering)$/.test(lowerTag)) {
      score -= 15; // These are meta tags, not real tags
    }
    
    // Penalize tags that are redundant (e.g., "union pacific lettering" when "union pacific" exists)
    // Check if this tag is just a longer version of another tag
    for (const otherTag of allTags) {
      if (otherTag === tag) continue;
      const otherLower = normalizeTag(otherTag);
      if (lowerTag.includes(otherLower) && lowerTag.length > otherLower.length) {
        // This tag contains another tag as a substring - likely redundant
        const extraWords = lowerTag.replace(otherLower, '').trim();
        // If the extra words are just modifiers like "lettering", "markings", etc., penalize heavily
        if (/^(lettering|markings|text|details|construction|features)$/.test(extraWords)) {
          score -= 20; // Heavily penalize redundant tags with meta modifiers
        } else {
          score -= 10; // Still penalize, but less, if it's a meaningful extension
        }
      } else if (otherLower.includes(lowerTag) && otherLower.length > lowerTag.length) {
        // Another tag contains this tag - prefer the shorter one (this one)
        score += 3;
      }
    }
    
    // Length bonus (but not too long) - slightly longer can be more specific
    if (tag.length >= 3 && tag.length <= 15) {
      score += 2;
    } else if (tag.length > 15) {
      score -= 3; // Too long likely a description
    }
    
    return score;
  };

  // Process each tag category with budget constraints
  const processTagCategory = (tags: string[], maxCount: number, isStyleOrMood: boolean = false): string[] => {
    // First, deduplicate brands (for id_tags primarily)
    let deduped = isStyleOrMood ? deduplicateTags(tags) : deduplicateBrandTags(deduplicateTags(tags));
    
    // Filter out tags that don't pass validation (for id_tags and attributes)
    // Style and mood tags are assumed to already express mood/style, so skip validation
    if (!isStyleOrMood) {
      deduped = deduped.filter(tag => isValidTagForDisplay(tag, listingTitle));
    }
    
    // Score and rank tags (pass all tags for redundancy checking)
    const scored = deduped.map(tag => ({
      tag,
      score: scoreTag(tag, deduped),
      normalized: normalizeTag(tag),
    }));
    
    // Sort by score (descending), then alphabetically for consistency
    scored.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.normalized.localeCompare(b.normalized);
    });
    
    // Take top maxCount tags
    return scored.slice(0, maxCount).map(item => item.tag);
  };

  // Apply tag budget: max 2 ID tags, 2-3 style tags, 2-3 mood tags
  // Style and mood tags are assumed to already express mood/style, so skip validation
  const processedIdTags = processTagCategory(idTags, 2, false);
  const processedStyleTags = processTagCategory(styleTags, 3, true);
  const processedMoodTags = processTagCategory(moodTags, 3, true);

  return {
    idTags: processedIdTags,
    styleTags: processedStyleTags,
    moodTags: processedMoodTags,
  };
}

// Legacy function for backward compatibility (used for attributes)
// This processes a flat list of tags without budget constraints
function postProcessTags(tags: string[], maxTags: number = 8): string[] {
  // Use the same normalization and filtering as rankAndSelectTags
  const normalizeTag = (tag: string): string => String(tag).toLowerCase().trim();
  
  const allTags = [...tags];
  const normalized = allTags.map(normalizeTag).filter(tag => tag.length > 0);
  
  const seen = new Set<string>();
  const deduplicated: string[] = [];
  for (const tag of normalized) {
    if (!seen.has(tag)) {
      seen.add(tag);
      const originalTag = allTags.find(t => normalizeTag(t) === tag) || tag;
      deduplicated.push(originalTag);
    }
  }
  
  // Filter meta tags and banned tags
  const filtered = deduplicated.filter(tag => {
    const lowerTag = normalizeTag(tag);
    if (metaTagStoplist.has(lowerTag)) return false;
    if (bannedTags.has(lowerTag)) return false;
    
    // Check for meta tag patterns
    const phrasePatterns = [
      /^detailed\s+/, /^possibly\s+/, /^typical\s+/, /^general\s+/,
      /\s+construction$/, /\s+features?$/, /\s+appearance$/, /\s+lettering$/,
    ];
    if (phrasePatterns.some(pattern => pattern.test(lowerTag))) return false;
    
    return true;
  });
  
  // Score and rank (simpler scoring for flat list)
  const scored = filtered.map(tag => ({
    tag,
    score: tag.length + (tag.split(' ').length - 1) * 2,
  }));
  
  const topTags = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxTags)
    .map(item => item.tag);
  
  return topTags;
}

interface UploadAndSaveResult {
  success: boolean;
  listingId?: string;
  data?: {
    processedImageUrl: string;
    originalImageUrl: string;
    backgroundRemoved: boolean;
    suggestedTitle: string;
    suggestedDescription: string;
    detectedCategory: string;
    detectedAttributes: string[];
    pricingIntelligence?: {
      minPrice: number;
      maxPrice: number;
      avgPrice: number;
      recentSales: number;
      source: 'firstdibs' | 'etsy' | 'ebay' | 'apify' | 'ai_estimate';
    };
  };
  error?: string;
}

export async function uploadAndCreateListing(
  imageFile: File | Buffer,
  sellerId: string,
  userInput?: {
    title?: string;
    description?: string;
    price?: number;
    category?: string;
  },
  options?: {
    removeBackground?: boolean;
    existingListingId?: string; // Optional: if provided, fetch existing listing for price stabilization
  }
): Promise<UploadAndSaveResult> {
  try {
    // Step 0: Fetch existing listing for price stabilization (if listingId provided)
    // Fetch BEFORE image upload so we can reference existing data
    let existingListing = null;
    let existingImageUrl = null;
    if (options?.existingListingId) {
      const { data: existing, error: fetchError } = await supabase
        .from('listings')
        .select('id, price, original_image_url')
        .eq('id', options.existingListingId)
        .eq('seller_id', sellerId)
        .single();

      if (!fetchError && existing) {
        existingListing = existing;
        existingImageUrl = existing.original_image_url;
      }
    }

    // Step 1: Upload original image to Supabase Storage
    const originalFilename = `original-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    
    let uploadData: Uint8Array;
    if (Buffer.isBuffer(imageFile)) {
      uploadData = new Uint8Array(imageFile);
    } else {
      // It's a File object
      const arrayBuffer = await (imageFile as File).arrayBuffer();
      uploadData = new Uint8Array(arrayBuffer);
    }

    const { data: originalUpload, error: originalError } = await supabase.storage
      .from('listings')
      .upload(originalFilename, uploadData, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (originalError) {
      throw new Error(`Image upload failed: ${originalError.message}`);
    }

    const { data: { publicUrl: originalUrl } } = supabase.storage
      .from('listings')
      .getPublicUrl(originalFilename);

    // Step 2: PARALLEL PROCESSING - Run independent operations simultaneously
    // REFACTOR: Changed from sequential to parallel processing for speed improvement
    // Using Promise.allSettled() to gracefully handle failures without blocking other operations
    
    const parallelTasks = [];

    // Task 1: OpenAI Vision Analysis (PRIMARY - for product identification)
    // REVERT: OpenAI Vision is PRIMARY for title, category, description, pricing
    const openAITask = process.env.OPENAI_API_KEY
      ? analyzeWithOpenAI(originalUrl).catch((err) => {
          console.error('❌ OpenAI Vision failed:', err);
          return null; // Return null on failure for graceful degradation
        })
      : Promise.resolve(null);
    parallelTasks.push(openAITask);

    // Task 2: Google Vision Analysis (SUPPLEMENTARY - for additional tags/attributes only)
    // REVERT: Google Vision is SECONDARY - only adds extra tags/attributes to supplement OpenAI
    const googleVisionTask = process.env.VISION_API_KEY
      ? analyzeWithGoogleVision(originalUrl).catch((err) => {
          console.error('❌ Google Vision failed:', err);
          return null; // Return null on failure for graceful degradation
        })
      : Promise.resolve(null);
    parallelTasks.push(googleVisionTask);

    // Task 3: Background Removal (optional, independent operation)
    // REFACTOR: Background removal now runs in parallel instead of sequentially
    const backgroundRemovalTask = (options?.removeBackground && process.env.REMOVE_BG_KEY)
      ? removeBackground(imageFile).catch((err) => {
          console.error('✗ Background removal failed:', err instanceof Error ? err.message : String(err));
          return null; // Return null on failure, will use original image
        })
      : Promise.resolve(null);
    parallelTasks.push(backgroundRemovalTask);

    // Timing diagnostics: Start timing for parallel processing and total upload
    console.time('Parallel Processing');
    console.time('Total Upload');

    // Execute all parallel tasks simultaneously
    const [openAIResult, googleResult, processedImageUrlResult] = await Promise.allSettled(parallelTasks);

    // Timing diagnostics: End parallel processing timing and log status of each operation
    console.timeEnd('Parallel Processing');
    console.log('OpenAI status:', openAIResult.status);
    console.log('Google Vision status:', googleResult.status);
    console.log('Background removal status:', processedImageUrlResult.status);

    // Extract results from Promise.allSettled responses (order matches parallelTasks array)
    // Type guard: ensure openAIEnrichment is the expected object type (not string or other types)
    type OpenAIEnrichmentType = {
      title: string;
      description: string;
      category: string;
      attributes: string[];
      estimatedPrice: number | null;
      styles?: string[];
      moods?: string[];
      intents?: string[];
      era?: string;
    };
    
    const openAIEnrichment: OpenAIEnrichmentType | null = 
      openAIResult.status === 'fulfilled' && 
      openAIResult.value && 
      typeof openAIResult.value === 'object' &&
      'title' in openAIResult.value
        ? (openAIResult.value as OpenAIEnrichmentType)
        : null;
        
    type GoogleVisionDataType = {
      title: string;
      category: string;
      attributes: string[];
      brandInfo?: string;
    };
    
    const googleVisionData: GoogleVisionDataType | null = googleResult.status === 'fulfilled' && 
      googleResult.value &&
      typeof googleResult.value === 'object' &&
      'title' in googleResult.value
        ? (googleResult.value as GoogleVisionDataType)
        : null;
    
    // Log what we got from OpenAI for debugging
    if (openAIEnrichment) {
      console.log('🔍 OpenAI enrichment result:', {
        hasData: true,
        hasTitle: !!openAIEnrichment.title,
        hasDescription: !!openAIEnrichment.description,
        hasCategory: !!openAIEnrichment.category,
        hasEstimatedPrice: !!openAIEnrichment.estimatedPrice,
        estimatedPrice: openAIEnrichment.estimatedPrice,
        category: openAIEnrichment.category,
        title: openAIEnrichment.title || 'MISSING',
      });
    } else {
      console.log('🔍 OpenAI enrichment result: null');
    }
    const processedImageUrl: string = (processedImageUrlResult.status === 'fulfilled' && 
      processedImageUrlResult.value && 
      typeof processedImageUrlResult.value === 'string')
      ? processedImageUrlResult.value
      : originalUrl;
    const backgroundRemoved = processedImageUrlResult.status === 'fulfilled' && processedImageUrlResult.value !== null;

    // Check if new image is different from existing image (for price stabilization)
    // Note: Since we always upload a new file with a new filename, URL comparison is imperfect.
    // The "no new image" condition is approximated by checking if existingListingId was provided.
    // In practice, if existingListingId is provided and other conditions are met, we stabilize.
    const hasNewImage = !existingImageUrl || originalUrl !== existingImageUrl;

    // Step 2.6: PARALLEL POST-PROCESSING - Run independent operations that depend on OpenAI results
    // OPTIMIZATION: eBay pricing, attribute categorization, and embedding generation can all run in parallel
    // since they all depend on OpenAI results but are independent of each other
    
    const openAITitle = openAIEnrichment?.title || userInput?.title;
    const openAIDescription = openAIEnrichment?.description || userInput?.description || '';
    const openAIAttributes = openAIEnrichment?.attributes || [];
    
    // Prepare data for post-processing tasks
    const postProcessingTasks = [];
    
    // PRICING SOURCES: Run all pricing lookups in parallel (priority: 1st Dibs > Etsy > eBay > Apify)
    // Placeholder functions - will be implemented as scrapers are researched
    const pricingTasks = [];
    
    // Priority 1: 1st Dibs (high-end vintage/antiques - best for unique items)
    if (openAITitle && openAITitle !== 'New Listing') {
      pricingTasks.push(
        getFirstDibsPricing(openAITitle).catch((err) => {
          console.error('⚠️ 1st Dibs pricing lookup failed:', err);
          return null;
        })
      );
    }
    
    // Priority 2: Etsy (vintage/unique items - better than eBay for niche items)
    if (openAITitle && openAITitle !== 'New Listing') {
      pricingTasks.push(
        getEtsyPricing(openAITitle).catch((err) => {
          console.error('⚠️ Etsy pricing lookup failed:', err);
          return null;
        })
      );
    }
    
    // Priority 3: eBay (broader market - current fallback)
    const ebayPricingTask = (process.env.EBAY_APP_ID && openAITitle && openAITitle !== 'New Listing')
      ? getEbayPricing(openAITitle).catch((err) => {
          console.error('⚠️ eBay pricing lookup failed:', err);
          return null;
        })
      : Promise.resolve(null);
    pricingTasks.push(ebayPricingTask);
    
    // Priority 4: Apify (generic scraper platform - optional)
    if (openAITitle && openAITitle !== 'New Listing') {
      pricingTasks.push(
        getApifyPricing(openAITitle).catch((err) => {
          console.error('⚠️ Apify pricing lookup failed:', err);
          return null;
        })
      );
    }
    
    // Run all pricing sources in parallel, then select best result
    const pricingTask = Promise.allSettled(pricingTasks).then((results) => {
      // Extract successful results with proper typing
      const successfulResults: Array<{
        minPrice: number;
        maxPrice: number;
        avgPrice: number;
        recentSales: number;
        source: 'firstdibs' | 'etsy' | 'ebay' | 'apify';
      }> = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          const source = index === 0 ? 'firstdibs' : index === 1 ? 'etsy' : index === 2 ? 'ebay' : 'apify';
          successfulResults.push({ ...result.value, source });
        }
      });
      
      // Priority selection: 1st Dibs > Etsy > eBay > Apify
      // Use first successful result in priority order
      if (successfulResults.length > 0) {
        return successfulResults[0];
      }
      return null;
    });
    
    postProcessingTasks.push(pricingTask);
    
    // Task 2: Attribute Categorization (if we have attributes)
    const categorizeAttributes = async (attributes: string[], title: string, description: string) => {
      // If no OpenAI key, fall back to simple categorization
      if (!process.env.OPENAI_API_KEY) {
        // Simple keyword-based categorization
        const allText = `${title} ${description} ${attributes.join(' ')}`.toLowerCase();
        
        // Infer intents from keywords
        const intents: string[] = [];
        if (allText.includes('gift') || allText.includes('present') || allText.includes('wedding') || allText.includes('anniversary')) {
          intents.push('gifting');
        }
        if (allText.includes('decor') || allText.includes('display') || allText.includes('home') || allText.includes('vase') || allText.includes('bowl') || allText.includes('plate')) {
          intents.push('home-decor');
        }
        if (allText.includes('collect') || allText.includes('vintage') || allText.includes('antique')) {
          intents.push('collection');
        }
        if (allText.includes('functional') || allText.includes('use') || allText.includes('serve')) {
          intents.push('functional');
        }
        
        // Infer moods from keywords
        const moods: string[] = [];
        const moodKeywords = ['whimsical', 'elegant', 'cozy', 'playful', 'romantic', 'quirky', 'charming', 'delicate', 'bold', 'sophisticated'];
        moodKeywords.forEach(mood => {
          if (allText.includes(mood)) {
            moods.push(mood);
          }
        });
        
        return {
          styles: attributes.slice(0, Math.min(5, attributes.length)),
          moods: moods.slice(0, 3),
          intents: intents.slice(0, 3)
        };
      }

      try {
        const prompt = `Categorize these item attributes into styles, moods, and intents for search.

ITEM:
Title: ${title}
Description: ${description}
Attributes: ${attributes.join(', ')}

CATEGORIZE INTO:
- **styles**: Era (vintage, mid-century, art-deco, etc), materials (brass, ceramic, leather, etc), brands
- **moods**: Emotional vibes (whimsical, elegant, cozy, playful, romantic, quirky, etc)
- **intents**: Use cases (gifting, home-decor, collection, functional, etc)

RULES:
- Only use "vintage" for items clearly from 1920s-1980s
- Avoid generic mood words unless they truly apply
- Infer intents from the type of item (e.g., decorative items → home-decor, personal items → selfish, gift-worthy items → gifting)
- Return 2-4 items per category, prioritize most relevant

Return ONLY valid JSON:
{
  "styles": ["mid-century", "brass"],
  "moods": ["elegant"],
  "intents": ["home-decor", "gifting"]
}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 200,
          }),
        });

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim() || '{}';
        
        // Extract JSON from markdown code blocks if present
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                          content.match(/(\{[\s\S]*\})/);
        
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[1]);
          return {
            styles: result.styles || [],
            moods: result.moods || [],
            intents: result.intents || []
          };
        }
      } catch (error) {
        console.error('Error categorizing attributes:', error);
      }

      // Fallback if AI categorization fails
      return {
        styles: attributes.slice(0, 3),
        moods: [],
        intents: []
      };
    };
    
    const categorizationTask = categorizeAttributes(
      openAIAttributes,
      openAITitle || 'New Listing',
      openAIDescription
    ).catch((err) => {
      console.error('⚠️ Attribute categorization failed:', err);
      return { styles: [], moods: [], intents: [] };
    });
    postProcessingTasks.push(categorizationTask);
    
    // Task 3: Embedding Generation (if we have title/description)
    const embeddingText = `${openAITitle || 'New Listing'} ${openAIDescription} ${openAIAttributes.join(' ')} ${openAIEnrichment?.category || 'General'}`;
    const embeddingTask = (process.env.OPENAI_API_KEY && embeddingText.trim() !== 'New Listing')
      ? generateEmbedding(embeddingText).catch((err) => {
          console.error('⚠️ Embedding generation failed:', err);
          return null;
        })
      : Promise.resolve(null);
    postProcessingTasks.push(embeddingTask);
    
    // Execute all post-processing tasks in parallel
    console.time('Post-Processing (Pricing + Categorization + Embedding)');
    const [pricingResult, categorizationResult, embeddingResult] = await Promise.allSettled(postProcessingTasks);
    console.timeEnd('Post-Processing (Pricing + Categorization + Embedding)');
    
    // Extract results with proper typing
    type PricingIntelligenceType = {
      minPrice: number;
      maxPrice: number;
      avgPrice: number;
      recentSales: number;
      source: 'firstdibs' | 'etsy' | 'ebay' | 'apify' | 'ai_estimate';
    };
    
    let pricingIntelligence: PricingIntelligenceType | null = null;
    if (pricingResult.status === 'fulfilled' && pricingResult.value && 
        typeof pricingResult.value === 'object' && 'source' in pricingResult.value) {
      pricingIntelligence = pricingResult.value as PricingIntelligenceType;
      console.log(`💰 Pricing from ${pricingIntelligence.source}:`, pricingIntelligence);
    }
    
    type CategorizedType = {
      styles: string[];
      moods: string[];
      intents: string[];
    };
    
    const categorized: CategorizedType = categorizationResult.status === 'fulfilled' && 
      categorizationResult.value &&
      typeof categorizationResult.value === 'object' &&
      'styles' in categorizationResult.value
        ? (categorizationResult.value as CategorizedType)
        : { styles: [], moods: [], intents: [] };
    
    const embedding = embeddingResult.status === 'fulfilled' 
      ? embeddingResult.value 
      : null;

    // Step 2.7: Price Stabilization - clamp price if existing listing has AI price and no new external pricing
    let priceBasis: 'ebay' | 'ai_estimate' | 'stabilized' | null = null;
    let priceConfidence: number | null = null;
    let finalPrice: number | null = null;

    // Determine final price with stabilization logic
    if (userInput?.price !== undefined && userInput.price !== null) {
      // User provided explicit price - use it (no stabilization)
      finalPrice = userInput.price;
      priceBasis = 'ebay'; // User input treated as explicit
      priceConfidence = 1.0;
    } else if (pricingIntelligence && pricingIntelligence.avgPrice) {
      // External pricing source (1st Dibs/Etsy/eBay/Apify) found - use it (no stabilization)
      finalPrice = pricingIntelligence.avgPrice;
      priceBasis = 'ebay'; // Price basis tracks external source, but we use 'ebay' for database compatibility
      priceConfidence = pricingIntelligence.recentSales > 0 ? 0.9 : 0.7; // Higher confidence with sales data
    } else if (openAIEnrichment?.estimatedPrice) {
      // AI estimate available - check if stabilization should apply
      const aiPrice = openAIEnrichment.estimatedPrice;

      // Price stabilization conditions:
      // 1. Existing listing exists (existingListingId provided)
      // 2. Existing listing has a price
      // 3. No new external pricing source (eBay) found
      // 4. No new image uploaded - Note: Since we always upload new files with new filenames, URL comparison
      //    is unreliable. For now, we apply stabilization when existingListingId is provided (update scenario).
      //    In the future, we could add image hash comparison or a flag parameter for better accuracy.
      // Note: price_basis, price_confidence, and price_last_updated_at columns don't exist yet, so we only check if price exists
      const shouldStabilize = existingListing && 
        existingListing.price && 
        !pricingIntelligence; // No eBay pricing found
      // Note: hasNewImage check is skipped since URL comparison is unreliable with new filenames

      if (shouldStabilize && existingListing && existingListing.price) {
        // Apply price stabilization: clamp to ±20% of existing price
        const existingPrice = existingListing.price;
        const minPrice = existingPrice * 0.8;
        const maxPrice = existingPrice * 1.2;
        
        finalPrice = Math.max(minPrice, Math.min(maxPrice, aiPrice));
        priceBasis = 'stabilized';
        priceConfidence = 0.6; // Lower confidence for stabilized prices

        console.log(`💰 Price stabilized: AI suggested ${aiPrice}, clamped to ${finalPrice} (±20% of existing ${existingPrice})`);
      } else {
        // Use AI estimate directly (no stabilization needed)
        finalPrice = aiPrice;
        priceBasis = 'ai_estimate';
        priceConfidence = 0.7;
      }
      
      // Create pricingIntelligence from AI estimate if we don't have eBay data
      if (!pricingIntelligence && finalPrice) {
        pricingIntelligence = {
          minPrice: Math.round(finalPrice * 0.7),
          maxPrice: Math.round(finalPrice * 1.3),
          avgPrice: finalPrice,
          recentSales: 0,
          source: 'ai_estimate' as const,
        };
        console.log('💰 Created pricingIntelligence from AI estimate:', pricingIntelligence);
      }
    } else {
      // No price available
      finalPrice = null;
    }

    // Step 3: COMBINE RESULTS - OpenAI Vision (primary) + Google Vision (supplementary)
    // REVERT: Strategy - OpenAI Vision provides title/category/description (PRIMARY),
    // Google Vision provides additional tags/attributes only (SUPPLEMENTARY)
    
    let visionData = {
      category: userInput?.category || openAIEnrichment?.category || googleVisionData?.category || 'General',
      attributes: [] as string[],
      suggestedTitle: '',
      suggestedDescription: '',
      suggestedPrice: openAIEnrichment?.estimatedPrice || null,
    };

    let listing = {
      title: userInput?.title || 'New Listing',
      description: userInput?.description || '',
    };

    // PRIMARY SOURCE: OpenAI Vision for product identification (title, category, description, attributes)
    if (openAIEnrichment) {
      // Use OpenAI title as primary (accurate product identification)
      listing.title = openAIEnrichment.title || listing.title;
      visionData.category = openAIEnrichment.category || visionData.category;
      listing.description = openAIEnrichment.description || listing.description;
      visionData.attributes = openAIEnrichment.attributes || [];
      visionData.suggestedTitle = openAIEnrichment.title || '';
      visionData.suggestedDescription = openAIEnrichment.description || '';

      // Note: OpenAI price estimate is handled in price stabilization logic above
      // We don't create pricingIntelligence here to allow stabilization to work properly
    } else if (googleVisionData) {
      // FALLBACK: If OpenAI failed, use Google Vision for basic identification
      // REVERT: Google Vision becomes fallback only when OpenAI fails
      listing.title = googleVisionData.title || listing.title;
      visionData.category = googleVisionData.category || visionData.category;
      visionData.attributes = googleVisionData.attributes || [];
      visionData.suggestedTitle = googleVisionData.title || '';
    }

    // SUPPLEMENTARY SOURCE: Google Vision adds extra tags/attributes to OpenAI's results
    if (googleVisionData && openAIEnrichment) {
      // Merge Google Vision attributes with OpenAI attributes (avoid duplicates)
      // Google Vision supplements OpenAI's attributes with additional labels/tags
      const googleAttributes = googleVisionData.attributes || [];
      const combinedAttributes = [
        ...visionData.attributes, // Start with OpenAI attributes (already post-processed)
        ...googleAttributes // Add Google tags (will be post-processed below)
      ];

      // Add brand info from Google Vision if detected (supplementary information)
      if (googleVisionData.brandInfo) {
        combinedAttributes.push(googleVisionData.brandInfo);
      }

      // Post-process final combined attributes: normalize, deduplicate, filter, limit
      visionData.attributes = postProcessTags(combinedAttributes, 8);
    } else if (googleVisionData && !openAIEnrichment) {
      // If OpenAI failed, use Google Vision attributes (post-process them)
      const googleAttributes = googleVisionData.attributes || [];
      const attributesToProcess = googleVisionData.brandInfo
        ? [googleVisionData.brandInfo, ...googleAttributes]
        : googleAttributes;
      visionData.attributes = postProcessTags(attributesToProcess, 8);
    }

    // Step 4: Results from parallel post-processing are already extracted above
    // (eBay pricing, categorization, and embedding all completed in parallel)

    // Step 5: Create listing in database (same schema, all fields preserved)
    const listingInsert: any = {
      seller_id: sellerId,
      title: userInput?.title || listing.title,
      description: userInput?.description || listing.description,
      // Save AI-generated content to separate columns
      ai_generated_title: visionData.suggestedTitle || listing.title || null,
      ai_generated_description: visionData.suggestedDescription || listing.description || null,
      price: finalPrice,
      // Note: price_basis, price_confidence, and price_last_updated_at columns don't exist yet
      // Clamp logic is kept in code above but values are not stored
      category: userInput?.category || visionData.category,
      original_image_url: originalUrl,
      clean_image_url: processedImageUrl !== originalUrl ? processedImageUrl : null,
      staged_image_url: null,
      status: 'draft',
      styles: categorized.styles || [],
      moods: categorized.moods || [],
      intents: categorized.intents || [],
      embedding: embedding,
    };

    const { data: listingData, error: listingError } = await supabase
      .from('listings')
      .insert(listingInsert)
      .select()
      .single();

    if (listingError) {
      throw new Error(`Listing creation failed: ${listingError.message}`);
    }

    // Timing diagnostics: End total upload timing before returning success
    console.timeEnd('Total Upload');

    return {
      success: true,
      listingId: listingData.id,
      data: {
        processedImageUrl: processedImageUrl,
        originalImageUrl: originalUrl,
        backgroundRemoved: backgroundRemoved,
        suggestedTitle: listing.title,
        suggestedDescription: listing.description,
        detectedCategory: visionData.category,
        detectedAttributes: visionData.attributes,
        pricingIntelligence: (() => {
          // Use existing pricingIntelligence if available
          if (pricingIntelligence && 'minPrice' in pricingIntelligence) {
            console.log('💰 Using existing pricingIntelligence:', pricingIntelligence);
            return {
              minPrice: pricingIntelligence.minPrice,
              maxPrice: pricingIntelligence.maxPrice,
              avgPrice: pricingIntelligence.avgPrice,
              recentSales: pricingIntelligence.recentSales,
              source: pricingIntelligence.source as 'firstdibs' | 'etsy' | 'ebay' | 'apify' | 'ai_estimate',
            };
          }
          // Otherwise create from finalPrice if available
          if (finalPrice) {
            const created = {
              minPrice: Math.round(finalPrice * 0.7),
              maxPrice: Math.round(finalPrice * 1.3),
              avgPrice: finalPrice,
              recentSales: 0,
              source: (priceBasis === 'ebay' ? 'ebay' : (priceBasis === 'stabilized' ? 'ai_estimate' : 'ai_estimate')) as 'firstdibs' | 'etsy' | 'ebay' | 'apify' | 'ai_estimate',
            };
            console.log('💰 Created pricingIntelligence from finalPrice:', created);
            return created;
          }
          console.warn('⚠️ No pricingIntelligence and no finalPrice available');
          return undefined;
        })(),
      },
    };
  } catch (error) {
    // Timing diagnostics: End total upload timing on error as well
    console.timeEnd('Total Upload');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// OpenAI Vision with hypotheses-based approach for buyer-first marketplace
// Returns multiple hypotheses with evidence, confidence levels, and observational language
async function analyzeWithOpenAI(imageUrl: string): Promise<{
  title: string; // Extracted from listing_copy.title
  description: string; // Extracted from listing_copy.description
  category: string; // Extracted from recommended hypothesis category_id
  attributes: string[]; // Extracted from id_tags + distinctive visual_cues
  estimatedPrice: number | null; // Average of pricing range
  styles?: string[]; // Extracted from style_tags
  moods?: string[]; // Extracted from mood_tags
  intents?: string[]; // Not provided in new structure, empty array
  era?: string; // Not provided in new structure
}> {
  const prompt = `You are assisting a buyer-first secondhand marketplace.

Your job is NOT to produce a single definitive identification.
Your job is to surface plausible interpretations, uncertainty, and visual evidence,
and to avoid resale boilerplate or inflated claims.

You must think in hypotheses, not answers.

Hard rules:
- Return EXACTLY 3 hypotheses.
- Do NOT claim "rare," "antique," "vintage," "authentic," or a specific maker unless
  there is clear visual evidence (mark, stamp, unmistakable pattern or silhouette).
- NEVER mention condition, wear, age, patina, or "wear consistent with age" in descriptions unless seller explicitly provides condition notes. Do NOT infer condition from images.
- If confidence is low or competing hypotheses are close, say so.
- Favor buyer trust over seller reassurance.
- Do NOT state the obvious (e.g., "it is black," "rectangular," "has wheels") unless that fact
  meaningfully disambiguates hypotheses or affects buyer desirability.
- Evidence must be DISTINCTIVE: markings, motifs, hardware, functional features,
  era signals, maker marks, pattern signatures. (Do NOT use patina/crazing as evidence unless explicitly relevant to identification.)
- Titles must avoid filler like "with marking" or "with text".
- Output tags in 3 groups:
  - id_tags: concrete identifiers (brand/pattern/object type) - for hidden indexing only
  - style_tags: design vocabulary that aids buyer discovery (mid-century, industrial, farmhouse)
  - mood_tags: emotional/nostalgic associations that aid buyer discovery (nostalgic, cozy, playful)
- Tags are NOT labels or classifications. Tags must serve buyer discovery and browsing. They should answer: "Why would someone click this?"
- Tags must reflect ONE of: a collecting community, a style or aesthetic, a nostalgic or emotional association, a plausible buyer use or display context.
- Do NOT output: category labels ("railroad name", "toy", "object", "design"), obvious physical attributes (color, shape, material), tags that restate title/brand, construction quality descriptors, collectibility speculations, condition descriptions.
- Tags should be written as natural phrases a human might browse, not technical descriptors.
- If no meaningful discovery tags can be inferred, return empty arrays.
- Do not output tags like "black color", "rectangular shape", "wheels visible", "realistic design", "detailed construction", "wear consistent with age", "miniature", "toy", "features", "design resembles", "railroad name", "model train", "tender car".

Seller Keywords (separate from discovery tags):
- Generate 3-6 helpful, plain-language keywords a seller might reasonably use for this item.
- Use concrete, commonly understood words.
- Avoid meta labels (e.g., "railroad name", "object", "design").
- Avoid condition claims unless explicitly visible.
- Brand names are allowed once.
- Obvious terms (e.g., "train", "toy", "decor") ARE allowed (different from discovery tags - these are starter keywords).
- Do not invent rarity, era, or value.
- If unsure, choose the most neutral, broadly useful terms.
- The goal is to help a seller get started, not to perfectly classify the item.

Output JSON only. No prose outside JSON.
Analyze the image(s) provided.

CATEGORY TAXONOMY (choose exactly one):
- Kitchen & Dining
- Home Decor
- Collectibles
- Books & Media
- Furniture
- Art
- Electronics
- Fashion
- Jewelry
- Toys & Games
- Sports & Outdoors
- General (only if item doesn't fit any other category)

Return the following JSON structure:

{
  "hypotheses": [
    {
      "label": "plain-English object interpretation",
      "category_id": "must be EXACTLY one of the categories listed above",
      "confidence_vision": 0.00,
      "evidence": {
        "visual_cues": ["short, concrete visual observations"],
        "text_cues": ["any visible text or markings, else empty array"]
      },
      "common_confusions": ["what this is often mistaken for"]
    }
  ],
  "recommended": {
    "choice": "label of best hypothesis OR 'needs_confirmation'",
    "reason": "1 short sentence explaining why"
  },
  "listing_copy": {
    "title": "softly worded title; hedge if uncertain. IMPORTANT: If you detect a brand name in text_cues or visual evidence (e.g., 'Lily Pulitzer', 'Coach', visible logos/markings), ALWAYS include the brand name prominently in the title (at the start or early). Brand names are crucial for buyer discovery and should not be omitted.",
    "description": "1-2 sentences placing object in buyer's context. Answer at least one: Where might this live? (shelf, desk, display, collection) Who would be drawn to it? (collector, nostalgia buyer, gift) What feeling does it evoke? Do NOT mention condition, wear, age, patina, or 'wear consistent with age' unless seller explicitly provides condition notes. Do NOT infer condition from images. Do NOT restate obvious visual facts. Buyer-facing context only.",
    "ask_for_confirmation": "ONE short sentence asking for a specific photo or detail IF needed"
  },
  "pricing": {
    "estimated_range_low": number,
    "estimated_range_high": number,
    "rationale": "1 sentence grounded in comparable resale, not hype"
  },
  "id_tags": ["concrete identifiers like brand, pattern, object type"],
  "style_tags": ["design vocabulary like mid-century, industrial, farmhouse"],
  "mood_tags": ["emotional vibe like nostalgic, cozy, playful"],
  "seller_keywords": ["3-6 plain-language keywords like train, toy, model, decor, railroad, collectible - obvious terms ARE allowed"]
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o', // Using full model for quality - user prefers quality over speed
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI Vision API failed: ${response.status}`);
  }

  const data = await response.json();
  let content = data.choices?.[0]?.message?.content?.trim() || '{}';

  // Log raw content for debugging JSON parsing issues
  console.log('📝 OpenAI raw response length:', content.length);
  if (content.length > 2000) {
    console.log('📝 OpenAI response preview (first 500 chars):', content.substring(0, 500));
    console.log('📝 OpenAI response preview (last 500 chars):', content.substring(content.length - 500));
  }

  // Clean up the response - remove markdown code blocks if present
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  // Extract JSON from response
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1) {
    content = content.substring(firstBrace, lastBrace + 1);
  }

  // Try to fix common JSON issues before parsing
  try {
    // Remove trailing commas before closing braces/brackets
    content = content.replace(/,(\s*[}\]])/g, '$1');
    // Fix unescaped quotes in strings (basic attempt)
    // This is tricky, so we'll be conservative
  } catch (e) {
    console.warn('⚠️ JSON cleanup failed, proceeding with original:', e);
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
    
    // Extract data from new hypotheses-based structure
    // Find the recommended hypothesis
    const recommendedChoice = parsed.recommended?.choice || '';
    const recommendedHypothesis = parsed.hypotheses?.find((h: any) => h.label === recommendedChoice) || parsed.hypotheses?.[0];
    
    // Extract title and description from listing_copy
    const title = parsed.listing_copy?.title || recommendedHypothesis?.label || 'New Listing';
    const description = parsed.listing_copy?.description || '';
    
    // Extract title for tag validation (to reject tags that restate the title)
    const listingTitle = title;
    
    // Extract category from recommended hypothesis, or try all hypotheses, or check if it's in the root
    let category = 'General';
    if (recommendedHypothesis?.category_id) {
      category = recommendedHypothesis.category_id;
    } else if (parsed.hypotheses && Array.isArray(parsed.hypotheses)) {
      // Try to find category from any hypothesis
      for (const hypothesis of parsed.hypotheses) {
        if (hypothesis.category_id) {
          category = hypothesis.category_id;
          break;
        }
      }
    }
    // If still General, check if category is at root level (some responses might have it there)
    if (category === 'General' && parsed.category) {
      category = parsed.category;
    }
    
    // Validate category against known taxonomy
    const validCategories = [
      'Kitchen & Dining', 'Home Decor', 'Collectibles', 'Books & Media',
      'Furniture', 'Art', 'Electronics', 'Fashion', 'Jewelry',
      'Toys & Games', 'Sports & Outdoors', 'General'
    ];
    if (!validCategories.includes(category)) {
      console.warn('⚠️ Invalid category from AI:', category, '- defaulting to General');
      category = 'General';
    }
    
    console.log('📂 Extracted category:', category, {
      fromRecommended: !!recommendedHypothesis?.category_id,
      recommendedCategoryId: recommendedHypothesis?.category_id,
      fromHypotheses: parsed.hypotheses?.some((h: any) => h.category_id),
      hypothesesCategories: parsed.hypotheses?.map((h: any) => h.category_id).filter(Boolean),
      fromRoot: !!parsed.category,
      rootCategory: parsed.category,
      isValid: validCategories.includes(category),
    });
    
    // Extract tag groups: id_tags, style_tags, mood_tags, seller_keywords
    const idTags = Array.isArray(parsed.id_tags) ? parsed.id_tags : [];
    const styleTags = Array.isArray(parsed.style_tags) ? parsed.style_tags : [];
    const moodTags = Array.isArray(parsed.mood_tags) ? parsed.mood_tags : [];
    const sellerKeywords = Array.isArray(parsed.seller_keywords) ? parsed.seller_keywords : [];
    
    // Seller keywords are extracted but not processed (they're for seller use, not stored in database)
    // They can be used in the UI to help sellers get started with their listing
    
    // Clean tag arrays - remove any JSON syntax characters and filter empty strings
    const cleanTags = (tags: any[]): string[] => {
      return tags.map((tag: any) => {
        let cleaned = String(tag).trim();
        cleaned = cleaned.replace(/^[\["\s]+|[\]"\s]+$/g, '');
        cleaned = cleaned.replace(/["\[\]]/g, '');
        cleaned = cleaned.replace(/,([^\s])/g, ', $1');
        return cleaned;
      }).filter((tag: string) => tag.length > 0);
    };
    
    const cleanIdTags = cleanTags(idTags);
    const cleanStyleTags = cleanTags(styleTags);
    const cleanMoodTags = cleanTags(moodTags);
    
    // Extract attributes from evidence.visual_cues (combine with id_tags for comprehensive attributes)
    // Use id_tags as primary attributes (concrete identifiers), supplement with distinctive visual cues
    const allVisualCues: string[] = [];
    if (parsed.hypotheses && Array.isArray(parsed.hypotheses)) {
      parsed.hypotheses.forEach((hypothesis: any) => {
        if (hypothesis.evidence?.visual_cues && Array.isArray(hypothesis.evidence.visual_cues)) {
          allVisualCues.push(...hypothesis.evidence.visual_cues);
        }
        // Also include text cues as attributes
        if (hypothesis.evidence?.text_cues && Array.isArray(hypothesis.evidence.text_cues)) {
          allVisualCues.push(...hypothesis.evidence.text_cues);
        }
      });
    }
    
    // Rank and select tags using tag budget system:
    // - Max 2 ID tags
    // - 2-3 style tags  
    // - 2-3 mood tags
    // Total: 6-8 tags max, ranked by informativeness, distinctiveness, and buyer browsing value
    const rankedTags = rankAndSelectTags(cleanIdTags, cleanStyleTags, cleanMoodTags, listingTitle);
    
    // Use ranked tags for styles and moods (these go into database)
    const processedStyles = rankedTags.styleTags;
    const processedMoods = rankedTags.moodTags;
    
    // For attributes, use ranked ID tags (max 2) plus distinctive visual cues
    // Attributes combine ID tags with visual evidence from the image analysis
    const combinedAttributes = new Set([
      ...rankedTags.idTags, // Use ranked ID tags (max 2) instead of all cleanIdTags
      ...allVisualCues.map((cue: any) => String(cue).trim()).filter((cue: string) => cue.length > 0)
    ]);
    
    // Process attributes: normalize, deduplicate brands, filter meta tags, validate, limit to most informative
    // Apply brand deduplication and validation to attributes as well
    let attributesArray = Array.from(combinedAttributes);
    attributesArray = deduplicateBrandTags(attributesArray);
    attributesArray = attributesArray.filter(tag => isValidTagForDisplay(tag, listingTitle));
    const processedAttributes = postProcessTags(attributesArray, 8);
    
    // Calculate average price from range
    let estimatedPrice: number | null = null;
    if (parsed.pricing?.estimated_range_low && parsed.pricing?.estimated_range_high) {
      estimatedPrice = Math.round((parsed.pricing.estimated_range_low + parsed.pricing.estimated_range_high) / 2);
      console.log('💰 Extracted price from range:', {
        low: parsed.pricing.estimated_range_low,
        high: parsed.pricing.estimated_range_high,
        avg: estimatedPrice,
      });
    } else {
      console.warn('⚠️ No pricing range in response:', {
        hasPricing: !!parsed.pricing,
        hasLow: !!parsed.pricing?.estimated_range_low,
        hasHigh: !!parsed.pricing?.estimated_range_high,
        pricingKeys: parsed.pricing ? Object.keys(parsed.pricing) : [],
        pricingObject: parsed.pricing,
      });
      
      // Try to extract price from raw content as fallback even if JSON parsed
      const priceLowMatch = content.match(/"estimated_range_low"\s*:\s*(\d+)/i);
      const priceHighMatch = content.match(/"estimated_range_high"\s*:\s*(\d+)/i);
      if (priceLowMatch && priceHighMatch) {
        const low = parseInt(priceLowMatch[1]);
        const high = parseInt(priceHighMatch[1]);
        estimatedPrice = Math.round((low + high) / 2);
        console.log('✅ Extracted price from raw content fallback:', estimatedPrice);
      }
    }
    
    return {
      title: title,
      description: description,
      category: category,
      attributes: processedAttributes, // Post-processed: normalized, deduplicated, filtered, limited
      estimatedPrice: estimatedPrice,
      styles: processedStyles, // Post-processed: normalized, deduplicated, filtered, limited
      moods: processedMoods, // Post-processed: normalized, deduplicated, filtered, limited
      intents: [], // Not provided in new structure, keep empty
      era: undefined, // Not provided in new structure
    };
  } catch (e) {
    // Failed to parse AI response - log details and try to extract partial data
    console.error('❌ Failed to parse OpenAI hypotheses response:', e);
    if (e instanceof SyntaxError) {
      console.error('📝 JSON parse error at position:', (e as any).message);
      // Log the problematic section
      const errorPos = (e as any).message.match(/position (\d+)/)?.[1];
      if (errorPos) {
        const pos = parseInt(errorPos);
        const start = Math.max(0, pos - 100);
        const end = Math.min(content.length, pos + 100);
        console.error('📝 Problematic JSON section:', content.substring(start, end));
      }
    }
    
    // Try to extract at least the title from the raw content as a fallback
    let fallbackTitle = 'New Listing';
    const titleMatch = content.match(/"title"\s*:\s*"([^"]+)"/i) || 
                      content.match(/title["\s:]+([^",}\n]+)/i) ||
                      content.match(/"listing_copy"\s*:\s*\{[^}]*"title"\s*:\s*"([^"]+)"/i);
    if (titleMatch && titleMatch[1]) {
      fallbackTitle = titleMatch[1].trim().slice(0, 80);
      console.log('✅ Extracted fallback title from raw content:', fallbackTitle);
    }
    
    // Try to extract description
    let fallbackDescription = '';
    const descMatch = content.match(/"description"\s*:\s*"([^"]+)"/i) ||
                     content.match(/"listing_copy"\s*:\s*\{[^}]*"description"\s*:\s*"([^"]+)"/i);
    if (descMatch && descMatch[1]) {
      fallbackDescription = descMatch[1].trim();
      console.log('✅ Extracted fallback description from raw content');
    }
    
    // Try to extract category from raw content
    let fallbackCategory = 'General';
    const categoryMatch = content.match(/"category_id"\s*:\s*"([^"]+)"/i) ||
                         content.match(/"category"\s*:\s*"([^"]+)"/i);
    if (categoryMatch && categoryMatch[1]) {
      const extractedCategory = categoryMatch[1].trim();
      const validCategories = [
        'Kitchen & Dining', 'Home Decor', 'Collectibles', 'Books & Media',
        'Furniture', 'Art', 'Electronics', 'Fashion', 'Jewelry',
        'Toys & Games', 'Sports & Outdoors', 'General'
      ];
      if (validCategories.includes(extractedCategory)) {
        fallbackCategory = extractedCategory;
        console.log('✅ Extracted fallback category from raw content:', fallbackCategory);
      }
    }
    
    // Try to extract price from raw content
    let fallbackPrice: number | null = null;
    // Look for estimated_range_low and estimated_range_high
    const priceLowMatch = content.match(/"estimated_range_low"\s*:\s*(\d+)/i);
    const priceHighMatch = content.match(/"estimated_range_high"\s*:\s*(\d+)/i);
    if (priceLowMatch && priceHighMatch) {
      const low = parseInt(priceLowMatch[1]);
      const high = parseInt(priceHighMatch[1]);
      fallbackPrice = Math.round((low + high) / 2);
      console.log('✅ Extracted fallback price from raw content:', fallbackPrice);
    } else {
      // Try to find a single price value
      const singlePriceMatch = content.match(/"estimatedPrice"\s*:\s*(\d+)/i) ||
                              content.match(/"price"\s*:\s*(\d+)/i);
      if (singlePriceMatch) {
        fallbackPrice = parseInt(singlePriceMatch[1]);
        console.log('✅ Extracted fallback single price from raw content:', fallbackPrice);
      }
    }
    
    return {
      title: fallbackTitle,
      description: fallbackDescription,
      category: fallbackCategory,
      attributes: [],
      estimatedPrice: fallbackPrice,
      styles: [],
      moods: [],
      intents: [],
    };
  }
}

export async function removeBackground(imageFile: File | Buffer): Promise<string> {
  const formData = new FormData();
  
  if (imageFile instanceof File) {
    formData.append('image_file', imageFile);
  } else {
    const uint8Array = new Uint8Array(imageFile);
    const blob = new Blob([uint8Array], { type: 'image/jpeg' });
    formData.append('image_file', blob, 'image.jpg');
  }
  
  formData.append('size', 'auto');
  formData.append('format', 'png');

  const response = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': process.env.REMOVE_BG_KEY! },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Remove.bg failed: ${response.status} - ${errorText}`);
  }

  const processedImageBuffer = await response.arrayBuffer();
  
  const filename = `processed-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
  const { error } = await supabase.storage
    .from('listings')
    .upload(filename, new Uint8Array(processedImageBuffer), {
      contentType: 'image/png',
      upsert: false,
    });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage
    .from('listings')
    .getPublicUrl(filename);

  return publicUrl;
}

// REVERT: Google Vision is SECONDARY/SUPPLEMENTARY - only provides additional tags/attributes
// Renamed from analyzeImage() to analyzeWithGoogleVision() for clarity
// Runs in parallel with OpenAI but only supplements OpenAI's results with extra labels/tags
async function analyzeWithGoogleVision(imageUrl: string): Promise<{
  title: string; // Included for fallback scenarios, but OpenAI is primary
  category: string; // Included for fallback scenarios, but OpenAI is primary
  attributes: string[]; // SUPPLEMENTARY: Additional tags/labels to merge with OpenAI attributes
  brandInfo?: string; // SUPPLEMENTARY: Brand information if detected
}> {
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${process.env.VISION_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { source: { imageUri: imageUrl } },
          features: [
            // NOTE: PRODUCT_SEARCH requires a Product Set to be configured in Google Cloud Console
            // If not configured, this feature will be skipped by the API, and we'll use WEB_DETECTION fallback
            { type: 'PRODUCT_SEARCH', maxResults: 5 }, // REFACTOR: Added for faster/better product ID (optional)
            { type: 'LABEL_DETECTION', maxResults: 10 },
            { type: 'OBJECT_LOCALIZATION', maxResults: 5 },
            { type: 'TEXT_DETECTION', maxResults: 10 }, // For OCR/text cues
            { type: 'LOGO_DETECTION', maxResults: 5 }, // For logo detection
            { type: 'WEB_DETECTION', maxResults: 10 },  // Like Google Lens! (Gated - only if text/logo detected)
          ],
        }],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Google Vision API failed: ${response.status}`);
  }

  const data = await response.json();
  
  // Debug: Log the full response to see what we're getting
  console.log('📸 Google Vision API Response:', {
    hasLabels: !!data.responses?.[0]?.labelAnnotations,
    hasObjects: !!data.responses?.[0]?.localizedObjectAnnotations,
    hasWebDetection: !!data.responses?.[0]?.webDetection,
    hasProductSearch: !!data.responses?.[0]?.productSearchResults, // REFACTOR: Added product search logging
    webEntitiesCount: data.responses?.[0]?.webDetection?.webEntities?.length || 0,
    hasBestGuess: !!data.responses?.[0]?.webDetection?.bestGuessLabels
  });
  
  const labels = data.responses?.[0]?.labelAnnotations || [];
  const objects = data.responses?.[0]?.localizedObjectAnnotations || [];
  const textAnnotations = data.responses?.[0]?.textAnnotations || []; // OCR/text detection
  const logoAnnotations = data.responses?.[0]?.logoAnnotations || []; // Logo detection
  const webDetection = data.responses?.[0]?.webDetection || {};
  const productSearch = data.responses?.[0]?.productSearchResults || {}; // REFACTOR: Extract product search results

  // Material/surface stoplist - common words that are NOT brands
  const materialStoplist = new Set([
    'hardwood', 'oak', 'maple', 'table', 'wood', 'floor', 'pine', 'cherry', 'walnut',
    'mahogany', 'birch', 'cedar', 'ash', 'elm', 'fir', 'spruce', 'teak', 'bamboo',
    'metal', 'steel', 'iron', 'brass', 'copper', 'bronze', 'aluminum', 'silver', 'gold',
    'plastic', 'ceramic', 'porcelain', 'glass', 'crystal', 'stone', 'marble', 'granite',
    'tile', 'fabric', 'cloth', 'leather', 'canvas', 'cotton', 'wool', 'silk', 'linen',
    'surface', 'finish', 'paint', 'stain', 'varnish', 'lacquer', 'polish'
  ]);

  // Check if web detection should run:
  // 1. OCR/text cues contain at least one token > 3 chars that is not a material word, OR
  // 2. Logo detection returns candidates
  let shouldRunWebDetection = false;
  
  // Check logo detection
  if (logoAnnotations && logoAnnotations.length > 0) {
    shouldRunWebDetection = true;
    console.log('✅ Logo detection found candidates, enabling web detection');
  }
  
  // Check text/OCR cues
  if (!shouldRunWebDetection && textAnnotations && textAnnotations.length > 0) {
    // Extract text from annotations (skip first item which is usually full text)
    const textTokens = textAnnotations.slice(1).flatMap((annotation: any) => {
      const text = annotation.description || '';
      return text.split(/\s+/).filter((token: string) => token.length > 3);
    });
    
    // Check if any token is not a material word
    const hasNonMaterialToken = textTokens.some((token: string) => {
      const lowerToken = token.toLowerCase().replace(/[^a-z]/g, '');
      return lowerToken.length > 3 && !materialStoplist.has(lowerToken);
    });
    
    if (hasNonMaterialToken) {
      shouldRunWebDetection = true;
      console.log('✅ Text cues contain non-material tokens, enabling web detection');
    } else {
      console.log('⏭️ Text cues only contain material words, skipping web detection');
    }
  }
  
  if (!shouldRunWebDetection) {
    console.log('⏭️ No text/logo cues found, skipping web detection');
  }

  // REFACTOR: Extract title from product search (if configured) or web detection (primary fallback)
  let title = 'New Listing';
  
  // Try product search first (if Product Set is configured)
  if (productSearch.results && productSearch.results.length > 0) {
    const topProduct = productSearch.results[0];
    title = topProduct.product?.name || topProduct.product?.displayName || title;
    if (title !== 'New Listing') {
      console.log('✅ Product search found title:', title);
    }
  }

  // Fallback to web detection best guess (only if web detection was enabled)
  if (shouldRunWebDetection && title === 'New Listing' && webDetection.bestGuessLabels && webDetection.bestGuessLabels.length > 0) {
    title = webDetection.bestGuessLabels[0].label;
    console.log('📌 Using web detection best guess for title:', title);
  }

  const allLabels = [
    ...labels.map((l: any) => ({ description: l.description, score: l.score })),
    ...objects.map((o: any) => ({ description: o.name, score: o.score })),
  ];

  // Extract brand info from web detection (like Google Lens!) - only if web detection was enabled
  let brandInfo = '';
  
  if (shouldRunWebDetection) {
    console.log('🌐 Web Detection Data:', {
      entities: webDetection.webEntities?.slice(0, 5),
      bestGuess: webDetection.bestGuessLabels?.[0]?.label,
      pagesWithMatching: webDetection.pagesWithMatchingImages?.length || 0
    });
    
    if (webDetection.webEntities) {
      // Web entities often contain brand names with high scores
      const brandEntities = webDetection.webEntities
        .filter((entity: any) => entity.score > 0.5)
        .map((entity: any) => entity.description)
        .slice(0, 5);
      
      console.log('🏷️ Brand entities found:', brandEntities);
      
      if (brandEntities.length > 0) {
        brandInfo = brandEntities.join(', ');
        console.log('✅ Brand detection SUCCESS:', brandInfo);
      } else {
        console.log('❌ No brand entities with score > 0.5');
      }
    }

    // Also check best guess labels from web detection (with stoplist filter)
    if (webDetection.bestGuessLabels && webDetection.bestGuessLabels.length > 0) {
      const bestGuess = webDetection.bestGuessLabels[0].label;
      const lowerBestGuess = bestGuess.toLowerCase();
      
      // Filter out material/surface words from best guess
      const isMaterialWord = materialStoplist.has(lowerBestGuess) || 
        Array.from(materialStoplist).some(material => lowerBestGuess.includes(material));
      
      if (isMaterialWord) {
        console.log('🔍 Best guess from web (filtered - material word):', bestGuess);
      } else {
        console.log('🔍 Best guess from web:', bestGuess);
        
        // Determine if text/marking is brand/manufacturer vs pattern/label
        const isBrand = isBrandOrManufacturer(bestGuess, textAnnotations, materialStoplist);
        
        if (isBrand && !brandInfo.includes(bestGuess) && !title.includes(bestGuess)) {
          // If best guess is a brand/manufacturer and isn't already in title/brand info, add it
          brandInfo = brandInfo ? `${brandInfo}, ${bestGuess}` : bestGuess;
        } else if (!isBrand) {
          console.log('⏭️ Best guess is not a brand/manufacturer, ignoring:', bestGuess);
        }
      }
    }
    
    if (!brandInfo) {
      console.log('⚠️ No brand info detected from web detection');
    }
  } else {
    console.log('⏭️ Web detection skipped (no qualifying text/logo cues)');
  }

  const category = inferCategory(allLabels);
  const attributes = allLabels
    .filter((l: any) => l.score > 0.7)
    .map((l: any) => l.description)
    .slice(0, 5);

  return { title, category, attributes, brandInfo };
}

function inferCategory(labels: Array<{ description: string; score: number }>): string {
  const categoryMap: Record<string, string[]> = {
    'Kitchen & Dining': ['dishware', 'tableware', 'cookware', 'glassware', 'bowl', 'plate', 'cup', 'mug', 'kitchen'],
    'Home Decor': ['vase', 'lamp', 'picture frame', 'sculpture', 'candle', 'mirror', 'decor'],
    'Collectibles': ['figurine', 'toy', 'doll', 'statue', 'antique', 'vintage'],
    'Books & Media': ['book', 'vinyl record', 'cd', 'dvd', 'magazine'],
    'Furniture': ['chair', 'table', 'desk', 'cabinet', 'shelf'],
    'Art': ['painting', 'artwork', 'print', 'canvas', 'art'],
    'Electronics': ['camera', 'radio', 'clock', 'telephone'],
    'Fashion': ['handbag', 'jewelry', 'watch', 'scarf', 'hat', 'clothing'],
  };

  for (const [category, keywords] of Object.entries(categoryMap)) {
    for (const label of labels) {
      if (keywords.some((kw) => label.description.toLowerCase().includes(kw))) {
        return category;
      }
    }
  }

  return 'General';
}

// This function is no longer used but kept for backwards compatibility
async function generateListing(
  visionData: { category: string; attributes: string[] }, 
  userInput?: { title?: string; description?: string }
): Promise<{ title: string; description: string }> {
  const prompt = `You are an expert at writing compelling secondhand marketplace listings.

ITEM DETAILS:
- Category: ${visionData.category}
- Detected attributes: ${visionData.attributes.join(', ')}
- User provided title: ${userInput?.title || 'None'}
- User provided description: ${userInput?.description || 'None'}

IMPORTANT: 
- If a brand name is in the attributes (like "Guy Degrenne", "Coach", etc.), ALWAYS include it prominently in the title
- Brand names should be at the start or very early in the title for SEO

Generate a marketplace listing with:
1. A concise, SEO-friendly title (max 80 characters) - INCLUDE BRAND if detected
2. A compelling description (2-3 sentences)

Return ONLY valid JSON:
{
  "title": "your title here",
  "description": "your description here"
}

Example with brand:
- Attributes include "Guy Degrenne" → Title: "Guy Degrenne Silver-Plated Scalloped Serving Bowl"`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 200,
    }),
  });

  const data = await response.json();
  let content = data.choices?.[0]?.message?.content?.trim() || '{}';

  // Clean up the response
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1) {
    content = content.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(content);
  } catch {
    return { title: 'New Listing', description: '' };
  }
}

// PLACEHOLDER: 1st Dibs pricing scraper
// TODO: Implement when scraper is selected (researching Apify actors)
async function getFirstDibsPricing(searchQuery: string): Promise<{
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  recentSales: number;
} | null> {
  // Placeholder - will implement when scraper is ready
  return null;
}

// PLACEHOLDER: Etsy pricing scraper
// TODO: Implement when scraper is selected (researching Apify actors)
async function getEtsyPricing(searchQuery: string): Promise<{
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  recentSales: number;
} | null> {
  // Placeholder - will implement when scraper is ready
  return null;
}

// PLACEHOLDER: Apify pricing scraper
// TODO: Implement when Apify actor is selected and configured
async function getApifyPricing(searchQuery: string): Promise<{
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  recentSales: number;
} | null> {
  // Placeholder - will implement when Apify actor is ready
  return null;
}

async function getEbayPricing(searchQuery: string): Promise<{
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  recentSales: number;
} | null> {
  const endpoint = 'https://svcs.ebay.com/services/search/FindingService/v1';
  
  const params = new URLSearchParams({
    'OPERATION-NAME': 'findCompletedItems',
    'SERVICE-VERSION': '1.0.0',
    'SECURITY-APPNAME': process.env.EBAY_APP_ID!,
    'RESPONSE-DATA-FORMAT': 'JSON',
    'REST-PAYLOAD': '',
    'keywords': searchQuery,
    'itemFilter(0).name': 'SoldItemsOnly',
    'itemFilter(0).value': 'true',
    'itemFilter(1).name': 'ListingType',
    'itemFilter(1).value': 'FixedPrice',
    'sortOrder': 'EndTimeSoonest',
    'paginationInput.entriesPerPage': '20',
  });

  const response = await fetch(`${endpoint}?${params.toString()}`);
  const data = await response.json();

  const items = data.findCompletedItemsResponse?.[0]?.searchResult?.[0]?.item || [];
  
  if (items.length === 0) return null;

  const prices = items
    .map((item: any) => parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || '0'))
    .filter((price: number) => price > 0);

  if (prices.length === 0) return null;

  return {
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    avgPrice: Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length),
    recentSales: prices.length,
  };
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding generation failed: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}
