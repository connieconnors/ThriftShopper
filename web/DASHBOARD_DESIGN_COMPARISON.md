# Dashboard Design Comparison: Buyer Canvas vs Seller Dashboard

## Current State

### Buyer Canvas (`/account` - "My Canvas")

**Location:** `web/app/account/page.tsx`

**Design:**
- **Background:** `#FFF8E6` (light gold tint)
- **Header:** Sticky navy blue (`#191970`) with TS logo and profile avatar
- **Layout:** Vertical scroll with sections:
  - Profile Summary
  - Saved Searches
  - Saved Moods
  - Your Vibes Summary
  - Recently Viewed
  - Recommendations
  - Saved Items (Favorites)
  - Purchases

**Bottom Navigation Footer:**
- Fixed at bottom, navy blue background (`#191970`)
- Four icons with labels:
  1. **Browse** (Search icon) → `/browse`
  2. **Saved** (Heart icon) → `/favorites`
  3. **Messages** (MessageSquare icon) → `/messages`
  4. **Account** (User icon) → `/account` (active state with gold color)

**Profile Menu:**
- Dropdown from avatar with:
  - Edit Profile
  - Shipping Address
  - Payment Methods
  - Become a Seller
  - Sign Out

---

### Seller Dashboard (`/seller`)

**Location:** `web/app/seller/page.tsx`

**Design:**
- **Background:** White
- **Header:** TS logo, "Seller Dashboard" title, Messages button, Settings button
- **Layout:** Vertical scroll with:
  - Stats cards (Total Listings, Active, Views, Sales)
  - Messages section (expandable)
  - Listings grid with actions (Edit, Hide, Delete)

**Footer:**
- Simple text footer with:
  - "Want to shop instead? Go to My Canvas →" link
  - Sign Out button
- **No bottom navigation bar**

**Messages:**
- Expandable section in main content area
- Uses `MessageCircle` icon in header

---

## Design Alignment Needed

### 1. **Bottom Navigation Footer**
- **Buyer Canvas:** Has 4-icon bottom nav (Browse, Saved, Messages, Account)
- **Seller Dashboard:** No bottom nav - needs to be added

**Proposed Seller Footer:**
- **Browse** (Search icon) → `/browse`
- **Listings** (Package/Grid icon) → `/seller` (active)
- **Messages** (MessageSquare icon) → `/messages` or seller messages
- **Support** (HelpCircle/Headphones icon) → `/support` or help center
- **Account** (User icon) → `/account` or seller settings

### 2. **Messages Icon Consistency**
- **Buyer:** Uses `MessageSquare` from lucide-react
- **Seller:** Uses `MessageCircle` from lucide-react
- **Action:** Standardize on `MessageSquare` for consistency

### 3. **Support/Help Icon**
- **Buyer:** No support icon currently
- **Seller:** No support icon currently
- **Action:** Add Support icon to both dashboards

### 4. **Color Scheme**
- **Buyer:** Uses brand colors (`#191970` navy, `#EFBF05` gold, `#FFF8E6` background)
- **Seller:** Uses white background, gray text
- **Action:** Apply consistent brand colors to Seller dashboard

### 5. **Header Design**
- **Buyer:** Sticky navy header with logo and avatar
- **Seller:** White header with logo, title, and action buttons
- **Action:** Consider making Seller header sticky and navy to match Buyer

---

## Recommended Changes

### Priority 1: Add Bottom Navigation to Seller Dashboard
```tsx
{/* Bottom Navigation - Match Buyer Canvas */}
<nav
  className="fixed bottom-0 left-0 right-0 border-t border-gray-200 px-4 py-3 z-30"
  style={{ backgroundColor: "#191970" }}
>
  <div className="max-w-md mx-auto flex items-center justify-around">
    <Link href="/browse" className="flex flex-col items-center gap-1 text-white/70 hover:text-white">
      <Search className="h-5 w-5" />
      <span className="text-[10px]">Browse</span>
    </Link>
    <Link href="/seller" className="flex flex-col items-center gap-1 text-white transition-colors">
      <Package className="h-5 w-5" style={{ color: "#EFBF05" }} />
      <span className="text-[10px]" style={{ color: "#EFBF05" }}>Listings</span>
    </Link>
    <Link href="/messages" className="flex flex-col items-center gap-1 text-white/70 hover:text-white">
      <MessageSquare className="h-5 w-5" />
      <span className="text-[10px]">Messages</span>
    </Link>
    <Link href="/support" className="flex flex-col items-center gap-1 text-white/70 hover:text-white">
      <HelpCircle className="h-5 w-5" />
      <span className="text-[10px]">Support</span>
    </Link>
    <Link href="/account" className="flex flex-col items-center gap-1 text-white/70 hover:text-white">
      <User className="h-5 w-5" />
      <span className="text-[10px]">Account</span>
    </Link>
  </div>
</nav>
```

### Priority 2: Standardize Icons
- Use `MessageSquare` instead of `MessageCircle` everywhere
- Add `HelpCircle` or `Headphones` for Support

### Priority 3: Apply Brand Colors
- Seller dashboard background: `#FFF8E6` or white (keep white for now)
- Seller header: Make sticky and navy (`#191970`) to match Buyer
- Active states: Use gold (`#EFBF05`) consistently

---

## Design Reference

The Buyer Canvas follows a "My Canvas" design concept:
- Personal, curated space
- Discovery-focused
- Visual with image grids
- Bottom navigation for quick access

The Seller Dashboard should feel:
- Professional but approachable
- Action-oriented
- Consistent navigation with Buyer
- Same brand identity

---

## Next Steps

1. ✅ Document current state (this file)
2. ⏳ Add bottom navigation to Seller dashboard
3. ⏳ Standardize Message icons
4. ⏳ Add Support icon to both dashboards
5. ⏳ Apply consistent brand colors
6. ⏳ Make Seller header sticky and navy

