# Content Moderation - Vision API Integration

## Task: Implement Vision API for Inappropriate Content Detection

### Status: ⏳ Pending

### Description:
Use OpenAI Vision API to automatically check uploaded listing images for inappropriate content before they go live on the marketplace.

### User Notes:
- User has existing code for this feature
- Should be integrated into the seller upload flow
- Prevents inappropriate items from being listed

---

## Implementation Plan

### 1. **Integration Point**
- **Location:** `web/lib/seller-upload-service.ts`
- **When:** After image upload, before listing creation
- **Action:** Check image with Vision API, reject if inappropriate

### 2. **Vision API Check**
- Use OpenAI Vision API (GPT-4 Vision or similar)
- Check for:
  - Prohibited items (based on allowed/prohibited items policy)
  - Inappropriate content (nudity, violence, etc.)
  - Policy violations

### 3. **User Experience**
- If content is flagged:
  - Show clear error message to seller
  - Explain why item was rejected
  - Reference the "Allowed & Prohibited Items" policy
  - Allow seller to upload different image

### 4. **Error Handling**
- Handle API failures gracefully
- Don't block upload if Vision API is down
- Log flagged items for review
- Consider manual review queue for edge cases

---

## Technical Details

### API Endpoint
- OpenAI Vision API: `https://api.openai.com/v1/chat/completions`
- Model: `gpt-4-vision-preview` or `gpt-4o` (with vision)

### Request Format
```typescript
{
  model: "gpt-4-vision-preview",
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Check if this image contains prohibited items or inappropriate content for a vintage/thrift marketplace. Reference our allowed/prohibited items policy."
        },
        {
          type: "image_url",
          image_url: {
            url: imageUrl
          }
        }
      ]
    }
  ],
  max_tokens: 200
}
```

### Response Handling
- Parse response for approval/rejection
- Extract reason if rejected
- Store moderation result in database (optional)

---

## Database Schema (Optional)

Consider adding to `listings` table:
```sql
ALTER TABLE listings ADD COLUMN moderation_status TEXT DEFAULT 'pending';
ALTER TABLE listings ADD COLUMN moderation_reason TEXT;
ALTER TABLE listings ADD COLUMN moderated_at TIMESTAMP;
```

Status values:
- `pending` - Not yet checked
- `approved` - Passed moderation
- `rejected` - Failed moderation
- `manual_review` - Needs human review

---

## Implementation Steps

1. ✅ Review existing Vision API code (user has this)
2. ⏳ Integrate into `seller-upload-service.ts`
3. ⏳ Add moderation check after image upload
4. ⏳ Create error messages for rejected content
5. ⏳ Add logging for moderation results
6. ⏳ Test with various image types
7. ⏳ Add manual review queue (optional, future)

---

## Related Files
- `web/lib/seller-upload-service.ts` - Upload service
- `web/app/api/seller/upload/route.ts` - Upload API route
- `web/app/sell/page.tsx` - Upload form UI
- `web/app/settings/page.tsx` - Legal section with "Allowed & Prohibited Items" link

---

## Notes
- User has existing code for Vision API content moderation
- Should reference the "Allowed & Prohibited Items" policy page
- Consider rate limiting to manage API costs
- May want to cache results for duplicate images

---

**Created:** December 2024  
**Priority:** Medium (important for marketplace quality, but not blocking launch)

