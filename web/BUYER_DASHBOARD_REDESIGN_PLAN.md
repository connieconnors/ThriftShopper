# Buyer Dashboard Redesign Plan

## Issues with Current Implementation
1. ❌ Not mobile-first
2. ❌ Wrong brand gold color (used #cfb53b, should be #EFBF05)
3. ❌ Missing key features from requirements
4. ❌ Design doesn't match expectations

## Correct Brand Colors
- **Primary Gold**: #EFBF05
- **Tint Background**: #FFF8E6
- **Shadow**: rgba(239,191,5,0.25)
- **Navy Blue**: #191970 (keep for primary actions)

## Required Features (from notes)

### 1. Saved Items (Favorites) ✅
- Grid of bookmarked items
- Newest first
- Click-through to listing
- Remove inline

### 2. Saved Searches / Saved Moods ❌ MISSING
- Collections like "Mid-century lamp", "Gift ideas for mom"
- Auto-save last 10 search prompts
- Display saved moods from mood wheel

### 3. Recently Viewed Items ❌ MISSING
- "You were looking at..." recap
- Need to track views (localStorage or database)

### 4. Recommended Items ❌ MISSING
- Based on mood wheel selections
- Semantic search patterns
- Item categories
- Show items with overlapping tags

### 5. Collections / Your Vibes ❌ MISSING
- Most common moods
- Top categories
- "You seem to love..." insights
- Tag aggregation

### 6. Messages / Offers ⚠️ PARTIAL
- Link exists but not full implementation

### 7. Account / Profile Module ⚠️ PARTIAL
- Name ✅
- Email ✅
- Edit profile ❌
- Shipping address ❌
- Payment methods ❌
- Logout ✅

## Mobile-First Design Approach
- Stack sections vertically
- Full-width cards on mobile
- Touch-friendly buttons (min 44px)
- Horizontal scroll for item grids
- Bottom navigation for mobile
- Collapsible sections

## Implementation Steps
1. Fix brand colors
2. Make mobile-first layout
3. Add saved searches/moods tracking
4. Add recently viewed (localStorage)
5. Add recommendations logic
6. Add vibes/collections summary
7. Enhance profile module
8. Test on mobile

