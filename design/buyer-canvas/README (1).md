# Buyer Discovery Canvas

**Status:** Design Prototype (v0.dev)  
**Date:** December 2024  
**Purpose:** Discovery/profile page for buyers - their personal hub for managing finds, preferences, and gamification

## Overview

The Buyer Discovery Canvas is the buyer's personal space within ThriftShopper. It serves as:
- A profile/preference center (voice input for taste discovery)
- A collection manager (purchases, saved items)
- A gamification hub (badges, points, first dibs status)
- A storytelling platform (share the stories behind finds)

Think Pinterest meets loyalty program meets personal curator.

## Design Philosophy

- **Playground mentality:** Features are visible but locked initially - creates aspiration
- **No "My" overload:** Stripped possessives (Stories, not My Stories) - obviously theirs
- **Voice-first discovery:** Prominent mic button for natural preference input
- **Discovery Canvas:** Positioned as curating their taste, not just shopping

## Key Sections

### 1. Profile & Hunt Input (Top)
- Avatar + "Discovery Canvas" title
- Voice/text input: "Tell us what you're hunting for..."
- Vibe tags that build over time (vintage, rustic, quirky, etc.)

### 2. THE PLAYGROUND (~50% of screen)
Unlockable features shown with lock icons:

- **Stories:** Share the backstory of finds
- **Discovery Collection:** Organize by theme/room/era
- **Badges:** Rare Find, Collector, Early Bird (grayed out until earned)
- **First Dibs Status:** Points progress bar (150/1000 to ownership)

### 3. Purchases & Favorites (Below, scrollable)
- Horizontal scroll cards of saved items
- Horizontal scroll cards of purchased items
- Heart icons on favorites

### 4. Footer Nav
- Messages
- Support  
- TS logo (active state)

## Tech Stack (v0 Export)

- Next.js 15
- React
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Lucide icons (NO EMOJIS - emojis = AI tell)

## Files Included

- `/components/buyer-hub.tsx` - Main component
- `/components/ui/*` - shadcn/ui component library
- `/app/*` - Next.js app structure
- `/public/*` - Images and assets
- `package.json` - Dependencies

## Integration Notes

This is a **design prototype** from v0.dev. To integrate into production:

1. Extract the UI structure and layout logic
2. Replace mock data with Supabase queries
3. Wire up voice input to Whisper API
4. Connect vibe tags to buyer profile table
5. Implement badge earning logic
6. Add points accumulation system
7. Connect purchases/favorites to actual transactions

## Design Decisions

- **"Discovery Canvas" over "My Collection":** More aspirational, suggests curation
- **Playground section prominent:** Shows potential, creates FOMO for features
- **No emojis:** Clean, professional - emojis signal AI-generated
- **Voice input prominent:** Core differentiator, makes preference input natural
- **Horizontal scroll for items:** Instagram-style browsing, mobile-friendly

## Future Iterations

- Social sharing of stories
- Public collection pages (optional)
- Collection collaboration (share boards)
- Badge showcase on profile
- Tiered membership visual indicators

## Related Files

See also:
- `buyer_discovery_voice` - Voice input screen
- `buyer_discovery_card` - Individual item card design
- `buyer_favorites_page` - Full favorites view

---

**Questions?** This is a living design - expect iteration as we learn from user behavior post-launch.
