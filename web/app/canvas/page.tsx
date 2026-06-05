"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { TSLogo } from "@/components/TSLogo";
import {
  MessageSquare,
  Store,
  Package,
  Mic,
  Heart,
  Award,
  ArrowLeft,
  Upload,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Settings,
  X,
  Loader2,
} from "lucide-react";
import { useAppShell } from "@/hooks/useAppShell";
import SupportModal from "@/components/SupportModal";
import { Listing, getPrimaryImage } from "../../lib/types";
import {
  getRecentlyViewed,
  getSavedSearches,
  getSavedMoods,
  addSavedSearch,
} from "../../lib/userPreferences";
import { useWhisperTranscription } from "@/hooks/useWhisperTranscription";
import { ListingCarousel } from "@/components/ListingCarousel";

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  created_at: string;
  is_seller: boolean;
}

export default function BuyerCanvasPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  useAppShell("ink");
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [pickedForYou, setPickedForYou] = useState<Listing[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<ReturnType<typeof getRecentlyViewed>>([]);
  const [savedMoods, setSavedMoods] = useState<ReturnType<typeof getSavedMoods>>([]);
  const [savedSearches, setSavedSearches] = useState<ReturnType<typeof getSavedSearches>>([]);
  const [vibeInput, setVibeInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Discovery section state
  const [discoveryText, setDiscoveryText] = useState("");
  const [discoveryImages, setDiscoveryImages] = useState<string[]>([]);
  const discoveryImageInputRef = useRef<HTMLInputElement>(null);
  
  // Stories section state
  const [storiesText, setStoriesText] = useState("");
  
  // Voice input for Discovery
  const {
    isRecording: isRecordingDiscovery,
    isProcessing: isProcessingDiscovery,
    transcript: discoveryTranscript,
    isSupported: isVoiceSupported,
    toggleRecording: toggleDiscoveryRecording,
  } = useWhisperTranscription({
    onTranscriptComplete: (text) => {
      setDiscoveryText((prev) => (prev ? `${prev} ${text}` : text).trim());
    },
    silenceTimeout: 2000,
    maxDuration: 30000,
  });
  
  // Voice input for Stories
  const {
    isRecording: isRecordingStories,
    isProcessing: isProcessingStories,
    transcript: storiesTranscript,
    toggleRecording: toggleStoriesRecording,
  } = useWhisperTranscription({
    onTranscriptComplete: (text) => {
      setStoriesText((prev) => (prev ? `${prev} ${text}` : text).trim());
    },
    silenceTimeout: 2000,
    maxDuration: 30000,
  });

  // Voice input for Vibe search
  const {
    isRecording: isRecordingVibe,
    isProcessing: isProcessingVibe,
    transcript: vibeTranscript,
    isSupported: isVibeVoiceSupported,
    toggleRecording: toggleVibeRecording,
  } = useWhisperTranscription({
    onTranscriptComplete: (text) => {
      setVibeInput(text.trim());
    },
    silenceTimeout: 2000,
    maxDuration: 30000,
  });

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
          .select("display_name, avatar_url, email, created_at, is_seller")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileData) {
          setProfile({
            display_name: profileData.display_name,
            avatar_url: profileData.avatar_url,
            email: profileData.email || user.email || null,
            created_at: profileData.created_at,
            is_seller: profileData.is_seller === true,
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

        // Fetch purchases — same columns as seller dashboard (no legacy product_id)
        try {
          const { data: ordersData, error: ordersError } = await supabase
            .from("orders")
            .select("id, listing_id, amount, status, created_at")
            .eq("buyer_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20);

          if (ordersError) {
            console.error("Error fetching buyer orders:", {
              message: ordersError.message,
              code: ordersError.code,
              details: ordersError.details,
              hint: ordersError.hint,
              buyer_id: user.id,
            });
            setPurchases([]);
          } else if (ordersData && ordersData.length > 0) {
            const listingIds = [
              ...new Set(ordersData.map((o) => o.listing_id).filter(Boolean)),
            ];
            let listingsMap: Record<string, Listing> = {};
            if (listingIds.length > 0) {
              const { data: listingsData, error: listingsError } = await supabase
                .from("listings")
                .select("id, title, clean_image_url, original_image_url")
                .in("id", listingIds);
              if (listingsError) {
                console.warn("Buyer orders: could not load listing titles:", listingsError.message);
              } else if (listingsData) {
                listingsMap = listingsData.reduce(
                  (acc, listing) => {
                    acc[listing.id] = listing as Listing;
                    return acc;
                  },
                  {} as Record<string, Listing>
                );
              }
            }
            setPurchases(
              ordersData.map((o) => ({
                ...o,
                listing: o.listing_id ? listingsMap[o.listing_id] ?? null : null,
              }))
            );
          } else {
            setPurchases([]);
          }
        } catch (err) {
          console.error("Unexpected error fetching orders:", err);
          setPurchases([]);
        }

        // Load from localStorage (only after component is mounted)
        if (typeof window !== 'undefined') {
          setRecentlyViewed(getRecentlyViewed(user.id));
          setSavedMoods(getSavedMoods(user.id));
          setSavedSearches(getSavedSearches(user.id));
        }
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

  const [showFavorites, setShowFavorites] = useState(false);
  const [showPurchases, setShowPurchases] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [removingBookmarkId, setRemovingBookmarkId] = useState<string | null>(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const messagesSectionRef = useRef<HTMLDivElement>(null);
  const purchasesSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mounted) return;

    const section = new URLSearchParams(window.location.search).get("section");
    if (section === "purchases") {
      setShowPurchases(true);
      const timer = window.setTimeout(() => {
        purchasesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
      window.history.replaceState(null, "", "/canvas");
      return () => window.clearTimeout(timer);
    }
    if (section === "favorites") {
      setShowFavorites(true);
      window.history.replaceState(null, "", "/canvas");
    }
  }, [mounted]);

  useEffect(() => {
    if (!showMessages) return;
    const timer = window.setTimeout(() => {
      messagesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [showMessages]);

  useEffect(() => {
    if (!user || !profile?.is_seller) return;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const res = await fetch("/api/seller/unread-count", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadMessagesCount(data.unreadCount ?? 0);
        }
      } catch {
        setUnreadMessagesCount(0);
      }
    })();
  }, [user, profile?.is_seller]);

  useEffect(() => {
    if (!user || favorites.length < 2) {
      setPickedForYou([]);
      return;
    }

    let cancelled = false;
    const loadPicked = async () => {
      try {
        const response = await fetch("/api/recommendations/picked-for-you", {
          credentials: "include",
        });
        if (!response.ok) return;
        const { listings: picks } = await response.json();
        if (!cancelled && Array.isArray(picks)) {
          setPickedForYou(picks as Listing[]);
        }
      } catch (err) {
        console.warn("[canvas] picked-for-you failed:", err);
      }
    };

    void loadPicked();
    return () => {
      cancelled = true;
    };
  }, [user, favorites.length]);

  // Remove bookmark function
  const removeBookmark = async (listingId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return;
    
    setRemovingBookmarkId(listingId);
    
    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listingId);

      if (error) {
        console.error("Error removing bookmark:", error);
        return;
      }

      // Update local state
      setFavorites((prev) => prev.filter((item) => item.id !== listingId));
    } catch (err) {
      console.error("Error removing bookmark:", err);
    } finally {
      setRemovingBookmarkId(null);
    }
  };

  // Show loading state until mounted to prevent hydration mismatch
  if (!mounted || authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-2 border-[#16193a] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Extract vibes from saved moods
  const vibes = savedMoods.map((m) => m.mood).slice(0, 3);

  return (
    <div
      className="min-h-screen pb-16 bg-[#16193a]"
      style={{ overscrollBehaviorY: "contain" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-4 py-2 flex items-center justify-between shadow-sm"
        style={{ backgroundColor: "#16193a" }}
      >
        <Link href="/browse" className="flex items-center gap-2">
          <TSLogo size={28} primaryColor="#ffffff" accentColor="#DFAF37" />
        </Link>
        <Link
          href="/browse"
          className="text-white/90 hover:text-white text-xs flex items-center gap-1.5 transition-colors h-9 px-2.5 rounded-full hover:bg-white/10"
          aria-label="Back to Discovery"
        >
          <ArrowLeft size={18} className="text-white flex-shrink-0" />
          Back to Discovery
        </Link>
      </header>

      {/* Content Wrapper */}
      <div className="bg-gray-50">
      {/* Profile Section */}
      <div className="bg-white px-4 py-4 mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm"
            style={{ backgroundColor: "#16193a" }}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-white">
                {profile?.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold mb-1 font-ui-heading" style={{ color: "#16193a" }}>
              My Canvas
            </h1>
            <p className="text-xs text-gray-600 leading-relaxed">
              Your place for favorites, purchases, messages, and the treasures you&apos;re still thinking about.
            </p>
          </div>
        </div>
      </div>

      {pickedForYou.length > 0 && (
        <div className="bg-gray-50 pt-2 pb-1">
          <ListingCarousel
            title="Picked for you"
            subtitle="Based on what you've saved"
            listings={pickedForYou}
            from="canvas"
            variant="light"
            recommendationType="picked_for_you"
            trackEvents
          />
        </div>
      )}

      {/* Hub — favorites, purchases, messages, listings */}
      <div className="px-4 pb-4 space-y-3">
        {/* Favorites */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 flex-shrink-0" style={{ color: "#16193a" }} />
              <div className="text-left">
                <h2 className="text-sm font-semibold" style={{ color: "#16193a" }}>
                  Favorites
                </h2>
                <p className="text-xs text-gray-500">
                  {favorites.length === 0 ? "Items you've saved" : `${favorites.length} saved`}
                </p>
              </div>
            </div>
            {showFavorites ? (
              <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
            )}
          </button>
          {showFavorites && (
            <div className="flex flex-col gap-3 mt-3 pt-3 border-t border-gray-100">
              {favorites.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No favorites yet — start exploring!</p>
              ) : (
                favorites.slice(0, 10).map((item) => {
                  const imageUrl = getPrimaryImage(item);
                  return (
                    <div
                      key={item.id}
                      className="relative group w-full min-w-0"
                    >
                      <Link
                        href={`/listing/${item.id}?from=canvas`}
                        className="flex items-start gap-2 px-3 py-2 pr-8 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-[#16193a] transition-all shadow-sm w-full min-w-0"
                      >
                        {imageUrl && (
                          <img
                            src={imageUrl}
                            alt={item.title}
                            className="w-12 h-12 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <span className="text-xs text-gray-700 flex-1 min-w-0 break-words leading-snug line-clamp-3 [overflow-wrap:anywhere]">
                          {item.title}
                        </span>
                      </Link>
                      <button
                        onClick={(e) => removeBookmark(item.id, e)}
                        disabled={removingBookmarkId === item.id}
                        className="absolute top-0 right-0 -mt-1 -mr-1 w-5 h-5 rounded-full bg-[#16193a] text-white flex items-center justify-center hover:opacity-90 transition-colors disabled:opacity-50 z-10"
                        aria-label="Remove favorite"
                      >
                        {removingBookmarkId === item.id ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Purchases */}
        <div
          ref={purchasesSectionRef}
          className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
        >
          <button
            onClick={() => setShowPurchases(!showPurchases)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 flex-shrink-0" style={{ color: "#16193a" }} />
              <div className="text-left">
                <h2 className="text-sm font-semibold" style={{ color: "#16193a" }}>
                  Purchases
                </h2>
                <p className="text-xs text-gray-500">
                  {purchases.length === 0
                    ? "Orders you've placed"
                    : (() => {
                        const active = purchases.filter(
                          (o) => o.status && !["cancelled", "voided"].includes(o.status)
                        ).length;
                        return active > 0
                          ? `${active} active order${active === 1 ? "" : "s"}`
                          : `${purchases.length} order${purchases.length === 1 ? "" : "s"}`;
                      })()}
                </p>
              </div>
            </div>
            {showPurchases ? (
              <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
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
                    href={`/orders/${order.id}`}
                    className="px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 flex items-center gap-1.5 hover:bg-gray-100 hover:border-[#16193a] transition-all shadow-sm"
                  >
                    <span className="text-xs text-gray-700">{order.listing?.title || "Item"}</span>
                    {order.status && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        order.status === "paid"
                          ? "bg-blue-100 text-blue-700"
                          : order.status === "shipped"
                            ? "bg-purple-100 text-purple-700"
                            : order.status === "delivered"
                              ? "bg-green-100 text-green-700"
                              : order.status === "cancelled"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-gray-100 text-gray-700"
                      }`}>
                        {order.status === "cancelled" ? "voided" : order.status}
                      </span>
                    )}
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        {/* Messages */}
        <div
          ref={messagesSectionRef}
          className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm scroll-mt-20 scroll-mb-28"
        >
          <button
            onClick={() => setShowMessages(!showMessages)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 flex-shrink-0" style={{ color: "#16193a" }} />
              <div className="text-left">
                <h2 className="text-sm font-semibold" style={{ color: "#16193a" }}>
                  Messages
                </h2>
                <p className="text-xs text-gray-500">
                  {profile?.is_seller
                    ? unreadMessagesCount > 0
                      ? `${unreadMessagesCount} unread`
                      : "Buyer inquiries"
                    : "Contact sellers from listings"}
                </p>
              </div>
              {profile?.is_seller && unreadMessagesCount > 0 && (
                <span
                  className="px-2 py-0.5 text-xs font-bold rounded-full text-white flex-shrink-0"
                  style={{ backgroundColor: "#16193a" }}
                >
                  {unreadMessagesCount}
                </span>
              )}
            </div>
            {showMessages ? (
              <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
            )}
          </button>
          {showMessages && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              {profile?.is_seller ? (
                <Link
                  href="/seller"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#16193a" }}
                >
                  <MessageSquare className="h-4 w-4" />
                  Open message inbox
                </Link>
              ) : (
                <p className="text-xs text-gray-400 italic leading-relaxed">
                  Use &ldquo;Contact seller&rdquo; on any listing to reach out. Replies come by email for now.
                </p>
              )}
            </div>
          )}
        </div>

        {/* My Listings — sellers only */}
        {profile?.is_seller && (
          <Link
            href="/seller"
            className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Store className="h-5 w-5 flex-shrink-0" style={{ color: "#16193a" }} />
              <div className="text-left">
                <h2 className="text-sm font-semibold" style={{ color: "#16193a" }}>
                  My Listings
                </h2>
                <p className="text-xs text-gray-500">Manage your shop</p>
              </div>
            </div>
            <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0 -rotate-90" />
          </Link>
        )}
      </div>

      {/* Playground — experimental tools */}
      <div className="bg-gray-50 px-4 py-5 mb-3">
        <div className="mb-4 max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-sm font-semibold font-ui-heading" style={{ color: "#16193a" }}>
              Playground
            </h2>
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
              Optional
            </span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Capture ideas, stories, and things you&apos;re still searching for.
          </p>
        </div>

        <div className="space-y-3 max-w-md mx-auto">
          {/* Vibe search */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold mb-2" style={{ color: "#16193a" }}>
              Treasure vibe search
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-3">
              Tell us what you&apos;re hunting for — we&apos;ll keep a look out
            </p>
            <div className="relative">
              <input
                type="text"
                placeholder="What's your treasure vibe today?"
                value={vibeInput}
                onChange={(e) => setVibeInput(e.target.value)}
                className="w-full bg-gray-50 rounded-full px-4 py-3 pr-14 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16193a]/20 border border-gray-200"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const query = vibeInput.trim();
                    if (query) {
                      if (user) {
                        addSavedSearch(user.id, query);
                        setSavedSearches(getSavedSearches(user.id));
                      }
                      router.push(`/browse?search=${encodeURIComponent(query)}`);
                    }
                  }
                }}
              />
              <button
                onClick={toggleVibeRecording}
                disabled={!isVibeVoiceSupported || isProcessingVibe}
                className={`absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full flex items-center justify-center transition-colors shadow-sm hover:shadow-md ${
                  isRecordingVibe
                    ? "bg-rose-500 animate-pulse"
                    : isProcessingVibe
                    ? "bg-violet-500 cursor-wait"
                    : ""
                } ${!isVibeVoiceSupported ? "opacity-50 cursor-not-allowed" : ""}`}
                style={!isRecordingVibe && !isProcessingVibe ? { backgroundColor: "#16193a" } : {}}
              >
                {isProcessingVibe ? (
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                ) : (
                  <Mic className="h-4 w-4 text-white" />
                )}
              </button>
            </div>
            {vibeTranscript && isRecordingVibe && (
              <p className="text-[10px] text-gray-500 italic mt-1.5">Listening: {vibeTranscript}</p>
            )}
            {vibes.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center mt-3">
                <span className="text-xs text-gray-500">Your vibe:</span>
                {vibes.map((vibe) => (
                  <span
                    key={vibe}
                    className="px-3 py-1 rounded-full text-xs font-medium shadow-sm"
                    style={{ backgroundColor: "#16193a", color: "#ffffff" }}
                  >
                    {vibe}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Discovery Notes */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm min-h-[180px]">
            <h3 className="text-sm font-semibold mb-2" style={{ color: "#16193a" }}>
              Discovery Notes
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-5">
              Create boards with photos, notes, and inspiration
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="file"
                ref={discoveryImageInputRef}
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    const newImages = files.map((file) => {
                      return URL.createObjectURL(file);
                    });
                    setDiscoveryImages((prev) => [...prev, ...newImages].slice(0, 5)); // Max 5 images
                  }
                }}
              />
              <button
                onClick={() => discoveryImageInputRef.current?.click()}
                className="flex-1 h-8 text-xs gap-1.5 rounded-lg border border-gray-200 flex items-center justify-center bg-white text-gray-700 hover:bg-gray-50 hover:border-[#16193a] transition-colors cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" />
                Add Image
              </button>
              <button
                onClick={toggleDiscoveryRecording}
                disabled={!isVoiceSupported || isProcessingDiscovery}
                className={`flex-1 h-8 text-xs gap-1.5 rounded-lg border border-gray-200 flex items-center justify-center transition-colors cursor-pointer ${
                  isRecordingDiscovery
                    ? "bg-rose-500 text-white border-rose-500 animate-pulse"
                    : isProcessingDiscovery
                    ? "bg-violet-500 text-white border-violet-500 cursor-wait"
                    : "bg-white text-gray-700 hover:bg-gray-50 hover:border-[#16193a]"
                } ${!isVoiceSupported ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isProcessingDiscovery ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Mic className="h-3.5 w-3.5" />
                )}
                Voice Note
              </button>
            </div>
            
            {/* Display uploaded images */}
            {discoveryImages.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {discoveryImages.map((img, index) => (
                  <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                    <img src={img} alt={`Discovery ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => {
                        URL.revokeObjectURL(img);
                        setDiscoveryImages((prev) => prev.filter((_, i) => i !== index));
                      }}
                      className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-600"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Text box for notes */}
            <textarea
              placeholder="I'd really love to find another..."
              value={discoveryText}
              onChange={(e) => setDiscoveryText(e.target.value)}
              className="w-full min-h-[80px] bg-white rounded-lg px-3 py-2 text-xs placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#16193a]/20 focus:border-[#16193a] resize-none"
              rows={4}
            />
            {discoveryTranscript && isRecordingDiscovery && (
              <p className="text-[10px] text-gray-500 italic mt-1">Listening: {discoveryTranscript}</p>
            )}
          </div>

          {/* Stories */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm min-h-[180px]">
            <h3 className="text-sm font-semibold mb-2" style={{ color: "#16193a" }}>
              Stories
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-3">
              Share the story behind your treasures
            </p>
            
            {/* Voice input button for Stories */}
            <div className="mb-3">
              <button
                onClick={toggleStoriesRecording}
                disabled={!isVoiceSupported || isProcessingStories}
                className={`w-full h-8 text-xs gap-1.5 rounded-lg border border-gray-200 flex items-center justify-center transition-colors ${
                  isRecordingStories
                    ? "bg-rose-500 text-white border-rose-500 animate-pulse"
                    : isProcessingStories
                    ? "bg-violet-500 text-white border-violet-500 cursor-wait"
                    : "bg-white text-gray-700 hover:bg-gray-50 hover:border-[#16193a]"
                } ${!isVoiceSupported ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isProcessingStories ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Transcribing...</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-3.5 w-3.5" />
                    <span>{isRecordingStories ? "Stop Recording" : "Voice Input"}</span>
                  </>
                )}
              </button>
              {storiesTranscript && isRecordingStories && (
                <p className="text-[10px] text-gray-500 italic mt-1">Listening: {storiesTranscript}</p>
              )}
            </div>
            
            {/* Text box for stories */}
            <textarea
              placeholder="This reminded me of that time..."
              value={storiesText}
              onChange={(e) => setStoriesText(e.target.value)}
              className="w-full min-h-[120px] bg-white rounded-lg px-3 py-2 text-xs placeholder:text-gray-400 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#16193a]/20 focus:border-[#16193a] resize-none"
              rows={6}
            />
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="px-4 pb-20 space-y-3">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <button onClick={() => setShowBadges(!showBadges)} className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold" style={{ color: "#16193a" }}>
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
        style={{ backgroundColor: "#16193a" }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-around">
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
      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} />
      </div>
    </div>
  );
}

