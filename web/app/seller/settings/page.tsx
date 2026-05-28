"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { Store, MapPin, Mail, Phone, Loader2, ArrowLeft, Check } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { ShippingPreferenceForm } from "@/components/ShippingPreferenceForm";
import {
  type ShippingPreferences,
  DEFAULT_SHIPPING_PREFERENCES,
  serializeShippingPreferences,
  parseShippingPreferences,
  validateListingShippingPreferences,
} from "@/lib/shippingPreferences";
import { useAppShell } from "@/hooks/useAppShell";

interface SellerProfile {
  storeName: string;
  description: string;
  sellerInfo: string;
  city: string;
  state: string;
  zipCode: string;
  email: string;
  phone: string;
  shippingPreferences: ShippingPreferences;
}

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

export default function SellerSettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  useAppShell("linen");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<SellerProfile>({
    storeName: "",
    description: "",
    sellerInfo: "",
    city: "",
    state: "",
    zipCode: "",
    email: "",
    phone: "",
    shippingPreferences: DEFAULT_SHIPPING_PREFERENCES,
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
          description: data.seller_description || "",
          sellerInfo: data.seller_story || "",
          city: data.location_city || "",
          state: data.location_state || "",
          zipCode: data.location_zip || "",
          email: data.email || user.email || "",
          phone: data.phone || "",
          shippingPreferences: parseShippingPreferences(data.shipping_info) ?? DEFAULT_SHIPPING_PREFERENCES,
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

    const shippingValidationError = validateListingShippingPreferences(
      formData.shippingPreferences
    );
    if (shippingValidationError) {
      setError(shippingValidationError);
      setIsSubmitting(false);
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          display_name: formData.storeName,
          seller_description: formData.description,
          seller_story: formData.sellerInfo || null,
          location_city: formData.city,
          location_state: formData.state,
          location_zip: formData.zipCode,
          location_country: "US",
          email: formData.email,
          phone: formData.phone || null,
          shipping_info: serializeShippingPreferences(formData.shippingPreferences),
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#16193a" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-6 overflow-y-auto" style={{ backgroundColor: "var(--background)" }}>
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
            <ArrowLeft size={24} style={{ color: "#16193a" }} />
          </Link>
          <h1
            className="text-2xl font-bold font-editorial"
            style={{ color: "var(--ink-primary)" }}
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
            <label className="block mb-2 font-medium" style={{ color: "#16193a" }}>
              Store Name
            </label>
            <div className="relative">
              <Store size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => updateField("storeName", e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#16193a] outline-none transition-colors"
                placeholder="Your Store or Your Name"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block mb-2 font-medium" style={{ color: "#16193a" }}>
              Location
            </label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="relative">
                <MapPin size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#16193a] outline-none transition-colors"
                  placeholder="City"
                  required
                />
              </div>
              <select
                value={formData.state}
                onChange={(e) => updateField("state", e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#16193a] outline-none transition-colors"
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
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#16193a] outline-none transition-colors"
              placeholder="ZIP Code"
              pattern="[0-9]{5}"
              required
            />
          </div>

          {/* Contact */}
          <div>
            <label className="block mb-2 font-medium" style={{ color: "#16193a" }}>
              Contact Information
            </label>
            <div className="space-y-3">
              <div className="relative">
                <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#16193a] outline-none transition-colors"
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
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#16193a] outline-none transition-colors"
                  placeholder="Phone (optional)"
                />
              </div>
            </div>

            {/* Description */}
            <div className="mt-3">
              <label className="block mb-2 font-medium" style={{ color: "#16193a" }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#16193a] outline-none transition-colors min-h-[100px] resize-none"
                placeholder="Tell buyers about you and what makes your shop special..."
              />
            </div>

            {/* Your Story */}
            <div className="mt-3">
              <label className="block mb-2 font-medium" style={{ color: "#16193a" }}>
                Your Story <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={formData.sellerInfo}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 500) {
                    updateField("sellerInfo", value);
                  }
                }}
                maxLength={500}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#16193a] outline-none transition-colors min-h-[100px] resize-none"
                placeholder="Tell buyers about your shop, what you sell, or what makes your items special..."
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">
                  Tell buyers about your shop, what you sell, or what makes your items special (optional)
                </p>
                <p className={`text-xs ${formData.sellerInfo.length >= 500 ? 'text-red-500' : 'text-gray-400'}`}>
                  {formData.sellerInfo.length}/500
                </p>
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div>
            <ShippingPreferenceForm
              label="How do you ship?"
              value={formData.shippingPreferences}
              onChange={(prefs) => setFormData((prev) => ({ ...prev, shippingPreferences: prefs }))}
              showLabel={true}
            />
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-lg text-white font-medium shadow-lg mt-8 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: "#16193a" }}
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

