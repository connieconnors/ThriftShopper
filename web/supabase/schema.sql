-- =============================================
-- ThriftShopper Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. PROFILES TABLE (extends Supabase auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  is_seller BOOLEAN DEFAULT FALSE,
  is_trusted_seller BOOLEAN DEFAULT FALSE,
  bio TEXT,
  location_city TEXT,
  location_state TEXT,
  location_zip TEXT,
  phone TEXT,
  shipping_speed TEXT DEFAULT 'Ships within 3-5 days',
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. PRODUCTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  condition TEXT DEFAULT 'Good',
  category TEXT,
  mood TEXT,
  tags TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  image_url TEXT, -- Primary image (first in array)
  location TEXT,
  shipping TEXT DEFAULT 'Free shipping',
  is_available BOOLEAN DEFAULT TRUE,
  favorited_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. FAVORITES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- =============================================
-- 4. FOLLOWS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, seller_id)
);

-- =============================================
-- 5. ORDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, paid, shipped, delivered, cancelled
  shipping_address JSONB,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES for better query performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON public.products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_mood ON public.products(mood);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON public.favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_seller_id ON public.follows(seller_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- PROFILES: Anyone can read, users can update their own
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- PRODUCTS: Anyone can read available products, sellers can manage their own
CREATE POLICY "Products are viewable by everyone" 
  ON public.products FOR SELECT USING (true);

CREATE POLICY "Sellers can insert products" 
  ON public.products FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own products" 
  ON public.products FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own products" 
  ON public.products FOR DELETE USING (auth.uid() = seller_id);

-- FAVORITES: Users can manage their own favorites
CREATE POLICY "Users can view own favorites" 
  ON public.favorites FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites" 
  ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites" 
  ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- FOLLOWS: Users can manage their own follows
CREATE POLICY "Users can view own follows" 
  ON public.follows FOR SELECT USING (auth.uid() = follower_id);

CREATE POLICY "Sellers can see their followers" 
  ON public.follows FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Users can follow sellers" 
  ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" 
  ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- ORDERS: Buyers and sellers can view their orders
CREATE POLICY "Users can view own orders as buyer" 
  ON public.orders FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Users can view own orders as seller" 
  ON public.orders FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Users can create orders" 
  ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update favorited_count when favorites change
CREATE OR REPLACE FUNCTION public.update_favorited_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.products 
    SET favorited_count = favorited_count + 1 
    WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.products 
    SET favorited_count = favorited_count - 1 
    WHERE id = OLD.product_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_favorite_change ON public.favorites;
CREATE TRIGGER on_favorite_change
  AFTER INSERT OR DELETE ON public.favorites
  FOR EACH ROW EXECUTE FUNCTION public.update_favorited_count();

-- Update followers_count when follows change
CREATE OR REPLACE FUNCTION public.update_followers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles 
    SET followers_count = followers_count + 1 
    WHERE id = NEW.seller_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles 
    SET followers_count = followers_count - 1 
    WHERE id = OLD.seller_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_follow_change ON public.follows;
CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.update_followers_count();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================

-- Insert sample products (run after creating a user)
-- You can uncomment and modify this after you have a user ID

/*
INSERT INTO public.products (seller_id, title, description, price, condition, category, mood, tags, images, image_url, location, shipping)
VALUES 
  ('YOUR_USER_ID_HERE', 'Vintage Floral Tea Set', 'A whimsical hand-painted porcelain tea set from the 1960s.', 45.00, 'Excellent', 'Kitchen', 'whimsical', ARRAY['whimsical', 'vintage', 'elegant'], ARRAY['https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&h=1200&fit=crop'], 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&h=1200&fit=crop', 'Brooklyn, NY', 'Free shipping'),
  ('YOUR_USER_ID_HERE', 'Mid-Century Modern Lamp', 'Stunning brass table lamp from the 1950s.', 125.00, 'Good', 'Home Decor', 'retro', ARRAY['retro', 'elegant', 'vintage'], ARRAY['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&h=1200&fit=crop'], 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&h=1200&fit=crop', 'Austin, TX', 'Calculated at checkout'),
  ('YOUR_USER_ID_HERE', 'Handcrafted Wooden Bowl', 'Beautiful rustic wooden bowl for fruit or decoration.', 38.00, 'New', 'Home Decor', 'rustic', ARRAY['rustic', 'quirky'], ARRAY['https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800&h=1200&fit=crop'], 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800&h=1200&fit=crop', 'Portland, OR', 'Free shipping'),
  ('YOUR_USER_ID_HERE', 'Retro Polaroid Camera', 'Classic Polaroid OneStep from the 1980s.', 89.00, 'Very Good', 'Electronics', 'retro', ARRAY['retro', 'quirky', 'vintage'], ARRAY['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=1200&fit=crop'], 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=1200&fit=crop', 'Seattle, WA', 'Free shipping'),
  ('YOUR_USER_ID_HERE', 'Art Deco Mirror', '1920s Art Deco wall mirror with beveled glass.', 175.00, 'Good', 'Home Decor', 'elegant', ARRAY['elegant', 'vintage', 'whimsical'], ARRAY['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=1200&fit=crop'], 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=1200&fit=crop', 'Chicago, IL', 'Local pickup only');
*/

-- =============================================
-- DONE! Your ThriftShopper schema is ready.
-- =============================================

