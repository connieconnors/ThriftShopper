"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Store, MapPin, Mail, Phone, Package, Loader2 } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { TSLogo } from "@/components/TSLogo";

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

// Shipping is now a free-text field, so we don't need predefined options

export default function SellerOnboardingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<SellerProfile>({
    storeName: "",
    description: "",
    city: "",
    state: "",
    zipCode: "",
    email: "",
    phone: "",
    shippingSpeed: "",
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/seller/onboarding");
    }
  }, [user, authLoading, router]);

  // Pre-fill email from auth
  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({ ...prev, email: user.email || "" }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Always use UPDATE (upsert) since profile should already exist from signup
      // If it doesn't exist, the update will fail gracefully and we can handle it
      const result = await supabase
        .from("profiles")
        .update({
          display_name: formData.storeName,
          bio: formData.description,
          location_city: formData.city,
          location_state: formData.state,
          location_zip: formData.zipCode,
          email: formData.email,
          phone: formData.phone || null,
          shipping_info: formData.shippingSpeed,
          is_seller: true,
        })
        .eq("user_id", user.id);

      // If update didn't affect any rows, try insert (profile doesn't exist)
      if (result.error) {
        // Update failed, try insert as fallback
        const insertResult = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            display_name: formData.storeName,
            bio: formData.description,
            location_city: formData.city,
            location_state: formData.state,
            location_zip: formData.zipCode,
            email: formData.email,
            phone: formData.phone || null,
            shipping_info: formData.shippingSpeed,
            is_seller: true,
          });
        
        if (insertResult.error) {
          console.error("Database error:", insertResult.error);
          throw new Error(insertResult.error.message || "Failed to save profile");
        }
      } else if (result.data === null && result.count === 0) {
        // Update succeeded but no rows affected, try insert
        const insertResult = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            display_name: formData.storeName,
            bio: formData.description,
            location_city: formData.city,
            location_state: formData.state,
            location_zip: formData.zipCode,
            email: formData.email,
            phone: formData.phone || null,
            shipping_info: formData.shippingSpeed,
            is_seller: true,
          });
        
        if (insertResult.error) {
          console.error("Database error:", insertResult.error);
          throw new Error(insertResult.error.message || "Failed to save profile");
        }
      }

      // Redirect to seller dashboard
      router.push("/seller-dashboard");
    } catch (err) {
      console.error("Error saving profile:", err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null && 'message' in err
        ? String(err.message)
        : "Failed to save profile";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof SellerProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f5f5f5" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#191970" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-6 overflow-y-auto" style={{ backgroundColor: "#f5f5f5" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="text-center mb-8">
          <div
            className="inline-flex w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: "#191970" }}
          >
            <Store size={40} color="#cfb53b" />
          </div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: "#000080", fontFamily: "var(--font-merriweather), Merriweather, serif" }}
          >
            Set Up Your Shop
          </h1>
          <p className="text-gray-600">
            Let&apos;s get you started selling on ThriftShopper
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
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
              <input
                type="text"
                value={formData.shippingSpeed}
                onChange={(e) => updateField("shippingSpeed", e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
                placeholder="e.g., Ships within 3-5 days, Local pickup available"
                required
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Indicate your preferred and secondary shipping methods (e.g., "Ships within 3-5 days, Local pickup available")
            </p>
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
              "Begin Selling"
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

