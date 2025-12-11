# EMERGENCY RECOVERY - Step by Step

## WHERE TO FIND BACKUPS IN SUPABASE

### Exact Navigation Path:
1. **Go to**: https://supabase.com/dashboard
2. **Click your project name** (top left or in project list)
3. **Left sidebar** → Click **"Database"** (icon looks like a cylinder/database)
4. **In the Database section**, look for tabs at the top:
   - **"Tables"** (default)
   - **"Backups"** ← CLICK THIS
   - **"Connection Pooling"**
   - **"Extensions"**
   - **"Replication"**

### If "Backups" tab doesn't exist:
- You might be on the **Free plan** (no automatic backups)
- Go to: **Settings** (gear icon) → **Billing** → Check your plan
- If Free: No backups available (need to upgrade or use manual exports)

### Alternative: Check for Point-in-Time Recovery
1. **Database** section
2. Look for **"Point-in-Time Recovery"** or **"PITR"** link/button
3. This is usually only on **Pro plan** or higher

## IMMEDIATE ACTIONS

### 1. Check Your Plan
- **Settings** → **Billing** → What plan are you on?
- **Free Plan**: No automatic backups (data is likely gone)
- **Pro Plan**: Should have backups - if you don't see them, contact support immediately

### 2. Contact Supabase Support (IF ON PRO PLAN)
- Go to: https://supabase.com/support
- Or: Dashboard → **Help** → **Support**
- Tell them: "I accidentally deleted users which cascaded and deleted all my listings. I need to restore from backup immediately."
- They can restore even if you don't see backups in the UI

### 3. Check for Manual Exports
- Do you have any CSV files?
- Any database exports?
- Any code that seeded the data?
- Check your computer for any backup files

### 4. Check Image Storage
- Go to: **Storage** (left sidebar)
- Check if images are still there
- If images exist, you might be able to partially reconstruct listings

## IF NO BACKUPS EXIST

Unfortunately, if you're on Free plan and have no backups:
- **Data is likely permanently lost**
- You'll need to recreate listings manually
- Consider upgrading to Pro plan for future backups

## PREVENT FUTURE LOSS

1. **Upgrade to Pro plan** for automatic backups
2. **Export data regularly** (CSV exports)
3. **Change CASCADE to SET NULL** (see RESTORE_BACKUP.md)
4. **Use soft deletes** instead of hard deletes

