-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES - SAFE VERSION
-- Run this in Supabase SQL Editor
-- Fixes Security Advisor warnings
-- =============================================

-- =============================================
-- 1. LISTINGS TABLE
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
    
    -- Check required columns exist
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'seller_id')
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'status') THEN
      
      -- Anyone can view active listings (for browsing)
      CREATE POLICY "Listings are viewable by everyone" 
        ON public.listings FOR SELECT 
        USING (status = 'active' OR auth.uid() = seller_id);
      
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
    
    -- Check if id column exists (it should, but let's be safe)
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id') THEN
      -- Anyone can view profiles (for seller pages)
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
    
    -- Check if user_id column exists
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'favorites' AND column_name = 'user_id') THEN
      -- Users can view their own favorites
      CREATE POLICY "Users can view own favorites" 
        ON public.favorites FOR SELECT 
        USING (auth.uid() = user_id);
      
      -- Users can add favorites
      CREATE POLICY "Users can add favorites" 
        ON public.favorites FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
      
      -- Users can remove their own favorites
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
      
      -- Buyers can view their own orders
      CREATE POLICY "Buyers can view own orders" 
        ON public.orders FOR SELECT 
        USING (auth.uid() = buyer_id);
      
      -- Sellers can view orders for their listings
      CREATE POLICY "Sellers can view their orders" 
        ON public.orders FOR SELECT 
        USING (auth.uid() = seller_id);
      
      -- Buyers can create orders
      CREATE POLICY "Buyers can create orders" 
        ON public.orders FOR INSERT 
        WITH CHECK (auth.uid() = buyer_id);
      
      -- Sellers can update order status (shipped, delivered, etc.)
      CREATE POLICY "Sellers can update their orders" 
        ON public.orders FOR UPDATE 
        USING (auth.uid() = seller_id);
    END IF;
  END IF;
END $$;

-- =============================================
-- 5. REVIEWS TABLE (if it exists)
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
    
    -- Check if user_id column exists
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'user_id') THEN
      -- Anyone can view reviews
      CREATE POLICY "Reviews are viewable by everyone" 
        ON public.reviews FOR SELECT 
        USING (true);
      
      -- Users can create reviews
      CREATE POLICY "Users can create reviews" 
        ON public.reviews FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
      
      -- Users can update their own reviews
      CREATE POLICY "Users can update own reviews" 
        ON public.reviews FOR UPDATE 
        USING (auth.uid() = user_id);
      
      -- Users can delete their own reviews
      CREATE POLICY "Users can delete own reviews" 
        ON public.reviews FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;
  END IF;
END $$;

-- =============================================
-- 6. LISTING_PHOTOS TABLE (if it exists)
-- =============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'listing_photos') THEN
    ALTER TABLE public.listing_photos ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Listing photos are viewable by everyone" ON public.listing_photos;
    DROP POLICY IF EXISTS "Sellers can manage own listing photos" ON public.listing_photos;
    
    -- Check if listing_id column exists and listings table has id column
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'listing_photos' AND column_name = 'listing_id')
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'id')
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'seller_id')
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'status') THEN
      
      -- Anyone can view photos for active listings
      CREATE POLICY "Listing photos are viewable by everyone" 
        ON public.listing_photos FOR SELECT 
        USING (
          EXISTS (
            SELECT 1 FROM public.listings 
            WHERE listings.id = listing_photos.listing_id 
            AND (listings.status = 'active' OR listings.seller_id = auth.uid())
          )
        );
      
      -- Sellers can manage photos for their listings
      CREATE POLICY "Sellers can manage own listing photos" 
        ON public.listing_photos FOR ALL 
        USING (
          EXISTS (
            SELECT 1 FROM public.listings 
            WHERE listings.id = listing_photos.listing_id 
            AND listings.seller_id = auth.uid()
          )
        );
    ELSE
      -- Fallback: just allow everyone to view (simpler)
      CREATE POLICY "Listing photos are viewable by everyone" 
        ON public.listing_photos FOR SELECT 
        USING (true);
    END IF;
  END IF;
END $$;

-- =============================================
-- 7. IMAGE_LABELS TABLE (if it exists)
-- =============================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'image_labels') THEN
    ALTER TABLE public.image_labels ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Image labels are viewable by everyone" ON public.image_labels;
    DROP POLICY IF EXISTS "Service role can manage image labels" ON public.image_labels;
    
    -- Anyone can view labels (for search/discovery)
    CREATE POLICY "Image labels are viewable by everyone" 
      ON public.image_labels FOR SELECT 
      USING (true);
    
    -- Disable direct access for inserts/updates (use service role in API routes)
    -- This prevents users from manipulating labels
  END IF;
END $$;

-- =============================================
-- VERIFICATION
-- =============================================
-- Check which tables have RLS enabled
SELECT 
  n.nspname as schemaname,
  c.relname as tablename,
  c.relrowsecurity as rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relkind = 'r' -- regular tables only
  AND c.relname IN ('listings', 'profiles', 'favorites', 'orders', 'reviews', 'listing_photos', 'image_labels')
ORDER BY c.relname;

