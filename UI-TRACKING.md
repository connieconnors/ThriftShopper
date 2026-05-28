# UI & Design Tracking — TS 2.0 Beta

Living notes for design decisions, open polish items, and testing follow-ups.  
*(Not a spec — just a place to keep track while iterating.)*

**Formal audit:** See [`THRIFTSHOPPER-UI-LOCK-AUDIT.md`](./THRIFTSHOPPER-UI-LOCK-AUDIT.md) (2026-05-28) — drift analysis, blue/black bleed root causes, minimum fix.

---

## Typography system (established)

| Layer | Font | Use |
|--------|------|-----|
| Discovery / editorial / brand | **Playfair** | Product titles, splash, welcome headers, wordmark moments |
| Utility / system | **Inter** | Prices, buttons, menus, forms, metadata, settings |

**Classes:** `.discovery-title` (Playfair 400), `.font-system`, `.font-ui-heading`, `.font-editorial`

---

## Recently shipped (main)

| Commit | What |
|--------|------|
| `56cb42c` | Typography + welcoming auth (login, signup, account sheet, splash Playfair) |
| `01a8a2b` | Browse shell: linen hardening, theme-color → linen, card stage → black, neutral gradients |

## Experiments (not on main)

| Branch | Status | Decision |
|--------|--------|----------|
| `experiment/browse-ink-revert` | **Rejected** | Too blue/navy again — do not merge |
| `experiment/browse-bottom-gradient` | **Testing** | Remove top gradient only; keep black `CARD_STAGE` + bottom readability gradient |

---

## Browse card background — decision (2026-05-23)

### Problem
- **Navy card fill (`#16193a`)** on full-bleed mobile → whole viewport felt “blue”
- **Black card fill** + **top gradient overlay** → less blue, but dark wash bleeds down over light product photos (e.g. gray/linen listing backgrounds)

### What causes the “bleed”
Not the page shell — that’s linen (`#ede9e1`). It’s two layers on the card:

1. **`CARD_STAGE`** — solid fill behind the photo (`#000` today; was ink)
2. **`EDITORIAL_GRADIENT`** — full-screen overlay on every slide:
   - ~~Top band: dark gradient downward (for header/watermark contrast)~~ **removed on experiment branch**
   - Bottom band: dark gradient upward (for title/price readability) **kept**

Light product images + top gradient = visible dark wash from the top (floral plate, necklace, percolator).

### Rejected: ink revert (`experiment/browse-ink-revert`)
Restoring ink stage + ink gradients brought back the blue viewport feel. **Do not merge.**

### Current decision (experiment branch)
**Keep black `CARD_STAGE`. Remove top gradient only. Keep bottom gradient for title/price readability.**

Visual test passed on: Floral Plate and Server Set, Ornate and Delicate Matinee-Length Necklace, Vintage Guardian Service 8 Cup Hammered Aluminum Percolator.

**Not merging yet** — keep testing on `experiment/browse-bottom-gradient`.

### Mobile flash
Brief **black flash** before image loads = empty card stage showing through until `object-cover` image paints. Less bad than blue shell; could use linen or ink placeholder later.

### Optional follow-ups (separate pass — do not block merge)

- [ ] **D — Loading state** — ink or linen placeholder while image loads (no black flash)
- [ ] **Product titles** — optional soften to 15px if 16px Playfair 400 still feels heavy

**Do not revisit:** ink card stage restore, top gradient restore, or further Browse gradient tweaks until testing is done.

---

## Polish backlog

- [ ] **Product titles** — optional soften to 15px / lighter weight if 16px Playfair 400 still feels heavy
- [ ] **Browse gradient** — bottom-only experiment on branch; merge after testing (see above)
- [ ] **Account sheet / auth** — user testing; copy tweaks welcome
- [ ] **Desktop browse** — confirm linen surround + portrait frame feel right at all breakpoints

---

## Morning testing punch list (template)

### Browse / discovery
- [ ] Linen shell visible on desktop (not blue page)
- [ ] Mobile: acceptable flash on swipe; photos readable
- [ ] Title = Playfair; price/metadata = Inter
- [ ] Gradients don’t ruin light-background listings (note worst offenders)

### Auth
- [ ] Account sheet → login / signup feel welcoming (linen, not cold modal)
- [ ] Seller signup path → onboarding chrome matches

### Backend flows
- [ ] *(add checkout, orders, shipping snapshot, seller settings, etc.)*

---

## Files reference

| Area | Primary files |
|------|----------------|
| Browse feed | `web/app/browse/SwipeFeed.tsx` |
| Shell colors | `web/hooks/useAppShell.ts`, `web/app/globals.css` |
| Auth welcome | `web/components/WelcomeBrandHeader.tsx`, `AuthWelcomeLayout.tsx`, `AccountSheet.tsx` |
| Splash | `web/app/components/splash-screen.tsx` |

---

*Last updated: 2026-05-23*
