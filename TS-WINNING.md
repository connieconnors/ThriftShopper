# ThriftShopper — Winning (Investor MVP Sprint)

**Created:** May 23, 2026  
**Purpose:** Smallest set of changes that make the product feel one step ahead and start the **data moat** (mood-tagged inventory + buyer behavior). Use this for tomorrow’s build session.

**Related docs:** `TS-MASTER-BRIEF.md` (ecosystem + founder context) · `TS-DISCOVERY-ROADMAP.md` (technical phases)

**Status:** #1–#2 shipped in code — #3 (`buyer_events`) next.

---

## Ecosystem context (from master brief)

*The circular economy is an emotional economy.* Users want a **good home** and **narrative preservation** for things they loved — not profit-maximization alone.

| Asset | Role in the flywheel |
|-------|----------------------|
| **GoShed** | Voice-first intake: capture object + story when letting go (App Store live) |
| **ThriftShopper** | Predictive buyer-discovery marketplace; mood/style/intent + behavior data |
| **DwellFacts** | Upstream “Carfax for the home” — estate/property intelligence (launched May 23, 2026) |
| **MemexMe / My Trove Book** | Legacy archive auto-populated from GoShed narrative intake (future) |

**Intake → two outputs (target state):** GoShed capture → immutable MemexMe page + auto-styled ThriftShopper listing.

**Near-term investor frame:** $2M–$5M seed (e.g. FJ Labs); Vinted-style economics (free list/sell, **Buyer Protection Fee** at checkout). Long-term: strategic data/marketplace asset under ThriftShopper Inc. ($25M+ exit thesis per master brief).

---

## One-line pitch (ThriftShopper-specific)

ThriftShopper is the **predictive discovery layer** on a proprietary graph: **mood–style–intent–story** per listing, fed by **GoShed intake** and **DwellFacts upstream signals**, deepened by **buyer_events** (search, mood, favorite, purchase).

**Money is in the data:** supply-side intelligence × demand-side behavior × emotional closure outcomes → rankers and B2B data later (title, auction, estate channels per DwellFacts playbook).

---

## What we already have (don’t rebuild)

- Upload intelligence: Opus ID, `styles` / `moods` / `intents`, story, OpenAI `embedding`
- Semantic search API + query interpretation (hidden in console today)
- `POST /api/search/semantic-mood` + pgvector (`match_listings_by_mood`) — **not wired to mood wheel**
- Favorites in Supabase — **not used for ranking**
- `search/visual`, `embeddings/regenerate` — later phases

**Gap:** behavior never feeds discovery; demo doesn’t *show* the intelligence.

---

## Tomorrow sprint — build in this order

### Day 1 morning — visible “wow” (no new tables)

| # | Feature | Effort | Files / notes |
|---|---------|--------|----------------|
| **1** | **Interpretation chips** after voice/text search | ~½ day | `SwipeFeed.tsx` — render `interpretation.termGroups` (e.g. *whimsical · vintage · gifting*). API already returns it. |
| **2** | **Semantic mood wheel** | ~1 day | On mood apply → `POST /api/search/semantic-mood` → replace/merge deck. Fallback to current tag filter if API fails. `SwipeFeed.tsx`, existing route. |

**Demo script:** Search “whimsical vintage gift for mom” → chips appear → pick *Cozy* + *Nostalgic* on wheel → deck updates with semantic matches.

---

### Day 1 afternoon — data moat starts

| # | Feature | Effort | Notes |
|---|---------|--------|--------|
| **3** | **`buyer_events` table + logging** | 1–2 days | Supabase migration + thin `POST /api/events` (or direct insert with RLS). Fire-and-forget; never block UI. |

**Event types (v1):**

| `event_type` | Trigger |
|--------------|---------|
| `listing_view` | Listing detail open or card dwell (pick one rule; document it) |
| `favorite` | Heart on |
| `unfavorite` | Heart off |
| `search` | Semantic search submitted — store `query` + `interpretation` JSON |
| `mood_select` | Mood wheel applied — store mood array |
| `purchase` | Order success (webhook and/or client) |

**Suggested columns:** `id`, `user_id`, `event_type`, `listing_id` (nullable), `payload` (jsonb), `created_at`.

**Investor line:** “We own longitudinal buyer behavior on mood-tagged inventory — not a wrapper on ChatGPT.”

---

### Day 2 — personalization without “ML”

| # | Feature | Effort | Notes |
|---|---------|--------|--------|
| **4** | **“Picked for you”** row | 1–2 days | If user has ≥2 favorites: average `listing.embedding` → `match_listings_by_mood` (or new RPC) → 6–12 cards above shuffle deck or on Canvas. |
| **5** | **“More like this”** on listing detail | ½–1 day | Current listing embedding → same RPC → horizontal carousel. `ProductDetails.tsx` or listing page. |

**Demo script:** Favorite two items → refresh browse → “Picked for you” shifts → open any listing → “More like this.”

---

## Minimum “Winning” bundle (if time is tight)

Ship **#1 + #2 + #3** first. That alone gives:

- Product: feels intelligent in a live demo  
- Data: proprietary event stream begins  
- Story: Phase 2 ranker / taste vector (see roadmap)

Add **#4 + #5** when Day 1 is stable.

---

## Explicitly out of scope for this sprint

- Custom prediction / ranker model  
- Hugging Face or new embedding vendor  
- Full feed replacement (kill global shuffle)  
- Image similarity / camera search (`search/visual`)  
- PostHog as substitute for `buyer_events` (use both if easy; **Supabase events = the asset**)

---

## Investor talking points (after sprint)

Align with `TS-MASTER-BRIEF.md` voice: understated, expert, no hype — *curation over volume*, *The Magic of Discovery™*.

| Layer | What to say |
|-------|-------------|
| **Philosophy** | Emotional closure + good homes for objects; marketplace as discovery, not garage-sale arbitrage. |
| **Supply** | GoShed-grade identification + TS mood/style/intent/story + embeddings at upload. |
| **Upstream** | DwellFacts predicts *where* treasure moves; TS predicts *what* buyers want when they see it. |
| **Demand** | `buyer_events`: search, mood, view, favorite, purchase — proprietary demand graph. |
| **Product** | Interpretation chips, semantic moods, “Picked for you” — proof the graph works in the UI. |
| **Flywheel** | GoShed intake → (future) MemexMe archive + TS listing in one capture session. |
| **Next** | Taste vectors + ranker; B2B data paths echo DwellFacts (auction, title, estate). |

**Honest on prediction:** “Foundation and event capture ship in beta; models need density — same playbook as launching DwellFacts and GoShed before scaling ML.”

---

## Success checklist (before showing investors)

- [x] Search shows interpretation chips (not only console)
- [x] Mood wheel uses semantic-mood API (tag filter fallback if API/vectors fail)
- [ ] `buyer_events` rows appear in Supabase when you browse as test user
- [ ] Logged-in user with 2+ favorites sees “Picked for you”
- [ ] Listing detail shows “More like this” with ≥1 result
- [ ] One rehearsed 90s flow: search → moods → favorite → picked for you → more like this

---

## Key code references

| Piece | Path |
|-------|------|
| Browse / search UI | `web/app/browse/SwipeFeed.tsx` |
| Semantic search API | `web/app/api/search/semantic/route.ts` |
| Semantic mood API | `web/app/api/search/semantic-mood/route.ts` |
| Term + embed logic | `web/lib/semantic-search.ts` |
| Favorites | `web/hooks/useFavorites.ts` |
| Listing detail | `web/app/listing/[id]/ProductDetails.tsx` |
| Canvas / buyer home | `web/app/canvas/page.tsx` |
| pgvector RPC | `match_listings_by_mood` (Supabase SQL) |
| Longer roadmap | `TS-DISCOVERY-ROADMAP.md` |

---

## Suggested PR split

1. **PR 1:** Interpretation chips + semantic mood wheel  
2. **PR 2:** `buyer_events` migration + API + client hooks  
3. **PR 3:** Picked for you + More like this  

---

*Start here tomorrow morning. Update checkboxes as items ship.*
