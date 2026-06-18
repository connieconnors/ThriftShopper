"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/context/AuthContext";
import { addBlockedUserToStorage } from "@/lib/moderation";

interface BlockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  blockedUserId: string;
  blockedUserName?: string;
  sourceListingId?: string;
  onBlocked?: () => void;
}

export function BlockUserModal({
  isOpen,
  onClose,
  blockedUserId,
  blockedUserName,
  sourceListingId,
  onBlocked,
}: BlockUserModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleBlock = async () => {
    if (!user) {
      setError("Please sign in to block users.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch("/api/blocks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          blockedUserId,
          sourceListingId,
          reportReason: "User chose to block seller from listing",
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof payload.error === "string" ? payload.error : "Failed to block");
      }

      addBlockedUserToStorage(blockedUserId);
      setSuccess(true);
      onBlocked?.();

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const label = blockedUserName?.trim() || "this seller";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-xl p-6 relative"
        style={{ backgroundColor: "#ede9e1" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-black/5"
          aria-label="Close"
        >
          <X size={20} style={{ color: "#16193a" }} />
        </button>

        <h2 className="text-xl font-editorial mb-3 pr-8" style={{ color: "#16193a" }}>
          Block {label}?
        </h2>

        {success ? (
          <p className="text-sm font-system" style={{ color: "#16193a" }}>
            You won&apos;t see listings from this seller anymore. We&apos;ve been notified.
          </p>
        ) : (
          <>
            <p className="text-sm mb-4 font-system text-gray-700 leading-relaxed">
              Their listings will disappear from your feed immediately. We&apos;ll review this
              block and may remove content that violates our policies within 24 hours.
            </p>

            {error && <p className="text-xs text-red-600 mb-3 font-system">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-300 bg-white font-system"
                style={{ color: "#16193a" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBlock}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold font-system flex items-center justify-center gap-2"
                style={{ backgroundColor: "#c5a028", color: "#16193a" }}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Block
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
