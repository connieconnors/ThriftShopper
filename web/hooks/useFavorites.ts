'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/app/context/AuthContext';
import { Product } from '@/components/ProductCard';
import { Listing, getListingImages, getPrimaryImage, getSellerDisplayName, getSellerLocation, getSellerAvatar, hasSellerTSBadge, getSellerRating, getSellerReviewCount } from '@/lib/types';

interface UseFavoritesReturn {
  favorites: Set<string>;
  loading: boolean;
  error: string | null;
  toggleFavorite: (productId: string) => Promise<void>;
  isFavorited: (productId: string) => boolean;
  refetch: () => Promise<void>;
}

// Transform database Listing to component Product format
function transformListing(listing: Listing): Product {
  const images = getListingImages(listing);
  const primaryImage = getPrimaryImage(listing);
  
  return {
    id: listing.id,
    title: listing.title,
    price: listing.price,
    description: listing.description || '',
    seller: getSellerDisplayName(listing),
    sellerLogo: getSellerAvatar(listing) || undefined,
    imageUrl: primaryImage,
    images: images.length > 0 ? images : [primaryImage].filter(Boolean),
    tags: [...(listing.moods || []), ...(listing.styles || [])],
    location: getSellerLocation(listing) || 'Unknown',
    sellerRating: getSellerRating(listing) || 0,
    sellerReviews: getSellerReviewCount(listing),
    shipping: 'Free shipping',
    condition: listing.condition || 'Good',
    isTrustedSeller: hasSellerTSBadge(listing),
  };
}

export function useFavorites(): UseFavoritesReturn {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    // No user = no favorites (not an error)
    if (!user) {
      setFavorites(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('favorites')
        .select('listing_id')
        .eq('user_id', user.id);

      // No favorites or error = empty set (not an error state)
      if (fetchError || !data) {
        console.log('No favorites found or table not accessible');
        setFavorites(new Set());
        setLoading(false);
        return;
      }

      const favoriteIds = new Set(data.map((f) => f.listing_id) || []);
      setFavorites(favoriteIds);
    } catch (err) {
      // Don't show error for favorites - just return empty
      console.log('Favorites fetch skipped:', err);
      setFavorites(new Set());
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const toggleFavorite = useCallback(async (listingId: string) => {
    if (!user) {
      setError('Please log in to save favorites');
      return;
    }

    const isCurrentlyFavorited = favorites.has(listingId);

    // Optimistic update
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (isCurrentlyFavorited) {
        newSet.delete(listingId);
      } else {
        newSet.add(listingId);
      }
      return newSet;
    });

    try {
      if (isCurrentlyFavorited) {
        const { error: deleteError } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', listingId);

        if (deleteError) throw deleteError;
      } else {
        const { error: insertError } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, listing_id: listingId });

        if (insertError) throw insertError;
      }
    } catch (err) {
      // Revert optimistic update on error
      setFavorites((prev) => {
        const newSet = new Set(prev);
        if (isCurrentlyFavorited) {
          newSet.add(listingId);
        } else {
          newSet.delete(listingId);
        }
        return newSet;
      });
      console.error('Error toggling favorite:', err);
      setError(err instanceof Error ? err.message : 'Failed to update favorite');
    }
  }, [user, favorites]);

  const isFavorited = useCallback((listingId: string) => {
    return favorites.has(listingId);
  }, [favorites]);

  return { favorites, loading, error, toggleFavorite, isFavorited, refetch: fetchFavorites };
}

// Hook to get user's favorited products with full details
export function useFavoritedProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFavoritedProducts = useCallback(async () => {
    // No user = no favorites, just return empty array (not an error)
    if (!user) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simple query - just get listing_ids from favorites
      const { data: favData, error: favError } = await supabase
        .from('favorites')
        .select('listing_id')
        .eq('user_id', user.id);

      // No favorites yet = empty array (not an error)
      if (favError || !favData || favData.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // Fetch the actual listings
      const listingIds = favData.map(f => f.listing_id);
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .in('id', listingIds);

      if (listingsError) {
        console.error('Error fetching favorited listings:', listingsError);
        setProducts([]);
        setLoading(false);
        return;
      }

      const transformedProducts = (listingsData || []).map((listing: any) => 
        transformListing(listing as Listing)
      );

      setProducts(transformedProducts);
    } catch (err) {
      // Don't show error for favorites - just return empty
      console.log('Favorites fetch skipped:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavoritedProducts();
  }, [fetchFavoritedProducts]);

  return { products, loading, error, refetch: fetchFavoritedProducts };
}
