# Supabase Email Confirmation Setup

## Problem: Not Receiving Confirmation Emails

If you're not receiving confirmation emails after signup, check these settings in Supabase:

### 1. Enable Email Confirmation

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Make sure **Email** provider is enabled
3. Go to **Authentication** → **Email Templates**
4. Check that **Confirm signup** template exists and is enabled

### 2. Check Email Confirmation Settings

1. Go to **Authentication** → **Settings**
2. Look for **"Enable email confirmations"** or **"Confirm email"** setting
3. Make sure it's **ENABLED** (not disabled)
4. If it's disabled, Supabase won't send confirmation emails

### 3. Verify Redirect URL is Allowed

The `emailRedirectTo` URL **MUST** be in your allowed redirect URLs:

1. Go to **Authentication** → **URL Configuration**
2. In **Redirect URLs**, make sure you have:
   - `https://your-vercel-url.vercel.app/auth/callback` (for production)
   - `http://localhost:3000/auth/callback` (for local development)
3. If the URL isn't in the list, Supabase might not send the email

### 4. Check Email Service

1. Go to **Settings** → **Auth**
2. Check if you're using:
   - **Supabase SMTP** (default, free tier)
   - **Custom SMTP** (if configured)
3. If using custom SMTP, verify credentials are correct

### 5. Check Spam Folder

- Confirmation emails might go to spam
- Check your spam/junk folder
- Add Supabase emails to your contacts

### 6. Rate Limiting

- Supabase has rate limits on emails
- If you've sent too many test emails, wait a few minutes
- Free tier: ~4 emails per hour per user

## Quick Test

1. Sign up with a new email address
2. Check console logs for:
   - `🔍 Signup: emailRedirectTo = ...` (should show your URL)
   - `📊 Signup result: { hasUser: true, hasSession: false }` (means email confirmation required)
3. Check your email (including spam)
4. If still no email, check Supabase logs:
   - **Logs** → **Auth Logs** → Look for email send attempts

## Common Issues

### Issue: Email confirmation is disabled
**Fix:** Enable it in Authentication → Settings

### Issue: Redirect URL not allowed
**Fix:** Add the exact URL to Authentication → URL Configuration → Redirect URLs

### Issue: Using wrong emailRedirectTo format
**Fix:** Should be full URL: `https://domain.com/auth/callback` (not just `/auth/callback`)

### Issue: Email service not configured
**Fix:** Check SMTP settings or use Supabase default SMTP

---

**Note:** The code now automatically uses `window.location.origin/auth/callback` which should work, but the URL must be in Supabase's allowed list.

