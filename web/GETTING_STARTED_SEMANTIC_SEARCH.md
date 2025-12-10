# Getting Started with Semantic Search

## Quick Start

Your voice search now has **semantic understanding**! It can interpret natural language queries like:
- "whimsical gift for mom that is vintage"
- "cozy mug for myself"
- "retro stereo under $100"

---

## What Changed

### ✅ **New Files Created:**

1. **`web/lib/semantic-search.ts`** - Core semantic search engine
   - Interprets natural language using OpenAI
   - Searches across ALL text fields (title, description, category, condition, specifications)
   - Filters by mood/style/intent arrays
   - Automatic fallback to keyword search

2. **`web/app/api/search/semantic/route.ts`** - API endpoint for semantic search
   - POST `/api/search/semantic` with `{ query, limit }`

3. **`web/SEMANTIC_SEARCH.md`** - Complete documentation
   - How it works
   - Example queries
   - Database schema requirements
   - Troubleshooting guide

4. **`web/scripts/test-semantic-search.ts`** - Test script
   - Run: `npx tsx scripts/test-semantic-search.ts`

### ✏️ **Modified Files:**

1. **`web/app/browse/SwipeFeed.tsx`** - Updated `handleSearch` function
   - Now uses semantic search instead of basic keyword matching
   - Voice input automatically uses semantic search

---

## How to Test

### 1. **Test with Voice** (Recommended)

1. Go to `/browse` page
2. Click the microphone button
3. Say: **"whimsical gift for mom that is vintage"**
4. Watch the console logs to see:
   - 🔍 Search query
   - 🧠 Query interpretation (keywords, intents, styles, moods)
   - 📊 Number of results found

### 2. **Test with Script**

```bash
cd web
npx tsx scripts/test-semantic-search.ts
```

This will test 5 different queries and show you:
- How each query is interpreted
- What results are found
- The tags on each result

### 3. **Test via API**

```bash
curl -X POST http://localhost:3000/api/search/semantic \
  -H "Content-Type: application/json" \
  -d '{"query": "whimsical gift for mom that is vintage", "limit": 5}'
```

---

## What Gets Searched

### Text Fields (Keyword Matching):
- ✅ `title` - Item title
- ✅ `description` - Full description
- ✅ `category` - Product category
- ✅ `condition` - Item condition
- ✅ `specifications` - Technical specs

### Array Fields (Tag Filtering):
- ✅ `moods[]` - Mood tags (cozy, elegant, playful, etc.)
- ✅ `styles[]` - Style tags (vintage, retro, whimsical, etc.)
- ✅ `intents[]` - Intent tags (gifting, selfish, home-decor, etc.)

### Example:
Query: **"whimsical gift for mom that is vintage"**

**Searches for:**
- Keywords: "mom" OR "mother" in any text field
- Styles: "whimsical" AND "vintage" in `styles[]`
- Intents: "gifting" in `intents[]`
- Moods: "playful" in `moods[]`

---

## Database Requirements

For semantic search to work well, your listings need proper tags:

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

### Tag Options:

**Intents:**
- `gifting` - For giving to someone
- `selfish` - For personal use
- `home-decor` - Decorating your space
- `collection` - For collectors
- `functional` - Practical use

**Styles:**
- `vintage`, `retro`, `mid-century`, `bohemian`, `modern`
- `whimsical`, `minimalist`, `rustic`, `industrial`, `art-deco`

**Moods:**
- `cozy`, `elegant`, `playful`, `romantic`, `edgy`
- `serene`, `nostalgic`, `quirky`, `sophisticated`

---

## Console Logs

When you search, you'll see helpful logs:

```
🔍 Search query: "whimsical gift for mom that is vintage"
🧠 Query interpretation: {
  keywords: ["mom", "mother"],
  intents: ["gifting"],
  styles: ["whimsical", "vintage"],
  moods: ["playful"]
}
📊 Found listings: 5
```

---

## Environment Setup

Make sure your `.env.local` has:

```bash
# OpenAI (for semantic search)
OPENAI_API_KEY=sk-...

# Supabase (for database)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## Next Steps

### 1. **Add More Listings with Tags**
   - Make sure existing listings have `moods`, `styles`, and `intents` arrays
   - Use the seller upload form which auto-tags items

### 2. **Test Different Queries**
   - "something cozy for the bedroom"
   - "elegant gift under $50"
   - "retro electronics"
   - "quirky decor for a friend"

### 3. **Monitor Performance**
   - Check console logs for search speed
   - Verify OpenAI API costs (very low with gpt-4o-mini)

### 4. **Improve Results**
   - If searches return too few results, check tag coverage
   - If searches are too slow, consider caching interpretations
   - If searches are inaccurate, adjust the OpenAI prompt in `semantic-search.ts`

---

## Troubleshooting

### ❌ No results found
- **Check:** Do your listings have `moods`, `styles`, and `intents` tags?
- **Check:** Are listings marked as `status = 'active'`?
- **Try:** A broader query (e.g., just "vintage" instead of "vintage whimsical gift")

### ❌ OpenAI API error
- **Check:** Is `OPENAI_API_KEY` set in `.env.local`?
- **Check:** Do you have API credits?
- **Fallback:** System automatically falls back to keyword search

### ❌ Slow searches
- **Normal:** First search takes 1-2 seconds (OpenAI interpretation)
- **Optimize:** Consider caching popular query interpretations
- **Optimize:** Add database indexes on text columns

---

## Summary

You now have a **magical search experience** where users can:
1. **Speak naturally** - "whimsical gift for mom that is vintage"
2. **Get smart results** - System understands intent, style, and mood
3. **Discover stories** - Find items that resonate with them

The voice transcription (Whisper) is already very accurate, and now the semantic search makes it truly intelligent! 🎉

**Next:** Test it out with voice and see the magic happen! ✨

