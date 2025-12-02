"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { Store, MapPin, Mail, Phone, Package, Loader2, ArrowLeft, Check } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

interface SellerProfile {
  storeName: string;
  description: string;
  city: string;
  state: string;
  zipCode: string;
  email: string;
  phone: string;
  shippingSpeed: string;
}

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

const SHIPPING_OPTIONS = [
  "Ships within 1-2 days",
  "Ships within 3-5 days",
  "Ships within 5-7 days",
  "Local pickup only",
  "Local pickup + Shipping available",
];

export default function SellerSettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<SellerProfile>({
    storeName: "",
    description: "",
    city: "",
    state: "",
    zipCode: "",
    email: "",
    phone: "",
    shippingSpeed: SHIPPING_OPTIONS[0],
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/seller/settings");
    }
  }, [user, authLoading, router]);

  // Load existing profile data
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setFormData({
          storeName: data.display_name || "",
          description: data.bio || "",
          city: data.location_city || "",
          state: data.location_state || "",
          zipCode: data.location_zip || "",
          email: data.email || user.email || "",
          phone: data.phone || "",
          shippingSpeed: data.shipping_info || SHIPPING_OPTIONS[0],
        });
      } else {
        // No profile yet, pre-fill email
        setFormData((prev) => ({ ...prev, email: user.email || "" }));
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      setError("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          display_name: formData.storeName,
          bio: formData.description,
          location_city: formData.city,
          location_state: formData.state,
          location_zip: formData.zipCode,
          location_country: "US",
          email: formData.email,
          phone: formData.phone || null,
          shipping_info: formData.shippingSpeed,
          is_seller: true,
        }, {
          onConflict: "user_id",
        });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving profile:", err);
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof SellerProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f5f5f5" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#191970" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-6 overflow-y-auto" style={{ backgroundColor: "#f5f5f5" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/seller"
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/50 transition-colors"
          >
            <ArrowLeft size={24} style={{ color: "#191970" }} />
          </Link>
          <h1
            className="text-2xl font-bold"
            style={{ color: "#000080", fontFamily: "var(--font-merriweather), Merriweather, serif" }}
          >
            Shop Settings
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2"
          >
            <Check size={18} />
            Settings saved successfully!
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Store Name */}
          <div>
            <label className="block mb-2 font-medium" style={{ color: "#191970" }}>
              Store Name
            </label>
            <div className="relative">
              <Store size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => updateField("storeName", e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
                placeholder="Your Store or Your Name"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block mb-2 font-medium" style={{ color: "#191970" }}>
              Seller Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors min-h-[100px] resize-none"
              placeholder="Tell buyers about you and what makes your shop special..."
            />
          </div>

          {/* Location */}
          <div>
            <label className="block mb-2 font-medium" style={{ color: "#191970" }}>
              Location
            </label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="relative">
                <MapPin size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
                  placeholder="City"
                  required
                />
              </div>
              <select
                value={formData.state}
                onChange={(e) => updateField("state", e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
                required
              >
                <option value="">State</option>
                {US_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={formData.zipCode}
              onChange={(e) => updateField("zipCode", e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
              placeholder="ZIP Code"
              pattern="[0-9]{5}"
              required
            />
          </div>

          {/* Contact */}
          <div>
            <label className="block mb-2 font-medium" style={{ color: "#191970" }}>
              Contact Information
            </label>
            <div className="space-y-3">
              <div className="relative">
                <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
                  placeholder="Email"
                  required
                />
              </div>
              <div className="relative">
                <Phone size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
                  placeholder="Phone (optional)"
                />
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div>
            <label className="block mb-2 font-medium" style={{ color: "#191970" }}>
              Shipping Details
            </label>
            <div className="relative">
              <Package size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={formData.shippingSpeed}
                onChange={(e) => updateField("shippingSpeed", e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors appearance-none"
                required
              >
                {SHIPPING_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-lg text-white font-medium shadow-lg mt-8 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: "#191970" }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

