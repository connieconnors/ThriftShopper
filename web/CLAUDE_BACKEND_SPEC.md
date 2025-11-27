# ThriftShopper - Backend Integration Specification

## 🎯 CRITICAL: Design Preservation
**DO NOT CHANGE THE FRONTEND DESIGN OR LAYOUT**
- All Tailwind classes, inline styles, and component structures must be preserved exactly
- Only add backend functionality - do not modify UI/UX
- The design is complete and intentional - backend work should be invisible to the user experience

---

## 📱 App Overview

**ThriftShopper** - "the magic of discovery™"

A discovery-focused marketplace for second-hand items with a TikTok-style vertical scrolling interface.

### Design System
- **Font:** Merriweather (serif) - used throughout
- **Primary Colors:**
  - Midnight Blue: `#191970`
  - Old Gold: `#cfb53b`
- **Accent Colors:**
  - Navy: `#000080` (logo)
  - Gold: `#efbf04` (tagline)
- **Platform:** Mobile-first, responsive design

---

## 🏗️ Current Architecture

### Key Components

#### 1. **App.tsx** (Main Entry Point)
- Manages global state
- Routes between buyer/seller modes
- Handles authentication state
- Contains all mock product data

#### 2. **Buyer Experience**
- **ProductCard.tsx** - TikTok-style vertical product cards
  - Horizontal image swipe (multiple photos per product)
  - Heart favorite button (white outline, no background)
  - Tap-to-open detail modal
  - TS badge for trusted sellers
  
- **MoodWheel.tsx** - Mood/vibe selector
  - 6 moods: whimsical, vintage, elegant, quirky, rustic, retro
  - Filters product discovery

- **VoiceInput.tsx** - Voice-activated NLP search
  - Recording animation
  - Natural language queries

- **ProductDetailModal.tsx** - Full product details
  - Swipeable image gallery
  - Seller info with TS badge
  - Buy now button
  - Favorite toggle

#### 3. **Seller Experience**
- **SellerLogin.tsx** - Simple login screen
- **SellerOnboarding.tsx** - Multi-step form for new sellers
- **SellerView.tsx** - Dashboard with:
  - 4-column stats grid (Active Listings, Sold Items, Total Earnings, Followers)
  - Your Listings table
  - Recent Sales table
  - Add New Listing button
  
- **AddListingForm.tsx** - Create new product listings
  - Photo upload (up to 5 images)
  - Title, description, price
  - Keyword tagging
  - Condition selector

#### 4. **Shared Components**
- **TSLogo.tsx** - Trusted Seller badge
  - "TS" in Merriweather Bold + star symbol (✦)
  - Customizable colors and sizes
  - Multi-meaning: Trusted Seller/Buyer, ThriftSeller/Buyer

---

## 📊 Data Structures

### Product Interface
```typescript
interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  seller: string;
  sellerAvatar: string;
  isTrustedSeller: boolean;
  description: string;
  condition: string;
  mood?: string;
  keywords?: string[];
  category?: string;
}
```

### Seller Interface (Needed)
```typescript
interface Seller {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isTrusted: boolean;
  activeListings: number;
  soldItems: number;
  totalEarnings: number;
  followers: number;
  joinedDate: string;
}
```

### User Interface (Needed)
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  isSeller: boolean;
  favorites: string[]; // Product IDs
  following: string[]; // Seller IDs
}
```

---

## 🔧 Backend Requirements

### Database Tables Needed (Supabase Recommended)

#### 1. **users**
- id (uuid, primary key)
- email (text, unique)
- name (text)
- avatar_url (text, nullable)
- is_seller (boolean, default false)
- created_at (timestamp)

#### 2. **sellers**
- id (uuid, primary key, references users.id)
- is_trusted (boolean, default false)
- active_listings_count (integer, default 0)
- sold_items_count (integer, default 0)
- total_earnings (decimal)
- followers_count (integer, default 0)
- created_at (timestamp)

#### 3. **products**
- id (uuid, primary key)
- seller_id (uuid, references sellers.id)
- title (text)
- description (text)
- price (decimal)
- condition (text)
- mood (text, nullable)
- category (text, nullable)
- images (jsonb) // Array of image URLs
- keywords (text[], nullable)
- is_active (boolean, default true)
- created_at (timestamp)
- updated_at (timestamp)

#### 4. **favorites**
- id (uuid, primary key)
- user_id (uuid, references users.id)
- product_id (uuid, references products.id)
- created_at (timestamp)
- UNIQUE constraint on (user_id, product_id)

#### 5. **sales**
- id (uuid, primary key)
- product_id (uuid, references products.id)
- seller_id (uuid, references sellers.id)
- buyer_id (uuid, references users.id)
- amount (decimal)
- sale_date (timestamp)

#### 6. **follows**
- id (uuid, primary key)
- follower_id (uuid, references users.id)
- seller_id (uuid, references sellers.id)
- created_at (timestamp)
- UNIQUE constraint on (follower_id, seller_id)

### Authentication
- Use Supabase Auth
- Email/password for sellers
- Optional social login for buyers
- Session management

### Storage
- Supabase Storage bucket for product images
- Max 5 images per product
- Image optimization/compression

---

## 🎯 Features Requiring Backend

### Must-Have (Priority 1)
1. **User Authentication**
   - Seller login/signup (SellerLogin.tsx)
   - Session persistence
   - Logout functionality

2. **Product CRUD**
   - Create listing (AddListingForm.tsx)
   - Read/fetch products (App.tsx, ProductCard.tsx)
   - Update listing
   - Delete/deactivate listing

3. **Favorites System**
   - Toggle favorite (ProductCard.tsx, ProductDetailModal.tsx)
   - Persist favorites per user
   - Fetch user's favorited products

4. **Seller Dashboard**
   - Real stats (SellerView.tsx)
   - Real listings table
   - Real sales history

### Nice-to-Have (Priority 2)
5. **Image Upload**
   - Upload to Supabase Storage
   - Generate URLs for database
   - Delete unused images

6. **Seller Onboarding**
   - Save onboarding data (SellerOnboarding.tsx)
   - Mark seller account as complete

7. **Follow Sellers**
   - Follow/unfollow functionality
   - Follower count updates

8. **Voice Search**
   - NLP query processing (may need external API)
   - Product search/filtering

### Future (Priority 3)
9. **Purchase Flow**
   - Payment integration (Stripe?)
   - Order management
   - Transaction history

10. **Messaging**
    - Buyer-seller chat
    - Notifications

---

## 🔄 Current State vs Needed State

### What Works Now (Frontend Only)
✅ All UI components render correctly
✅ Mock data displays properly
✅ Navigation between buyer/seller modes
✅ Form inputs and validation (frontend)
✅ Image carousel/swipe functionality
✅ Modal interactions
✅ Favorites toggle (visual only, no persistence)

### What Needs Backend
❌ User authentication (currently mock)
❌ Product data persistence (currently hardcoded)
❌ Favorites persistence (visual only)
❌ Image uploads (currently mock URLs)
❌ Seller stats (currently hardcoded numbers)
❌ Real-time data updates
❌ Search/filtering with real data

---

## 🚨 Implementation Guidelines

### DO:
- Add Supabase client configuration
- Create API hooks (useProducts, useAuth, useFavorites, etc.)
- Add loading states to existing components
- Add error handling with user-friendly messages
- Use environment variables for API keys
- Implement Row Level Security (RLS) in Supabase

### DO NOT:
- Change any Tailwind classes or inline styles
- Modify component layout or structure
- Remove or alter the Merriweather font
- Change color scheme
- Alter the TikTok-style vertical scroll
- Modify the mood wheel functionality
- Change the TS badge design
- Add new UI elements without approval

### Code Style:
- Keep all existing TypeScript interfaces
- Maintain functional components with hooks
- Use async/await for API calls
- Add comments for backend integration points
- Handle loading/error states gracefully

---

## 📝 Getting Started Checklist

1. [ ] Set up Supabase project
2. [ ] Create database tables (see schema above)
3. [ ] Configure Supabase Storage bucket
4. [ ] Set up Row Level Security policies
5. [ ] Install Supabase client: `npm install @supabase/supabase-js`
6. [ ] Create `.env.local` with Supabase keys
7. [ ] Create `lib/supabase.ts` client configuration
8. [ ] Create API hooks in `hooks/` folder
9. [ ] Replace mock data with real API calls
10. [ ] Test each feature thoroughly

---

## 🎨 Design Reference

See these files for exact design implementation:
- `/TS_Logo_Design_Specs.md` - Logo specifications
- `/guidelines/Guidelines.md` - Project guidelines
- `/styles/globals.css` - Typography and base styles

---

## 💬 Questions to Ask

Before starting, clarify:
- Which backend? (Supabase recommended, already familiar)
- Image hosting strategy? (Supabase Storage recommended)
- Payment provider? (Stripe, Square, later priority)
- Voice NLP service? (Google Cloud Speech-to-Text, OpenAI Whisper, later priority)

---

## 🎯 Success Criteria

Backend integration is successful when:
1. Users can create accounts and log in
2. Sellers can create real product listings with images
3. Products persist and load from database
4. Favorites are saved and synced across sessions
5. Seller dashboard shows real data
6. All existing UI functionality still works exactly as before
7. No visual changes to the design

---

**Remember: The frontend is perfect. Your job is to make it functional with real data while keeping the design 100% intact.**
