// components/SellerUploadForm.tsx
// Beautiful, intuitive seller upload form with AI processing and voice input

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Loader2, X, LogIn, ArrowLeft } from 'lucide-react';
import { TSLogo } from '@/components/TSLogo';
import { useWhisperTranscription } from '@/hooks/useWhisperTranscription';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import AIAnalysisIndicator from './AIAnalysisIndicator';

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

// Inline AI suggestion bar component
function AISuggestionBar({ 
  pendingText, 
  isPreviewing, 
  onTogglePreview, 
  onReplace 
}: { 
  pendingText: string | null; 
  isPreviewing: boolean; 
  onTogglePreview: () => void; 
  onReplace: () => void;
}) {
  if (!pendingText) return null;
  
  return (
    <div className="mt-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-blue-800">AI draft ready</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onTogglePreview}
            className="text-blue-700 hover:text-blue-900 underline font-medium"
          >
            {isPreviewing ? 'Hide Preview' : 'Preview'}
          </button>
          <button
            type="button"
            onClick={onReplace}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition"
          >
            Replace
          </button>
        </div>
      </div>
      {isPreviewing && (
        <div className="mt-2 p-2 bg-white border border-blue-200 rounded text-gray-700 text-xs">
          {pendingText}
        </div>
      )}
    </div>
  );
}

// Voice input button component
interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

function VoiceInputButton({ onTranscript, disabled, className = '', ariaLabel }: VoiceInputButtonProps) {
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
      aria-label={ariaLabel || (isRecording ? 'Stop recording' : 'Voice input')}
    >
      {isProcessing ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <Mic size={18} />
      )}
    </button>
  );
}

// Map old condition values to new ones for graceful migration
function mapConditionValue(condition: string): string {
  if (!condition) return '';
  const oldToNew: Record<string, string> = {
    'New': 'Pristine',
    'Like New': 'Pristine',
    'Excellent': 'Very Good',
    'Good': 'Very Good',
    'Fair': 'A Few Flaws (see notes)',
  };
  
  // If it's an old value, map it; otherwise return as-is
  return oldToNew[condition] || condition;
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
  const uploadInProgressRef = useRef(false); // Prevent duplicate uploads
  
  // Listing tracking
  const [listingId, setListingId] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('');
  const [showProcessedImage, setShowProcessedImage] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false); // Track if draft was just saved
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [isStripeReady, setIsStripeReady] = useState<boolean | null>(null);
  
  // Editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [story, setStory] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [sellerNotes, setSellerNotes] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [keywords, setKeywords] = useState(''); // For moods/styles
  const [isDirty, setIsDirty] = useState(false);
  
  // Track if user has manually edited fields (to avoid overwriting their input)
  const [userHasEditedTitle, setUserHasEditedTitle] = useState(false);
  const [userHasEditedDescription, setUserHasEditedDescription] = useState(false);
  const [userHasEditedCategory, setUserHasEditedCategory] = useState(false);
  const [userHasEditedPrice, setUserHasEditedPrice] = useState(false);
  
  // Store pending AI suggestions when user has edited (for Preview/Replace)
  const [pendingAITitle, setPendingAITitle] = useState<string | null>(null);
  const [pendingAIDescription, setPendingAIDescription] = useState<string | null>(null);
  const [pendingAICategory, setPendingAICategory] = useState<string | null>(null);
  const [pendingAIPrice, setPendingAIPrice] = useState<string | null>(null);
  
  // Track preview state for each field
  const [previewingTitle, setPreviewingTitle] = useState(false);
  const [previewingDescription, setPreviewingDescription] = useState(false);
  const [previewingCategory, setPreviewingCategory] = useState(false);
  const [previewingPrice, setPreviewingPrice] = useState(false);
  
  // Store user's original text before they replace with AI (for revert functionality)
  const [originalUserDescription, setOriginalUserDescription] = useState<string | null>(null);
  const [originalUserTitle, setOriginalUserTitle] = useState<string | null>(null);
  const [originalUserCategory, setOriginalUserCategory] = useState<string | null>(null);
  const [originalUserPrice, setOriginalUserPrice] = useState<string | null>(null);
  
  // Additional photos
  const [additionalPhoto1, setAdditionalPhoto1] = useState<string>(''); // For additional_image_url
  const [additionalPhoto2, setAdditionalPhoto2] = useState<string>(''); // For additional_image_two_url
  
  // Track AI tags that have been removed by the user
  const [removedAITags, setRemovedAITags] = useState<Set<string>>(new Set());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const additionalPhotoRef1 = useRef<HTMLInputElement>(null);
  const additionalPhotoRef2 = useRef<HTMLInputElement>(null);
  const storyTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Use refs to track field values at the moment AI result arrives (prevents race conditions)
  const descriptionValueRef = useRef<string>('');
  const titleValueRef = useRef<string>('');
  const categoryValueRef = useRef<string>('');
  const priceValueRef = useRef<string>('');

  // Edit mode - check for listing ID in URL
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoadingListing, setIsLoadingListing] = useState(false);

  // Check Stripe status on mount and when listingId changes
  useEffect(() => {
    const checkStripeStatus = async () => {
      if (!user || !listingId) {
        setIsStripeReady(null);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch('/api/stripe/account-status', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        const data = await response.json();
        if (data.error) {
          setIsStripeReady(false);
          return;
        }

        // Beta gating: Stripe connected enough = account_id exists AND (details_submitted OR charges_enabled)
        const hasStripeAccount = !!data.account_id;
        const isConnectedEnough = hasStripeAccount && 
          (data.details_submitted === true || data.charges_enabled === true);
        
        setIsStripeReady(isConnectedEnough);
      } catch (err) {
        console.error('Error checking Stripe status:', err);
        setIsStripeReady(false);
      }
    };

    checkStripeStatus();
  }, [user, listingId]);

  // Load existing listing if editing
  useEffect(() => {
    const loadListingForEdit = async () => {
      if (typeof window === 'undefined' || !user) return;
      
      const params = new URLSearchParams(window.location.search);
      const editListingId = params.get('edit');
      
      if (!editListingId) return;
      
      setIsEditMode(true);
      setIsLoadingListing(true);
      setListingId(editListingId);
      
      try {
        const { data: listing, error } = await supabase
          .from('listings')
          .select('*')
          .eq('id', editListingId)
          .eq('seller_id', user.id) // Security: only load own listings
          .single();
        
        if (error) throw error;
        if (!listing) {
          setError('Listing not found');
          setIsLoadingListing(false);
          return;
        }
        
        // Log what we're loading from database
        console.log('📥 [Edit Mode] Loaded from database:', {
          listingId: listing.id,
          title: listing.title,
          description: listing.description,
          story_text: listing.story_text,
          price: listing.price,
          category: listing.category,
          condition: listing.condition,
          specifications: listing.specifications,
          keywords: listing.keywords,
          ai_suggested_keywords: listing.ai_suggested_keywords,
          moods: listing.moods,
          styles: listing.styles,
          intents: listing.intents,
        });

        // Pre-populate all fields
        setTitle(listing.title || '');
        setDescription(listing.description || '');
        setStory(listing.story_text || '');
        setPrice(listing.price ? listing.price.toString() : '');
        setCategory(listing.category || '');
        // Map old condition values to new ones when loading for edit
        const mappedCondition = mapConditionValue(listing.condition || '');
        setCondition(mappedCondition);
        setSellerNotes(listing.seller_notes || '');
        setSpecifications(listing.specifications || '');
        
        // Combine moods, styles, and intents into keywords
        // Handle both array and JSON string formats from database
        const parseArrayField = (field: any): string[] => {
          if (!field) return [];
          if (Array.isArray(field)) return field;
          if (typeof field === 'string') {
            try {
              const parsed = JSON.parse(field);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          }
          return [];
        };
        
        // Load keywords from database
        const dbKeywords = parseArrayField(listing.keywords);
        const dbAiSuggested = parseArrayField(listing.ai_suggested_keywords);
        
        // For display in the keywords field, combine user keywords with categorized ones
        // (fallback to categorized if keywords column is empty for backwards compatibility)
        const moods = parseArrayField(listing.moods);
        const styles = parseArrayField(listing.styles);
        const intents = parseArrayField(listing.intents);
        
        // Prefer user-entered keywords if they exist, otherwise use categorized ones
        let keywordsToDisplay: string;
        let keywordsArrayForDisplay: string[];
        if (dbKeywords.length > 0) {
          keywordsToDisplay = dbKeywords.join(', ');
          keywordsArrayForDisplay = dbKeywords;
        } else {
          // Fallback: combine categorized keywords for display
          keywordsArrayForDisplay = [...moods, ...styles, ...intents];
          keywordsToDisplay = keywordsArrayForDisplay.join(', ');
        }
        setKeywords(keywordsToDisplay);

        // Log what we're displaying in the UI
        console.log('🖥️ [Edit Mode] Displaying in UI:', {
          title: listing.title || '',
          description: listing.description || '',
          story: listing.story_text || '',
          price: listing.price ? listing.price.toString() : '',
          category: listing.category || '',
          condition: listing.condition || '',
          seller_notes: listing.seller_notes || '',
          specifications: listing.specifications || '',
          keywordsDisplay: keywordsToDisplay,
          parsedMoods: moods,
          parsedStyles: styles,
          parsedIntents: intents,
        });
        
        // Set images
        if (listing.clean_image_url) {
          setPreviewUrl(listing.clean_image_url);
          setOriginalImageUrl(listing.original_image_url || listing.clean_image_url);
          setShowProcessedImage(true);
        } else if (listing.original_image_url) {
          setPreviewUrl(listing.original_image_url);
          setOriginalImageUrl(listing.original_image_url);
          setShowProcessedImage(false);
        }
        
        setAdditionalPhoto1(listing.additional_image_url || '');
        setAdditionalPhoto2(listing.additional_image_two_url || '');
        setIsDirty(false);
        
        // Use AI suggested keywords for detectedAttributes, or fallback to categorized keywords
        const detectedAttributes = dbAiSuggested.length > 0 ? dbAiSuggested : keywordsArrayForDisplay;
        
        // Create a result object to show the form in edit mode
        setResult({
          processedImageUrl: listing.clean_image_url || listing.original_image_url || '',
          backgroundRemoved: !!listing.clean_image_url,
          suggestedTitle: listing.title || '',
          suggestedDescription: listing.description || '',
          detectedCategory: listing.category || '',
          detectedAttributes: detectedAttributes, // Use AI suggested keywords or categorized keywords
        });
        
        setProcessingStep('complete');
      } catch (err) {
        console.error('Error loading listing:', err);
        setError(err instanceof Error ? err.message : 'Failed to load listing');
      } finally {
        setIsLoadingListing(false);
      }
    };
    
    loadListingForEdit();
  }, [user]);

  // Voice input handlers - MUST be before any returns (React Hooks rules)
  const handleTitleVoice = useCallback((transcript: string) => {
    setTitle(prev => prev ? `${prev} ${transcript}` : transcript);
  }, []);

  const handleDescriptionVoice = useCallback((transcript: string) => {
    setDescription(prev => prev ? `${prev} ${transcript}` : transcript);
  }, []);

  const handleStoryVoice = useCallback((transcript: string) => {
    setStory(prev => prev ? `${prev} ${transcript}` : transcript);
  }, []);

  // Auto-grow textarea for Story field
  useEffect(() => {
    const textarea = storyTextareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    // Set minimum height equivalent to 3 rows (approximately 72px with padding)
    const minHeight = 72; // 3 rows * ~24px line-height
    // Set height to scrollHeight or minHeight, whichever is larger
    textarea.style.height = `${Math.max(textarea.scrollHeight, minHeight)}px`;
  }, [story]);

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
    setIsDirty(true);

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

  const handleMainPhotoReplace = async (file: File) => {
    if (!listingId || !user) return;
    try {
      const filename = `original-${listingId}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('listings')
        .upload(filename, file, { contentType: file.type });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('listings')
        .getPublicUrl(filename);

      const { error: updateError } = await supabase
        .from('listings')
        .update({
          original_image_url: publicUrl,
          clean_image_url: null,
          staged_image_url: null,
        })
        .eq('id', listingId)
        .eq('seller_id', user.id);

      if (updateError) {
        throw updateError;
      }

      setPreviewUrl(publicUrl);
      setOriginalImageUrl(publicUrl);
      setShowProcessedImage(true);
      setResult((prev) =>
        prev
          ? {
              ...prev,
              processedImageUrl: publicUrl,
              backgroundRemoved: false,
            }
          : prev
      );
    } catch (err) {
      console.error('Main photo replace error:', err);
      setError('Failed to replace main photo. Please try again.');
    }
  };

  // Show login prompt if not authenticated
  if (authLoading || isLoadingListing) {
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    console.log('📁 handleFileSelect called', { 
      hasFile: !!file, 
      listingId, 
      uploadInProgress: uploadInProgressRef.current 
    });

    if (listingId) {
      setSelectedFile(file);
      setError('');
      await handleMainPhotoReplace(file);
      return;
    }

    setSelectedFile(file);
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setOriginalImageUrl(preview);
    setError('');
    
    // Clear form fields and reset edit tracking when selecting a new image
    if (!listingId) {
      setTitle('');
      setDescription('');
      setStory('');
      setCategory('');
      setPrice('');
      // Reset refs
      titleValueRef.current = '';
      descriptionValueRef.current = '';
      categoryValueRef.current = '';
      priceValueRef.current = '';
      setUserHasEditedTitle(false);
      setUserHasEditedDescription(false);
      setUserHasEditedCategory(false);
      setUserHasEditedPrice(false);
      // Clear pending AI suggestions
      setPendingAITitle(null);
      setPendingAIDescription(null);
      setPendingAICategory(null);
      setPendingAIPrice(null);
      // Clear preview states
      setPreviewingTitle(false);
      setPreviewingDescription(false);
      setPreviewingCategory(false);
      setPreviewingPrice(false);
      // Clear original user text storage
      setOriginalUserDescription(null);
      setOriginalUserTitle(null);
      setOriginalUserCategory(null);
      setOriginalUserPrice(null);
      // Reset removed AI tags when selecting a new file
      setRemovedAITags(new Set());
      setIsDirty(true);
      
      // OPTION 2: Show form immediately with placeholder result
      // This allows user to start editing while AI processes in background
      console.log('📝 Setting placeholder result to show form immediately');
      setResult({
        processedImageUrl: preview,
        backgroundRemoved: false,
        suggestedTitle: '',
        suggestedDescription: '',
        detectedCategory: '',
        detectedAttributes: [],
      });
      // Don't set processingStep here - let it stay 'idle' until upload actually starts
      // This way the manual button will show if auto-upload fails
    } else {
      // In edit mode, keep the current form visible and swap the preview image in place
      setShowProcessedImage(true);
      setIsAIAnalyzing(false);
      setProcessingStep('idle');
      setResult((prev) =>
        prev
          ? {
              ...prev,
              processedImageUrl: preview,
              backgroundRemoved: false,
            }
          : prev
      );
      setIsDirty(true);
    }

    // OPTIMIZATION: Start upload and AI analysis immediately when file is selected
    // User can now start editing while AI processes in background
    console.log('🔍 Checking if upload should start...', { 
      listingId, 
      uploadInProgress: uploadInProgressRef.current,
      shouldStart: !listingId && !uploadInProgressRef.current 
    });
    if (!listingId && !uploadInProgressRef.current) {
      console.log('📋 File selected, will start upload in 100ms...', { 
        hasFile: !!file, 
        listingId, 
        uploadInProgress: uploadInProgressRef.current 
      });
      // Small delay to ensure state is updated
      // Use the file parameter directly (closure captures it correctly)
      const fileToUpload = file;
      setTimeout(() => {
        console.log('⏰ Timeout fired, starting upload...', { 
          hasFile: !!fileToUpload,
          uploadInProgress: uploadInProgressRef.current 
        });
        // File is captured in closure, but we need to use state - but state might not be ready
        // So we'll check state in handleUpload itself
        handleUpload();
      }, 100);
    } else {
      console.log('⏭️ Skipping auto-upload:', { hasListingId: !!listingId, uploadInProgress: uploadInProgressRef.current });
    }
  };

  const handleUpload = async () => {
    console.log('🔵 handleUpload called', { hasSelectedFile: !!selectedFile });
    if (!selectedFile) {
      console.log('❌ handleUpload called but no selectedFile');
      return;
    }
    
    // Prevent duplicate uploads
    if (uploadInProgressRef.current) {
      console.log('⚠️ Upload already in progress, skipping duplicate call');
      return;
    }

    console.log('🚀 Starting upload process...');
    uploadInProgressRef.current = true;
    setProcessingStep('uploading');
    setError('');

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setError('Please log in to create a listing');
        setProcessingStep('idle');
        uploadInProgressRef.current = false; // Reset ref before returning
        return;
      }

      const formData = new FormData();
      formData.append('image', selectedFile);
      
      // Don't send title/description/category on upload - let AI always generate fresh suggestions
      // This ensures AI analysis runs every time, even on subsequent uploads
      // User can edit the AI-generated fields after they're populated

      // Simulate processing steps for better UX
      setTimeout(() => {
        setProcessingStep('analyzing');
        setIsAIAnalyzing(true);
      }, 500);
      setTimeout(() => setProcessingStep('generating'), 2000);
      setTimeout(() => setProcessingStep('pricing'), 4000);

      console.log('📤 Sending upload request to API...');
      const response = await fetch('/api/seller/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      console.log('📥 Upload response received, status:', response.status);
      const data = await response.json();
      console.log('📥 Upload response data:', { success: data.success, hasListingId: !!data.listingId, hasData: !!data.data });

      // Debug logging
      console.log('📥 Upload response received:', {
        ok: response.ok,
        success: data.success,
        hasListingId: !!data.listingId,
        hasData: !!data.data,
        dataKeys: data.data ? Object.keys(data.data) : [],
        title: data.data?.suggestedTitle || 'MISSING',
        description: data.data?.suggestedDescription ? 'present' : 'MISSING',
      });

      if (!response.ok) {
        setIsAIAnalyzing(false);
        throw new Error(data.error || 'Upload failed');
      }

      if (!data.success) {
        setIsAIAnalyzing(false);
        throw new Error(data.error || 'Upload failed');
      }

      setProcessingStep('complete');
      setIsAIAnalyzing(false);
      
      // Store listing ID and original image for toggle
      if (data.listingId) {
        setListingId(data.listingId);
      }
      // Store original image URL (the preview URL before processing)
      setOriginalImageUrl(previewUrl);
      
      // Set result for display
      if (data.data) {
        setResult(data.data);
        
        // Pre-fill the form with AI suggestions - only if user hasn't manually edited
        // This allows user to start typing while AI processes, without overwriting their input
        const aiTitle = data.data.suggestedTitle;
        const aiDescription = data.data.suggestedDescription;
        const aiCategory = data.data.detectedCategory;
        
        // Title: Auto-fill ONLY if completely untouched + empty, otherwise store as pending
        if (aiTitle && aiTitle.trim() && aiTitle !== 'New Listing') {
          if (!title.trim() && !userHasEditedTitle) {
            setTitle(aiTitle);
            console.log('✅ Set title from AI:', aiTitle);
          } else {
            setPendingAITitle(aiTitle);
            console.log('💾 Stored AI title as pending (field has content or user edited)');
          }
        }
        
        // Description: Auto-fill ONLY if completely untouched + empty, otherwise store as pending
        if (aiDescription && aiDescription.trim()) {
          // Use ref value (synchronous) to check if user has typed anything
          // This prevents race conditions where state hasn't updated yet
          const currentDescription = descriptionValueRef.current || description;
          if (!currentDescription.trim() && !userHasEditedDescription) {
            setDescription(aiDescription);
            descriptionValueRef.current = aiDescription; // Update ref
            console.log('✅ Set description from AI');
          } else {
            // Field has content OR user has edited → store as pending
            setPendingAIDescription(aiDescription);
            console.log('💾 Stored AI description as pending (field has content or user edited)', {
              currentDescription: currentDescription.substring(0, 50),
              userHasEdited: userHasEditedDescription
            });
          }
        }
        
        // Category: Auto-fill ONLY if completely untouched + empty, otherwise store as pending
        if (aiCategory && aiCategory.trim()) {
          if (!category.trim() && !userHasEditedCategory) {
            setCategory(aiCategory);
            console.log('✅ Set category from AI:', aiCategory);
          } else {
            setPendingAICategory(aiCategory);
            console.log('💾 Stored AI category as pending (field has content or user edited)');
          }
        }
        
        // Price: Auto-fill ONLY if completely untouched + empty, otherwise store as pending
        const aiPrice = data.data.pricingIntelligence?.avgPrice 
          ? data.data.pricingIntelligence.avgPrice.toString()
          : data.data.suggestedPrice?.toString() || null;
        if (aiPrice) {
          if (!price.trim() && !userHasEditedPrice) {
            setPrice(aiPrice);
            console.log('✅ Set price from AI:', aiPrice);
          } else {
            setPendingAIPrice(aiPrice);
            console.log('💾 Stored AI price as pending (field has content or user edited)');
          }
        }
      } else {
        // No data returned - this shouldn't happen but handle gracefully
        console.error('❌ No data in upload response:', data);
        setError('Upload completed but no AI analysis data was returned. Please try again.');
      }

    } catch (err) {
      console.error('❌ Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      setProcessingStep('idle');
      setIsAIAnalyzing(false);
      // On error, keep the form visible but show the error
      // Don't clear result - user might want to try again or edit manually
    } finally {
      uploadInProgressRef.current = false;
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
      setIsDirty(true);
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

    // Stripe is now optional for publishing (beta mode)
    // Sellers can publish without Stripe, but buyers can't checkout without it
    setIsPublishing(true);
    setError('');

    try {
      // Parse seller-added keywords
      const sellerKeywords = keywords
        .split(/[,\s]+/)
        .map(k => k.trim())
        .filter(k => k.length > 0);

      // Get AI-detected attributes (already saved during upload), filtering out removed ones
      const aiAttributes = (result?.detectedAttributes || []).filter(attr => !removedAITags.has(attr));

      // Save user-entered keywords as-is (array)
      const userKeywordsArray = sellerKeywords.length > 0 ? sellerKeywords : null;

      // Save AI-suggested keywords as-is (array)
      const aiSuggestedKeywordsArray = aiAttributes.length > 0 ? aiAttributes : null;

      // Merge seller keywords with AI-detected ones (unique values, lowercase for categorization)
      const allKeywordsForCategorization = [...new Set([
        ...aiAttributes.map(a => a.toLowerCase()),
        ...sellerKeywords.map(k => k.toLowerCase())
      ])];

      // Categorize keywords into styles, moods, intents
      const { styles, moods, intents } = categorizeAttributes(allKeywordsForCategorization);

      // Prepare update data
      const updateData = {
        title,
        description,
        story_text: story || null,
        price: price ? parseFloat(price) : null,
        category,
        condition: condition || null,
        seller_notes: sellerNotes || null,
        specifications: specifications || null,
        keywords: userKeywordsArray,
        ai_suggested_keywords: aiSuggestedKeywordsArray,
        styles,
        moods,
        intents,
        // Keep status as draft for now - API route will change it
        // Use processed or original image based on toggle
        clean_image_url: showProcessedImage ? result?.processedImageUrl : null,
        // Additional photos
        additional_image_url: additionalPhoto1 || null,
        additional_image_two_url: additionalPhoto2 || null,
      };

      // Log what we're sending to database (handlePublish)
      console.log('📤 [handlePublish] Sending to database:', {
        listingId,
        updateData: {
          title,
          description,
          story_text: story || null,
          price: price ? parseFloat(price) : null,
          category,
          condition: condition || null,
          specifications: specifications || null,
          keywords: userKeywordsArray,
          ai_suggested_keywords: aiSuggestedKeywordsArray,
          styles,
          moods,
          intents,
        },
        inputKeywords: keywords,
        sellerKeywords,
        aiAttributes,
        allKeywordsForCategorization,
      });

      // Update the listing with any edits and set status to active
      const { error: updateError } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', listingId);

      if (updateError) {
        console.error('❌ [handlePublish] Database update error:', updateError);
        throw new Error(updateError.message);
      }

      console.log('✅ [handlePublish] Successfully saved to database');

      // Now call the publish API route which enforces Stripe check
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const publishResponse = await fetch('/api/listings/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ listingId }),
      });

      const publishData = await publishResponse.json();

      if (!publishResponse.ok) {
        setError(publishData.error || 'Failed to publish listing');
        return;
      }

      setIsPublished(true);
      setIsDirty(false);
      // Don't auto-redirect - let user choose next action
      // In edit mode, refresh the page to show updated status
      if (isEditMode) {
        setTimeout(() => {
          router.push('/seller');
        }, 1500);
      }

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
        .map(k => k.trim())
        .filter(k => k.length > 0);

      // Get AI-detected attributes
      const aiAttributes = result?.detectedAttributes || [];

      // Save user-entered keywords as-is (array)
      const userKeywordsArray = sellerKeywords.length > 0 ? sellerKeywords : null;

      // Save AI-suggested keywords as-is (array)
      const aiSuggestedKeywordsArray = aiAttributes.length > 0 ? aiAttributes : null;

      // Merge keywords (lowercase for categorization)
      const allKeywordsForCategorization = [...new Set([
        ...aiAttributes.map(a => a.toLowerCase()),
        ...sellerKeywords.map(k => k.toLowerCase())
      ])];

      // Categorize keywords into styles, moods, intents
      const { styles, moods, intents } = categorizeAttributes(allKeywordsForCategorization);

      // Prepare update data
      const updateData = {
        title,
        description,
        story_text: story || null,
        price: price ? parseFloat(price) : null,
        category,
        condition: condition || null,
        seller_notes: sellerNotes || null,
        specifications: specifications || null,
        keywords: userKeywordsArray,
        ai_suggested_keywords: aiSuggestedKeywordsArray,
        styles,
        moods,
        intents,
        // Keep as draft
        status: 'draft',
        clean_image_url: showProcessedImage ? result?.processedImageUrl : null,
        additional_image_url: additionalPhoto1 || null,
        additional_image_two_url: additionalPhoto2 || null,
      };

      // Log what we're sending to database (handleSaveDraft)
      console.log('📤 [handleSaveDraft] Sending to database:', {
        listingId,
        updateData: {
          title,
          description,
          story_text: story || null,
          price: price ? parseFloat(price) : null,
          category,
          condition: condition || null,
          specifications: specifications || null,
          keywords: userKeywordsArray,
          ai_suggested_keywords: aiSuggestedKeywordsArray,
          styles,
          moods,
          intents,
          status: 'draft',
        },
        inputKeywords: keywords,
        sellerKeywords,
        aiAttributes,
        allKeywordsForCategorization,
      });

      // Update the listing but keep status as 'draft'
      const { error: updateError } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', listingId);

      if (updateError) {
        console.error('❌ [handleSaveDraft] Database update error:', updateError);
        throw new Error(updateError.message);
      }

      console.log('✅ [handleSaveDraft] Successfully saved to database');
      setIsSaved(true);
      setIsDirty(false);
      setDraftSaved(true);
      
      // After showing "Saved" for 1.5 seconds, change to "New Listing" state
      setTimeout(() => {
        setIsSaved(false);
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReplacePhoto = () => {
    setError('');
    fileInputRef.current?.click();
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setProcessingStep('idle');
    setResult(null);
    setError('');
    setTitle('');
    setDescription('');
    setStory('');
    setPrice('');
    setCategory('');
    setCondition('');
    setSellerNotes('');
    setSpecifications('');
    setKeywords('');
    setListingId(null);
    setOriginalImageUrl('');
    setShowProcessedImage(true);
    setIsPublished(false);
    setIsSaved(false);
    setDraftSaved(false);
    setAdditionalPhoto1('');
    setAdditionalPhoto2('');
    setIsEditMode(false);
    // Reset edit tracking
    setUserHasEditedTitle(false);
    setUserHasEditedDescription(false);
    setUserHasEditedCategory(false);
    setUserHasEditedPrice(false);
    setRemovedAITags(new Set()); // Reset removed AI tags
    setIsDirty(false);
  };


  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/seller"
            className="inline-flex items-center gap-2 text-sm text-[#191970] hover:opacity-70 transition-opacity"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          {isEditMode && isDirty && (
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSaving || !listingId}
              className="text-xs text-[#191970]/80 hover:text-[#191970] border border-[#191970]/20 rounded-full px-3 py-1 transition disabled:opacity-60"
            >
              Save changes
            </button>
          )}
        </div>
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
                <p 
                  className="text-sm mt-3"
                  style={{ 
                    color: 'rgba(0, 0, 0, 0.85)',
                    lineHeight: '1.5'
                  }}
                >
                  Perfection isn't the goal — clarity and character are. Vertical photos work best.
                </p>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full max-h-96 object-contain rounded-lg border border-gray-200"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => {
                      handleReplacePhoto();
                      fileInputRef.current?.click();
                    }}
                    className="bg-white/90 text-gray-700 rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-white transition-colors shadow-sm border border-gray-200"
                    title="Replace photo"
                  >
                    Replace
                  </button>
                  <button
                    onClick={resetForm}
                    className="bg-gray-400/80 text-white rounded-full p-1.5 hover:bg-gray-600 transition-colors"
                    title="Remove image and start over"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
            
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
          {/* Show upload button if we have placeholder data but upload hasn't started */}
          {!result.suggestedTitle && processingStep === 'idle' && (
            <div className="mb-6 p-5 bg-blue-50 border-2 border-blue-300 rounded-lg shadow-sm">
              <p className="text-blue-900 mb-3 font-medium">Ready to analyze your listing with AI?</p>
              <button
                onClick={handleUpload}
                className="w-full bg-blue-600 text-white py-3.5 rounded-lg font-semibold hover:bg-blue-700 transition text-lg shadow-md"
              >
                ✨ Let AI Create Your Listing
              </button>
            </div>
          )}
          
          {/* Header */}
          <h2 
            className="text-2xl font-bold mb-6 font-editorial"
            style={{ color: '#191970' }}
          >
            {isEditMode ? 'Edit Your Listing' : 'Review Your Listing'}
          </h2>

          <AIAnalysisIndicator isAnalyzing={isAIAnalyzing} />

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Photo Section */}
            <div>
              {/* Main Photo - Toggleable */}
              <div 
                className="relative cursor-pointer group mb-3"
                onClick={() => {
                  if (isEditMode) {
                    fileInputRef.current?.click();
                    return;
                  }
                  setShowProcessedImage(!showProcessedImage);
                }}
                title={isEditMode ? "Replace photo" : "Click to toggle background"}
              >
                <img
                  src={showProcessedImage ? result.processedImageUrl : originalImageUrl}
                  alt="Product"
                  className="w-full rounded-lg border border-gray-200 transition-all duration-300"
                />
                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all rounded-lg flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 text-white bg-black/50 px-3 py-1 rounded-full text-sm transition-opacity">
                    {isEditMode ? "Replace photo" : "Click to toggle view"}
                  </span>
                </div>
              </div>
              <div className="mb-3">
                {result.backgroundRemoved ? (
                  <button
                    type="button"
                    onClick={() => setShowProcessedImage(!showProcessedImage)}
                    className={`text-sm font-semibold ${
                      showProcessedImage ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    ✓ Remove Background&nbsp;&nbsp;&nbsp;&nbsp;○━━━
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRemoveBackground}
                    disabled={isRemovingBackground}
                    className="text-sm font-semibold text-orange-600 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Remove Background
                  </button>
                )}
                {/* Replace Photo Button */}
                <button
                  type="button"
                  onClick={handleReplacePhoto}
                  className="mt-2 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2 border border-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Replace Photo
                </button>
                {isRemovingBackground && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Removing background...
                  </div>
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
              <p 
                className="text-xs mt-2"
                style={{ 
                  color: 'rgba(0, 0, 0, 0.85)',
                  lineHeight: '1.5'
                }}
              >
                Perfection isn't the goal — clarity and character are. Vertical photos work best.
              </p>
            </div>

            {/* Listing Details - Reordered for importance */}
            <div className="space-y-4">
              {/* 1. Title */}
              <div>
                <label className="block font-semibold mb-2">Title</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setUserHasEditedTitle(true);
                      setIsDirty(true);
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-4 h-11 text-[#333333]"
                    maxLength={80}
                    placeholder={processingStep === 'analyzing' || processingStep === 'generating' ? "AI analyzing... title coming soon" : "Enter title or use voice..."}
                  />
                  <VoiceInputButton onTranscript={handleTitleVoice} />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {(title || '').length}/80 characters
                </p>
                <AISuggestionBar
                  pendingText={pendingAITitle}
                  isPreviewing={previewingTitle}
                  onTogglePreview={() => setPreviewingTitle(!previewingTitle)}
                  onReplace={() => {
                    if (pendingAITitle) {
                      setTitle(pendingAITitle);
                      setPendingAITitle(null);
                      setPreviewingTitle(false);
                    }
                  }}
                />
              </div>

              {/* 2. Description */}
              <div>
                <label className="block font-semibold mb-2">Description</label>
                <p className="text-xs text-gray-500 mb-1.5">
                  Start typing anytime — we'll never overwrite your words.
                </p>
                <div className="flex gap-2 items-start">
                  <textarea
                    value={description}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setDescription(newValue);
                      descriptionValueRef.current = newValue; // Update ref immediately (synchronous)
                      setUserHasEditedDescription(true);
                      setIsDirty(true);
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-[#333333]"
                    rows={4}
                    placeholder={processingStep === 'analyzing' || processingStep === 'generating' ? "AI analyzing... description coming soon" : "Describe your item or use voice..."}
                  />
                  <VoiceInputButton 
                    onTranscript={handleDescriptionVoice}
                    className="mt-1"
                  />
                </div>
                <AISuggestionBar
                  pendingText={pendingAIDescription}
                  isPreviewing={previewingDescription}
                  onTogglePreview={() => setPreviewingDescription(!previewingDescription)}
                  onReplace={() => {
                    if (pendingAIDescription) {
                      // Save user's original text before replacing
                      setOriginalUserDescription(description || null);
                      setDescription(pendingAIDescription);
                      descriptionValueRef.current = pendingAIDescription;
                      setPendingAIDescription(null);
                      setPreviewingDescription(false);
                    }
                  }}
                />
                {/* Show revert button if user replaced their text with AI */}
                {originalUserDescription !== null && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDescription(originalUserDescription);
                        descriptionValueRef.current = originalUserDescription;
                        setOriginalUserDescription(null);
                        // Don't restore pending - user made their choice
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      ↶ Revert to my text
                    </button>
                  </div>
                )}
              </div>

              {/* 2.5. Story */}
              <div>
                <label className="block font-semibold mb-2">
                  Story <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <p className="text-xs text-gray-500 mb-1.5 leading-relaxed">
                  A quick note in your own words — where it came from, why you loved it, or anything worth knowing.
                </p>
                <div className="flex gap-2 items-start">
                <textarea
                  ref={storyTextareaRef}
                  value={story}
                  onChange={(e) => {
                    setStory(e.target.value);
                    setIsDirty(true);
                  }}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-[#333333] resize-none overflow-hidden"
                    rows={3}
                    placeholder="Example: &quot;We found this during a kitchen reno and loved the warm glow. It&apos;s been wrapped and stored since—ready for its next home.&quot;"
                    style={{ minHeight: '72px' }}
                  />
                  <VoiceInputButton 
                    onTranscript={handleStoryVoice}
                    className="mt-1"
                    ariaLabel="Speak your story"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1 leading-tight">
                  2–4 sentences is plenty.
                </p>
              </div>

              {/* 3. Price */}
              <div>
                <label className="block font-semibold mb-2">Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      setUserHasEditedPrice(true);
                      setIsDirty(true);
                    }}
                    className="w-full border border-gray-300 rounded-lg pl-8 pr-4 h-11"
                    min="0"
                    step="0.01"
                    placeholder={processingStep === 'analyzing' || processingStep === 'pricing' ? "AI checking prices..." : ""}
                  />
                </div>
                <AISuggestionBar
                  pendingText={pendingAIPrice}
                  isPreviewing={previewingPrice}
                  onTogglePreview={() => setPreviewingPrice(!previewingPrice)}
                  onReplace={() => {
                    if (pendingAIPrice) {
                      setPrice(pendingAIPrice);
                      setPendingAIPrice(null);
                      setPreviewingPrice(false);
                    }
                  }}
                />
                
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
              {result.detectedAttributes?.filter(attr => !removedAITags.has(attr)).length > 0 && (
                <div>
                  <label className="block font-semibold mb-2">AI Detected Tags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {result.detectedAttributes?.filter(attr => !removedAITags.has(attr)).map((attr, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                        style={{ backgroundColor: 'rgba(207, 181, 59, 0.1)', color: '#4b5563', border: '1px solid rgba(207, 181, 59, 0.3)' }}
                      >
                        {attr}
                        <button
                          type="button"
                          onClick={() => {
                            setRemovedAITags(prev => new Set(prev).add(attr));
                          }}
                          className="ml-0.5 hover:bg-gray-300/50 rounded-full p-0.5 transition-colors"
                          aria-label={`Remove ${attr}`}
                        >
                          <X size={10} className="text-gray-600" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Keywords & Moods */}
              <div>
                <label className="block font-semibold mb-2">
                  Add Keywords <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <p className="text-xs text-gray-500 mb-1.5 leading-relaxed">
                  AI suggests most keywords for you. Add 1–2 if there&apos;s something only you know — where it belongs, how it&apos;s used, or why someone would love it.
                </p>
                <div className="flex gap-2 mb-1.5">
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => {
                      setKeywords(e.target.value);
                      setIsDirty(true);
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-4 h-11 text-[#333333]"
                    placeholder="Add a keyword..."
                  />
                  <VoiceInputButton onTranscript={handleKeywordsVoice} />
                </div>
                <p className="text-xs text-gray-400 italic mb-1.5 leading-tight">
                  Think: &quot;entryway statement&quot;, &quot;warm glow&quot;, &quot;giftable&quot;, &quot;small-space friendly&quot;.
                </p>
                {/* Clickable keyword suggestions */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs text-gray-400 mr-1">Suggestions:</span>
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
                      className={`px-2 py-0.5 rounded-full text-xs border transition-all
                        ${keywords.toLowerCase().includes(suggestion) 
                          ? 'text-white' 
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      style={keywords.toLowerCase().includes(suggestion) ? { backgroundColor: '#191970', borderColor: '#191970' } : {}}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Category */}
              <div>
                <label className="block font-semibold mb-2">Category</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setUserHasEditedCategory(true);
                      setIsDirty(true);
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-4 h-11 text-[#333333]"
                    placeholder={processingStep === 'analyzing' || processingStep === 'generating' ? "AI analyzing... category coming soon" : "e.g., Home Decor, Vintage..."}
                  />
                  <VoiceInputButton onTranscript={handleCategoryVoice} />
                </div>
                <AISuggestionBar
                  pendingText={pendingAICategory}
                  isPreviewing={previewingCategory}
                  onTogglePreview={() => setPreviewingCategory(!previewingCategory)}
                  onReplace={() => {
                    if (pendingAICategory) {
                      setCategory(pendingAICategory);
                      setPendingAICategory(null);
                      setPreviewingCategory(false);
                    }
                  }}
                />
              </div>

              {/* 7. Condition */}
              <div>
                <label className="block font-semibold mb-2">
                  Condition <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  value={condition}
                  onChange={(e) => {
                    setCondition(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 h-11 bg-white"
                >
                  <option value="">Select condition...</option>
                  <option value="Pristine">Pristine</option>
                  <option value="Very Good">Very Good</option>
                  <option value="Storied">Storied</option>
                  <option value="A Few Flaws (see notes)">A Few Flaws (see notes)</option>
                </select>
              </div>

              {/* 7a. Seller Notes */}
              <div>
                <label className="block font-semibold mb-2">
                  Seller notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={sellerNotes}
                  onChange={(e) => {
                    setSellerNotes(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-[#333333]"
                  rows={3}
                  placeholder="Patina, small marks, repairs, missing pieces — anything you'd want to know as a buyer."
                />
              </div>

              {/* 8. Specifications */}
              <div>
                <label className="block font-semibold mb-2">
                  Specifications <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="flex gap-2 items-start">
                <textarea
                  value={specifications}
                  onChange={(e) => {
                    setSpecifications(e.target.value);
                    setIsDirty(true);
                  }}
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
                  <span>Published Successfully!</span>
                </div>
                
                {/* Next Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={resetForm}
                    className="flex-1 py-3 rounded-lg font-semibold transition text-white"
                    style={{ 
                      backgroundColor: '#191970',
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
                    backgroundColor: (isPublishing) ? '#9ca3af' : '#191970',
                    cursor: (isPublishing) ? 'not-allowed' : 'pointer',
                  }}
                  title={isStripeReady === false ? 'Note: Connect Stripe to receive payments when buyers purchase.' : ''}
                >
                  {isPublishing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {isEditMode ? 'Updating...' : 'Publishing...'}
                    </>
                  ) : (
                    isEditMode ? 'Update Listing' : 'Publish Listing'
                  )}
                </button>

                {/* Save Draft / Saved - Upload Another Button */}
                <button
                  onClick={draftSaved ? resetForm : handleSaveDraft}
                  disabled={isPublishing || isSaving || (!listingId && !draftSaved)}
                  className="px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: (isSaved || draftSaved) ? '#dcfce7' : '#f3f4f6',
                    color: (isSaved || draftSaved) ? '#166534' : '#374151',
                    border: '1px solid',
                    borderColor: (isSaved || draftSaved) ? '#86efac' : '#d1d5db',
                    cursor: (isSaving || (!listingId && !draftSaved)) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (isSaved || draftSaved) ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Saved - Upload Another
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
            >
              Start Over
            </button>

            {/* Return to Dashboard Link */}
            <Link
              href="/seller"
              className="flex items-center justify-center gap-2 px-4 py-3 text-gray-600 hover:text-[#191970] transition-colors font-medium"
            >
              <ArrowLeft size={18} />
              Return to Seller Dashboard
            </Link>
          </div>
        </div>
      )}
      {/* Hidden file inputs (shared for upload + edit) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
