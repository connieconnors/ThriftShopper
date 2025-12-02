"use client";

import { useState, useRef, TouchEvent, useCallback } from "react";
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
  getListingImages,
  TS_BADGE_URL
} from "../../../lib/types";
import FavoriteButton from "../../components/FavoriteButton";
import SellerDrawer from "../../components/SellerDrawer";
import { TSLogo } from "../../../components/TSLogo";

interface ProductDetailsProps {
  listing: Listing;
}

export default function ProductDetails({ listing }: ProductDetailsProps) {
  const router = useRouter();
  const images = getListingImages(listing);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  const [showSellerDrawer, setShowSellerDrawer] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  
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
  
  // Check TS badge
  const hasTSBadge = hasSellerTSBadge(listing);

  // Collect all tags
  const tags = [
    listing.category,
    ...(listing.styles || []),
    ...(listing.intents || []),
  ].filter(Boolean);

  return (
    <main className="min-h-screen bg-black text-white">
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
        className="relative w-full h-[55vh] sm:h-[60vh] overflow-hidden"
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
              <div key={index} className="w-full h-full flex-shrink-0">
                <img
                  src={src}
                  alt={`${listing.title} - Image ${index + 1}`}
                  className="w-full h-full object-cover cursor-pointer"
                  draggable={false}
                  onClick={() => setIsZoomed(true)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
            <span className="text-slate-500 text-6xl">📦</span>
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
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />
      </section>

      {/* Product Info */}
      <section className="px-6 py-6 space-y-6">
        {/* Title & Price */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-2">
            {listing.title}
          </h1>
          <p className="text-3xl font-bold text-white">
            ${listing.price}
          </p>
        </div>

        {/* Shipping Info */}
        <div className="flex items-center gap-3 py-3 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <div>
            <p className="text-sm font-medium text-emerald-400">Free shipping</p>
            <p className="text-xs text-white/50">Local pickup + USPS shipping available</p>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1.5 text-xs font-medium bg-white/10 rounded-full text-white/80"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {listing.description && (
          <div>
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-2">
              Description
            </h2>
            <p className="text-white/80 leading-relaxed">
              {listing.description}
            </p>
          </div>
        )}

        {/* Condition */}
        {listing.condition && (
          <div>
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-2">
              Condition
            </h2>
            <p className="text-white/80">{listing.condition}</p>
          </div>
        )}

        {/* Specifications */}
        {listing.specifications && (
          <div>
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-2">
              Specifications
            </h2>
            <p className="text-white/80 whitespace-pre-line">{listing.specifications}</p>
          </div>
        )}

        {/* Seller Section */}
        <div className="pt-4 border-t border-white/10">
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
                <span className="font-semibold text-white group-hover:text-violet-300 transition-colors">
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
                <p className="text-sm text-white/50">{sellerLocation}</p>
              )}
            </div>

            {/* Arrow */}
            <svg className="w-5 h-5 text-white/40 group-hover:text-white/60 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Seller Ratings (temporarily hidden for MVP - no reviews yet) */}
      </section>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-lg border-t border-white/10">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <FavoriteButton listingId={listing.id} variant="detail" />

          <button 
            onClick={() => router.push(`/checkout/${listing.id}`)}
            className="flex-1 h-14 bg-white text-black font-bold text-lg rounded-full hover:bg-white/90 transition-colors"
          >
            Buy Now
          </button>

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

      {/* FULLSCREEN IMAGE ZOOM MODAL */}
      {isZoomed && images.length > 0 && (
        <div 
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          onClick={() => setIsZoomed(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 z-10 w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors"
            aria-label="Close zoom"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-4 z-10 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full">
              <span className="text-sm text-white">
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
                className={`absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full text-white transition-opacity ${
                  currentImageIndex === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-white/20"
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
                className={`absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full text-white transition-opacity ${
                  currentImageIndex === images.length - 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-white/20"
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
                      ? "bg-white w-8"
                      : "bg-white/40 w-2 hover:bg-white/60"
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
