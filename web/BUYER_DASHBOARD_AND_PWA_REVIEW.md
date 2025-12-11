# Buyer Dashboard, Messaging, PWA & Legal Pages Review

## 🔍 Current Status

### ✅ What Exists:
- **Seller Dashboard** - `/seller-dashboard` (fully functional)
- **Seller Messaging** - Stream Chat integration wired (not tested)
- **Buyer Favorites** - `/favorites` page
- **Navigation** - Basic user menu (favorites, sign out)

### ❌ What's Missing:

#### 1. Buyer Dashboard/Account Page
- No dedicated buyer account page
- No order history for buyers
- No purchase tracking
- No buyer profile settings
- No saved addresses/payment methods

#### 2. Buyer Messaging
- Stream Chat is set up but only accessible to sellers
- No buyer-facing messaging interface
- No way for buyers to message sellers about listings

#### 3. PWA (Progressive Web App)
- No `manifest.json`
- No service worker
- No install prompt
- No offline support
- No app icons

#### 4. Legal Pages
- No Terms of Service page
- No Privacy Policy page
- No "What We Accept/Don't Accept" policy page
- No footer links to legal pages

---

## 📋 Implementation Plan

### Priority 1: Buyer Dashboard

**Route:** `/account` or `/dashboard`

**Features Needed:**
- [ ] Order history (purchases)
- [ ] Saved favorites (link to `/favorites`)
- [ ] Profile settings (display name, avatar, email)
- [ ] Saved addresses
- [ ] Payment methods (Stripe saved cards)
- [ ] Account preferences
- [ ] Link to seller dashboard (if user is also a seller)

**Database Tables Needed:**
- `orders` table (if not exists) - buyer_id, listing_id, amount, status, created_at
- `addresses` table - user_id, type (shipping/billing), street, city, state, zip
- `payment_methods` table - user_id, stripe_payment_method_id, last4, brand

### Priority 2: Buyer Messaging

**Current State:**
- Stream Chat is configured (`/api/stream/token`)
- `StreamChatProvider` exists
- Only seller messaging component exists

**What's Needed:**
- [ ] Buyer messaging page (`/messages` or `/account/messages`)
- [ ] "Message Seller" button on listing detail pages
- [ ] Conversation list for buyers
- [ ] Real-time chat interface using Stream Chat
- [ ] Link conversations to listings

**Implementation:**
- Create `/app/messages/page.tsx` or `/app/account/messages/page.tsx`
- Use Stream Chat React components
- Create channel per buyer-seller-listing combination
- Add "Message Seller" CTA on `/listing/[id]` page

### Priority 3: PWA Setup

**Files Needed:**
1. `public/manifest.json` - App manifest
2. `public/icons/` - App icons (various sizes)
3. Service worker (Next.js can generate this)
4. Update `next.config.ts` for PWA

**Steps:**
1. Install PWA package: `npm install next-pwa`
2. Create `public/manifest.json` with app info
3. Generate app icons (192x192, 512x512, etc.)
4. Configure `next.config.ts` for PWA
5. Add install prompt component
6. Test on mobile devices

**Manifest.json Structure:**
```json
{
  "name": "ThriftShopper",
  "short_name": "ThriftShopper",
  "description": "The magic of discovery™",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#191970",
  "theme_color": "#cfb53b",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Priority 4: Legal Pages

**Pages Needed:**
- [ ] `/terms` - Terms of Service
- [ ] `/privacy` - Privacy Policy
- [ ] `/policies` or `/what-we-accept` - What We Accept/Don't Accept
- [ ] Footer component with links to all legal pages

**Implementation:**
- Create `/app/terms/page.tsx`
- Create `/app/privacy/page.tsx`
- Create `/app/policies/page.tsx`
- Update footer/navigation to include legal links
- Add legal links to signup/login pages (required by law)

---

## 🧪 Testing Checklist

### Messaging Testing:
- [ ] Seller can receive messages from buyers
- [ ] Buyer can send messages to sellers
- [ ] Messages are linked to listings
- [ ] Real-time updates work
- [ ] Unread count updates correctly
- [ ] Mobile messaging works

### PWA Testing:
- [ ] Install prompt appears on mobile
- [ ] App installs correctly
- [ ] App icon shows on home screen
- [ ] App opens in standalone mode
- [ ] Offline functionality (if implemented)
- [ ] Push notifications (future)

### Buyer Dashboard Testing:
- [ ] Order history displays correctly
- [ ] Profile settings save
- [ ] Addresses can be added/edited
- [ ] Payment methods can be saved
- [ ] Links to seller dashboard work (if user is seller)

---

## 📝 Next Steps

1. **Create buyer dashboard** (`/account` page)
2. **Add buyer messaging** (Stream Chat interface)
3. **Set up PWA** (manifest, icons, service worker)
4. **Create legal pages** (terms, privacy, policies)
5. **Test messaging** end-to-end
6. **Test PWA** on mobile devices
7. **Update navigation** with new links

---

## 🔗 Related Files

- Seller Dashboard: `web/app/seller-dashboard/page.tsx`
- Seller Messaging: `web/app/seller/components/SellerMessages.tsx`
- Stream Chat Provider: `web/app/seller/StreamChatProvider.tsx`
- Stream Token API: `web/app/api/stream/token/route.ts`
- Navigation: `web/app/components/Navigation.tsx`

---

**Status:** Ready for implementation
**Priority:** High (buyer experience is incomplete without these)

