"use client";

import { useState, useRef, useEffect, useCallback, useMemo, TouchEvent } from "react";
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
import { StandaloneMoodWheel } from "../../components/StandaloneMoodWheel";
import { TSLogo } from "../../components/TSLogo";
import AccountSheet from "../../components/AccountSheet";
import { useWhisperTranscription } from "../../hooks/useWhisperTranscription";
import { Mic, Loader2, Bookmark } from "lucide-react";
import { normalizeTagColumn } from "../../lib/utils/tagNormalizer";

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
  const [lastSearchQuery, setLastSearchQuery] = useState(''); // Keep track of what was searched
  const [searchResults, setSearchResults] = useState<Listing[] | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>(initialListings);
  const [noMoodResults, setNoMoodResults] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Prevent hydration errors by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);
  const touchStartY = useRef(0);
  const touchDeltaY = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [countdown, setCountdown] = useState(8);

  // Haptic feedback helper (if supported)
  const triggerHaptic = useCallback(() => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10); // 10ms light vibration
    }
  }, []);

  // Navigate to product detail when card is clicked
  const handleCardClick = (listingId: string) => {
    triggerHaptic();
    router.push(`/listing/${listingId}`);
  };

  // Apply mood filter function
  const applyMoodFilter = (moods: string[]) => {
    // keep track of selection
    setSelectedMoods(moods);

    // If nothing selected, reset to all listings and clear error
    if (moods.length === 0) {
      setFilteredListings(listings);
      setNoMoodResults(false);
      return;
    }

    const next = listings.filter((listing) => {
      // Normalize the listing's mood/style/intent columns
      const listingMoods = normalizeTagColumn(listing.moods);
      const listingStyles = normalizeTagColumn(listing.styles);
      const listingIntents = normalizeTagColumn(listing.intents);
      
      // Combine all tags from the listing
      const allTags = [...listingMoods, ...listingStyles, ...listingIntents]
        .map(tag => tag.toLowerCase());
      
      // Check if ALL selected moods match tags from the listing (AND logic)
      const matches = moods.every(selectedMood => {
        if (typeof selectedMood !== 'string') {
          console.warn('Invalid selectedMood type:', selectedMood);
          return false;
        }
        return allTags.includes(selectedMood.toLowerCase());
      });
      
      return matches;
    });

    if (next.length === 0) {
      // 🔴 important: do NOT change filteredListings or currentIndex
      setNoMoodResults(true);
      return;
    }

    // We have results – update the feed as normal
    setNoMoodResults(false);
    setFilteredListings(next);
    setCurrentIndex(0); // Reset to first card when filter changes
  };

  // Handle completed voice transcription
  // Keep isListening true so UI stays visible after transcription
  const handleTranscriptComplete = useCallback(async (transcript: string) => {
    if (transcript.trim()) {
      setVoiceTranscript(transcript);
      // Keep UI visible - don't hide it
      setIsListening(true);
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
    silenceTimeout: 999999999, // Disable auto-stop on silence - user must tap mic to stop
    maxDuration: 300000,    // 5 minutes max - very long for demo purposes
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

  // Keep voice UI visible until user explicitly stops recording
  // isListening is controlled only by toggleVoice, not by recording state
  // This ensures the UI stays visible even after recording auto-stops

  // Display listings: use search results if available, otherwise use filtered listings
  // Compute this early so it can be used in hooks below
  const displayListings = searchResults ?? filteredListings;

  // Keyboard navigation (client-side only to avoid hydration issues)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") {
        if (currentIndex < displayListings.length - 1 && !isTransitioning) {
          setIsTransitioning(true);
          setCurrentIndex(prev => prev + 1);
          setTimeout(() => setIsTransitioning(false), 400);
        }
      }
      if (e.key === "ArrowUp" || e.key === "k") {
        if (currentIndex > 0 && !isTransitioning) {
          setIsTransitioning(true);
          setCurrentIndex(prev => prev - 1);
          setTimeout(() => setIsTransitioning(false), 400);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, displayListings.length, isTransitioning]);

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
    // Smooth drag with momentum
    setDragOffset(-delta * 0.5);
    // Prevent default scrolling for smoother experience
    if (Math.abs(delta) > 5) {
      e.preventDefault();
    }
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
  // UI stays visible until user explicitly taps mic again
  const toggleVoice = () => {
    if (isListening) {
      // User is stopping - hide the UI and clear transcript
      setIsListening(false);
      setVoiceTranscript('');
      if (isRecording) {
        toggleRecording(); // Stop the recording if it's still active
      }
    } else {
      // User is starting - show the UI and start recording
      setIsListening(true);
      setVoiceTranscript('');
      if (!isRecording) {
        toggleRecording(); // Start recording
      }
    }
  };

  const handleSearch = async (query: string) => {
    if (!query || query.trim().length === 0) {
      setSearchResults(null);
      setLastSearchQuery('');
      return;
    }

    // Save the search query so we can display it
    setLastSearchQuery(query.trim());

    try {
      // Use semantic search with OpenAI interpretation
      const { semanticSearch } = await import('@/lib/semantic-search');
      const { listings, interpretation } = await semanticSearch(query.trim(), { limit: 24 });
      
      console.log('🔍 Search query:', query);
      console.log('📊 Found listings:', listings.length);
      if (interpretation) {
        console.log('🧠 Query interpretation:', interpretation);
      }

      if (listings.length > 0) {
        setSearchResults(listings);
        setCurrentIndex(0);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
    
    // Don't clear transcript or hide UI - keep it visible for demo
    // setVoiceTranscript(''); // Keep transcript visible
  };
  
  const clearSearch = () => {
    setSearchResults(null);
    setLastSearchQuery('');
    setCurrentIndex(0);
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };


  // Removed auto-close of mood wheel on swipe - user must manually close it

  // Update filteredListings when listings change (but not when mood filter changes)
  useEffect(() => {
    if (selectedMoods.length === 0) {
      setFilteredListings(listings);
      setNoMoodResults(false);
    } else if (!noMoodResults) {
      // Only re-apply if we're not in a "no results" state
      // This prevents clearing the current view when listings update
      const next = listings.filter((listing) => {
        const listingMoods = normalizeTagColumn(listing.moods);
        const listingStyles = normalizeTagColumn(listing.styles);
        const listingIntents = normalizeTagColumn(listing.intents);
        const allTags = [...listingMoods, ...listingStyles, ...listingIntents]
          .map(tag => tag.toLowerCase());
        return selectedMoods.every(selectedMood => {
          if (typeof selectedMood !== 'string') return false;
          return allTags.includes(selectedMood.toLowerCase());
        });
      });
      if (next.length > 0) {
        setFilteredListings(next);
        setNoMoodResults(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings]);

  // currentListing computed after all hooks
  const currentListing = displayListings[currentIndex];

  // Track if mood filtering resulted in no results
  const hasMoodFilter = selectedMoods.length > 0;
  const hasNoResults = displayListings.length === 0;
  const isMoodFilterResult = hasMoodFilter && hasNoResults && searchResults === null && noMoodResults;

  if (displayListings.length === 0 && !noMoodResults) {
    return (
      <div 
        className="fixed inset-0 flex flex-col items-center justify-center px-6"
        style={{ backgroundColor: COLORS.midnightBlue, fontFamily: 'Merriweather, serif' }}
      >
        <p className="text-white text-xl mb-2">No items found</p>
        {isMoodFilterResult && (
          <>
            <p className="text-white/60 text-sm mb-4">
              for selected moods: {selectedMoods.join(', ')}
            </p>
            <button
              onClick={() => setSelectedMoods([])}
              className="px-6 py-3 rounded-full text-sm font-medium"
              style={{ backgroundColor: COLORS.oldGold, color: COLORS.midnightBlue }}
            >
              Clear mood filters
            </button>
          </>
        )}
        {searchResults !== null && lastSearchQuery && (
          <p className="text-white/60 text-sm mb-4">
            for "{lastSearchQuery}"
          </p>
        )}
        {searchResults !== null && (
          <button
            onClick={clearSearch}
            className="px-6 py-3 rounded-full text-sm font-medium"
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
    <>
      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
      <div
        ref={containerRef}
        className="fixed inset-0 overflow-hidden select-none"
        style={{ 
          backgroundColor: '#000', 
          fontFamily: 'Merriweather, serif',
          margin: 0,
          padding: 0,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
      {/* ===== TOP GRADIENT OVERLAY (for status bar readability) ===== */}
      <div
        className="absolute top-0 left-0 right-0 z-30 pointer-events-none"
        style={{ 
          height: '120px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 100%)' 
        }}
      />

      {/* ===== HEADER (TikTok-style, top-left, smaller) ===== */}
      <div
        className="absolute top-0 left-0 z-30 p-4"
        style={{ pointerEvents: 'none' }}
      >
        {/* Left: TS Header */}
        <div 
          style={{
            fontFamily: 'Playfair Display, serif',
            fontWeight: 500,
            fontSize: '32px',
            color: '#000080',
            letterSpacing: '-0.04em',
            textShadow: '0 0 1px rgba(239, 191, 4, 0.4), 0 0 1px rgba(239, 191, 4, 0.4), 0 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          TS
        </div>
        
        {/* Active Mood Filters */}
        {selectedMoods.length > 0 && (
          <div 
            className="flex flex-wrap items-center mt-3"
            style={{
              gap: '8px',
              pointerEvents: 'auto', // Re-enable pointer events for buttons
            }}
          >
            {selectedMoods.map(mood => (
              <button
                key={mood}
                onClick={() => {
                  const newMoods = selectedMoods.filter(m => m !== mood);
                  applyMoodFilter(newMoods);
                }}
                className="flex items-center gap-1.5 font-medium transition-all hover:opacity-80"
                style={{
                  height: '28px',
                  padding: '6px 10px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  backgroundColor: '#D9A903',
                  color: 'white',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <span>{mood}</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', lineHeight: 1 }}>×</span>
              </button>
            ))}
            {noMoodResults && (
              <span 
                className="text-xs italic"
                style={{ color: '#ffcccb', marginLeft: '8px' }}
              >
                No items match these moods
              </span>
            )}
          </div>
        )}

        {/* Voice Transcript (stays visible until user taps mic again) */}
        {isListening && (
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
          <div className="mt-4 flex flex-col items-center gap-2">
            {lastSearchQuery && (
              <div 
                className="px-4 py-2 rounded-full text-sm"
                style={{ 
                  backgroundColor: 'rgba(207, 181, 59, 0.15)',
                  color: COLORS.oldGold,
                  border: `1px solid ${COLORS.oldGold}40`
                }}
              >
                "{lastSearchQuery}"
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: COLORS.oldGold }}>
                {displayListings.length} result{displayListings.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={clearSearch}
                className="text-sm text-white/60 hover:text-white underline"
              >
                Clear
              </button>
            </div>
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
                transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease-out',
                opacity: offset === 0 ? 1 : 0.7,
                zIndex: offset === 0 ? 10 : 5,
                animation: offset === 0 ? 'fadeIn 0.3s ease-out' : 'none',
              }}
            >
              {/* Full-bleed Background Image - Edge-to-edge, no margins/padding, fully tappable */}
              <div 
                className="absolute inset-0 cursor-pointer"
                style={{
                  margin: 0,
                  padding: 0,
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  minHeight: '44px', // Accessibility: ensure tappable area
                  minWidth: '44px',
                }}
                onClick={() => {
                  if (offset === 0) {
                    triggerHaptic();
                    handleCardClick(listing.id);
                  }
                }}
                onTouchEnd={(e) => {
                  // Ensure tap works on touch devices
                  if (offset === 0 && Math.abs(touchDeltaY.current) < 10) {
                    triggerHaptic();
                    handleCardClick(listing.id);
                  }
                }}
              >
                {listingImage ? (
                  <img
                    src={listingImage}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                    style={{
                      margin: 0,
                      padding: 0,
                      display: 'block',
                      width: '100%',
                      height: '100%',
                    }}
                    draggable={false}
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{ 
                      backgroundColor: COLORS.midnightBlue,
                      margin: 0,
                      padding: 0,
                    }}
                  >
                    <span className="text-6xl opacity-30">📦</span>
                  </div>
                )}
              </div>

              {/* Enhanced Gradient Overlays for text readability on both light and dark images */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{ 
                  background: `
                    linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 35%, rgba(0,0,0,0.2) 50%, transparent 70%),
                    linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 25%)
                  `
                }}
              />

              {/* Image Counter - Top Right (only show for current card) */}
              {offset === 0 && (
                <div 
                  className="absolute pointer-events-none z-10"
                  style={{ 
                    top: '16px',
                    right: '16px',
                  }}
                >
                  <div 
                    className="px-3 py-1.5 rounded-full"
                    style={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      backdropFilter: 'blur(8px)',
                      fontSize: '13px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '500',
                    }}
                  >
                    {currentIndex + 1} / {displayListings.length}
                  </div>
                </div>
              )}

              {/* Product Info (TikTok-style bottom-left overlay) */}
              <div 
                className="absolute bottom-0 left-0 text-left pointer-events-none z-10"
                style={{ 
                  paddingLeft: '20px',
                  paddingBottom: '24px',
                  paddingRight: '20px',
                  maxWidth: '80%'
                }}
              >
                {/* Title (white, bold, 22-24px, with enhanced text shadow for readability) */}
                <h1 
                  className="font-bold leading-tight mb-1"
                  style={{ 
                    color: 'white',
                    fontSize: '23px',
                    textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.4)',
                  }}
                >
                  {listing.title}
                </h1>

                {/* Price (gold/yellow, 20px, positioned directly under title, with text shadow) */}
                <p 
                  className="font-bold mb-2"
                  style={{ 
                    color: '#D4AF37',
                    fontSize: '20px',
                    textShadow: '0 2px 6px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3)',
                  }}
                >
                  ${listing.price?.toFixed(2) || '0.00'}
                </p>

                {/* Description (gray/white, 14px, max 2 lines with ellipsis) */}
                {listing.description && (
                  <p 
                    className="mb-2"
                    style={{ 
                      fontSize: '14px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {listing.description}
                  </p>
                )}

                {/* Category Tags - positioned above description (but in visual order, they're below) */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {listing.category && (
                    <span 
                      className="px-3 rounded-full text-xs font-medium"
                      style={{ 
                        height: '32px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(4px)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                      }}
                    >
                      {listing.category}
                    </span>
                  )}
                  {/* Styles - using normalizeTagColumn for consistent parsing */}
                  {normalizeTagColumn(listing.styles).slice(0, 2).map((style: string, i: number) => (
                    <span
                      key={`${style}-${i}`}
                      className="px-3 rounded-full text-xs font-medium"
                      style={{ 
                        height: '32px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(4px)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                      }}
                    >
                      {style}
                    </span>
                  ))}
                </div>

                {/* Seller Info - smaller, under category tags */}
                <div className="flex items-center gap-2 mt-1">
                  {listingSellerAvatar ? (
                    <img 
                      src={listingSellerAvatar} 
                      alt="" 
                      className="rounded-full object-cover"
                      style={{ width: '24px', height: '24px' }}
                    />
                  ) : (
                    <div 
                      className="rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ 
                        width: '24px', 
                        height: '24px',
                        backgroundColor: COLORS.oldGold, 
                        color: COLORS.midnightBlue,
                        fontSize: '10px',
                      }}
                    >
                      {listingSellerName.charAt(0)}
                    </div>
                  )}
                  <span 
                    className="text-xs"
                    style={{ 
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '12px',
                    }}
                  >
                    Sold by {listingSellerName}
                  </span>
                  {listingHasTSBadge && (
                    <img src={TS_BADGE_URL} alt="TS" className="w-3 h-3" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== RIGHT SIDE FLOATING BUTTONS (TikTok-style) ===== */}
      <div 
        className="fixed z-20 flex flex-col"
        style={{ 
          right: '16px',
          top: '50%',
          transform: 'translateY(-20%)', // Slightly below center
          gap: '16px'
        }}
      >
        {/* MOOD WHEEL BUTTON */}
        <div 
          className="relative"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <StandaloneMoodWheel 
            selectedMoods={selectedMoods} 
            onMoodsChange={applyMoodFilter}
            noResults={noMoodResults}
          />
        </div>
        
        {/* BOOKMARK/FAVORITES BUTTON */}
        <button
          onClick={() => currentListing && toggleFavorite(currentListing.id)}
          className="rounded-full hover:opacity-90 transition-all relative flex items-center justify-center"
          style={{ 
            width: '48px',
            height: '48px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
          aria-label="Favorites"
        >
          <Bookmark 
            className="w-6 h-6"
            style={{
              width: '24px',
              height: '24px',
              color: currentListing && favorites.has(currentListing.id) ? COLORS.gold : 'white',
              fill: currentListing && favorites.has(currentListing.id) ? COLORS.gold : 'none',
            }}
          />
          
          {/* Favorites count badge */}
          {favorites.size > 0 && (
            <span 
              className="absolute -top-1 -right-1 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#ef4444' }}
            >
              {favorites.size}
            </span>
          )}
        </button>

        {/* VOICE SEARCH BUTTON */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            triggerHaptic();
            toggleVoice();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            triggerHaptic();
          }}
          disabled={!isVoiceSupported}
          className="rounded-full hover:opacity-90 transition-all relative flex items-center justify-center disabled:opacity-50 active:scale-95"
          style={{ 
            width: '48px',
            height: '48px',
            minWidth: '44px', // Accessibility: ensure 44px touch target
            minHeight: '44px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            touchAction: 'manipulation', // Improve touch responsiveness
          }}
          aria-label="Voice search"
        >
          <Mic 
            className="w-6 h-6 text-white"
            style={{
              width: '24px',
              height: '24px',
            }}
          />
          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>
      </div>

      {/* ===== DASHBOARD/TS BUTTON (Bottom Right) ===== */}
      <button
        onClick={() => setAccountOpen(true)}
        className="fixed bottom-6 right-6 z-10 w-10 h-10 rounded-full shadow-lg transition-all hover:scale-110 flex items-center justify-center opacity-70 hover:opacity-100"
        style={{ backgroundColor: COLORS.navy }}
        aria-label="Account"
      >
        <TSLogo size={18} primaryColor="#ffffff" accentColor={COLORS.gold} />
      </button>

      {/* Account Sheet */}
      <AccountSheet isOpen={accountOpen} onClose={() => setAccountOpen(false)} />

    </div>
    </>
  );
}
