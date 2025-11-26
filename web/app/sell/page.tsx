"use client";

import { useState, useCallback, FormEvent, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";

const CONDITIONS = ["Excellent", "Good", "Fair", "Poor"];
const CATEGORIES = [
  "Furniture",
  "Home Decor",
  "Kitchen & Dining",
  "Art & Collectibles",
  "Vintage Clothing",
  "Jewelry & Accessories",
  "Books & Media",
  "Electronics",
  "Toys & Games",
  "Sports & Outdoors",
  "Other",
];

interface ImageFile {
  file: File;
  preview: string;
  id: string;
}

export default function SellPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("");
  const [category, setCategory] = useState("");
  const [specifications, setSpecifications] = useState("");
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/sell");
    }
  }, [user, authLoading, router]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newImages: ImageFile[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const preview = URL.createObjectURL(file);
        newImages.push({
          file,
          preview,
          id: Math.random().toString(36).substr(2, 9),
        });
      }
    });

    setImages((prev) => [...prev, ...newImages].slice(0, 5)); // Max 5 images
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    const totalImages = images.length;

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const fileExt = image.file.name.split(".").pop();
      const fileName = `${user!.id}/${Date.now()}-${i}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("listings")
        .upload(fileName, image.file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Error uploading image:", error.message, error);
        throw new Error(`Failed to upload image ${i + 1}: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("listings")
        .getPublicUrl(data.path);

      urls.push(urlData.publicUrl);
      setUploadProgress(((i + 1) / totalImages) * 50); // 0-50% for uploads
    }

    return urls;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("You must be logged in to create a listing");
      return;
    }

    if (images.length === 0) {
      setError("Please add at least one photo");
      return;
    }

    if (!title.trim() || !description.trim() || !price || !condition || !category) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // 1. Upload images to Supabase Storage
      const imageUrls = await uploadImages();
      setUploadProgress(60);

      // 2. Create listing record
      const { data: listing, error: listingError } = await supabase
        .from("listings")
        .insert({
          seller_id: user.id,
          title: title.trim(),
          description: description.trim(),
          price: parseFloat(price),
          condition,
          category,
          original_image_url: imageUrls[0] || null,
          clean_image_url: imageUrls[1] || null,
          staged_image_url: imageUrls[2] || null,
          status: "active",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (listingError) {
        console.error("Error creating listing:", listingError.message, listingError.code, listingError);
        throw new Error(`Failed to create listing: ${listingError.message}`);
      }

      setUploadProgress(80);

      // 3. Update user's profile to is_seller = true
      await supabase
        .from("profiles")
        .update({ is_seller: true })
        .eq("user_id", user.id);

      setUploadProgress(100);

      // 4. Redirect to listing detail page
      router.push(`/listing/${listing.id}`);
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full" />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-lg border-b border-white/10">
        <div className="px-4 py-4 flex items-center justify-between max-w-3xl mx-auto">
          <Link
            href="/browse"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold">Create Listing</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 pb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Photos <span className="text-white/40">(up to 5)</span>
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-violet-500 bg-violet-500/10"
                  : "border-white/20 hover:border-white/40 bg-slate-900/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">Drag photos here or click to upload</p>
                  <p className="text-sm text-white/40 mt-1">PNG, JPG up to 10MB each</p>
                </div>
              </div>
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <div key={image.id} className="relative flex-shrink-0">
                    <img
                      src={image.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-24 h-24 object-cover rounded-xl"
                    />
                    {index === 0 && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 text-xs rounded">
                        Main
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Vintage Mid-Century Modern Lamp"
              className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your item in detail. Include history, dimensions, any flaws..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors resize-none"
            />
          </div>

          {/* Price & Condition */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Price <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">$</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Condition <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer"
              >
                <option value="" disabled>Select condition</option>
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Category <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer"
            >
              <option value="" disabled>Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Specifications */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Specifications <span className="text-white/40">(optional)</span>
            </label>
            <textarea
              value={specifications}
              onChange={(e) => setSpecifications(e.target.value)}
              placeholder="Dimensions, materials, brand, era, etc."
              rows={3}
              className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 bg-white text-black font-bold text-lg rounded-full hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {uploadProgress < 50
                  ? "Uploading photos..."
                  : uploadProgress < 80
                  ? "Creating listing..."
                  : "Almost done..."}
              </>
            ) : (
              "Publish Listing"
            )}
          </button>

          {/* Progress Bar */}
          {isSubmitting && (
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <p className="text-center text-xs text-white/40">
            By publishing, you agree to our Seller Terms and will be responsible for shipping this item.
          </p>
        </form>
      </div>
    </main>
  );
}

