# Seller Demo Guide - Tomorrow's Test

## Complete Flow Checklist

### ✅ What's Working:
1. **Seller Signup**: `/signup?seller=true` → Creates account with `is_seller=true`
2. **Email Confirmation**: Click link → Redirects to `/seller/onboarding` (if profile incomplete)
3. **Seller Onboarding**: Fill out store details → Saves to profile
4. **Product Upload**: `/sell` → Upload image → AI processes → Creates listing
5. **Seller Dashboard**: View listings, stats, manage products

### 📋 Step-by-Step Demo Flow:

#### 1. Seller Signs Up
- Go to: `http://localhost:3000/signup?seller=true`
- Fill in:
  - Email (use seller's real email)
  - Password
  - Check "I want to receive promotional emails" (optional)
- Click "Sign Up"
- **If email confirmation required**: Check email, click confirmation link
- **Should redirect to**: `/seller/onboarding`

#### 2. Complete Seller Onboarding
- Fill in:
  - Store Name
  - Description
  - City, State, ZIP
  - Email, Phone
  - Shipping Speed
- Click "Complete Setup"
- **Should redirect to**: `/seller-dashboard`

#### 3. Upload First Product
- Click "Add New Listing" (or go to `/sell`)
- Upload an image
- Wait for AI processing:
  - Background removal (if enabled)
  - Image analysis
  - Title/description generation
  - Price suggestion
- Review AI suggestions
- Edit if needed
- Click "Publish" or "Save as Draft"
- **Should see**: Listing appears in seller dashboard

#### 4. Verify Product Appears
- Go to `/browse`
- **Should see**: The new listing appears in the feed
- Check that it has:
  - Image
  - Title
  - Price
  - Seller info

## ⚠️ Potential Issues & Quick Fixes:

### Issue 1: Redirects to onboarding after upload
- **Cause**: Profile check in `/seller/page.tsx`
- **Fix**: Already fixed (uses `user_id` now)
- **If still happens**: Check that profile has `display_name` and `location_city`

### Issue 2: RLS error on upload
- **Cause**: Service role key not set or RLS policy blocking
- **Fix**: 
  - Check `.env.local` has `SUPABASE_SERVICE_ROLE=...`
  - Run SQL: `DROP POLICY IF EXISTS "Sellers can create listings" ON public.listings; CREATE POLICY "Sellers can create listings" ON public.listings FOR INSERT WITH CHECK (auth.uid() = seller_id);`

### Issue 3: No AI-generated content
- **Cause**: `OPENAI_API_KEY` not set
- **Fix**: Add to `.env.local` (optional - will use fallback categorization)

### Issue 4: Email confirmation not working
- **Cause**: Redirect URL not configured in Supabase
- **Fix**: Supabase Dashboard → Authentication → URL Configuration → Add `http://localhost:3000/auth/callback`

## 🎯 What to Show the Seller:

1. **"It's this easy"** - Show the upload flow
2. **AI does the work** - Point out auto-generated title/description
3. **Professional images** - Show background removal (if enabled)
4. **Smart pricing** - Show price suggestions
5. **Live immediately** - Show product appearing in browse feed

## 📝 Pre-Demo Checklist:

- [ ] Dev server running (`npm run dev`)
- [ ] `.env.local` has all keys:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE` (or `SUPABASE_SERVICE_ROLE_KEY`)
  - [ ] `OPENAI_API_KEY` (optional but recommended)
- [ ] Test signup flow yourself first
- [ ] Test upload flow yourself first
- [ ] Verify products appear in `/browse`

## 🚀 Quick Test Before Demo:

1. Create a test seller account
2. Upload a test product
3. Verify it appears in browse
4. If all works → You're ready!

## 💡 Tips for Demo:

- **Use real product photos** - Makes it more impressive
- **Show the AI suggestions** - "Look, it wrote the description for you!"
- **Point out the categorization** - "It automatically tags it with moods and styles"
- **Show the dashboard** - "You can see all your listings here"
- **Show it live** - "And buyers can see it right now in the browse feed"

---

**You're all set!** The flow should work smoothly. If anything breaks during the demo, refer to the "Potential Issues" section above.

