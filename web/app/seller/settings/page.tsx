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
import { type SellerActionType, resolveSellerActionType, sellerSettingsActionLabel } from "@/lib/sellerActionType";
import {
  validateGivesBackFields,
  serializeGivesBackForSave,
  showsGivesBackBadge,
  GIVES_BACK_ENABLE_CONFIRM,
} from "@/lib/givesBack";
import { GivesBackBadge } from "@/components/GivesBackBadge";

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
  sellerActionType: SellerActionType;
  paymentPickupLabel: string;
  givesBackEnabled: boolean;
  givesBackName: string;
  givesBackPct: string;
  isNonProfit: boolean;
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
    sellerActionType: "stripe_checkout",
    paymentPickupLabel: "",
    givesBackEnabled: false,
    givesBackName: "",
    givesBackPct: "",
    isNonProfit: false,
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
          phone: data.phone_main || data.phone || "",
          shippingPreferences: parseShippingPreferences(data.shipping_info) ?? DEFAULT_SHIPPING_PREFERENCES,
          sellerActionType: resolveSellerActionType(data),
          paymentPickupLabel: data.payment_pickup_label || "",
          givesBackEnabled: data.gives_back === true,
          givesBackName: data.gives_back_name || "",
          givesBackPct: data.gives_back_pct != null ? String(data.gives_back_pct) : "",
          isNonProfit: data.is_non_profit_org === true,
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

    const givesBackValidationError = validateGivesBackFields({
      enabled: formData.givesBackEnabled,
      name: formData.givesBackName,
      pct: formData.givesBackPct,
    });
    if (givesBackValidationError) {
      setError(givesBackValidationError);
      setIsSubmitting(false);
      return;
    }

    const givesBackFields = serializeGivesBackForSave({
      enabled: formData.givesBackEnabled,
      name: formData.givesBackName,
      pct: formData.givesBackPct,
      isNonProfit: formData.isNonProfit,
    });

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
          phone_main: formData.phone || null,
          shipping_info: serializeShippingPreferences(formData.shippingPreferences),
          seller_action_type: formData.sellerActionType,
          payment_mode:
            formData.sellerActionType === "local_pickup" ||
            formData.sellerActionType === "store_pickup"
              ? "reserve_in_store"
              : formData.sellerActionType,
          payment_pickup_label:
            formData.sellerActionType === "store_pickup"
              ? formData.paymentPickupLabel.trim() || formData.storeName.trim() || null
              : null,
          ...givesBackFields,
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

  const handleGivesBackToggle = (checked: boolean) => {
    if (checked && !window.confirm(GIVES_BACK_ENABLE_CONFIRM)) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      givesBackEnabled: checked,
      ...(checked
        ? {}
        : { givesBackName: "", givesBackPct: "", isNonProfit: false }),
    }));
  };

  const givesBackPreview = showsGivesBackBadge({
    gives_back: formData.givesBackEnabled,
    gives_back_name: formData.givesBackName,
    gives_back_pct: formData.givesBackPct,
  });

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
            className="text-2xl font-bold font-ui-heading"
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
          {/* Shop or seller name */}
          <div>
            <label className="block mb-2 font-medium" style={{ color: "#16193a" }}>
              Shop or seller name
            </label>
            <div className="relative">
              <Store size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => updateField("storeName", e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#16193a] outline-none transition-colors"
                placeholder="Your name or shop name"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Shown to buyers. Your personal name is fine if you don&apos;t have a store.
            </p>
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

          {/* Shop default buyer action */}
          <div>
            <label className="block mb-2 font-medium" style={{ color: "#16193a" }}>
              How buyers get items <span className="text-gray-400 font-normal">(shop default)</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Default for new listings. Override on each item when you list or edit — same idea as shipping.
            </p>
            <select
              value={formData.sellerActionType}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  sellerActionType: e.target.value as SellerActionType,
                }))
              }
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#16193a] outline-none transition-colors mb-3"
            >
              <option value="stripe_checkout">{sellerSettingsActionLabel("stripe_checkout")}</option>
              <option value="local_pickup">{sellerSettingsActionLabel("local_pickup")}</option>
              <option value="store_pickup">{sellerSettingsActionLabel("store_pickup")}</option>
              <option value="contact_seller">{sellerSettingsActionLabel("contact_seller")}</option>
            </select>
            {formData.sellerActionType === "store_pickup" && (
              <input
                type="text"
                value={formData.paymentPickupLabel}
                onChange={(e) => updateField("paymentPickupLabel", e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#16193a] outline-none transition-colors"
                placeholder="Store name (e.g. Wilson's Dry Dock)"
              />
            )}
            {formData.sellerActionType === "contact_seller" && (
              <p className="text-xs text-gray-500">
                Pickup and/or shipping — buyers message you to arrange. Pay in person or as agreed. Listing copy uses your shop or seller name above.
              </p>
            )}
            {formData.sellerActionType === "local_pickup" && (
              <p className="text-xs text-gray-500">
                For home sellers — buyers coordinate pickup using your city on your profile.
              </p>
            )}
          </div>

          {/* Shipping */}
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Store default for new listings. You can override shipping on each item when you list it.
            </p>
            <ShippingPreferenceForm
              label="How do you ship?"
              value={formData.shippingPreferences}
              onChange={(prefs) => setFormData((prev) => ({ ...prev, shippingPreferences: prefs }))}
              showLabel={true}
            />
          </div>

          {/* Gives Back — optional, settings only */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4">
            <label className="block mb-1 font-medium" style={{ color: "#16193a" }}>
              Gives Back badge <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Honor system — only enable if you donate a portion of proceeds. The badge appears publicly once you save with a charity name and percentage.
            </p>
            <div className="flex items-center gap-3 mb-3">
              <input
                id="settings-gives-back"
                type="checkbox"
                checked={formData.givesBackEnabled}
                onChange={(e) => handleGivesBackToggle(e.target.checked)}
                className="h-4 w-4 accent-[#16193a]"
              />
              <label htmlFor="settings-gives-back" className="text-sm text-gray-700">
                Show a Gives Back badge on my shop and listings
              </label>
            </div>
            {formData.givesBackEnabled && (
              <div className="space-y-3">
                <div>
                  <label className="block mb-1 text-sm font-medium" style={{ color: "#16193a" }}>
                    Charity or cause name
                  </label>
                  <input
                    type="text"
                    value={formData.givesBackName}
                    onChange={(e) => updateField("givesBackName", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#16193a] outline-none transition-colors bg-white"
                    placeholder="e.g. St. Boniface Outreach"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium" style={{ color: "#16193a" }}>
                    Percentage donated
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.givesBackPct}
                    onChange={(e) => updateField("givesBackPct", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#16193a] outline-none transition-colors bg-white"
                    placeholder="e.g. 5 or 10"
                  />
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                    Approximate share of proceeds you donate — whole number or percent (e.g.{" "}
                    <span className="whitespace-nowrap">5</span> or{" "}
                    <span className="whitespace-nowrap">10%</span>). Buyers see this on your
                    Gives Back badge. Honor system only.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="settings-is-non-profit"
                    type="checkbox"
                    checked={formData.isNonProfit}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isNonProfit: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-[#16193a]"
                  />
                  <label htmlFor="settings-is-non-profit" className="text-sm text-gray-700">
                    Registered nonprofit
                  </label>
                </div>
                {givesBackPreview && (
                  <div className="pt-1">
                    <p className="text-xs text-gray-500 mb-2">Badge preview after save:</p>
                    <GivesBackBadge />
                  </div>
                )}
              </div>
            )}
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

