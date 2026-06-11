"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Loader2, MessageSquare, X } from "lucide-react";
import { FounderBadge } from "./FounderBadge";
import { GivesBackBadge } from "./GivesBackBadge";
import { showsGivesBackBadge } from "@/lib/givesBack";
import {
  formatSellerTown,
  sellingSinceYear,
} from "@/lib/sellerProfile";
import type { Listing } from "@/lib/types";
import { getSellerAvatar, TS_BADGE_URL, hasSellerTSBadge } from "@/lib/types";

const LINEN = "#ede9e1";
const INK = "#16193a";
const GOLD = "#c5a028";

export type SellerQuickViewProps = {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
  sellerName: string;
  primaryCtaLabel: string;
  isSold: boolean;
  onContactSeller: () => void;
  onPrimaryAction: () => void;
  showContactAction: boolean;
};

export function SellerQuickView({
  isOpen,
  onClose,
  listing,
  sellerName,
  primaryCtaLabel,
  isSold,
  onContactSeller,
  onPrimaryAction,
  showContactAction,
}: SellerQuickViewProps) {
  const [mounted, setMounted] = useState(false);
  const [soldCount, setSoldCount] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const profile = listing.profiles;
  const town = formatSellerTown(
    profile?.location_city,
    profile?.location_state
  );
  const avatarUrl = getSellerAvatar(listing);
  const hasTSBadge = hasSellerTSBadge(listing);
  const isFoundingSeller = profile?.is_founding_seller === true;
  const givesBack = showsGivesBackBadge(profile);
  const description = profile?.seller_description?.trim() || null;
  const story = profile?.seller_story?.trim() || null;
  const displayNotes = profile?.display_notes?.trim() || null;
  const sinceYear = sellingSinceYear(profile?.created_at);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !listing.seller_id) return;
    let cancelled = false;
    (async () => {
      setStatsLoading(true);
      try {
        const res = await fetch(`/api/sellers/${listing.seller_id}/stats`);
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok) {
          if (typeof data.soldCount === "number") setSoldCount(data.soldCount);
        }
      } catch {
        /* omit track record gracefully */
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, listing.seller_id]);

  const handleContact = useCallback(() => {
    onClose();
    onContactSeller();
  }, [onClose, onContactSeller]);

  const handlePrimary = useCallback(() => {
    onClose();
    onPrimaryAction();
  }, [onClose, onPrimaryAction]);

  if (!mounted || !isOpen) return null;

  const panel = (
    <div
      className="relative w-full md:max-w-md md:rounded-2xl md:shadow-xl flex flex-col max-h-[88vh] md:max-h-[85vh]"
      style={{ backgroundColor: LINEN }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Mobile handle / desktop close */}
      <div className="flex items-center justify-center pt-3 pb-1 relative shrink-0 md:pt-4">
        <div
          className="h-1 w-10 rounded-full bg-[#16193a]/20 md:hidden"
          aria-hidden
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-3 p-1 rounded-full text-[#16193a]/50 hover:text-[#16193a] hover:bg-white/60 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 px-5 pb-4 md:px-6">
        {/* Avatar + name */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden border border-[#16193a]/10 bg-white flex items-center justify-center"
            style={{ backgroundColor: "#fff" }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span
                className="text-xl font-editorial"
                style={{ color: INK }}
              >
                {sellerName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0 pt-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2
                className="text-lg font-semibold font-editorial leading-tight"
                style={{ color: INK }}
              >
                {sellerName}
              </h2>
              {hasTSBadge && (
                <img
                  src={TS_BADGE_URL}
                  alt="ThriftShopper Verified"
                  className="w-4 h-4 flex-shrink-0"
                />
              )}
            </div>
            {town && (
              <p className="text-sm text-gray-600 mt-0.5">{town}</p>
            )}
          </div>
        </div>

        {(isFoundingSeller || givesBack) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {isFoundingSeller && <FounderBadge />}
            {givesBack && <GivesBackBadge />}
          </div>
        )}

        {description && (
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            {description}
          </p>
        )}

        {story && (
          <p className="text-sm text-gray-700 leading-relaxed italic mb-3 border-l-2 border-[#16193a]/15 pl-3">
            {story}
          </p>
        )}

        {displayNotes && (
          <div
            className="rounded-xl px-4 py-3 mb-4 border border-[#16193a]/10 bg-white shadow-sm"
          >
            <p className="text-xs font-medium mb-1.5" style={{ color: INK }}>
              For interested buyers
            </p>
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {displayNotes}
            </p>
          </div>
        )}

        {(sinceYear != null || soldCount != null || statsLoading) && (
          <div className="text-xs text-gray-500 space-y-0.5 mb-2">
            {sinceYear != null && (
              <p>Selling since {sinceYear}</p>
            )}
            {statsLoading && soldCount == null && (
              <p className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading track record…
              </p>
            )}
            {soldCount != null && soldCount > 0 && (
              <p>
                {soldCount} item{soldCount === 1 ? "" : "s"} found new homes
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      {!isSold && (
        <div
          className="shrink-0 px-5 pb-5 pt-3 md:px-6 md:pb-6 border-t border-[#16193a]/10 space-y-2"
          style={{ backgroundColor: LINEN }}
        >
          {showContactAction && (
            <button
              type="button"
              onClick={handleContact}
              className="w-full h-11 rounded-full border text-sm font-semibold flex items-center justify-center gap-2 transition-colors hover:bg-white/80"
              style={{ borderColor: INK, color: INK }}
            >
              <MessageSquare className="h-4 w-4" style={{ color: GOLD }} />
              Contact Seller
            </button>
          )}
          <button
            type="button"
            onClick={handlePrimary}
            className="w-full h-11 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: INK }}
          >
            {primaryCtaLabel}
          </button>
        </div>
      )}
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Close seller details"
        onClick={onClose}
      />
      {panel}
    </div>,
    document.body
  );
}

/** Tappable seller preview row with chevron affordance */
export function SellerQuickViewTrigger({
  sellerName,
  sellerLocation,
  town,
  onClick,
  className = "",
}: {
  sellerName: string;
  sellerLocation?: string | null;
  town?: string | null;
  onClick: () => void;
  className?: string;
}) {
  const locationLine = town || sellerLocation;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left w-full group ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span
            className="text-base font-semibold text-gray-900 font-editorial underline decoration-transparent group-hover:decoration-[#16193a]/30 underline-offset-2 transition-colors"
          >
            {sellerName}
          </span>
          {locationLine && (
            <p className="text-sm text-gray-500">{locationLine}</p>
          )}
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 rotate-[-90deg] group-hover:text-gray-600" />
      </div>
    </button>
  );
}
