# Semantic Search Implementation

## Overview

ThriftShopper now has **semantic search** powered by OpenAI that understands natural language queries like:
- "whimsical gift for mom that is vintage"
- "cozy mug for myself"
- "retro stereo under $100"
- "something elegant for the living room"

The system interprets the **meaning** of the query and searches across **all item fields**, not just keywords.

---

## How It Works

### 1. **Query Interpretation** (OpenAI GPT-4o-mini)

When you say or type a search query, OpenAI analyzes it and extracts:

- **keywords**: General search terms (brands, materials, objects, descriptors)
  - Example: "mom", "mother", "mug", "stereo"
  
- **intents**: Purpose tags that describe why someone wants the item
  - Options: `"gifting"`, `"selfish"`, `"home-decor"`, `"collection"`, `"functional"`
  - Example: "gift for mom" → `["gifting"]`
  
- **styles**: Style/aesthetic tags
  - Options: `"vintage"`, `"retro"`, `"mid-century"`, `"bohemian"`, `"modern"`, `"whimsical"`, `"minimalist"`, `"rustic"`, `"industrial"`, `"art-deco"`
  - Example: "whimsical" → `["whimsical"]`, "vintage" → `["vintage"]`
  
- **moods**: Emotional/vibe tags
  - Options: `"cozy"`, `"elegant"`, `"playful"`, `"romantic"`, `"edgy"`, `"serene"`, `"nostalgic"`, `"quirky"`, `"sophisticated"`
  - Example: "cozy" → `["cozy"]`
  
- **categories**: Product categories
  - Options: `"Kitchen & Dining"`, `"Home Decor"`, `"Collectibles"`, `"Books & Media"`, `"Furniture"`, `"Art"`, `"Electronics"`, `"Fashion"`, `"Jewelry"`, `"Toys & Games"`, `"Sports & Outdoors"`
  
- **priceRange**: Price constraints
  - Example: "under $50" → `{ max: 50 }`, "cheap" → `{ max: 30 }`

### 2. **Database Search** (Supabase)

The interpreted query is used to search across **all text fields** in the `listings` table:

#### Text Fields Searched:
- `title` - Item title
- `description` - Full description
- `category` - Product category
- `condition` - Item condition (e.g., "Excellent", "Good", "Fair")
- `specifications` - Technical specs or additional details

#### Array Fields Filtered:
- `moods[]` - Mood tags (e.g., `["cozy", "elegant"]`)
- `styles[]` - Style tags (e.g., `["vintage", "whimsical"]`)
- `intents[]` - Intent tags (e.g., `["gifting", "selfish"]`)

### 3. **Smart Filtering**

The search uses a **two-phase approach**:

1. **Database query**: Searches text fields with keywords and applies price/category filters
2. **Client-side filtering**: Filters by mood/style/intent arrays for precise matching

If no results are found with strict filtering, it automatically **broadens the search** by removing array filters and trying again with just keywords.

---

## Example Queries

### Query: "whimsical gift for mom that is vintage"

**OpenAI Interpretation:**
```json
{
  "keywords": ["mom", "mother"],
  "intents": ["gifting"],
  "styles": ["whimsical", "vintage"],
  "moods": ["playful"],
  "categories": [],
  "priceRange": null
}
```

**What Gets Searched:**
- Text fields: `title`, `description`, `category`, `condition`, `specifications` containing "mom" OR "mother"
- Array fields: Items with `styles` containing "whimsical" AND "vintage"
- Array fields: Items with `intents` containing "gifting"
- Array fields: Items with `moods` containing "playful"

**Matching Items:**
- ✅ Vintage floral tea set with whimsical hand-painted design (styles: ["whimsical", "vintage"], intents: ["gifting"])
- ✅ 1960s ceramic owl figurine (styles: ["whimsical", "vintage"], moods: ["playful"])
- ❌ Modern minimalist vase (wrong style)
- ❌ Vintage lamp for personal use (wrong intent - not tagged for gifting)

---

### Query: "cozy mug for myself"

**OpenAI Interpretation:**
```json
{
  "keywords": ["mug"],
  "intents": ["selfish"],
  "styles": [],
  "moods": ["cozy"],
  "categories": ["Kitchen & Dining"],
  "priceRange": null
}
```

**What Gets Searched:**
- Text fields containing "mug"
- Category: "Kitchen & Dining"
- Moods: "cozy"
- Intents: "selfish"

---

### Query: "retro stereo under $100"

**OpenAI Interpretation:**
```json
{
  "keywords": ["stereo"],
  "intents": [],
  "styles": ["retro"],
  "moods": [],
  "categories": ["Electronics"],
  "priceRange": { "max": 100 }
}
```

**What Gets Searched:**
- Text fields containing "stereo"
- Category: "Electronics"
- Styles: "retro"
- Price: ≤ $100

---

## Integration Points

### 1. **Voice Search** (`SwipeFeed.tsx`)

Voice input is transcribed using **Whisper** (OpenAI's speech-to-text), then passed to semantic search:

```typescript
const handleTranscriptComplete = async (transcript: string) => {
  if (transcript.trim()) {
    setVoiceTranscript(transcript);
    await handleSearch(transcript); // Uses semantic search
  }
};
```

### 2. **Text Search** (Future)

The same `handleSearch` function can be used for typed queries:

```typescript
const handleSearch = async (query: string) => {
  const { semanticSearch } = await import('@/lib/semantic-search');
  const { listings, interpretation } = await semanticSearch(query, { limit: 24 });
  
  if (listings.length > 0) {
    setSearchResults(listings);
  }
};
```

### 3. **API Endpoint** (`/api/search/semantic/route.ts`)

For client-side searches or external integrations:

```typescript
POST /api/search/semantic
{
  "query": "whimsical gift for mom that is vintage",
  "limit": 24
}

Response:
{
  "listings": [...],
  "interpretation": {
    "keywords": ["mom", "mother"],
    "intents": ["gifting"],
    "styles": ["whimsical", "vintage"],
    ...
  }
}
```

---

## Database Schema Requirements

For semantic search to work, the `listings` table must have:

### Required Columns:
- `title` (text)
- `description` (text, nullable)
- `category` (text, nullable)
- `condition` (text, nullable)
- `specifications` (text, nullable)
- `price` (numeric)
- `status` (text) - must be "active" for items to appear

### Required Array Columns:
- `moods` (text[]) - e.g., `["cozy", "elegant"]`
- `styles` (text[]) - e.g., `["vintage", "whimsical"]`
- `intents` (text[]) - e.g., `["gifting", "selfish"]`

### Example Listing:
```sql
INSERT INTO listings (
  title,
  description,
  category,
  condition,
  price,
  status,
  moods,
  styles,
  intents
) VALUES (
  'Vintage Floral Tea Set',
  'A whimsical hand-painted porcelain tea set from the 1960s. Perfect gift for mom!',
  'Kitchen & Dining',
  'Excellent',
  45.00,
  'active',
  ARRAY['cozy', 'nostalgic'],
  ARRAY['vintage', 'whimsical'],
  ARRAY['gifting', 'home-decor']
);
```

---

## Environment Variables

Make sure `OPENAI_API_KEY` is set in your `.env.local`:

```bash
OPENAI_API_KEY=sk-...
```

---

## Performance Considerations

### Cost:
- **OpenAI API**: ~$0.0001 per search query (GPT-4o-mini)
- Very affordable for typical usage

### Speed:
- **OpenAI interpretation**: ~500-1000ms
- **Database query**: ~50-200ms
- **Total**: ~1-2 seconds per search

### Optimization:
- Uses `gpt-4o-mini` (faster and cheaper than GPT-4)
- Temperature set to 0.3 for consistent extraction
- Automatic fallback to keyword search if OpenAI fails

---

## Testing

### Console Logging:
The search logs helpful debugging info:

```javascript
🔍 Search query: "whimsical gift for mom that is vintage"
🧠 Query interpretation: {
  keywords: ["mom", "mother"],
  intents: ["gifting"],
  styles: ["whimsical", "vintage"],
  moods: ["playful"]
}
📊 Found listings: 5
```

### Test Queries:
1. "whimsical gift for mom that is vintage"
2. "cozy mug for myself"
3. "elegant decor under $50"
4. "retro electronics"
5. "something quirky for a friend"

---

## Future Enhancements

### 1. **Embeddings-Based Search**
- Store OpenAI embeddings for each listing
- Use vector similarity for even better semantic matching
- Would require adding an `embedding` column (vector type)

### 2. **Search History**
- Track popular queries
- Suggest related searches
- Improve interpretation based on user behavior

### 3. **Personalization**
- Learn user preferences over time
- Boost results based on past favorites
- Customize interpretation based on user profile

### 4. **Multi-Language Support**
- Detect query language
- Search across translated fields
- Return results in user's language

---

## Troubleshooting

### No results found:
1. Check if listings have the required array tags (`moods`, `styles`, `intents`)
2. Verify listings are marked as `status = 'active'`
3. Check console logs for interpretation details
4. Try a broader query (e.g., just "vintage" instead of "vintage whimsical gift")

### Slow searches:
1. Ensure database has proper indexes on text columns
2. Consider caching popular query interpretations
3. Reduce `limit` parameter if returning too many results

### OpenAI errors:
1. Verify `OPENAI_API_KEY` is set correctly
2. Check API quota/billing
3. System will automatically fall back to keyword search

---

## Summary

Semantic search transforms ThriftShopper from a basic keyword search into an **intelligent discovery engine** that understands:
- **What** users are looking for (keywords)
- **Why** they want it (intents)
- **How** it should feel (moods)
- **What style** they prefer (styles)

This creates a magical experience where users can speak naturally and find exactly what they're looking for, even if they don't know the exact keywords.

**The heart of ThriftShopper is STORIES** — and semantic search helps users discover items whose stories resonate with them. ✨

