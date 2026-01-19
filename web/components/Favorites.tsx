'use client';

import React from 'react';
import { motion } from 'motion/react';
import { X, MapPin, Star } from 'lucide-react';
import { GlintIcon } from './GlintIcon';
import { Product } from './ProductCard';
import { TSLogo } from './TSLogo';

interface FavoritesProps {
  favorites: Product[];
  onClose: () => void;
  onRemoveFavorite: (id: string) => void;
  onProductClick: (product: Product) => void;
}

export function Favorites({ 
  favorites, 
  onClose, 
  onRemoveFavorite, 
  onProductClick 
}: FavoritesProps) {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{
        backgroundColor: '#191970',
      }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-10 p-6"
        style={{
          background: 'linear-gradient(to bottom, #191970 0%, rgba(25, 25, 112, 0.95) 100%)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <GlintIcon size={32} color="#efbf04" className="w-8 h-8" />
            <h1 className="text-2xl text-white">My Saved Finds</h1>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-all hover:bg-white hover:bg-opacity-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
        <p className="text-sm italic" style={{ color: '#cfb53b' }}>
          {favorites.length} {favorites.length === 1 ? 'treasure' : 'treasures'} saved
        </p>
      </div>

      {/* Content */}
      <div className="px-6 pb-24">
        {favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <GlintIcon size={80} color="#cfb53b" className="w-20 h-20 mb-6" />
            <h2 className="text-xl text-white mb-2">No saved finds yet</h2>
            <p className="text-sm" style={{ color: '#cfb53b' }}>
              Tap the sparkle as you discover treasures to save them here
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {favorites.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative rounded-lg overflow-hidden cursor-pointer group"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                }}
                onClick={() => onProductClick(product)}
              >
                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                  
                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFavorite(product.id);
                    }}
                    className="absolute top-2 right-2 p-2 rounded-full transition-all"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <GlintIcon size={20} color="#efbf04" className="w-5 h-5" />
                  </button>

                  {/* TS Badge */}
                  {product.isTrustedSeller && (
                    <div className="absolute top-2 left-2">
                      <TSLogo size={24} primaryColor="#191970" accentColor="#cfb53b" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-3">
                  <h3 className="text-sm mb-1 line-clamp-2 font-editorial" style={{ color: '#ffffff' }}>
                    {product.title}
                  </h3>
                  <p className="mb-2" style={{ color: '#efbf04' }}>
                    ${(product.price ?? 0).toFixed(2)}
                  </p>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1 text-xs" style={{ color: '#cfb53b' }}>
                    {product.sellerRating && (
                      <>
                        <Star className="w-3 h-3" style={{ fill: '#cfb53b' }} />
                        <span>{product.sellerRating}</span>
                      </>
                    )}
                  </div>

                  {/* Location */}
                  {product.location && (
                    <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: '#cfb53b' }}>
                      <MapPin className="w-3 h-3" />
                      <span>{product.location}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

