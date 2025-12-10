# 🔄 Semantic Search Flow

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER SPEAKS                              │
│         "whimsical gift for mom that is vintage"                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   WHISPER TRANSCRIPTION                          │
│                    (Already Working!)                            │
│                                                                  │
│  Audio → Text: "whimsical gift for mom that is vintage"         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SEMANTIC INTERPRETATION                         │
│                    (NEW - OpenAI GPT-4o-mini)                    │
│                                                                  │
│  Input: "whimsical gift for mom that is vintage"                │
│                                                                  │
│  🧠 AI Extracts:                                                 │
│     ├─ keywords: ["mom", "mother"]                              │
│     ├─ intents: ["gifting"]                                     │
│     ├─ styles: ["whimsical", "vintage"]                         │
│     ├─ moods: ["playful"]                                       │
│     ├─ categories: []                                            │
│     └─ priceRange: null                                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE QUERY                                │
│                    (Supabase PostgreSQL)                         │
│                                                                  │
│  Phase 1: Text Search (Keywords)                                │
│  ─────────────────────────────────                              │
│  SELECT * FROM listings WHERE                                   │
│    (title ILIKE '%mom%' OR                                      │
│     description ILIKE '%mom%' OR                                │
│     category ILIKE '%mom%' OR                                   │
│     condition ILIKE '%mom%' OR                                  │
│     specifications ILIKE '%mom%')                               │
│  AND status = 'active'                                          │
│  ORDER BY created_at DESC                                       │
│  LIMIT 24                                                       │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CLIENT-SIDE FILTERING                          │
│                   (Array Tag Matching)                           │
│                                                                  │
│  Phase 2: Filter by Tags                                        │
│  ─────────────────────────                                      │
│  For each listing:                                              │
│    ✓ Check if styles[] contains "whimsical" AND "vintage"      │
│    ✓ Check if intents[] contains "gifting"                     │
│    ✓ Check if moods[] contains "playful"                       │
│                                                                  │
│  Keep only listings that match ALL tag types                    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      RESULTS RETURNED                            │
│                                                                  │
│  Example Results:                                               │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 1. Vintage Floral Tea Set                             │    │
│  │    Price: $45                                          │    │
│  │    Styles: ["vintage", "whimsical"]                   │    │
│  │    Intents: ["gifting", "home-decor"]                 │    │
│  │    Moods: ["cozy", "nostalgic"]                       │    │
│  │    ✅ Perfect match!                                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ 2. 1960s Ceramic Owl Figurine                         │    │
│  │    Price: $28                                          │    │
│  │    Styles: ["vintage", "whimsical"]                   │    │
│  │    Intents: ["gifting", "collection"]                 │    │
│  │    Moods: ["playful", "quirky"]                       │    │
│  │    ✅ Perfect match!                                   │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Code Flow

### 1. **User Speaks** (`SwipeFeed.tsx`)

```typescript
// Voice input component
const handleTranscriptComplete = async (transcript: string) => {
  if (transcript.trim()) {
    setVoiceTranscript(transcript);
    await handleSearch(transcript); // ← Calls semantic search
  }
};
```

### 2. **Semantic Search** (`lib/semantic-search.ts`)

```typescript
export async function semanticSearch(query: string) {
  // Step 1: Interpret query with OpenAI
  const interpretation = await interpretQuery(query);
  // {
  //   keywords: ["mom", "mother"],
  //   intents: ["gifting"],
  //   styles: ["whimsical", "vintage"],
  //   moods: ["playful"]
  // }

  // Step 2: Search database with interpretation
  const listings = await searchWithInterpretation(interpretation);

  return { listings, interpretation };
}
```

### 3. **OpenAI Interpretation** (`lib/semantic-search.ts`)

```typescript
async function interpretQuery(query: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Analyze this search query and extract structured information:
          "${query}"
          
          Extract: keywords, intents, styles, moods, categories, priceRange
          Return JSON only.`
      }],
    }),
  });

  return JSON.parse(response.choices[0].message.content);
}
```

### 4. **Database Query** (`lib/semantic-search.ts`)

```typescript
async function searchWithInterpretation(interpretation) {
  // Build keyword search
  const orConditions = interpretation.keywords.map(keyword => 
    `title.ilike.*${keyword}*,description.ilike.*${keyword}*,category.ilike.*${keyword}*,condition.ilike.*${keyword}*,specifications.ilike.*${keyword}*`
  ).join(',');

  // Query database
  let query = supabase
    .from('listings')
    .select('*')
    .eq('status', 'active')
    .or(orConditions);

  // Apply price filter
  if (interpretation.priceRange?.max) {
    query = query.lte('price', interpretation.priceRange.max);
  }

  const { data } = await query.limit(24);

  // Client-side array filtering
  return data.filter(listing => {
    const matchesStyles = interpretation.styles.every(style =>
      listing.styles.includes(style)
    );
    const matchesIntents = interpretation.intents.every(intent =>
      listing.intents.includes(intent)
    );
    const matchesMoods = interpretation.moods.every(mood =>
      listing.moods.includes(mood)
    );

    return matchesStyles && matchesIntents && matchesMoods;
  });
}
```

---

## Data Flow Example

### Input:
```
User says: "whimsical gift for mom that is vintage"
```

### Step 1: Whisper Transcription
```
Audio → "whimsical gift for mom that is vintage"
```

### Step 2: OpenAI Interpretation
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

### Step 3: Database Query
```sql
SELECT * FROM listings
WHERE (
  title ILIKE '%mom%' OR 
  description ILIKE '%mom%' OR 
  category ILIKE '%mom%' OR 
  condition ILIKE '%mom%' OR 
  specifications ILIKE '%mom%'
) AND status = 'active'
ORDER BY created_at DESC
LIMIT 24
```

### Step 4: Client-Side Filtering
```javascript
results.filter(listing => {
  // Must have BOTH "whimsical" AND "vintage" in styles
  const hasWhimsical = listing.styles.includes('whimsical');
  const hasVintage = listing.styles.includes('vintage');
  
  // Must have "gifting" in intents
  const hasGifting = listing.intents.includes('gifting');
  
  // Must have "playful" in moods
  const hasPlayful = listing.moods.includes('playful');
  
  return hasWhimsical && hasVintage && hasGifting && hasPlayful;
})
```

### Step 5: Results
```javascript
[
  {
    id: "abc123",
    title: "Vintage Floral Tea Set",
    description: "A whimsical hand-painted porcelain tea set from the 1960s. Perfect gift for mom!",
    price: 45,
    styles: ["vintage", "whimsical"],
    intents: ["gifting", "home-decor"],
    moods: ["cozy", "nostalgic"]
  },
  {
    id: "def456",
    title: "1960s Ceramic Owl Figurine",
    description: "Adorable vintage owl with big eyes. Great gift!",
    price: 28,
    styles: ["vintage", "whimsical"],
    intents: ["gifting", "collection"],
    moods: ["playful", "quirky"]
  }
]
```

---

## Performance Breakdown

```
┌─────────────────────────┬──────────┬─────────────┐
│ Step                    │ Time     │ Cost        │
├─────────────────────────┼──────────┼─────────────┤
│ Whisper Transcription   │ ~1-2s    │ Free*       │
│ OpenAI Interpretation   │ ~500ms   │ ~$0.0001    │
│ Database Query          │ ~100ms   │ Free        │
│ Client-Side Filtering   │ ~10ms    │ Free        │
├─────────────────────────┼──────────┼─────────────┤
│ TOTAL                   │ ~2-3s    │ ~$0.0001    │
└─────────────────────────┴──────────┴─────────────┘

* Whisper is free via OpenAI API (included in usage)
```

---

## Fallback Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRIMARY: Semantic Search                      │
│                                                                  │
│  ✓ OpenAI interpretation                                        │
│  ✓ Multi-field text search                                      │
│  ✓ Array tag filtering                                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                    If OpenAI fails
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FALLBACK: Keyword Search                       │
│                                                                  │
│  ✓ Simple word splitting                                        │
│  ✓ Basic text search (title, description, category)            │
│  ✓ No tag filtering                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Console Output Example

When you search, you'll see:

```javascript
🔍 Search query: "whimsical gift for mom that is vintage"

🧠 Query interpretation: {
  keywords: ["mom", "mother"],
  intents: ["gifting"],
  styles: ["whimsical", "vintage"],
  moods: ["playful"],
  categories: [],
  priceRange: null
}

📊 Found listings: 5

🎯 Top Results:
   1. Vintage Floral Tea Set
      Price: $45
      Category: Kitchen & Dining
      Moods: cozy, nostalgic
      Styles: vintage, whimsical
      Intents: gifting, home-decor

   2. 1960s Ceramic Owl Figurine
      Price: $28
      Category: Collectibles
      Moods: playful, quirky
      Styles: vintage, whimsical
      Intents: gifting, collection
```

---

## Summary

The semantic search flow is:

1. **Voice → Text** (Whisper) ✅ Already working
2. **Text → Meaning** (OpenAI) ✅ NEW!
3. **Meaning → Query** (Smart filtering) ✅ NEW!
4. **Query → Results** (Supabase) ✅ Enhanced!

**Result:** Users can speak naturally and get intelligent results! 🎯✨

