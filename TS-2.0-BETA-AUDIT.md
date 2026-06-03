# ThriftShopper TS 2.0 — Beta & App Store Submission Audit

**Generated:** May 23, 2026 (updated for App Store prep)  
**Branch snapshot:** `main` @ `523cde2`  
**Production web:** `https://beta.thriftshopper.com` (Vercel)

Use this document for beta testing, App Store submission prep (web shell + Xcode on Mac Mini), and “what’s left before review.”

**Out of scope here (your lane, not code):** inventory, product photography, listing copy polish, marketing screenshots content.

---

## Table of contents

1. [Item identification: AI flow & order](#1-item-identification-ai-flow--order)
2. [UX/UI changes — what landed vs reverted](#2-uxui-changes--what-landed-vs-reverted)
3. [Other notable changes (non-UI)](#3-other-notable-changes-non-ui)
4. [API wiring status](#4-api-wiring-status)
5. [Environment variables checklist](#5-environment-variables-checklist)
6. [Suggested TS 2.0 beta focus areas](#6-suggested-ts-20-beta-focus-areas)
7. [Key file paths](#7-key-file-paths)
8. [Recent git history](#8-recent-git-history)
9. [Apple App Store submission checklist](#9-apple-app-store-submission-checklist)
10. [Stripe before you submit (required for real sales)](#10-stripe-before-you-submit-required-for-real-sales)
11. [Mac Mini / Xcode workflow](#11-mac-mini--xcode-workflow)

---

## 1. Item identification: AI flow & order

### Entry point

Seller uploads a photo on `/sell` → `POST /api/seller/upload` → `uploadAndCreateListing()` in `web/lib/seller-upload-service.ts`.

### Flow overview (current — May 2026)

```
Photo upload (client → Supabase Storage first, then JSON to API — avoids Vercel 413)
  → PARALLEL:
       • Claude Opus 4.5 — single-answer identification (PRIMARY)  [`seller-item-identification.ts`]
       • Google Cloud Vision — supplementary tags only
       • remove.bg (optional)
  → If Opus fails: OpenAI gpt-4o (legacy 3-hypothesis prompt, fallback only)
  → PARALLEL post-processing:
       • eBay sold pricing (8s timeout; non-blocking)
       • GPT-4o-mini: styles / moods / intents
       • OpenAI text-embedding-3-small: search vector
  → Price: user → eBay comps → Opus estimated_value_low/high (AI estimate banner)
  → Insert draft listing in Supabase
```

### Vision (title, description, category, tags)

| Priority | Provider | Model | Role |
|----------|----------|-------|------|
| **1** | Anthropic | `claude-opus-4-5` | GoShed-style single confident identification (`40c85a8`) |
| **2** | OpenAI | `gpt-4o` | Fallback only if Opus fails |
| **3** | Google | Cloud Vision API | Supplementary tags; not used for title unless both above fail |

**Pricing display:** eBay comps first; if none, Opus `estimated_value_low` / `estimated_value_high` → UI range + price field (`7a5534c`).

**Not in identification path:** 3-hypothesis hedging (removed from primary path; still in OpenAI fallback).

**Fixed category taxonomy:** Kitchen & Dining, Home Decor, Collectibles, Books & Media, Furniture, Art, Electronics, Fashion, Jewelry, Toys & Games, Sports & Outdoors, General.

### After vision (also parallel)

| Step | Provider | What it does |
|------|----------|--------------|
| **Styles / moods / intents** (saved to DB) | OpenAI `gpt-4o-mini` | `categorizeAttributes()` on merged attributes + title + description |
| **Embedding** | OpenAI `text-embedding-3-small` | Search vector on title + description + category |
| **Pricing** | eBay Finding API (if key set) | Sold-comps average |

**Price priority:** user price → eBay → AI estimated price (±20% clamp on re-upload if updating existing listing).

**Pricing stubs (always return null):** 1st Dibs, Etsy, Apify.

### What does NOT re-run AI

- Replacing the main photo in `SellerUploadForm` only swaps the storage URL — **no re-enrichment**.
- Voice (`/api/transcribe`, Whisper) fills seller form fields only — **not** photo analysis.

### Env vars for identification

| Variable | Effect if missing |
|----------|-------------------|
| `ANTHROPIC_API_KEY` | Skips Claude; OpenAI becomes primary |
| `OPENAI_API_KEY` | Skips OpenAI vision, categorization, embeddings |
| `VISION_API_KEY` | Skips Google supplementary/fallback |
| `EBAY_APP_ID` | Skips external pricing |
| `REMOVE_BG_KEY` | Skips background removal |

### Database fields written at enrichment

| Column | Source |
|--------|--------|
| `title`, `description`, `category` | User input OR merged vision |
| `ai_generated_title`, `ai_generated_description` | Vision suggestions |
| `ai_suggested_keywords` | Merged/filtered attributes |
| `price` | User / eBay / AI estimate |
| `styles`, `moods`, `intents` | `categorizeAttributes()` (gpt-4o-mini) |
| `embedding` | `generateEmbedding()` |
| `original_image_url`, `clean_image_url` | Storage URLs |
| `status` | `'draft'` |

---

## 2. UX/UI changes — what landed vs reverted

**Summary:** Nothing was explicitly git-reverted. The navy swap landed broadly; other Stage 1 work is **partial or never rolled out**.

### Currently active (TS 2.0 design work)

| Area | What changed |
|------|--------------|
| **Global tokens** (`globals.css`) | Linen bg `#ede9e1`, ink `#16193a`, gold token `#c5a028`, Lato body, Merriweather editorial |
| **Navy migration** | `#191970` → `#16193a` across ~44 files (commit `6c9ec4a`) |
| **Typography** | Playfair removed from `layout.tsx`; `font-editorial` / Merriweather in seller flows, splash, etc. |
| **Seller upload** | Strongest adoption: `ts-photo-frame`, navy CTAs, simplified form (`f4f9b8a`) |
| **Listing detail** | Buy Now filled with `#16193a`; editorial type on title/price |
| **Seller dashboard/settings** | Navy header/footer and CTAs; cards still use gray borders |
| **Browse (`SwipeFeed`)** | Color constant + editorial font only — **layout unchanged** (full-bleed TikTok-style, dark `#001540` bg, legacy golds) |
| **Favicon/icons** | New `favicon.ico` + PWA icons (commit `563efca`) |

### Never landed / incomplete (feels “reverted”)

| Intended change | Status |
|-----------------|--------|
| **`ts-card-surface`** bordered cards | Defined in CSS, **zero component usage** |
| **Browse card feed redesign** | **Never started** — SwipeFeed structurally unchanged |
| **Unified gold `#c5a028`** | Token exists; most UI still uses `#EFBF05` / `#efbf04` / `#cfb53b` |
| **Linen everywhere** | Token in CSS; many pages hardcode `#EDE7D9` or use dark browse bg |
| **`manifest.json` theme_color** | Still `#191970` (missed by migration) |
| **`Navigation.tsx`** | Dead code (“RetroThrifter”) — not wired into app |

### Other UX changes (pre–TS 2.0, still live)

- **Mood wheel:** “Rustic” → **“Folk Art”**; Party!, Mid-Century, Kitschy→Novelty mappings; swipe + helper text
- **Canvas / Seller dashboard:** larger TS logo (28px), “Back to Discovery” header
- **Stream Chat removed** → seller **email relay inbox** (Resend + Supabase `messages` table)
- **Beta access gate** at `/auth/gate` with invite check + `record_beta_activation` RPC

### Design commit timeline

| Commit | Description |
|--------|-------------|
| `f4f9b8a` | Stage 1 design system — linen palette, typography tokens, seller upload simplification |
| `e9b35af` | Listing detail `#16193a` + Buy Now button fill |
| `6c9ec4a` | Global `#191970` → `#16193a` |
| `c5ff850` | Remove Playfair; standardize on Merriweather |
| `563efca` | Update favicon and PWA icons |

---

## 3. Other notable changes (non-UI)

| Area | State |
|------|-------|
| **Beta access** | Gate page + `beta_access` table; `activated_at` set at gate pass |
| **Stripe Connect** | Standard accounts; destination charges + platform fee on PaymentIntent |
| **Publish vs checkout** | **Publish** can work without Stripe; **checkout** requires seller Connect + `seller_stripe_account_id` on listing |
| **Upload** | Supabase-first image upload; Opus identification; non-blocking eBay pricing |
| **Help / legal** | `/help` Help Center live (`72b4f46`); policy back-links fixed |
| **Navigation** | Listing `?from=canvas` / `?from=favorites` returns to dashboard (`523cde2`) |
| **Shipping** | Preferences UI + seller settings; checkout shipping resolved in code; no carrier API |
| **Messaging** | Email relay; seller inbox on dashboard; section auto-scrolls when expanded |
| **Account deletion** | Settings → `/api/account/delete` (App Store expectation) |
| **PWA** | manifest linen theme; icons updated; likely loaded in iOS shell |

---

## 4. API wiring status

### Fully wired (production-critical)

| Integration | Routes / usage | Required env |
|-------------|----------------|--------------|
| **Supabase** | Auth, DB, storage, RLS, beta gate | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Stripe Connect + payments** | create-payment-intent, webhook, create-account-link, account-status | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL` |
| **Orders + checkout** | create-order (client post-payment) + webhook (idempotent backup) | Supabase + Stripe + Resend |
| **OpenAI core** | Upload vision, categorization, embeddings, semantic search, Whisper | `OPENAI_API_KEY` |
| **Resend email** | Order confirmations, item sold, buyer→seller messages | `RESEND_API_KEY` |
| **Seller upload/publish** | `/api/seller/upload`, `/api/listings/publish` | Supabase + optional AI keys |
| **Semantic search** | `/api/search/semantic` ← SwipeFeed voice/text | OpenAI + Supabase pgvector |
| **Seller inbox** | messages, read, unread-count | Supabase |

### Partial / env-gated / no UI caller

| Integration | Status |
|-------------|--------|
| **Claude Vision** | Wired in upload + `/api/search/visual`; optional; **no UI calls visual search** |
| **Google Vision** | Supplementary only; optional |
| **remove.bg** | Wired; on-demand from upload form; optional |
| **eBay pricing** | Works in upload pipeline; `/api/search/pricing` exists but **no UI** |
| **PostHog** | Wired in layout; needs keys or misbehaves |
| **PWA** | Basic SW + manifest; no advanced offline |
| **Embeddings admin** | `/api/embeddings/regenerate` — no UI |
| **Semantic-mood search** | `/api/search/semantic-mood` — **no UI caller** |
| **Visual search** | `/api/search/visual` — **no UI caller** |
| **Stripe check-status** | Route exists; UI uses `account-status` instead |
| **Shipping** | Preferences only; no Shippo/EasyPost/USPS |
| **Order tracking** | Ship email works; `tracking_number` persistence **commented out** |

### Not wired / dead code

| Integration | Evidence |
|-------------|----------|
| **Stream Chat** | Removed; docs remain (`STREAM_CHAT_SETUP.md`); placeholder in `SellerDrawer.tsx` |
| **1st Dibs / Etsy / Apify pricing** | Explicit `return null` stubs in `seller-upload-service.ts` |
| **HuggingFace embeddings** | `lib/embeddings.ts` — **never imported** |
| **Algolia / Pinecone / etc.** | Not present; search is Supabase + OpenAI pgvector |

### All API routes

| Route | Integration | Client wired? |
|-------|-------------|---------------|
| `create-payment-intent` | Stripe Connect | Yes (checkout) |
| `create-order` | Supabase + Resend | Yes (checkout) |
| `stripe/webhook` | Stripe + Supabase | Stripe → server |
| `stripe/create-account-link` | Stripe Connect | Yes |
| `stripe/account-status` | Stripe + Supabase | Yes |
| `stripe/check-status` | Stripe + Supabase | **No** |
| `listings/publish` | Supabase (+ optional Stripe) | Yes |
| `seller/upload` | Supabase Storage + AI | Yes |
| `seller/remove-background` | remove.bg + Supabase | Yes |
| `seller/messages` | Supabase | Yes |
| `seller/messages/read` | Supabase | Yes |
| `seller/unread-count` | Supabase | Yes |
| `send-message` | Resend + Supabase | Yes |
| `orders/update-status` | Supabase + Resend | Seller UI (partial) |
| `search/semantic` | OpenAI + Supabase pgvector | Yes (browse) |
| `search/semantic-mood` | OpenAI + pgvector | **No** |
| `search/visual` | OpenAI/Claude/Vision | **No** |
| `search/pricing` | eBay | **No** |
| `transcribe` | OpenAI Whisper | Yes |
| `embeddings/regenerate` | OpenAI + Supabase | **No** (admin) |
| `embeddings/test-sample` | Supabase | **No** (admin) |
| `debug/mood-filter` | Supabase | **No** (debug) |

---

## 5. Environment variables checklist

No `.env.example` exists in repo. Use this to verify `.env.local`:

| Variable | Needed for | Required? |
|----------|------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Everything | **Yes** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + most API routes | **Yes** |
| `SUPABASE_SERVICE_ROLE_KEY` | Upload, webhook, messages (RLS bypass) | **Yes** (server) |
| `STRIPE_SECRET_KEY` | All Stripe routes | **Yes** (payments) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Checkout UI | **Yes** (checkout) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification | **Yes** (prod) |
| `OPENAI_API_KEY` | Upload AI, search, voice, embeddings | Strongly recommended |
| `RESEND_API_KEY` | Order + message emails | **Yes** (email flows) |
| `NEXT_PUBLIC_APP_URL` | Stripe redirects, order emails | Recommended |
| `NEXT_PUBLIC_SITE_URL` | Message email logo URL | Optional |
| `VERCEL_URL` | Email URL fallback | Auto on Vercel |
| `ANTHROPIC_API_KEY` | Claude-first identification | Optional |
| `VISION_API_KEY` | Google Vision tags | Optional |
| `REMOVE_BG_KEY` | Background removal | Optional |
| `EBAY_APP_ID` | Sold-comps pricing | Optional |
| `NEXT_PUBLIC_POSTHOG_KEY` | Analytics | Optional |
| `NEXT_PUBLIC_POSTHOG_HOST` | Analytics | Optional |
| `HUGGINGFACE_INFERENCE_TOKEN` | Dead code only | **Unused** |
| `NEXT_PUBLIC_STREAM_*` | Docs only | **Not implemented** |

**Sanity test:** If `OPENAI_API_KEY` + `ANTHROPIC_API_KEY` + `SUPABASE_SERVICE_ROLE_KEY` are set, upload → draft listing with AI fields should work. Stripe checkout works only when seller has completed Connect onboarding.

---

## 6. Suggested focus areas (beta + App Store)

1. **App Store:** complete Stripe live checklist (§10), reviewer demo account, privacy/support URLs in App Store Connect.
2. **Shell polish (post-submit OK):** mobile chrome flicker — see `TS-MOBILE-SHELL-AUDIT.md`.
3. **Continue listing QA:** upload, AI title/price, publish, checkout, order email on real device.
4. **Design debt (non-blocking):** browse feed layout; gold token unification.
5. **Beta SQL:** confirm all Supabase migrations applied on prod (Stripe columns, orders checkout columns, beta access).

---

## 7. Key file paths

| Purpose | Path |
|---------|------|
| Upload orchestration | `web/lib/seller-upload-service.ts` |
| Upload API | `web/app/api/seller/upload/route.ts` |
| Seller upload UI | `web/app/components/SellerUploadForm.tsx` |
| Browse feed | `web/app/browse/SwipeFeed.tsx` |
| Design tokens | `web/app/globals.css` |
| Root layout / metadata | `web/app/layout.tsx` |
| Listing detail | `web/app/listing/[id]/ProductDetails.tsx` |
| Seller dashboard | `web/app/seller/SellerPageClient.tsx` |
| Beta gate | `web/app/auth/gate/page.tsx` |
| Opus identification | `web/lib/seller-item-identification.ts` |
| Listing back-nav | `web/lib/listingNavigation.ts` |
| Help Center | `web/app/help/page.tsx` |
| PWA manifest | `web/public/manifest.json` |
| Semantic search | `web/lib/semantic-search.ts` |
| Stripe setup docs | `web/STRIPE_SETUP_GUIDE.md` |
| Mobile shell audit | `TS-MOBILE-SHELL-AUDIT.md` |
| Account delete API | `web/app/api/account/delete/route.ts` |

---

## 8. Recent git history

```
523cde2 Dashboard listing back-nav + Messages auto-scroll
6d76724 Symmetric seller upload photo frame padding
72b4f46 Help Center page (fix policy 404s)
067f4d1 Friendlier failed sign-in message
7a5534c Opus value-range pricing fallback
40c85a8 Opus single-answer seller identification (GoShed-style)
8672e51 Full-res Supabase upload; small AI spinner
3faab12 Bypass Vercel 413 via Supabase-first upload
```

---

## 9. Apple App Store submission checklist

**App model:** ThriftShopper ships as a **native iOS shell** (Xcode on Mac Mini) loading the **production web app** (`beta.thriftshopper.com`). The Next.js repo is the **backend + web UI**; the Xcode project is separate (same pattern as GoShed).

### What Apple cares about (marketplace + Stripe)

ThriftShopper sells **physical secondhand goods**. Apple allows **Stripe / external checkout** for real-world goods — you do **not** need In-App Purchase for item sales. You **must** explain this clearly in **App Review Notes** so reviewers do not expect IAP.

> Example note: “Users browse and purchase physical vintage items from independent sellers. Payments are processed by Stripe Connect (card checkout on our website). No digital goods or subscriptions are sold in-app.”

### URLs to register in App Store Connect

| Field | Suggested URL |
|-------|----------------|
| **Privacy Policy** | `https://beta.thriftshopper.com/privacy` |
| **Terms** | `https://beta.thriftshopper.com/terms` |
| **Support** | `support@thriftshopper.com` + `https://beta.thriftshopper.com/help` |
| **Marketing URL** | `https://thriftshopper.com` or beta URL |

### In-app legal coverage (already in web app)

| Page | Route |
|------|-------|
| Terms | `/terms` |
| Privacy | `/privacy` |
| Buyer Protection & Returns | `/returns` |
| Seller Guidelines | `/seller-guidelines` |
| Prohibited Items | `/prohibited-items` |
| Help Center | `/help` |
| Account deletion | Settings → Delete account |

### App Review demo account (prepare before submit)

Provide Apple a **dedicated test account** in App Review notes:

| Role | What reviewer should do |
|------|-------------------------|
| **Buyer** | Log in → Browse → open listing → checkout (test card) |
| **Seller** | Log in → `/sell` → upload photo → publish → (optional) Connect Stripe |

**Checklist:**

- [ ] Beta gate: reviewer invite works OR use account that already passed `/auth/gate`
- [ ] At least **one active listing** with photo, price, and seller **Stripe Connect complete**
- [ ] Test buyer purchase end-to-end on **production** (not localhost)
- [ ] Document **Stripe test card** in notes if using test mode; **live mode** needs real small purchase or Stripe test instructions for live

### Screenshots & metadata (non-code — your lane)

- [ ] iPhone 6.7" and 6.1" screenshots from **production** (Browse, listing, Canvas, seller upload)
- [ ] App description matches beta reality (AI-assisted listings, favorites, Stripe checkout)
- [ ] Age rating: user-generated photos, marketplace — expect **13+** or **17+** depending on questionnaire answers
- [ ] Export compliance / encryption: typically **standard HTTPS only** (no custom crypto)

### Known gaps to disclose or fix before review (optional / post-v1)

| Item | Risk | Notes |
|------|------|-------|
| Mobile shell color flicker | Low–medium UX | `TS-MOBILE-SHELL-AUDIT.md` — not usually rejection if functional |
| Publish without Stripe | Low | OK if reviewers only buy, not sell |
| Email-only messaging | Low | Disclose “messages via email” if asked |
| Shipping not carrier-integrated | Low | Disclose seller-managed shipping |

### What you do **not** need for App Store (coding)

- Inventory and photography quality
- More seed listings (helpful for review, not a binary requirement)
- Browse feed redesign

---

## 10. Stripe before you submit (required for real sales)

**Short answer:** Yes — if the app allows purchases, Stripe must be **production-ready** before review when you claim checkout works. Listing-only demos can skip Connect; **buy flow cannot.**

### How Stripe is wired in ThriftShopper

| Step | Behavior |
|------|----------|
| Seller onboarding | `/api/stripe/create-account-link` → Stripe Connect **Standard** onboarding |
| Publish | Can publish **without** Connect (beta-friendly) |
| Checkout | **Blocks** if listing has no `seller_stripe_account_id` or seller not `charges_enabled` / `details_submitted` |
| Payment | `create-payment-intent` → destination charge + **platform fee** (`marketplaceFees`) |
| Order record | Client `create-order` + webhook backup on `payment_intent.succeeded` |
| Webhook events | `payment_intent.succeeded`, `account.updated`, `checkout.session.completed` |

### Stripe Dashboard — do before App Review

| # | Task | Where |
|---|------|--------|
| 1 | **Activate Connect** (Standard accounts) | Stripe Dashboard → Settings → Connect |
| 2 | Complete **platform profile** (business name, support email, branding) | Connect settings |
| 3 | Switch to **Live mode** for production Vercel env | Developers → API keys |
| 4 | Add **live webhook** endpoint | `https://beta.thriftshopper.com/api/stripe/webhook` |
| 5 | Subscribe to events | `payment_intent.succeeded`, `account.updated` (and optionally `checkout.session.completed`) |
| 6 | Copy **live** `STRIPE_WEBHOOK_SECRET` into Vercel | Env vars |
| 7 | Set `NEXT_PUBLIC_APP_URL` to production URL | Vercel (redirect URLs after Connect onboarding) |

### Vercel production env (minimum for payments)

```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...   # from LIVE webhook endpoint
NEXT_PUBLIC_APP_URL=https://beta.thriftshopper.com
SUPABASE_SERVICE_ROLE_KEY=...     # required for webhook + upload
RESEND_API_KEY=...                # order + message emails
```

### Supabase SQL (confirm applied on prod)

| Migration / topic | File (reference) |
|-------------------|------------------|
| Profile Stripe columns | `web/supabase/add-stripe-connect-fields.sql` |
| `seller_stripe_account_id` on listings | `web/supabase/add-seller-stripe-to-listings.sql` |
| Orders / checkout columns | `web/supabase/add-orders-checkout-columns.sql` |

### End-to-end test script (run on phone against production)

1. **Seller:** Settings or Seller dashboard → Connect payouts → complete Stripe onboarding → green “Payments Connected”
2. **Seller:** Upload item → publish listing (active)
3. **Buyer:** Open listing → Buy → pay with test/live card per your Stripe mode
4. **Verify:** Order in Supabase `orders`; listing `status = sold`; confirmation emails if Resend configured
5. **Stripe Dashboard:** Payment visible; transfer to connected account; application fee to platform

### Test vs Live for App Review

| Mode | When to use |
|------|-------------|
| **Test** | Development on Lenovo; Stripe test cards; test Connect accounts |
| **Live** | App Store build pointing at production URL if reviewers will complete checkout |

If the iOS app loads **production** URL, Vercel must have **live** keys for a real purchase — or you instruct reviewers to use **test mode only** with a test seller (harder). Simplest path: **live keys + one cheap real listing** for review, or **demo mode** that disables buy (not ideal).

**Recommendation:** Use **live Stripe on beta.thriftshopper.com**, one $1–5 review listing, refund after approval if needed.

---

## 11. Mac Mini / Xcode workflow

| Machine | Role |
|---------|------|
| **Lenovo (Windows)** | Day-to-day: Cursor, git push, Vercel deploys, Supabase SQL, content/photos |
| **Mac Mini** | App Store: Xcode archive, signing, TestFlight, App Store Connect upload |

### Suggested order on Mac Mini

1. Pull latest `main` (includes `523cde2`).
2. Open **iOS shell project** (GoShed-style WKWebView app — point **start URL** to `https://beta.thriftshopper.com`).
3. Confirm **Associated Domains** / ATS if using HTTPS only (default OK).
4. Test on device: login, browse, favorite → listing → **back to Canvas**, seller upload, Help → Returns → back to Help.
5. Archive → TestFlight internal → fix shell issues → submit for review.

### Align with GoShed learnings

- Privacy + terms URLs in App Store Connect
- Review notes explaining **external payment for physical goods**
- Demo buyer + seller credentials
- Support email monitored during review window

---

*End of audit. Last updated for App Store submission prep, May 23, 2026.*
