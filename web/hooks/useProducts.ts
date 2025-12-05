'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Product } from '@/components/ProductCard';
import { Listing, getListingImages, getPrimaryImage, getSellerDisplayName, getSellerLocation, getSellerAvatar, hasSellerTSBadge, getSellerRating, getSellerReviewCount } from '@/lib/types';

interface UseProductsOptions {
  mood?: string;
  category?: string;
  searchQuery?: string;
  limit?: number;
}

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Helper to safely convert to array and clean JSON artifacts
function toArray(value: any): string[] {
  if (!value) return [];
  
  let arr: string[] = [];
  if (Array.isArray(value)) {
    arr = value;
  } else if (typeof value === 'string') {
    arr = [value]; // Single string becomes array with one item
  } else {
    return [];
  }
  
  // Clean each item - remove quotes, brackets, and JSON syntax
  return arr.map((item: any) => {
    let cleaned = String(item).trim();
    // Remove leading/trailing quotes and brackets
    cleaned = cleaned.replace(/^[\["\s]+|[\]"\s]+$/g, '');
    // Remove any remaining quotes or brackets
    cleaned = cleaned.replace(/["\[\]]/g, '');
    return cleaned;
  }).filter((item: string) => item.length > 0); // Remove empty strings
}

// Transform database Listing to component Product format
function transformListing(listing: Listing): Product {
  const images = getListingImages(listing);
  const primaryImage = getPrimaryImage(listing);
  
  // Debug: Log all image fields from the listing
  console.log('Image fields:', {
    original_image_url: listing.original_image_url,
    clean_image_url: listing.clean_image_url,
    staged_image_url: listing.staged_image_url,
    photo_url: listing.photo_url,
    photo_url_2: listing.photo_url_2,
    computed_images: images,
    computed_primary: primaryImage,
  });
  
  // Safely combine moods and styles into tags array
  const moods = toArray(listing.moods);
  const styles = toArray(listing.styles);
  const tags = [...moods, ...styles].filter(Boolean);
  
  // Build images array - try all possible image fields
  const allImages = [
    listing.original_image_url,
    listing.clean_image_url,
    listing.staged_image_url,
    listing.photo_url,
    listing.photo_url_2,
  ].filter(Boolean) as string[];
  
  const finalImages = allImages.length > 0 ? allImages : (primaryImage ? [primaryImage] : []);
  
  return {
    id: listing.id,
    title: listing.title || 'Untitled',
    price: listing.price ?? 0,
    description: listing.description || '',
    seller: getSellerDisplayName(listing),
    sellerLogo: getSellerAvatar(listing) || undefined,
    imageUrl: finalImages[0] || '',
    images: finalImages,
    tags: tags,
    location: getSellerLocation(listing) || 'Unknown',
    sellerRating: getSellerRating(listing) || 0,
    sellerReviews: getSellerReviewCount(listing),
    shipping: 'Free shipping',
    condition: listing.condition || 'Good',
    isTrustedSeller: hasSellerTSBadge(listing),
  };
}

export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch listings from database - only active listings with images
      let query = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // Apply text search filter (works on text columns)
      if (options.searchQuery) {
        const searchTerm = options.searchQuery.toLowerCase();
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`);
      }

      // Apply category filter
      if (options.category) {
        query = query.ilike('category', `%${options.category}%`);
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      // Note: Mood filtering is done client-side after fetch
      // because array contains queries can be complex

      const { data, error: fetchError } = await query;

      console.log('Supabase response:', { data, fetchError, count: data?.length || 0 });

      if (fetchError) {
        console.error('Supabase error details:', fetchError.message, fetchError.code, fetchError.details, fetchError.hint);
        throw new Error(fetchError.message || 'Database error');
      }

      if (!data || data.length === 0) {
        console.log('No listings found in database - will use mock data');
        setProducts([]);
        return;
      }

      // Transform all listings
      let transformedProducts = data.map((listing: any) => transformListing(listing as Listing));
      
      // Client-side mood filtering (if mood filter is active)
      if (options.mood) {
        const moodLower = options.mood.toLowerCase();
        transformedProducts = transformedProducts.filter(product => 
          product.tags.some(tag => tag.toLowerCase().includes(moodLower))
        );
      }
      
      console.log('Products loaded:', transformedProducts.length);
      setProducts(transformedProducts);
    } catch (err: any) {
      console.error('Error fetching products:', err?.message || err);
      setError(err?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, [options.mood, options.category, options.searchQuery, options.limit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}

// Hook to fetch a single product by ID
export function useProduct(productId: string | null) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      return;
    }

    async function fetchProduct() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('listings')
          .select(`
            *,
            profiles (
              display_name,
              location_city,
              avatar_url,
              ts_badge,
              rating,
              review_count
            )
          `)
          .eq('id', productId)
          .single();

        if (fetchError) throw fetchError;

        setProduct(transformListing(data as Listing));
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch product');
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [productId]);

  return { product, loading, error };
}
