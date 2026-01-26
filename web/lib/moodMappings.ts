// web/lib/moodMappings.ts
/**
 * Mapping of vibe wheel terms to their database equivalents
 * Handles plural/singular variations, semantic equivalents, and case variations
 */

export const MOOD_MAPPINGS: Record<string, string[]> = {
  // VIBES (Moods)
  'whimsical': ['whimsical', 'whimsy', 'playful', 'fun', 'quirky'],
  'impulsive': ['impulsive', 'impulse', 'spontaneous'],
  'wild': ['wild', 'bold', 'daring'],
  'nostalgic': ['nostalgic', 'nostalgia', 'retro', 'vintage'],
  'quirky': ['quirky', 'quirks', 'unique', 'unusual'],
  'chill': ['chill', 'chilled', 'calm', 'calming', 'peaceful', 'serene'],
  'party on': ['party on', 'party', 'party-on', 'celebration', 'celebrate', 'festive'],
  'warm heart': ['warm heart', 'warm-heart', 'warm', 'heart', 'heartfelt', 'cozy'],

  // PURPOSE (Intents)
  'gift': ['gift', 'gifts', 'gifting', 'present', 'presents'],
  'indulgence': ['indulgence', 'indulge', 'treat', 'treat yourself', 'selfish', 'for me'],
  'practical': ['practical', 'functional', 'utility', 'useful'],
  'collectibles': ['collectibles', 'collectible', 'collection', 'collector', 'collecting'],
  'accessorize': ['accessorize', 'accessories', 'accessory', 'accessorizing'],
  'celebrate': ['celebrate', 'celebration', 'party', 'festive', 'special occasion'],
  'homestyle': ['homestyle', 'home-style', 'home', 'decor', 'home decor', 'home decoration', 'decorative'],
  'dine in': ['dine in', 'dine-in', 'dinein', 'dining', 'tableware', 'serveware', 'dinnerware', 'kitchen', 'cookware'],

  // STYLES
  'antique': ['antique', 'antiques', 'vintage', 'classic'],
  'rustic': ['rustic', 'country', 'farmhouse', 'natural', 'earthy'],
  'retro': ['retro', 'vintage', 'nostalgic', 'classic'],
  'vintage': ['vintage', 'antique', 'retro', 'classic', 'old'],
  'modern': ['modern', 'contemporary', 'sleek', 'minimalist'],
  'mcm': ['mcm', 'mid-century modern', 'midcentury modern', 'mid century modern', 'mid-century', 'midcentury'],
  'kitschy': ['kitschy', 'kitsch', 'tacky', 'campy', 'funky'],
  'elegant': ['elegant', 'elegance', 'sophisticated', 'refined', 'classy'],
};

/**
 * Get all possible database matches for a vibe wheel term
 * Returns the term itself plus all mapped variations
 */
export function getMoodVariations(mood: string): string[] {
  const normalized = mood.toLowerCase().trim();
  const variations = MOOD_MAPPINGS[normalized] || [];
  // Always include the original term (normalized) as a variation
  return [normalized, ...variations.map(v => v.toLowerCase().trim())];
}

/**
 * Check if a database value matches any variation of a vibe wheel term
 */
export function matchesMood(databaseValue: string, moodTerm: string): boolean {
  const normalizedDbValue = databaseValue.toLowerCase().trim();
  const variations = getMoodVariations(moodTerm);
  
  // Exact match
  if (variations.includes(normalizedDbValue)) {
    return true;
  }
  
  // Word boundary match (handles phrases like "home decor" matching "homestyle")
  return variations.some(variation => {
    // Escape special regex characters
    const escaped = variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match whole word or phrase
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(normalizedDbValue);
  });
}
