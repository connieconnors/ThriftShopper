"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import {
  WelcomeBrandHeader,
  authPrimaryButtonClass,
  authSecondaryButtonClass,
  authLinkClass,
} from "./WelcomeBrandHeader";

interface AccountSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSupport?: () => void;
}

const AccountSheet: React.FC<AccountSheetProps> = ({ isOpen, onClose, onOpenSupport }) => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isSeller, setIsSeller] = useState(false);
  const [loading, setLoading] = useState(true);
  const dismissGuardRef = useRef(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync guard — useEffect runs too late; opening tap hits backdrop first on mobile.
  useLayoutEffect(() => {
    if (!isOpen) {
      dismissGuardRef.current = false;
      return;
    }

    dismissGuardRef.current = true;
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => {
      dismissGuardRef.current = false;
    }, 400);

    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (user) {
      setLoading(true);
      const checkSellerStatus = async () => {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("is_seller")
            .eq("user_id", user.id)
            .single();

          setIsSeller(profile?.is_seller === true);
        } catch (err) {
          console.error("Error checking seller status:", err);
          setIsSeller(false);
        } finally {
          setLoading(false);
        }
      };
      void checkSellerStatus();
    } else {
      setLoading(false);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/25 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !dismissGuardRef.current) {
          onClose();
        }
      }}
    >
      <div
        className="w-[92%] max-w-[380px] mb-6 rounded-[28px] shadow-[0_12px_32px_rgba(22,25,58,0.18)]"
        style={{ backgroundColor: "var(--background)", touchAction: "pan-y" }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-5 pb-1">
          <div className="h-1.5 w-10 rounded-full bg-gray-300/80" />
        </div>

        <div className="px-6 pt-2 pb-6">
          <WelcomeBrandHeader
            title="ThriftShopper"
            titleSize="md"
            subtitle={
              loading
                ? undefined
                : user
                  ? "Your account"
                  : "Sign in to save finds and step into the shop."
            }
            className="mb-5"
          />

          {loading ? (
            <div className="bg-white rounded-2xl shadow-lg px-6 py-8 text-center">
              <div className="animate-spin h-6 w-6 border-2 border-[var(--ink-primary)] border-t-transparent rounded-full mx-auto" />
            </div>
          ) : user ? (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {isSeller ? (
                <>
                  <button
                    onClick={() => {
                      onClose();
                      router.push("/seller");
                    }}
                    className="w-full text-left px-5 py-3.5 text-[15px] font-medium font-system text-[var(--ink-primary)] hover:bg-gray-50 transition-colors"
                  >
                    Your Listings
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      router.push("/sell");
                    }}
                    className="w-full text-left px-5 py-3.5 text-[15px] font-medium font-system text-[var(--ink-primary)] hover:bg-gray-50 transition-colors"
                  >
                    Add New Listing
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      router.push("/canvas");
                    }}
                    className="w-full text-left px-5 py-3.5 text-[15px] font-medium font-system text-[var(--ink-primary)] hover:bg-gray-50 transition-colors"
                  >
                    Your Saved Items
                  </button>
                  <div className="border-t border-gray-100" />
                  {onOpenSupport && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenSupport();
                      }}
                      className="w-full text-left px-5 py-3.5 text-[15px] font-medium font-system text-[var(--ink-primary)] hover:bg-gray-50 transition-colors"
                    >
                      Support
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onClose();
                      router.push("/settings");
                    }}
                    className="w-full text-left px-5 py-3.5 text-[15px] font-medium font-system text-[var(--ink-primary)] hover:bg-gray-50 transition-colors"
                  >
                    Settings
                  </button>
                  <button
                    onClick={async () => {
                      onClose();
                      await signOut();
                      router.push("/browse");
                    }}
                    className="w-full text-left px-5 py-3.5 text-[15px] font-medium font-system text-[var(--gold-accent)] hover:bg-[rgba(197,160,40,0.08)] transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      onClose();
                      router.push("/canvas");
                    }}
                    className="w-full text-left px-5 py-3.5 text-[15px] font-medium font-system text-[var(--ink-primary)] hover:bg-gray-50 transition-colors"
                  >
                    Your Saved Items
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      router.push("/seller/onboarding");
                    }}
                    className="w-full text-left px-5 py-3.5 text-[15px] font-medium font-system text-[var(--ink-primary)] hover:bg-gray-50 transition-colors"
                  >
                    Become a Seller
                  </button>
                  <div className="border-t border-gray-100" />
                  {onOpenSupport && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenSupport();
                      }}
                      className="w-full text-left px-5 py-3.5 text-[15px] font-medium font-system text-[var(--ink-primary)] hover:bg-gray-50 transition-colors"
                    >
                      Support
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onClose();
                      router.push("/settings");
                    }}
                    className="w-full text-left px-5 py-3.5 text-[15px] font-medium font-system text-[var(--ink-primary)] hover:bg-gray-50 transition-colors"
                  >
                    Settings
                  </button>
                  <button
                    onClick={async () => {
                      onClose();
                      await signOut();
                      router.push("/browse");
                    }}
                    className="w-full text-left px-5 py-3.5 text-[15px] font-medium font-system text-[var(--gold-accent)] hover:bg-[rgba(197,160,40,0.08)] transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-5 space-y-3">
              <button
                onClick={() => {
                  onClose();
                  router.push("/login");
                }}
                className={authPrimaryButtonClass}
              >
                Sign In / Create Account
              </button>

              <button
                onClick={() => {
                  onClose();
                  router.push("/signup?seller=true");
                }}
                className={authSecondaryButtonClass}
              >
                Become a Seller
              </button>

              <button onClick={onClose} className={`w-full pt-2 ${authLinkClass}`}>
                Continue Browsing →
              </button>

              <button
                onClick={() => {
                  onClose();
                  router.push("/canvas");
                }}
                className={`w-full text-left px-1 py-1 text-[14px] ${authLinkClass}`}
              >
                Saved Items
              </button>

              {onOpenSupport && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenSupport();
                  }}
                  className={`w-full text-left px-1 py-1 text-[14px] ${authLinkClass}`}
                >
                  Support
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountSheet;
