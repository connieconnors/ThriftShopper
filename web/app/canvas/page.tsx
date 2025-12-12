"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { TSLogo } from "@/components/TSLogo";
import {
  MessageSquare,
  HeadphonesIcon,
  Mic,
  Heart,
  Award,
  ArrowLeft,
  Upload,
  Search,
  User,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Settings,
} from "lucide-react";
import MessagesModal from "@/components/MessagesModal";
import SupportModal from "@/components/SupportModal";
import { StreamChatProvider } from "../seller/StreamChatProvider";
import { Listing, getPrimaryImage } from "../../lib/types";
import FavoriteButton from "../components/FavoriteButton";
import {
  getRecentlyViewed,
  getSavedSearches,
  getSavedMoods,
} from "../../lib/userPreferences";

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  created_at: string;
}

export default function BuyerCanvasPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<ReturnType<typeof getRecentlyViewed>>([]);
  const [savedMoods, setSavedMoods] = useState<ReturnType<typeof getSavedMoods>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/canvas");
    }
  }, [user, authLoading, router]);

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

        // Fetch purchases
        // Note: Orders table may have listing_id or product_id depending on schema
        // Try simple query first, then attempt join if needed
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("id, listing_id, product_id, amount, status, created_at")
          .eq("buyer_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);
        
        if (ordersError) {
          console.error("Error fetching orders:", ordersError);
          setPurchases([]);
        } else if (ordersData && ordersData.length > 0) {
          // If we have orders, try to fetch listing details separately
          const listingIds = ordersData
            .map((o: any) => o.listing_id || o.product_id)
            .filter(Boolean);
          
          let listingsMap: Record<string, any> = {};
          if (listingIds.length > 0) {
            const { data: listingsData } = await supabase
              .from("listings")
              .select("id, title, clean_image_url, original_image_url")
              .in("id", listingIds);
            
            if (listingsData) {
              listingsMap = listingsData.reduce((acc: any, listing: any) => {
                acc[listing.id] = listing;
                return acc;
              }, {});
            }
          }
          
          setPurchases(
            ordersData.map((o: any) => ({
              ...o,
              listing: listingsMap[o.listing_id || o.product_id] || null
            }))
          );
        } else {
          setPurchases([]);
        }

        // Load from localStorage
        setRecentlyViewed(getRecentlyViewed(user.id));
        setSavedMoods(getSavedMoods(user.id));
      } catch (error) {
        console.error("Error fetching canvas data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const getJoinYear = () => {
    if (!profile?.created_at) return new Date().getFullYear();
    return new Date(profile.created_at).getFullYear();
  };

  const [showFavorites, setShowFavorites] = useState(false);
  const [showPurchases, setShowPurchases] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  // Show loading state until mounted to prevent hydration mismatch
  if (!mounted || authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" style={{ fontFamily: "Merriweather, serif" }}>
        <div className="animate-spin h-8 w-8 border-2 border-[#EFBF05] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Extract vibes from saved moods
  const vibes = savedMoods.map((m) => m.mood).slice(0, 3);

  return (
    <StreamChatProvider>
    <div className="min-h-screen pb-16 bg-gray-50" style={{ fontFamily: "Merriweather, serif" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 py-2 flex items-center justify-between shadow-sm"
        style={{ backgroundColor: "#191970" }}
      >
        <Link href="/browse" className="flex items-center gap-2">
          <TSLogo size={24} primaryColor="#ffffff" accentColor="#EFBF05" />
        </Link>
        <Link
          href="/browse"
          className="text-white/80 hover:text-white text-[10px] flex items-center gap-1 transition-colors h-8 px-2.5 rounded hover:bg-white/10"
        >
          <ArrowLeft size={14} style={{ color: "#EFBF05" }} />
          Back to Discovery
        </Link>
      </header>

      {/* Profile Section */}
      <div className="bg-white px-4 py-4 mb-3">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm"
            style={{ backgroundColor: "#EFBF05" }}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-white">
                {profile?.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold mb-0.5" style={{ color: "#191970" }}>
              My Canvas
            </h1>
            <p className="text-xs text-gray-600">Treasure hunter since {getJoinYear()}</p>
          </div>
        </div>

        {/* Voice Input */}
        <div className="mb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="What's your treasure vibe?"
              className="w-full bg-gray-50 rounded-full px-4 py-3 pr-14 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#191970]/20 border border-gray-200"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const query = (e.target as HTMLInputElement).value;
                  if (query.trim()) {
                    router.push(`/browse?search=${encodeURIComponent(query)}`);
                  }
                }
              }}
            />
            <button
              onClick={() => router.push("/browse")}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full flex items-center justify-center transition-colors shadow-sm hover:shadow-md"
              style={{ backgroundColor: "#191970" }}
            >
              <Mic className="h-4 w-4 text-white" />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 italic mt-1.5 ml-4">we'll keep a look out</p>
        </div>

        {/* Vibe Tags */}
        {vibes.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500">Your vibe:</span>
            {vibes.map((vibe) => (
              <span
                key={vibe}
                className="px-3 py-1 rounded-full text-xs font-medium shadow-sm"
                style={{ backgroundColor: "#EFBF05", color: "#191970" }}
              >
                {vibe}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Playground Section */}
      <div className="bg-gray-50 px-4 py-5 -mt-8 mb-3">
        <div className="text-center mb-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Playground</h2>
        </div>

        <div className="space-y-3 max-w-md mx-auto">
          {/* Discovery */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm min-h-[180px]">
            <h3 className="text-sm font-semibold mb-2" style={{ color: "#191970" }}>
              Discovery
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-5">
              Create boards with photos, notes, and inspiration
            </p>
            <div className="flex gap-2 mb-4">
              <button
                disabled
                className="flex-1 h-8 text-xs gap-1.5 rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                Add Image
              </button>
              <button
                disabled
                className="flex-1 h-8 text-xs gap-1.5 rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Mic className="h-3.5 w-3.5" />
                Voice Note
              </button>
            </div>
            {/* Blank canvas area */}
            <div className="min-h-[60px] bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
              <p className="text-[10px] text-gray-400 italic">Your canvas awaits...</p>
            </div>
          </div>

          {/* Stories */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm min-h-[180px]">
            <h3 className="text-sm font-semibold mb-2" style={{ color: "#191970" }}>
              Stories
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-5">
              Share the story behind your treasures
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Tell your story..."
                disabled
                className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-xs placeholder:text-gray-400 border border-gray-200"
              />
              <button
                disabled
                className="h-8 w-8 shrink-0 rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <Mic className="h-3.5 w-3.5 text-gray-400" />
              </button>
            </div>
            {/* Blank canvas area */}
            <div className="min-h-[60px] bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
              <p className="text-[10px] text-gray-400 italic">Your stories await...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Favorites, Purchases, and Badges Section */}
      <div className="px-4 pb-20 space-y-3 -mt-3">
        {/* Favorites */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold" style={{ color: "#191970" }}>
                Favorites
              </h2>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{favorites.length}</span>
            </div>
            {showFavorites ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>
          {showFavorites && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
              {favorites.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No favorites yet — start exploring!</p>
              ) : (
                favorites.slice(0, 10).map((item) => (
                  <Link
                    key={item.id}
                    href={`/listing/${item.id}`}
                    className="px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 flex items-center gap-1.5 hover:bg-gray-100 hover:border-[#EFBF05] transition-all shadow-sm"
                  >
                    <span className="text-xs text-gray-700">{item.title}</span>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        {/* Purchases */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <button
            onClick={() => setShowPurchases(!showPurchases)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold" style={{ color: "#191970" }}>
                Purchases
              </h2>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{purchases.length}</span>
            </div>
            {showPurchases ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>
          {showPurchases && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
              {purchases.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No purchases yet — your treasures await!</p>
              ) : (
                purchases.map((order) => (
                  <Link
                    key={order.id}
                    href={`/listing/${order.listing_id}`}
                    className="px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 flex items-center gap-1.5 hover:bg-gray-100 hover:border-[#EFBF05] transition-all shadow-sm"
                  >
                    <span className="text-xs text-gray-700">{order.listing?.title || "Item"}</span>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <button onClick={() => setShowBadges(!showBadges)} className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold" style={{ color: "#191970" }}>
                Badges
              </h2>
              <span className="text-xs text-gray-500">Earn as you hunt</span>
            </div>
            {showBadges ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>
          {showBadges && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
              {[
                { name: "Rare Find", icon: Award },
                { name: "Collector", icon: Award },
                { name: "Early Bird", icon: Award },
              ].map((badge) => (
                <div
                  key={badge.name}
                  className="px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 flex items-center gap-1.5 opacity-40"
                >
                  <badge.icon className="h-3.5 w-3.5 text-gray-500" />
                  <span className="text-xs text-gray-600">{badge.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation - Simplified like v0 */}
      <nav
        className="fixed bottom-0 left-0 right-0 border-t border-gray-200 px-4 py-2.5 z-30"
        style={{ backgroundColor: "#191970" }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-around">
          <button
            onClick={() => setMessagesOpen(true)}
            className="flex flex-col items-center gap-0.5 text-white/70 hover:text-white transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-[10px]">Messages</span>
          </button>
          <button
            onClick={() => setSupportOpen(true)}
            className="flex flex-col items-center gap-0.5 text-white/70 hover:text-white transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="text-[10px]">Support</span>
          </button>
          <Link
            href="/settings"
            className="flex flex-col items-center gap-0.5 text-white/70 hover:text-white transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span className="text-[10px]">Settings</span>
          </Link>
        </div>
      </nav>

      {/* Modals */}
      <MessagesModal isOpen={messagesOpen} onClose={() => setMessagesOpen(false)} />
      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
    </StreamChatProvider>
  );
}

