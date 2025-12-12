"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { TSLogo } from "./TSLogo";
import { X, Heart, HelpCircle, Info } from "lucide-react";

interface AccountSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItemProps {
  label: string;
  href: string;
  onClick?: () => void;
}

function NavItem({ label, href, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="w-full py-3 text-left text-[#000080] hover:bg-gray-50 transition-colors border-b border-gray-100"
    >
      {label}
    </Link>
  );
}

export default function AccountSheet({ isOpen, onClose }: AccountSheetProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center px-6 py-6">
          <TSLogo size={32} primaryColor="#000080" accentColor="#EFBF04" />

          <h2 className="text-[20px] font-semibold text-[#000080] mt-2">
            ThriftShopper™
          </h2>

          <button
            className="w-full mt-6 py-3 rounded-lg bg-[#000080] text-white font-medium hover:bg-[#191970] transition-colors"
            onClick={() => {
              onClose();
              router.push("/login");
            }}
          >
            Sign In / Create Account
          </button>

          <button
            className="w-full mt-3 py-3 text-[#000080] hover:bg-gray-50 rounded-lg transition-colors"
            onClick={onClose}
          >
            Continue Browsing →
          </button>

          <div className="w-full border-t border-gray-200 my-6"></div>

          <NavItem label="Saved Items" href="/favorites" onClick={onClose} />
          <NavItem label="Help / Contact" href="/help" onClick={onClose} />
          <NavItem label="About ThriftShopper" href="/about" onClick={onClose} />

          <p className="text-[12px] mt-6 text-[#EFBF04]">
            The Magic of Discovery™
          </p>
        </div>
      </div>
    </>
  );
}

