"use client";

import { useState, useRef, TouchEvent, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Listing, 
  getSellerDisplayName, 
  getSellerLocation, 
  getSellerAvatar,
  hasSellerTSBadge,
  getSellerRating,
  getSellerReviewCount,
  getSellerStory,
  getListingImages,
  getPrimaryImage,
  TS_BADGE_URL
} from "../../../lib/types";
import FavoriteButton from "../../components/FavoriteButton";
import SellerDrawer from "../../components/SellerDrawer";
import { TSLogo } from "../../../components/TSLogo";
import { useAuth } from "../../context/AuthContext";
import { addRecentlyViewed } from "../../../lib/userPreferences";
import MessagesModal from "../../../components/MessagesModal";
import { StreamChatProvider } from "../../seller/StreamChatProvider";
import { MessageSquare, Bookmark } from "lucide-react";
import { FounderBadge } from "../../../components/FounderBadge";
import { GivesBackBadge } from "../../../components/GivesBackBadge";
import { SoldRibbon } from "../../../components/SoldRibbon";
import { JustSoldBanner } from "../../../components/JustSoldBanner";

interface ProductDetailsProps {
  listing: Listing;
}

// Map old condition values to new ones for graceful migration
function mapConditionValue(condition: string): string {
  const oldToNew: Record<string, string> = {
    'New': 'Pristine',
    'Like New': 'Pristine',
    'Excellent': 'Very Good',
    'Good': 'Very Good',
    'Fair': 'A Few Flaws (see notes)',
  };
  
  // If it's an old value, map it; otherwise return as-is
  return oldToNew[condition] || condition;
}

export default function ProductDetails({ listing }: ProductDetailsProps) {
  const router = useRouter();
  const { user } = useAuth();
  const images = getListingImages(listing);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  const [showSellerDrawer, setShowSellerDrawer] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  // Track recently viewed
  useEffect(() => {
    if (user && listing) {
      const imageUrl = getPrimaryImage(listing);
      addRecentlyViewed(user.id, listing.id, listing.title, imageUrl);
    }
  }, [user, listing]);
  
  // Touch handling for image carousel
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e: TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const delta = currentX - touchStartX.current;
    touchDeltaX.current = delta;
    
    const atStart = currentImageIndex === 0 && delta > 0;
    const atEnd = currentImageIndex === images.length - 1 && delta < 0;
    
    if (atStart || atEnd) {
      setDragOffset(delta * 0.3);
    } else {
      setDragOffset(delta);
    }
  };

  const handleTouchEnd = () => {
    const threshold = 50;
    
    if (touchDeltaX.current < -threshold && currentImageIndex < images.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    } else if (touchDeltaX.current > threshold && currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
    
    setDragOffset(0);
    touchDeltaX.current = 0;
  };

  const handleShare = useCallback(async () => {
    const shareData = {
      title: listing.title,
      text: `Check out ${listing.title} on ThriftShopper - $${listing.price}`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShowShareSuccess(true);
        setTimeout(() => setShowShareSuccess(false), 2000);
      }
    } catch (err) {
      console.log("Share cancelled or failed");
    }
  }, [listing.title, listing.price]);

  // Get seller info
  const sellerName = getSellerDisplayName(listing);
  const sellerLocation = getSellerLocation(listing);
  const sellerAvatar = getSellerAvatar(listing);
  const sellerRating = getSellerRating(listing);
  const reviewCount = getSellerReviewCount(listing);
  const sellerStory = getSellerStory(listing);
  const isFoundingSeller = listing.profiles?.is_founding_seller === true;
  const givesBack = listing.profiles?.gives_back === true;
  
  // Check TS badge
  const hasTSBadge = hasSellerTSBadge(listing);
  
  // State for expanding seller story
  const [isSellerStoryExpanded, setIsSellerStoryExpanded] = useState(false);

  // Collect all tags
  const tags = [
    listing.category,
    ...(listing.styles || []),
    ...(listing.intents || []),
  ].filter(Boolean);
  const isSold = listing.status === "sold";

  return (
    <StreamChatProvider>
    <main className="min-h-screen text-gray-900" style={{ backgroundColor: '#EDE7D9', fontFamily: 'Merriweather, serif' }}>
      {/* Fixed Header - Back to Browse */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/browse"
            className="w-10 h-10 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors"
            aria-label="Back to browse"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <Link href="/browse" className="opacity-80 hover:opacity-100 transition-opacity">
            <TSLogo size={28} primaryColor="#ffffff" accentColor="#efbf04" />
          </Link>
        </div>

        {showShareSuccess && (
          <div className="px-4 py-2 bg-white/90 text-black text-sm font-medium rounded-full">
            Link copied!
          </div>
        )}
      </header>

      {/* Full-Bleed Image Gallery */}
      <section
        className="relative w-full h-[65vh] sm:h-[70vh] overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {images.length > 0 ? (
          <div
            className="flex h-full"
            style={{
              transform: `translateX(calc(-${currentImageIndex * 100}% + ${dragOffset}px))`,
              transition: dragOffset === 0 ? "transform 0.3s ease-out" : "none",
            }}
          >
            {images.map((src, index) => (
              <div key={index} className="relative w-full h-full flex-shrink-0" style={{ backgroundColor: '#EDE7D9' }}>
                <img
                  src={src}
                  alt={`${listing.title} - Image ${index + 1}`}
                  className="w-full h-full object-contain cursor-pointer"
                  draggable={false}
                  onClick={() => setIsZoomed(true)}
                />
                
              </div>
            ))}
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center" style={{ backgroundColor: '#EDE7D9' }}>
            <span className="text-gray-400 text-6xl">📦</span>
          </div>
        )}

        {/* Swipe Arrows for Desktop */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => currentImageIndex > 0 && setCurrentImageIndex(prev => prev - 1)}
              className={`hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-black/40 backdrop-blur-sm rounded-full text-white transition-opacity ${
                currentImageIndex === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-black/60"
              }`}
              disabled={currentImageIndex === 0}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => currentImageIndex < images.length - 1 && setCurrentImageIndex(prev => prev + 1)}
              className={`hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-black/40 backdrop-blur-sm rounded-full text-white transition-opacity ${
                currentImageIndex === images.length - 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-black/60"
              }`}
              disabled={currentImageIndex === images.length - 1}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Image Dots Indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`h-2 rounded-full transition-all duration-200 ${
                  index === currentImageIndex
                    ? "bg-white w-6"
                    : "bg-white/50 w-2 hover:bg-white/70"
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Tap to Zoom Indicator (subtle) */}
        {images.length > 0 && (
          <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full flex items-center gap-1.5">
            <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            <span className="text-xs text-white/60">Tap to zoom</span>
          </div>
        )}

        {/* Gradient fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: 'linear-gradient(to top, #EDE7D9 0%, rgba(237, 231, 217, 0.5) 50%, transparent 100%)' }} />
      </section>

      {/* Product Info */}
      <section className="px-6 py-6 space-y-6">
        {/* Title & Price */}
        <div>
          <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-tight mb-1">
            {listing.title}
          </h1>
          <p className="text-lg font-bold text-gray-900">
            ${listing.price}
          </p>
        </div>

        {/* Shipping Info */}
        <div className="flex items-center gap-3 py-3 px-4 rounded-xl" style={{ backgroundColor: '#191970' }}>
          <svg className="w-5 h-5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <div>
            <p className="text-sm font-medium text-white">Free shipping</p>
            <p className="text-xs text-white/70">Local pickup + USPS shipping available</p>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1.5 text-xs font-medium bg-gray-200 rounded-full text-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {listing.description && (
          <div>
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Description
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {listing.description}
            </p>
          </div>
        )}

        {/* Story (Seller's personal note about the item) */}
        {listing.story_text && (
          <div className="pt-2">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Story
            </h2>
            <p className="text-gray-700 leading-relaxed italic">
              {listing.story_text}
            </p>
          </div>
        )}

        {/* Condition */}
        {listing.condition && (
          <div>
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Condition
            </h2>
            <div className="flex items-start gap-2">
              <p className="text-gray-700">{mapConditionValue(listing.condition)}</p>
              {listing.seller_notes && (
                <span className="text-xs text-gray-500 italic">(see seller notes)</span>
              )}
            </div>
            {listing.seller_notes && (
              <div className="mt-2">
                <h3 className="text-gray-700 italic mb-1" style={{ fontSize: '0.9em' }}>
                  Seller notes:
                </h3>
                <p className="text-gray-700 italic" style={{ fontSize: '0.9em' }}>{listing.seller_notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Specifications */}
        {listing.specifications && (
          <div>
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Specifications
            </h2>
            <p className="text-gray-700 whitespace-pre-line">{listing.specifications}</p>
          </div>
        )}

        {/* Seller Section */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowSellerDrawer(true)}
            className="w-full flex items-center gap-3 group text-left"
          >
            {/* Seller Avatar */}
            <div className="relative flex-shrink-0">
              {sellerAvatar ? (
                <img
                  src={sellerAvatar}
                  alt={sellerName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {sellerName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            
            {/* Seller Name with TS Badge */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-gray-900 group-hover:text-violet-600 transition-colors">
                  {sellerName}
                </span>
                {/* TS Verified Badge Image */}
                {hasTSBadge && (
                  <img 
                    src={TS_BADGE_URL}
                    alt="ThriftShopper Verified"
                    className="w-5 h-5 flex-shrink-0"
                  />
                )}
              </div>
              {sellerLocation && (
                <p className="text-sm text-gray-500">{sellerLocation}</p>
              )}
            </div>

            {/* Arrow */}
            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Seller Story (if exists) */}
          {sellerStory && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p 
                className={`text-sm text-gray-700 leading-relaxed ${
                  !isSellerStoryExpanded ? 'line-clamp-2' : ''
                }`}
              >
                {sellerStory}
              </p>
              {sellerStory.length > 150 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSellerStoryExpanded(!isSellerStoryExpanded);
                  }}
                  className="mt-2 text-sm font-medium text-[#191970] hover:text-[#000080] transition-colors"
                >
                  {isSellerStoryExpanded ? 'Read less' : 'Read more'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Seller Ratings (temporarily hidden for MVP - no reviews yet) */}
      </section>

      {(isFoundingSeller || givesBack) && (
        <div className="flex items-center justify-center gap-2 py-4 px-6">
          {isFoundingSeller && <FounderBadge />}
          {givesBack && <GivesBackBadge />}
        </div>
      )}

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 backdrop-blur-lg border-t border-gray-200" style={{ backgroundColor: 'rgba(237, 231, 217, 0.95)' }}>
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          {/* Left: Bookmark Button */}
          <FavoriteButton listingId={listing.id} variant="detail" />

          {/* Center: Buy Now Button */}
          {isSold ? (
            <div className="flex-1">
              <JustSoldBanner />
            </div>
          ) : (
            <button 
              onClick={() => router.push(`/checkout/${listing.id}`)}
              className="flex-1 h-14 bg-[#191970] text-white font-bold text-lg rounded-full hover:bg-[#00006a] transition-colors shadow-md"
            >
              Buy Now
            </button>
          )}

          {/* Right: Message Seller Button (if logged in and not seller) */}
          {user && user.id !== listing.seller_id && listing.seller_id ? (
            <button
              onClick={() => setShowMessages(true)}
              className="w-14 h-14 flex items-center justify-center rounded-full border-2 border-white/30 text-white hover:border-white/50 transition-colors bg-white/5"
              aria-label="Message seller"
            >
              <MessageSquare className="w-6 h-6" />
            </button>
          ) : user && user.id === listing.seller_id ? (
            <button
              onClick={handleShare}
              className="w-14 h-14 flex items-center justify-center rounded-full border-2 border-white/30 text-white hover:border-white/50 transition-colors"
              aria-label="Share"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleShare}
              className="w-14 h-14 flex items-center justify-center rounded-full border-2 border-white/30 text-white hover:border-white/50 transition-colors"
              aria-label="Share"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Bottom padding for fixed action bar */}
      <div className="h-24" />

      {/* Seller Drawer */}
      <SellerDrawer
        isOpen={showSellerDrawer}
        onClose={() => setShowSellerDrawer(false)}
        sellerId={listing.seller_id}
        sellerName={sellerName}
        sellerLocation={sellerLocation}
        sellerAvatar={sellerAvatar}
        hasTSBadge={hasTSBadge}
      />

      {/* Messages Modal - opens conversation with seller */}
      {user && listing.seller_id && (
        <MessagesModal 
          isOpen={showMessages} 
          onClose={() => setShowMessages(false)}
          initialSellerId={listing.seller_id}
          initialListingId={listing.id}
        />
      )}

      {/* FULLSCREEN IMAGE ZOOM MODAL */}
      {isZoomed && images.length > 0 && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ backgroundColor: '#EDE7D9' }}
          onClick={() => setIsZoomed(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 z-10 w-12 h-12 flex items-center justify-center bg-gray-800/20 backdrop-blur-md rounded-full text-gray-900 hover:bg-gray-800/30 transition-colors"
            aria-label="Close zoom"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-4 z-10 px-4 py-2 bg-gray-800/20 backdrop-blur-md rounded-full">
              <span className="text-sm text-gray-900">
                {currentImageIndex + 1} / {images.length}
              </span>
            </div>
          )}

          {/* Main Image - Swipeable */}
          <div 
            className="relative w-full h-full flex items-center justify-center"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[currentImageIndex]}
              alt={`${listing.title} - Full size`}
              className="max-w-full max-h-full object-contain"
              style={{
                transform: `translateX(${dragOffset}px)`,
                transition: dragOffset === 0 ? "transform 0.3s ease-out" : "none",
              }}
            />
          </div>

          {/* Navigation Arrows for Desktop */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentImageIndex > 0) setCurrentImageIndex(prev => prev - 1);
                }}
                className={`absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-gray-800/20 backdrop-blur-md rounded-full text-gray-900 transition-opacity ${
                  currentImageIndex === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-gray-800/30"
                }`}
                disabled={currentImageIndex === 0}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentImageIndex < images.length - 1) setCurrentImageIndex(prev => prev + 1);
                }}
                className={`absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-gray-800/20 backdrop-blur-md rounded-full text-gray-900 transition-opacity ${
                  currentImageIndex === images.length - 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-gray-800/30"
                }`}
                disabled={currentImageIndex === images.length - 1}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Bottom Dots */}
          {images.length > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    index === currentImageIndex
                      ? "bg-gray-900 w-8"
                      : "bg-gray-900/40 w-2 hover:bg-gray-900/60"
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </main>
    </StreamChatProvider>
  );
}

