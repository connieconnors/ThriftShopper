# Seller and Buyer Dual Role Support

## Database Schema

The `profiles` table has an `is_seller` column:
```sql
is_seller BOOLEAN DEFAULT FALSE
```

This column can have three values:
- `TRUE` - User has seller capabilities (can create listings, access seller dashboard)
- `FALSE` - User is buyer-only (default)
- `NULL` - User is buyer-only (treated same as FALSE)

## How It Works

### Being Both Seller and Buyer

**The system already supports users being both sellers and buyers!**

- **`is_seller = TRUE`** means the user has seller capabilities (can sell)
- **`is_seller = FALSE` or `NULL`** means the user is buyer-only (cannot sell)

**Key Point:** Being a seller (`is_seller = TRUE`) does NOT prevent you from also being a buyer. Sellers can:
- Browse products
- Add favorites
- Make purchases
- Access the buyer account page (My Canvas)
- Use all buyer features

### Current Implementation

1. **Email Confirmation Routing** (`web/app/auth/callback/page.tsx`):
   - If `is_seller = TRUE` → Routes to `/seller/onboarding` or `/seller` (if complete)
   - If `is_seller = FALSE` or `NULL` → Routes to `/account` (My Canvas)

2. **Buyer Account Page** (`web/app/account/page.tsx`):
   - Has a "Become a Seller" link that goes to `/seller/onboarding`
   - This sets `is_seller = TRUE` when they complete onboarding

3. **Seller Dashboard** (`web/app/seller/page.tsx`):
   - Has a "Want to shop instead? Go to My Canvas →" link
   - Sellers can always access buyer features

4. **Seller Onboarding** (`web/app/seller/onboarding/page.tsx`):
   - Sets `is_seller = TRUE` when form is submitted
   - Has a link to switch back to buyer mode

### How to Become Both

**Scenario 1: Start as Buyer, Become Seller**
1. Sign up as buyer (or don't specify `?seller=true`)
2. `is_seller` is `FALSE` or `NULL`
3. Go to My Canvas → Click "Become a Seller"
4. Complete seller onboarding
5. `is_seller` becomes `TRUE`
6. Now you can access both:
   - `/seller` - Seller dashboard
   - `/account` - Buyer account (My Canvas)

**Scenario 2: Start as Seller, Also Shop**
1. Sign up with `?seller=true` in URL
2. `is_seller` is set to `TRUE`
3. Complete seller onboarding
4. You can now:
   - Access `/seller` - Seller dashboard
   - Access `/account` - Buyer account (My Canvas)
   - Browse, favorite, and purchase items

### Database Queries

When checking if a user is a seller:
```sql
-- Check if user can sell
SELECT is_seller FROM profiles WHERE id = 'user-id';
-- Returns: TRUE (can sell), FALSE/NULL (buyer only)
```

When checking if a user can access buyer features:
```sql
-- All users can be buyers (no check needed)
-- Sellers can also be buyers, so no restriction
```

### RLS Policies

The Row Level Security (RLS) policies allow:
- **Sellers** (`is_seller = TRUE`) can:
  - Create listings (seller_id must match their id)
  - View their own listings
  - Access seller dashboard
  
- **All users** (including sellers) can:
  - Browse listings
  - Add favorites
  - Create orders (as buyer)
  - View their own orders (as buyer or seller)

### Recommendations

1. **Keep `is_seller` as a boolean flag** - Simple and works well
2. **Don't prevent sellers from accessing buyer features** - They should be able to shop too
3. **Use `is_seller` to gate seller-specific features** - Like creating listings, accessing seller dashboard
4. **Allow role switching** - Users should be able to toggle between seller and buyer views

### Future Enhancements (Optional)

If you want more granular control, you could add:
- `is_buyer BOOLEAN DEFAULT TRUE` - Explicitly track buyer status
- `seller_status TEXT` - 'none', 'pending', 'active', 'suspended'
- But for now, the current `is_seller` boolean is sufficient

