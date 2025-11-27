# Remaining ThriftShopper Components

Copy these components to your Next.js `/components` folder. **Add `'use client';` as the first line of each file.**

---

## `/components/ProductDetail.tsx`

```typescript
'use client';

import React from 'react';
import { motion } from 'motion/react';
import { X, MapPin, Package, Star, User, Heart } from 'lucide-react';
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
          <h2 className="mb-2">{product.title}</h2>
          <p style={{ color: '#cfb53b' }}>${product.price.toFixed(2)}</p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {product.tags.map((tag) => (
            <span
              key={tag}
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

        {/* Favorite Button */}
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
            <Heart
              className="w-5 h-5"
              style={{
                color: isFavorited ? '#191970' : '#cfb53b',
                fill: isFavorited ? '#191970' : 'transparent',
              }}
            />
            <span>{isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
```

---

## `/components/Favorites.tsx`

```typescript
'use client';

import React from 'react';
import { motion } from 'motion/react';
import { X, Heart, MapPin, Star } from 'lucide-react';
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
        fontFamily: 'Merriweather, serif',
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
            <Heart className="w-8 h-8" style={{ color: '#efbf04', fill: '#efbf04' }} />
            <h1 className="text-2xl text-white">My Favorites</h1>
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
            <Heart className="w-20 h-20 mb-6" style={{ color: '#cfb53b', strokeWidth: 1 }} />
            <h2 className="text-xl text-white mb-2">No favorites yet</h2>
            <p className="text-sm" style={{ color: '#cfb53b' }}>
              Heart items as you discover them to save them here
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
                    <Heart
                      className="w-5 h-5"
                      style={{ color: '#efbf04', fill: '#efbf04' }}
                    />
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
                  <h3 className="text-sm mb-1 line-clamp-2" style={{ color: '#ffffff' }}>
                    {product.title}
                  </h3>
                  <p className="mb-2" style={{ color: '#efbf04' }}>
                    ${product.price.toFixed(2)}
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
```

---

## `/components/SellerView.tsx`

```typescript
'use client';

import React from 'react';
import { Product } from './ProductCard';
import { TSLogo } from './TSLogo';

interface SellerViewProps {
  products: Product[];
  onBack: () => void;
  onAddListing: () => void;
}

export function SellerView({ products, onBack, onAddListing }: SellerViewProps) {
  const sellerProducts = products.filter(p => p.seller === 'Thrifter Connie');
  const activeListings = sellerProducts.length;
  const soldItems = 3;
  const totalEarnings = 250.00;
  const followers = 7;

  const recentSales = [
    { item: 'Blue Denim Shirt', amount: 25.00, date: 'March 1, 2024' },
    { item: 'Wooden Coffee Table', amount: 200.00, date: 'February 25, 2024' },
  ];

  return (
    <div 
      className="absolute inset-0 z-30 overflow-y-auto"
      style={{
        backgroundColor: '#f8f9fa',
        fontFamily: 'Merriweather, serif',
      }}
    >
      {/* Header */}
      <div 
        className="sticky top-0 z-10 px-6 py-4 shadow-sm"
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TSLogo size={32} primaryColor="#000080" accentColor="#efbf04" />
            <span style={{ color: '#1f2937', fontSize: '18px' }}>ThriftShopper</span>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <button 
              onClick={onBack}
              className="transition-colors hover:opacity-70"
              style={{ color: '#4b5563' }}
            >
              Home
            </button>
            <button 
              className="transition-colors hover:opacity-70"
              style={{ color: '#4b5563' }}
            >
              Messages
            </button>
            <button 
              onClick={onBack}
              className="transition-colors hover:opacity-70"
              style={{ color: '#4b5563' }}
            >
              Log Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <h1 className="mb-6" style={{ color: '#1f2937', fontSize: '28px' }}>
          Seller Dashboard
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div 
            className="p-4 rounded-lg"
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ fontSize: '32px', color: '#1f2937', marginBottom: '4px' }}>
              {activeListings}
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>
              Active Listings
            </div>
          </div>

          <div 
            className="p-4 rounded-lg"
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ fontSize: '32px', color: '#1f2937', marginBottom: '4px' }}>
              {soldItems}
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>
              Sold Items
            </div>
          </div>

          <div 
            className="p-4 rounded-lg"
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ fontSize: '32px', color: '#1f2937', marginBottom: '4px' }}>
              ${totalEarnings.toFixed(2)}
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>
              Total Earnings
            </div>
          </div>

          <div 
            className="p-4 rounded-lg"
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ fontSize: '32px', color: '#1f2937', marginBottom: '4px' }}>
              {followers}
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>
              Followers
            </div>
          </div>
        </div>

        {/* Listings Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ color: '#1f2937', fontSize: '20px' }}>
              Your Listings
            </h2>
            <button
              onClick={onAddListing}
              className="px-4 py-2 rounded-lg transition-all hover:opacity-90"
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                fontSize: '14px',
              }}
            >
              Add New Listing
            </button>
          </div>

          <div 
            className="rounded-lg overflow-hidden"
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
            }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th className="px-4 py-3 text-left" style={{ color: '#1f2937', fontSize: '13px', fontWeight: '600' }}>
                    Title
                  </th>
                  <th className="px-4 py-3 text-left" style={{ color: '#1f2937', fontSize: '13px', fontWeight: '600' }}>
                    Price
                  </th>
                  <th className="px-4 py-3 text-left" style={{ color: '#1f2937', fontSize: '13px', fontWeight: '600' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {sellerProducts.map((product, index) => (
                  <tr 
                    key={product.id}
                    style={{ 
                      borderBottom: index < sellerProducts.length - 1 ? '1px solid #e5e7eb' : 'none'
                    }}
                  >
                    <td className="px-4 py-3" style={{ color: '#1f2937', fontSize: '14px' }}>
                      {product.title}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#1f2937', fontSize: '14px' }}>
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ color: '#10b981', fontSize: '14px' }}>
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## `/components/SellerLogin.tsx`

```typescript
'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Store, Mail, Lock } from 'lucide-react';

interface SellerLoginProps {
  onLogin: (email: string) => void;
}

export function SellerLogin({ onLogin }: SellerLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 overflow-y-auto" style={{ backgroundColor: '#f5f5f5' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-2xl bg-white shadow-xl"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#191970' }}>
            <Store size={32} color="white" />
          </div>
        </div>

        <h1 className="text-center mb-2" style={{ color: '#000080', fontFamily: 'Merriweather, serif' }}>
          Seller Portal
        </h1>
        <p className="text-center mb-8 text-gray-600">
          Start your selling journey
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 text-sm" style={{ color: '#191970' }}>
              Email
            </label>
            <div className="relative">
              <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm" style={{ color: '#191970' }}>
              Password
            </label>
            <div className="relative">
              <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-lg text-white font-medium shadow-lg mt-6"
            style={{ backgroundColor: '#191970' }}
          >
            Sign In
          </motion.button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-500">
          New seller?{' '}
          <button
            onClick={() => onLogin('demo@seller.com')}
            className="font-medium"
            style={{ color: '#cfb53b' }}
          >
            Create account
          </button>
        </p>
      </motion.div>
    </div>
  );
}
```

---

## `/components/SellerOnboarding.tsx`

```typescript
'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Store, MapPin, Mail, Phone, Package } from 'lucide-react';

interface SellerOnboardingProps {
  onComplete: (data: SellerProfile) => void;
}

export interface SellerProfile {
  storeName: string;
  description: string;
  city: string;
  state: string;
  zipCode: string;
  email: string;
  phone: string;
  shippingSpeed: string;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const SHIPPING_OPTIONS = [
  'Ships within 1-2 days',
  'Ships within 3-5 days',
  'Ships within 5-7 days',
  'Local pickup only',
  'Local pickup + Shipping available'
];

export function SellerOnboarding({ onComplete }: SellerOnboardingProps) {
  const [formData, setFormData] = useState<SellerProfile>({
    storeName: '',
    description: '',
    city: '',
    state: '',
    zipCode: '',
    email: '',
    phone: '',
    shippingSpeed: SHIPPING_OPTIONS[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData);
  };

  const updateField = (field: keyof SellerProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen py-12 px-6 overflow-y-auto" style={{ backgroundColor: '#f5f5f5' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="text-center mb-8">
          <div className="inline-flex w-20 h-20 rounded-full items-center justify-center mb-4" style={{ backgroundColor: '#191970' }}>
            <Store size={40} color="#cfb53b" />
          </div>
          <h1 className="mb-2" style={{ color: '#000080', fontFamily: 'Merriweather, serif' }}>
            Set Up Your Shop
          </h1>
          <p className="text-gray-600">
            Let's get you started selling on ThriftShopper
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div>
            <label className="block mb-2" style={{ color: '#191970' }}>
              Store Name
            </label>
            <div className="relative">
              <Store size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => updateField('storeName', e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
                placeholder="Your Store or Your Name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#191970' }}>
              Seller Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors min-h-[100px] resize-none"
              placeholder="Tell buyers about you and what makes your shop special..."
            />
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#191970' }}>
              Location
            </label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="relative">
                <MapPin size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
                  placeholder="City"
                  required
                />
              </div>
              <select
                value={formData.state}
                onChange={(e) => updateField('state', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
                required
              >
                <option value="">State</option>
                {US_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={formData.zipCode}
              onChange={(e) => updateField('zipCode', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
              placeholder="ZIP Code"
              pattern="[0-9]{5}"
              required
            />
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#191970' }}>
              Contact Information
            </label>
            <div className="space-y-3">
              <div className="relative">
                <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
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
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors"
                  placeholder="Phone (optional)"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-2" style={{ color: '#191970' }}>
              Shipping Details
            </label>
            <div className="relative">
              <Package size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={formData.shippingSpeed}
                onChange={(e) => updateField('shippingSpeed', e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-[#191970] outline-none transition-colors appearance-none"
                required
              >
                {SHIPPING_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-lg text-white font-medium shadow-lg mt-8"
            style={{ backgroundColor: '#191970' }}
          >
            Begin Selling
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
```

---

## `/components/AddListing.tsx`

```typescript
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
          <h1 style={{ color: '#000080', fontFamily: 'Merriweather, serif' }}>
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
```

---

**That's all the components! Remember to add `'use client';` at the top of each file when you paste them into your Next.js project.**
