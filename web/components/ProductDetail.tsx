'use client';

import React from 'react';
import { motion } from 'motion/react';
import { X, MapPin, Package, Star, User, Sparkles } from 'lucide-react';
import { Product } from './ProductCard';

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
  onBuyNow?: (id: string) => void;
  currentImageIndex: number;
  isFavorited?: boolean;
  onFavorite?: (id: string) => void;
}

export function ProductDetail({ 
  product, 
  onClose, 
  onBuyNow, 
  currentImageIndex, 
  isFavorited, 
  onFavorite 
}: ProductDetailProps) {
  const handleBuyNow = () => {
    if (onBuyNow) {
      onBuyNow(product.id);
    } else {
      alert('Purchase initiated! In a real app, this would proceed to checkout.');
    }
  };

  const handleFavorite = () => {
    if (onFavorite) {
      onFavorite(product.id);
    }
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-50 bg-white overflow-y-auto"
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between p-4"
        style={{
          backgroundColor: '#191970',
          borderBottom: '2px solid #cfb53b',
        }}
      >
        <h3 className="text-white">Product Details</h3>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Main Image */}
      <div className="w-full aspect-square bg-gray-100">
        <img
          src={product.images[currentImageIndex]}
          alt={product.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Image Indicators */}
      {product.images.length > 1 && (
        <div className="flex justify-center gap-2 py-3">
          {product.images.map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: index === currentImageIndex ? '#cfb53b' : '#e0e0e0',
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Title and Price */}
        <div className="mb-4">
          <h2 className="mb-2">{product.title || 'Untitled'}</h2>
          <p style={{ color: '#cfb53b' }}>${(product.price ?? 0).toFixed(2)}</p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {product.tags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="px-3 py-1 rounded-full text-sm"
              style={{
                backgroundColor: 'rgba(25, 25, 112, 0.1)',
                color: '#191970',
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Description */}
        <div className="mb-6">
          <h4 className="mb-2">Description</h4>
          <p className="opacity-75">{product.description}</p>
        </div>

        {/* Location */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(25, 25, 112, 0.1)' }}
          >
            <MapPin className="w-5 h-5" style={{ color: '#191970' }} />
          </div>
          <div>
            <p className="text-sm opacity-75">Location</p>
            <p>{product.location}</p>
          </div>
        </div>

        {/* Seller */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
          {product.sellerLogo ? (
            <img
              src={product.sellerLogo}
              alt={product.seller}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(207, 181, 59, 0.2)' }}
            >
              <User className="w-5 h-5" style={{ color: '#191970' }} />
            </div>
          )}
          <div className="flex-1">
            <p>{product.seller}</p>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4" style={{ color: '#cfb53b' }} fill="#cfb53b" />
              <span className="text-sm opacity-75">
                {product.sellerRating} ({product.sellerReviews} reviews)
              </span>
            </div>
          </div>
        </div>

        {/* Shipping */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(25, 25, 112, 0.1)' }}
          >
            <Package className="w-5 h-5" style={{ color: '#191970' }} />
          </div>
          <div>
            <p className="text-sm opacity-75">Shipping</p>
            <p>{product.shipping}</p>
          </div>
        </div>

        {/* Condition */}
        <div className="mb-6">
          <h4 className="mb-2">Condition</h4>
          <p className="opacity-75">{product.condition}</p>
        </div>

        {/* Buy Now Button */}
        <button
          onClick={handleBuyNow}
          className="w-full py-4 rounded-lg text-white transition-all"
          style={{
            backgroundColor: '#191970',
            border: '2px solid #cfb53b',
          }}
        >
          Buy Now
        </button>

        {/* Contact Seller Button */}
        <button
          className="w-full py-4 rounded-lg mt-3 transition-all"
          style={{
            backgroundColor: 'white',
            border: '2px solid #191970',
            color: '#191970',
          }}
        >
          Contact Seller
        </button>

        {/* Save Button */}
        {onFavorite && (
          <button
            onClick={handleFavorite}
            className="w-full py-4 rounded-lg mt-3 transition-all flex items-center justify-center gap-2"
            style={{
              backgroundColor: isFavorited ? '#cfb53b' : 'white',
              border: '2px solid #cfb53b',
              color: isFavorited ? '#191970' : '#191970',
            }}
          >
            <Sparkles
              className="w-5 h-5"
              style={{
                color: isFavorited ? '#191970' : '#cfb53b',
                fill: isFavorited ? '#191970' : 'transparent',
              }}
            />
            <span>{isFavorited ? 'Saved' : 'Save This Find'}</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}

