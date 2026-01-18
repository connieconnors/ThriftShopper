"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import React from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

interface FavoriteButtonProps {
  listingId: string;
  variant?: "card" | "detail" | "small";
  className?: string;
}

export default function FavoriteButton({ 
  listingId, 
  variant = "card",
  className = "" 
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const userId = user?.id;

  // Check if already favorited on mount
  const checkFavoriteStatus = useCallback(async () => {
    if (!userId) {
      // Not logged in - check localStorage only
      const localFavorites = JSON.parse(localStorage.getItem("favorites") || "[]");
      setIsFavorited(localFavorites.includes(listingId));
      setIsLoading(false);
      return;
    }

    try {
      // First check localStorage for immediate response
      const localFavorites = JSON.parse(localStorage.getItem(`favorites_${userId}`) || "[]");
      const isLocalFavorited = localFavorites.includes(listingId);
      setIsFavorited(isLocalFavorited);
      setIsLoading(false);

      // Then verify with Supabase
      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", userId)
        .eq("listing_id", listingId)
        .maybeSingle();

      if (!error) {
        const isDbFavorited = !!data;
        setIsFavorited(isDbFavorited);
        
        // Sync localStorage with DB
        if (isDbFavorited && !isLocalFavorited) {
          const updated = [...localFavorites, listingId];
          localStorage.setItem(`favorites_${userId}`, JSON.stringify(updated));
        } else if (!isDbFavorited && isLocalFavorited) {
          const updated = localFavorites.filter((id: string) => id !== listingId);
          localStorage.setItem(`favorites_${userId}`, JSON.stringify(updated));
        }
      }
    } catch (err) {
      // Table might not exist yet - just use localStorage
      console.log("Using localStorage for favorites");
      setIsLoading(false);
    }
  }, [listingId, userId]);

  useEffect(() => {
    checkFavoriteStatus();
  }, [checkFavoriteStatus]);

  // Listen for updates from other components
  useEffect(() => {
    const handleFavoritesUpdate = (event: CustomEvent) => {
      if (event.detail.listingId === listingId) {
        setIsFavorited(event.detail.isFavorited);
      }
    };

    window.addEventListener("favorites-updated", handleFavoritesUpdate as EventListener);
    return () => {
      window.removeEventListener("favorites-updated", handleFavoritesUpdate as EventListener);
    };
  }, [listingId]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Redirect to login if not authenticated
    if (!userId) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    
    // Optimistic update - change UI immediately
    const newFavoritedState = !isFavorited;
    setIsFavorited(newFavoritedState);

    // Update localStorage immediately
    const localFavorites = JSON.parse(localStorage.getItem(`favorites_${userId}`) || "[]");
    if (newFavoritedState) {
      if (!localFavorites.includes(listingId)) {
        localFavorites.push(listingId);
      }
    } else {
      const index = localFavorites.indexOf(listingId);
      if (index > -1) {
        localFavorites.splice(index, 1);
      }
    }
    localStorage.setItem(`favorites_${userId}`, JSON.stringify(localFavorites));

    // Dispatch custom event so other components can react
    window.dispatchEvent(new CustomEvent("favorites-updated", { 
      detail: { listingId, isFavorited: newFavoritedState } 
    }));

    try {
      if (newFavoritedState) {
        // Add to favorites
        const { error } = await supabase
          .from("favorites")
          .insert({ 
            user_id: userId, 
            listing_id: listingId,
            created_at: new Date().toISOString()
          })
          .select();
          
        if (error) {
          console.error("Error adding favorite:", error.message);
        }
      } else {
        // Remove from favorites
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId)
          .eq("listing_id", listingId);
          
        if (error) {
          console.error("Error removing favorite:", error.message);
        }
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  // Sparkle icon with animation
  const GlintIcon = ({ size = 24 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="transition-colors duration-200"
      fill={isFavorited ? "#D4AF37" : "none"}
      stroke={isFavorited ? "#D4AF37" : "currentColor"}
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 1 L12.6 12 L12 23 L11.4 12 Z" />
      <path d="M4 12 L12 11.6 L20 12 L12 12.4 Z" />
    </svg>
  );

  // Small variant for favorites grid
  if (variant === "small") {
    return (
      <button
        onClick={toggleFavorite}
        disabled={isLoading}
        aria-label={isFavorited ? "Remove from saved" : "Save this find"}
        className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${
          isFavorited 
            ? "bg-[#D4AF37] text-[#191970]" 
            : "bg-black/60 text-white hover:bg-black/80"
        } ${isLoading ? "opacity-50" : ""} ${className}`}
      >
        <GlintIcon size={16} />
      </button>
    );
  }

  // Detail variant for product page - uses Bookmark icon
  if (variant === "detail") {
    return (
      <button
        onClick={toggleFavorite}
        disabled={isLoading}
        aria-label={isFavorited ? "Remove from saved" : "Save this find"}
        className={`w-14 h-14 flex items-center justify-center rounded-full border-2 transition-all duration-200 ${
          isFavorited
            ? "bg-[#D4AF37] border-[#D4AF37] text-[#191970]"
            : "border-white/30 text-white hover:border-[#D4AF37]/50 hover:bg-white/10"
        } ${isLoading ? "opacity-50" : ""} ${className}`}
      >
        <GlintIcon size={24} />
      </button>
    );
  }

  // Card variant (for browse feed)
  return (
    <button
      onClick={toggleFavorite}
      disabled={isLoading}
      aria-label={isFavorited ? "Remove from saved" : "Save this find"}
      className={`w-14 h-14 flex items-center justify-center backdrop-blur-sm rounded-full transition-all duration-200 ${
        isFavorited 
          ? "bg-[#D4AF37] text-[#191970]" 
          : "bg-white/15 text-white hover:bg-white/25"
      } ${isLoading ? "opacity-50" : ""} ${className}`}
    >
      <GlintIcon size={24} />
    </button>
  );
}
