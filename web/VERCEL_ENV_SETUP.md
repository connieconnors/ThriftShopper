# Vercel Environment Variables Setup

## Critical: Service Role Key Required

The seller upload functionality requires the Supabase **Service Role Key** to bypass Row Level Security (RLS) policies when creating listings server-side.

## How to Set Up on Vercel

### Step 1: Get Your Supabase Service Role Key

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Find the **service_role** key (NOT the anon key)
5. Copy it (it starts with `eyJ...`)

⚠️ **IMPORTANT**: The service role key has full database access. Never expose it in client-side code or commit it to git.

### Step 2: Add to Vercel

1. Go to your Vercel project: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add the following:

   **Name:** `SUPABASE_SERVICE_ROLE_KEY`  
   **Value:** (paste your service role key from Step 1)  
   **Environment:** Select all (Production, Preview, Development)

6. Click **Save**

### Step 3: Redeploy

After adding the environment variable:

1. Go to **Deployments** tab
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**

Or push a new commit to trigger a redeploy.

## Verification

After redeploying, test the seller upload flow:

1. Sign in as a seller
2. Go to `/sell`
3. Upload an image
4. Click "Use AI"

If you still see "new row violates row-level security policy", check:

- ✅ Environment variable is named exactly: `SUPABASE_SERVICE_ROLE_KEY`
- ✅ It's set for the correct environment (Production/Preview)
- ✅ You've redeployed after adding it
- ✅ The value is the **service_role** key (not anon key)

## Alternative Variable Name

The code also accepts `SUPABASE_SERVICE_ROLE` (without `_KEY`), but `SUPABASE_SERVICE_ROLE_KEY` is preferred.

## Troubleshooting

### Error: "SUPABASE_SERVICE_ROLE_KEY environment variable is required"

This means the environment variable isn't set. Follow Step 2 above.

### Error: "new row violates row-level security policy"

This means:
1. The service role key isn't set, OR
2. The wrong key is set (you used anon key instead of service role key)

Double-check you're using the **service_role** key from Supabase Settings → API.

### Still Not Working?

1. Check Vercel deployment logs:
   - Go to your deployment
   - Click **Functions** tab
   - Check for errors in `/api/seller/upload`

2. Verify the key in Supabase:
   - Settings → API
   - Make sure you copied the **service_role** key (not anon or JWT secret)

3. Test locally first:
   - Add `SUPABASE_SERVICE_ROLE_KEY=...` to your `.env.local`
   - Test upload on localhost
   - If it works locally but not on Vercel, it's an env var configuration issue

---

**Last Updated:** Today  
**Related Files:**
- `web/lib/seller-upload-service.ts` - Uses the service role key
- `web/app/api/seller/upload/route.ts` - API route that calls the service

