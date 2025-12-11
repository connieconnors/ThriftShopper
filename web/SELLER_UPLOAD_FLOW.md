# Seller Upload Flow - Quick Reference

## Step-by-Step Process

### 1. Create Seller Account
- Go to: `http://localhost:3000/signup?seller=true`
- Fill in email, password
- Check "I want to receive promotional emails" (optional)
- Click "Sign Up"
- **If email confirmation required**: Check email and confirm
- **After confirmation**: You'll be redirected to `/seller/onboarding`

### 2. Complete Seller Onboarding
- Fill in:
  - Store Name
  - Description
  - City, State, ZIP
  - Email, Phone
  - Shipping Speed
- Click "Complete Setup"
- You'll be redirected to `/seller-dashboard`

### 3. Upload Products
**Option A: From Seller Dashboard**
- Go to `/seller-dashboard`
- Click "Add New Listing" or "Upload Product"
- Upload image, fill in details

**Option B: Direct Upload Page**
- Go to `/sell`
- Upload image
- The form will:
  1. Upload image to Supabase Storage
  2. Process image (remove background, analyze)
  3. Generate title/description (AI-powered)
  4. Suggest price
  5. Save to `listings` table with `status='active'`

### 4. Verify Products Appear
- Go to `/browse`
- Your products should appear in the feed
- Make sure `status='active'` in the database

## Important Notes

- **Status**: New listings should have `status='active'` to appear in browse
- **Images**: Uploaded to Supabase Storage bucket `listings`
- **Seller ID**: Automatically set to your user ID
- **Profile**: Make sure your profile has `is_seller=true`

## Troubleshooting

**Products not showing?**
- Check `status='active'` in `listings` table
- Check RLS policies allow public read
- Check browser console for errors

**Can't access seller pages?**
- Make sure you're logged in
- Check `profiles.is_seller=true`
- Complete onboarding first

