# TS Mobile Shell Audit

**Date:** 2026-05-23  
**Scope:** Why the mobile top/browser/nav shell flickers between **linen**, **navy**, **dark gray**, **light gray**, and **black** during navigation.  
**Out of scope:** Browse gradient, typography, feature work. **No code changes in this pass.**

---

## Executive summary

The shell color is controlled by **at least four independent systems** that do not agree:

1. **SSR defaults** — `layout.tsx` viewport + `globals.css` html/body → **linen**
2. **Client hook** — `useAppShell("linen" | "ink")` → overwrites html, body, and `<meta name="theme-color">` on mount only
3. **Per-page inline wrappers** — each route picks its own page background (`#16193a`, `bg-gray-50`, `#f8f9fa`, `#000000`, etc.)
4. **Legacy one-off effects** — `SellerPageClient` has a **second** body background effect with cleanup that fights the hook

Many routes **never call `useAppShell`**, so after navigation the **browser chrome (`theme-color`) and `<html>` background can stay stuck on the previous route** while the visible page paints a different color. That is the most likely cause of “linen → navy → gray → back” on iPhone Safari.

---

## 1. Where shell color is set

### A. Global defaults (always present)

| Source | Value | What it affects |
|--------|-------|-----------------|
| `web/app/globals.css` `:root --background` | `#ede9e1` (linen) | CSS token |
| `web/app/globals.css` `html`, `body` | `#ede9e1` + `var(--background)` fallback | Document background, iOS overscroll bleed |
| `web/app/layout.tsx` `viewport.themeColor` | `#ede9e1` | Next.js injects `<meta name="theme-color">` on SSR |
| `web/public/manifest.json` `theme_color` / `background_color` | `#ede9e1` | PWA splash / homescreen launch only |
| `web/app/layout.tsx` `appleWebApp.statusBarStyle` | `"default"` | iOS standalone status bar (dark text on light bar) |

### B. Client hook (partial coverage)

**File:** `web/hooks/useAppShell.ts`

```ts
// On mount only — NO cleanup on unmount
document.documentElement.style.backgroundColor = color;  // html
document.body.style.backgroundColor = color;           // body
meta[name="theme-color"].content = color;
```

| Variant | Color | Hex |
|---------|-------|-----|
| `linen` | Linen shell | `#ede9e1` |
| `ink` | Navy shell | `#16193a` |

**Critical gaps:**
- Runs in `useEffect` → **after first paint** on client navigation (flash window)
- **No unmount cleanup** → leaving a page does not reset shell; next page must overwrite
- Only **6 call sites** in the app; most routes never touch shell state

### C. Per-page / component backgrounds (visible “page” color)

These are **separate** from html/body/theme-color and often disagree with them.

| Color you see | Typical hex / class | Where |
|---------------|---------------------|-------|
| **Linen** | `#ede9e1`, `var(--background)`, `SHELL_LINEN` | Browse outer wrapper, auth, seller onboarding/settings, splash |
| **Navy** | `#16193a`, `bg-[#16193a]` | Canvas header/footer, Seller dashboard header/footer, Settings sticky header, legal doc headers |
| **Dark gray** | Tailwind `bg-gray-50` → `#f9fafb` | Settings page body, Canvas/Seller scroll content area, loading spinners |
| **Light gray** | `#f8f9fa` | Legal pages (`/returns`, `/marketplace-guidelines`, `/prohibited-items`, `/what-we-accept`) |
| **Black** | `#000000` `CARD_STAGE` | Browse card stage (full-bleed mobile), `/favorites` entire page (`bg-black`) |

### D. Fixed viewport-edge chrome

| Component | Position | Color | Routes |
|-----------|----------|-------|--------|
| Canvas footer `<nav>` | `fixed bottom-0` | Navy `#16193a` | `/canvas` |
| Seller footer `<nav>` | `fixed bottom-0` | Navy `#16193a` | `/seller` |
| Settings header | `sticky top-0` | Navy `bg-[#16193a]` | `/settings` |
| Legal headers | top of page | Navy `#16193a` | `/returns`, `/prohibited-items`, etc. |
| Browse outer shell | `fixed inset-0` | Linen `SHELL_LINEN` | `/browse` |
| Browse card stage | `fixed inset-0` inner | Black `CARD_STAGE` | `/browse` (mobile full-bleed) |

Canvas and Seller also set `overscrollBehaviorY: "contain"` on the page wrapper — reduces but does not eliminate rubber-band reveal of html/body behind gray content.

---

## 2. Which pages override shell state

### Pages that call `useAppShell`

| Route | Hook | Page wrapper background | Notes |
|-------|------|-------------------------|-------|
| `/browse` | `linen` | Outer `SHELL_LINEN`; inner card `CARD_STAGE` black | Full-bleed black card covers viewport on mobile |
| `/canvas` (My Canvas) | **`ink`** | `min-h-screen bg-[#16193a]` + inner `bg-gray-50` | Navy shell + gray scroll island |
| `/seller` | **`ink`** | Same pattern as Canvas | **Plus duplicate body `useEffect`** (see §3) |
| `/seller/onboarding` | `linen` | `var(--background)` | Set up Store |
| `/seller/settings` | `linen` | `var(--background)` | Seller settings |
| `/listing/[id]` | `linen` | Product page content | Listing detail |

### Pages that do **not** call `useAppShell` (inherit stale chrome)

| Route | Visible background | Sticky/fixed chrome | Risk |
|-------|-------------------|---------------------|------|
| `/settings` (buyer) | `bg-gray-50` | Navy sticky header | **theme-color + html stay on previous route** |
| `/returns`, `/marketplace-guidelines`, `/prohibited-items`, `/what-we-accept` | `#f8f9fa` | Navy header | Same stale chrome |
| `/login`, `/signup`, `/auth/*` | `var(--background)` linen | Auth layout | SSR linen OK; no client sync after leaving ink pages |
| `/` splash | `var(--background)` linen | Full-screen overlay | No hook |
| `/favorites` | **`bg-black`** entire page | Black sticky header | **Worst mismatch** — black page, stale meta may be linen or ink |

### manifest / appleWebApp vs runtime

- **manifest** linen values only apply at **PWA install / cold start** — not during in-tab client navigation.
- **`statusBarStyle: "default"`** assumes a **light** shell; when `theme-color` is navy (`#16193a`), iOS may show **light status-bar text** on a **dark** chrome — feels “blue/navy” even when page content is gray.

---

## 3. Why it changes after navigation

### Root cause A — Stale `theme-color` and `<html>` (most likely)

1. User on **Browse** → `useAppShell("linen")` → meta + html + body = linen.
2. User opens **My Canvas** → `useAppShell("ink")` → all three = navy.
3. User opens **Settings** → **no `useAppShell`** → meta + html **stay navy** while page paints **`bg-gray-50`** (dark gray).
4. User opens **Prohibited Items** → still no hook → meta may still be navy; page body is **`#f8f9fa`** (light gray) + navy header.
5. User returns **Browse** → `useAppShell("linen")` → linen meta/html/body; inner card is **black** → brief or sustained black in content area.

**User perception:** linen → navy (canvas/seller) → gray (settings content) → light gray (legal) → black/linen (browse) → repeat.

### Root cause B — `SellerPageClient` double-writes `document.body`

`web/app/seller/SellerPageClient.tsx` (~332–338):

```ts
useEffect(() => {
  const previous = document.body.style.backgroundColor;
  document.body.style.backgroundColor = "#16193a";
  return () => {
    document.body.style.backgroundColor = previous;
  };
}, []);
```

This runs **in addition to** `useAppShell("ink")`.

On **unmount**:
- Hook: **no cleanup** → html + theme-color remain navy
- This effect: restores **body only** to whatever `previous` was at mount time

**Result:** `<html>` and `<meta theme-color>` can be **navy** while `<body>` is restored to **linen** (or empty string). Settings/legal pages then add a **third** visible layer (`gray-50` / `#f8f9fa`). Three different colors in one viewport stack.

### Root cause C — Client effect timing (flash on route change)

`useAppShell` runs in `useEffect` **after** React commits the new page. On fast client navigations:

1. New page DOM paints with its wrapper color (gray/navy/black)
2. Shell hook runs one frame later
3. Safari top chrome updates again → visible **flash**

### Root cause D — Browse black card stage (not shell hook, but looks like shell)

On mobile, Browse inner card is `fixed` full viewport with `CARD_STAGE = "#000000"`. Even when shell hook correctly sets linen on html/body:

- **Content area** reads as black/deep gray during swipe or before image load
- **Overscroll** above/below card may briefly show html/body (linen or stale navy)

This is separate from theme-color but contributes to “dark gray / black” in the same test session.

### Root cause E — Ink-shell pages with gray content islands

**Canvas** and **Seller** structure:

```
html/body/theme-color → navy (useAppShell ink)
└─ page wrapper       → navy bg-[#16193a]
   ├─ sticky header   → navy
   ├─ main content    → bg-gray-50  ← user scrolls this
   └─ fixed footer    → navy
```

When scrolling or rubber-banding, navy from html/body/wrapper bleeds into edges; content reads gray. Status bar stays navy from theme-color. Feels like two shells fighting.

---

## 4. Route-by-route snapshot (requested pages)

| Page | useAppShell | theme-color (after visit) | html/body | Visible top | Visible bottom | Fixed edge chrome |
|------|-------------|---------------------------|-----------|-------------|----------------|-------------------|
| **Browse** | linen | linen (if hook ran) | linen | Black card or linen gutter (desktop) | Black card + bottom gradient | None fixed; full-bleed card |
| **My Canvas** | ink | navy | navy | Navy header | Navy footer nav | Header + footer fixed |
| **Settings** | **none** | **stale** | **stale** | Navy sticky header | Gray content / white cards | Sticky top header |
| **Legal docs** | **none** | **stale** | **stale** | Navy header block | Light gray `#f8f9fa` | Top header only |
| **Seller setup** | linen | linen | linen | Linen + white form card | Linen | None fixed |

---

## 5. Recommended single-source-of-truth fix

**Do not patch individual pages.** Introduce one shell authority used on **every** route.

### Proposed architecture

1. **`AppShellProvider`** (client, mounted once in `layout.tsx`)
   - Owns `{ variant: 'linen' | 'ink' | 'neutral', themeColor, overscrollColor }`
   - Single function applies: `html`, `body`, `theme-color` meta
   - **Always runs cleanup** on variant change (no orphaned navy on html)

2. **Declarative per-route shell** — one of:
   - `export const shell = 'linen'` in `page.tsx` / layout segments, read by provider on navigation, **or**
   - `<Shell variant="linen" />` at top of each page (thin wrapper)

3. **Map page backgrounds to shell variants** (policy, not ad hoc hex):

   | Shell variant | theme-color / html / body | Used for |
   |---------------|---------------------------|----------|
   | `linen` | `#ede9e1` | Browse, auth, seller onboarding/settings, listing |
   | `ink` | `#16193a` | Canvas, Seller dashboard (including their fixed nav) |
   | `neutral` | `#f9fafb` or `#ede9e1` | Settings, legal — **pick one** and stick to it |

4. **Remove duplicate writers**
   - Delete `SellerPageClient` body-only `useEffect`
   - Stop relying on per-page `document.body` mutations
   - Align `layout.tsx` viewport + manifest + provider default to same linen token

5. **iOS PWA alignment**
   - Revisit `appleWebApp.statusBarStyle`: if ink routes exist, consider `black-translucent` + consistent dark theme-color **or** keep all routes on linen shell and use **navy only inside components** (not html/theme-color)

6. **Browse card black** — keep as **content stage**, not shell
   - Shell hook should stay **linen** on Browse (already does)
   - Accept black as photo letterbox only; optional later: loading placeholder (separate from shell audit)

### Minimum fix order (when implementing)

1. Add provider + route registration for all primary nav paths (`/browse`, `/canvas`, `/settings`, `/seller`, `/seller/onboarding`, legal routes)
2. Remove `SellerPageClient` duplicate body effect
3. Add `useAppShell` (or equivalent) to **Settings** and **legal pages**
4. Normalize Settings/legal page wrapper to match their declared shell (stop mixing stale navy meta with gray body)
5. Test on **iPhone Safari** and **installed PWA**: Browse → Canvas → Settings → Legal → Browse

---

## 6. Files reference

| Concern | Files |
|---------|-------|
| Shell hook | `web/hooks/useAppShell.ts` |
| SSR theme + Apple meta | `web/app/layout.tsx` |
| PWA manifest | `web/public/manifest.json` |
| CSS defaults | `web/app/globals.css` |
| Browse wrappers | `web/app/browse/SwipeFeed.tsx`, `web/app/browse/page.tsx` |
| My Canvas | `web/app/canvas/page.tsx` |
| Seller dashboard | `web/app/seller/SellerPageClient.tsx` |
| Seller setup | `web/app/seller/onboarding/page.tsx` |
| Buyer settings | `web/app/settings/page.tsx` |
| Legal | `web/app/returns/page.tsx`, `marketplace-guidelines/page.tsx`, `prohibited-items/page.tsx`, `what-we-accept/page.tsx` |
| Prior related audit | `THRIFTSHOPPER-UI-LOCK-AUDIT.md` |

---

*Audit only — no code changed. Browse gradient and typography untouched.*
