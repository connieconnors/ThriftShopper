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

// Check if a tag is redundant/duplicate with other tags
// e.g., "shoe" is redundant if "baby & toddler shoe" exists
function isRedundantTag(tag: string, allTags: string[]): boolean {
  const lowerTag = tag.toLowerCase().trim();
  const normalizeTag = (t: string) => t.toLowerCase().trim();
  
  for (const otherTag of allTags) {
    if (tag === otherTag) continue; // Skip itself
    
    const lowerOther = normalizeTag(otherTag);
    
    // If this tag is a substring of another tag (and the other is longer), it's redundant
    // e.g., "shoe" is redundant if "baby & toddler shoe" exists
    if (lowerOther.includes(lowerTag) && lowerOther.length > lowerTag.length) {
      // But only if the longer tag contains the shorter as a complete word or at word boundaries
      const wordBoundaryMatch = new RegExp(`\\b${lowerTag}\\b`).test(lowerOther);
      if (wordBoundaryMatch || lowerOther.startsWith(lowerTag + ' ') || lowerOther.endsWith(' ' + lowerTag)) {
        return true; // This tag is redundant
      }
    }
    
    // If another tag is a substring of this tag (and this is longer), the other is redundant (handled elsewhere)
    // But we should prefer the more specific tag, so if "baby & toddler shoe" exists, reject "shoe"
    if (lowerTag.includes(lowerOther) && lowerTag.length > lowerOther.length) {
      const wordBoundaryMatch = new RegExp(`\\b${lowerOther}\\b`).test(lowerTag);
      if (wordBoundaryMatch && (lowerTag.startsWith(lowerOther + ' ') || lowerTag.endsWith(' ' + lowerOther))) {
        // The other tag is more general, prefer the more specific one (this one)
        // Don't reject this tag, but the other one should be rejected
        continue;
      }
    }
  }
  
  return false;
}

// Check if title clearly identifies item type (e.g., "coffee pot", "jug", "compote dish")
// When item type is clear, colors/materials are less relevant for discovery
function isItemTypeClearFromTitle(title: string): boolean {
  const lowerTitle = title.toLowerCase().trim();
  
  // Common item type indicators in titles - expanded to include more item types
  const itemTypePatterns = [
    /\b(pot|jug|pitcher|kettle|carafe|compote|dish|bowl|plate|cup|mug|vase|jar|bottle|container)\b/,
    /\b(shoe|boot|sandal|slipper|bootie)\b/,
    /\b(necklace|bracelet|ring|pin|brooch|earring|pendant)\b/,
    /\b(table|chair|desk|shelf|cabinet|dresser|sofa|chair)\b/,
    /\b(lamp|light|fixture|chandelier|lampshade|light cover|ceiling light|pendant)\b/,
    /\b(frame|picture frame|photo frame|mirror)\b/,
    /\b(sculpture|statue|figurine|decor|decoration|ornament)\b/,
    /\b(toy|top|spinning top|noisemaker|party favor|party favor)\b/,
    // Add more item types that are common and should trigger material filtering
    /\b(bucket|barrel|ice bucket|barrel-shaped)\b/,
    /\b(basket|wire basket|mesh basket|storage basket)\b/,
    /\b(candlestick|candle holder|candleholder|pair of candlesticks)\b/,
    /\b(meat grinder|grinder|food processor)\b/,
    /\b(holder|stand|display|rack|organizer)\b/,
  ];
  
  return itemTypePatterns.some(pattern => pattern.test(lowerTitle));
}

// Check if tag passes the new validation rules:
// Tags are NOT labels or classifications - they must serve buyer discovery ("Why would someone click this?")
// Must reflect ONE of: collecting community, style/aesthetic, nostalgic/emotional association, buyer use/display context
function isValidTagForDisplay(tag: string, listingTitle: string = '', allTags: string[] = []): boolean {
  const lowerTag = tag.toLowerCase().trim();
  const lowerTitle = listingTitle.toLowerCase().trim();
  
  // Reject entity IDs and structured data references (e.g., /m/083vt, /g/11xyz)
  if (/^\/[mg]\//.test(tag) || tag.includes('/m/') || tag.includes('/g/')) {
    return false;
  }
  
  // Reject category labels (generic classifications that don't enhance discovery)
  const categoryLabels = ['railroad name', 'toy', 'object', 'design', 'model train', 'tender car', 'train car', 'railroad', 'train', 'model', 'car', 'vehicle', 'earring', 'earrings'];
  if (categoryLabels.some(label => lowerTag === label || lowerTag.includes(` ${label}`) || lowerTag.includes(`${label} `))) {
    return false;
  }
  
  // Also reject "body jewelry" / "body jewellery" - not a valid category (case-insensitive)
  if (lowerTag === 'body jewelry' || lowerTag === 'body jewellery' || lowerTag.includes('body jewelry') || lowerTag.includes('body jewellery')) {
    return false;
  }
  
  // Reject overly abstract/philosophical tags that don't help discovery - check early before other validation
  const abstractTags = ['facial expression', 'expression', 'emotion', 'feeling', 'happiness', 'sadness', 'joy', 'anger', 'fear', 'surprise', 'disgust', 'philosophy', 'abstract', 'concept'];
  if (abstractTags.some(abstract => {
    // Check for exact match or as a complete word
    if (lowerTag === abstract) return true;
    if (lowerTag.includes(` ${abstract} `)) return true;
    if (lowerTag.startsWith(`${abstract} `)) return true;
    if (lowerTag.endsWith(` ${abstract}`)) return true;
    // Also check if it's part of a phrase (e.g., "facial expression")
    if (abstract.includes(' ') && lowerTag.includes(abstract)) return true;
    return false;
  })) {
    return false; // Reject overly abstract tags
  }
  
  // Check for redundant/duplicate tags first
  if (allTags.length > 0 && isRedundantTag(tag, allTags)) {
    return false;
  }
  
  // CRITICAL: EXCLUDE generic material keywords entirely - no buyer searches for "metal" or "iron"
  // These materials are obvious from the image and don't enhance discovery
  const excludedMaterials = [
    'metal', 'iron', 'steel', 'brass', 'copper', 'aluminum', 'aluminium',
    'wood', 'wooden', 'hardwood', 'softwood',
    'glass',
    'ceramic', 'porcelain',
    'plastic',
    'fabric', 'cloth', 'textile',
    // Also reject material-related terms
    'material', 'natural material', 'natural',
  ];
  
  // ALWAYS reject if tag is exactly a material word (case-insensitive)
  if (excludedMaterials.some(mat => lowerTag === mat)) {
    return false; // Reject - generic material keyword
  }
  
  // ALWAYS reject if tag starts or ends with a material word (e.g., "metal handle", "wooden box")
  if (excludedMaterials.some(mat => {
    return lowerTag.startsWith(`${mat} `) || lowerTag.endsWith(` ${mat}`);
  })) {
    return false; // Reject - material is the primary descriptor
  }
  
  // Reject obvious physical attributes (color, shape, material)
  // Tags should enhance discovery, not restate obvious facts that are already in title/description/image
  const physicalAttributeWords = [
    // Colors
    'color', 'colour', 'red', 'blue', 'green', 'black', 'white', 'yellow', 'orange', 'brown', 'amber', 'purple', 'pink', 'gray', 'grey', 'silver', 'gold', 'bronze', 'copper', 'tan', 'beige', 'ivory', 'cream',
    // Materials (already handled above, but keep for compound word detection)
    'material', 'natural material', 'wood', 'wooden', 'hardwood', 'softwood', 'metal', 'plastic', 'glass', 'fabric', 'cloth', 'textile', 'stone', 'ceramic', 'porcelain', 'crystal', 'brass', 'bronze', 'copper', 'steel', 'iron', 'aluminum', 'aluminium', 'leather', 'canvas', 'cotton', 'wool', 'silk',
    // Material-related terms
    'stain', 'finish', 'paint', 'surface', 'texture', 'natural',
    // Shapes/sizes
    'shape', 'size', 'large', 'small', 'big', 'tiny', 'rectangular', 'round', 'square', 'circular', 'oval', 'round',
    // Obvious descriptors
    'transparent', 'opaque', 'solid', 'hollow',
    // Mesh/wire patterns - these are obvious from the image
    'mesh', 'wire'
  ];
  
  const itemTypeIsClear = isItemTypeClearFromTitle(lowerTitle);
  
  // Check if tag is just a color/material word, or contains one prominently
  if (physicalAttributeWords.some(word => {
    const exactMatch = lowerTag === word;
    const startsWith = lowerTag.startsWith(`${word} `);
    const endsWith = lowerTag.endsWith(` ${word}`);
    const containsAsWord = new RegExp(`\\b${word}\\b`).test(lowerTag);
    
    // Always reject standalone material words - already handled above, but double-check
    if (exactMatch && excludedMaterials.includes(word)) {
      return true; // Always reject these standalone materials
    }
    
    // If item type is clear from title (e.g., "coffee pot", "jug", "picture frame"), filter colors/materials more aggressively
    // Colors/materials don't enhance discovery when the item type is obvious - buyers can see the color in the image
    if (exactMatch && itemTypeIsClear) {
      // For clear item types, reject simple color/material words (e.g., "silver" for "coffee pot", "natural" for "picture frame")
      const colorWords = ['color', 'colour', 'red', 'blue', 'green', 'black', 'white', 'yellow', 'orange', 'brown', 'amber', 'purple', 'pink', 'gray', 'grey', 'silver', 'gold', 'bronze', 'copper', 'tan', 'beige', 'ivory', 'cream'];
      const materialWords = ['metal', 'plastic', 'glass', 'wood', 'hardwood', 'softwood', 'fabric', 'stone', 'ceramic', 'porcelain', 'crystal', 'brass', 'bronze', 'copper', 'steel', 'iron', 'aluminum', 'aluminium', 'leather', 'canvas', 'cotton', 'wool', 'silk', 'natural', 'mesh', 'wire'];
      // Also reject generic descriptors like "natural" when item type is clear
      const genericDescriptors = ['natural', 'material', 'mesh', 'wire'];
      if (colorWords.includes(word) || materialWords.includes(word) || genericDescriptors.includes(word)) {
        return true; // Reject - item type is clear, color/material/descriptor doesn't enhance discovery
      }
    }
    
    // Always reject "natural", "material", "metal", "mesh", "wire" as standalone tags - they're too vague
    if (exactMatch && (word === 'natural' || word === 'material' || word === 'metal' || word === 'mesh' || word === 'wire')) {
      return true; // Always reject these standalone words
    }
    
    // Reject if it's the exact word, or if it's a compound like "wood stain", "orange color", etc.
    return exactMatch || startsWith || endsWith || (containsAsWord && lowerTag.split(/\s+/).length <= 2);
  })) {
    return false;
  }
  
  // NEW: Reject obvious item type synonyms (e.g., "candle holder" when title is "candlesticks")
  if (lowerTitle) {
    const itemTypeSynonyms: Record<string, string[]> = {
      'candlestick': ['candle holder', 'candleholder'],
      'candle holder': ['candlestick', 'candlesticks'],
      'basket': ['wire basket', 'mesh basket'],
      'bucket': ['barrel', 'ice bucket'],
      'barrel': ['bucket', 'ice bucket'],
    };
    
    // Check if tag is a synonym of an item type in the title
    for (const [itemType, synonyms] of Object.entries(itemTypeSynonyms)) {
      if (lowerTitle.includes(itemType)) {
        if (synonyms.some(syn => lowerTag === syn || lowerTag.includes(syn))) {
          return false; // Reject synonym - it restates the obvious item type
        }
      }
    }
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
  // Note: Abstract tags are already filtered out earlier in the function
  const emotionalIndicators = ['cozy', 'playful', 'nostalgic', 'nostalgia', 'sentimental', 'charming', 'whimsical', 'warm', 'comforting', 'memorable', 'childhood', 'memory'];
  if (emotionalIndicators.some(indicator => lowerTag.includes(indicator))) {
    return true;
  }
  
  // 4. Buyer use or display context (e.g., "shelf display", "desk accessory", "gift for collector", "display piece")
  const useContextIndicators = ['display', 'shelf', 'desk', 'gift', 'decoration', 'decorative', 'accessory', 'showcase', 'showpiece', 'centerpiece', 'layout', 'diorama', 'scene', 'classic toy display', 'collector shelf piece', 'railfan gift'];
  if (useContextIndicators.some(indicator => lowerTag.includes(indicator))) {
    return true;
  }
  
  // 5. Alternative item names/uses (e.g., "biscuit jar", "tobacco jar", "ice bucket") - these enhance discovery by showing what else an item is known as or used for
  // Accept compound terms that describe alternative uses or common names (2+ words that aren't just materials/colors)
  const tagWords = lowerTag.split(/\s+/).filter(w => w.length > 2);
  if (tagWords.length >= 2) {
    // Check if it's an alternative use/name pattern (e.g., "biscuit jar", "tobacco jar", "storage basket")
    const usePatterns = ['jar', 'bucket', 'basket', 'container', 'box', 'holder', 'storage', 'organizer', 'display', 'decor', 'accessory', 'toy', 'collectible', 'piece', 'item'];
    if (usePatterns.some(pattern => lowerTag.includes(pattern))) {
      // Make sure it's not just materials/colors (already filtered above, but double-check)
      const materialWords = ['metal', 'wood', 'glass', 'plastic', 'hardwood', 'iron', 'steel', 'brass', 'copper'];
      if (!materialWords.some(mat => tagWords.includes(mat))) {
        return true; // Accept alternative use/name terms like "biscuit jar"
      }
    }
  }
  
  // 6. FALLBACK: If tag passed all the rejection checks above (not a material, not redundant, not obvious),
  // and it's a reasonable length (2+ characters), accept it as a valid discovery term
  // This prevents over-filtering when tags are useful but don't match strict patterns
  if (lowerTag.length >= 2 && tagWords.length > 0) {
    // If we got this far, the tag isn't a material, isn't redundant, isn't obvious
    // It might be a brand name, specific item type, or other useful identifier
    // Be lenient and accept it rather than rejecting everything
    console.log(`✅ Accepting tag as fallback (passed basic checks): "${tag}"`);
    return true;
  }
  
  // If tag doesn't match any of the discovery purposes and doesn't pass fallback, reject it
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
      // Pass all tags to isValidTagForDisplay so it can check for duplicates
      deduped = deduped.filter(tag => isValidTagForDisplay(tag, listingTitle, deduped));
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

  // Normalize all tags to lowercase (standardize casing)
  return {
    idTags: processedIdTags.map(tag => tag.toLowerCase()),
    styleTags: processedStyleTags.map(tag => tag.toLowerCase()),
    moodTags: processedMoodTags.map(tag => tag.toLowerCase()),
  };
}

// Legacy function for backward compatibility (used for attributes)
// This processes a flat list of tags without budget constraints
// Common spelling corrections for AI-generated tags
const spellingCorrections: Record<string, string> = {
  'jewerlry': 'jewelry',
  'jewelrry': 'jewelry',
  'jewellry': 'jewelry',
  'jewellery': 'jewelry', // British spelling -> American spelling
  'natural material': 'natural', // But we'll filter this anyway
};

function postProcessTags(tags: string[], maxTags: number = 8): string[] {
  // First, apply spelling corrections
  const correctedTags = tags.map(tag => {
    const lowerTag = tag.toLowerCase().trim();
    if (spellingCorrections[lowerTag]) {
      return spellingCorrections[lowerTag];
    }
    // Check for partial matches (e.g., "jewerlry pin" -> "jewelry pin")
    for (const [wrong, correct] of Object.entries(spellingCorrections)) {
      if (lowerTag.includes(wrong)) {
        return tag.replace(new RegExp(wrong, 'gi'), correct);
      }
    }
    return tag;
  });
  
  // Use the same normalization and filtering as rankAndSelectTags
  const normalizeTag = (tag: string): string => String(tag).toLowerCase().trim();
  
  // Use correctedTags instead of tags
  const allTags = [...correctedTags];
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
    
    // Reject entity IDs (e.g., /m/083vt)
    if (/^\/[mg]\//.test(tag) || tag.includes('/m/') || tag.includes('/g/')) return false;
    
    // Reject "body jewelry" / "body jewellery" (case-insensitive)
    if (lowerTag === 'body jewelry' || lowerTag === 'body jewellery' || lowerTag.includes('body jewelry') || lowerTag.includes('body jewellery')) return false;
    
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
  
  // Normalize all tags to lowercase (standardize casing)
  return topTags.map(tag => tag.toLowerCase());
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

    // Task 2: Claude Vision Analysis (PARALLEL PRIMARY - alternative analysis for better keywords)
    // Claude Vision runs in parallel with OpenAI - may provide better keywords/tags
    const claudeTask = process.env.ANTHROPIC_API_KEY
      ? analyzeWithClaude(originalUrl).catch((err) => {
          // Log error with more context for debugging
          console.error('❌ Claude Vision failed:', {
            error: err instanceof Error ? err.message : String(err),
            imageUrl: originalUrl.substring(0, 100) + '...', // Log partial URL for debugging
            hasApiKey: !!process.env.ANTHROPIC_API_KEY,
          });
          // Return null on failure for graceful degradation - system will use OpenAI instead
          return null;
        })
      : Promise.resolve(null);
    parallelTasks.push(claudeTask);

    // Task 3: Google Vision Analysis (SUPPLEMENTARY - for additional tags/attributes only)
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
    const [openAIResult, claudeResult, googleResult, processedImageUrlResult] = await Promise.allSettled(parallelTasks);

    // Timing diagnostics: End parallel processing timing and log status of each operation
    console.timeEnd('Parallel Processing');
    console.log('OpenAI status:', openAIResult.status);
    console.log('Claude Vision status:', claudeResult.status);
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
    
    // Extract Claude Vision results (same structure as OpenAI)
    type ClaudeEnrichmentType = OpenAIEnrichmentType; // Same structure
    const claudeEnrichment: ClaudeEnrichmentType | null = 
      claudeResult.status === 'fulfilled' && 
      claudeResult.value && 
      typeof claudeResult.value === 'object' &&
      'title' in claudeResult.value
        ? (claudeResult.value as ClaudeEnrichmentType)
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
- **styles**: Era (vintage, mid-century, art-deco, etc), design movements, distinctive aesthetic features - AVOID generic materials (brass, glass, metal) unless they define a distinctive style
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
    // Include styles in embedding text (highest priority field - keyword data is stored here)
    const stylesForEmbedding = categorized.styles || [];
    const embeddingText = `${openAITitle || 'New Listing'} ${openAIDescription} ${stylesForEmbedding.join(' ')} ${openAIEnrichment?.category || 'General'}`;
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
      category: userInput?.category || openAIEnrichment?.category || claudeEnrichment?.category || googleVisionData?.category || 'General',
      attributes: [] as string[],
      suggestedTitle: '',
      suggestedDescription: '',
      suggestedPrice: openAIEnrichment?.estimatedPrice || claudeEnrichment?.estimatedPrice || null,
      styles: [] as string[],
      moods: [] as string[],
    };

    let listing = {
      title: userInput?.title || 'New Listing',
      description: userInput?.description || '',
    };

    // PRIMARY SOURCE: OpenAI or Claude Vision for product identification (title, category, description, attributes)
    // Prefer OpenAI, but use Claude if OpenAI fails - both run in parallel so we can choose the best
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
    } else if (claudeEnrichment) {
      // FALLBACK: If OpenAI failed, use Claude Vision for product identification
      listing.title = claudeEnrichment.title || listing.title;
      visionData.category = claudeEnrichment.category || visionData.category;
      listing.description = claudeEnrichment.description || listing.description;
      visionData.attributes = claudeEnrichment.attributes || [];
      visionData.suggestedTitle = claudeEnrichment.title || '';
      visionData.suggestedDescription = claudeEnrichment.description || '';
      visionData.suggestedPrice = claudeEnrichment.estimatedPrice || visionData.suggestedPrice;
    } else if (googleVisionData) {
      // FALLBACK: If both OpenAI and Claude failed, use Google Vision for basic identification
      listing.title = googleVisionData.title || listing.title;
      visionData.category = googleVisionData.category || visionData.category;
      visionData.attributes = googleVisionData.attributes || [];
      visionData.suggestedTitle = googleVisionData.title || '';
    }

    // SUPPLEMENTARY SOURCES: Claude and Google Vision add extra tags/attributes
    // Merge attributes from all available sources (OpenAI, Claude, Google) for best keyword coverage
    if (openAIEnrichment || claudeEnrichment || googleVisionData) {
      const allAttributes: string[] = [];
      
      // Add OpenAI attributes (primary)
      if (openAIEnrichment?.attributes) {
        allAttributes.push(...openAIEnrichment.attributes);
      }
      
      // Add Claude attributes (may be better for keywords - supplements OpenAI)
      if (claudeEnrichment?.attributes) {
        allAttributes.push(...claudeEnrichment.attributes);
      }
      
      // Add Google Vision attributes (supplementary labels/tags)
      if (googleVisionData) {
        const googleAttributes = googleVisionData.attributes || [];
        allAttributes.push(...googleAttributes);
        
        // Add brand info from Google Vision if detected
        if (googleVisionData.brandInfo) {
          allAttributes.push(googleVisionData.brandInfo);
        }
      }
      
      // Post-process final combined attributes: normalize, deduplicate, filter, limit
      // This merges all sources and removes duplicates, filters invalid tags, limits to best 8
      const postProcessedAttributes = postProcessTags(allAttributes, 8);
      
      console.log('🔍 [Attributes Debug] Before final filtering:', {
        allAttributesCount: allAttributes.length,
        postProcessedCount: postProcessedAttributes.length,
        postProcessedTags: postProcessedAttributes,
        title: listing.title || 'No title',
      });
      
      // CRITICAL: Explicit material keyword filtering - remove ALL generic materials
      // This is a final safety net to catch any materials that slip through
      const excludedMaterials = [
        'metal', 'iron', 'steel', 'brass', 'copper', 'aluminum', 'aluminium',
        'wood', 'wooden', 'hardwood', 'softwood',
        'glass',
        'ceramic', 'porcelain',
        'plastic',
        'fabric', 'cloth', 'textile',
        'material', 'natural material', 'natural',
      ];
      
      // First pass: Remove any tags that are exactly material words
      let filteredAttributes = postProcessedAttributes.filter(tag => {
        const lowerTag = tag.toLowerCase().trim();
        if (excludedMaterials.includes(lowerTag)) {
          console.log(`❌ [Material Filter] Removed exact material match: "${tag}"`);
          return false;
        }
        // Also reject if tag starts/ends with material word (e.g., "metal handle", "wooden box")
        if (excludedMaterials.some(mat => {
          return lowerTag.startsWith(`${mat} `) || lowerTag.endsWith(` ${mat}`);
        })) {
          console.log(`❌ [Material Filter] Removed material compound: "${tag}"`);
          return false;
        }
        return true;
      });
      
      // Second pass: Use isValidTagForDisplay to filter materials, redundant tags, and obvious attributes
      const beforeFilterCount = filteredAttributes.length;
      visionData.attributes = filteredAttributes.filter(tag => {
        const isValid = isValidTagForDisplay(tag, listing.title || '', filteredAttributes);
        if (!isValid) {
          console.log(`❌ [Validation Filter] Removed tag: "${tag}" (title: "${listing.title || 'No title'}")`);
        }
        return isValid;
      });
      
      // FALLBACK: If all tags were filtered out, keep the top post-processed tags (they passed basic filtering)
      // This prevents losing all keywords when validation is too strict
      if (visionData.attributes.length === 0 && postProcessedAttributes.length > 0) {
        console.warn('⚠️ All tags filtered out - using fallback: keeping top post-processed tags (excluding materials)');
        // Even in fallback, exclude materials
        visionData.attributes = postProcessedAttributes
          .filter(tag => {
            const lowerTag = tag.toLowerCase().trim();
            return !excludedMaterials.includes(lowerTag) &&
                   !excludedMaterials.some(mat => lowerTag.startsWith(`${mat} `) || lowerTag.endsWith(` ${mat}`));
          })
          .slice(0, 5); // Keep top 5 as fallback
      }
      
      console.log('✅ [Attributes Debug] After final filtering:', {
        beforeCount: beforeFilterCount,
        afterCount: visionData.attributes.length,
        finalTags: visionData.attributes,
      });
      
      // Also merge styles and moods from OpenAI and Claude if available
      const allStyles = new Set<string>();
      const allMoods = new Set<string>();
      
      if (openAIEnrichment?.styles) {
        openAIEnrichment.styles.forEach(style => allStyles.add(style));
      }
      if (claudeEnrichment?.styles) {
        claudeEnrichment.styles.forEach(style => allStyles.add(style));
      }
      if (openAIEnrichment?.moods) {
        openAIEnrichment.moods.forEach(mood => allMoods.add(mood));
      }
      if (claudeEnrichment?.moods) {
        claudeEnrichment.moods.forEach(mood => allMoods.add(mood));
      }
      
      // Store combined styles/moods (will be used later in the flow)
      visionData.styles = Array.from(allStyles);
      visionData.moods = Array.from(allMoods);
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
      // Save AI-detected attributes as-is
      ai_suggested_keywords: visionData.attributes && visionData.attributes.length > 0 ? visionData.attributes : null,
      keywords: null, // User keywords will be added when seller edits/saves
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

// Claude Vision with hypotheses-based approach for buyer-first marketplace
// Uses same structure as OpenAI for consistency - may provide better keywords/tags
export async function analyzeWithClaude(imageUrl: string): Promise<{
  title: string;
  description: string;
  category: string;
  attributes: string[];
  estimatedPrice: number | null;
  styles?: string[];
  moods?: string[];
  intents?: string[];
  era?: string;
}> {
  // Use the same prompt structure as OpenAI for consistency
  const prompt = `You are assisting a buyer-first secondhand marketplace.

Your job is NOT to produce a single definitive identification.
Your job is to surface plausible interpretations, uncertainty, and visual evidence,
and to avoid resale boilerplate or inflated claims.

You must think in hypotheses, not answers.

Hard rules:
- Return EXACTLY 3 hypotheses.
- Do NOT claim "rare," "authentic," or a specific maker unless
  there is clear visual evidence (mark, stamp, unmistakable pattern or silhouette).
- For style_tags: You MAY include "vintage" or "antique" if the item appears to be from an earlier era or has vintage/antique characteristics (even without definitive proof). Style tags should reflect the aesthetic and era the item evokes, not require authentication.
- NEVER mention condition, wear, age, patina, or "wear consistent with age" in descriptions unless seller explicitly provides condition notes. Do NOT infer condition from images.
- If confidence is low or competing hypotheses are close, say so.
- Favor buyer trust over seller reassurance.
- Do NOT state the obvious (e.g., "it is black," "rectangular," "has wheels") unless that fact
  meaningfully disambiguates hypotheses or affects buyer desirability.
- Evidence must be DISTINCTIVE: markings, motifs, hardware, functional features,
  era signals, maker marks, pattern signatures. (Do NOT use patina/crazing as evidence unless explicitly relevant to identification.)
- Focus on identifying WHAT the item IS (object type, category, function) rather than WHAT it's MADE OF (material composition).
- Materials are secondary - only mention if it's distinctive and directly relevant to identification (e.g., "marble" for a marble statue, not "glass" for a glass vase).
- When uncertain about material (e.g., amber glass vs brass), focus on the object type and category instead.
- Titles must avoid filler like "with marking" or "with text".
- Output tags in 3 groups:
  - id_tags: concrete identifiers (brand/pattern/object type) - for hidden indexing only. IMPORTANT: Think about what ELSE this item might be called or used for. For example, a barrel-shaped wooden container might be a "biscuit jar", "tobacco jar", OR "ice bucket" - include these alternative names/uses to help buyers discover items. AVOID generic materials like "wood", "metal", "glass", "iron", "hardwood" unless it's a distinctive identifier. Include alternative item names that buyers might search for (e.g., "biscuit jar", "tobacco jar", "storage basket", "display piece").
  - style_tags: design vocabulary that aids buyer discovery. PRIORITIZE:
    - Style/era: vintage, antique, mid-century, art deco, Victorian, retro, industrial, farmhouse, rustic, bohemian
    - Aesthetic descriptors: elegant, whimsical, industrial, rustic, bohemian, minimalist, classic
    - Use case: kitchen decor, entertaining, gift, collectible, farmhouse decor, home decor
    CRITICAL: DO NOT include generic materials (metal, iron, steel, brass, copper, aluminum, wood, wooden, glass, ceramic, porcelain, plastic, fabric, cloth, textile) - these are not searchable style terms.
  - mood_tags: emotional/nostalgic associations that aid buyer discovery (nostalgic, cozy, playful, charming, elegant, whimsical) - AVOID overly abstract tags like 'facial expression', 'happiness', 'emotion' - focus on practical discovery terms buyers actually search for.
- Tags are NOT labels or classifications. Tags must serve buyer discovery and browsing. They should answer: "Why would someone click this?"
- Tags must CLARIFY AND ENHANCE discovery - they should reveal something about the item that isn't obvious from the title/description/image.
- Tags must reflect ONE of: a collecting community, a style or aesthetic, a nostalgic or emotional association, a plausible buyer use or display context.
- PRIORITIZE practical discovery terms: "vintage", "party favors", "event lots", "collectible", "nostalgic", "playful" - terms buyers actually search for.
- AVOID overly abstract/philosophical tags like "facial expression", "happiness", "emotion" - these don't help buyers find items.
- If "vintage" appears in the description, include it in style_tags or mood_tags.
- Do NOT output: category labels ("railroad name", "toy", "object", "design", "body jewelry" - NOT a valid category), obvious physical attributes (color, shape, material - colors/materials are already in the title/image and don't enhance discovery), tags that restate title/brand, construction quality descriptors, collectibility speculations, condition descriptions.
- REMEMBER: If a buyer can see it in the image or read it in the title, don't make it a tag. Tags should add discovery value, not restate facts.
- Tags should be written as natural phrases a human might browse, not technical descriptors.
- If no meaningful discovery tags can be inferred, return empty arrays.
- Do not output tags like "black color", "rectangular shape", "wheels visible", "realistic design", "detailed construction", "wear consistent with age", "miniature", "toy", "features", "design resembles", "railroad name", "model train", "tender car".

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
- Jewelry (for all jewelry items - necklaces, bracelets, rings, pins, brooches, etc. Use "Jewelry" not specific subcategories)
- Toys & Games
- Sports & Outdoors
- General (only if item doesn't fit any other category)

IMPORTANT: Choose the BROAD category (e.g., "Jewelry"), not specific subcategories (e.g., "earring", "necklace"). Focus on what the item IS (object type) rather than material composition or specific form variations.

Return the following JSON structure:

{
  "hypotheses": [
    {
      "label": "plain-English object interpretation - focus on WHAT it IS (object type, function), not material or specific subcategory (e.g., 'jewelry piece' or 'brooch' not 'brass earring')",
      "category_id": "must be EXACTLY one of the categories listed above - use BROAD category (e.g., 'Jewelry' not 'earring')",
      "confidence_vision": 0.00,
      "evidence": {
        "visual_cues": ["short, concrete visual observations - focus on distinctive features, shape, function, markings. Think about what this item might ALSO be called or used for (e.g., barrel-shaped container = 'biscuit jar' or 'tobacco jar'). AVOID generic materials unless distinctive (e.g., 'amber glass' should be 'amber colored glass vessel', not just 'brass' or 'glass')"],
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
    "title": "softly worded title; hedge if uncertain. Focus on WHAT the item IS (object type, function) rather than what it's MADE OF (material). IMPORTANT: If you detect a brand name in text_cues or visual evidence (e.g., 'Lily Pulitzer', 'Coach', visible logos/markings), ALWAYS include the brand name prominently in the title (at the start or early). Brand names are crucial for buyer discovery and should not be omitted. Do NOT include material in title unless it's distinctive and necessary for identification (e.g., 'Marble Statue', not 'Glass Vase').",
    "description": "1-2 sentences placing object in buyer's context. Answer at least one: Where might this live? (shelf, desk, display, collection) Who would be drawn to it? (collector, nostalgia buyer, gift) What feeling does it evoke? Do NOT mention condition, wear, age, patina, or 'wear consistent with age' unless seller explicitly provides condition notes. Do NOT infer condition from images. Do NOT restate obvious visual facts or material composition unless distinctive. Buyer-facing context only.",
    "ask_for_confirmation": "ONE short sentence asking for a specific photo or detail IF needed"
  },
  "pricing": {
    "estimated_range_low": number,
    "estimated_range_high": number,
    "rationale": "1 sentence grounded in comparable resale, not hype"
  },
  "id_tags": ["concrete identifiers like brand, pattern, object type - focus on WHAT it IS, not what it's made of"],
  "style_tags": ["design vocabulary like mid-century, industrial, farmhouse, vintage, antique, lucite, retro, art-deco, modernist - PRIORITIZE era and aesthetic tags. If the item appears vintage, mid-century, or from a specific era (1940s-1980s), include those tags. NO generic materials (brass, glass, metal, wood, hardwood, iron, steel) unless they define a distinctive style. If you detect distinctive materials like lucite (for mid-century acrylic pieces), include them as style tags."],
  "mood_tags": ["emotional vibe like nostalgic, cozy, playful, charming, whimsical - AVOID overly abstract tags like 'facial expression', 'happiness', 'emotion' - focus on practical discovery terms buyers actually search for"],
  "seller_keywords": ["3-6 plain-language keywords like train, toy, model, decor, railroad, collectible - obvious terms ARE allowed"]
}`;

  // Fetch image and convert to base64 for Claude API
  // Claude requires base64-encoded images
  let imageBase64: string;
  let imageMediaType = 'image/jpeg'; // Default, will detect from response
  
  try {
    const imageResponse = await fetch(imageUrl, {
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
    }
    
    // Detect content type from response headers
    const contentType = imageResponse.headers.get('content-type');
    if (contentType && contentType.startsWith('image/')) {
      imageMediaType = contentType;
    } else {
      // Try to infer from URL extension if header missing
      if (imageUrl.includes('.png')) imageMediaType = 'image/png';
      else if (imageUrl.includes('.gif')) imageMediaType = 'image/gif';
      else if (imageUrl.includes('.webp')) imageMediaType = 'image/webp';
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Check image size (Claude has limits - max 5MB for base64)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageBuffer.byteLength > maxSize) {
      throw new Error(`Image too large for Claude: ${Math.round(imageBuffer.byteLength / 1024)}KB (max 5MB)`);
    }
    
    // Convert to base64 - Buffer is available in Node.js/Next.js server-side
    if (typeof Buffer !== 'undefined') {
      imageBase64 = Buffer.from(imageBuffer).toString('base64');
    } else {
      // Fallback for environments without Buffer (shouldn't happen in Next.js server-side)
      throw new Error('Buffer not available - this should only run server-side');
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('⏱️ Claude image fetch timeout after 30s');
      throw new Error('Image fetch timeout - image may be too large or network too slow');
    }
    console.error('❌ Failed to fetch/convert image for Claude:', error);
    throw new Error(`Failed to process image for Claude: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured - Claude Vision cannot run');
  }

  let response: Response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022', // Use latest Claude Sonnet for best vision quality
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: imageMediaType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
      }),
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(60000), // 60 second timeout for API call
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('⏱️ Claude API call timeout after 60s');
      throw new Error('Claude API call timeout - request took too long');
    }
    console.error('❌ Claude API request failed:', error);
    throw new Error(`Claude API request failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!response.ok) {
    let errorText: string;
    try {
      errorText = await response.text();
    } catch (e) {
      errorText = `Failed to read error response: ${e instanceof Error ? e.message : String(e)}`;
    }
    
    // Parse error response if it's JSON
    let errorDetails: any = {};
    try {
      errorDetails = JSON.parse(errorText);
    } catch {
      // Not JSON, use raw text
    }
    
    console.error('❌ Claude Vision API error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      details: errorDetails,
    });
    
    // Provide user-friendly error messages
    if (response.status === 401) {
      throw new Error('Claude API key invalid or unauthorized - check ANTHROPIC_API_KEY');
    } else if (response.status === 429) {
      throw new Error('Claude API rate limit exceeded - too many requests');
    } else if (response.status === 413 || response.status === 400) {
      throw new Error('Image too large or invalid for Claude Vision');
    } else if (response.status >= 500) {
      throw new Error(`Claude API server error (${response.status}) - try again later`);
    } else {
      throw new Error(`Claude Vision API failed: ${response.status} - ${errorDetails.error?.message || errorText || response.statusText}`);
    }
  }

  let data: any;
  try {
    data = await response.json();
  } catch (error) {
    console.error('❌ Failed to parse Claude API JSON response:', error);
    throw new Error('Claude API returned invalid JSON response');
  }
  
  // Claude returns content as an array - extract text from first content block
  let content = '';
  if (Array.isArray(data.content)) {
    const textContent = data.content.find((block: any) => block.type === 'text');
    content = textContent?.text?.trim() || '';
  } else if (data.content?.text) {
    content = data.content.text.trim();
  } else {
    console.warn('⚠️ Claude response missing text content:', { content: data.content, keys: Object.keys(data) });
    content = '';
  }
  
  if (!content) {
    console.error('❌ Claude returned empty content:', data);
    throw new Error('Claude API returned empty response');
  }

  // Log raw content for debugging (helpful for troubleshooting)
  console.log('📝 Claude raw response length:', content.length);
  if (content.length > 2000) {
    console.log('📝 Claude response preview (first 500 chars):', content.substring(0, 500));
    console.log('📝 Claude response preview (last 500 chars):', content.substring(content.length - 500));
  } else {
    console.log('📝 Claude full response:', content);
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
  } catch (e) {
    console.warn('⚠️ JSON cleanup failed, proceeding with original:', e);
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
    
    // Use the same parsing logic as OpenAI for consistency
    const recommendedChoice = parsed.recommended?.choice || '';
    const recommendedHypothesis = parsed.hypotheses?.find((h: any) => h.label === recommendedChoice) || parsed.hypotheses?.[0];
    
    const title = parsed.listing_copy?.title || recommendedHypothesis?.label || 'New Listing';
    const description = parsed.listing_copy?.description || '';
    const listingTitle = title;
    
    let category = 'General';
    if (recommendedHypothesis?.category_id) {
      category = recommendedHypothesis.category_id;
    } else if (parsed.hypotheses && Array.isArray(parsed.hypotheses)) {
      for (const hypothesis of parsed.hypotheses) {
        if (hypothesis.category_id) {
          category = hypothesis.category_id;
          break;
        }
      }
    }
    if (category === 'General' && parsed.category) {
      category = parsed.category;
    }
    
    const validCategories = [
      'Kitchen & Dining', 'Home Decor', 'Collectibles', 'Books & Media',
      'Furniture', 'Art', 'Electronics', 'Fashion', 'Jewelry',
      'Toys & Games', 'Sports & Outdoors', 'General'
    ];
    if (!validCategories.includes(category)) {
      console.warn('⚠️ Invalid category from Claude:', category, '- defaulting to General');
      category = 'General';
    }
    
    // Extract tag groups - same structure as OpenAI
    const idTags = Array.isArray(parsed.id_tags) ? parsed.id_tags : [];
    const styleTags = Array.isArray(parsed.style_tags) ? parsed.style_tags : [];
    const moodTags = Array.isArray(parsed.mood_tags) ? parsed.mood_tags : [];
    
    const cleanTags = (tags: any[]): string[] => {
      return tags.map((tag: any) => {
        let cleaned = String(tag).trim();
        cleaned = cleaned.replace(/^[\["\s]+|[\]"\s]+$/g, '');
        cleaned = cleaned.replace(/["\[\]]/g, '');
        cleaned = cleaned.replace(/,([^\s])/g, ', $1');
        return cleaned;
      }).filter((tag: string) => {
        if (tag.length === 0) return false;
        if (/^\/[mg]\//.test(tag) || tag.includes('/m/') || tag.includes('/g/')) return false;
        const lowerTag = tag.toLowerCase();
        if (lowerTag === 'body jewelry' || lowerTag === 'body jewellery' || lowerTag.includes('body jewelry') || lowerTag.includes('body jewellery')) return false;
        return true;
      });
    };
    
    const cleanIdTags = cleanTags(idTags);
    const cleanStyleTags = cleanTags(styleTags);
    const cleanMoodTags = cleanTags(moodTags);
    
    // Filter visual cues for materials/colors (same as OpenAI)
    const commonMaterialWords = new Set([
      'brass', 'bronze', 'copper', 'gold', 'silver', 'metal', 'steel', 'iron', 'aluminum', 'aluminium',
      'glass', 'crystal', 'amber', 'plastic', 'ceramic', 'porcelain', 'stone', 'marble', 'granite',
      'wood', 'hardwood', 'softwood', 'oak', 'maple', 'mahogany', 'pine', 'fabric', 'cloth', 'leather', 'canvas', 'cotton', 'wool', 'silk',
      'material', 'surface', 'finish', 'paint', 'stain'
    ]);
    const commonColorWords = new Set([
      'red', 'blue', 'green', 'black', 'white', 'yellow', 'orange', 'brown', 'amber', 'purple', 'pink', 
      'gray', 'grey', 'silver', 'gold', 'bronze', 'copper', 'tan', 'beige', 'ivory', 'cream', 'color', 'colour'
    ]);
    
    const allVisualCues: string[] = [];
    if (parsed.hypotheses && Array.isArray(parsed.hypotheses)) {
      parsed.hypotheses.forEach((hypothesis: any) => {
        if (hypothesis.evidence?.visual_cues && Array.isArray(hypothesis.evidence.visual_cues)) {
          const filteredCues = hypothesis.evidence.visual_cues.filter((cue: any) => {
            const lowerCue = String(cue).toLowerCase().trim();
            if (commonMaterialWords.has(lowerCue) || commonColorWords.has(lowerCue)) {
              return false;
            }
            const words = lowerCue.split(/\s+/);
            if (words.length <= 2 && (words.some(w => commonMaterialWords.has(w)) || words.some(w => commonColorWords.has(w)))) {
              return false;
            }
            if (words.length === 2) {
              if ((commonColorWords.has(words[0]) && (commonMaterialWords.has(words[1]) || commonColorWords.has(words[1]))) ||
                  (commonMaterialWords.has(words[0]) && (commonMaterialWords.has(words[1]) || commonColorWords.has(words[1])))) {
                return false;
              }
            }
            return true;
          });
          allVisualCues.push(...filteredCues);
        }
        if (hypothesis.evidence?.text_cues && Array.isArray(hypothesis.evidence.text_cues)) {
          allVisualCues.push(...hypothesis.evidence.text_cues);
        }
      });
    }
    
    // Rank and select tags using same system as OpenAI
    const rankedTags = rankAndSelectTags(cleanIdTags, cleanStyleTags, cleanMoodTags, listingTitle);
    
    const processedStyles = rankedTags.styleTags;
    const processedMoods = rankedTags.moodTags;
    
    // Filter materials from id_tags before they become attributes
    const filteredIdTags = rankedTags.idTags.filter(tag => {
      const lowerTag = tag.toLowerCase().trim();
      const materialWords = ['wood', 'hardwood', 'metal', 'plastic', 'glass', 'ceramic', 'porcelain', 'stone', 'brass', 'bronze', 'copper', 'steel', 'iron', 'aluminum', 'fabric', 'leather', 'canvas', 'cotton', 'wool', 'silk'];
      if (materialWords.some(mat => lowerTag === mat || lowerTag.includes(mat))) {
        return false;
      }
      return true;
    });
    
    const combinedAttributes = new Set([
      ...filteredIdTags,
      ...allVisualCues.map((cue: any) => String(cue).trim()).filter((cue: string) => cue.length > 0)
    ]);
    
    let attributesArray = Array.from(combinedAttributes);
    attributesArray = deduplicateBrandTags(attributesArray);
    attributesArray = attributesArray.filter(tag => isValidTagForDisplay(tag, listingTitle, attributesArray));
    const processedAttributes = postProcessTags(attributesArray, 8);
    
    // Calculate average price from range
    let estimatedPrice: number | null = null;
    if (parsed.pricing?.estimated_range_low && parsed.pricing?.estimated_range_high) {
      estimatedPrice = Math.round((parsed.pricing.estimated_range_low + parsed.pricing.estimated_range_high) / 2);
    }
    
    console.log('✅ Claude Vision analysis successful:', {
      title: title.substring(0, 50) + (title.length > 50 ? '...' : ''),
      category,
      attributeCount: processedAttributes.length,
      styleCount: processedStyles.length,
      moodCount: processedMoods.length,
      estimatedPrice,
    });
    
    return {
      title: title,
      description: description,
      category: category,
      attributes: processedAttributes,
      estimatedPrice: estimatedPrice,
      styles: processedStyles,
      moods: processedMoods,
      intents: [],
      era: undefined,
    };
  } catch (e) {
    // More detailed error logging for debugging
    console.error('❌ Failed to parse Claude hypotheses response:', {
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
      contentLength: content?.length || 0,
      contentPreview: content?.substring(0, 200) || 'N/A',
    });
    
    // Try to extract partial data even if full parsing fails
    if (content && content.length > 0) {
      console.log('🔄 Attempting partial data extraction from Claude response...');
      // Could add fallback parsing here if needed
    }
    
    throw new Error(`Failed to parse Claude response: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// OpenAI Vision with hypotheses-based approach for buyer-first marketplace
// Returns multiple hypotheses with evidence, confidence levels, and observational language
export async function analyzeWithOpenAI(imageUrl: string): Promise<{
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
- Do NOT claim "rare," "authentic," or a specific maker unless
  there is clear visual evidence (mark, stamp, unmistakable pattern or silhouette).
- For style_tags: You MAY include "vintage" or "antique" if the item appears to be from an earlier era or has vintage/antique characteristics (even without definitive proof). Style tags should reflect the aesthetic and era the item evokes, not require authentication.
- NEVER mention condition, wear, age, patina, or "wear consistent with age" in descriptions unless seller explicitly provides condition notes. Do NOT infer condition from images.
- If confidence is low or competing hypotheses are close, say so.
- Favor buyer trust over seller reassurance.
- Do NOT state the obvious (e.g., "it is black," "rectangular," "has wheels") unless that fact
  meaningfully disambiguates hypotheses or affects buyer desirability.
- Evidence must be DISTINCTIVE: markings, motifs, hardware, functional features,
  era signals, maker marks, pattern signatures. (Do NOT use patina/crazing as evidence unless explicitly relevant to identification.)
- Focus on identifying WHAT the item IS (object type, category, function) rather than WHAT it's MADE OF (material composition).
- Materials are secondary - only mention if it's distinctive and directly relevant to identification (e.g., "marble" for a marble statue, not "glass" for a glass vase).
- When uncertain about material (e.g., amber glass vs brass), focus on the object type and category instead.
- Titles must avoid filler like "with marking" or "with text".
- Output tags in 3 groups:
  - id_tags: concrete identifiers (brand/pattern/object type) - for hidden indexing only. IMPORTANT: Think about what ELSE this item might be called or used for. For example, a barrel-shaped wooden container might be a "biscuit jar", "tobacco jar", OR "ice bucket" - include these alternative names/uses to help buyers discover items. AVOID generic materials like "wood", "metal", "glass", "iron", "hardwood" unless it's a distinctive identifier. Include alternative item names that buyers might search for (e.g., "biscuit jar", "tobacco jar", "storage basket", "display piece").
  - style_tags: design vocabulary that aids buyer discovery (mid-century, industrial, farmhouse, vintage, antique, classic, lucite, retro, art-deco, modernist). PRIORITIZE era and aesthetic tags - if an item appears vintage, mid-century, or from a specific era (1940s-1980s), include those tags. These should reflect era, aesthetic, design movement, or distinctive material styles (e.g., "lucite" for acrylic pieces from 1940s-1960s) - things buyers search for. NO generic materials (brass, glass, metal, wood, hardwood, iron, steel) unless they define a distinctive style. If you detect materials that are distinctive to an era (e.g., "lucite" for mid-century acrylic pieces), include them as style tags.
  - mood_tags: emotional/nostalgic associations that aid buyer discovery (nostalgic, cozy, playful, charming, elegant, whimsical)
- Tags are NOT labels or classifications. Tags must serve buyer discovery and browsing. They should answer: "Why would someone click this?"
- Tags must CLARIFY AND ENHANCE discovery - they should reveal something about the item that isn't obvious from the title/description/image.
- Tags must reflect ONE of: a collecting community, a style or aesthetic, a nostalgic or emotional association, a plausible buyer use or display context.
- PRIORITIZE practical discovery terms: "vintage", "party favors", "event lots", "collectible", "nostalgic", "playful" - terms buyers actually search for.
- AVOID overly abstract/philosophical tags like "facial expression", "happiness", "emotion" - these don't help buyers find items.
- If "vintage" appears in the description, include it in style_tags or mood_tags.
- Do NOT output: category labels ("railroad name", "toy", "object", "design", "body jewelry" - NOT a valid category), obvious physical attributes (color, shape, material - colors/materials are already in the title/image and don't enhance discovery), tags that restate title/brand, construction quality descriptors, collectibility speculations, condition descriptions.
- REMEMBER: If a buyer can see it in the image or read it in the title, don't make it a tag. Tags should add discovery value, not restate facts.
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
- Jewelry (for all jewelry items - necklaces, bracelets, rings, pins, brooches, etc. Use "Jewelry" not specific subcategories)
- Toys & Games
- Sports & Outdoors
- General (only if item doesn't fit any other category)

IMPORTANT: Choose the BROAD category (e.g., "Jewelry"), not specific subcategories (e.g., "earring", "necklace"). Focus on what the item IS (object type) rather than material composition or specific form variations.

Return the following JSON structure:

{
  "hypotheses": [
    {
      "label": "plain-English object interpretation - focus on WHAT it IS (object type, function), not material or specific subcategory (e.g., 'jewelry piece' or 'brooch' not 'brass earring')",
      "category_id": "must be EXACTLY one of the categories listed above - use BROAD category (e.g., 'Jewelry' not 'earring')",
      "confidence_vision": 0.00,
      "evidence": {
        "visual_cues": ["short, concrete visual observations - focus on distinctive features, shape, function, markings. Think about what this item might ALSO be called or used for (e.g., barrel-shaped container = 'biscuit jar' or 'tobacco jar'). AVOID generic materials unless distinctive (e.g., 'amber glass' should be 'amber colored glass vessel', not just 'brass' or 'glass')"],
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
    "title": "softly worded title; hedge if uncertain. Focus on WHAT the item IS (object type, function) rather than what it's MADE OF (material). IMPORTANT: If you detect a brand name in text_cues or visual evidence (e.g., 'Lily Pulitzer', 'Coach', visible logos/markings), ALWAYS include the brand name prominently in the title (at the start or early). Brand names are crucial for buyer discovery and should not be omitted. Do NOT include material in title unless it's distinctive and necessary for identification (e.g., 'Marble Statue', not 'Glass Vase').",
    "description": "1-2 sentences placing object in buyer's context. Answer at least one: Where might this live? (shelf, desk, display, collection) Who would be drawn to it? (collector, nostalgia buyer, gift) What feeling does it evoke? Do NOT mention condition, wear, age, patina, or 'wear consistent with age' unless seller explicitly provides condition notes. Do NOT infer condition from images. Do NOT restate obvious visual facts or material composition unless distinctive. Buyer-facing context only.",
    "ask_for_confirmation": "ONE short sentence asking for a specific photo or detail IF needed"
  },
  "pricing": {
    "estimated_range_low": number,
    "estimated_range_high": number,
    "rationale": "1 sentence grounded in comparable resale, not hype"
  },
  "id_tags": ["concrete identifiers like brand, pattern, object type - focus on WHAT it IS, not what it's made of"],
  "style_tags": ["design vocabulary like mid-century, industrial, farmhouse, vintage, antique, lucite, retro, art-deco, modernist - PRIORITIZE era and aesthetic tags. If the item appears vintage, mid-century, or from a specific era (1940s-1980s), include those tags. NO generic materials (brass, glass, metal, wood, hardwood, iron, steel) unless they define a distinctive style. If you detect distinctive materials like lucite (for mid-century acrylic pieces), include them as style tags."],
  "mood_tags": ["emotional vibe like nostalgic, cozy, playful, charming, whimsical - AVOID overly abstract tags like 'facial expression', 'happiness', 'emotion' - focus on practical discovery terms buyers actually search for"],
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
      }).filter((tag: string) => {
        // Filter out empty strings
        if (tag.length === 0) return false;
        // Filter out entity IDs (e.g., /m/083vt)
        if (/^\/[mg]\//.test(tag) || tag.includes('/m/') || tag.includes('/g/')) return false;
        // Filter out "body jewelry" / "body jewellery" (case-insensitive)
        const lowerTag = tag.toLowerCase();
        if (lowerTag === 'body jewelry' || lowerTag === 'body jewellery' || lowerTag.includes('body jewelry') || lowerTag.includes('body jewellery')) return false;
        return true;
      });
    };
    
    const cleanIdTags = cleanTags(idTags);
    const cleanStyleTags = cleanTags(styleTags);
    const cleanMoodTags = cleanTags(moodTags);
    
    // Extract attributes from evidence.visual_cues (combine with id_tags for comprehensive attributes)
    // Use id_tags as primary attributes (concrete identifiers), supplement with distinctive visual cues
    // Filter out material-only and color-only cues to reduce focus on obvious attributes
    // These are already in the title/description and don't enhance discovery
    const commonMaterialWords = new Set([
      'brass', 'bronze', 'copper', 'gold', 'silver', 'metal', 'steel', 'iron', 'aluminum', 'aluminium',
      'glass', 'crystal', 'amber', 'plastic', 'ceramic', 'porcelain', 'stone', 'marble', 'granite',
      'wood', 'hardwood', 'softwood', 'oak', 'maple', 'mahogany', 'pine', 'fabric', 'cloth', 'leather', 'canvas', 'cotton', 'wool', 'silk',
      'material', 'surface', 'finish', 'paint', 'stain'
    ]);
    const commonColorWords = new Set([
      'red', 'blue', 'green', 'black', 'white', 'yellow', 'orange', 'brown', 'amber', 'purple', 'pink', 
      'gray', 'grey', 'silver', 'gold', 'bronze', 'copper', 'tan', 'beige', 'ivory', 'cream', 'color', 'colour'
    ]);
    
    const allVisualCues: string[] = [];
    if (parsed.hypotheses && Array.isArray(parsed.hypotheses)) {
      parsed.hypotheses.forEach((hypothesis: any) => {
        if (hypothesis.evidence?.visual_cues && Array.isArray(hypothesis.evidence.visual_cues)) {
          // Filter out cues that are just material/color words - these don't enhance discovery
          const filteredCues = hypothesis.evidence.visual_cues.filter((cue: any) => {
            const lowerCue = String(cue).toLowerCase().trim();
            // Reject if it's just a material or color word (single word)
            if (commonMaterialWords.has(lowerCue) || commonColorWords.has(lowerCue)) {
              return false;
            }
            // Reject if it's a phrase that's primarily about materials/colors (e.g., "brass finish", "orange color", "wood stain")
            const words = lowerCue.split(/\s+/);
            if (words.length <= 2 && (words.some(w => commonMaterialWords.has(w)) || words.some(w => commonColorWords.has(w)))) {
              return false;
            }
            // Reject if it's a compound phrase like "orange color", "brown stain", "amber glass" (when material/color is the focus)
            if (words.length === 2) {
              if ((commonColorWords.has(words[0]) && (commonMaterialWords.has(words[1]) || commonColorWords.has(words[1]))) ||
                  (commonMaterialWords.has(words[0]) && (commonMaterialWords.has(words[1]) || commonColorWords.has(words[1])))) {
                return false;
              }
            }
            return true;
          });
          allVisualCues.push(...filteredCues);
        }
        // Also include text cues as attributes (these are often brands/names, so less likely to be materials)
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
    // IMPORTANT: Filter material/color words from id_tags BEFORE they become attributes
    const filteredIdTags = rankedTags.idTags.filter(tag => {
      const lowerTag = tag.toLowerCase().trim();
      // Filter out material words (including compound words like "hardwood")
      const materialWords = ['wood', 'hardwood', 'metal', 'plastic', 'glass', 'ceramic', 'porcelain', 'stone', 'brass', 'bronze', 'copper', 'steel', 'iron', 'aluminum', 'fabric', 'leather', 'canvas', 'cotton', 'wool', 'silk'];
      if (materialWords.some(mat => lowerTag === mat || lowerTag.includes(mat))) {
        return false;
      }
      return true;
    });
    
    const combinedAttributes = new Set([
      ...filteredIdTags, // Filter materials from id_tags before adding to attributes
      ...allVisualCues.map((cue: any) => String(cue).trim()).filter((cue: string) => cue.length > 0)
    ]);
    
    // Process attributes: normalize, deduplicate brands, filter meta tags, validate, limit to most informative
    // Apply brand deduplication and validation to attributes as well
    let attributesArray = Array.from(combinedAttributes);
    attributesArray = deduplicateBrandTags(attributesArray);
    // Filter with duplicate detection - pass all tags so isValidTagForDisplay can check for redundancy
    attributesArray = attributesArray.filter(tag => isValidTagForDisplay(tag, listingTitle, attributesArray));
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
export async function analyzeWithGoogleVision(imageUrl: string): Promise<{
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

export async function getEbayPricing(searchQuery: string): Promise<{
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
