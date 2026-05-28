# UI & Design Tracking — TS 2.0 Beta

Living notes for design decisions, open polish items, and testing follow-ups.  
*(Not a spec — just a place to keep track while iterating.)*

**Formal audit:** See [`THRIFTSHOPPER-UI-LOCK-AUDIT.md`](./THRIFTSHOPPER-UI-LOCK-AUDIT.md) — drift analysis, blue/black bleed root causes.

---

## Browse — LOCKED unless broken

**Status:** Approved and shipped to beta (2026-05-23).

| Decision | Detail |
|----------|--------|
| Top gradient | **Removed** |
| Bottom gradient | **Retained** |
| Reason | Improves fidelity of light photos while preserving title/price readability |
| Card stage | Black `#000000` (unchanged) |
| Opacity | **Do not adjust** until after iPhone beta testing |

**Re-evaluate after:** real-device testing on iPhone (beta.thriftshopper.com).

**Do not change unless broken:** gradients, card stage, shell, typography on Browse.

### Rejected (do not revisit)
- `experiment/browse-ink-revert` — too blue/navy

---

## Next priorities

1. Settings / account stub audit
2. Help / support routes
3. Report listing flow
4. Legal page wiring
5. Native launch checklist

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
| *(pending)* | Browse: bottom-only gradient — top wash removed, bottom readability band kept |
| `01a8a2b` | Browse shell: linen hardening, theme-color → linen, card stage → black |
| `56cb42c` | Typography + welcoming auth (login, signup, account sheet, splash Playfair) |

---

## Browse card background — history

### Problem (resolved)
- Navy card fill → whole viewport felt blue on mobile
- Black card + **top** gradient → dark wash over light product photos

### What we kept
- Linen shell (`#ede9e1`), theme-color → linen
- Black `CARD_STAGE` behind photos
- Bottom `EDITORIAL_GRADIENT` only (title/price readability)

### Deferred (separate pass — not blocking)
- [ ] Loading placeholder while image loads (reduce black flash on swipe)
- [ ] Product title soften to 15px (only if still feels heavy after device testing)

---

## Polish backlog

- [ ] **Account sheet / auth** — user testing; copy tweaks welcome
- [ ] **Desktop browse** — confirm linen surround + portrait frame at all breakpoints

---

## Morning testing punch list (template)

### Browse / discovery
- [ ] Linen shell visible on desktop (not blue page)
- [ ] Mobile iPhone: light photos true; titles/prices readable
- [ ] Title = Playfair; price/metadata = Inter
- [ ] Swipe flash acceptable

### Auth
- [ ] Account sheet → login / signup feel welcoming (linen, not cold modal)
- [ ] Seller signup path → onboarding chrome matches

### Backend flows
- [ ] *(checkout, orders, shipping snapshot, seller settings, etc.)*

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
