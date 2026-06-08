# TS Shell Color & Safe-Area — Full History

**Purpose:** Record everything tried on shell color, safe-area padding, and iOS browser chrome — so we stop reopening the same loop.  
**Status:** Web beta policy locked — **document shell always linen**; navy only in components. Native shell (Xcode/WKWebView) owns OS chrome for App Store.  
**Last updated:** 2026-05-23  
**Related:** [`TS-MOBILE-SHELL-AUDIT.md`](./TS-MOBILE-SHELL-AUDIT.md), [`TS-SHELL-COLOR-MAP.md`](./TS-SHELL-COLOR-MAP.md), [`UI-TRACKING.md`](./UI-TRACKING.md)

---

## Executive summary

The “hangnail” is almost always **layer 2** (OS/browser chrome), not page CSS.

| Layer | What it is | Who controls it |
|-------|------------|-----------------|
| **Page content** | Backgrounds inside the React tree | Us — CSS, components |
| **OS/browser chrome** | Status bar, notch strip, home-indicator area, PWA `theme-color` | Safari / iOS — only partially overridable from the web |

**Symptom:** Leave Canvas/Seller (navy in-page chrome) → return to Browse (linen content) → **outer safe-area / browser shell still ink** until product detail or hard refresh “resets” it.

**Why product detail fixes it:** Full route mount + document repaint — same class of fix as a hard reload, not a magic CSS property.

**Do not revert** to pre-stabilization shell commits — that brings back freeze, SW reload loops, or ink `theme-color` on dashboard routes (worse bleed).

**Real fix for App Store:** Native `WKWebView` background set to linen on the container; web `theme-color` alone cannot guarantee this across client-side navigations.

---

## The two-layer model

```
┌─────────────────────────────────────┐  ← iOS status bar / notch / home indicator (theme-color, native view)
│  OS / browser chrome                │
├─────────────────────────────────────┤
│  html / body (applyLinenShell)      │  ← We control via useAppShell + AppShellBaseline
├─────────────────────────────────────┤
│  Page wrappers (SwipeFeed, Canvas…) │  ← Per-route component backgrounds
└─────────────────────────────────────┘
```

We spent ~100 hours mostly fighting **chrome persistence across Next.js client navigations**, while also tuning **content-layer** colors (black card stage, gradients, gray settings body) that *look* like shell bugs but are separate.

---

## Everything we tried (chronological)

### Phase 1 — Early PWA / status bar experiments (pre–TS 2.0, ~Feb 2026 onward)

| Attempt | Commits / area | Intent |
|---------|----------------|--------|
| Dark PWA `theme_color` | `#001540`, later black | Match brand navy in installed app |
| Red `theme-color` test | Debug commits | See if meta tags were read at all |
| Forced status bar meta tags | `layout.tsx` experiments | Override iOS status bar |
| `viewportFit: cover` + safe-area padding | Wrappers, globals | Paint notch / home indicator |
| Force safe-area strip color | `b6f4cfb`, `081df90` | Explicit strip above content |
| Navy safe-area on loop/browse | `a834b6d` | Extend navy into notch |

**Result:** Manifest + `theme-color` affect **cold start** and installed PWA launch — not reliably every in-tab client navigation.

---

### Phase 2 — TS 2.0 design system (Mar–Apr 2026)

| Attempt | Commits / files | Intent |
|---------|-----------------|--------|
| Linen palette in CSS | `globals.css` `#ede9e1` | Single environment token |
| `useAppShell("linen" \| "ink")` | `web/hooks/useAppShell.ts` | Set html, body, theme-color on mount |
| Per-route wrapper colors | Canvas, Seller, Settings, legal | Navy/gray page backgrounds |
| Browse portrait frame | `363e535` | Linen surround on desktop |
| Unify shell across routes | `da44179`, `165c921` | TS 2.0 tokens everywhere |

**Result:** Individual pages looked correct. **Navigation broke consistency** — hook ran on only some routes, no unmount cleanup, `useEffect` after first paint (visible flash).

---

### Phase 3 — “Blue viewport” fixes (May 2026)

| Attempt | Commit | Intent |
|---------|--------|--------|
| Hard linen + black card stage | `01a8a2b` | Stop full-viewport navy reading as “blue shell” |
| Linen after checkout | `588fe72` | Reset shell post-purchase |
| Bottom-only gradient on browse | UI-TRACKING (locked) | Light photos true; title/price readable |
| Card stage softened toward linen | `588fe72`, later tweaks | Reduce black wash |

**Result:** Content layer improved. Chrome flicker on route change persisted. Black card stage traded blue bleed for black flash on light photos (documented in `THRIFTSHOPPER-UI-LOCK-AUDIT.md`).

---

### Phase 4 — Audit + baseline architecture (May 23 — `39c1b46` + docs)

**Diagnosis** (`TS-MOBILE-SHELL-AUDIT.md`): Four independent systems fighting:

1. SSR defaults (`layout.tsx`, `globals.css`) → linen  
2. Client hook (`useAppShell`) → partial coverage, no cleanup  
3. Per-page inline wrappers → ad hoc hex  
4. Duplicate writers (e.g. `SellerPageClient` body `useEffect`)

**Shipped:**

| Change | Files | Intent |
|--------|-------|--------|
| `AppShellBaseline` | `layout.tsx` | Linen on every pathname change |
| `useLayoutEffect` | `useAppShell.ts` | Paint before first frame |
| Early inline script | `layout.tsx` | Linen before React hydrates |
| `min-height: 100dvh` | `globals.css` | Reduce overscroll bleed |
| Auth full-bleed linen | `AuthWelcomeLayout.tsx` | Cover stale navy under login |

**Result:** Better. Dashboard → browse return path still reproduced on Safari/iPad.

---

### Phase 5 — “Global linen only” policy (`d6a8573`)

| Decision | Detail |
|----------|--------|
| Remove `useAppShell("ink")` | **Document shell always linen** |
| Navy only in components | Canvas/Seller header + fixed footer bars |
| No ink on `theme-color` | Policy shift (correct long-term) |

**Result:** Right architecture. Safari still held **stale ink `theme-color`** from earlier ink-shell era.

---

### Phase 6 — Aggressive sync (`f75f624` → `975495e`) — **mechanics broke here**

| Attempt | Detail |
|---------|--------|
| `scheduleLinenShellSync()` | hardReset + rAF + 50ms + 200ms timers every route |
| `hardResetLinenShell()` | Remove/recreate theme-color meta tags |
| `browse/template.tsx` | Force full SwipeFeed remount on every `/browse` entry |
| `listing/[id]/template.tsx` | Same for product routes |
| SW network-first v3→v5 | Stop stale HTML after deploy |
| PWA auto-reload on SW activate | Force fresh bundles |
| `SafeAreaShell` | Fixed linen strips in notch/home indicator (`z-index: 9998`) |
| `DashboardChrome` | Linen strips above/below navy dashboard bars |
| `visibilitychange` / `pageshow` resync | Re-apply on tab focus (later removed) |

**Result:**

- **Mobile freeze** — SW reload loop + template remounts  
- **Account sheet flash-close** — touch propagation side effect  
- **Shell bleed still reproduced** on user’s Safari/iPad test  

---

### Phase 7 — Stabilization (current baseline — `7f5f5db` → `e2b1fb8`)

| Change | Commit | Detail |
|--------|--------|--------|
| Kill SW reload loop | `7f5f5db` | Unregister SW; self-destruct `sw.js` |
| Remove route templates | `7f5f5db` | No forced SwipeFeed remount |
| Simplify shell sync | `7f5f5db` | Single `applyLinenShell()` per route — no timers |
| Account sheet fix | `2e6d68e` | Sync dismiss guard + touch propagation |
| Browse touch fixes | `e2b1fb8` | Mic, voice error, search Clear |

**Still in codebase (inactive aggressive sync removed):**

- `SafeAreaShell.tsx` — linen notch strips  
- `DashboardChrome.tsx` — linen strips + navy bars  
- `AppShellBaseline.tsx` + `useAppShell.ts` — linen only  

**Shell bleed after dashboard → browse:** May still exist; **deliberately paused** shell work to restore QA.

---

## User-confirmed repro (still relevant)

1. Fresh `/browse` → linen ✓  
2. My Canvas or Seller Dash → outer safe-area / browser shell turns **ink**  
3. Return to Browse → **content** linen, **outer shell** still ink  
4. Product detail → **everything** resets to linen  
5. Back to Browse → stays linen  

Not a cache issue — visible on Safari, iPad, desktop; route-state bleed from ink routes.

---

## What was documented but never fully built

From `TS-SHELL-COLOR-MAP.md` (post–App Store target):

- [ ] Single `AppShellProvider` with route registry (all ~28 routes)  
- [ ] `neutral` shell variant (`#f9fafb`) for Settings, legal, checkout  
- [ ] Remove all duplicate `document.body` writers (partially done)  
- [ ] Register Settings, legal, checkout in shell system  
- [ ] Native shell owns safe-area for App Store build  

---

## Why this took ~100 hours (honest causes)

1. **Wrong initial model:** Ink `theme-color` on dashboard routes in a Next.js SPA. Safari **remembers** chrome across client navigations. You cannot reliably alternate ink OS chrome and linen OS chrome in one tab without full reload or native wrapper.

2. **Fixes stacked on fixes:** Each pass added sync mechanisms instead of removing dual-shell model. Timers + templates + SW reload broke mechanics.

3. **Content vs chrome confusion:** Black card stage, navy headers, gray scroll areas read as “shell” but are in-page layers.

4. **Multiple tools / assistants:** Same symptom → another DOM/meta reset. None changes Safari’s chrome cache reliably.

5. **Product detail “works”** because it behaves like a fresh mount — confirms diagnosis, not “one CSS property away.”

---

## Revert guidance

| Revert target | Brings back | Recommendation |
|---------------|-------------|----------------|
| Pre-`d6a8573` | Ink `theme-color` on dashboard | **No** |
| `975495e` era | Freeze, SW reload, templates | **No** |
| `7d7a55b` (last pre-shell-arc seller commit) | Loses freeze + account + touch fixes | **No** |
| Current `e2b1fb8` | Stable mechanics; shell may still bleed at OS edge | **Yes — QA from here** |

Seller action work (`a806e30` → `7d7a55b`) is **unrelated** to shell. Browse mechanics fixes are **unrelated** to shell.

---

## Paths that actually close the hangnail

### A. Ship web beta with current policy (now)

- Document shell **always linen** at OS level (`theme-color`, html, body).  
- Navy **only inside components** (Canvas/Seller bars).  
- Accept possible brief ink chrome after dashboard until native shell.  
- Verify `SafeAreaShell` on real device during QA.

### B. Native WKWebView (Expo / Xcode) — **likely real fix**

```swift
// Conceptual — set on WKWebView container
webView.isOpaque = true
webView.backgroundColor = UIColor(/* #ede9e1 */)
```

iOS paints safe areas from the **native view**, not from meta tags. Standard reason to wrap PWAs for App Store.

### C. Hard navigation (not recommended)

`window.location.href` on dashboard ↔ browse transitions. Works; kills SPA smoothness.

### D. Post–App Store web pass (optional)

Implement `AppShellProvider` + route map from `TS-SHELL-COLOR-MAP.md` — **never set ink on `theme-color` again**.

---

## Current code reference (post-`e2b1fb8`)

| Concern | File |
|---------|------|
| Shell hook | `web/hooks/useAppShell.ts` — `applyLinenShell()` only |
| Global baseline | `web/components/AppShellBaseline.tsx` |
| Safe-area strips | `web/components/SafeAreaShell.tsx` |
| Dashboard chrome | `web/components/DashboardChrome.tsx` |
| Early paint | `web/app/layout.tsx` inline script |
| SSR theme | `layout.tsx` `viewport.themeColor`, `manifest.json` |
| CSS defaults | `web/app/globals.css` |
| Browse content | `web/app/browse/SwipeFeed.tsx` — linen shell, card stage, gradients |
| Dashboard cleanup | `useDashboardRouteCleanup()` on canvas, seller, settings |

---

## Beta policy (locked until native shell)

1. **No more shell/safe-area experiments** during beta QA.  
2. **No ink on `theme-color`** — ever.  
3. **No route templates** for shell reset.  
4. **No SW auto-reload** or aggressive meta-tag timers.  
5. **Native shell** owns OS chrome for App Store submission.  

---

## Commit timeline (shell-related)

```
e2b1fb8  Browse touch: mic, voice error, search clear (not shell)
2e6d68e  Account sheet mobile tap fix (not shell)
7f5f5db  Fix freeze — kill SW loop, remove templates, simplify sync
975495e  Hard-reset linen on browse entry ( CAUSED FREEZE )
8e8d526  SafeAreaShell + DashboardChrome
f75f624  Aggressive shell sync + SW network-first
d6a8573  Global linen only; navy in components only  ← policy shift
7d7a55b  Seller action (last commit before shell arc intensified)
39c1b46  AppShellBaseline + layoutEffect + early script
01a8a2b  Browse blue bleed fix (black card stage)
588fe72  Linen after checkout
363e535  Desktop portrait frame
da44179  Unify TS 2.0 app shell
165c921  Ink/linen/gold tokens
f4f9b8a  Stage 1 design system — linen palette
… earlier PWA theme-color experiments (black, red test, safe-area forces)
```

---

*The manicure isn’t ruined — there’s a sliver of platform chrome CSS can’t fully own in a PWA. Finish QA on seller flows; let native shell own the safe-area for App Store.*
