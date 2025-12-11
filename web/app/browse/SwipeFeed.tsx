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
import TSAccountDrawer from "../../components/TSAccountDrawer";
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchDeltaY = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [countdown, setCountdown] = useState(8);

  // Navigate to product detail when card is clicked
  const handleCardClick = (listingId: string) => {
    router.push(`/listing/${listingId}`);
  };

  // Filter listings by selected moods (client-side filtering with keyword matching)
  const displayListings = useMemo(() => {
    // Start with either search results or all listings
    let filtered = searchResults ?? listings;
    
    // Apply mood filtering if any moods are selected
    if (selectedMoods.length > 0) {
      console.log('Filtering by moods:', selectedMoods);
      filtered = filtered.filter(listing => {
        // Normalize the listing's mood/style/intent columns
        const listingMoods = normalizeTagColumn(listing.moods);
        const listingStyles = normalizeTagColumn(listing.styles);
        const listingIntents = normalizeTagColumn(listing.intents);
        
        console.log(`Listing "${listing.title}":`, { 
          moods: listingMoods, 
          styles: listingStyles, 
          intents: listingIntents 
        });
        
        // Combine all tags from the listing
        const allTags = [...listingMoods, ...listingStyles, ...listingIntents]
          .map(tag => tag.toLowerCase());
        
        // Check if ALL selected moods match tags from the listing (AND logic)
        const matches = selectedMoods.every(selectedMood => {
          if (typeof selectedMood !== 'string') {
            console.warn('Invalid selectedMood type:', selectedMood);
            return false;
          }
          return allTags.includes(selectedMood.toLowerCase());
        });
        
        console.log(`  → Matches? ${matches}`);
        return matches;
      });
      
      console.log(`Filtered from ${(searchResults ?? listings).length} to ${filtered.length} products`);
    }
    
    return filtered;
  }, [searchResults, listings, selectedMoods]);
  
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
    
    // Clear the transcript after search, but keep lastSearchQuery
    setVoiceTranscript('');
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

  const handleMoodChange = (moods: string[]) => {
    console.log('🎨 Moods updated:', moods);
    setSelectedMoods(moods);
    console.log('🎨 Selected moods now:', moods);
    // Reset to first card when mood filter changes
    setCurrentIndex(0);
  };

  // Force MoodWheel to close when user swipes to next card
  const [moodWheelKey, setMoodWheelKey] = useState(0);
  
  useEffect(() => {
    setMoodWheelKey(prev => prev + 1);
  }, [currentIndex]);

  if (displayListings.length === 0) {
    return (
      <div 
        className="fixed inset-0 flex flex-col items-center justify-center px-6"
        style={{ backgroundColor: COLORS.midnightBlue, fontFamily: 'Merriweather, serif' }}
      >
        <p className="text-white text-xl mb-2">No items found</p>
        {searchResults !== null && lastSearchQuery && (
          <p className="text-white/60 text-sm mb-4">
            for "{lastSearchQuery}"
          </p>
        )}
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

        </div>
        
        {/* Active Mood Filters */}
        {selectedMoods.length > 0 && (
          <div 
            className="flex flex-wrap"
            style={{
              marginTop: '20px',
              marginLeft: '20px',
              gap: '8px'
            }}
          >
            {selectedMoods.map(mood => (
              <button
                key={mood}
                onClick={() => {
                  setSelectedMoods(prev => prev.filter(m => m !== mood));
                  setCurrentIndex(0);
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
          </div>
        )}

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
                  {/* Styles - using normalizeTagColumn for consistent parsing */}
                  {normalizeTagColumn(listing.styles).slice(0, 2).map((style: string, i: number) => (
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
                  ))}
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

      {/* ===== RIGHT SIDE FLOATING BUTTONS (TikTok/Reels style) ===== */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4">
        
        {/* MOOD WHEEL BUTTON */}
        <StandaloneMoodWheel selectedMoods={selectedMoods} onMoodsChange={handleMoodChange} />
        
        {/* BOOKMARK/FAVORITES BUTTON */}
        <button
          onClick={() => currentListing && toggleFavorite(currentListing.id)}
          className="w-12 h-12 rounded-full hover:opacity-90 transition-all shadow-lg relative flex items-center justify-center"
          style={{ backgroundColor: '#000080' }}
          aria-label="Favorites"
        >
          <Bookmark 
            className="w-6 h-6"
            style={{
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
          onClick={toggleVoice}
          disabled={!isVoiceSupported}
          className="w-12 h-12 rounded-full hover:opacity-90 transition-all shadow-lg relative flex items-center justify-center"
          style={{ backgroundColor: '#000080' }}
          aria-label="Voice search"
        >
          <Mic 
            className="w-6 h-6 text-white"
          />
          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>
      </div>

      {/* ===== DASHBOARD/TS BUTTON (Bottom Right) ===== */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-10 w-10 h-10 rounded-full shadow-lg transition-all hover:scale-110 flex items-center justify-center opacity-70 hover:opacity-100"
        style={{ backgroundColor: COLORS.navy }}
        aria-label="Account"
      >
        <TSLogo size={18} primaryColor="#ffffff" accentColor={COLORS.gold} />
      </button>

      {/* Account Drawer */}
      <TSAccountDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* ===== COUNTER (Bottom Center) ===== */}
      <div 
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}
      >
        <span className="text-sm" style={{ color: COLORS.oldGold }}>
          {currentIndex + 1} / {displayListings.length}
        </span>
      </div>
    </div>
  );
}
