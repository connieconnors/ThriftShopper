# ThriftShopper Buyer Discovery Page

A TikTok/Instagram Reels-inspired buyer discovery page featuring an innovative compact mood selection interface and immersive product browsing experience.

## Overview

ThriftShopper's Buyer Discovery Page provides a complete mobile-first discovery interface, allowing buyers to search for items based on mood attributes through an intuitive spinning color wheel interface. The design emphasizes a clean, compact experience optimized for mobile screens.

## Features

### 🎨 Compact Mood Selection System
- **8-segment spinning color wheel** button with rich jewel-tone gradient colors
- Opens an **ultra-compact modal** (6.6rem wide × 70vh tall) optimized for mobile screens
- **29 mood options** organized into 3 tabbed categories:
  - **Moods** (9 options): Surprise, Whimsical, Impulse, Quirky, Crazy, Calming, Nostalgic, Party, Playful
  - **Intents** (10 options): Gift, For Me, Home Decor, Collectibles, Heartful, Functional, Kitchen, Living, Special Occasion, Accessory
  - **Styles** (10 options): Vintage, Antique, Rustic, Retro, Elegant, Artsy, Folk Art, Holiday, Trinket, Modern
- Multi-select capability for refined discovery
- Rich gradient backgrounds with icon support (Lucide icons)
- Smooth animations and transitions
- Minimized header and footer for maximum content visibility

### 🎤 Voice Search Integration
- Navy blue microphone button for voice-activated search
- Works seamlessly alongside mood selection
- Clean modal interface

### 📱 Mobile-Optimized Design
- **Compact modal sizing**: Tall and narrow format (6.6rem × 70vh) fits perfectly on mobile screens
- **No overflow issues**: Carefully positioned with precise margin/padding adjustments
- **Reduced UI elements**: 50% smaller header/footer for maximum content area
- **4-column grid layout**: Efficiently displays mood options in vertical scrollable area
- **Minimalist text**: "Clear" and "Done" buttons with 4px font size

### 🎯 Product Feed
- Clean, distraction-free browsing
- Product cards with high-quality imagery
- Seller information with avatars
- Gold TS verification badges
- Detailed pricing and condition information

## Components

### `/App.tsx`
Main application component featuring the complete discovery interface layout with product feed.

### `/components/MoodButton.tsx`
The spinning 8-segment color wheel button that triggers mood selection. Features smooth rotation animation.

### `/components/MoodSelector.tsx`
Ultra-compact modal (6.6rem wide) containing the 29-option mood grid organized in 3 tabs. Optimized for mobile with:
- Minimized header (6px title font, 10px close button)
- 3 compact tabs (5px font)
- 4-column scrollable grid
- Tiny footer (4px font, "Clear" and "Done" buttons)
- Precise positioning to prevent screen overflow

### `/components/SearchBox.tsx`
Universal search interface supporting mood selections and voice search terms.

## Brand Colors & Design

### Primary Colors
- **Navy Blue**: `#000080` - Primary brand color (TS logo, headings, buttons)
- **Gold/Yellow**: `#efbf04` - Accent color (tagline "the magic of discovery™")
- **White**: `#FFFFFF` - Logo text, backgrounds

### Mood Selector Colors
Rich jewel-tone gradients that complement the navy and gold brand palette:
- Purple/Indigo gradients (header, selected states)
- Deep saturated colors for mood buttons (rose, emerald, amber, violet, teal, etc.)
- Gradient backgrounds: `from-[color]-700 to-[color]-800` pattern for depth

### Typography
- **Logo Font**: Merriweather (serif)
- **Tagline**: Italic styling
- **Modal Title**: 6px (ultra-compact)
- **Tab Labels**: 5px
- **Mood Labels**: 5px
- **Footer Buttons**: 4px

## Layout Specifications

### Modal Positioning (MoodSelector)
- Container margins: `marginLeft: '-14pt'`, `paddingRight: '23pt'`
- Modal width: `6.6rem` (fixed, narrow for mobile)
- Modal height: `70vh` maximum
- Grid content height: `calc(70vh - 50px)` for maximum scrollable area
- Centered on screen with backdrop blur

### Responsive Design
- Mobile-first approach
- Optimized for screens as narrow as 320px
- Touch-friendly button sizes
- No horizontal overflow
- Vertical scrolling within modal grid

## Technical Details

### Dependencies
- React 18+
- Lucide React (icons for mood options)
- Tailwind CSS v4
- TypeScript

### State Management
- `selectedMoods`: Array of selected mood attributes (multi-select)
- `showMoodSelector`: Toggle for mood selector modal
- `activeTab`: Current tab in mood selector (Moods/Intents/Styles)

### Key Features
- **Multi-select moods**: Users can select multiple mood attributes simultaneously
- **Visual feedback**: Selected moods show ring border, scale effect, and checkmark indicator
- **Tab organization**: 3 categories keep the interface organized despite 29 options
- **Scrollable grid**: 4-column layout with vertical scroll for efficient space usage
- **Gradient backgrounds**: Each mood has unique rich gradient for visual appeal

## Usage

### Basic Implementation

```tsx
import App from './App';

function Main() {
  return <App />;
}
```

### Customizing Mood Options

Edit the `categories` object in `/components/MoodSelector.tsx`:

```tsx
const categories = {
  Moods: [
    { 
      name: 'Your Mood', 
      icon: YourIcon, 
      color: 'from-color-700 to-color-800', 
      description: 'Description' 
    },
    // Add more moods
  ],
  // Add or modify categories
};
```

### Adjusting Modal Size

Fine-tune dimensions in `/components/MoodSelector.tsx`:

```tsx
// Container positioning
style={{ marginLeft: '-14pt', paddingRight: '23pt' }}

// Modal width
style={{ width: '6.6rem', minWidth: '6.6rem', maxWidth: '90vw' }}

// Grid height
style={{ maxHeight: 'calc(70vh - 50px)' }}
```

## Best Practices

### Performance
- Efficient rendering with React hooks
- Smooth animations using CSS transitions
- Optimized grid layout

### Accessibility
- Keyboard navigation support
- ARIA labels on interactive elements
- Sufficient color contrast on gradient backgrounds
- Touch targets appropriately sized

### Mobile Optimization
- **Compact design**: Minimized UI elements for maximum content
- **Precise positioning**: No overflow or cutoff on any screen size
- **Vertical layout**: Tall, narrow modal optimized for portrait mode
- **Touch-friendly**: Grid items properly sized for finger taps
- **Smooth scrolling**: Vertical scroll within modal for browsing all options

## Design Decisions

### Why Ultra-Compact?
The modal is designed to be **6.6rem wide** (very narrow) to:
1. Fit comfortably on the smallest mobile screens (320px+)
2. Prevent horizontal overflow issues
3. Keep focus on the product feed below
4. Provide a TikTok/Instagram Reels-like quick selection experience

### Why Tall Format?
The modal uses **70vh height** with minimal header/footer to:
1. Maximize visible mood options (4 columns × vertical scroll)
2. Reduce the need for excessive scrolling
3. Feel immersive without covering the entire screen
4. Balance content with ease of dismissal

### Why 3 Tabs?
Organizing 29 options into **Moods, Intents, and Styles** provides:
1. Logical categorization for easier browsing
2. Reduced cognitive load (9-10 options per tab vs. 29 at once)
3. Faster selection for users who know what they want

## Future Enhancements

- [ ] Save favorite mood combinations
- [ ] Mood-based product filtering animation
- [ ] Haptic feedback on mobile selection
- [ ] Share mood selections
- [ ] Dark mode support
- [ ] Custom mood creation

## Support

For questions or issues with the ThriftShopper Buyer Discovery Page, please contact the development team.

---

**ThriftShopper** - *the magic of discovery™*
