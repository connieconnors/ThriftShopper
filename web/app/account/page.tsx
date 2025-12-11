"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { Listing, getPrimaryImage } from "../../lib/types";
import { TSLogo } from "@/components/TSLogo";
import FavoriteButton from "../components/FavoriteButton";
import {
  getRecentlyViewed,
  addRecentlyViewed,
  getSavedSearches,
  addSavedSearch,
  removeSavedSearch,
  getSavedMoods,
  addSavedMood,
  getSelectedVibes,
} from "../../lib/userPreferences";
import {
  MessageSquare,
  Search,
  X,
  Heart,
  Clock,
  Sparkles,
  TrendingUp,
  User,
  Settings,
  CreditCard,
  MapPin,
  LogOut,
  ChevronRight,
  Store,
} from "lucide-react";

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
}

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  created_at: string;
}

export default function BuyerAccountPage() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [purchases, setPurchases] = useState<Order[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<ReturnType<typeof getRecentlyViewed>>([]);
  const [savedSearches, setSavedSearches] = useState<ReturnType<typeof getSavedSearches>>([]);
  const [savedMoods, setSavedMoods] = useState<ReturnType<typeof getSavedMoods>>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<Listing[]>([]);
  const [userVibes, setUserVibes] = useState<{ moods: string[]; categories: string[] }>({
    moods: [],
    categories: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Fetch user data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("display_name, avatar_url, email, created_at")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileData) {
          setProfile({
            display_name: profileData.display_name,
            avatar_url: profileData.avatar_url,
            email: profileData.email || user.email || null,
            created_at: profileData.created_at,
          });
        }

        // Fetch favorites
        const { data: favoritesData } = await supabase
          .from("favorites")
          .select("listing_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (favoritesData && favoritesData.length > 0) {
          const favoriteIds = favoritesData.map((f) => f.listing_id);
          const { data: listingsData } = await supabase
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
            .eq("status", "active")
            .limit(20);

          setFavorites((listingsData as Listing[]) || []);
        }

        // Fetch purchases/orders
        const { data: ordersData } = await supabase
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
            )
          `)
          .eq("buyer_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (ordersData) {
          setPurchases(
            ordersData.map((o: any) => ({
              ...o,
              listing: o.listings,
            }))
          );
        }

        // Load from localStorage
        setRecentlyViewed(getRecentlyViewed(user.id));
        setSavedSearches(getSavedSearches(user.id));
        setSavedMoods(getSavedMoods(user.id));
        setSelectedVibes(getSelectedVibes(user.id));

        // Calculate user vibes from favorites
        const allMoods: string[] = [];
        const allCategories: string[] = [];
        favorites.forEach((fav) => {
          if (fav.moods) allMoods.push(...fav.moods);
          if (fav.category) allCategories.push(fav.category);
        });

        // Get most common moods and categories
        const moodCounts: Record<string, number> = {};
        allMoods.forEach((mood) => {
          moodCounts[mood] = (moodCounts[mood] || 0) + 1;
        });
        const topMoods = Object.entries(moodCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([mood]) => mood);

        const categoryCounts: Record<string, number> = {};
        allCategories.forEach((cat) => {
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
        const topCategories = Object.entries(categoryCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([cat]) => cat);

        setUserVibes({ moods: topMoods, categories: topCategories });

        // Fetch recommendations based on user preferences
        const recommendationMoods = [...topMoods, ...selectedVibes].slice(0, 3);
        if (recommendationMoods.length > 0) {
          const favoriteIds = favorites.map((f) => f.id);
          const { data: recData } = await supabase
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
            .eq("status", "active")
            .limit(20);

          if (recData) {
            // Filter by matching moods and exclude favorites
            const filtered = (recData as Listing[])
              .filter((listing) => !favoriteIds.includes(listing.id))
              .filter((listing) => {
                if (!listing.moods || listing.moods.length === 0) return false;
                return recommendationMoods.some((mood) =>
                  listing.moods.some((m) => m.toLowerCase().includes(mood.toLowerCase()))
                );
              });
            setRecommendations(filtered.slice(0, 6));
          }
        }
      } catch (error) {
        console.error("Error fetching account data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, favorites.length, selectedVibes.length]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/account");
    }
  }, [user, authLoading, router]);

  const handleSearch = (query: string) => {
    if (user && query.trim()) {
      addSavedSearch(user.id, query);
      setSavedSearches(getSavedSearches(user.id));
      router.push(`/browse?search=${encodeURIComponent(query)}`);
    }
  };

  const handleRemoveSearch = (searchId: string) => {
    if (user) {
      removeSavedSearch(user.id, searchId);
      setSavedSearches(getSavedSearches(user.id));
    }
  };

  const getJoinYear = () => {
    if (!profile?.created_at) return new Date().getFullYear();
    return new Date(profile.created_at).getFullYear();
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FFF8E6" }}>
        <div className="animate-spin h-8 w-8 border-2 border-[#EFBF05] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFF8E6", fontFamily: "Merriweather, serif" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between shadow-sm"
        style={{ backgroundColor: "#191970" }}
      >
        <Link href="/browse" className="flex items-center gap-2">
          <TSLogo size={24} primaryColor="#ffffff" accentColor="#EFBF05" />
          <span className="text-white font-semibold text-lg">My Canvas</span>
        </Link>
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: "#EFBF05" }}
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-white">
              {profile?.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
            </span>
          )}
        </button>
      </header>

      {/* Profile Menu Dropdown */}
      {showProfileMenu && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setShowProfileMenu(false)} />
          <div
            className="fixed top-16 right-4 z-50 w-64 rounded-lg shadow-xl border border-gray-200 overflow-hidden"
            style={{ backgroundColor: "white" }}
          >
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-xs text-gray-500">Signed in as</p>
              <p className="text-sm font-medium truncate">{profile?.email || user.email}</p>
            </div>
            <div className="py-1">
              <Link
                href="/account/settings"
                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                onClick={() => setShowProfileMenu(false)}
              >
                <Settings className="h-4 w-4 text-gray-600" />
                <span>Edit Profile</span>
              </Link>
              <Link
                href="/account/shipping"
                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                onClick={() => setShowProfileMenu(false)}
              >
                <MapPin className="h-4 w-4 text-gray-600" />
                <span>Shipping Address</span>
              </Link>
              <Link
                href="/account/payment"
                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
                onClick={() => setShowProfileMenu(false)}
              >
                <CreditCard className="h-4 w-4 text-gray-600" />
                <span>Payment Methods</span>
              </Link>
              <Link
                href="/seller/onboarding"
                className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-t border-gray-200 mt-1"
                onClick={() => setShowProfileMenu(false)}
              >
                <Store className="h-4 w-4 text-gray-600" />
                <span>Become a Seller</span>
              </Link>
              <button
                onClick={async () => {
                  await signOut();
                  router.push("/");
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="pb-20">
        {/* Profile Summary */}
        <div className="px-4 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ backgroundColor: "#EFBF05" }}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-white">
                  {profile?.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold truncate" style={{ color: "#191970" }}>
                {profile?.display_name || "Treasure Hunter"}
              </h1>
              <p className="text-xs text-gray-600">Member since {getJoinYear()}</p>
            </div>
          </div>
        </div>

        {/* Saved Searches */}
        {savedSearches.length > 0 && (
          <section className="px-4 py-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "#191970" }}>
                <Search className="h-4 w-4" />
                Saved Searches
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {savedSearches.map((search) => (
                <div
                  key={search.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
                  style={{ backgroundColor: "#FFF8E6", border: "1px solid #EFBF05" }}
                >
                  <button
                    onClick={() => handleSearch(search.query)}
                    className="text-gray-700 hover:text-[#191970] transition-colors"
                  >
                    {search.query}
                  </button>
                  <button
                    onClick={() => handleRemoveSearch(search.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Saved Moods */}
        {savedMoods.length > 0 && (
          <section className="px-4 py-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "#191970" }}>
                <Sparkles className="h-4 w-4" />
                Saved Moods
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {savedMoods.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => router.push(`/browse?mood=${encodeURIComponent(mood.mood)}`)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: "#EFBF05",
                    color: "#191970",
                  }}
                >
                  {mood.mood}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Your Vibes Summary */}
        {(userVibes.moods.length > 0 || userVibes.categories.length > 0) && (
          <section className="px-4 py-4 bg-white border-b border-gray-200">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "#191970" }}>
              <TrendingUp className="h-4 w-4" />
              You Seem to Love...
            </h2>
            {userVibes.moods.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-600 mb-2">Moods:</p>
                <div className="flex flex-wrap gap-2">
                  {userVibes.moods.map((mood, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded text-xs"
                      style={{ backgroundColor: "#FFF8E6", color: "#191970" }}
                    >
                      {mood}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {userVibes.categories.length > 0 && (
              <div>
                <p className="text-xs text-gray-600 mb-2">Categories:</p>
                <div className="flex flex-wrap gap-2">
                  {userVibes.categories.map((cat, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded text-xs"
                      style={{ backgroundColor: "#FFF8E6", color: "#191970" }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <section className="px-4 py-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "#191970" }}>
                <Clock className="h-4 w-4" />
                Recently Viewed
              </h2>
              <Link href="/account/recent" className="text-xs text-[#EFBF05] hover:underline">
                See all
              </Link>
            </div>
            <div className="overflow-x-auto -mx-4 px-4">
              <div className="flex gap-3 w-max">
                {recentlyViewed.slice(0, 10).map((item) => (
                  <Link
                    key={item.listingId}
                    href={`/listing/${item.listingId}`}
                    className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-gray-200"
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-xl">📦</span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <section className="px-4 py-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "#191970" }}>
                <TrendingUp className="h-4 w-4" />
                Recommended for You
              </h2>
            </div>
            <div className="overflow-x-auto -mx-4 px-4">
              <div className="flex gap-3 w-max">
                {recommendations.map((item) => {
                  const imageSrc = getPrimaryImage(item);
                  return (
                    <Link
                      key={item.id}
                      href={`/listing/${item.id}`}
                      className="flex-shrink-0 w-32 rounded-lg overflow-hidden border border-gray-200 bg-white"
                    >
                      <div className="aspect-square relative">
                        {imageSrc ? (
                          <img src={imageSrc} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <span className="text-2xl">📦</span>
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium line-clamp-2 mb-1" style={{ color: "#191970" }}>
                          {item.title}
                        </p>
                        <p className="text-xs font-bold" style={{ color: "#EFBF05" }}>
                          ${item.price}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Favorites */}
        <section className="px-4 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: "#191970" }}>
              <Heart className="h-4 w-4" style={{ color: "#EFBF05" }} fill="#EFBF05" />
              Saved Items ({favorites.length})
            </h2>
            {favorites.length > 0 && (
              <Link href="/favorites" className="text-xs text-[#EFBF05] hover:underline">
                See all
              </Link>
            )}
          </div>
          {favorites.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-600 mb-2">No saved items yet</p>
              <Link
                href="/browse"
                className="inline-block px-4 py-2 text-xs font-medium rounded-full transition-colors"
                style={{ backgroundColor: "#EFBF05", color: "#191970" }}
              >
                Start Browsing
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {favorites.slice(0, 6).map((item) => {
                const imageSrc = getPrimaryImage(item);
                return (
                  <Link
                    key={item.id}
                    href={`/listing/${item.id}`}
                    className="relative rounded-lg overflow-hidden border border-gray-200 bg-white"
                  >
                    <div className="aspect-square relative">
                      {imageSrc ? (
                        <img src={imageSrc} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <span className="text-2xl">📦</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <FavoriteButton listingId={item.id} variant="small" />
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium line-clamp-2 mb-1" style={{ color: "#191970" }}>
                        {item.title}
                      </p>
                      <p className="text-xs font-bold" style={{ color: "#EFBF05" }}>
                        ${item.price}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Purchases */}
        {purchases.length > 0 && (
          <section className="px-4 py-4 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold" style={{ color: "#191970" }}>
                Purchases ({purchases.length})
              </h2>
              <Link href="/account/orders" className="text-xs text-[#EFBF05] hover:underline">
                See all
              </Link>
            </div>
            <div className="space-y-2">
              {purchases.slice(0, 3).map((order) => {
                const imageSrc = order.listing?.clean_image_url || order.listing?.original_image_url;
                return (
                  <Link
                    key={order.id}
                    href={`/listing/${order.listing_id}`}
                    className="flex gap-3 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      {imageSrc ? (
                        <img src={imageSrc} alt={order.listing?.title || "Item"} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <span className="text-xl">📦</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate mb-1" style={{ color: "#191970" }}>
                        {order.listing?.title || "Item"}
                      </p>
                      <p className="text-xs text-gray-600 mb-1">${order.amount.toFixed(2)}</p>
                      <span
                        className="inline-block px-2 py-0.5 text-xs rounded-full capitalize"
                        style={{
                          backgroundColor: order.status === "delivered" ? "#d4edda" : "#fff3cd",
                          color: order.status === "delivered" ? "#155724" : "#856404",
                        }}
                      >
                        {order.status}
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 self-center" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 border-t border-gray-200 px-4 py-3 z-30"
        style={{ backgroundColor: "#191970" }}
      >
        <div className="max-w-md mx-auto flex items-center justify-around">
          <Link
            href="/browse"
            className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors"
          >
            <Search className="h-5 w-5" />
            <span className="text-[10px]">Browse</span>
          </Link>
          <Link
            href="/favorites"
            className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors"
          >
            <Heart className="h-5 w-5" />
            <span className="text-[10px]">Saved</span>
          </Link>
          <Link
            href="/messages"
            className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-[10px]">Messages</span>
          </Link>
          <Link
            href="/account"
            className="flex flex-col items-center gap-1 text-white transition-colors"
          >
            <User className="h-5 w-5" style={{ color: "#EFBF05" }} />
            <span className="text-[10px]" style={{ color: "#EFBF05" }}>
              Account
            </span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
