"use client";

import { useState, useRef, TouchEvent, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Listing, 
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
import { MessageSquare, Bookmark, X } from "lucide-react";
import { FounderBadge } from "../../../components/FounderBadge";
import { GivesBackBadge } from "../../../components/GivesBackBadge";
import { showsGivesBackBadge } from "../../../lib/givesBack";
import { SoldRibbon } from "../../../components/SoldRibbon";
import { JustSoldBanner } from "../../../components/JustSoldBanner";
import TSModal from "../../../components/TSModal";
import {
  parseShippingPreferences,
  generateShippingBannerText,
  isShippingJson,
} from "../../../lib/shippingPreferences";
import { useAppShell } from "../../../hooks/useAppShell";
import { parseListingFrom, resolveListingBack } from "../../../lib/listingNavigation";
import { trackBuyerEvent } from "../../../lib/buyerEvents";
import { buildEventPayload } from "../../../lib/buyerEventContext";
import { MoreLikeThis } from "../../../components/MoreLikeThis";
import {
  type SellerActionType,
  primaryCtaLabel,
  listingActionContext,
  pickupConfirmationMessage,
  contactConfirmationMessage,
  isPickupAction,
  resolvePublicSellerName,
  pickupModalTitle,
  inquiryModalIntro,
  pickupSubmitLabel,
} from "../../../lib/sellerActionType";
import { supabase } from "../../../lib/supabaseClient";

const CHROME_GLASS = "rgba(22, 25, 58, 0.48)";
const CHROME_GLASS_BORDER = "rgba(237, 233, 225, 0.25)";

interface ProductDetailsProps {
  listing: Listing;
  sellerActionType: SellerActionType;
  pickupLabel?: string | null;
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

export default function ProductDetails({
  listing,
  sellerActionType,
  pickupLabel,
}: ProductDetailsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingFrom = parseListingFrom(searchParams.get("from"));
  const listingBack = resolveListingBack(listingFrom);
  const { user } = useAuth();
  useAppShell("linen");
  const images = getListingImages(listing);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  const [showSellerDrawer, setShowSellerDrawer] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [contactSellerOpen, setContactSellerOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [contactSending, setContactSending] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquirySending, setInquirySending] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState<string | null>(null);
  const [inquiryError, setInquiryError] = useState<string | null>(null);

  const listingViewLogged = useRef(false);

  // Track recently viewed + buyer event (once per page load)
  useEffect(() => {
    if (user && listing) {
      if (!listingViewLogged.current) {
        listingViewLogged.current = true;
        trackBuyerEvent('listing_view', {
          listingId: listing.id,
          payload: buildEventPayload({
            surface: 'listing_detail',
            listing,
            extra: { from: listingFrom },
          }),
        });
      }
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
        if (user) {
          trackBuyerEvent('share', {
            listingId: listing.id,
            payload: buildEventPayload({
              surface: 'listing_detail',
              listing,
              extra: { method: 'native_share', from: listingFrom },
            }),
          });
        }
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShowShareSuccess(true);
        setTimeout(() => setShowShareSuccess(false), 2000);
        if (user) {
          trackBuyerEvent('share', {
            listingId: listing.id,
            payload: buildEventPayload({
              surface: 'listing_detail',
              listing,
              extra: { method: 'clipboard', from: listingFrom },
            }),
          });
        }
      }
    } catch {
      // User cancelled share sheet — no event
    }
  }, [listing, listing.title, listing.price, listingFrom, user]);

  // Get seller info (store pickup → shop name, not login/email)
  const sellerName = resolvePublicSellerName(listing, sellerActionType);
  const sellerLocation = getSellerLocation(listing);
  const sellerAvatar = getSellerAvatar(listing);
  const sellerRating = getSellerRating(listing);
  const reviewCount = getSellerReviewCount(listing);
  const sellerStory = getSellerStory(listing);
  const isFoundingSeller = listing.profiles?.is_founding_seller === true;
  const givesBack = showsGivesBackBadge(listing.profiles);
  const givesBackName = listing.profiles?.gives_back_name ?? null;
  const givesBackPct = listing.profiles?.gives_back_pct ?? null;
  const isNonProfit = listing.profiles?.is_non_profit_org === true;
  
  // Check TS badge
  const hasTSBadge = hasSellerTSBadge(listing);
  
  // State for expanding seller story
  const [isSellerStoryExpanded, setIsSellerStoryExpanded] = useState(false);
  const [badgeInfoOpen, setBadgeInfoOpen] = useState<"founding" | "givesBack" | null>(null);

  // Collect all tags
  const tags = [
    listing.category,
    ...(listing.styles || []),
    ...(listing.intents || []),
  ].filter(Boolean);
  const isSold = listing.status === "sold";

  const ctaLabel = primaryCtaLabel(sellerActionType);
  const actionContext = listingActionContext(sellerActionType, {
    storeName: sellerName,
    pickupLabel,
    locationCity: listing.profiles?.location_city,
  });

  const handleSubmitInquiry = async () => {
    if (!user) return;
    if (sellerActionType === "contact_seller" && !inquiryMessage.trim()) {
      setInquiryError("Please add a short message for the seller.");
      return;
    }

    setInquiryError(null);
    setInquirySending(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setInquiryError("Please sign in again.");
        return;
      }

      const inquiryType = isPickupAction(sellerActionType) ? "reserve" : "contact";

      const res = await fetch("/api/listings/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          listingId: listing.id,
          inquiryType,
          message: inquiryMessage.trim() || undefined,
          buyerPhone: inquiryPhone.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setInquiryError(data.error || "Something went wrong. Please try again.");
        return;
      }
      const storeName =
        pickupLabel?.trim() || sellerName || "the seller";
      setInquirySuccess(
        data.confirmationMessage ||
          (inquiryType === "reserve"
            ? pickupConfirmationMessage(sellerActionType, storeName)
            : contactConfirmationMessage(sellerName))
      );
      setInquiryMessage("");
      setInquiryPhone("");
      trackBuyerEvent(
        inquiryType === "reserve" ? "reserve_listing" : "contact_seller",
        {
          listingId: listing.id,
          payload: buildEventPayload({
            surface: "listing_detail",
            listing,
            extra: { seller_action_type: sellerActionType, from: listingFrom },
          }),
        }
      );
    } catch {
      setInquiryError("Something went wrong. Please try again.");
    } finally {
      setInquirySending(false);
    }
  };

  const handlePrimaryCta = () => {
    if (!user) {
      const redirect =
        sellerActionType === "stripe_checkout"
          ? `/checkout/${listing.id}`
          : `/listing/${listing.id}`;
      router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }
    if (sellerActionType === "stripe_checkout") {
      router.push(`/checkout/${listing.id}`);
      return;
    }
    setInquirySuccess(null);
    setInquiryError(null);
    setInquiryMessage("");
    setInquiryPhone("");
    setInquiryOpen(true);
  };

  const handleSendMessage = async () => {
    const trimmed = contactMessage.trim();
    if (!trimmed || !user) return;
    setContactError(null);
    setContactSending(true);
    try {
      const res = await fetch("/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          buyerUserId: user.id,
          messageBody: trimmed,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setContactError(data.error || "Failed to send message");
        return;
      }
      setContactSuccess(true);
      setContactMessage("");
      trackBuyerEvent('contact_seller', {
        listingId: listing.id,
        payload: buildEventPayload({
          surface: 'listing_detail',
          listing,
          extra: { from: listingFrom },
        }),
      });
    } catch {
      setContactError("Something went wrong. Please try again.");
    } finally {
      setContactSending(false);
    }
  };

  return (
    <main className="min-h-screen text-gray-900" style={{ backgroundColor: 'var(--background)' }}>
      {/* Fixed Header — back to browse, canvas, or favorites depending on entry */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={listingBack.href}
            className="w-10 h-10 flex items-center justify-center backdrop-blur-md rounded-full text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: CHROME_GLASS, border: `1px solid ${CHROME_GLASS_BORDER}` }}
            aria-label={`Back to ${listingBack.label}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <Link href={listingBack.href} className="opacity-80 hover:opacity-100 transition-opacity" aria-label={listingBack.label}>
            <TSLogo size={28} primaryColor="#ffffff" accentColor="var(--gold-accent)" />
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
              <div key={index} className="relative w-full h-full flex-shrink-0" style={{ backgroundColor: 'var(--background)' }}>
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
          <div className="relative w-full h-full flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
            <span className="text-gray-400 text-6xl">📦</span>
          </div>
        )}

        {/* Swipe Arrows for Desktop */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => currentImageIndex > 0 && setCurrentImageIndex(prev => prev - 1)}
              className={`hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center backdrop-blur-sm rounded-full text-white transition-opacity ${
                currentImageIndex === 0 ? "opacity-30 cursor-not-allowed" : "hover:opacity-90"
              }`}
              style={{ backgroundColor: CHROME_GLASS, border: `1px solid ${CHROME_GLASS_BORDER}` }}
              disabled={currentImageIndex === 0}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => currentImageIndex < images.length - 1 && setCurrentImageIndex(prev => prev + 1)}
              className={`hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center backdrop-blur-sm rounded-full text-white transition-opacity ${
                currentImageIndex === images.length - 1 ? "opacity-30 cursor-not-allowed" : "hover:opacity-90"
              }`}
              style={{ backgroundColor: CHROME_GLASS, border: `1px solid ${CHROME_GLASS_BORDER}` }}
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
          <div
            className="absolute top-4 right-4 px-3 py-1.5 backdrop-blur-md rounded-full flex items-center gap-1.5"
            style={{ backgroundColor: CHROME_GLASS, border: `1px solid ${CHROME_GLASS_BORDER}` }}
          >
            <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            <span className="text-xs text-white/60">Tap to zoom</span>
          </div>
        )}

        {/* Gradient fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: 'linear-gradient(to top, var(--background) 0%, rgba(237, 233, 225, 0.5) 50%, transparent 100%)' }} />
      </section>

      {/* Product Info */}
      <section className="px-6 pt-4 pb-6">
        {/* Title & Price */}
        <div>
          <h1 className="text-base sm:text-lg text-gray-900 leading-tight mb-1 discovery-title">
            {listing.title}
          </h1>
          <p className="text-lg font-semibold text-gray-900 font-system">
            ${listing.price}
          </p>
          {actionContext && !isSold && (
            <div className="mt-2 rounded-lg border border-gray-200 bg-white/60 px-3 py-2">
              <p className="text-sm font-medium text-gray-900 font-system">
                {actionContext.headline}
              </p>
              {actionContext.subline && (
                <p className="text-xs text-gray-600 mt-0.5 font-system">
                  {actionContext.subline}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Shipping Info: listing override or seller default (JSON → generated text, else plain) */}
        {(() => {
          const raw = (listing as { custom_shipping_policy?: string | null }).custom_shipping_policy?.trim()
            || (listing.profiles as { shipping_info?: string | null } | undefined)?.shipping_info?.trim()
            || '';
          let shippingText: string;
          if (raw && isShippingJson(raw)) {
            const prefs = parseShippingPreferences(raw);
            shippingText = prefs ? generateShippingBannerText(prefs) : raw || 'Free shipping';
          } else {
            shippingText = raw || 'Free shipping';
          }
          const parts = shippingText.split(/\s*\/\s*|\n/).map(s => s.trim()).filter(Boolean);
          let line1 = parts[0] || 'Free shipping';
          let line2: string | null = parts[1] || null;
          // Avoid showing a tiny fragment (e.g. single "U") on its own line: fold into line1
          if (line2 && line2.length <= 2) {
            line1 = [line1, line2].filter(Boolean).join(' ');
            line2 = null;
          }
          return (
            <div className="mt-4 flex items-center gap-3 py-2.5 px-4 rounded-xl" style={{ backgroundColor: '#16193a' }}>
              <svg className="w-5 h-5 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <div>
                <p className="text-sm font-medium text-white">{line1}</p>
                {line2 && <p className="text-sm font-medium text-white">{line2}</p>}
              </div>
            </div>
          );
        })()}

        {/* Description */}
        {listing.description && (
          <div className="mt-6 mb-5">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">
              Description
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {listing.description}
            </p>
          </div>
        )}

        {/* Story */}
        {listing.story_text && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Story
            </h2>
            <p className="text-gray-700 leading-relaxed italic border-l-2 border-gray-200 pl-4">
              {listing.story_text}
            </p>
          </div>
        )}

        {/* Condition */}
        {listing.condition && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Condition
            </h2>
            <p className="text-gray-700">{mapConditionValue(listing.condition)}</p>
            {listing.seller_notes && (
              <div className="mt-2">
                <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Seller's Notes
                </h3>
                <p className="text-gray-700 leading-relaxed italic border-l-2 border-gray-200 pl-4">
                  {listing.seller_notes}
                </p>
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

        <MoreLikeThis listingId={listing.id} />

        {/* Seller Section */}
        <div className="mt-8">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-gray-900 font-editorial">
              {sellerName}
            </span>
            {hasTSBadge && (
              <img 
                src={TS_BADGE_URL}
                alt="ThriftShopper Verified"
                className="w-4 h-4 flex-shrink-0"
              />
            )}
          </div>
          {sellerLocation && (
            <p className="text-sm text-gray-500">{sellerLocation}</p>
          )}
          {sellerStory && (
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">
              {sellerStory}
            </p>
          )}
          {(isFoundingSeller || givesBack) && (
            <div className="mt-2 flex flex-wrap gap-2">
              {isFoundingSeller && (
                <button
                  type="button"
                  onClick={() => setBadgeInfoOpen((prev) => (prev === "founding" ? null : "founding"))}
                  className="inline-flex"
                  aria-label="Founding Seller badge details"
                >
                  <FounderBadge />
                </button>
              )}
              {givesBack && (
                <button
                  type="button"
                  onClick={() => setBadgeInfoOpen((prev) => (prev === "givesBack" ? null : "givesBack"))}
                  className="inline-flex"
                  aria-label="Gives Back badge details"
                >
                  <GivesBackBadge />
                </button>
              )}
            </div>
          )}
          {badgeInfoOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setBadgeInfoOpen(null)}
                aria-hidden="true"
              />
              <div className="relative z-20 mt-3 inline-block w-fit max-w-[260px] rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md text-[11px] text-gray-600 animate-fade-in">
                <div className="flex items-start justify-between gap-3">
                  <p className="leading-relaxed">
                    {badgeInfoOpen === "founding"
                      ? `${sellerName || "This seller"} is a founding member of ThriftShopper, helping build the future of secondhand discovery.`
                      : isNonProfit
                      ? `${sellerName || "This seller"} is a registered non-profit. 100% of proceeds support their mission.`
                      : givesBackName
                      ? `${sellerName || "This seller"} gives back${givesBackPct ? ` ${givesBackPct}% of sales` : ""} to ${givesBackName}.`
                      : `${sellerName || "This seller"} gives back to charity.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => setBadgeInfoOpen(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close badge details"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </>
          )}
          {/* Contact Seller - subtle link (hidden when primary CTA is Ask About This) */}
          {!isSold && sellerActionType !== "contact_seller" && (
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  router.push(
                    `/login?redirect=${encodeURIComponent(`/listing/${listing.id}`)}`
                  );
                  return;
                }
                setContactError(null);
                setContactSuccess(false);
                setContactMessage("");
                setContactSellerOpen(true);
              }}
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#16193a] hover:text-[#0f1230] font-medium transition-colors"
            >
              <MessageSquare className="h-4 w-4" style={{ color: "var(--gold-accent)" }} />
              Contact seller
            </button>
          )}
        </div>
      </section>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 backdrop-blur-lg border-t border-gray-200" style={{ backgroundColor: 'rgba(237, 231, 217, 0.95)' }}>
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          {/* Left: Bookmark Button */}
          <FavoriteButton
            listingId={listing.id}
            variant="detail"
            listing={listing}
            surface="listing_detail"
          />

          {/* Center: Primary CTA */}
          {isSold ? (
            <div className="flex-1">
              <JustSoldBanner />
            </div>
          ) : (
            <button
              onClick={handlePrimaryCta}
              className="flex-1 h-14 font-bold text-lg rounded-full transition-colors shadow-md"
              style={{
                backgroundColor: "#16193a",
                color: "#ffffff",
              }}
            >
              {ctaLabel}
            </button>
          )}

          {/* Right: Message/Share Button */}
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

      {/* Contact Seller Modal */}
      <TSModal
        isOpen={contactSellerOpen}
        onClose={() => {
          setContactSellerOpen(false);
          setContactError(null);
          setContactSuccess(false);
          setContactMessage("");
        }}
        title="Contact seller"
      >
        <div className="space-y-4">
          {!user ? (
            <div className="space-y-3">
              <p className="text-sm text-white/90">
                Please sign in to message the seller.
              </p>
              <button
                type="button"
                onClick={() => {
                  setContactSellerOpen(false);
                  router.push(
                    `/login?redirect=${encodeURIComponent(`/listing/${listing.id}`)}`
                  );
                }}
                className="w-full px-4 py-2 text-sm font-semibold rounded-lg"
                style={{
                  backgroundColor: "var(--gold-accent)",
                  color: "var(--ink-primary)",
                }}
              >
                Sign in
              </button>
            </div>
          ) : contactSuccess ? (
            <p className="text-sm text-white/90">
              Your message was sent. The seller will reply to your email.
            </p>
          ) : (
            <>
              <p className="text-xs text-white/70">
                Ask a question about this listing. Your message will be emailed to the seller.
              </p>
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Your message..."
                rows={4}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[rgba(197,160,40,0.5)]"
                disabled={contactSending}
              />
              {contactError && (
                <p className="text-xs text-red-300">{contactError}</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setContactSellerOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={contactSending || !contactMessage.trim()}
                  className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "var(--gold-accent)",
                    color: "var(--ink-primary)",
                  }}
                >
                  {contactSending ? "Sending…" : "Send message"}
                </button>
              </div>
            </>
          )}
        </div>
      </TSModal>

      {/* Local / store pickup or contact seller */}
      <TSModal
        isOpen={inquiryOpen}
        onClose={() => {
          setInquiryOpen(false);
          setInquiryError(null);
          setInquirySuccess(null);
          setInquiryMessage("");
          setInquiryPhone("");
        }}
        title={
          inquirySuccess
            ? "Thanks!"
            : pickupModalTitle(sellerActionType)
        }
      >
        <div className="space-y-4">
          {inquirySuccess ? (
            <div className="space-y-2">
              {inquirySuccess.split("\n\n").map((paragraph) => (
                <p key={paragraph} className="text-sm text-white/90 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : (
            <>
              <p className="text-xs text-white/70">
                {inquiryModalIntro(sellerActionType, pickupLabel)}
              </p>
              {sellerActionType === "contact_seller" && (
                <textarea
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  placeholder="Ask about pickup, shipping, or this item…"
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[rgba(197,160,40,0.5)]"
                  disabled={inquirySending}
                />
              )}
              {isPickupAction(sellerActionType) && (
                <>
                  <input
                    type="tel"
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    placeholder="Phone (optional)"
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(197,160,40,0.5)]"
                    disabled={inquirySending}
                  />
                  <textarea
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    placeholder="Note for seller (optional)"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[rgba(197,160,40,0.5)]"
                    disabled={inquirySending}
                  />
                </>
              )}
              {inquiryError && (
                <p className="text-xs text-red-300">{inquiryError}</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInquiryOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitInquiry}
                  disabled={inquirySending}
                  className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "var(--gold-accent)",
                    color: "var(--ink-primary)",
                  }}
                >
                  {inquirySending
                    ? "Sending…"
                    : isPickupAction(sellerActionType)
                      ? pickupSubmitLabel(sellerActionType)
                      : "Contact Seller"}
                </button>
              </div>
            </>
          )}
        </div>
      </TSModal>

      {/* FULLSCREEN IMAGE ZOOM MODAL */}
      {isZoomed && images.length > 0 && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ backgroundColor: 'var(--background)' }}
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
  );
}