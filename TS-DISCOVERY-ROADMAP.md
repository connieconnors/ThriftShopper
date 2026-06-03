# ThriftShopper — Discovery & “Future of Search” Roadmap

**Generated:** May 23, 2026  
**Context:** Strategic notes on mood-led search, behavioral personalization (Netflix-style), APIs/models, and what to build after App Store. Complements `TS-2.0-BETA-AUDIT.md`.

**Not in scope:** Hugging Face wiring (see audit §4 — `lib/embeddings.ts` is dead code; production uses OpenAI `text-embedding-3-small` + pgvector).

---

## Executive summary

ThriftShopper is **ahead on listing taxonomy** (moods, styles, intents, story, Opus upload, text embeddings) but **behind on closed-loop discovery**: behavior does not feed ranking, and several APIs are built but not wired to browse.

Netflix-style discovery is roughly **20% smarter LLM** and **80% event data + retrieval + rerank**. The highest ROI path is not a new model vendor — it is **wire existing vector mood search**, **embed-first queries**, and **server-side taste from favorites/events**.

**Do not block App Store submission** on any of this. Ship first; iterate discovery post-launch.

---

## What you already have

| Layer | Status |
|--------|--------|
| **Listing “soul”** | Upload: `styles`, `moods`, `intents`, story, Opus title/description, OpenAI embedding in DB |
| **Natural-language search** | Voice → semantic term extraction + keyword scoring; pgvector **only as backup** when keyword hits &lt; limit |
| **Mood wheel** | Client-side filter on listing `moods` arrays — **not** wired to `POST /api/search/semantic-mood` |
| **Favorites** | Supabase `favorites` — saved, **not** used for discovery ranking |
| **Light memory** | `web/lib/userPreferences.ts` — recently viewed, saved searches/moods/vibes in **localStorage only** |
| **Analytics shell** | PostHog provider — not a recommendation engine |
| **Dormant APIs** | `search/semantic-mood`, `search/visual`, `embeddings/regenerate` — built, partially or not wired to browse |

**Differentiation vs generic marketplaces:** mood / style / intent / seller story as first-class facets — lean into explainable “vibe” discovery, not keyword-only search.

---

## Gaps you are probably overlooking

### 1. Mood wheel ≠ semantic mood search

Browse filters with **exact mood tag matching**. You already have:

- `POST /api/search/semantic-mood` — embed combined moods → `match_listings_by_mood` (pgvector)

The wheel does **not** call this today. Users get strict tags; infrastructure for “cozy + nostalgic” similarity already exists.

### 2. Default browse is intentionally blind

Swipe feed = load `discoverable_listings` → **shuffle**. No taste profile, no “because you liked…”, no engagement-based ranking. Netflix never shuffles uniformly.

### 3. Behavioral signals are not a server-side taste model

- **Have:** favorites in Supabase  
- **Missing:** pass/skip, dwell time, search→click, mood sessions, purchase → unified events → rank  
- **localStorage** taste does not survive device change or power SQL-side personalization

### 4. Embeddings are under-used

Vectors written at upload; search uses them **only when keyword search returns fewer than `limit` hits**. Vague queries (“something for a moody apartment”) should often be **embed-first**, keyword-second.

### 5. Visual similarity is the thrift “wow” — unwired

`web/app/api/search/visual/route.ts` exists. For vintage, **“find more like this photo”** (era, patina, shape) beats another text LLM. Closer to Pinterest/Netflix thumbnail similarity than chat search.

### 6. Cold start & trust (non-AI)

- New buyers: need editorial moods or trending-by-engagement, not pure shuffle  
- New sellers: weak tags → search quality collapses  
- UGC photos: moderation / prohibited-items (App Store + search quality)

---

## What “Netflix for thrift” actually requires

```
Upload AI tags + text embed [+ optional image embed]
        ↓
Events: view/dwell, favorite, skip, search, mood_select, purchase
        ↓
User taste: vector and/or mood-style histogram
        ↓
Retrieve top ~200 (pgvector + filters) → Rerank top ~24 → Personalized swipe deck
```

You do **not** need a frontier LLM on every swipe. You need:

1. **Event stream** (even 5 event types)  
2. **Retrieval** (pgvector + mood/style/price/geo filters)  
3. **Rerank** (rules + embeddings first; ML later)  
4. **Explainability** — “Because you saved Folk Art and searched cozy” (trust in a curated marketplace)

---

## Hugging Face — recap

| Question | Answer |
|----------|--------|
| Improve default browse? | **No** — feed is DB + shuffle; no ML on load |
| Missing capability without HF? | **No** — OpenAI embeddings + pgvector already used |
| Risk if wired? | **Slower search**, dimension mismatch (MiniLM 384 vs OpenAI 1536), full re-embed migration |

See prior analysis: `web/lib/embeddings.ts` is never imported; seller upload and `match_listings_by_mood` use **OpenAI `text-embedding-3-small` (1536)**.

---

## APIs & models — prioritized

### Tier A — High impact, fits current stack

| Capability | Approach | Notes |
|------------|----------|--------|
| **Semantic mood browse** | Wire mood wheel → `semantic-mood` + optional tag boost | Code already exists |
| **Embed-first search** | Query embed → pgvector → optional LLM term expand | Better vague/poetic queries |
| **Taste from favorites** | Mean/weighted embedding of favorited listings → “For You” deck | Uses `favorites` + `listing.embedding` |
| **Image similarity** | Multimodal/image embed on listing photos + `image_embedding` column | Do not mix vector spaces without fusion strategy |
| **Reranking** | e.g. Cohere Rerank on top 50 candidates | Cheap quality jump |
| **Event-backed rank** | PostHog export or `buyer_events` table; boost styles/moods user engages with | Netflix-lite without custom ML day one |

**Multimodal image embeddings (pick one path):**

- OpenAI multimodal / embedding APIs where image+text share a pipeline  
- Google Gemini or extend existing Vision stack  
- CLIP-style via Replicate — store **`image_embedding` separate** from 1536-d text vectors

### Tier B — Evaluate later

| Tool | Role |
|------|------|
| Voyage AI / Cohere Embed | Stronger retrieval if OpenAI-only limits quality |
| Algolia NeuralSearch / Pinecone | If Supabase pgvector ops or latency hurt at scale |
| Gemini / GPT-4o (batch) | Enrich listings: era, material, room, giftability — **batch**, not per swipe |

### Tier C — Skip for now

| Tool | Why |
|------|-----|
| Hugging Face Inference | Dead path; latency; dimension mismatch |
| New LLM every month on browse | Marginal vs vectors + behavior |
| Full custom Netflix ML | Overkill until volume + data team |

**Opus:** keep for **seller upload** (high value, rare). Not for per-swipe browse (cost, latency, no substitute for behavioral data).

---

## Phased roadmap

### Phase 1 — Unlock what you built (weeks)

1. Mood wheel → `POST /api/search/semantic-mood` (hybrid: vector + tag boost)  
2. Run `/api/embeddings/regenerate` so active listings have `embedding` populated  
3. Search: embed-first when query is long/vague or keyword hits are weak  
4. Listing detail: “More like this” from same listing embedding  

**Key files:** `web/app/browse/SwipeFeed.tsx`, `web/app/api/search/semantic-mood/route.ts`, `web/app/api/search/semantic/route.ts`, `web/lib/semantic-search.ts`, `web/supabase/fix-security-warnings-simple.sql` (`match_listings_by_mood`)

### Phase 2 — Behavioral (Netflix-lite)

1. Server table `buyer_events`: `listing_view`, `favorite`, `skip`, `search`, `mood_select`, `purchase`  
2. On login or nightly: `taste_vector` or mood/style histogram (last 30 days)  
3. Default browse: retrieve by taste + diversity rules, not global shuffle  
4. Move `userPreferences.ts` signals to server where possible  

### Phase 3 — Visual thrift (moat)

1. Image embedding at upload (parallel to text embed)  
2. Productize `search/visual` in browse (camera/gallery → similar listings)  
3. Optional Cohere (or similar) rerank on top candidates  

### Phase 4 — With traffic only

Collaborative filtering, seller clusters, PostHog A/B on ranking recipes.

---

## Product principles (don’t copy Netflix blindly)

| Netflix optimizes | ThriftShopper can optimize |
|-------------------|----------------------------|
| Watch time | Discovery delight + purchase trust |
| Opaque algo | Explainable chips: moods/styles/intents on “why this card” |
| Global catalog | Seller `story_text` in embed text — competitor moat |
| Endless feed | Serendipity **within** a taste band, not pure random shuffle |

---

## Architecture reference (current code)

| Component | Path |
|-----------|------|
| Browse UI | `web/app/browse/SwipeFeed.tsx`, `web/app/browse/page.tsx` |
| Term + embed search | `web/lib/semantic-search.ts`, `web/app/api/search/semantic/route.ts` |
| Semantic mood API (unwired to wheel) | `web/app/api/search/semantic-mood/route.ts` |
| Visual search API (unwired to UI) | `web/app/api/search/visual/route.ts` |
| Embeddings at upload | `web/lib/seller-upload-service.ts` |
| Dead HF helper | `web/lib/embeddings.ts` |
| pgvector RPC | `match_listings_by_mood` in Supabase SQL migrations |
| Favorites | `web/hooks/useFavorites.ts`, `favorites` table |
| Local prefs only | `web/lib/userPreferences.ts` |
| Mood wheel UI | `web/components/MoodWheel.tsx`, `StandaloneMoodWheel.tsx` |
| PostHog | `web/app/providers/PostHogProvider.tsx` |

---

## Suggested first implementation (when ready on Lenovo)

**Project:** “Mood wheel uses pgvector + favorites blend the default deck”

1. On mood selection: call `semantic-mood` with selected moods; merge with client tag filter.  
2. For logged-in users with ≥3 favorites: compute average embedding of favorited listings; prepend “For You” section or bias shuffle order.  
3. Log events to Supabase (minimal schema) for Phase 2.

---

## Related docs

- `TS-2.0-BETA-AUDIT.md` — beta + App Store + Stripe  
- `TS-MOBILE-SHELL-AUDIT.md` — iOS shell polish  
- `web/SEMANTIC_SEARCH.md`, `web/SEMANTIC_SEARCH_SUMMARY.md` — original semantic search implementation notes  

---

*End of roadmap.*
