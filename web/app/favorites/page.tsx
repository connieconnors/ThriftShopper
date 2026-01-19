"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { Listing, getSellerDisplayName, getPrimaryImage, TS_BADGE_URL, hasSellerTSBadge } from "../../lib/types";
import { useAuth } from "../context/AuthContext";
import FavoriteButton from "../components/FavoriteButton";
import { Package, Settings, ChevronRight } from "lucide-react";
import { GlintIcon } from "../../components/GlintIcon";
import { TSLogo } from "@/components/TSLogo";

interface Order {
  id: string;
  listing_id: string;
  amount: number;
  status: string;
  created_at: string;
  listing?: {
    title: string;
    clean_image_url: string | null;
    original_image_url: string | null;
  };
  seller?: {
    display_name: string;
  };
}

type TabType = "favorites" | "orders";

export default function BuyerHomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("favorites");
  
  // Favorites state
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  
  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/favorites");
    }
  }, [user, authLoading, router]);

  // Fetch favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;

      try {
        const { data: favorites, error: favError } = await supabase
          .from("favorites")
          .select("listing_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (favError) {
          console.error("Error fetching favorites:", favError);
          setIsLoadingFavorites(false);
          return;
        }

        const favoriteIds = favorites?.map(f => f.listing_id) || [];

        if (favoriteIds.length === 0) {
          setListings([]);
          setIsLoadingFavorites(false);
          return;
        }

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

        const sortedListings = (listingsData as Listing[] || []).sort((a, b) => {
          return favoriteIds.indexOf(a.id) - favoriteIds.indexOf(b.id);
        });

        setListings(sortedListings);
      } catch (err) {
        console.error("Error:", err);
      }
      
      setIsLoadingFavorites(false);
    };

    if (user) {
      fetchFavorites();
    }
  }, [user]);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        const { data: ordersData, error } = await supabase
          .from("orders")
          .select(`
            id,
            listing_id,
            amount,
            status,
            created_at,
            listings:listing_id (
              title,
              clean_image_url,
              original_image_url
            ),
            profiles:seller_id (
              display_name
            )
          `)
          .eq("buyer_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching orders:", error);
        } else {
          setOrders((ordersData as any[])?.map(o => ({
            ...o,
            listing: o.listings,
            seller: o.profiles,
          })) || []);
        }
      } catch (err) {
        console.error("Error:", err);
      }
      
      setIsLoadingOrders(false);
    };

    if (user) {
      fetchOrders();
    }
  }, [user]);

  // Listen for favorites updates
  useEffect(() => {
    const handleFavoritesUpdate = (event: CustomEvent) => {
      const { listingId, isFavorited } = event.detail;
      if (!isFavorited) {
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

  if (authLoading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full" />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "bg-green-100 text-green-700";
      case "shipped": return "bg-blue-100 text-blue-700";
      case "paid": return "bg-yellow-100 text-yellow-700";
      case "pending": return "bg-gray-100 text-gray-600";
      case "cancelled": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

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
          <div className="flex items-center gap-2">
            <TSLogo size={24} primaryColor="#ffffff" accentColor="#cfb53b" />
            <h1 className="text-lg font-semibold">My Account</h1>
          </div>
          <Link
            href="/seller"
            className="text-xs px-3 py-1.5 rounded-full border border-white/20 hover:bg-white/10 transition-colors"
          >
            Sell
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab("favorites")}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === "favorites"
                ? "text-white border-b-2 border-white"
                : "text-white/50 hover:text-white/70"
            }`}
          >
            <GlintIcon size={16} color="currentColor" filled={false} />
            Saved {listings.length > 0 && `(${listings.length})`}
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === "orders"
                ? "text-white border-b-2 border-white"
                : "text-white/50 hover:text-white/70"
            }`}
          >
            <Package size={16} />
            Orders {orders.length > 0 && `(${orders.length})`}
          </button>
        </div>
      </header>

      {/* Favorites Tab */}
      {activeTab === "favorites" && (
        <>
          {isLoadingFavorites ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full" />
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-20">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <GlintIcon size={40} color="rgba(255, 255, 255, 0.3)" className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No saved items yet</h2>
              <p className="text-white/50 text-center mb-8 max-w-xs">
                Tap the sparkle on items you love to save them here for later.
              </p>
              <Link
                href="/browse"
                className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition-colors"
              >
                Start browsing
              </Link>
            </div>
          ) : (
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
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute bottom-2 left-2">
                            <span className="px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-sm font-bold">
                              ${listing.price}
                            </span>
                          </div>
                        </div>
                        <div className="p-3">
                          <h3 className="text-sm font-medium text-white line-clamp-2 mb-1">
                            {listing.title}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-white/50">
                            <span>{sellerName}</span>
                            {hasBadge && (
                              <img src={TS_BADGE_URL} alt="Verified" className="w-3.5 h-3.5" />
                            )}
                          </div>
                        </div>
                      </Link>
                      <div className="absolute top-2 right-2 z-10">
                        <FavoriteButton listingId={listing.id} variant="small" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <>
          {isLoadingOrders ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-20">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <Package className="w-10 h-10 text-white/30" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
              <p className="text-white/50 text-center mb-8 max-w-xs">
                When you purchase items, they'll appear here.
              </p>
              <Link
                href="/browse"
                className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition-colors"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/listing/${order.listing_id}`}
                  className="block bg-slate-900 rounded-xl border border-white/10 p-4 hover:border-white/20 transition-colors"
                >
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                      {order.listing?.clean_image_url || order.listing?.original_image_url ? (
                        <img
                          src={order.listing.clean_image_url || order.listing.original_image_url || ""}
                          alt={order.listing?.title || "Item"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={24} className="text-white/30" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate mb-1">
                        {order.listing?.title || "Item"}
                      </h3>
                      <p className="text-sm text-white/50 mb-2">
                        From <span className="font-editorial">{order.seller?.display_name || "Seller"}</span>
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold">${order.amount.toFixed(2)}</span>
                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    <ChevronRight size={20} className="text-white/30 flex-shrink-0 self-center" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* Bottom padding */}
      <div className="h-8" />
    </main>
  );
}
