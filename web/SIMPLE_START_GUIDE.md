# ThriftShopper - Simple Start Guide for Cursor

## 🎯 Quick Setup (5 minutes)

### Step 1: Copy These 3 Files to Your Next.js Project Root

1. **NEXTJS_MIGRATION_GUIDE.md** (in this Figma Make project)
2. **REMAINING_COMPONENTS.md** (in this Figma Make project)  
3. **CLAUDE_BACKEND_SPEC.md** (in this Figma Make project)

**How to get them:**
- In Figma Make file explorer (left sidebar), you'll see these 3 .md files
- Click each one, copy all content, save to your computer
- Then move them to your Next.js project root folder

---

### Step 2: Copy This Message to Cursor

Open Cursor, press **Cmd+L** (or Ctrl+L), then paste:

```
@NEXTJS_MIGRATION_GUIDE.md @REMAINING_COMPONENTS.md @CLAUDE_BACKEND_SPEC.md 

Hey Claude! I need you to migrate my entire ThriftShopper app from Figma Make to Next.js. I have 3 complete guide files that contain ALL the code and instructions.

PHASE 1: Setup & Build (Do this now)
Please:
1. Install dependencies: npm install motion lucide-react @supabase/supabase-js sonner
2. Create ALL component files in /components from REMAINING_COMPONENTS.md
3. Create /app/page.tsx from NEXTJS_MIGRATION_GUIDE.md
4. Create /lib/supabase.ts from NEXTJS_MIGRATION_GUIDE.md
5. Update /app/globals.css if needed

CRITICAL RULES:
- DO NOT change colors (#000080, #efbf04, #191970, #cfb53b)
- DO NOT change fonts (Merriweather)
- DO NOT modify the TikTok-style vertical scrolling
- Add 'use client'; to the top of every component file

Start with PHASE 1. Show me each file as you create it. Ready? Let's go!
```

---

### Step 3: Let Claude Work

Claude will:
1. ✅ Install packages
2. ✅ Create all 10 components
3. ✅ Create the main page
4. ✅ Set up Supabase client

This takes about 2-3 minutes.

---

### Step 4: Test It

```bash
npm run dev
```

Visit http://localhost:3000

You should see ThriftShopper's TikTok-style discovery feed! 🎉

---

### Step 5: Add Supabase (Phase 2)

Once Phase 1 works, tell Claude:

```
Great! Phase 1 works. Now let's add Supabase backend.

Please:
1. Show me the Supabase database schema (SQL)
2. Help me set up .env.local
3. Wire up product fetching from Supabase
4. Add favorites to database

Start with the SQL schema.
```

---

## 🚨 If You Get Stuck

**Can't find the files?**
- Look in the Figma Make file explorer (left sidebar)
- Or ask me to re-post the content here

**Claude can't see the files?**
- Make sure files are in the Next.js project root
- Type @ and you should see them in the dropdown
- If not, enable Codebase Indexing in Cursor settings

**Need the globals.css?**
- It's in Figma Make at /styles/globals.css
- Copy it to /app/globals.css in Next.js

---

## ✅ Quick Checklist

- [ ] Copy 3 .md files from Figma Make to Next.js root
- [ ] Open Cursor in Next.js project
- [ ] Paste the message with @mentions
- [ ] Watch Claude create everything
- [ ] Run npm run dev
- [ ] See ThriftShopper working!

**That's it! You're done.** 🚀
