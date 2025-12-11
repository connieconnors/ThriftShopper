# ThriftShopper Deployment Strategy

## Current Situation

- **Marketing Website**: `thriftshopper.com` (separate repo, separate Vercel deployment)
  - Contains: Terms, Privacy Policy, marketing content
  - Purpose: Public-facing marketing site
  
- **App (This Repo)**: Marketplace application
  - Contains: Buyer/seller flows, listings, payments
  - Currently: Deploys to Vercel (auto-generated URL)
  - Purpose: The actual marketplace application

## 🎯 Deployment Strategy Options

### Option 1: Subdomain (RECOMMENDED) ⭐
**`app.thriftshopper.com`** or **`shop.thriftshopper.com`**

**Pros:**
- ✅ Clean separation from marketing site
- ✅ Professional appearance
- ✅ Easy to route (DNS CNAME to Vercel)
- ✅ Can move to main domain later (`thriftshopper.com`) without code changes
- ✅ SEO-friendly (subdomain is treated as separate site)
- ✅ No conflicts with marketing site routes

**Cons:**
- ⚠️ Requires DNS configuration (5 minutes)
- ⚠️ Need to add domain in Vercel

**Implementation:**
1. Add `app.thriftshopper.com` as custom domain in Vercel
2. Add CNAME record in DNS: `app` → `cname.vercel-dns.com`
3. Update environment variables if needed
4. Done!

**Beta Strategy:**
- Start: `app.thriftshopper.com` (beta)
- Later: Move to `thriftshopper.com` (production)
- Marketing site: Move to `www.thriftshopper.com` or keep separate

---

### Option 2: Subdirectory
**`thriftshopper.com/beta`** or **`thriftshopper.com/app`**

**Pros:**
- ✅ Uses main domain
- ✅ Simple URL structure

**Cons:**
- ❌ **CONFLICTS** with marketing site (same domain, different repo)
- ❌ Marketing site would need to exclude `/beta` routes
- ❌ More complex routing
- ❌ Harder to separate concerns
- ❌ If marketing site uses Next.js, route conflicts

**Verdict:** ❌ **NOT RECOMMENDED** - Too many conflicts

---

### Option 3: Separate Domain
**`retrothrifter.com`**

**Pros:**
- ✅ Complete separation
- ✅ No conflicts

**Cons:**
- ❌ Confusing brand (as you noted)
- ❌ Brand dilution
- ❌ Users might not connect it to ThriftShopper
- ❌ Marketing confusion

**Verdict:** ❌ **NOT RECOMMENDED** - Brand confusion

---

## 🏆 Recommended Strategy: Subdomain Approach

### Phase 1: Beta Launch
- **App**: `app.thriftshopper.com` (or `shop.thriftshopper.com`)
- **Marketing**: `thriftshopper.com` (existing)
- **Status**: Beta testing, limited users

### Phase 2: Production Launch
- **App**: `thriftshopper.com` (main domain)
- **Marketing**: `www.thriftshopper.com` or keep separate
- **Status**: Public launch

### Phase 3: Future
- Keep subdomain as backup/redirect
- Or use subdomain for specific features (e.g., `seller.thriftshopper.com`)

---

## 📋 Implementation Steps

### Step 1: Set Up Subdomain (Beta)

1. **In Vercel Dashboard:**
   - Go to your project → Settings → Domains
   - Add domain: `app.thriftshopper.com`
   - Vercel will show you DNS instructions

2. **In Your DNS Provider:**
   - Add CNAME record:
     - Name: `app`
     - Value: `cname.vercel-dns.com` (or what Vercel tells you)
   - Wait for DNS propagation (5-30 minutes)

3. **Update Environment Variables (if needed):**
   - `NEXT_PUBLIC_APP_URL=https://app.thriftshopper.com`
   - Update any hardcoded URLs

4. **Test:**
   - Visit `app.thriftshopper.com`
   - Should load your app

### Step 2: Update Code (if needed)

Check for hardcoded URLs:
```bash
grep -r "vercel.app" web/
grep -r "localhost:3000" web/
```

Update to use environment variable:
```typescript
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
```

### Step 3: Marketing Site Links

Update marketing site (`thriftshopper.com`) to link to:
- "Shop Now" → `https://app.thriftshopper.com`
- "Start Selling" → `https://app.thriftshopper.com/sell`
- "Sign Up" → `https://app.thriftshopper.com/signup`

---

## 🔄 Migration Path (Beta → Production)

When ready to launch:

1. **Add main domain to Vercel:**
   - Add `thriftshopper.com` as domain
   - Vercel handles both `thriftshopper.com` and `www.thriftshopper.com`

2. **Update DNS:**
   - Point `thriftshopper.com` to Vercel
   - Keep `app.thriftshopper.com` as redirect

3. **Update Marketing Site:**
   - Change links from `app.thriftshopper.com` → `thriftshopper.com`
   - Or redirect marketing site to `www.thriftshopper.com`

4. **No Code Changes Needed:**
   - App works on any domain
   - Just update environment variables

---

## 🎨 Branding Considerations

### Option A: Same Brand (Recommended)
- **Marketing**: `thriftshopper.com` → "Learn about ThriftShopper"
- **App**: `app.thriftshopper.com` → "Shop on ThriftShopper"
- **Unified brand**, clear purpose

### Option B: Beta Badge
- Add "Beta" badge in app header during beta phase
- Remove when launching to production
- Users understand it's in testing

---

## 📊 Comparison Table

| Option | URL | Conflicts? | Brand Clarity | Ease of Setup | Recommendation |
|-------|-----|------------|--------------|---------------|----------------|
| **Subdomain** | `app.thriftshopper.com` | ❌ None | ✅ Clear | ✅ Easy | ⭐ **BEST** |
| Subdirectory | `thriftshopper.com/beta` | ⚠️ Yes | ✅ Clear | ⚠️ Complex | ❌ Avoid |
| Separate Domain | `retrothrifter.com` | ❌ None | ❌ Confusing | ✅ Easy | ❌ Avoid |

---

## ✅ Recommended Action Plan

1. **Today**: Set up `app.thriftshopper.com` subdomain
2. **Beta Phase**: Use `app.thriftshopper.com` for testing
3. **Launch**: Move to `thriftshopper.com` when ready
4. **Marketing Site**: Keep at `thriftshopper.com` or move to `www.thriftshopper.com`

---

## 🔗 Related Files

- Vercel Configuration: `vercel.json` (if exists)
- Environment Variables: `.env.local`, `.env.production`
- Next.js Config: `web/next.config.ts`

---

**Next Steps:**
1. Review this strategy
2. Decide on subdomain name (`app` vs `shop` vs other)
3. Set up DNS and Vercel domain
4. Update any hardcoded URLs
5. Test deployment

