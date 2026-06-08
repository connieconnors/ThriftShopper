"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { Store, MapPin, Mail, Phone, Loader2, Upload, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { WelcomeBrandHeader } from "@/components/WelcomeBrandHeader";
import { SellerFeeTransparencyLine } from "@/components/SellerFeeTransparency";
import { ShippingPreferenceForm } from "@/components/ShippingPreferenceForm";
import {
  type ShippingPreferences,
  DEFAULT_SHIPPING_PREFERENCES,
  parseShippingPreferences,
  serializeShippingPreferences,
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
  avatarFile: File | null;
  avatarPreview: string | null;
}

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

// Shipping is now a free-text field, so we don't need predefined options

function SellerOnboardingContent() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  useAppShell("linen");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Determine preview mode from query string (client-side)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const preview = new URLSearchParams(window.location.search).get("preview") === "1";
    setIsPreviewMode(preview);
  }, []);

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
    avatarFile: null,
    avatarPreview: null,
  });
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Redirect if not logged in, or if already a seller with complete profile
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/seller/onboarding");
      return;
    }
    
    // If logged in, check if already a seller with complete profile
    if (user && !authLoading) {
      const checkSellerStatus = async () => {
        try {
          if (isPreviewMode) {
            return;
          }
          // Try user_id first (actual column name), fallback to id
          let { data: profile, error } = await supabase
            .from("profiles")
            .select("is_seller, display_name, location_city")
            .eq("user_id", user.id)
            .single();
          
          // If that fails, try id
          if (error && error.code === 'PGRST116') {
            const retry = await supabase
              .from("profiles")
              .select("is_seller, display_name, location_city")
              .eq("id", user.id)
              .single();
            profile = retry.data;
            error = retry.error;
          }
          
          // If already a seller with complete profile, redirect to seller dashboard
          if (profile?.is_seller === true && profile?.location_city && profile?.display_name) {
            router.push("/seller");
            return;
          }

          // Incomplete profile — reload saved fields (including shipping defaults)
          const { data: savedProfile } = await supabase
            .from("profiles")
            .select(
              "display_name, seller_description, seller_story, location_city, location_state, location_zip, email, phone_main, shipping_info, avatar_url"
            )
            .eq("user_id", user.id)
            .maybeSingle();

          if (savedProfile) {
            setFormData((prev) => ({
              ...prev,
              storeName: savedProfile.display_name || prev.storeName,
              description: savedProfile.seller_description || prev.description,
              sellerInfo: savedProfile.seller_story || prev.sellerInfo,
              city: savedProfile.location_city || prev.city,
              state: savedProfile.location_state || prev.state,
              zipCode: savedProfile.location_zip || prev.zipCode,
              email: savedProfile.email || prev.email || user.email || "",
              phone: savedProfile.phone_main || prev.phone,
              shippingPreferences:
                parseShippingPreferences(savedProfile.shipping_info) ??
                prev.shippingPreferences,
              avatarPreview: savedProfile.avatar_url || prev.avatarPreview,
            }));
          }
        } catch (err) {
          console.error("Error checking seller status:", err);
        }
      };
      
      checkSellerStatus();
    }
  }, [user, authLoading, router, isPreviewMode]);

  // Pre-fill email from auth
  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({ ...prev, email: user.email || "" }));
    }
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        avatarFile: file,
        avatarPreview: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!formData.avatarFile || !user) return null;

    setIsUploadingAvatar(true);
    try {
      // Upload to Supabase Storage
      const fileExt = formData.avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, formData.avatarFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Avatar upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError('Failed to upload avatar image');
      return null;
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setError(null);

    const shippingValidationError = validateListingShippingPreferences(
      formData.shippingPreferences
    );
    if (shippingValidationError) {
      setError(shippingValidationError);
      setIsSubmitting(false);
      return;
    }

    try {
      // Upload avatar first if provided
      let avatarUrl: string | null = null;
      if (formData.avatarFile) {
        avatarUrl = await uploadAvatar();
        if (!avatarUrl && formData.avatarFile) {
          // If upload failed but file exists, don't block submission
          console.warn('Avatar upload failed, continuing without avatar');
        }
      }

      // Prepare update data
      const updateData: any = {
        user_id: user.id, // Use user_id as the key column
        display_name: formData.storeName, // Store name maps to display_name
        seller_description: formData.description, // Seller Description goes to seller_description
        seller_story: formData.sellerInfo || null, // Your Story goes to seller_story
        location_city: formData.city,
        location_state: formData.state,
        location_zip: formData.zipCode,
        email: formData.email,
        phone_main: formData.phone || null, // Use phone_main (stores can have store phone and mobile)
        shipping_info: serializeShippingPreferences(formData.shippingPreferences),
        is_seller: true,
      };

      // Add avatar_url if we have it
      if (avatarUrl) {
        updateData.avatar_url = avatarUrl;
      }

      // Always use UPDATE (upsert) since profile should already exist from signup
      // Use user_id as the key column (matches actual table structure)
      let result = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user.id);
      
      // If update didn't affect any rows, try insert (profile doesn't exist)
      if (result.error || (result.data === null && result.count === 0)) {
        console.log('Update failed or no rows affected, trying insert...');
        // Use user_id as the key column (not id)
        const insertData: any = {
          user_id: user.id, // Use user_id as the key column
          display_name: formData.storeName,
          seller_description: formData.description, // Seller Description goes to seller_description
          seller_story: formData.sellerInfo || null, // Your Story goes to seller_story
          location_city: formData.city,
          location_state: formData.state,
          location_zip: formData.zipCode,
          email: formData.email,
          phone_main: formData.phone || null, // Use phone_main (stores can have store phone and mobile)
          shipping_info: serializeShippingPreferences(formData.shippingPreferences),
          is_seller: true,
        };

        // Add avatar_url if we have it
        if (avatarUrl) {
          insertData.avatar_url = avatarUrl;
        }

        const insertResult = await supabase
          .from("profiles")
          .insert(insertData);
        
        if (insertResult.error) {
          console.error("Database error on insert:", insertResult.error);
          throw new Error(insertResult.error.message || "Failed to save profile");
        }
      }

      // Redirect to seller dashboard
      router.push("/seller");
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#16193a" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-6 overflow-y-auto" style={{ backgroundColor: "var(--background)" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <WelcomeBrandHeader
          title="Set Up Your Shop"
          subtitle="Let's get you started selling on ThriftShopper"
          className="mb-8"
        >
          {isPreviewMode && (
            <div className="inline-flex items-center gap-2 rounded-full border border-[#16193a]/20 bg-white px-3 py-1 text-[11px] text-[#16193a] mt-3">
              Preview Mode
            </div>
          )}
          <SellerFeeTransparencyLine className="mt-3 max-w-md mx-auto" />
          <Link
            href="/canvas"
            className="mt-4 inline-block text-sm text-[#16193a] hover:underline font-system"
          >
            Want to shop instead? Go to My Canvas →
          </Link>
          <Link
            href="/seller/onboarding?preview=1"
            className="mt-2 block text-xs text-gray-500 hover:underline font-system"
          >
            Preview mode (bypass seller redirect)
          </Link>
        </WelcomeBrandHeader>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Avatar Upload */}
          <div>
            <label className="block mb-2 font-medium" style={{ color: "#16193a" }}>
              Store Avatar (Optional)
            </label>
            <div className="flex items-center gap-4">
              <div className="relative">
                {formData.avatarPreview ? (
                  <img
                    src={formData.avatarPreview}
                    alt="Avatar preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                    <ImageIcon size={32} className="text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label
                  htmlFor="avatar-upload"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors text-sm font-medium text-gray-700"
                >
                  <Upload size={16} />
                  {formData.avatarFile ? 'Change Image' : 'Upload Image'}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={isUploadingAvatar}
                />
                {isUploadingAvatar && (
                  <p className="mt-1 text-xs text-gray-500">Uploading...</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Max 5MB, JPG/PNG</p>
              </div>
            </div>
          </div>

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
            <p className="mt-1 text-xs text-gray-500">This will be your display name on ThriftShopper</p>
          </div>

          {/* Description */}
          <div>
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

          {/* Your Story / About Your Shop */}
          <div>
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
          </div>

          {/* Shipping */}
          <div>
            <p className="text-sm text-gray-600 mb-3">
              This is your store default. You can change shipping for any item when you list it.
            </p>
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
              "Begin Selling"
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

export default function SellerOnboardingPage() {
  return (
    <Suspense fallback={<div />}>
      <SellerOnboardingContent />
    </Suspense>
  );
}
