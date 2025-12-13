// components/SellerUploadForm.tsx
// Beautiful, intuitive seller upload form with AI processing and voice input

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Loader2, X, LogIn } from 'lucide-react';
import { TSLogo } from '@/components/TSLogo';
import { useWhisperTranscription } from '@/hooks/useWhisperTranscription';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface UploadResult {
  processedImageUrl: string;
  backgroundRemoved: boolean;
  suggestedTitle: string;
  suggestedDescription: string;
  detectedCategory: string;
  detectedAttributes: string[];
  pricingIntelligence?: {
    minPrice: number;
    maxPrice: number;
    avgPrice: number;
    recentSales: number;
    source?: 'ebay' | 'ai_estimate';
  };
}

type ProcessingStep = 'idle' | 'uploading' | 'analyzing' | 'generating' | 'pricing' | 'complete';

// Voice input button component
interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

function VoiceInputButton({ onTranscript, disabled, className = '' }: VoiceInputButtonProps) {
  const {
    isRecording,
    isProcessing,
    isSupported,
    toggleRecording,
  } = useWhisperTranscription({
    onTranscriptComplete: onTranscript,
    silenceTimeout: 2000,
    maxDuration: 30000,
  });

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={toggleRecording}
      disabled={disabled || isProcessing}
      className={`
        p-2 rounded-full transition-all
        ${isRecording 
          ? 'bg-rose-500 text-white animate-pulse' 
          : isProcessing 
            ? 'bg-violet-500 text-white cursor-wait'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      title={isRecording ? 'Stop recording' : 'Voice input'}
    >
      {isProcessing ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <Mic size={18} />
      )}
    </button>
  );
}

export default function SellerUploadForm() {
  // Add this categorization function here
  const categorizeAttributes = (attributes: string[]) => {
    const styles: string[] = [];
    const moods: string[] = [];
    const intents: string[] = [];
    
    // Style descriptors (visual/aesthetic)
    const styleKeywords = ['vintage', 'modern', 'rustic', 'mid-century', 'antique', 'contemporary', 
      'traditional', 'industrial', 'bohemian', 'minimalist', 'ornate', 'sleek', 'embroidered',
      'carved', 'painted', 'glazed', 'silver plated', 'brass', 'wood', 'ceramic', 'porcelain',
      'designer', 'loafers', 'shoes', 'jewelry', 'necklace', 'pearl', 'scalloped', 'serving bowl'];
    
    // Mood descriptors (emotional/feeling)
    const moodKeywords = ['whimsical', 'elegant', 'playful', 'cozy', 'luxurious', 'quirky', 
      'charming', 'romantic', 'bold', 'delicate', 'dramatic', 'cheerful', 'sophisticated',
      'humor', 'humorous', 'fun', 'serious', 'calm', 'energetic'];
    
    // Intent descriptors (use case)
    const intentKeywords = ['gift', 'decor', 'collection', 'display', 'functional', 'serving',
      'storage', 'wedding', 'housewarming', 'birthday', 'anniversary', 'everyday', 'special occasion'];
    
    attributes.forEach(attr => {
      const lower = attr.toLowerCase();
      
      if (styleKeywords.some(k => lower.includes(k))) {
        styles.push(attr);
      }
      else if (moodKeywords.some(k => lower.includes(k))) {
        moods.push(attr);
      }
      else if (intentKeywords.some(k => lower.includes(k))) {
        intents.push(attr);
      }
      else {
        styles.push(attr); // Default to style
      }
    });
    
    return { styles, moods, intents };
  };


  // ... rest of your existing code
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string>('');
  
  // Listing tracking
  const [listingId, setListingId] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('');
  const [showProcessedImage, setShowProcessedImage] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  
  // Editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [keywords, setKeywords] = useState(''); // For moods/styles
  
  // Additional photos
  const [additionalPhoto1, setAdditionalPhoto1] = useState<string>(''); // For additional_image_url
  const [additionalPhoto2, setAdditionalPhoto2] = useState<string>(''); // For additional_image_two_url
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const additionalPhotoRef1 = useRef<HTMLInputElement>(null);
  const additionalPhotoRef2 = useRef<HTMLInputElement>(null);

  // Voice input handlers - MUST be before any returns (React Hooks rules)
  const handleTitleVoice = useCallback((transcript: string) => {
    setTitle(prev => prev ? `${prev} ${transcript}` : transcript);
  }, []);

  const handleDescriptionVoice = useCallback((transcript: string) => {
    setDescription(prev => prev ? `${prev} ${transcript}` : transcript);
  }, []);

  const handleCategoryVoice = useCallback((transcript: string) => {
    setCategory(transcript);
  }, []);

  const handleSpecificationsVoice = useCallback((transcript: string) => {
    setSpecifications(prev => prev ? `${prev} ${transcript}` : transcript);
  }, []);

  const handleKeywordsVoice = useCallback((transcript: string) => {
    setKeywords(prev => prev ? `${prev}, ${transcript}` : transcript);
  }, []);

  // Handle additional photo uploads
  const handleAdditionalPhoto = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setPhoto: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setPhoto(previewUrl);

    // Upload to Supabase Storage
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const filename = `additional-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('listings')
        .upload(filename, file, { contentType: file.type });

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('listings')
          .getPublicUrl(filename);
        setPhoto(publicUrl);
      }
    } catch (err) {
      console.error('Additional photo upload error:', err);
    }
  };

  // Show login prompt if not authenticated
  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <LogIn className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sign in to List Items</h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in to create a listing.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/login?redirect=/sell')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Log In
            </button>
            <button
              onClick={() => router.push('/signup?redirect=/sell')}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  const processingSteps = {
    'uploading': 'Uploading image...',
    'analyzing': '🔍 AI analyzing your item',
    'generating': '📝 Writing your listing',
    'pricing': '💰 Checking market prices',
    'complete': '✅ Ready to review!',
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
    setResult(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setProcessingStep('uploading');
    setError('');

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setError('Please log in to create a listing');
        setProcessingStep('idle');
        return;
      }

      const formData = new FormData();
      formData.append('image', selectedFile);
      
      // Add any user-provided inputs
      if (title) formData.append('title', title);
      if (description) formData.append('description', description);
      if (category) formData.append('category', category);

      // Simulate processing steps for better UX
      setTimeout(() => setProcessingStep('analyzing'), 500);
      setTimeout(() => setProcessingStep('generating'), 2000);
      setTimeout(() => setProcessingStep('pricing'), 4000);

      const response = await fetch('/api/seller/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setProcessingStep('complete');
      setResult(data.data);
      
      // Store listing ID and original image for toggle
      if (data.listingId) {
        setListingId(data.listingId);
      }
      // Store original image URL (the preview URL before processing)
      setOriginalImageUrl(previewUrl);
      
      // Pre-fill the form with AI suggestions
      setTitle(data.data?.suggestedTitle || '');
      setDescription(data.data?.suggestedDescription || '');
      setCategory(data.data?.detectedCategory || '');
      
      // Suggest a price based on eBay data
      if (data.data?.pricingIntelligence) {
        setPrice(data.data.pricingIntelligence.avgPrice.toString());
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setProcessingStep('idle');
    }
  };

  const handleRemoveBackground = async () => {
    if (!selectedFile || !listingId) return;

    setIsRemovingBackground(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setError('Please log in to remove background');
        setIsRemovingBackground(false);
        return;
      }

      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('listingId', listingId);

      const response = await fetch('/api/seller/remove-background', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Background removal failed');
      }

      // Update the result with the new processed image
      if (result) {
        setResult({
          ...result,
          processedImageUrl: data.processedImageUrl,
          backgroundRemoved: true,
        });
      }

      // Switch to showing the processed image
      setShowProcessedImage(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Background removal failed');
    } finally {
      setIsRemovingBackground(false);
    }
  };

  const handlePublish = async () => {
    if (!listingId) {
      setError('No listing to publish');
      return;
    }

    setIsPublishing(true);
    setError('');

    try {
      // Parse seller-added keywords
      const sellerKeywords = keywords
        .split(/[,\s]+/)
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 0);

      // Get AI-detected attributes (already saved during upload)
      const aiAttributes = (result?.detectedAttributes || [])
        .map(a => a.toLowerCase());

      // Merge seller keywords with AI-detected ones (unique values)
      const allKeywords = [...new Set([...aiAttributes, ...sellerKeywords])];

      // Update the listing with any edits and set status to active
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          title,
          description,
          price: price ? parseFloat(price) : null,
          category,
          condition: condition || null,
          specifications: specifications || null,
          // Merge AI + seller keywords into moods and styles
   // Categorize keywords properly
...(() => {
  const { styles, moods, intents } = categorizeAttributes(allKeywords);
  return { styles, moods, intents };
})(),
          status: 'active',
          // Use processed or original image based on toggle
          clean_image_url: showProcessedImage ? result?.processedImageUrl : null,
          // Additional photos
          additional_image_url: additionalPhoto1 || null,
          additional_image_two_url: additionalPhoto2 || null,
        })
        .eq('id', listingId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setIsPublished(true);
      // Don't auto-redirect - let user choose next action

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!listingId) {
      setError('No listing to save');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      // Parse seller-added keywords
      const sellerKeywords = keywords
        .split(/[,\s]+/)
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 0);

      // Get AI-detected attributes
      const aiAttributes = (result?.detectedAttributes || [])
        .map(a => a.toLowerCase());

      // Merge keywords
      const allKeywords = [...new Set([...aiAttributes, ...sellerKeywords])];

      // Update the listing but keep status as 'draft'
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          title,
          description,
          price: price ? parseFloat(price) : null,
          category,
          condition: condition || null,
          specifications: specifications || null,
          ...(() => {
            const { styles, moods, intents } = categorizeAttributes(allKeywords);
            return { styles, moods, intents };
          })(),
          // Keep as draft
          status: 'draft',
          clean_image_url: showProcessedImage ? result?.processedImageUrl : null,
          additional_image_url: additionalPhoto1 || null,
          additional_image_two_url: additionalPhoto2 || null,
        })
        .eq('id', listingId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setIsSaved(true);
      // Reset saved indicator after 2 seconds
      setTimeout(() => setIsSaved(false), 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setProcessingStep('idle');
    setResult(null);
    setError('');
    setTitle('');
    setDescription('');
    setPrice('');
    setCategory('');
    setCondition('');
    setSpecifications('');
    setKeywords('');
    setListingId(null);
    setOriginalImageUrl('');
    setShowProcessedImage(true);
    setIsPublished(false);
    setIsSaved(false);
    setAdditionalPhoto1('');
    setAdditionalPhoto2('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <TSLogo size={36} primaryColor="#191970" accentColor="#cfb53b" />
      </div>

      {/* Upload Section */}
      {!result && (
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="mb-6">
            {!previewUrl ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl text-center cursor-pointer hover:border-blue-500 hover:bg-gray-50/50 transition-all flex flex-col items-center justify-center"
                style={{ minHeight: '60vh' }}
                onClick={() => fileInputRef.current?.click()}
              >
                {/* Camera icon - large */}
                <svg
                  className="h-24 w-24 mb-6"
                  style={{ color: '#191970' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                
                {/* Options as text links */}
                <p className="text-lg text-gray-700 mb-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
                    className="font-semibold underline hover:opacity-70"
                    style={{ color: '#191970' }}
                  >
                    Take a photo
                  </button>
                  {' '}or{' '}
                  <button 
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className="font-semibold underline hover:opacity-70"
                    style={{ color: '#191970' }}
                  >
                    choose existing
                  </button>
                </p>
                <p className="text-sm text-gray-400">PNG, JPG up to 10MB</p>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full max-h-96 object-contain rounded-lg border border-gray-200"
                />
                <button
                  onClick={resetForm}
                  className="absolute top-2 right-2 bg-gray-400/80 text-white rounded-full p-1.5 hover:bg-gray-600 transition-colors"
                  title="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            
            {/* Hidden file input for gallery */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {/* Hidden file input for camera (with capture attribute) */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {selectedFile && processingStep === 'idle' && (
            <button
              onClick={handleUpload}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              ✨ Let AI Create Your Listing
            </button>
          )}

          {processingStep !== 'idle' && processingStep !== 'complete' && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-gray-700 font-medium">
                {processingSteps[processingStep]}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <h2 
            className="text-2xl font-bold mb-6"
            style={{ fontFamily: 'Merriweather, serif', color: '#191970' }}
          >
            Review Your Listing
          </h2>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Photo Section */}
            <div>
              {/* Main Photo - Toggleable */}
              <div 
                className="relative cursor-pointer group mb-3"
                onClick={() => setShowProcessedImage(!showProcessedImage)}
                title="Click to toggle background"
              >
                <img
                  src={showProcessedImage ? result.processedImageUrl : originalImageUrl}
                  alt="Product"
                  className="w-full rounded-lg border border-gray-200 transition-all duration-300"
                />
                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all rounded-lg flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 text-white bg-black/50 px-3 py-1 rounded-full text-sm transition-opacity">
                    Click to toggle view
                  </span>
                </div>
              </div>
              <div className="mb-3">
                <p className={`text-sm ${
                  showProcessedImage && result.backgroundRemoved 
                    ? 'text-green-600' 
                    : showProcessedImage && !result.backgroundRemoved
                    ? 'text-orange-600'
                    : 'text-gray-500'
                }`}>
                  {showProcessedImage 
                    ? (result.backgroundRemoved ? '✓ Background removed' : '○ Original image')
                    : '○ Original image'
                  }
                </p>
                {/* Remove Background Button - only show if not already removed */}
                {!result.backgroundRemoved && (
                  <button
                    type="button"
                    onClick={handleRemoveBackground}
                    disabled={isRemovingBackground}
                    className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isRemovingBackground ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Removing background...
                      </>
                    ) : (
                      <>
                        ✨ Remove Background
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Additional Photos (optional) */}
              <div className="grid grid-cols-2 gap-3">
                {/* Additional Photo 1 */}
                <div>
                  {additionalPhoto1 ? (
                    <div className="relative">
                      <img
                        src={additionalPhoto1}
                        alt="Additional"
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => setAdditionalPhoto1('')}
                        className="absolute -top-2 -right-2 bg-gray-500 text-white rounded-full p-1 hover:bg-gray-600"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => additionalPhotoRef1.current?.click()}
                      className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 transition"
                    >
                      <span className="text-gray-400 text-sm">+ Add photo</span>
                    </div>
                  )}
                  <input
                    ref={additionalPhotoRef1}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleAdditionalPhoto(e, setAdditionalPhoto1)}
                    className="hidden"
                  />
                </div>

                {/* Additional Photo 2 */}
                <div>
                  {additionalPhoto2 ? (
                    <div className="relative">
                      <img
                        src={additionalPhoto2}
                        alt="Additional"
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => setAdditionalPhoto2('')}
                        className="absolute -top-2 -right-2 bg-gray-500 text-white rounded-full p-1 hover:bg-gray-600"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => additionalPhotoRef2.current?.click()}
                      className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 transition"
                    >
                      <span className="text-gray-400 text-sm">+ Add photo</span>
                    </div>
                  )}
                  <input
                    ref={additionalPhotoRef2}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleAdditionalPhoto(e, setAdditionalPhoto2)}
                    className="hidden"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Add up to 2 more photos (optional)
              </p>
            </div>

            {/* Listing Details - Reordered for importance */}
            <div className="space-y-4">
              {/* 1. Title */}
              <div>
                <label className="block font-semibold mb-2" style={{ fontFamily: 'Merriweather, serif' }}>Title</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-[#333333]"
                    maxLength={80}
                    placeholder="Enter title or use voice..."
                  />
                  <VoiceInputButton onTranscript={handleTitleVoice} />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {(title || '').length}/80 characters
                </p>
              </div>

              {/* 2. Description */}
              <div>
                <label className="block font-semibold mb-2" style={{ fontFamily: 'Merriweather, serif' }}>Description</label>
                <div className="flex gap-2 items-start">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-[#333333]"
                    rows={4}
                    placeholder="Describe your item or use voice..."
                  />
                  <VoiceInputButton 
                    onTranscript={handleDescriptionVoice}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* 3. Price */}
              <div>
                <label className="block font-semibold mb-2" style={{ fontFamily: 'Merriweather, serif' }}>Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                {result.pricingIntelligence && (
                  <div className="mt-2 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(25, 25, 112, 0.1)' }}>
                    <p className="font-semibold mb-1" style={{ color: '#191970' }}>
                      💡 {result.pricingIntelligence.source === 'ebay' ? 'eBay Market Data' : 'AI Price Estimate'}:
                    </p>
                    <p style={{ color: '#191970' }}>
                      {result.pricingIntelligence.source === 'ebay' 
                        ? `Similar items sold for $${result.pricingIntelligence.minPrice} - $${result.pricingIntelligence.maxPrice}`
                        : `Suggested price range: $${result.pricingIntelligence.minPrice} - $${result.pricingIntelligence.maxPrice}`
                      }
                      {' '}(recommended: <strong style={{ color: '#cfb53b' }}>${result.pricingIntelligence.avgPrice}</strong>)
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#4b5563' }}>
                      {result.pricingIntelligence.source === 'ebay' 
                        ? `Based on ${result.pricingIntelligence.recentSales} recent eBay sales`
                        : 'Estimated based on item type, condition, and market trends'
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* 4. AI Detected Tags */}
              {result.detectedAttributes?.length > 0 && (
                <div>
                  <label className="block font-semibold mb-2" style={{ fontFamily: 'Merriweather, serif' }}>AI Detected Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {result.detectedAttributes?.map((attr, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full text-sm"
                        style={{ backgroundColor: 'rgba(207, 181, 59, 0.2)', color: '#191970', border: '1px solid #cfb53b' }}
                      >
                        {attr}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Keywords & Moods */}
              <div>
                <label className="block font-semibold mb-2" style={{ fontFamily: 'Merriweather, serif' }}>
                  Add Keywords <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-[#333333]"
                    placeholder="Add a keyword..."
                  />
                  <VoiceInputButton onTranscript={handleKeywordsVoice} />
                </div>
                {/* Clickable keyword suggestions */}
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="text-xs text-gray-500 mr-1">Suggestions:</span>
                  {['whimsical', 'vintage', 'elegant', 'quirky', 'rustic', 'retro', 'cozy', 'mid-century'].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        const currentKeywords = keywords.split(',').map(k => k.trim()).filter(k => k);
                        if (!currentKeywords.includes(suggestion)) {
                          setKeywords(currentKeywords.length > 0 ? `${keywords}, ${suggestion}` : suggestion);
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-sm border transition-all
                        ${keywords.toLowerCase().includes(suggestion) 
                          ? 'text-white' 
                          : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                        }`}
                      style={keywords.toLowerCase().includes(suggestion) ? { backgroundColor: '#191970', borderColor: '#191970' } : {}}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-600 italic mt-2" style={{ fontFamily: 'Merriweather, serif' }}>
                  💡 Add 1-2 moods (whimsical, nostalgic), intents (gift, collectibles), and styles (vintage, elegant) to help buyers discover your item.
                </p>
              </div>

              {/* 6. Category */}
              <div>
                <label className="block font-semibold mb-2" style={{ fontFamily: 'Merriweather, serif' }}>Category</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-[#333333]"
                    placeholder="e.g., Home Decor, Vintage..."
                  />
                  <VoiceInputButton onTranscript={handleCategoryVoice} />
                </div>
              </div>

              {/* 7. Condition */}
              <div>
                <label className="block font-semibold mb-2" style={{ fontFamily: 'Merriweather, serif' }}>
                  Condition <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white"
                >
                  <option value="">Select condition...</option>
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>

              {/* 8. Specifications */}
              <div>
                <label className="block font-semibold mb-2" style={{ fontFamily: 'Merriweather, serif' }}>
                  Specifications <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="flex gap-2 items-start">
                  <textarea
                    value={specifications}
                    onChange={(e) => setSpecifications(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-[#333333]"
                    rows={2}
                    placeholder="Dimensions, materials, brand, era..."
                  />
                  <VoiceInputButton 
                    onTranscript={handleSpecificationsVoice}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {isPublished ? (
              <div className="space-y-4">
                {/* Success Message */}
                <div className="bg-green-100 text-green-800 py-4 px-6 rounded-lg font-semibold text-center flex items-center justify-center gap-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span style={{ fontFamily: 'Merriweather, serif' }}>Published Successfully!</span>
                </div>
                
                {/* Next Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={resetForm}
                    className="flex-1 py-3 rounded-lg font-semibold transition text-white"
                    style={{ 
                      backgroundColor: '#191970',
                      fontFamily: 'Merriweather, serif',
                    }}
                  >
                    List Another?
                  </button>
                  <button
                    onClick={() => router.push('/seller')}
                    className="flex-1 py-3 rounded-lg font-semibold transition border-2"
                    style={{ 
                      borderColor: '#191970',
                      color: '#191970',
                      fontFamily: 'Merriweather, serif',
                    }}
                  >
                    My Listings
                  </button>
                </div>
                
                {/* View listing link */}
                <button
                  onClick={() => router.push(`/listing/${listingId}`)}
                  className="w-full text-center text-sm underline transition hover:opacity-70"
                  style={{ color: '#cfb53b' }}
                >
                  View your published listing →
                </button>
              </div>
            ) : (
              <>
                {/* Publish Button */}
                <button
                  onClick={handlePublish}
                  disabled={isPublishing || isSaving || !listingId}
                  className="flex-1 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 text-white"
                  style={{ 
                    backgroundColor: isPublishing ? '#9ca3af' : '#191970',
                    cursor: isPublishing ? 'wait' : 'pointer',
                    fontFamily: 'Merriweather, serif',
                  }}
                >
                  {isPublishing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    'Publish Listing'
                  )}
                </button>

                {/* Save Draft Button */}
                <button
                  onClick={handleSaveDraft}
                  disabled={isPublishing || isSaving || !listingId}
                  className="px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                  style={{
                    fontFamily: 'Merriweather, serif', 
                    backgroundColor: isSaved ? '#dcfce7' : '#f3f4f6',
                    color: isSaved ? '#166534' : '#374151',
                    border: '1px solid',
                    borderColor: isSaved ? '#86efac' : '#d1d5db',
                    cursor: isSaving ? 'wait' : 'pointer',
                  }}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : isSaved ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Saved
                    </>
                  ) : (
                    'Save Draft'
                  )}
                </button>
              </>
            )}

            {/* Start Over Button */}
            <button
              onClick={resetForm}
              disabled={isPublishing || isSaving}
              className="px-4 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              style={{ fontFamily: 'Merriweather, serif' }}
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
