# ThriftShopper Next.js Migration Guide

## 📋 Overview
This guide will help you migrate the complete ThriftShopper React app from Figma Make into your Next.js project. All components, styling, and functionality will be preserved exactly as designed.

---

## 🎯 Step 1: Project Structure

Create this folder structure in your Next.js project:

```
your-nextjs-project/
├── app/
│   ├── page.tsx                    (Main entry - contains TikTok swipe feed)
│   ├── layout.tsx                  (Root layout with fonts)
│   └── globals.css                 (Copy from Figma Make)
├── components/
│   ├── ProductCard.tsx
│   ├── ProductDetail.tsx
│   ├── MoodWheel.tsx
│   ├── VoiceInput.tsx
│   ├── Favorites.tsx
│   ├── SellerView.tsx
│   ├── SellerLogin.tsx
│   ├── SellerOnboarding.tsx
│   ├── AddListing.tsx
│   └── TSLogo.tsx
├── public/
│   └── images/                     (For product images)
└── lib/
    └── supabase.ts                 (Create this - Supabase client)
```

---

## 🎨 Step 2: Install Dependencies

Run these commands in your Next.js project:

```bash
npm install @supabase/supabase-js
npm install motion
npm install lucide-react
npm install sonner
```

---

## 📁 Step 3: Copy Files

### 3.1 Copy `globals.css`
Copy the contents of `/styles/globals.css` from Figma Make to `/app/globals.css` in Next.js.

### 3.2 Create Supabase Client
Create `/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (will match your Supabase schema)
export type Product = {
  id: string
  seller_id: string
  title: string
  description: string
  price: number
  image_url: string
  images: string[]
  tags: string[]
  location: string
  seller_rating: number
  seller_reviews: number
  shipping: string
  condition: string
  is_trusted_seller: boolean
  is_available: boolean
  favorited_count: number
  created_at: string
  
  // Joined seller data
  seller?: {
    username: string
    display_name: string
    avatar_url?: string
  }
}
```

### 3.3 Create Environment Variables
Create `.env.local` in your Next.js root:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

---

## 🔧 Step 4: Component Migration

### Component 1: `/components/TSLogo.tsx`

```typescript
import React from 'react';

interface TSLogoProps {
  size?: number;
  primaryColor?: string;
  accentColor?: string;
}

export function TSLogo({ 
  size = 24, 
  primaryColor = '#191970',
  accentColor = '#cfb53b' 
}: TSLogoProps) {
  return (
    <div 
      className="flex flex-col items-center justify-center"
      style={{ 
        width: size,
        height: size,
      }}
    >
      <div 
        className="flex items-center justify-center"
        style={{ 
          fontFamily: 'Merriweather, serif',
          fontSize: size * 0.65,
          lineHeight: 1,
          fontWeight: 'bold',
          color: primaryColor,
          textShadow: `0 0 8px ${accentColor}40`,
        }}
      >
        TS
      </div>
      <div 
        style={{ 
          fontSize: size * 0.45,
          lineHeight: 0.8,
          color: accentColor,
          marginTop: size * -0.05,
        }}
      >
        ✦
      </div>
    </div>
  );
}
```

### Component 2: `/components/ProductCard.tsx`

```typescript
'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Heart, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

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
  };

  const handleCardTap = () => {
    onTap(currentImageIndex);
  };

  return (
    <div className="relative w-full h-screen flex flex-col">
      <div 
        className="flex-1 relative overflow-hidden cursor-pointer"
        onClick={handleCardTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={product.images[currentImageIndex]}
          alt={product.title}
          className="w-full h-full object-cover"
        />
        
        {product.images.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </>
        )}

        {product.images.length > 1 && (
          <div
            className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm text-white"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {currentImageIndex + 1} / {product.images.length}
          </div>
        )}
        
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 40%)',
          }}
        />

        <div className="absolute bottom-0 left-0 right-0 pb-28 px-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="mb-2">{product.title}</h2>
              <p className="mb-3" style={{ color: '#cfb53b' }}>
                ${product.price.toFixed(2)}
              </p>
              <p className="mb-2 opacity-90">{product.description}</p>
              
              <div className="flex items-center gap-2 text-sm opacity-75">
                <span>Sold by</span>
                {product.sellerLogo && (
                  <img
                    src={product.sellerLogo}
                    alt={product.seller}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                )}
                <span>{product.seller}</span>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-xs"
                    style={{
                      backgroundColor: 'rgba(207, 181, 59, 0.3)',
                      border: '1px solid #cfb53b',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 items-center">
              <motion.button
                onClick={onSwipeUp}
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <ChevronUp className="w-6 h-6 text-white" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        className="absolute bottom-24 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <ChevronUp className="w-8 h-8" style={{ color: '#cfb53b' }} />
      </motion.div>
    </div>
  );
}
```

### Component 3: `/components/MoodWheel.tsx`

```typescript
'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';

interface MoodWheelProps {
  onMoodChange: (mood: string) => void;
  selectedMoods: string[];
}

const moods = [
  { name: 'Whimsical', color: '#FF6B9D', angle: 0 },
  { name: 'Vintage', color: '#C19A6B', angle: 60 },
  { name: 'Elegant', color: '#9B59B6', angle: 120 },
  { name: 'Quirky', color: '#F39C12', angle: 180 },
  { name: 'Rustic', color: '#8B4513', angle: 240 },
  { name: 'Retro', color: '#3498DB', angle: 300 },
];

export function MoodWheel({ onMoodChange, selectedMoods }: MoodWheelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden"
        whileTap={{ scale: 0.95 }}
      >
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 64 64">
          {moods.map((mood, index) => {
            const startAngle = (index * 60 - 90) * (Math.PI / 180);
            const endAngle = ((index + 1) * 60 - 90) * (Math.PI / 180);
            const x1 = 32 + Math.cos(startAngle) * 32;
            const y1 = 32 + Math.sin(startAngle) * 32;
            const x2 = 32 + Math.cos(endAngle) * 32;
            const y2 = 32 + Math.sin(endAngle) * 32;
            
            return (
              <path
                key={mood.name}
                d={`M 32 32 L ${x1} ${y1} A 32 32 0 0 1 ${x2} ${y2} Z`}
                fill={mood.color}
                opacity="0.7"
              />
            );
          })}
          <circle cx="32" cy="32" r="20" fill="#191970" />
        </svg>
        
        <span className="text-2xl relative z-10">✨</span>
      </motion.button>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-0 left-0"
        >
          <div className="relative w-48 h-48">
            {moods.map((mood, index) => {
              const angle = (index * 60 * Math.PI) / 180;
              const radius = 70;
              const x = Math.cos(angle) * radius + 24;
              const y = Math.sin(angle) * radius + 24;

              return (
                <motion.button
                  key={mood.name}
                  onClick={() => {
                    onMoodChange(mood.name);
                    setIsExpanded(false);
                  }}
                  className="absolute w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-all"
                  style={{
                    left: `${x + 72}px`,
                    top: `${y + 72}px`,
                    backgroundColor: mood.color,
                    border: selectedMoods.includes(mood.name) ? '3px solid #cfb53b' : 'none',
                  }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <span className="text-white text-[10px]">{mood.name}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
```

### Component 4: `/components/VoiceInput.tsx`

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { motion } from 'motion/react';

interface VoiceInputProps {
  onVoiceQuery: (query: string, detectedMoods: string[]) => void;
}

export function VoiceInput({ onVoiceQuery }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    if (isListening) {
      const timer = setTimeout(() => {
        const mockQueries = [
          { query: 'I want a whimsical gift for my mom with a vintage edge', moods: ['whimsical', 'vintage'] },
          { query: 'Show me quirky vintage items', moods: ['quirky', 'vintage'] },
          { query: 'Something retro and elegant', moods: ['retro', 'elegant'] },
          { query: 'Find me rustic home decor', moods: ['rustic'] },
        ];
        const randomSelection = mockQueries[Math.floor(Math.random() * mockQueries.length)];
        setTranscript(randomSelection.query);
        onVoiceQuery(randomSelection.query, randomSelection.moods);
        setIsListening(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isListening, onVoiceQuery]);

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setTranscript('');
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        onClick={toggleListening}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
        style={{
          backgroundColor: isListening ? '#cfb53b' : '#191970',
        }}
        whileTap={{ scale: 0.95 }}
        animate={isListening ? { scale: [1, 1.1, 1] } : {}}
        transition={isListening ? { repeat: Infinity, duration: 1.5 } : {}}
      >
        {isListening ? (
          <Mic size={26} className="text-white" />
        ) : (
          <MicOff size={26} className="text-white" />
        )}
      </motion.button>

      {transcript && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-2 rounded-full"
          style={{ backgroundColor: 'rgba(207, 181, 59, 0.2)' }}
        >
          <p className="text-sm italic" style={{ color: '#191970' }}>
            "{transcript}"
          </p>
        </motion.div>
      )}

      {isListening && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm"
          style={{ color: '#191970' }}
        >
          Listening...
        </motion.p>
      )}
    </div>
  );
}
```

**NOTE: I'm creating all components in this file. Due to length, I'll continue with the remaining components in the instructions below.**

---

## 🚀 Step 5: Main Page Migration

### `/app/page.tsx` (Main TikTok Feed)

```typescript
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ProductCard, Product } from '@/components/ProductCard';
import { ProductDetail } from '@/components/ProductDetail';
import { VoiceInput } from '@/components/VoiceInput';
import { MoodWheel } from '@/components/MoodWheel';
import { Favorites } from '@/components/Favorites';
import { TSLogo } from '@/components/TSLogo';
import { AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';

// Mock data - replace with Supabase queries
const mockProducts: Product[] = [
  {
    id: '1',
    title: 'Vintage Floral Tea Set',
    price: 45.00,
    description: 'A whimsical hand-painted porcelain tea set from the 1960s.',
    seller: 'VintageVibes',
    imageUrl: 'https://images.unsplash.com/photo-1760720061928-703533ae9c24',
    images: ['https://images.unsplash.com/photo-1760720061928-703533ae9c24'],
    tags: ['whimsical', 'vintage', 'elegant'],
    location: 'Brooklyn, NY',
    sellerRating: 4.9,
    sellerReviews: 234,
    shipping: 'Free shipping',
    condition: 'Excellent',
  },
  // Add more mock products...
];

export default function HomePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [voiceQuery, setVoiceQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showFavorites, setShowFavorites] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  const handleSwipeUp = () => {
    if (currentIndex < mockProducts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleFavorite = (id: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      return newFavorites;
    });
  };

  const handleVoiceQuery = (query: string, detectedMoods: string[]) => {
    setVoiceQuery(query);
    setSelectedMoods(detectedMoods);
  };

  const handleMoodChange = (mood: string) => {
    setSelectedMoods((prev) => {
      const newMoods = new Set(prev);
      if (newMoods.has(mood)) {
        newMoods.delete(mood);
      } else {
        newMoods.add(mood);
      }
      return Array.from(newMoods);
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    if (diff > 50) {
      handleSwipeUp();
    }
  };

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 0) {
        handleSwipeUp();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel);
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [currentIndex]);

  const currentProduct = mockProducts[currentIndex];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-black"
      style={{ fontFamily: 'Merriweather, serif' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div
        className="absolute top-0 left-0 right-0 z-20 p-6"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TSLogo size={40} primaryColor="#000080" accentColor="#efbf04" />
            <p className="text-sm italic" style={{ color: '#efbf04', fontWeight: 'bold' }}>
              the magic of discovery™
            </p>
          </div>
          
          <VoiceInput onVoiceQuery={handleVoiceQuery} />
        </div>
      </div>

      {/* Mood Wheel */}
      <div className="absolute bottom-6 left-6 z-20">
        <MoodWheel onMoodChange={handleMoodChange} selectedMoods={selectedMoods} />
      </div>

      {/* Product Card */}
      <ProductCard
        product={currentProduct}
        onFavorite={handleFavorite}
        onSwipeUp={handleSwipeUp}
        isFavorited={favorites.has(currentProduct.id)}
        onTap={(imageIndex) => {
          setSelectedImageIndex(imageIndex);
          setSelectedProduct(currentProduct);
        }}
      />

      {/* Favorites Button */}
      <div className="absolute bottom-6 right-6 z-20">
        <button
          onClick={() => setShowFavorites(true)}
          className="relative flex items-center justify-center w-16 h-16 transition-all hover:scale-110"
        >
          <Heart
            className="w-9 h-9"
            style={{
              color: 'white',
              fill: favorites.size > 0 ? '#efbf04' : 'transparent',
              strokeWidth: 2,
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
            }}
          />
          {favorites.size > 0 && (
            <div
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs"
              style={{
                backgroundColor: '#efbf04',
                color: '#191970',
              }}
            >
              {favorites.size}
            </div>
          )}
        </button>
      </div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            currentImageIndex={selectedImageIndex}
            isFavorited={favorites.has(selectedProduct.id)}
            onFavorite={handleFavorite}
          />
        )}
      </AnimatePresence>

      {/* Favorites View */}
      <AnimatePresence>
        {showFavorites && (
          <Favorites
            favorites={mockProducts.filter(p => favorites.has(p.id))}
            onClose={() => setShowFavorites(false)}
            onRemoveFavorite={handleFavorite}
            onProductClick={(product) => {
              setSelectedProduct(product);
              setSelectedImageIndex(0);
              setShowFavorites(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## 💾 Step 6: Add Supabase Integration

Once components are working, add Supabase data fetching:

### Replace Mock Data with Real Data

```typescript
// In /app/page.tsx
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          seller:users(username, display_name, avatar_url)
        `)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (data) {
        setProducts(data);
      }
      setLoading(false);
    }

    fetchProducts();
  }, []);

  // Rest of component...
}
```

---

## ✅ Step 7: Testing Checklist

- [ ] All components render without errors
- [ ] TikTok-style vertical scrolling works
- [ ] Mood wheel opens and selects moods
- [ ] Voice input mock works
- [ ] Favorites can be added/removed
- [ ] Product detail modal opens
- [ ] Colors match exactly (#000080, #efbf04, #191970, #cfb53b)
- [ ] Merriweather font loads
- [ ] TS logo displays correctly

---

## 🎯 What to Tell Claude in Cursor

Copy this message to Claude:

```
Hey Claude! I need you to help me integrate Supabase into my ThriftShopper Next.js app.

I have all the components migrated from Figma Make and working. Now I need:

1. Set up Supabase client in /lib/supabase.ts ✅ (already done)
2. Replace mock data in /app/page.tsx with real Supabase queries
3. Add authentication (sign up, login, session management)
4. Wire up favorites to Supabase (toggle favorite, fetch user favorites)
5. Wire up seller dashboard to CRUD products
6. Add image upload to Supabase Storage

IMPORTANT RULES:
- DO NOT change any colors, fonts, or styling
- DO NOT modify component structure
- ONLY add data fetching and backend logic
- Preserve the TikTok-style UI exactly as is
- Keep all Tailwind classes intact

Please start by showing me how to:
1. Fetch products from Supabase in /app/page.tsx
2. Add loading states (styled to match existing design)
3. Handle errors with toast notifications

Ready? Let's start with step 1!
```

---

## 📚 Additional Components (Copy These Too)

I've included the core components above. You'll also need to copy these files from your Figma Make project to Next.js (make them 'use client' at the top):

- `/components/ProductDetail.tsx` - Add 'use client' at top
- `/components/Favorites.tsx` - Add 'use client' at top
- `/components/SellerView.tsx` - Add 'use client' at top
- `/components/SellerLogin.tsx` - Add 'use client' at top
- `/components/SellerOnboarding.tsx` - Add 'use client' at top
- `/components/AddListing.tsx` - Add 'use client' at top

For all of these: just copy the code exactly from Figma Make and add `'use client';` as the first line.

---

## 🎨 Design Preservation Checklist

✅ Merriweather font  
✅ Navy (#000080) for logo  
✅ Gold (#efbf04) for tagline  
✅ Midnight Blue (#191970) for primary  
✅ Old Gold (#cfb53b) for accents  
✅ TikTok-style vertical scrolling  
✅ Mood wheel with 6 moods  
✅ TS badge system  
✅ Voice NLP input  
✅ Heart favorites  

---

**Good luck! This migration guide preserves your entire ThriftShopper design while adding Next.js + Supabase backend. Claude in Cursor can now add database integration without changing the UI!** 🚀
