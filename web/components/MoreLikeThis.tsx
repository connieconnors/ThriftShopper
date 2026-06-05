'use client';

import { useEffect, useState } from 'react';
import type { Listing } from '../lib/types';
import { ListingCarousel } from './ListingCarousel';

type MoreLikeThisProps = {
  listingId: string;
};

export function MoreLikeThis({ listingId }: MoreLikeThisProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/recommendations/similar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listing_id: listingId, limit: 8 }),
        });

        if (!response.ok) {
          setListings([]);
          return;
        }

        const { listings: matches } = await response.json();
        if (!cancelled) {
          setListings(Array.isArray(matches) ? matches : []);
        }
      } catch {
        if (!cancelled) setListings([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  if (loading || listings.length === 0) return null;

  return (
    <div className="mt-10 border-t border-gray-200 pt-8">
      <ListingCarousel
        title="More like this"
        subtitle="Similar finds from the ThriftShopper graph"
        listings={listings}
        from="browse"
        variant="light"
      />
    </div>
  );
}
