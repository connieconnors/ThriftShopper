# Restore Deleted Listings from Supabase Backup

## What Happened
When you deleted users from `auth.users`, it cascaded and deleted:
1. All profiles (because `profiles.id` references `auth.users(id) ON DELETE CASCADE`)
2. All listings (because `listings.seller_id` references `profiles(id) ON DELETE CASCADE`)

## How to Restore

### Option 1: Point-in-Time Recovery (Recommended)
Supabase Pro plans have point-in-time recovery. If you're on Pro:

1. Go to Supabase Dashboard → Database → Backups
2. Find a backup from BEFORE you deleted the users
3. Click "Restore" or "Point-in-Time Recovery"
4. Select the time before the deletion
5. Restore the database

### Option 2: Check Supabase Backups
1. Go to Supabase Dashboard → Database → Backups
2. Look for automatic daily backups
3. If available, restore from the most recent backup before deletion

### Option 3: Manual Restore (If you have data elsewhere)
If you have the listing data in:
- CSV exports
- Another database
- Logs/exports

You can manually re-insert them.

### Option 4: Contact Supabase Support
If you're on a paid plan, contact Supabase support - they may be able to help restore from backups even if you don't see them in the dashboard.

## Prevent This in the Future

### Option A: Change CASCADE to SET NULL (Recommended for listings)
```sql
-- Change listings to SET NULL instead of CASCADE
-- This way, if a seller is deleted, listings become "orphaned" but aren't deleted
ALTER TABLE public.listings 
DROP CONSTRAINT IF EXISTS listings_seller_id_fkey;

ALTER TABLE public.listings
ADD CONSTRAINT listings_seller_id_fkey 
FOREIGN KEY (seller_id) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;
```

### Option B: Soft Delete Instead of Hard Delete
Instead of deleting users, mark them as deleted:
- Add `deleted_at TIMESTAMPTZ` column to profiles
- Filter out deleted users in queries
- Keep all data but hide it

### Option C: Backup Before Deleting
Always export/backup data before deleting users in production.

## Immediate Action
1. **STOP** - Don't delete anything else
2. Check Supabase Dashboard → Database → Backups immediately
3. If backups exist, restore ASAP
4. If no backups, check if you have any exports or data elsewhere

