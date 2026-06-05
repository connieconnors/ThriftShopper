# ThriftShopper — Taste Graph Event Contract

**Created:** May 2026  
**Purpose:** Define the buyer-event catalog and payload spec **now** so we do not reconstruct demand-side behavior later.  
**Scope:** Event catalog + payload spec. **Tier A instrumentation wired in app** (May 2026). **No custom ranker. No UI changes.**

**Deploy:** Run `web/supabase/buyer-events-tier-a.sql` in Supabase if the table was created before Tier A types were added.

**Related:** `web/supabase/buyer-events.sql` · `web/lib/buyerEvents.ts` · `TS-DISCOVERY-ROADMAP.md` · `TS-WINNING.md`

---

## 1. Core concept

ThriftShopper is building a **taste graph** over **mood-tagged inventory**.

Each buyer event is an **edge**:

```
user → (action, weight, context) → listing  OR  intent
```

- **Supply side:** listings carry moods, styles, intents, story, and embeddings at upload (OpenAI `text-embedding-3-small` + pgvector).
- **Demand side:** `buyer_events` is the append-only log of revealed preference.

The goal is **not** dashboard analytics alone. The goal is the **demand-side signal layer** for recommendations, ranking, discovery, and future market intelligence (B2B data, estate/title channels, etc.).

**Browse UX mapping (vertical swipe):**

| Colloquial | ThriftShopper behavior | Planned event |
|------------|------------------------|---------------|
| Swipe away / pass | Next card without tap | `listing_skip` |
| Pause on card | Stay on slide without opening detail | `listing_dwell` |
| Tap through | Open listing detail | `listing_click` → `listing_view` |

---

## 2. Already logged events (keep + enrich)

These types exist in `buyer_events` today. **Keep them.** Enrich `payload` on every insert where possible (no schema change required).

| `event_type` | When it fires (today) | `listing_id` | Enrich payload with |
|--------------|----------------------|--------------|---------------------|
| `listing_view` | Listing detail mount (once per load) | yes | `session_id`, `surface`, `from` (browse/canvas/favorites), `dwell_ms` on leave (future) |
| `favorite` | Heart on | yes | `session_id`, `surface`, `recommendation_type` if from picks/similar |
| `unfavorite` | Heart off | yes | same as `favorite` |
| `search` | Semantic search completes (incl. 0 results) | usually null | `session_id`, `query`, `interpreted_terms`, `result_count`, `voice: true/false` |
| `mood_select` | Mood filter returns ≥1 match | null | `session_id`, `moods[]`, `match_count`, `source: semantic \| tags` |
| `purchase` | Order success | yes | `session_id`, `order_id`, optional amount |

**Surfaces** (use in payload): `browse` · `canvas` · `listing_detail` · `search_results` · `picked_for_you` · `more_like_this` · `favorites`

**Tier A wired (logged-in):** `session_id` + `surface` on enriched events; browse `listing_impression` / `listing_dwell` / `listing_skip` / `listing_click`; `recommendation_impression` / `recommendation_click` (canvas + more-like-this carousels; picked deck impression on browse); `search_no_results`; `voice_search_start` / `voice_search_cancel`.

---

## 3. Next event types to add

Extend `buyer_events_event_type_check` in a **single migration** when instrumentation ships. Until then, this section is the contract.

### Highest priority

| `event_type` | Meaning | `listing_id` |
|--------------|---------|--------------|
| `listing_impression` | Card was the active slide (or carousel tile visible) | yes |
| `listing_dwell` | Remained on card ≥ threshold ms without opening detail | yes |
| `listing_skip` | Advanced past card without tap (negative signal) | yes |
| `listing_click` | Tap from browse/carousel toward detail (before/at navigation) | yes |
| `recommendation_impression` | “Picked for you” or “More like this” block shown | null or first visible id |
| `recommendation_click` | Tap from recommendation surface | yes |
| `search_no_results` | Query + interpretation, zero listings returned | null |
| `voice_search_start` | Mic opened / listening began | null |
| `voice_search_cancel` | Mic closed without completed search | null |

**Recommendation favorites:** log as `favorite` with `payload.recommendation_type: picked_for_you | more_like_this` — no separate event type unless analytics need a split.

### Nice later

| `event_type` | Meaning |
|--------------|---------|
| `share` | Share sheet or link copied |
| `contact_seller` | Message modal sent |
| `checkout_start` | Checkout flow entered |
| `clear_search` | User cleared active search deck |
| `clear_mood` | User cleared mood filter |
| `deck_reshuffle` | End-of-deck reshuffle (engagement pattern) |

---

## 4. Payload convention

All events use the same `payload` jsonb column. **Optional fields omit key or use `null` — do not block inserts.**

### Base context (include when known)

```json
{
  "session_id": "uuid-per-browse-visit",
  "surface": "browse",
  "position": 3,
  "deck_size": 42,
  "active_moods": ["Cozy", "Nostalgic"],
  "active_search_query": "vintage gift for mom",
  "client": "web",
  "app_version": "beta"
}
```

**`surface` enum:** `browse` · `canvas` · `listing_detail` · `search_results` · `picked_for_you` · `more_like_this` · `favorites`

**`recommendation_type` (when relevant):** `picked_for_you` · `more_like_this`

### Event-specific fields (examples)

```json
{
  "query": "whimsical vintage gift",
  "interpreted_terms": ["whimsical", "vintage", "gift"],
  "result_count": 12,
  "voice": true,
  "dwell_ms": 4200,
  "match_count": 8,
  "source": "semantic",
  "from": "browse",
  "order_id": "uuid"
}
```

### Listing snapshot (strongly recommended for training)

Capture facets **at event time** so tag edits do not rewrite history.

```json
{
  "listing_snapshot": {
    "moods": [],
    "styles": [],
    "intents": [],
    "category": "",
    "price": 24.99,
    "embedding_id": "listing_uuid"
  }
}
```

`embedding_id` = `listing.id` (join to `listings.embedding` for vector ops). Denormalize tags/price only in snapshot.

---

## 5. Session rule

- Create **one `session_id`** (UUID v4) per visit to `/browse` **or** per app open (pick one rule in code and stick to it; browse-visit is recommended for beta web).
- **All** impressions, skips, dwells, searches, moods, clicks, favorites, and purchases in that visit share the same `session_id`.
- New session when: user lands on `/browse` fresh, or session idle &gt; 30 minutes (future; document now, implement later).
- Store `session_id` in memory (module ref); optional `sessionStorage` backup for soft reloads.

Sequences matter for taste models: `mood_select` → `search` → `listing_skip`×N → `favorite` → `listing_view` → `purchase`.

---

## 6. Weighting notes (future ranker only)

Not product logic. Used when building taste vectors / rerankers from event streams.

| Signal | Weight |
|--------|--------|
| `purchase` | 10 |
| `favorite` | 5 |
| `listing_view` + long dwell | 3 |
| `recommendation_click` | 3 |
| `listing_dwell` (browse) | 2 |
| `search` with click-through | 2 |
| `mood_select` | 2 |
| `listing_impression` | 0.1 |
| `listing_skip` | −1 |
| `unfavorite` | −2 |

Apply time decay (e.g. half-life 14–30 days) when aggregating — specification TBD at ranker phase.

---

## 7. Investor framing

> We’re building a **taste graph** over mood-tagged inventory: every search, mood session, dwell, skip, favorite, and purchase is an edge we own. Listings have embeddings at upload; buyer events supply the demand side for ranking and market intelligence later.

**Honest ML line:** Foundation and event capture ship in beta; rankers need density — same playbook as shipping DwellFacts / GoShed before scaling models.

---

## 8. Future migration contract (SQL sketch)

Run in Supabase when adding Tier A types. Adjust if types already exist.

```sql
-- Taste graph Tier A — extend event_type allowlist
ALTER TABLE public.buyer_events
  DROP CONSTRAINT IF EXISTS buyer_events_event_type_check;

ALTER TABLE public.buyer_events
  ADD CONSTRAINT buyer_events_event_type_check CHECK (
    event_type IN (
      -- v1 (live)
      'listing_view',
      'favorite',
      'unfavorite',
      'search',
      'mood_select',
      'purchase',
      -- v2 (instrumentation)
      'listing_impression',
      'listing_dwell',
      'listing_skip',
      'listing_click',
      'recommendation_impression',
      'recommendation_click',
      'search_no_results',
      'voice_search_start',
      'voice_search_cancel',
      -- v3 (later)
      'share',
      'contact_seller',
      'checkout_start',
      'clear_search',
      'clear_mood',
      'deck_reshuffle'
    )
  );
```

Mirror allowlist in `web/lib/buyerEvents.ts` → `BUYER_EVENT_TYPES` when each tier ships.

---

## 9. Implementation checklist

- [x] Session ID (`getBrowseSessionId` in `web/lib/buyerEventContext.ts`)
- [x] Enrich v1 events with `buildEventPayload` + listing snapshots where listing is known
- [x] Tier A migration file + `buyer-events.ts` types
- [x] Browse impression / dwell / skip / click (`useBrowseCardEvents`)
- [x] `search_no_results` + voice start/cancel
- [x] Recommendation impression/click on carousels + picked deck
- [ ] Tier B (`share`, `contact_seller`, `checkout_start`, `clear_search`, `clear_mood`, `deck_reshuffle`)
- [ ] `listing_view` dwell on detail unmount

---

## 10. Tech conversation one-liners

**Default (graph + moat):**

> We’re building a bipartite taste graph — mood-tagged listings with upload-time embeddings on one side, and an append-only buyer event stream on the other; every swipe, dwell, search, and purchase is an edge we own for reranking later, not a wrapper on ChatGPT.

**Shorter (panel speed):**

> Supply-side vectors at listing intake, demand-side edges from buyer_events — that’s the taste graph; ranking is retrieval plus event-weighted rerank when we have density.

**If they say “just analytics”:**

> PostHog can tell you what happened; we’re storing training-grade edges with listing snapshots and session sequences so the ranker doesn’t depend on reconstructed logs.

---

*Contract only. Update this file when tiers ship or payload fields change.*
