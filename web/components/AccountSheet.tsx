"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";
import { TSLogo } from "./TSLogo";

interface AccountSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccountSheet: React.FC<AccountSheetProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isSeller, setIsSeller] = useState(false);
  const [loading, setLoading] = useState(true);
  const [justOpened, setJustOpened] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Set flag to prevent immediate closure on mobile
      setJustOpened(true);
      const timer = setTimeout(() => {
        setJustOpened(false);
      }, 300); // 300ms delay before allowing backdrop to close
      
      if (user) {
        // Check if user is a seller
        const checkSellerStatus = async () => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('is_seller')
              .eq('user_id', user.id)
              .single();
            
            setIsSeller(profile?.is_seller === true);
          } catch (err) {
            console.error('Error checking seller status:', err);
            setIsSeller(false);
          } finally {
            setLoading(false);
          }
        };
        checkSellerStatus();
      } else {
        setLoading(false);
      }
      
      return () => clearTimeout(timer);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 backdrop-blur-sm"
      onClick={(e) => {
        // Only close if clicking the backdrop, not the modal content
        // Prevent immediate closure on mobile
        if (e.target === e.currentTarget && !justOpened) {
          onClose();
        }
      }}
      onTouchStart={(e) => {
        // Only close if touching the backdrop, not the modal content
        // Prevent immediate closure on mobile
        if (e.target === e.currentTarget && !justOpened) {
          e.preventDefault();
          onClose();
        }
      }}
    >
      {/* iOS-style action sheet */}
      <div
        className="
          w-[92%]
          max-w-[360px]
          mb-6
          rounded-[28px]
          bg-white/95
          shadow-[0_18px_40px_rgba(0,0,0,0.35)]
        "
        style={{ touchAction: 'pan-y' }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          e.stopPropagation();
        }}
        onTouchMove={(e) => {
          e.stopPropagation();
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-8 pb-2">
          <div className="h-1.5 w-10 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex flex-col items-center px-6">
          <div className="flex h-9 w-9 flex-col items-center justify-center rounded-full bg-[#000080]">
            <TSLogo size={36} primaryColor="#ffffff" accentColor="#EFBF04" showStar={true} />
          </div>

          <div className="mt-3 text-[17px] font-semibold text-[#000080]" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
            ThriftShopper
          </div>
        </div>

        {/* Divider */}
        <div className="mt-8 border-t border-gray-200" />

        {/* Content based on auth state */}
        {loading ? (
          <div className="px-6 pt-6 pb-8 text-center">
            <div className="animate-spin h-6 w-6 border-2 border-[#000080] border-t-transparent rounded-full mx-auto" />
          </div>
        ) : user ? (
          /* LOGGED IN STATE */
          <div className="px-6 pt-6">
            {isSeller ? (
              /* SELLER VIEW */
              <>
                <button
                  onClick={() => {
                    onClose();
                    router.push("/seller");
                  }}
                  className="w-full text-left px-4 py-3 text-[15px] font-medium text-[#000080] hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Your Listings
                </button>
                <button
                  onClick={() => {
                    onClose();
                    router.push("/sell");
                  }}
                  className="w-full text-left px-4 py-3 text-[15px] font-medium text-[#000080] hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Add New Listing
                </button>
                <button
                  onClick={() => {
                    onClose();
                    router.push("/canvas");
                  }}
                  className="w-full text-left px-4 py-3 text-[15px] font-medium text-[#000080] hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Your Saved Items
                </button>
                <button
                  onClick={() => {
                    onClose();
                    router.push("/canvas");
                  }}
                  className="w-full text-left px-4 py-3 text-[15px] font-medium text-[#000080] hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Your Messages
                </button>
                <div className="border-t border-gray-200 my-2" />
                <button
                  onClick={() => {
                    onClose();
                    router.push("/settings");
                  }}
                  className="w-full text-left px-4 py-3 text-[15px] font-medium text-[#000080] hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Settings
                </button>
                <button
                  onClick={async () => {
                    onClose();
                    await signOut();
                    router.push("/browse");
                  }}
                  className="w-full text-left px-4 py-3 text-[15px] font-medium text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              /* BUYER VIEW */
              <>
                <button
                  onClick={() => {
                    onClose();
                    router.push("/canvas");
                  }}
                  className="w-full text-left px-4 py-3 text-[15px] font-medium text-[#000080] hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Your Saved Items
                </button>
                <button
                  onClick={() => {
                    onClose();
                    router.push("/canvas");
                  }}
                  className="w-full text-left px-4 py-3 text-[15px] font-medium text-[#000080] hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Your Messages
                </button>
                <button
                  onClick={() => {
                    onClose();
                    router.push("/seller/onboarding");
                  }}
                  className="w-full text-left px-4 py-3 text-[15px] font-medium text-[#000080] hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Become a Seller
                </button>
                <div className="border-t border-gray-200 my-2" />
                <button
                  onClick={() => {
                    onClose();
                    router.push("/settings");
                  }}
                  className="w-full text-left px-4 py-3 text-[15px] font-medium text-[#000080] hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Settings
                </button>
                <button
                  onClick={async () => {
                    onClose();
                    await signOut();
                    router.push("/browse");
                  }}
                  className="w-full text-left px-4 py-3 text-[15px] font-medium text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        ) : (
          /* LOGGED OUT STATE */
          <div className="px-6 pt-6">
            <button
              onClick={() => {
                onClose();
                router.push("/login");
              }}
              className="
                w-full
                rounded-2xl
                bg-[#000080]
                py-3
                text-[15px]
                font-semibold
                text-white
                shadow-sm
                active:opacity-80
              "
            >
              Sign In / Create Account
            </button>

            <button
              onClick={() => {
                onClose();
                router.push("/signup?seller=true");
              }}
              className="
                mt-3
                w-full
                rounded-2xl
                border-2
                border-[#000080]
                py-3
                text-[15px]
                font-semibold
                text-[#000080]
                bg-white
                active:opacity-70
              "
            >
              Become a Seller
            </button>

            <button
              onClick={onClose}
              className="
                mt-4
                w-full
                text-[15px]
                font-semibold
                text-[#000080]
                active:opacity-70
              "
            >
              Continue Browsing →
            </button>

            {/* Saved Items link for guests */}
            <button
              onClick={() => {
                onClose();
                router.push("/canvas");
              }}
              className="
                mt-4
                w-full
                text-left
                px-4
                py-2
                text-[14px]
                text-[#000080]
                hover:bg-gray-50
                rounded-lg
                transition-colors
              "
            >
              Saved Items
            </button>
          </div>
        )}

        {/* Bottom padding */}
        <div className="pb-8" />
      </div>
    </div>
  );
};

export default AccountSheet;
