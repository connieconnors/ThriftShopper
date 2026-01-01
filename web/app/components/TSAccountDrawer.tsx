"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { TSLogo } from "@/components/TSLogo";
import {
  X,
  Heart,
  MessageSquare,
  Store,
  Settings,
  LogOut,
  UserPlus,
  LogIn,
  HelpCircle,
  Plus,
  Package,
} from "lucide-react";

interface TSAccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TSAccountDrawer({ isOpen, onClose }: TSAccountDrawerProps) {
  const router = useRouter();
  const { user, signOut, isLoading } = useAuth();
  const [isSeller, setIsSeller] = useState(false);

  // Check if user is a seller
  useEffect(() => {
    const checkSellerStatus = async () => {
      if (!user) {
        setIsSeller(false);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_seller")
          .eq("user_id", user.id)
          .maybeSingle();

        // Also try with id if user_id doesn't work
        if (!profile) {
          const retry = await supabase
            .from("profiles")
            .select("is_seller")
            .eq("id", user.id)
            .maybeSingle();
          setIsSeller(retry.data?.is_seller === true);
        } else {
          setIsSeller(profile.is_seller === true);
        }
      } catch (error) {
        console.error("Error checking seller status:", error);
        setIsSeller(false);
      }
    };

    if (user) {
      checkSellerStatus();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    onClose();
    router.push("/browse");
  };

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed bottom-0 right-0 w-full max-w-sm h-[85vh] bg-white z-50 rounded-t-2xl shadow-2xl"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-gray-200"
          style={{ backgroundColor: "#191970" }}
        >
          <div className="flex items-center gap-3">
            <TSLogo size={20} primaryColor="#ffffff" accentColor="#EFBF05" />
            <span className="text-white font-semibold">Account</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(85vh-80px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-[#191970] border-t-transparent rounded-full" />
            </div>
          ) : !user ? (
            // NOT LOGGED IN
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <LogIn className="w-5 h-5 text-gray-600" />
                  <span className="font-medium">Sign In</span>
                </Link>
                <Link
                  href="/signup"
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <UserPlus className="w-5 h-5 text-gray-600" />
                  <span className="font-medium">Create Account</span>
                </Link>
                <button
                  onClick={onClose}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors border-2 border-[#191970] font-medium"
                  style={{ color: "#191970" }}
                >
                  Continue as Guest
                </button>
              </div>

              <div className="pt-4 border-t border-gray-200 space-y-3">
                <Link
                  href="/favorites"
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Heart className="w-5 h-5 text-gray-600" />
                  <span>Saved Items</span>
                </Link>
                <Link
                  href="/help"
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <HelpCircle className="w-5 h-5 text-gray-600" />
                  <span>Help</span>
                </Link>
              </div>
            </div>
          ) : isSeller ? (
            // LOGGED IN AS SELLER
            <div className="p-6 space-y-3">
              <Link
                href="/seller"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Package className="w-5 h-5 text-gray-600" />
                <span>Your Listings</span>
              </Link>
              <Link
                href="/sell"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-5 h-5 text-gray-600" />
                <span>Add New Listing</span>
              </Link>
              <Link
                href="/messages"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <MessageSquare className="w-5 h-5 text-gray-600" />
                <span>Your Messages</span>
              </Link>
              <Link
                href="/favorites"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Heart className="w-5 h-5 text-gray-600" />
                <span>Your Saved Items</span>
              </Link>
              <Link
                href="/seller/settings"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-600" />
                <span>Settings</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors text-red-600 mt-4"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            // LOGGED IN AS BUYER
            <div className="p-6 space-y-3">
              <Link
                href="/favorites"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Heart className="w-5 h-5 text-gray-600" />
                <span>Your Saved Items</span>
              </Link>
              <Link
                href="/messages"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <MessageSquare className="w-5 h-5 text-gray-600" />
                <span>Your Messages</span>
              </Link>
              <Link
                href="/seller/onboarding"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Store className="w-5 h-5 text-gray-600" />
                <span>Become a Seller</span>
              </Link>
              <Link
                href="/settings"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-600" />
                <span>Settings</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors text-red-600 mt-4"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

