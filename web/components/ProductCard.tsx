'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { TSLogo } from './TSLogo';

export interface Product {
  id: string;
  title: string;
  price: number;
  description: string;
  seller: string;
  sellerLogo?: string;
  imageUrl: string;
  images: string[];
  tags: string[];
  location: string;
  sellerRating: number;
  sellerReviews: number;
  shipping: string;
  condition: string;
  isTrustedSeller?: boolean;
}

interface ProductCardProps {
  product: Product;
  onFavorite: (id: string) => void;
  onSwipeUp: () => void;
  onTap: (imageIndex: number) => void;
  isFavorited: boolean;
}

export function ProductCard({ product, onFavorite, onSwipeUp, onTap, isFavorited }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showSparkle, setShowSparkle] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev > 0 ? prev - 1 : product.images.length - 1
    );
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev < product.images.length - 1 ? prev + 1 : 0
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - touchEndX;
    const diffY = touchStartY.current - touchEndY;

    // Horizontal swipe for images
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        setCurrentImageIndex((prev) => 
          prev < product.images.length - 1 ? prev + 1 : 0
        );
      } else {
        setCurrentImageIndex((prev) => 
          prev > 0 ? prev - 1 : product.images.length - 1
        );
      }
    }
    // Vertical swipe handled by parent
  };

  const handleCardTap = () => {
    onTap(currentImageIndex);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavorite(product.id);
    
    // Show sparkle animation
    setShowSparkle(true);
    setTimeout(() => setShowSparkle(false), 800);
  };

  // Truncate description to ~60 chars
  const truncatedDescription = product.description?.length > 60 
    ? product.description.slice(0, 60) + '...' 
    : product.description;

  const currentImage = product.images?.[currentImageIndex] || product.imageUrl || 'https://placehold.co/800x1200/191970/cfb53b?text=No+Image';
  
  // Debug
  console.log('ProductCard rendering:', { 
    id: product.id, 
    title: product.title,
    imageUrl: product.imageUrl, 
    images: product.images,
    currentImage 
  });

  return (
    <div 
      className="relative w-full h-full"
      style={{ fontFamily: 'Merriweather, serif' }}
    >
      {/* Full-screen image */}
      <div 
        className="absolute inset-0 cursor-pointer"
        onClick={handleCardTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {currentImage ? (
          <img
            src={currentImage}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <span className="text-gray-500">No image</span>
          </div>
        )}
      </div>

      {/* TS Logo Header - Top Left */}
      <div className="absolute top-4 left-4 z-10">
        <TSLogo size={32} primaryColor="#000080" accentColor="#efbf04" />
      </div>

      {/* Sparkle Button - Top Right */}
      <motion.button
        onClick={handleFavorite}
        className="absolute top-20 right-4 z-10 w-12 h-12 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(10px)' }}
        whileTap={{ scale: 0.85 }}
      >
        <motion.div
          animate={isFavorited ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Sparkles 
            className="w-6 h-6" 
            style={{ 
              color: isFavorited ? '#efbf04' : 'white',
              fill: isFavorited ? '#efbf04' : 'transparent',
            }} 
          />
        </motion.div>
      </motion.button>

      {/* Sparkle Animation on Favorite */}
      <AnimatePresence>
        {showSparkle && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <Sparkles className="w-24 h-24" style={{ color: '#efbf04', fill: '#efbf04' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Navigation Arrows */}
      {product.images?.length > 1 && (
        <>
          <button
            onClick={handlePrevImage}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center z-10 opacity-60 hover:opacity-100 transition-opacity"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={handleNextImage}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center z-10 opacity-60 hover:opacity-100 transition-opacity"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      {/* Image Dots Indicator */}
      {product.images?.length > 1 && (
        <div className="absolute top-1/2 right-3 -translate-y-1/2 flex flex-col gap-1.5 z-10">
          {product.images.map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full transition-all"
              style={{
                backgroundColor: index === currentImageIndex ? '#efbf04' : 'rgba(255,255,255,0.5)',
                transform: index === currentImageIndex ? 'scale(1.3)' : 'scale(1)',
              }}
            />
          ))}
        </div>
      )}

      {/* Bottom Gradient Overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '40%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.2) 80%, transparent 100%)',
        }}
      />

      {/* Product Info - Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-5 z-10">
        {/* Title */}
        <h2 
          className="text-white mb-1 leading-tight overflow-hidden"
          style={{ 
            fontFamily: 'Merriweather, serif',
            fontSize: 'clamp(9px, 2.5vw, 12px)',
            lineHeight: 1.2,
            maxHeight: '2.4em',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            textOverflow: 'ellipsis',
          }}
        >
          {product.title || 'Untitled'}
        </h2>

        {/* Price */}
        <p 
          className="text-[9px] font-bold mb-1.5"
          style={{ color: '#cfb53b', fontFamily: 'Merriweather, serif' }}
        >
          ${(product.price ?? 0).toFixed(2)}
        </p>

        {/* Description - Small, truncated */}
        {truncatedDescription && (
          <p 
            className="text-xs mb-2 leading-snug"
            style={{ color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'Merriweather, serif' }}
          >
            {truncatedDescription}
          </p>
        )}

        {/* Tags - After description, before seller */}
        {product.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {product.tags.slice(0, 3).map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="px-2 py-0.5 rounded-full text-[10px]"
                style={{
                  backgroundColor: 'rgba(207, 181, 59, 0.2)',
                  color: '#cfb53b',
                  fontFamily: "'Source Sans 3', sans-serif",
                }}
              >
                {tag}
              </span>
            ))}
            {product.tags.length > 3 && (
              <span className="text-[10px] text-white/50" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>+{product.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Seller Info - Last */}
        <div className="flex items-center gap-2 text-[11px]" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          {product.sellerLogo && (
            <img
              src={product.sellerLogo}
              alt={product.seller}
              className="w-4 h-4 rounded-full object-cover"
            />
          )}
          <span>{product.seller}</span>
          {product.location && (
            <>
              <span>•</span>
              <span>{product.location}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
