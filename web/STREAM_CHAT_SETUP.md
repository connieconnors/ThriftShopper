# Stream Chat Setup Guide

## Environment Variables

Stream Chat requires two environment variables:

1. **App ID (API Key)** - This is your Stream Chat App ID
   - In Stream Chat dashboard: Settings → App → App ID
   - Can be set as: `STREAM_API_KEY` or `STREAM_APP_ID`
   - Example: `abc123xyz`

2. **Secret** - This is your Stream Chat Secret Key
   - In Stream Chat dashboard: Settings → App → Secret Key
   - Can be set as: `STREAM_API_SECRET` or `STREAM_SECRET`
   - Example: `secret_abc123xyz...`

## Setup Steps

1. **Get your Stream Chat credentials:**
   - Go to https://dashboard.getstream.io/
   - Navigate to your app (or create one)
   - Go to Settings → App
   - Copy your **App ID** and **Secret Key**

2. **Add to `.env.local` (local development):**
   ```bash
   STREAM_API_KEY=your_app_id_here
   STREAM_API_SECRET=your_secret_key_here
   ```

   OR use alternative names:
   ```bash
   STREAM_APP_ID=your_app_id_here
   STREAM_SECRET=your_secret_key_here
   ```

3. **Add to Vercel (production):**
   - Go to your Vercel project → Settings → Environment Variables
   - Add both variables:
     - `STREAM_API_KEY` = your App ID
     - `STREAM_API_SECRET` = your Secret Key
   - Redeploy after adding

## Testing

1. **Check if variables are loaded:**
   - Open browser console
   - Check for any Stream Chat errors
   - The Messages modal should connect (not show "Messaging unavailable")

2. **Test messaging:**
   - Log in as two different users
   - Open Messages modal from footer
   - Messages should load (or show "No messages yet" if no conversations)

## Troubleshooting

### "Messaging unavailable" error

1. **Check environment variables:**
   - Verify both `STREAM_API_KEY` and `STREAM_API_SECRET` are set
   - Check server logs for detailed error messages
   - Restart dev server after adding env vars

2. **Check Stream Chat dashboard:**
   - Ensure your app is active
   - Verify App ID matches what you set
   - Check if there are any API limits or issues

3. **Check browser console:**
   - Look for errors in the Network tab
   - Check `/api/stream/token` response
   - Verify authentication token is being sent

### Common Issues

- **"Stream Chat is not configured"**: Missing env vars
- **"Invalid or expired session"**: Supabase auth issue
- **"Failed to generate Stream token"**: Stream Chat API error (check credentials)

## Notes

- The App ID is safe to expose client-side (it's in the API response)
- The Secret must NEVER be exposed client-side (only used server-side)
- Stream Chat has a free tier with limits
- Messages are stored in Stream Chat (not Supabase)

