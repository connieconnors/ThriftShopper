-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES - MINIMAL VERSION
-- Only enables RLS on tables that actually exist
-- Run this in Supabase SQL Editor
-- =============================================

-- First, let's see what tables actually exist
-- Run this separately to check:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- =============================================
-- 1. LISTINGS TABLE (most important)
-- =============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'listings') THEN
    ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Listings are viewable by everyone" ON public.listings;
    DROP POLICY IF EXISTS "Sellers can create listings" ON public.listings;
    DROP POLICY IF EXISTS "Sellers can update own listings" ON public.listings;
    DROP POLICY IF EXISTS "Sellers can delete own listings" ON public.listings;
    
    -- Check what columns actually exist
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'seller_id') THEN
      -- Anyone can view active listings (for browsing)
      -- If status column exists, use it; otherwise allow all
      IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'status') THEN
        CREATE POLICY "Listings are viewable by everyone" 
          ON public.listings FOR SELECT 
          USING (status = 'active' OR auth.uid() = seller_id);
      ELSE
        CREATE POLICY "Listings are viewable by everyone" 
          ON public.listings FOR SELECT 
          USING (true);
      END IF;
      
      -- Sellers can create their own listings
      CREATE POLICY "Sellers can create listings" 
        ON public.listings FOR INSERT 
        WITH CHECK (auth.uid() = seller_id);
      
      -- Sellers can update their own listings
      CREATE POLICY "Sellers can update own listings" 
        ON public.listings FOR UPDATE 
        USING (auth.uid() = seller_id);
      
      -- Sellers can delete their own listings
      CREATE POLICY "Sellers can delete own listings" 
        ON public.listings FOR DELETE 
        USING (auth.uid() = seller_id);
    END IF;
  END IF;
END $$;

-- =============================================
-- 2. PROFILES TABLE
-- =============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
    
    -- Check if id column exists (it should be the primary key)
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id') THEN
      -- Anyone can view profiles
      CREATE POLICY "Profiles are viewable by everyone" 
        ON public.profiles FOR SELECT 
        USING (true);
      
      -- Users can update their own profile
      CREATE POLICY "Users can update own profile" 
        ON public.profiles FOR UPDATE 
        USING (auth.uid() = id);
      
      -- Users can insert their own profile
      CREATE POLICY "Users can insert own profile" 
        ON public.profiles FOR INSERT 
        WITH CHECK (auth.uid() = id);
    END IF;
  END IF;
END $$;

-- =============================================
-- 3. FAVORITES TABLE
-- =============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favorites') THEN
    ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
    DROP POLICY IF EXISTS "Users can add favorites" ON public.favorites;
    DROP POLICY IF EXISTS "Users can remove own favorites" ON public.favorites;
    
    -- Check if user_id column exists (might be named differently)
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'favorites' AND column_name = 'user_id') THEN
      CREATE POLICY "Users can view own favorites" 
        ON public.favorites FOR SELECT 
        USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can add favorites" 
        ON public.favorites FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Users can remove own favorites" 
        ON public.favorites FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;
  END IF;
END $$;

-- =============================================
-- 4. ORDERS TABLE
-- =============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Buyers can view own orders" ON public.orders;
    DROP POLICY IF EXISTS "Sellers can view their orders" ON public.orders;
    DROP POLICY IF EXISTS "Buyers can create orders" ON public.orders;
    DROP POLICY IF EXISTS "Sellers can update their orders" ON public.orders;
    
    -- Check required columns exist
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'buyer_id')
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'seller_id') THEN
      
      CREATE POLICY "Buyers can view own orders" 
        ON public.orders FOR SELECT 
        USING (auth.uid() = buyer_id);
      
      CREATE POLICY "Sellers can view their orders" 
        ON public.orders FOR SELECT 
        USING (auth.uid() = seller_id);
      
      CREATE POLICY "Buyers can create orders" 
        ON public.orders FOR INSERT 
        WITH CHECK (auth.uid() = buyer_id);
      
      CREATE POLICY "Sellers can update their orders" 
        ON public.orders FOR UPDATE 
        USING (auth.uid() = seller_id);
    END IF;
  END IF;
END $$;

-- =============================================
-- 5. REVIEWS TABLE (only if it exists)
-- =============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
    ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
    DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
    DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
    DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;
    
    -- Simple: allow everyone to view, users manage their own
    CREATE POLICY "Reviews are viewable by everyone" 
      ON public.reviews FOR SELECT 
      USING (true);
    
    -- Only create user-specific policies if user_id column exists
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'user_id') THEN
      CREATE POLICY "Users can create reviews" 
        ON public.reviews FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Users can update own reviews" 
        ON public.reviews FOR UPDATE 
        USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can delete own reviews" 
        ON public.reviews FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;
  END IF;
END $$;

-- =============================================
-- 6. LISTING_PHOTOS TABLE (only if it exists - skip if problematic)
-- =============================================
-- SKIPPING for now - this table might not exist or have different structure
-- We'll enable RLS but with a simple policy
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'listing_photos') THEN
    ALTER TABLE public.listing_photos ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Listing photos are viewable by everyone" ON public.listing_photos;
    DROP POLICY IF EXISTS "Sellers can manage own listing photos" ON public.listing_photos;
    
    -- Simple policy: everyone can view (we'll refine later if needed)
    CREATE POLICY "Listing photos are viewable by everyone" 
      ON public.listing_photos FOR SELECT 
      USING (true);
  END IF;
END $$;

-- =============================================
-- 7. IMAGE_LABELS TABLE (only if it exists)
-- =============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'image_labels') THEN
    ALTER TABLE public.image_labels ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Image labels are viewable by everyone" ON public.image_labels;
    
    -- Simple: everyone can view
    CREATE POLICY "Image labels are viewable by everyone" 
      ON public.image_labels FOR SELECT 
      USING (true);
  END IF;
END $$;

-- =============================================
-- VERIFICATION - Check which tables have RLS enabled
-- =============================================
SELECT 
  n.nspname as schemaname,
  c.relname as tablename,
  CASE WHEN c.relrowsecurity THEN 'YES' ELSE 'NO' END as rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relkind = 'r'
  AND c.relname IN ('listings', 'profiles', 'favorites', 'orders', 'reviews', 'listing_photos', 'image_labels')
ORDER BY c.relname;

