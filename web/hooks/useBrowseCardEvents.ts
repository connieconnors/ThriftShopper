'use client';

import { useEffect, useRef } from 'react';
import type { Listing } from '../lib/types';
import { trackBuyerEvent } from '../lib/buyerEvents';
import { buildEventPayload, resolveDeckSurface } from '../lib/buyerEventContext';

const DWELL_MS = 2500;

type UseBrowseCardEventsArgs = {
  enabled: boolean;
  currentListing: Listing | undefined;
  currentIndex: number;
  deckSize: number;
  searchResults: Listing[] | null;
  selectedMoods: string[];
  lastSearchQuery: string;
  pickedIdSet: Set<string>;
  onCardClick?: (listingId: string) => void;
};

/**
 * Tier A browse signals: impression, dwell, skip (no UI changes).
 */
export function useBrowseCardEvents({
  enabled,
  currentListing,
  currentIndex,
  deckSize,
  searchResults,
  selectedMoods,
  lastSearchQuery,
  pickedIdSet,
}: UseBrowseCardEventsArgs) {
  const impressionLoggedRef = useRef<Set<string>>(new Set());
  const dwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dwellLoggedRef = useRef<Set<string>>(new Set());
  const prevIndexRef = useRef<number>(0);
  const prevListingIdRef = useRef<string | null>(null);
  const navigatedByClickRef = useRef(false);

  const browseContext = () => ({
    activeMoods: selectedMoods,
    activeSearchQuery: lastSearchQuery || undefined,
    deckSize,
  });

  // Impression + dwell timer for active card
  useEffect(() => {
    if (!enabled || !currentListing?.id) return;

    const surface = resolveDeckSurface(searchResults, currentListing, pickedIdSet);
    const impressionKey = `${currentListing.id}:${surface}`;

    if (!impressionLoggedRef.current.has(impressionKey)) {
      impressionLoggedRef.current.add(impressionKey);
      trackBuyerEvent('listing_impression', {
        listingId: currentListing.id,
        payload: buildEventPayload({
          surface,
          position: currentIndex,
          listing: currentListing,
          ...browseContext(),
        }),
      });
    }

    if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
    const listingId = currentListing.id;
    const dwellKey = `${listingId}:${surface}`;

    dwellTimerRef.current = setTimeout(() => {
      if (navigatedByClickRef.current) return;
      if (dwellLoggedRef.current.has(dwellKey)) return;
      dwellLoggedRef.current.add(dwellKey);
      trackBuyerEvent('listing_dwell', {
        listingId,
        payload: buildEventPayload({
          surface,
          position: currentIndex,
          listing: currentListing,
          extra: { dwell_ms: DWELL_MS },
          ...browseContext(),
        }),
      });
    }, DWELL_MS);

    return () => {
      if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
    };
  }, [
    enabled,
    currentListing?.id,
    currentIndex,
    deckSize,
    searchResults,
    selectedMoods,
    lastSearchQuery,
    pickedIdSet,
  ]);

  // Skip when advancing to next card without click
  useEffect(() => {
    if (!enabled) return;

    const prevIndex = prevIndexRef.current;
    const prevListingId = prevListingIdRef.current;

    if (
      prevListingId &&
      currentIndex > prevIndex &&
      !navigatedByClickRef.current
    ) {
      const prevListing = { id: prevListingId } as Listing;
      const surface = resolveDeckSurface(searchResults, prevListing, pickedIdSet);
      trackBuyerEvent('listing_skip', {
        listingId: prevListingId,
        payload: buildEventPayload({
          surface,
          position: prevIndex,
          extra: { to_index: currentIndex },
          ...browseContext(),
        }),
      });
    }

    prevIndexRef.current = currentIndex;
    prevListingIdRef.current = currentListing?.id ?? null;
    navigatedByClickRef.current = false;
  }, [
    enabled,
    currentIndex,
    currentListing?.id,
    deckSize,
    searchResults,
    selectedMoods,
    lastSearchQuery,
    pickedIdSet,
  ]);

  const trackListingClick = (listing: Listing) => {
    if (!enabled) return;
    navigatedByClickRef.current = true;
    if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
    const surface = resolveDeckSurface(searchResults, listing, pickedIdSet);
    trackBuyerEvent('listing_click', {
      listingId: listing.id,
      payload: buildEventPayload({
        surface,
        position: currentIndex,
        listing,
        ...browseContext(),
      }),
    });
  };

  return { trackListingClick };
}
