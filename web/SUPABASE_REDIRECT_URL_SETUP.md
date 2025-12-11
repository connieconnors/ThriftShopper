# Supabase Redirect URL Configuration

## Problem
Email confirmation links are pointing to `localhost:3000` instead of your Vercel URL, causing "connection refused" errors.

## Solution: Update Supabase Redirect URLs

You need to configure Supabase to use your Vercel URL for email confirmations.

### Steps:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Authentication Settings**
   - Go to **Authentication** → **URL Configuration**

3. **Add Your Vercel URL**
   - In the **Redirect URLs** section, add:
     ```
     https://your-vercel-url.vercel.app/auth/callback
     ```
   - Replace `your-vercel-url` with your actual Vercel domain
   - Example: `https://thrift-shopper.vercel.app/auth/callback`

4. **Add Site URL** (if not already set)
   - Set **Site URL** to:
     ```
     https://your-vercel-url.vercel.app
     ```

5. **For Local Development** (optional)
   - Also add:
     ```
     http://localhost:3000/auth/callback
     ```
   - This allows testing email confirmations locally

6. **Save Changes**
   - Click **Save** at the bottom

## After Updating

- New signups will receive email confirmation links pointing to your Vercel URL
- Users clicking the link will be redirected to `/auth/callback` on your live site
- The callback page will handle the confirmation and redirect appropriately

## Testing

1. Sign up a new account
2. Check your email for the confirmation link
3. The link should now point to your Vercel URL (not localhost)
4. Click it - it should work!

---

**Note:** If you're still seeing localhost links, you may need to wait a few minutes for the changes to propagate, or clear your browser cache.

