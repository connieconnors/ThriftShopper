"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { Listing, getSellerDisplayName, getPrimaryImage, TS_BADGE_URL, hasSellerTSBadge } from "../../lib/types";
import { useAuth } from "../context/AuthContext";
import FavoriteButton from "../components/FavoriteButton";

export default function FavoritesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/favorites");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;

      try {
        // Fetch favorite listing IDs for this user
        const { data: favorites, error: favError } = await supabase
          .from("favorites")
          .select("listing_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (favError) {
          console.error("Error fetching favorites:", favError);
          setIsLoading(false);
          return;
        }

        const favoriteIds = favorites?.map(f => f.listing_id) || [];

        if (favoriteIds.length === 0) {
          setListings([]);
          setIsLoading(false);
          return;
        }

        // Fetch the actual listings for these favorites
        const { data: listingsData, error: listError } = await supabase
          .from("listings")
          .select(`
            *,
            profiles:seller_id (
              display_name,
              location_city,
              avatar_url,
              ts_badge,
              rating,
              review_count
            )
          `)
          .in("id", favoriteIds)
          .eq("status", "active");

        if (listError) {
          console.error("Error fetching listings:", listError);
        }

        // Sort listings to match the order of favorites
        const sortedListings = (listingsData as Listing[] || []).sort((a, b) => {
          return favoriteIds.indexOf(a.id) - favoriteIds.indexOf(b.id);
        });

        setListings(sortedListings);
      } catch (err) {
        console.error("Error:", err);
      }
      
      setIsLoading(false);
    };

    if (user) {
      fetchFavorites();
    }
  }, [user]);

  // Listen for favorites updates
  useEffect(() => {
    const handleFavoritesUpdate = (event: CustomEvent) => {
      const { listingId, isFavorited } = event.detail;
      if (!isFavorited) {
        // Animate out then remove
        setRemovingId(listingId);
        setTimeout(() => {
          setListings(prev => prev.filter(l => l.id !== listingId));
          setRemovingId(null);
        }, 300);
      }
    };

    window.addEventListener("favorites-updated", handleFavoritesUpdate as EventListener);
    return () => {
      window.removeEventListener("favorites-updated", handleFavoritesUpdate as EventListener);
    };
  }, []);

  if (authLoading || isLoading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full" />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-lg border-b border-white/10">
        <div className="px-4 py-4 flex items-center justify-between">
          <Link
            href="/browse"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold">
            My Favorites {listings.length > 0 && <span className="text-white/50">({listings.length})</span>}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Empty State */}
      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-20">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
          <p className="text-white/50 text-center mb-8 max-w-xs">
            Tap the heart on items you love to save them here for later.
          </p>
          <Link
            href="/browse"
            className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition-colors"
          >
            Start browsing
          </Link>
        </div>
      ) : (
        /* Favorites Grid */
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {listings.map((listing) => {
              const imageSrc = getPrimaryImage(listing);
              const sellerName = getSellerDisplayName(listing);
              const hasBadge = hasSellerTSBadge(listing);
              const isRemoving = removingId === listing.id;

              return (
                <div
                  key={listing.id}
                  className={`relative group transition-all duration-300 ${
                    isRemoving ? "opacity-0 scale-95" : "opacity-100 scale-100"
                  }`}
                >
                  <Link
                    href={`/listing/${listing.id}`}
                    className="block rounded-xl overflow-hidden bg-slate-900 border border-white/10 hover:border-white/20 transition-colors"
                  >
                    {/* Image */}
                    <div className="aspect-square relative overflow-hidden">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                          <span className="text-3xl">📦</span>
                        </div>
                      )}
                      
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* Price badge */}
                      <div className="absolute bottom-2 left-2">
                        <span className="px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-sm font-bold">
                          ${listing.price}
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-white line-clamp-2 mb-1">
                        {listing.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-white/50">
                        <span>{sellerName}</span>
                        {hasBadge && (
                          <img 
                            src={TS_BADGE_URL} 
                            alt="Verified" 
                            className="w-3.5 h-3.5"
                          />
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Favorite Button - Positioned top right */}
                  <div className="absolute top-2 right-2 z-10">
                    <FavoriteButton 
                      listingId={listing.id} 
                      variant="small"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom padding */}
      <div className="h-8" />
    </main>
  );
}
