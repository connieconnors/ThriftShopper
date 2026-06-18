"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Flag, Ban } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { ReportListingModal } from "@/components/ReportListingModal";
import { BlockUserModal } from "@/components/BlockUserModal";

interface ListingModerationMenuProps {
  listingId: string;
  sellerId: string;
  sellerName?: string;
  leaveAfterBlock?: boolean;
  leaveHref?: string;
  className?: string;
  iconClassName?: string;
}

export function ListingModerationMenu({
  listingId,
  sellerId,
  sellerName,
  leaveAfterBlock = false,
  leaveHref = "/browse",
  className = "",
  iconClassName = "text-white",
}: ListingModerationMenuProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const requireAuth = () => {
    if (user) return true;
    router.push(`/login?redirect=/listing/${listingId}`);
    return false;
  };

  return (
    <>
      <div className={`relative ${className}`} ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="w-10 h-10 flex items-center justify-center backdrop-blur-md rounded-full transition-colors hover:opacity-90"
          style={{
            backgroundColor: "rgba(22, 25, 58, 0.48)",
            border: "1px solid rgba(237, 233, 225, 0.25)",
          }}
          aria-label="Listing options"
        >
          <MoreVertical size={20} className={iconClassName} />
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-12 w-52 rounded-xl shadow-lg border border-gray-200 bg-white py-1 z-50 overflow-hidden"
            role="menu"
          >
            <button
              type="button"
              role="menuitem"
              className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-gray-50 font-system"
              style={{ color: "#16193a" }}
              onClick={() => {
                setMenuOpen(false);
                if (requireAuth()) setReportOpen(true);
              }}
            >
              <Flag size={16} />
              Report listing
            </button>
            <button
              type="button"
              role="menuitem"
              className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-gray-50 font-system"
              style={{ color: "#16193a" }}
              onClick={() => {
                setMenuOpen(false);
                if (requireAuth()) setBlockOpen(true);
              }}
            >
              <Ban size={16} />
              Block seller
            </button>
          </div>
        )}
      </div>

      <ReportListingModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        listingId={listingId}
        reportedUserId={sellerId}
      />

      <BlockUserModal
        isOpen={blockOpen}
        onClose={() => setBlockOpen(false)}
        blockedUserId={sellerId}
        blockedUserName={sellerName}
        sourceListingId={listingId}
        onBlocked={() => {
          if (leaveAfterBlock) router.push(leaveHref);
        }}
      />
    </>
  );
}
