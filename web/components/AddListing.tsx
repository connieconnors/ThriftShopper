'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Upload, X, Tag, DollarSign, AlignLeft, Plus } from 'lucide-react';

interface AddListingProps {
  onSubmit: (listing: NewListing) => void;
  onCancel: () => void;
}

export interface NewListing {
  images: string[];
  title: string;
  price: string;
  description: string;
  keywords: string[];
}

const MOOD_SUGGESTIONS = ['whimsical', 'vintage', 'elegant', 'quirky', 'rustic', 'retro'];

export function AddListing({ onSubmit, onCancel }: AddListingProps) {
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map((_, index) => 
        `https://images.unsplash.com/photo-${Date.now()}-${index}?w=800&h=800&fit=crop`
      );
      setImages(prev => [...prev, ...newImages].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const addKeyword = (keyword: string) => {
    const trimmed = keyword.trim().toLowerCase();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords(prev => [...prev, trimmed]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(prev => prev.filter(k => k !== keyword));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length > 0 && title && price && keywords.length > 0) {
      onSubmit({ images, title, price, description, keywords });
    }
  };

  return (
    <div className="min-h-screen py-8 px-6 overflow-y-auto" style={{ backgroundColor: '#f5f5f5' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h1 style={{ color: '#000080' }}>
            New Listing
          </h1>
          <button
            onClick={onCancel}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X size={24} color="#191970" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div>
            <label className="block mb-3" style={{ color: '#191970' }}>
              Photos (up to 5)
            </label>
            <div className="grid grid-cols-5 gap-3 mb-3">
              {images.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={img} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center"
                  >
                    <X size={14} color="white" />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#191970] transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Upload size={24} className="text-gray-400" />
                </label>
              )}
            </div>
            <p className="text-sm text-gray-500">Upload at least one photo</p>
            <p 
              className="text-sm mt-2"
              style={{ 
                color: 'rgba(0, 0, 0, 0.85)',
                lineHeight: '1.5'
              }}
            >
              Perfection isn't the goal — clarity and character are. Vertical photos work best.
            </p>
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#191970' }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
              placeholder="What are you selling?"
              required
            />
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#191970' }}>
              Price
            </label>
            <div className="relative">
              <DollarSign size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#191970' }}>
              Description
            </label>
            <div className="relative">
              <AlignLeft size={20} className="absolute left-3 top-3 text-gray-400" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors min-h-[120px] resize-none"
                placeholder="Tell buyers about your item..."
              />
            </div>
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#191970' }}>
              Keywords & Moods
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {keywords.map(keyword => (
                <span
                  key={keyword}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm text-white"
                  style={{ backgroundColor: '#191970' }}
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(keyword)}
                    className="hover:opacity-70"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Tag size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addKeyword(keywordInput);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
                  placeholder="Add a keyword..."
                />
              </div>
              <button
                type="button"
                onClick={() => addKeyword(keywordInput)}
                className="px-6 py-3 rounded-lg text-white"
                style={{ backgroundColor: '#191970' }}
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-500">Suggestions:</span>
              {MOOD_SUGGESTIONS.filter(m => !keywords.includes(m)).map(mood => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => addKeyword(mood)}
                  className="px-3 py-1 rounded-full text-sm border-2 hover:bg-gray-50 transition-colors"
                  style={{ borderColor: '#cfb53b', color: '#191970' }}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-lg text-white font-medium shadow-lg mt-8"
            style={{ backgroundColor: '#191970' }}
            disabled={images.length === 0 || !title || !price || keywords.length === 0}
          >
            List Item
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

