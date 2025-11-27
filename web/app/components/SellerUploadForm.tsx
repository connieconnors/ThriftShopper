// components/SellerUploadForm.tsx
// Beautiful, intuitive seller upload form with AI processing

'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface UploadResult {
  processedImageUrl: string;
  suggestedTitle: string;
  suggestedDescription: string;
  detectedCategory: string;
  detectedAttributes: string[];
  pricingIntelligence?: {
    minPrice: number;
    maxPrice: number;
    avgPrice: number;
    recentSales: number;
  };
}

type ProcessingStep = 'idle' | 'uploading' | 'removing-bg' | 'analyzing' | 'generating' | 'pricing' | 'complete';

export default function SellerUploadForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string>('');
  
  // Editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processingSteps = {
    'uploading': 'Uploading image...',
    'removing-bg': '✨ Removing background (making it look professional)',
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
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      // Add any user-provided inputs
      if (title) formData.append('title', title);
      if (description) formData.append('description', description);
      if (category) formData.append('category', category);

      // Simulate processing steps for better UX
      setTimeout(() => setProcessingStep('removing-bg'), 500);
      setTimeout(() => setProcessingStep('analyzing'), 2000);
      setTimeout(() => setProcessingStep('generating'), 4000);
      setTimeout(() => setProcessingStep('pricing'), 6000);

      const response = await fetch('/api/seller/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setProcessingStep('complete');
      setResult(data.data);
      
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

  const handlePublish = async () => {
    // TODO: Save to Supabase and publish listing
    console.log('Publishing listing:', {
      title,
      description,
      price,
      category,
      imageUrl: result?.processedImageUrl,
    });
    
    alert('Listing published! (TODO: Wire up to Supabase)');
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
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">List Your Item</h1>

      {/* Upload Section */}
      {!result && (
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="mb-6">
            <label className="block text-lg font-semibold mb-4">
              Upload Photo
            </label>
            
            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition"
              >
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <p className="text-gray-600">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-400 mt-2">PNG, JPG up to 10MB</p>
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
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
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
          <h2 className="text-2xl font-bold mb-6">Review Your Listing</h2>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Processed Image */}
            <div>
              <label className="block font-semibold mb-2">Product Photo</label>
              <img
                src={result.processedImageUrl}
                alt="Processed"
                className="w-full rounded-lg border border-gray-200"
              />
              <p className="text-sm text-green-600 mt-2">
                ✓ Background removed automatically
              </p>
            </div>

            {/* Listing Details */}
            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  maxLength={80}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(title || '').length}/80 characters
                </p>
              </div>

              <div>
                <label className="block font-semibold mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  rows={4}
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">Price</label>
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
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm">
                    <p className="font-semibold text-blue-900 mb-1">
                      💡 Market Intelligence:
                    </p>
                    <p className="text-blue-700">
                      Similar items sold for ${result.pricingIntelligence.minPrice} - $
                      {result.pricingIntelligence.maxPrice} (avg: $
                      {result.pricingIntelligence.avgPrice})
                    </p>
                    <p className="text-blue-600 text-xs mt-1">
                      Based on {result.pricingIntelligence.recentSales} recent eBay sales
                    </p>
                  </div>
                )}
              </div>

              {result.detectedAttributes?.length > 0 && (
                <div>
                  <label className="block font-semibold mb-2">AI Detected Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {result.detectedAttributes?.map((attr, i) => (
                      <span
                        key={i}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                      >
                        {attr}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handlePublish}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Publish Listing
            </button>
            <button
              onClick={resetForm}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}