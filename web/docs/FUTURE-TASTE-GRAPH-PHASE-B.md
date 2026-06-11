# Future Taste Graph — Phase B (Post–App Store)

Phase A (local device) ships in `web/lib/canvasStore.ts` with a stable async API. Phase B replaces the storage backend without rewriting Canvas UI.

## Goals

- Persist Playground across devices and accounts
- Mine buyer intent for recommendations and seller trust (“How Sellers Know You”)
- Treat inspiration photos as first-class signal (Pinterest layer), not just keywords

## Storage swap

Keep the public surface in `canvasStore.ts`:

- `initCanvasStore(userId)`
- `loadCanvasEntries()`
- `saveCanvasEntry(entry)`
- `deleteCanvasEntry(id)`

Phase B implementation:

1. `buyer_canvas_entries` table (Supabase)
2. Storage bucket `canvas-inspiration` for images (replace `imageDataUrl` with `image_path` + signed/public URL)
3. RLS: users CRUD own rows only
4. Optional API routes for image upload (reuse seller upload patterns)

### Suggested schema

```sql
CREATE TABLE public.buyer_canvas_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_type text NOT NULL CHECK (entry_type IN ('vibe_search', 'discovery_note', 'story')),
  body_text text,
  image_path text,
  ai_tags jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

## Signal mapping

| Playground section | Taste graph use |
|--------------------|-----------------|
| Treasure vibe search | Active hunt queries → alerts, Picked for You, saved-search enrichment |
| Discovery Notes (text + photos) | Style/mood vectors; vision tags on photos |
| Stories | Narrative + emotional context; pairs with favorites and purchases |

Feed existing `buyer_events` where possible; canvas entries are richer, semi-structured content.

## Intelligence pipeline (Phase C)

1. On save (async): run inspiration images through listing vision pipeline → `ai_tags` (moods, styles, keywords)
2. Optional embeddings on text + tags for similarity to listings
3. Seller-facing (later): anonymized “hunting style” chips in Quick View / inquiries — not price negotiation

## UI changes when Phase B ships

- Remove Playground helper line: “Saved on this device.”
- Optional: sync indicator, “Saved to your account”
- Cross-device restore on login

## Out of scope for Phase B v1

- Real-time seller visibility of buyer canvas
- Gamified earn/unlock badges
- Bartering / offer language

## Dependencies

- Phase A merged and stable (`canvasStore` callers unchanged)
- Supabase migration + bucket policy
- Vercel env unchanged (uses existing Supabase keys)

## Test plan (Phase B)

- [ ] Same account on phone + desktop sees identical Playground after sync
- [ ] Image upload respects size limits; fallback message on failure
- [ ] Logout/login restores entries
- [ ] `buyer_events` still append-only; no PII leak in analytics payloads
- [ ] Phase A localStorage migrates or coexists gracefully on first login (optional one-time import)
