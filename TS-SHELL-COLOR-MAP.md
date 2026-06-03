# TS Shell Color Map

**Purpose:** Final per-route shell assignment for `AppShellProvider` implementation **after App Store submission**.  
**Status:** Spec only — **no code changes.**  
**Related:** [`TS-MOBILE-SHELL-AUDIT.md`](./TS-MOBILE-SHELL-AUDIT.md)

---

## Shell variants (single source of truth)

Each route gets exactly one variant. The provider sets **`html`**, **`body`**, and **`<meta name="theme-color">`** to the variant token — nothing else writes shell color.

| Variant | Token | Hex | Role |
|---------|-------|-----|------|
| **linen** | `SHELL_LINEN` | `#ede9e1` | Discovery, editorial, warm entry. Default app environment. |
| **ink** | `SHELL_INK` | `#16193a` | Dashboard home bases with navy chrome (header + fixed footer nav). |
| **neutral** | `SHELL_NEUTRAL` | `#f9fafb` | Utility, settings, legal, forms, checkout. Light gray shell; navy only inside components. |

### What is NOT shell

These are **content-layer** colors — do not drive `theme-color`:

| Layer | Color | Where |
|-------|-------|-------|
| Browse card stage | `#000000` | `SwipeFeed` photo letterbox (locked) |
| White cards / forms | `#ffffff` | In-page surfaces on any variant |
| In-page navy headers | `#16193a` | Sticky headers on neutral routes (component chrome, not shell) |

### Default fallback

**Unlisted routes → `linen`.**  
SSR `layout.tsx` viewport, `manifest.json`, and `globals.css` should all default to `#ede9e1`.

---

## Assignment rules (policy)

1. **Browse + listing detail + auth + splash** → `linen` (discovery/editorial)
2. **My Canvas + Seller dashboard** → `ink` (fixed navy header/footer nav)
3. **Settings, legal, orders, checkout, sell/upload** → `neutral` (utility/transactional)
4. **Redirect-only routes** → inherit target variant (see § Redirects)
5. **No route uses ad-hoc `document.body` / duplicate shell effects**

---

## Full route map

### Linen — discovery & editorial

| Route | Page file | Current shell | Notes |
|-------|-----------|---------------|-------|
| `/` | `app/page.tsx` | CSS default | Splash → auto-nav to `/browse` |
| `/browse` | `app/browse/page.tsx` + `SwipeFeed.tsx` | `useAppShell("linen")` ✓ | Shell = linen; card stage = black (content) |
| `/listing/[id]` | `app/listing/[id]/page.tsx` + `ProductDetails.tsx` | `useAppShell("linen")` ✓ | Product detail; linen shell |
| `/login` | `app/login/page.tsx` | CSS `var(--background)` | Auth welcome layout |
| `/signup` | `app/signup/page.tsx` | CSS `var(--background)` | Auth welcome layout |
| `/forgot-password` | `app/forgot-password/page.tsx` | CSS `var(--background)` | Auth flow |
| `/reset-password` | `app/reset-password/page.tsx` | CSS `var(--background)` | Auth flow |
| `/auth/callback` | `app/auth/callback/page.tsx` | CSS `var(--background)` | OAuth/email confirm |
| `/seller/onboarding` | `app/seller/onboarding/page.tsx` | `useAppShell("linen")` ✓ | Set up Store |
| `/seller/settings` | `app/seller/settings/page.tsx` | `useAppShell("linen")` ✓ | Seller profile/settings form on linen |

---

### Ink — dashboard home bases

| Route | Page file | Current shell | Notes |
|-------|-----------|---------------|-------|
| `/canvas` | `app/canvas/page.tsx` | `useAppShell("ink")` ✓ | My Canvas; navy header + fixed footer nav |
| `/seller` | `app/seller/page.tsx` → `SellerPageClient.tsx` | `useAppShell("ink")` ✓ + **duplicate body effect** | Seller dashboard; remove duplicate on implement |

---

### Neutral — utility, legal, transactional

| Route | Page file | Current shell | Notes |
|-------|-----------|---------------|-------|
| `/settings` | `app/settings/page.tsx` | **none** (stale chrome) | Buyer settings; gray body + navy sticky header → shell **neutral**, header stays component |
| `/sell` | `app/sell/page.tsx` | **none** (`bg-gray-50`) | New listing upload form |
| `/orders/[orderId]` | `app/orders/[orderId]/page.tsx` | **none** (`bg-gray-50`) | Order detail |
| `/checkout/[listingId]` | `app/checkout/[listingId]/page.tsx` + `CheckoutClient.tsx` | **none** (white / black error) | Checkout flow → neutral throughout |
| `/checkout/success` | `app/checkout/success/page.tsx` | **none** (white) | Post-purchase confirmation |
| `/returns` | `app/returns/page.tsx` | **none** | Legal — returns policy |
| `/marketplace-guidelines` | `app/marketplace-guidelines/page.tsx` | **none** | Legal — seller guidelines |
| `/prohibited-items` | `app/prohibited-items/page.tsx` | **none** | Legal — allowed/prohibited |
| `/what-we-accept` | `app/what-we-accept/page.tsx` | **none** | Legal — acceptance policy |
| `/about` | `app/about/page.tsx` | **none** | About / contact |
| `/favorites` | `app/favorites/page.tsx` | **none** (`bg-black` legacy) | **Deprecate or remap:** content should live on `/canvas`; if route kept, shell → **neutral** (drop black page wrapper) |

---

### Redirect routes (transient — use target variant)

| Route | Target | Shell while visible | Assign |
|-------|--------|---------------------|--------|
| `/discover` | `/browse` | — | `linen` |
| `/auth/gate` | `/browse` | Ink spinner today | `linen` (fix on implement) |
| `/seller-dashboard` | `/seller` | Gray spinner | `ink` |
| `/seller/dashboard` | `/seller` | Spinner | `ink` |

---

### Dev / internal (exclude from production provider or force neutral)

| Route | Page file | Assign | Notes |
|-------|-----------|--------|-------|
| `/email-preview` | `app/email-preview/page.tsx` | `neutral` | Dev-only email template preview |

---

## Summary counts

| Variant | Routes (primary) |
|---------|------------------|
| **linen** | 10 |
| **ink** | 2 |
| **neutral** | 11 |
| **redirect** | 4 |
| **dev** | 1 |

**Total app routes:** 28 `page.tsx` files mapped.

---

## User-journey quick reference

Typical beta flows and expected shell:

```
Splash (/)           linen
  → Browse           linen
  → My Canvas        ink
  → Settings         neutral
  → Legal doc        neutral
  → Browse           linen

Browse               linen
  → Listing detail   linen
  → Checkout         neutral
  → Success          neutral

Browse               linen
  → Seller setup     linen
  → Seller dash      ink
  → Sell (upload)    neutral
  → Seller dash      ink
```

**Shell should only change when crossing these boundaries** — not flash navy/gray between Settings and Legal (both neutral).

---

## Current vs target (gaps to close on implement)

| Route | Current | Target | Gap |
|-------|---------|--------|-----|
| `/browse` | linen ✓ | linen | — |
| `/canvas` | ink ✓ | ink | Gray content island OK (in-page) |
| `/seller` | ink ✓ + duplicate body FX | ink | Remove duplicate `useEffect` |
| `/settings` | **stale** | neutral | Add provider entry |
| Legal routes (5) | **stale** | neutral | Add provider entry; optional: soften in-page navy header to match neutral shell |
| `/sell`, `/orders/*`, `/checkout/*` | **stale** / mixed | neutral | Add provider entry |
| `/favorites` | black page | neutral or remove | Align with Canvas |
| `/auth/gate` | ink flash | linen | Match redirect target |
| Auth routes | CSS only | linen | Register in provider |
| Unmount cleanup | **none** | required | Provider resets on every navigation |

---

## Implementation checklist (post–App Store)

Use this map as the provider registry:

```ts
// Example shape — not implemented yet
const SHELL_ROUTE_MAP: Record<string, AppShellVariant> = {
  "/": "linen",
  "/browse": "linen",
  "/canvas": "ink",
  "/seller": "ink",
  "/settings": "neutral",
  "/seller/onboarding": "linen",
  "/seller/settings": "linen",
  // … full map from tables above
};
```

1. Add `SHELL_NEUTRAL = "#f9fafb"` to shell tokens (alongside linen/ink).
2. Mount `AppShellProvider` once in `app/layout.tsx`.
3. Register **every route** in this document (no unregistered pages).
4. Remove `useAppShell` hook call sites → provider reads route.
5. Remove `SellerPageClient` duplicate body background effect.
6. Align `appleWebApp.statusBarStyle` + manifest with **linen default**; document ink-route status bar behavior for installed PWA.
7. iPhone test matrix: Browse → Canvas → Settings → Prohibited Items → Browse → Seller → Sell → Seller.

---

## Explicit non-goals (locked)

- Do **not** change Browse gradient or card stage in this pass.
- Do **not** change typography.
- Do **not** merge ink shell onto discovery routes (Browse stays linen).

---

*Last updated: 2026-05-23*
