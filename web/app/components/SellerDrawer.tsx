"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { Listing, getPrimaryImage, TS_BADGE_URL } from "../../lib/types";
import { useAuth } from "../context/AuthContext";

interface SellerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId: string;
  sellerName: string;
  sellerLocation: string | null;
  sellerAvatar: string | null;
  hasTSBadge: boolean;
}

export default function SellerDrawer({
  isOpen,
  onClose,
  sellerId,
  sellerName,
  sellerLocation,
  sellerAvatar,
  hasTSBadge,
}: SellerDrawerProps) {
  const [otherListings, setOtherListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && sellerId) {
      fetchSellerListings();
    }
  }, [isOpen, sellerId]);

  const fetchSellerListings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("seller_id", sellerId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(4);

      if (!error && data) {
        setOtherListings(data as Listing[]);
      }
    } catch (err) {
      console.error("Error fetching seller listings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-slate-900 rounded-t-3xl transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "70vh" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        <div className="px-6 pb-8 overflow-y-auto" style={{ maxHeight: "calc(70vh - 20px)" }}>
          {/* Seller Profile Header */}
          <div className="flex items-center gap-4 py-4">
            {/* Avatar */}
            <div className="relative">
              {sellerAvatar ? (
                <img
                  src={sellerAvatar}
                  alt={sellerName}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {sellerName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {/* TS Badge overlay */}
              {hasTSBadge && (
                <img 
                  src={TS_BADGE_URL}
                  alt="TS Verified"
                  className="absolute -bottom-1 -right-1 w-6 h-6 border-2 border-slate-900 rounded-full"
                />
              )}
            </div>

            {/* Name & Location */}
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="text-lg font-bold text-white">{sellerName}</h3>
              </div>
              {sellerLocation && (
                <p className="text-sm text-white/50 flex items-center gap-1 mt-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {sellerLocation}
                </p>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Other Listings */}
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
              More from this seller
            </h4>

            {isLoading ? (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex-shrink-0 w-28">
                    <div className="aspect-square rounded-xl bg-white/10 animate-pulse" />
                    <div className="h-3 bg-white/10 rounded mt-2 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : otherListings.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {otherListings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/listing/${listing.id}`}
                    onClick={onClose}
                    className="flex-shrink-0 w-28 group"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-slate-800">
                      {getPrimaryImage(listing) ? (
                        <img
                          src={getPrimaryImage(listing)}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          📦
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-white mt-2 truncate">
                      ${listing.price}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/40">No other items available</p>
            )}
          </div>

          {/* View All Button */}
          <Link
            href={`/seller/${sellerId}`}
            onClick={onClose}
            className="mt-6 w-full py-3.5 bg-white/10 hover:bg-white/15 text-white font-medium rounded-full text-center block transition-colors"
          >
            View all items
          </Link>

          {/* Subtle Message Seller CTA (only when logged in) */}
          {user && (
            <button
              type="button"
              onClick={() => {
                // Placeholder for Stream Chat channel creation
                console.log("Message seller clicked for", sellerId);
              }}
              className="mt-3 w-full py-2.5 text-sm text-white/80 border border-white/20 rounded-full hover:bg-white/10 transition-colors"
            >
              Message seller
            </button>
          )}
        </div>
      </div>
    </>
  );
}

