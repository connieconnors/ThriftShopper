# How to View Console Logs

## Step-by-Step Guide

### 1. Open Developer Tools

**On Windows/Linux:**
- Press `F12` (or `Ctrl+Shift+I`)
- Or right-click anywhere on the page → "Inspect" or "Inspect Element"

**On Mac:**
- Press `Cmd+Option+I`

### 2. Go to Console Tab

Once Developer Tools opens, click the **"Console"** tab at the top.

### 3. Clear the Console (Optional but Recommended)

- Click the 🚫 icon (or press `Ctrl+L` / `Cmd+K`) to clear existing logs
- This makes it easier to see new logs

### 4. Perform Actions to Trigger Logs

The logs will appear when you:
- Click "Save Draft" → Look for `📤 [handleSaveDraft]`
- Click "Publish Listing" → Look for `📤 [handlePublish]`
- Load/edit an existing listing → Look for `📥 [Edit Mode]`

### 5. What to Look For

Search for these emojis in the console:
- `📤` = Data being saved
- `📥` = Data loaded from database
- `🖥️` = Data displayed in UI

### Alternative: Use Console Filter

1. In the Console tab, look for a filter/search box (usually at the top)
2. Type: `handleSaveDraft` or `handlePublish` or `Edit Mode`
3. This will filter to show only those logs

### If You Still Don't See Logs

The logs only appear when you perform specific actions. Make sure you:
1. Are on the `/sell` page
2. Have uploaded an image and the form is visible
3. Have filled in some fields
4. Click "Save Draft" or "Publish Listing"

