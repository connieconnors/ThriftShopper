'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { Listing, getPrimaryImage } from '../lib/types';
import { listingHref, type ListingFrom } from '../lib/listingNavigation';
import { trackBuyerEvent } from '../lib/buyerEvents';
import {
  buildEventPayload,
  type RecommendationType,
} from '../lib/buyerEventContext';

type ListingCarouselProps = {
  title: string;
  subtitle?: string;
  listings: Listing[];
  from?: ListingFrom;
  /** 'dark' for browse overlay; 'light' for canvas / listing detail */
  variant?: 'dark' | 'light';
  /** When set, logs recommendation_impression / recommendation_click */
  recommendationType?: RecommendationType;
  trackEvents?: boolean;
};

export function ListingCarousel({
  title,
  subtitle,
  listings,
  from = 'browse',
  variant = 'light',
  recommendationType,
  trackEvents = false,
}: ListingCarouselProps) {
  const impressionLoggedRef = useRef(false);

  useEffect(() => {
    if (!trackEvents || !recommendationType || listings.length === 0) return;
    if (impressionLoggedRef.current) return;
    impressionLoggedRef.current = true;

    const surface =
      recommendationType === 'picked_for_you' ? 'picked_for_you' : 'more_like_this';

    trackBuyerEvent('recommendation_impression', {
      listingId: listings[0]?.id ?? null,
      payload: buildEventPayload({
        surface,
        recommendationType,
        deckSize: listings.length,
        extra: { listing_ids: listings.map((l) => l.id) },
      }),
    });
  }, [trackEvents, recommendationType, listings]);

  if (listings.length === 0) return null;

  const isDark = variant === 'dark';

  const handleRecommendationClick = (listing: Listing) => {
    if (!trackEvents || !recommendationType) return;
    const surface =
      recommendationType === 'picked_for_you' ? 'picked_for_you' : 'more_like_this';
    trackBuyerEvent('recommendation_click', {
      listingId: listing.id,
      payload: buildEventPayload({
        surface,
        recommendationType,
        listing,
      }),
    });
  };

  return (
    <section className="w-full" aria-label={title}>
      <div className="px-4 mb-2">
        <h2
          className="text-sm font-semibold font-editorial tracking-wide"
          style={{ color: isDark ? '#ffffff' : '#16193a' }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="text-xs mt-0.5"
            style={{ color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(22, 25, 58, 0.6)' }}
          >
            {subtitle}
          </p>
        )}
      </div>
      <div
        className="flex gap-3 overflow-x-auto pb-2 px-4 snap-x snap-mandatory scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {listings.map((listing) => {
          const imageUrl = getPrimaryImage(listing);
          return (
            <Link
              key={listing.id}
              href={listingHref(listing.id, from)}
              onClick={() => handleRecommendationClick(listing)}
              className="flex-shrink-0 w-[140px] snap-start rounded-xl overflow-hidden border transition-opacity hover:opacity-90"
              style={{
                backgroundColor: isDark ? 'rgba(22, 25, 58, 0.65)' : '#ffffff',
                borderColor: isDark ? 'rgba(237, 233, 225, 0.25)' : 'rgba(22, 25, 58, 0.12)',
              }}
            >
              <div
                className="aspect-[4/5] w-full bg-black/20 relative"
                style={{ backgroundColor: isDark ? '#000' : '#f3f1ec' }}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-2xl opacity-40">
                    📦
                  </span>
                )}
              </div>
              <div className="p-2.5">
                <p
                  className="text-xs font-medium line-clamp-2 leading-snug"
                  style={{ color: isDark ? '#ffffff' : '#16193a' }}
                >
                  {listing.title}
                </p>
                {typeof listing.price === 'number' && (
                  <p
                    className="text-xs mt-1 font-semibold"
                    style={{ color: isDark ? 'var(--gold-accent)' : '#16193a' }}
                  >
                    ${listing.price}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
