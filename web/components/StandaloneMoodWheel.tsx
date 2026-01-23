'use client';

/**
 * STANDALONE MOOD WHEEL COMPONENT
 * 
 * A complete, self-contained mood selection system with:
 * - Spinning 8-segment color wheel button
 * - Compact modal with 29 mood options in 3 tabs
 * - Multi-select capability
 * 
 * USAGE:
 * import { StandaloneMoodWheel } from './StandaloneMoodWheel';
 * 
 * function App() {
 *   const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
 *   
 *   return (
 *     <StandaloneMoodWheel
 *       selectedMoods={selectedMoods}
 *       onMoodsChange={setSelectedMoods}
 *     />
 *   );
 * }
 */

import { useState, useEffect, useId } from 'react';
import { 
  Sparkles, Heart, Gem, Palette, Clock, Coffee, Mountain, 
  Flower2, Minus, Stars, Crown, Zap, PartyPopper, Gift, User, 
  Sofa, Archive, Package, Utensils, Lamp, Calendar, Watch, Brush, Star 
} from 'lucide-react';
import MoodFilterModal from './MoodFilterModal';

interface StandaloneMoodWheelProps {
  selectedMoods: string[];
  onMoodsChange: (moods: string[]) => void;
  noResults?: boolean;
}

// Muted, vintage-inspired palette - sophisticated and less "bubble gum"
const categories = {
  Moods: [
    { name: 'Surprise', icon: Zap, color: '#C28A3B', description: 'Unexpected finds' },
    { name: 'Whimsical', icon: Sparkles, color: '#8C7BAF', description: 'Playful & imaginative' },
    { name: 'Impulse', icon: Stars, color: '#B5695C', description: 'Must-have now' },
    { name: 'Quirky', icon: Stars, color: '#6E9E8D', description: 'Unique & fun' },
    { name: 'Crazy', icon: PartyPopper, color: '#7B4C7A', description: 'Wild & bold' },
    { name: 'Calming', icon: Heart, color: '#5776A5', description: 'Peaceful vibes' },
    { name: 'Nostalgic', icon: Clock, color: '#B38A63', description: 'Memory lane' },
    { name: 'Party', icon: PartyPopper, color: '#B4475B', description: 'Celebration ready' },
    { name: 'Playful', icon: Flower2, color: '#4F8CA8', description: 'Fun & lighthearted' },
  ],
  Intents: [
    { name: 'Gift', icon: Gift, color: '#B5695C', description: 'Perfect for giving' },
    { name: 'For Me', icon: User, color: '#8C7BAF', description: 'Treat yourself' },
    { name: 'Home Decor', icon: Sofa, color: '#C28A3B', description: 'Style your space' },
    { name: 'Collectibles', icon: Archive, color: '#7B4C7A', description: 'For collectors' },
    { name: 'Heartful', icon: Heart, color: '#B4475B', description: 'Meaningful items' },
    { name: 'Functional', icon: Package, color: '#5776A5', description: 'Practical use' },
    { name: 'Kitchen', icon: Utensils, color: '#B38A63', description: 'Cook & serve' },
    { name: 'Living', icon: Lamp, color: '#C28A3B', description: 'Living room finds' },
    { name: 'Special Occasion', icon: Calendar, color: '#7B4C7A', description: 'Event-ready' },
    { name: 'Accessory', icon: Watch, color: '#4F8CA8', description: 'Finishing touches' },
  ],
  Styles: [
    { name: 'Vintage', icon: Clock, color: '#B38A63', description: 'Classic & timeless' },
    { name: 'Antique', icon: Crown, color: '#C28A3B', description: 'Historical pieces' },
    { name: 'Rustic', icon: Mountain, color: '#6E9E8D', description: 'Natural & earthy' },
    { name: 'Retro', icon: Coffee, color: '#4F8CA8', description: 'Nostalgic vibes' },
    { name: 'Elegant', icon: Gem, color: '#5776A5', description: 'Refined & sophisticated' },
    { name: 'Artsy', icon: Brush, color: '#8C7BAF', description: 'Creative expression' },
    { name: 'Folk Art', icon: Palette, color: '#6E9E8D', description: 'Traditional craft' },
    { name: 'Holiday', icon: Star, color: '#B4475B', description: 'Seasonal spirit' },
    { name: 'Trinket', icon: Sparkles, color: '#7B4C7A', description: 'Small treasures' },
    { name: 'Modern', icon: Minus, color: '#5776A5', description: 'Contemporary style' },
  ],
};

export function StandaloneMoodWheel({ selectedMoods, onMoodsChange, noResults = false }: StandaloneMoodWheelProps) {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'Moods' | 'Intents' | 'Styles'>('Moods');
  const [mounted, setMounted] = useState(false);
  const [noMoodResults, setNoMoodResults] = useState(false);
  
  // Unique gradient ID using useId() to avoid hydration mismatches
  const gradientId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMood = (mood: string) => {
    if (selectedMoods.includes(mood)) {
      onMoodsChange(selectedMoods.filter(m => m !== mood));
    } else {
      onMoodsChange([...selectedMoods, mood]);
    }
  };


  // Detect if mobile for responsive styling
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      {/* HYBRID WHEEL BUTTON */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          // Haptic feedback
          if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(10);
          }
          setShowModal(true);
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(10);
          }
        }}
        className="relative group rounded-full active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        style={{ 
          width: '48px', 
          height: '48px',
          minWidth: '44px', // Accessibility: ensure 44px touch target
          minHeight: '44px',
          touchAction: 'manipulation',
        }}
        aria-label="Open mood selector"
      >
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full drop-shadow-lg animate-spin"
          style={{ animationDuration: '8s' }}
        >
          <defs>
            <linearGradient id={gradientId}>
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="#FDB931" />
              <stop offset="100%" stopColor="#FFD700" />
            </linearGradient>
          </defs>
          
          {/* Outer gold frame */}
          <circle cx="60" cy="60" r="58" fill="none" stroke={`url(#${gradientId})`} strokeWidth="2" />

          {/* Outer ring - deep navy blue */}
          <circle cx="60" cy="60" r="55" fill="#1E3A8A" opacity="0.95" />

          {/* Middle-outer ring - royal blue */}
          <circle cx="60" cy="60" r="47" fill="#1E40AF" opacity="0.95" />

          {/* Middle ring - vibrant blue */}
          <circle cx="60" cy="60" r="39" fill="#2563EB" opacity="0.95" />

          {/* Inner ring - bright blue */}
          <circle cx="60" cy="60" r="31" fill="#3B82F6" opacity="0.95" />

          {/* Center circle - light blue */}
          <circle cx="60" cy="60" r="23" fill="#60A5FA" opacity="0.98" />

          {/* Radial lines emanating from center */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => {
            const angleRad = (angle * Math.PI) / 180;
            const round = (n: number) => Math.round(n * 100) / 100;
            return (
              <line
                key={angle}
                x1="60"
                y1="60"
                x2={round(60 + 20 * Math.cos(angleRad))}
                y2={round(60 + 20 * Math.sin(angleRad))}
                stroke={`url(#${gradientId})`}
                strokeWidth="1"
                opacity="0.8"
              />
            );
          })}

          {/* Decorative dots on rings - multi-mode indicators */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const angleRad = (angle * Math.PI) / 180;
            const cos = Math.cos(angleRad);
            const sin = Math.sin(angleRad);
            // Round to 2 decimal places to avoid hydration mismatches
            const round = (n: number) => Math.round(n * 100) / 100;
            return (
              <g key={`dots-${angle}`}>
                <circle
                  cx={round(60 + 51 * cos)}
                  cy={round(60 + 51 * sin)}
                  r="2"
                  fill="#FFD700"
                  opacity="0.9"
                />
                <circle
                  cx={round(60 + 43 * cos)}
                  cy={round(60 + 43 * sin)}
                  r="1.5"
                  fill="#FBBF24"
                  opacity="0.8"
                />
                <circle
                  cx={round(60 + 35 * cos)}
                  cy={round(60 + 35 * sin)}
                  r="1"
                  fill="#FCD34D"
                  opacity="0.7"
                />
              </g>
            );
          })}

          {/* Center starburst pattern */}
          {[0, 72, 144, 216, 288].map((angle) => {
            const angleRad = (angle * Math.PI) / 180;
            const round = (n: number) => Math.round(n * 100) / 100;
            return (
              <circle
                key={`center-${angle}`}
                cx={round(60 + 12 * Math.cos(angleRad))}
                cy={round(60 + 12 * Math.sin(angleRad))}
                r="1.5"
                fill="#FFFFFF"
                opacity="0.8"
              />
            );
          })}
        </svg>

        {/* Selection badge */}
        {selectedMoods.length > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center z-20 text-xs font-bold" style={{ fontSize: '10px' }}>
            {selectedMoods.length}
          </div>
        )}
      </button>

      {/* MODAL */}
      {mounted && (
        <MoodFilterModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onClear={() => onMoodsChange([])}
        >
          {/* Tabs: Moods / Intents / Styles */}
          <div className="w-full px-3 mt-2 mb-1">
            <div className="flex w-full justify-center bg-black/10 rounded-full py-1">
              <div className="
                flex items-center justify-between 
                gap-1 rounded-full 
                bg-white/6 
                px-1 py-1
              ">
                {[
                  { key: 'Moods', label: 'Vibes' },
                  { key: 'Intents', label: 'Purpose' },
                  { key: 'Styles', label: 'Styles' },
                ].map((tab) => {
                  const tabKey = tab.key as 'Moods' | 'Intents' | 'Styles';
                  const isActive = activeTab === tabKey;
                  return (
                    <button
                      key={tabKey}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab(tabKey);
                      }}
                      className={`
                        flex-1 text-center text-[11px] py-1.5 rounded-full transition-all
                        ${isActive 
                          ? 'bg-white/20 text-white font-semibold shadow-sm' 
                          : 'text-white/55 hover:bg-white/10 hover:text-white'}
                      `}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Mobile-only helper text */}
            <p className="mt-1.5 mb-0.5 text-[9px] text-white/50 text-center md:hidden">
              Pick from categories: moods, intents, or styles
            </p>
          </div>

          {/* Mood Grid */}
          <div className="overflow-y-auto max-h-[60vh] pt-3 -mt-1">
            <div className={`grid gap-y-2 gap-x-3 transition-all duration-150
              ${activeTab === 'Moods' ? 'grid-cols-2' : 'grid-cols-2'}
            `}>
              {categories[activeTab].map((mood) => {
                const isSelected = selectedMoods.includes(mood.name);
                
                return (
                  <button
                    key={mood.name}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMood(mood.name);
                    }}
                    className={`
                      px-3 py-[6px]
                      rounded-full
                      text-[11px]
                      font-medium
                      text-white
                      transition-all
                      min-h-[28px]
                      flex items-center justify-center
                    `}
                    style={{
                      backgroundColor: mood.color,
                      border: '1px solid rgba(255,255,255,0.3)',
                      boxShadow: isSelected
                        ? '0 0 0 2px #EFBF04, 0 4px 10px rgba(0,0,0,0.4)'
                        : '0 2px 4px rgba(0,0,0,0.25)',
                    }}
                  >
                    {mood.name}
                  </button>
                );
              })}
            </div>
            
            {/* No Results Message */}
            {noResults && (
              <p className="mt-1 text-xs text-white/80 text-center">
                No items match this combo yet. Try fewer moods or tap Clear.
              </p>
            )}
          </div>
        </MoodFilterModal>
      )}
    </>
  );
}

/**
 * CUSTOMIZATION GUIDE:
 * 
 * 1. Change wheel colors:
 *    Edit the `wheelColors` array (currently 8 colors)
 * 
 * 2. Modify mood options:
 *    Edit the `categories` object to add/remove/change moods
 * 
 * 3. Adjust modal size:
 *    - Width: Change `width: '6.6rem'`
 *    - Height: Change `maxHeight: 'calc(70vh - 50px)'`
 *    - Grid columns: Change `grid-cols-4` to desired number
 * 
 * 4. Change colors:
 *    - Wheel button badge: `bg-indigo-600`
 *    - Modal header: `from-indigo-900 to-purple-900`
 *    - Selected state: `ring-indigo-600`, `border-indigo-600`
 * 
 * 5. Reposition modal:
 *    - Adjust `marginLeft` and `paddingRight` in main container
 */

