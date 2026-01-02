# How to Check What's Saved in Supabase

## Step 1: Find Your Listing ID

1. Go to `/sell` page
2. Upload an image and fill in the form
3. After you click "Save Draft" or "Publish", look at the URL in your browser
4. You'll see something like: `http://localhost:3000/sell?edit=abc123-def456-ghi789`
5. Copy the ID part: `abc123-def456-ghi789` (the part after `?edit=`)

OR

1. Go to your seller dashboard at `/seller`
2. You should see your listings
3. Right-click on a listing and "Inspect Element" 
4. Look for the listing ID in the HTML, or check the URL if you click to edit it

## Step 2: Run This SQL in Supabase

1. Go to your Supabase dashboard
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Paste this SQL (replace `YOUR_LISTING_ID_HERE` with the ID you copied):

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
WHERE id = 'YOUR_LISTING_ID_HERE';
```

5. Click "Run" (or press F5)

## Step 3: What You'll See

You'll see a table with one row showing:
- All the text fields (title, description, story_text, etc.)
- Arrays for styles, moods, intents
- Status (draft or active)

## Quick Test - Find Any Recent Listing

If you don't have the ID, use this to see your 5 most recent listings:

```sql
SELECT 
  id,
  title,
  story_text,
  styles,
  moods,
  intents,
  status,
  created_at
FROM listings
ORDER BY created_at DESC
LIMIT 5;
```

This will show you the IDs so you can then use the first query to see all details.


