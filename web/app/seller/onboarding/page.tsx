"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { Store, MapPin, Mail, Phone, Package, Loader2, Upload, Image as ImageIcon, Check } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { TSLogo } from "@/components/TSLogo";

interface SellerProfile {
  storeName: string;
  description: string;
  sellerInfo: string;
  city: string;
  state: string;
  zipCode: string;
  email: string;
  phone: string;
  shippingSpeed: string;
  avatarFile: File | null;
  avatarPreview: string | null;
  givesBack: boolean;
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

// Shipping is now a free-text field, so we don't need predefined options

export default function SellerOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<SellerProfile>({
    storeName: "",
    description: "",
    sellerInfo: "",
    city: "",
    state: "",
    zipCode: "",
    email: "",
    phone: "",
    shippingSpeed: "",
    avatarFile: null,
    avatarPreview: null,
    givesBack: false,
    givesBackName: "",
    givesBackPct: "",
    isNonProfit: false,
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
          
          // If already a seller but incomplete, stay on onboarding (they need to complete it)
          // If not a seller yet, stay on onboarding (they're becoming a seller)
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
        shipping_info: formData.shippingSpeed, // Changed from shipping_speed to shipping_info
        gives_back: formData.givesBack,
        gives_back_name: formData.givesBack ? formData.givesBackName || null : null,
        gives_back_pct: formData.givesBack ? formData.givesBackPct || null : null,
        is_non_profit: formData.isNonProfit,
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
          shipping_info: formData.shippingSpeed, // Changed from shipping_speed to shipping_info
          gives_back: formData.givesBack,
          gives_back_name: formData.givesBack ? formData.givesBackName || null : null,
          gives_back_pct: formData.givesBack ? formData.givesBackPct || null : null,
          is_non_profit: formData.isNonProfit,
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

  const updateToggle = (field: "givesBack" | "isNonProfit", value: boolean) => {
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
            <TSLogo size={44} primaryColor="#ffffff" accentColor="#D4AF37" showStar />
          </div>
          <h1
            className="text-3xl font-bold mb-2 font-editorial"
            style={{ color: "#000080" }}
          >
            Set Up Your Shop
          </h1>
          {searchParams?.get("preview") === "1" && (
            <div className="inline-flex items-center gap-2 rounded-full border border-[#191970]/20 bg-white px-3 py-1 text-[11px] text-[#191970]">
              Preview Mode
            </div>
          )}
          <p className="text-gray-600">
            Let&apos;s get you started selling on ThriftShopper
          </p>
          <Link
            href="/canvas"
            className="mt-4 inline-block text-sm text-[#191970] hover:underline"
          >
            Want to shop instead? Go to My Canvas →
          </Link>
          <Link
            href="/seller/onboarding?preview=1"
            className="mt-2 block text-xs text-gray-500 hover:underline"
          >
            Preview mode (bypass seller redirect)
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Avatar Upload */}
          <div>
            <label className="block mb-2 font-medium" style={{ color: "#191970" }}>
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
            <p className="mt-1 text-xs text-gray-500">This will be your display name on ThriftShopper</p>
          </div>

          {/* Description */}
          <div>
            <label className="block mb-2 font-medium" style={{ color: "#191970" }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors min-h-[100px] resize-none"
              placeholder="Tell buyers about you and what makes your shop special..."
            />
          </div>

          {/* Your Story / About Your Shop */}
          <div>
            <label className="block mb-2 font-medium" style={{ color: "#191970" }}>
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
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors min-h-[100px] resize-none"
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

          {/* Gives Back */}
          <div>
            <label className="block mb-2 font-medium" style={{ color: "#191970" }}>
              Gives Back
            </label>
            <div className="flex items-center gap-3 mb-3">
              <input
                id="gives-back"
                type="checkbox"
                checked={formData.givesBack}
                onChange={(e) => updateToggle("givesBack", e.target.checked)}
                className="h-4 w-4 accent-[#191970]"
              />
              <label htmlFor="gives-back" className="text-sm text-gray-700">
                We donate a portion of proceeds to a cause or nonprofit.
              </label>
            </div>
            <p className="text-xs text-gray-500">
              We’ll review this information before adding a badge to your shop.
            </p>
            {formData.givesBack && (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block mb-2 font-medium" style={{ color: "#191970" }}>
                    Who do you give back to?
                  </label>
                  <input
                    type="text"
                    value={formData.givesBackName}
                    onChange={(e) => updateField("givesBackName", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
                    placeholder="Organization or cause name"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium" style={{ color: "#191970" }}>
                    Approximate percentage given back
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.givesBackPct}
                    onChange={(e) => updateField("givesBackPct", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
                    placeholder="e.g., 5%"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="is-non-profit"
                    type="checkbox"
                    checked={formData.isNonProfit}
                    onChange={(e) => updateToggle("isNonProfit", e.target.checked)}
                    className="h-4 w-4 accent-[#191970]"
                  />
                  <label htmlFor="is-non-profit" className="text-sm text-gray-700">
                    We are a registered nonprofit.
                  </label>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-500 mb-2">
                    Badge preview (applied after review)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 border border-[#191970]/20">
                      <div className="relative h-6 w-6 flex items-center justify-center rounded-full" style={{ backgroundColor: "#191970" }}>
                        <span
                          style={{
                            fontFamily: "Playfair Display, serif",
                            fontSize: "10px",
                            lineHeight: 1,
                            color: "#D4AF37",
                            letterSpacing: "-0.02em",
                          }}
                        >
                          FS
                        </span>
                        <span
                          className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: "#D4AF37" }}
                        >
                          <span
                            style={{
                              fontSize: "8px",
                              lineHeight: 1,
                              color: "#191970",
                            }}
                          >
                            ✦
                          </span>
                        </span>
                      </div>
                      <span className="text-xs text-[#191970] font-medium">Founding Seller</span>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 border border-[#191970]/20">
                      <div className="relative h-6 w-6 flex items-center justify-center rounded-full" style={{ backgroundColor: "#191970" }}>
                        <TSLogo size={14} primaryColor="#ffffff" accentColor="#D4AF37" />
                        <span
                          className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: "#D4AF37" }}
                        >
                          <Check className="h-2 w-2 text-[#191970]" strokeWidth={2} />
                        </span>
                      </div>
                      <span className="text-xs text-[#191970] font-medium">Gives Back</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
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


