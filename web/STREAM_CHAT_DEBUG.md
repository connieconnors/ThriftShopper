# Stream Chat Debugging Guide

## Current Error
"Both secret and user tokens are not set. Either client.connectUser wasn't called or client.disconnect was called"

This error occurs when trying to query channels before the Stream Chat client is fully connected.

## Debugging Steps

1. **Check Browser Console:**
   - Open DevTools → Console
   - Look for "Stream Chat connected successfully" message
   - Check for any connection errors

2. **Check Network Tab:**
   - Open DevTools → Network
   - Look for `/api/stream/token` request
   - Verify it returns 200 status
   - Check the response - should have `token`, `userId`, and `apiKey`

3. **Check Environment Variables:**
   - Verify `NEXT_PUBLIC_STREAM_API_KEY` or `NEXT_PUBLIC_STREAM_APP_ID` is set
   - Verify `STREAM_API_SECRET` is set (NOT with NEXT_PUBLIC prefix)
   - Restart dev server after adding env vars

4. **Check Server Logs:**
   - Look for "Stream Chat connected successfully" message
   - Check for any errors in the terminal

## Common Issues

### Issue 1: API Key Mismatch
- **Symptom:** Client connects but can't query channels
- **Cause:** Server and client using different API keys
- **Fix:** Ensure `NEXT_PUBLIC_STREAM_API_KEY` matches the App ID used in token generation

### Issue 2: Connection Not Complete
- **Symptom:** Error when opening Messages modal immediately
- **Cause:** `connectUser()` hasn't finished when modal opens
- **Fix:** Code now waits for `client.userID` to be set before querying

### Issue 3: Token Generation Fails
- **Symptom:** "Stream Chat is not configured" error
- **Cause:** Missing or incorrect environment variables
- **Fix:** Check server logs for which variables are missing

## Testing

1. Open Messages modal
2. Check browser console for connection status
3. If error persists, check:
   - Is `client.userID` set? (should match your user ID)
   - Is the token request successful?
   - Are the API keys matching?

