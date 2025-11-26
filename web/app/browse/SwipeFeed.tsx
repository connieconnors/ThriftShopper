"use client";

import { useState, useRef, useEffect, useCallback, TouchEvent } from "react";
import Link from "next/link";
import { 
  Listing, 
  getSellerDisplayName, 
  getSellerLocation,
  getSellerAvatar,
  hasSellerTSBadge,
  getPrimaryImage,
  TS_BADGE_URL
} from "../../lib/types";
import { supabase } from "../../lib/supabaseClient";
import { VoiceSearchButton } from "../components/buyer_discovery_voice";
import FavoriteButton from "../components/FavoriteButton";
import SellerDrawer from "../components/SellerDrawer";

interface SwipeFeedProps {
  initialListings: Listing[];
}

export default function SwipeFeed({ initialListings }: SwipeFeedProps) {
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showVoiceSearch, setShowVoiceSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<Listing[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSellerDrawer, setShowSellerDrawer] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchDeltaY = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);

  const displayListings = searchResults ?? listings;
  const currentListing = displayListings[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") {
        goToNext();
      } else if (e.key === "ArrowUp" || e.key === "k") {
        goToPrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, displayListings.length]);

  const goToNext = useCallback(() => {
    if (currentIndex < displayListings.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + 1);
      setTimeout(() => setIsTransitioning(false), 400);
    }
  }, [currentIndex, displayListings.length, isTransitioning]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev - 1);
      setTimeout(() => setIsTransitioning(false), 400);
    }
  }, [currentIndex, isTransitioning]);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchDeltaY.current = 0;
  };

  const handleTouchMove = (e: TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const delta = touchStartY.current - currentY;
    touchDeltaY.current = delta;
    
    const atTop = currentIndex === 0 && delta < 0;
    const atBottom = currentIndex === displayListings.length - 1 && delta > 0;
    
    if (atTop || atBottom) {
      setDragOffset(-delta * 0.3);
    } else {
      setDragOffset(-delta * 0.5);
    }
  };

  const handleTouchEnd = () => {
    const threshold = 80;
    
    if (touchDeltaY.current > threshold) {
      goToNext();
    } else if (touchDeltaY.current < -threshold) {
      goToPrevious();
    }
    
    setDragOffset(0);
    touchDeltaY.current = 0;
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (Math.abs(e.deltaY) > 30) {
      if (e.deltaY > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
  }, [goToNext, goToPrevious]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, [handleWheel]);

  const handleVoiceSearch = async (transcript: string) => {
    console.log("Voice search:", transcript);
    setIsSearching(true);
    setShowVoiceSearch(false);

    try {
      const words = transcript
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 1);

      if (words.length === 0) {
        setSearchResults(null);
        return;
      }

      const orConditions = words
        .map((word) => {
          const escaped = word.replace(/[%_]/g, "\\$&");
          return [
            `title.ilike.*${escaped}*`,
            `description.ilike.*${escaped}*`,
            `category.ilike.*${escaped}*`,
          ].join(",");
        })
        .join(",");

      const { data, error } = await supabase
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
        .or(orConditions)
        .order("created_at", { ascending: false })
        .limit(24);

      if (!error && data && data.length > 0) {
        setSearchResults(data as Listing[]);
        setCurrentIndex(0);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchResults(null);
    setCurrentIndex(0);
  };

  if (displayListings.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white p-8">
          <p className="text-xl mb-4">No items found</p>
          {searchResults !== null && (
            <button
              onClick={clearSearch}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors"
            >
              Clear search
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Product Cards Stack */}
      <div
        className="relative w-full h-full"
        style={{
          transform: `translateY(${dragOffset}px)`,
          transition: dragOffset === 0 ? "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
        }}
      >
        {displayListings.map((listing, index) => {
          const offset = index - currentIndex;
          const isVisible = Math.abs(offset) <= 1;
          
          if (!isVisible) return null;

          const imageSrc = getPrimaryImage(listing);
          const sellerName = getSellerDisplayName(listing);
          const sellerLocation = getSellerLocation(listing);
          const sellerAvatar = getSellerAvatar(listing);
          const hasTSBadge = hasSellerTSBadge(listing);

          return (
            <div
              key={listing.id}
              className="absolute inset-0 w-full h-full"
              style={{
                transform: `translateY(${offset * 100}%)`,
                transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                zIndex: offset === 0 ? 10 : 5,
              }}
            >
              {/* Full-bleed Background Image */}
              <div className="absolute inset-0">
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                    <span className="text-slate-600 text-6xl">📦</span>
                  </div>
                )}
              </div>

              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />

              {/* Product Info - Bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-6 pb-12">
                {/* Category & Styles */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {listing.category && (
                    <span className="px-3 py-1 text-xs font-medium bg-white/15 backdrop-blur-sm rounded-full text-white/90">
                      {listing.category}
                    </span>
                  )}
                  {Array.isArray(listing.styles) &&
                    listing.styles.slice(0, 2).map((style) => (
                      <span
                        key={style}
                        className="px-3 py-1 text-xs bg-white/10 backdrop-blur-sm rounded-full text-white/70"
                      >
                        {style}
                      </span>
                    ))}
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
                  {listing.title}
                </h1>

                {/* Price & Seller */}
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-3xl font-bold text-white">
                    ${listing.price}
                  </span>
                  <button 
                    onClick={() => offset === 0 && setShowSellerDrawer(true)}
                    className="flex items-center gap-2 text-white/60 text-sm hover:text-white/80 transition-colors"
                  >
                    {/* Small seller avatar */}
                    {sellerAvatar ? (
                      <img src={sellerAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-violet-500/50 flex items-center justify-center text-[10px] font-bold">
                        {sellerName.charAt(0)}
                      </div>
                    )}
                    <span>by {sellerName}</span>
                    {hasTSBadge && (
                      <img 
                        src={TS_BADGE_URL}
                        alt="TS Verified"
                        className="w-4 h-4"
                      />
                    )}
                    {sellerLocation && (
                      <span className="text-white/40">· {sellerLocation}</span>
                    )}
                  </button>
                </div>

                {/* Description */}
                {listing.description && (
                  <p className="text-white/70 text-sm line-clamp-2 mb-6 max-w-lg">
                    {listing.description}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Link
                    href={`/listing/${listing.id}`}
                    className="flex-1 sm:flex-none px-8 py-4 bg-white text-black font-semibold rounded-full text-center hover:bg-white/90 transition-colors"
                  >
                    View Details
                  </Link>
                  <FavoriteButton listingId={listing.id} variant="card" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Bar - Fixed */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 flex items-center justify-between">
        <Link
          href="/"
          className="w-10 h-10 flex items-center justify-center bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <div className="flex items-center gap-2">
          {isSearching ? (
            <div className="px-4 py-2 bg-black/30 backdrop-blur-md rounded-full">
              <span className="text-white/70 text-sm flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Searching...
              </span>
            </div>
          ) : searchResults !== null ? (
            <button
              onClick={clearSearch}
              className="px-4 py-2 bg-violet-500/80 backdrop-blur-md rounded-full text-white text-sm hover:bg-violet-500 transition-colors"
            >
              Search results ({displayListings.length}) · Clear
            </button>
          ) : (
            <div className="px-4 py-2 bg-black/30 backdrop-blur-md rounded-full">
              <span className="text-white/70 text-sm">
                {currentIndex + 1} / {displayListings.length}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowVoiceSearch(!showVoiceSearch)}
          className={`w-10 h-10 flex items-center justify-center backdrop-blur-md rounded-full transition-colors ${
            showVoiceSearch 
              ? "bg-violet-500 text-white" 
              : "bg-black/30 text-white hover:bg-black/50"
          }`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1.5a4.5 4.5 0 00-4.5 4.5v5.25a4.5 4.5 0 109 0V6a4.5 4.5 0 00-4.5-4.5zm0 16.5a6.75 6.75 0 006.75-6.75V10.5a.75.75 0 00-1.5 0v.75a5.25 5.25 0 01-10.5 0V10.5a.75.75 0 00-1.5 0v.75A6.75 6.75 0 0012 18zm.75 2.25V21a.75.75 0 00-1.5 0v-.75a.75.75 0 001.5 0z" />
          </svg>
        </button>
      </div>

      {/* Voice Search Overlay */}
      {showVoiceSearch && (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-lg flex items-center justify-center">
          <div className="text-center">
            <p className="text-white/60 text-sm mb-6">What are you looking for?</p>
            <VoiceSearchButton
              onTranscriptComplete={handleVoiceSearch}
              className="scale-125"
            />
            <button
              onClick={() => setShowVoiceSearch(false)}
              className="mt-8 px-6 py-3 text-white/60 hover:text-white text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Swipe Hint */}
      {currentIndex === 0 && displayListings.length > 1 && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <div className="flex flex-col items-center text-white/50">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            <span className="text-xs mt-1">Swipe up</span>
          </div>
        </div>
      )}

      {/* Progress Dots */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1.5">
        {displayListings.slice(0, 10).map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsTransitioning(true);
              setCurrentIndex(index);
              setTimeout(() => setIsTransitioning(false), 400);
            }}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "bg-white h-4"
                : "bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
        {displayListings.length > 10 && (
          <span className="text-white/40 text-[10px] mt-1">
            +{displayListings.length - 10}
          </span>
        )}
      </div>

      {/* Seller Drawer */}
      {currentListing && (
        <SellerDrawer
          isOpen={showSellerDrawer}
          onClose={() => setShowSellerDrawer(false)}
          sellerId={currentListing.seller_id}
          sellerName={getSellerDisplayName(currentListing)}
          sellerLocation={getSellerLocation(currentListing)}
          sellerAvatar={getSellerAvatar(currentListing)}
          hasTSBadge={hasSellerTSBadge(currentListing)}
        />
      )}
    </div>
  );
}
