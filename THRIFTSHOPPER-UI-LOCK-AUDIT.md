# ThriftShopper UI Lock Audit

**Date:** 2026-05-28  
**Scope:** Visual drift vs locked TS 2.0 design system  
**Method:** Code review only — no redesign, no changes applied  
**Baseline:** `363e535` (last-night browse linen shell + portrait frame) vs `HEAD` (`01a8a2b`)

---

## Executive summary

Browse drift is **not a mystery CSS bug** — it is the result of **two intentional commits after last night**, plus one **regression fix that introduced a non-brand color (black)**.

| Layer | Last night (`363e535`) | Current (`01a8a2b`) | Locked intent |
|--------|------------------------|---------------------|---------------|
| Page shell | Linen via `var(--background)` + `useAppShell("linen")` | Linen hardcoded `#ede9e1` + theme-color linen | **Linen** ✓ (current is correct) |
| Card stage | `var(--ink-primary)` (#16193a) | `#000000` (`CARD_STAGE`) | **Ink/navy** ✗ drift |
| Gradient overlay | Ink-tinted (`INK_RGB`) | Black-tinted (`rgba(0,0,0,…)`) | **Ink-tinted** ✗ drift |
| Product title | `font-editorial` inline | `.discovery-title` Playfair 400 | **Playfair** ✓ (improvement) |
| Price | `font-bold` inline | `.font-system` | **Inter** ✓ (improvement) |

**Blue viewport root cause:** Mobile card stage was **full-viewport ink** — the shell was linen but **invisible** under the card. `layout.tsx` / `manifest.json` **theme-color was navy** (`#16193a`), painting browser chrome blue before hydration.

**Black bleed root cause:** Commit `01a8a2b` replaced ink card stage + ink gradients with **black** — non-brand, causes top gradient wash on light product photos and pre-load flash.

---

## 1. Locked system compliance

### Typography

| Rule | Status | Notes |
|------|--------|-------|
| Playfair = discovery/editorial | **Mostly compliant** | `.discovery-title`, `.font-editorial`, `.font-serif` in `globals.css` |
| Product titles = Playfair | **Browse ✓, gaps elsewhere** | See §3 |
| Inter = utility UI | **Mostly compliant** | Browse price uses `.font-system`; many pages still default sans via body |
| No Merriweather in app UI | **Compliant** | Removed from `layout.tsx`; still in **email templates only** |

### Color

| Token | Canonical value | Status |
|-------|-----------------|--------|
| Linen (environment) | `#ede9e1` / `--background` | **Compliant** after `01a8a2b` hardening |
| Ink (brand dark) | `#16193a` / `--ink-primary` | **Drift:** browse card stage bypasses token |
| Gold (accent) | `#c5a028` / `--gold-accent` | **Drift:** 5+ legacy hex values in use |
| Green (trust/action) | *(not defined as CSS token)* | **Drift:** ad-hoc `emerald-*`, `green-*` Tailwind only |
| Black | Temporary fallback only | **Violation:** `CARD_STAGE = "#000000"` in SwipeFeed |

---

## 2. Browse regression timeline

```
363e535  Fix browse desktop portrait frame + linen shell     ← last-night baseline
56cb42c  Typography + auth welcome UI                       ← browse titles → .discovery-title (OK)
01a8a2b  Fix blue background bleed                           ← CARD_STAGE → black, gradients → black (DRIFT)
```

### What changed in Browse (`SwipeFeed.tsx`)

| Constant / element | `363e535` | `01a8a2b` (now) |
|--------------------|-----------|-----------------|
| Outer shell | `LINEN` = `var(--background)` | `SHELL_LINEN` = `#ede9e1` hardcoded |
| Middle flex wrapper | no explicit bg | `SHELL_LINEN` explicit |
| Card stage | `backgroundColor: INK` | `backgroundColor: CARD_STAGE` (#000) |
| Empty image placeholder | `INK` | `CARD_STAGE` (#000) |
| `EDITORIAL_GRADIENT` | `rgba(INK_RGB, …)` top + bottom | `rgba(0,0,0,…)` top + bottom |
| Product title | `.font-editorial`, 15px, weight 500 | `.discovery-title`, 16px, weight 400 |
| Price | `.font-bold` | `.font-system .font-semibold` |

---

## 3. Why the blue viewport returned

**Four stacked causes** (any one can make the page feel “blue”):

### A. Card stage filled the viewport (primary — mobile)

**File:** `web/app/browse/SwipeFeed.tsx`  
**Mechanism:** Inner card div is `w-full h-full` below `md` breakpoint with `backgroundColor: INK` (last night) or `CARD_STAGE` (now). It sits on top of the linen outer shell and **covers 100% of the viewport**.  
**User sees:** Navy (last night) or black (now) — not linen.  
**Shell color is irrelevant on mobile** until card stage is fixed or inset.

### B. theme-color meta was navy (primary — mobile chrome)

**Files:** `web/app/layout.tsx`, `web/public/manifest.json`  
**At `363e535`:** `themeColor: "#16193a"`  
**At `01a8a2b`:** `themeColor: "#ede9e1"` ✓ fixed  
**Mechanism:** iOS Safari / PWA safe-area and browser chrome paint from meta before `useAppShell` runs.

### C. Gradient overlay used ink RGB (secondary — all viewports)

**File:** `web/app/browse/SwipeFeed.tsx` → `EDITORIAL_GRADIENT`  
**At `363e535`:** Top band `rgba(22, 25, 58, 0.48)` bleeding down over light product photos → **blue-tinted wash** on gray/linen listing backgrounds.  
**Not the page shell** — overlay on the image stack.

### D. CSS variable resolution fragility (fixed in `01a8a2b`)

**File:** `web/app/globals.css`  
**Issue found during typography work:** `var(--background)` and `var(--font-editorial)` could fail to resolve in Tailwind v4 build, causing fallthrough to system sans / transparent backgrounds.  
**Fix applied:** Hardcoded `#ede9e1` fallbacks on `html`/`body` and `SHELL_LINEN` in SwipeFeed.

### Desktop linen surround

**Working as designed** at `363e535` and now — portrait card centered, linen visible in `md+` flex gutter. User “blue-ish desktop” perception is likely **dominant navy/black card + ink gradients**, not broken shell.

---

## 4. Black bleed (current regression)

**Responsible code:** `web/app/browse/SwipeFeed.tsx` lines 40–47, 856, 1097, 1109

```tsx
const CARD_STAGE = "#000000";  // ← not in design system
const EDITORIAL_GRADIENT = `
  linear-gradient(to bottom, rgba(0, 0, 0, 0.42) 0%, …)  // ← top band
  …
`;
```

**Effects:**
- Top gradient darkens light product photo backgrounds (brooch screenshot)
- `CARD_STAGE` visible during image load → **black flash** on swipe
- Violates lock: *“Black = temporary technical fallback only”*

---

## 5. Files overriding or bypassing tokens

### Critical (browse / discovery)

| File | Issue |
|------|-------|
| `web/app/browse/SwipeFeed.tsx` | `CARD_STAGE = "#000000"` bypasses `--ink-primary`; black gradients |
| `web/components/ProductCard.tsx` | `.discovery-title` ✓ but price uses `font-bold` not `.font-system`; gold `#cfb53b` / `#efbf04`; TSLogo `#000080` |
| `web/app/listing/[id]/ProductDetails.tsx` | `.discovery-title` ✓; price `.font-system` ✓ |
| `web/components/Favorites.tsx` | `.discovery-title` ✓; legacy gold hex throughout |

### Global / theme

| File | Issue |
|------|-------|
| `web/app/globals.css` | Duplicate typography: `.discovery-title` + `.font-discovery-title`; `.ui-heading` + `.font-ui-heading`; `--font-brand` identical to `--font-editorial` |
| `web/hooks/useAppShell.ts` | Canonical `SHELL_LINEN` / `SHELL_INK` — **good**; not used everywhere (SwipeFeed mixes hardcoded + const) |
| `web/app/layout.tsx` | themeColor now linen ✓; fonts on `<html>` ✓ |

### Legacy color drift (not browse, but system noise)

| Hex | Should be | Example files |
|-----|-----------|---------------|
| `#000080` | `#16193a` / `var(--ink-primary)` | `ProductCard.tsx`, `SellerView.tsx`, `AddListing.tsx`, `MoodFilterModal.tsx` |
| `#efbf04`, `#EFBF05`, `#cfb53b`, `#DFAF37` | `var(--gold-accent)` `#c5a028` | `Favorites.tsx`, `canvas/page.tsx`, `settings/page.tsx`, `SupportModal.tsx`, many more |
| `bg-black` pages | Ink or linen shell | `favorites/page.tsx`, `listing/[id]/page.tsx`, `checkout/*`, `Navigation.tsx` |

### Typography drift (product titles)

| File | Title styling | Compliant? |
|------|---------------|------------|
| `SwipeFeed.tsx` | `.discovery-title` | ✓ |
| `ProductCard.tsx` | `.discovery-title` | ✓ |
| `ProductDetails.tsx` | `.discovery-title` | ✓ |
| `Favorites.tsx` | `.discovery-title` | ✓ |
| `favorites/page.tsx` | `font-medium` (Inter) on `<h3>` | ✗ |
| `favorites/page.tsx` orders | `font-medium` on `<h3>` | ✗ |

### Dead / duplicate components

| File | Issue |
|------|-------|
| `web/app/components/SplashScreen.tsx` | Old splash — **black** full-screen; not wired to `/` but still in repo |
| `web/app/components/splash-screen.tsx` | Active splash — photo + gradient; uses Playfair ✓ |

---

## 6. Duplicate definitions

### Colors (same role, multiple sources)

- **Linen:** `#ede9e1` in `:root --background`, `SHELL_LINEN`, hardcoded in `globals.css` html/body, `browse/page.tsx` error states
- **Ink:** `#16193a` in `:root --ink-primary`, `SHELL_INK`, ~50+ inline `#16193a` usages
- **Gold:** `--gold-accent: #c5a028` vs `#efbf04` / `#EFBF05` / `#cfb53b` / `#DFAF37` across 20+ files
- **Legacy blue:** `#000080` — pre-TS-2.0, not in lock doc but still present

### Typography (same stack, multiple classes)

- `--font-brand` ≡ `--font-editorial` ≡ `--font-serif` (all Playfair)
- `.discovery-title` ≡ `.font-discovery-title` (duplicate rules in `globals.css`)
- `.ui-heading` ≡ `.font-ui-heading` (duplicate rules)

---

## 7. Minimum fix to restore intended behavior

**Goal:** Last-night browse elegance (ink card, ink gradients) + keep shell fixes from `01a8a2b` (no blue viewport chrome).

### Required (smallest diff — 1 file)

**File:** `web/app/browse/SwipeFeed.tsx`

1. **Remove** `CARD_STAGE = "#000000"`.
2. **Restore** card stage + empty placeholder to `INK` (`var(--ink-primary)`).
3. **Restore** `EDITORIAL_GRADIENT` to `INK_RGB` values from `363e535`:

```tsx
const EDITORIAL_GRADIENT = `
  linear-gradient(to top, rgba(${INK_RGB}, 0.78) 0%, rgba(${INK_RGB}, 0.42) 38%, rgba(${LINEN_RGB}, 0.10) 58%, transparent 72%),
  linear-gradient(to bottom, rgba(${INK_RGB}, 0.48) 0%, rgba(${LINEN_RGB}, 0.08) 22%, transparent 32%)
`;
```

4. **Keep unchanged:** `SHELL_LINEN` on outer + middle wrappers, `.discovery-title`, `.font-system` on price.

### Already correct — do not revert

- `web/app/globals.css` — linen fallbacks on html/body
- `web/app/layout.tsx` — `themeColor: "#ede9e1"`
- `web/public/manifest.json` — `theme_color: "#ede9e1"`
- `useAppShell("linen")` on browse

### Optional follow-up (separate pass — not required for lock restore)

- Remove top gradient band only (reduce wash on light photos) — **does not change fonts/spacing/hierarchy**
- Load placeholder: `INK` or linen while image fetches — kills flash without black
- Consolidate gold hex → `var(--gold-accent)` repo-wide
- `favorites/page.tsx` titles → `.discovery-title`

---

## 8. Verdict

| Question | Answer |
|----------|--------|
| Is the design system broken globally? | **No** — tokens exist; browse had a targeted regression |
| What caused blue viewport? | **Ink card full-bleed on mobile** + **navy theme-color** (fixed) + **ink gradient overlay** on photos |
| What caused black bleed? | **`01a8a2b` CARD_STAGE + black gradients** — off-system fix |
| Smallest restore? | **Revert SwipeFeed card stage + gradients to ink; keep linen shell hardening** |
| Redesign needed? | **No** |

---

*Audit performed against locked decisions provided 2026-05-28. See also `UI-TRACKING.md` for ongoing punch list.*
