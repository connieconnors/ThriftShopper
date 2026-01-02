# Data Flow Verification Guide

This guide helps verify that data is being saved and loaded correctly in the seller listing form.

## Test Procedure

### 1. Create a Test Listing

1. Go to `/sell` and upload an image
2. Fill in the form with **known test values**:
   - **Title**: "Test Listing Verification"
   - **Description**: "This is a test description for verification"
   - **Story**: "We found this during a kitchen reno and loved the warm glow."
   - **Price**: "99.99"
   - **Category**: "Home Decor"
   - **Condition**: "Excellent"
   - **Keywords**: Type exactly: `whimsical, gift, vintage, cozy, mid-century`
   - **Specifications**: "10x10x5 inches, ceramic, hand-painted"

3. Click **"Save Draft"** first
4. Check browser console for `📤 [handleSaveDraft]` log
5. Note the `listingId` from the console

### 2. Query the Database (After Save Draft)

Run this SQL in Supabase SQL Editor (replace `YOUR_LISTING_ID` with the actual ID):

```sql
SELECT 
  id,
  title,
  description,
  story_text,
  price,
  category,
  condition,
  specifications,
  styles,
  moods,
  intents,
  status,
  created_at,
  updated_at
FROM listings
WHERE id = 'YOUR_LISTING_ID';
```

**Expected values after Save Draft:**
- `story_text`: "We found this during a kitchen reno and loved the warm glow."
- `styles`: Should contain `["vintage", "mid-century"]` (or similar)
- `moods`: Should contain `["whimsical", "cozy"]`
- `intents`: Should contain `["gift"]`
- `status`: `"draft"`

### 3. Reload in Edit Mode

1. Go to `/sell?edit=YOUR_LISTING_ID`
2. Check browser console for:
   - `📥 [Edit Mode] Loaded from database:` - Shows what was loaded
   - `🖥️ [Edit Mode] Displaying in UI:` - Shows what's displayed
3. Verify all fields match what you entered

### 4. Publish the Listing

1. Click **"Publish Listing"**
2. Check browser console for `📤 [handlePublish]` log
3. Note any differences from Save Draft log

### 5. Query Again (After Publish)

Run the same SQL query:

```sql
SELECT 
  id,
  title,
  description,
  story_text,
  price,
  category,
  condition,
  specifications,
  styles,
  moods,
  intents,
  status,
  created_at,
  updated_at
FROM listings
WHERE id = 'YOUR_LISTING_ID';
```

**Expected values after Publish:**
- All values should be the same as after Save Draft
- `status`: Should change from `"draft"` to `"active"`

## What to Check

### ✅ Fields to Verify

1. **story_text** - Should match exactly what you typed
2. **styles[]** - Should contain style-related keywords (vintage, mid-century, etc.)
3. **moods[]** - Should contain mood-related keywords (whimsical, cozy, etc.)
4. **intents[]** - Should contain intent-related keywords (gift, etc.)
5. **title** - Should match exactly
6. **description** - Should match exactly
7. **price** - Should be numeric (99.99)
8. **category** - Should match exactly
9. **condition** - Should match exactly

### 🔍 Keyword Categorization Logic

The `categorizeAttributes()` function categorizes keywords based on these lists:

**Styles**: vintage, modern, rustic, mid-century, antique, contemporary, traditional, industrial, bohemian, minimalist, ornate, sleek, etc.

**Moods**: whimsical, elegant, playful, cozy, luxurious, quirky, charming, romantic, bold, delicate, etc.

**Intents**: gift, decor, collection, display, functional, serving, storage, wedding, housewarming, etc.

**Default**: If a keyword doesn't match any category, it defaults to `styles[]`

### 🐛 Common Issues to Look For

1. **story_text is NULL** - Check if `story || null` is working correctly
2. **Keywords not categorized** - Check if keywords match the categorization lists
3. **Arrays are empty** - Check if `parseArrayField()` is working correctly
4. **Case sensitivity** - Keywords are converted to lowercase before categorization
5. **Duplicates** - `allKeywords` uses `Set` to remove duplicates, but categorization might create duplicates if a keyword matches multiple categories

## Console Log Format

### handleSaveDraft Log:
```javascript
📤 [handleSaveDraft] Sending to database: {
  listingId: "...",
  updateData: {
    title: "...",
    description: "...",
    story_text: "...",
    styles: [...],
    moods: [...],
    intents: [...],
    // etc.
  },
  inputKeywords: "whimsical, gift, vintage",
  sellerKeywords: ["whimsical", "gift", "vintage"],
  aiAttributes: [...],
  allKeywords: [...]
}
```

### handlePublish Log:
```javascript
📤 [handlePublish] Sending to database: {
  // Same format as handleSaveDraft
}
```

### Edit Mode Load Log:
```javascript
📥 [Edit Mode] Loaded from database: {
  listingId: "...",
  story_text: "...",
  styles: [...],
  moods: [...],
  // etc.
}

🖥️ [Edit Mode] Displaying in UI: {
  story: "...",
  keywordsDisplay: "whimsical, gift, vintage",
  parsedMoods: [...],
  parsedStyles: [...],
  parsedIntents: [...]
}
```

## Reporting Mismatches

If you find mismatches, note:
1. **Field name** (e.g., `story_text`, `styles[]`)
2. **Expected value** (what you entered)
3. **Actual value in database** (from SQL query)
4. **Value shown in UI** (from edit mode)
5. **Which function** (handleSaveDraft vs handlePublish)
6. **Console log output** (copy the relevant log entries)


