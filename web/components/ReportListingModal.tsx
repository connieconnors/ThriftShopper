"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/context/AuthContext";
import { REPORT_REASONS, type ReportReason } from "@/lib/moderation";

interface ReportListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  reportedUserId: string;
}

export function ReportListingModal({
  isOpen,
  onClose,
  listingId,
  reportedUserId,
}: ReportListingModalProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState<ReportReason>(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!user) {
      setError("Please sign in to report a listing.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          listingId,
          reportedUserId,
          reason,
          details: details.trim() || null,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof payload.error === "string" ? payload.error : "Failed to submit");
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDetails("");
        setReason(REPORT_REASONS[0]);
        onClose();
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <h2 className="text-xl font-editorial mb-4 pr-8" style={{ color: "#16193a" }}>
          Report this listing
        </h2>

        {success ? (
          <p className="text-sm font-system" style={{ color: "#16193a" }}>
            Thank you. We&apos;ll review this within 24 hours.
          </p>
        ) : (
          <>
            <label
              className="block text-xs font-medium mb-1.5 font-system"
              style={{ color: "#16193a" }}
            >
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="w-full mb-4 px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-system focus:outline-none focus:ring-2 focus:ring-[#16193a]/20"
              style={{ color: "#16193a" }}
            >
              {REPORT_REASONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <label
              className="block text-xs font-medium mb-1.5 font-system"
              style={{ color: "#16193a" }}
            >
              Additional details (optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              className="w-full mb-4 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-system resize-none focus:outline-none focus:ring-2 focus:ring-[#16193a]/20"
              style={{ color: "#16193a" }}
              placeholder="Tell us more if helpful"
            />

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
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold font-system flex items-center justify-center gap-2"
                style={{ backgroundColor: "#c5a028", color: "#16193a" }}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
