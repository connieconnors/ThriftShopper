"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface AccountSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccountSheet: React.FC<AccountSheetProps> = ({ isOpen, onClose }) => {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 backdrop-blur-sm"
      onClick={onClose}
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
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-8 pb-2">
          <div className="h-1.5 w-10 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex flex-col items-center px-6">
          <div className="flex h-9 w-9 flex-col items-center justify-center rounded-full bg-[#000080] text-white">
            <div className="text-xs font-semibold tracking-wide leading-none">TS</div>
            <div className="text-[6px] text-[#EFBF04] leading-none mt-[-2px]">✦</div>
          </div>

          <div className="mt-3 text-[17px] font-semibold text-[#000080]">
            ThriftShopper
          </div>
        </div>

        {/* Divider */}
        <div className="mt-8 border-t border-gray-200" />

        {/* Primary + secondary actions */}
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
        </div>

        {/* Bottom padding only */}
        <div className="pb-8" />
      </div>
    </div>
  );
};

export default AccountSheet;
