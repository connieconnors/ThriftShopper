"use client";

import { useState, useRef, useEffect, useCallback, TouchEvent } from "react";
import { useRouter } from "next/navigation";
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
import { MoodWheel } from "../../components/MoodWheel";
import { TSLogo } from "../../components/TSLogo";
import { useWhisperTranscription } from "../../hooks/useWhisperTranscription";
import { Mic, Loader2 } from "lucide-react";
import { Sparkles } from "lucide-react";

interface SwipeFeedProps {
  initialListings: Listing[];
}

// Brand colors from guide
const COLORS = {
  navy: '#000080',
  gold: '#efbf04',
  midnightBlue: '#191970',
  oldGold: '#cfb53b',
};

export default function SwipeFeed({ initialListings }: SwipeFeedProps) {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [searchResults, setSearchResults] = useState<Listing[] | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchDeltaY = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [countdown, setCountdown] = useState(8);

  // Navigate to product detail when card is clicked
  const handleCardClick = (listingId: string) => {
    router.push(`/listing/${listingId}`);
  };

  const displayListings = searchResults ?? listings;
  const currentListing = displayListings[currentIndex];

  // Handle completed voice transcription
  const handleTranscriptComplete = useCallback(async (transcript: string) => {
    if (transcript.trim()) {
      setVoiceTranscript(transcript);
      await handleSearch(transcript);
    }
  }, []);

  // Whisper-based voice transcription (works on mobile!)
  const {
    isRecording,
    isProcessing,
    isSupported: isVoiceSupported,
    toggleRecording,
  } = useWhisperTranscription({
    onTranscriptChange: (t) => setVoiceTranscript(t),
    onTranscriptComplete: handleTranscriptComplete,
    silenceTimeout: 1500, // 1.5 sec silence = done talking
    maxDuration: 8000,    // 8 sec max - auto-stop for mobile UX
  });

  // Countdown timer when recording
  useEffect(() => {
    if (isRecording) {
      setCountdown(8);
      const interval = setInterval(() => {
        setCountdown(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRecording]);

  // Sync listening state
  useEffect(() => {
    setIsListening(isRecording || isProcessing);
  }, [isRecording, isProcessing]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") goToNext();
      if (e.key === "ArrowUp" || e.key === "k") goToPrevious();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, displayListings.length]);

  const goToNext = useCallback(() => {
    if (currentIndex < displayListings.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex(prev => prev + 1);
      setTimeout(() => setIsTransitioning(false), 400);
    }
  }, [currentIndex, displayListings.length, isTransitioning]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex(prev => prev - 1);
      setTimeout(() => setIsTransitioning(false), 400);
    }
  }, [currentIndex, isTransitioning]);

  // Touch handling
  const handleTouchStart = (e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchDeltaY.current = 0;
  };

  const handleTouchMove = (e: TouchEvent) => {
    const delta = touchStartY.current - e.touches[0].clientY;
    touchDeltaY.current = delta;
    setDragOffset(-delta * 0.5);
  };

  const handleTouchEnd = (e: TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartY.current - touchEndY;
    
    // Check if it's a TAP (minimal movement) vs a SWIPE
    if (Math.abs(diffY) < 10 && Math.abs(touchDeltaY.current) < 10) {
      // This is a TAP - open product detail
      if (currentListing) {
        handleCardClick(currentListing.id);
      }
    } else if (touchDeltaY.current > 80) {
      goToNext();
    } else if (touchDeltaY.current < -80) {
      goToPrevious();
    }
    
    setDragOffset(0);
    touchDeltaY.current = 0;
  };

  // Mouse wheel
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (Math.abs(e.deltaY) > 30) {
      e.deltaY > 0 ? goToNext() : goToPrevious();
    }
  }, [goToNext, goToPrevious]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, [handleWheel]);

  // Voice Search - now using Whisper for reliable mobile support
  const toggleVoice = () => {
    if (!isRecording) {
      setVoiceTranscript('');
    }
    toggleRecording();
  };

  const handleSearch = async (query: string) => {
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
    if (words.length === 0) {
      setSearchResults(null);
      return;
    }
  
    const orConditions = words.map(word => {
      const escaped = word.replace(/[%_]/g, "\\$&");
      return `title.ilike.*${escaped}*,description.ilike.*${escaped}*,category.ilike.*${escaped}*`;
    }).join(",");
  
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
    
    setVoiceTranscript('');
  };
  
  const clearSearch = () => {
    setSearchResults(null);
    setCurrentIndex(0);
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleMoodChange = (mood: string) => {
    setSelectedMoods(prev => {
      if (prev.includes(mood)) {
        return prev.filter(m => m !== mood);
      } else {
        return [...prev, mood];
      }
    });
  };

  if (displayListings.length === 0) {
    return (
      <div 
        className="fixed inset-0 flex flex-col items-center justify-center"
        style={{ backgroundColor: COLORS.midnightBlue, fontFamily: 'Merriweather, serif' }}
      >
        <p className="text-white text-xl mb-4">No items found</p>
        {searchResults !== null && (
          <button
            onClick={clearSearch}
            className="px-6 py-3 rounded-full text-sm"
            style={{ backgroundColor: COLORS.oldGold, color: COLORS.midnightBlue }}
          >
            Clear search
          </button>
        )}
      </div>
    );
  }

  const imageSrc = getPrimaryImage(currentListing);
  const sellerName = getSellerDisplayName(currentListing);
  const sellerLocation = getSellerLocation(currentListing);
  const sellerAvatar = getSellerAvatar(currentListing);
  const hasTSBadge = hasSellerTSBadge(currentListing);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden select-none"
      style={{ backgroundColor: '#000', fontFamily: 'Merriweather, serif' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ===== HEADER (matches guide spec) ===== */}
      <div
        className="absolute top-0 left-0 right-0 z-30 p-6"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)' }}
      >
        <div className="flex items-center justify-between">
          {/* Left: TS Logo + Tagline */}
          <div className="flex items-center gap-3">
            <TSLogo size={40} primaryColor={COLORS.navy} accentColor={COLORS.gold} />
            <p className="text-sm italic font-bold" style={{ color: COLORS.gold }}>
              the magic of discovery™
            </p>
          </div>

          {/* Right: Mic Button with countdown ring */}
          <div className="relative">
            {/* Countdown ring when recording */}
            {isRecording && (
              <svg 
                className="absolute -inset-1 w-7 h-7 -rotate-90"
                viewBox="0 0 28 28"
              >
                <circle
                  cx="14" cy="14" r="13"
                  fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1"
                />
                <circle
                  cx="14" cy="14" r="13"
                  fill="none" stroke={COLORS.oldGold} strokeWidth="1"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 13}
                  strokeDashoffset={2 * Math.PI * 13 * (1 - countdown / 8)}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
            )}
            <button
              onClick={toggleVoice}
              disabled={isProcessing || !isVoiceSupported}
              className="w-6 h-6 rounded-full flex items-center justify-center transition-all relative"
              style={{
                backgroundColor: isRecording ? COLORS.oldGold : isProcessing ? '#6b46c1' : COLORS.midnightBlue,
                transform: isRecording ? 'scale(1.05)' : 'scale(1)',
                opacity: !isVoiceSupported ? 0.5 : 1,
              }}
            >
              {isProcessing ? (
                <Loader2 className="w-3 h-3 text-white animate-spin" />
              ) : (
                <Mic className="w-3 h-3 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Voice Transcript (appears when listening or processing) */}
        {(isRecording || isProcessing) && (
          <div 
            className="mt-4 h-10 px-4 flex items-center justify-between rounded-full max-w-md"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.15)', 
              backdropFilter: 'blur(10px)',
              border: `1px solid ${COLORS.oldGold}50`,
            }}
          >
            <p className="text-sm truncate flex-1" style={{ color: 'white' }}>
              {isProcessing ? (
                <span className="flex items-center gap-2" style={{ color: COLORS.oldGold }}>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Transcribing...
                </span>
              ) : voiceTranscript ? (
                `"${voiceTranscript}"`
              ) : (
                <span className="italic" style={{ color: COLORS.oldGold }}>
                  Listening...
                </span>
              )}
            </p>
            {/* Countdown indicator */}
            {isRecording && countdown > 0 && (
              <span 
                className="text-xs ml-2 opacity-70"
                style={{ color: COLORS.oldGold }}
              >
                {countdown}s
              </span>
            )}
          </div>
        )}

        {/* Search Results Indicator */}
        {searchResults !== null && !isListening && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm" style={{ color: COLORS.oldGold }}>
              {displayListings.length} results
            </span>
            <button
              onClick={clearSearch}
              className="text-sm text-white/60 hover:text-white underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* ===== PRODUCT CARDS STACK ===== */}
      <div
        className="relative w-full h-full"
        style={{
          transform: `translateY(${dragOffset}px)`,
          transition: dragOffset === 0 ? 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
        }}
      >
        {displayListings.map((listing, index) => {
          const offset = index - currentIndex;
          const isVisible = Math.abs(offset) <= 1;
          
          if (!isVisible) return null;

          const listingImage = getPrimaryImage(listing);
          const listingSellerName = getSellerDisplayName(listing);
          const listingSellerAvatar = getSellerAvatar(listing);
          const listingHasTSBadge = hasSellerTSBadge(listing);

          return (
            <div
              key={listing.id}
              className="absolute inset-0 w-full h-full"
              style={{
                transform: `translateY(${offset * 100}%)`,
                transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                zIndex: offset === 0 ? 10 : 5,
              }}
            >
              {/* Full-bleed Background Image - Simple object-cover */}
              <div 
                className="absolute inset-0 cursor-pointer"
                onClick={() => offset === 0 && handleCardClick(listing.id)}
              >
                {listingImage ? (
                  <img
                    src={listingImage}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: COLORS.midnightBlue }}
                  >
                    <span className="text-6xl opacity-30">📦</span>
                  </div>
                )}
              </div>

              {/* Dark Gradient Overlay */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)' }}
              />

              {/* TOP RIGHT: Clean - no buttons here (moved to bottom bar) */}

              {/* Product Info (bottom overlay) */}
              <div className="absolute bottom-0 left-0 right-0 pb-28 px-6 text-white pointer-events-none">
                {/* Title */}
                <h1 className="text-lg font-bold mb-2 leading-tight">
                  {listing.title}
                </h1>

                {/* Price */}
                <p className="text-base font-bold mb-3" style={{ color: COLORS.oldGold }}>
                  ${listing.price?.toFixed(2) || '0.00'}
                </p>

                {/* Description (truncated) */}
                {listing.description && (
                  <p className="text-sm opacity-80 line-clamp-2 mb-3 max-w-lg">
                    {listing.description}
                  </p>
                )}

                {/* Tags - handle both string and array */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {listing.category && (
                    <span 
                      className="px-3 py-1 text-xs font-medium rounded-full"
                      style={{ 
                        backgroundColor: 'rgba(207, 181, 59, 0.3)',
                        border: '1px solid #cfb53b',
                      }}
                    >
                      {listing.category}
                    </span>
                  )}
                  {/* Handle styles as array */}
                  {(() => {
                    let stylesArray: string[] = Array.isArray(listing.styles) 
                      ? listing.styles 
                      : (listing.styles as unknown as string)?.split(',')?.map(s => s.trim())?.filter(Boolean) || [];
                    
                    // Clean brackets and quotes from each style
                    stylesArray = stylesArray.map(style => {
                      let cleaned = String(style).trim();
                      // Remove leading/trailing quotes and brackets
                      cleaned = cleaned.replace(/^[\["\s]+|[\]"\s]+$/g, '');
                      // Remove any remaining quotes or brackets
                      cleaned = cleaned.replace(/["\[\]]/g, '');
                      return cleaned;
                    }).filter(s => s.length > 0);
                    
                    return stylesArray.slice(0, 2).map((style: string, i: number) => (
                      <span
                        key={`${style}-${i}`}
                        className="px-3 py-1 text-xs rounded-full"
                        style={{ 
                          backgroundColor: 'rgba(207, 181, 59, 0.3)',
                          border: '1px solid #cfb53b',
                        }}
                      >
                        {style}
                      </span>
                    ));
                  })()}
                </div>

                {/* Seller Info */}
                <div className="flex items-center gap-2">
                  {listingSellerAvatar ? (
                    <img src={listingSellerAvatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: COLORS.oldGold, color: COLORS.midnightBlue }}
                    >
                      {listingSellerName.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm opacity-80">Sold by {listingSellerName}</span>
                  {listingHasTSBadge && (
                    <img src={TS_BADGE_URL} alt="TS" className="w-4 h-4" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== BOTTOM BAR ===== */}
      <div 
        className="absolute bottom-6 left-6 right-6 z-20 flex items-center justify-between pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 100%)' }}
      >
        {/* Mood Wheel */}
        <div className="pointer-events-auto">
          <MoodWheel onMoodChange={handleMoodChange} selectedMoods={selectedMoods} />
        </div>

        {/* Counter */}
        <div 
          className="px-4 py-2 rounded-full"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}
        >
          <span className="text-sm" style={{ color: COLORS.oldGold }}>
            {currentIndex + 1} / {displayListings.length}
          </span>
        </div>

        {/* Bottom Right: 2 stacked elements */}
        <div className="flex flex-col gap-3 items-center pointer-events-auto">
          {/* Sparkle Button (Saved Finds) - Top */}
          <button 
            onClick={() => currentListing && toggleFavorite(currentListing.id)}
            className="relative w-7 h-7 flex items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}
          >
            <Sparkles 
              className="w-3.5 h-3.5" 
              style={{
                color: currentListing && favorites.has(currentListing.id) ? COLORS.gold : 'white',
                fill: currentListing && favorites.has(currentListing.id) ? COLORS.gold : 'transparent',
              }}
            />
            {favorites.size > 0 && (
              <div 
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: COLORS.gold, color: COLORS.midnightBlue }}
              >
                {favorites.size}
              </div>
            )}
          </button>
          
          {/* TS Logo Button (Seller Mode) - Bottom */}
          <button 
            className="w-7 h-7 flex items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(25, 25, 112, 0.9)', backdropFilter: 'blur(10px)' }}
          >
            <TSLogo size={16} primaryColor="#ffffff" accentColor="#efbf04" />
          </button>
        </div>
      </div>


      {/* Progress Dots (right side) */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5">
        {displayListings.slice(0, 8).map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsTransitioning(true);
              setCurrentIndex(index);
              setTimeout(() => setIsTransitioning(false), 400);
            }}
            className="transition-all duration-300"
            style={{
              width: 6,
              height: index === currentIndex ? 24 : 6,
              borderRadius: 3,
              backgroundColor: index === currentIndex ? COLORS.oldGold : 'rgba(255,255,255,0.4)',
            }}
          />
        ))}
        {displayListings.length > 8 && (
          <span className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            +{displayListings.length - 8}
          </span>
        )}
      </div>
    </div>
  );
}
