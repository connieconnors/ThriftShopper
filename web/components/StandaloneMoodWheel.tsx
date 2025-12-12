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

import { useState, useEffect } from 'react';
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

  // 8 vibrant colors for the spinning wheel segments
  const wheelColors = [
    '#FF6B6B', // Red
    '#FFB84D', // Orange
    '#FFE66D', // Yellow
    '#4ECDC4', // Teal
    '#45B7D1', // Light Blue
    '#6C5CE7', // Purple
    '#A8E6CF', // Mint
    '#FF8ED4', // Pink
  ];

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
      {/* MOOD WHEEL BUTTON */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          // Haptic feedback
          if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(10);
          }
          setShowModal(true);
        }}
        onTouchStart={() => {
          if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(10);
          }
        }}
        className="relative group rounded-full active:scale-95 transition-transform"
        style={{ 
          width: '48px', 
          height: '48px',
          minWidth: '44px', // Accessibility: ensure 44px touch target
          minHeight: '44px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          touchAction: 'manipulation',
        }}
        aria-label="Open mood selector"
      >
        {/* Spinning color wheel - now inside the glass button */}
        <div className="absolute inset-0 rounded-full overflow-hidden animate-spin opacity-80" style={{ animationDuration: '8s' }}>
          {wheelColors.map((color, index) => {
            const rotation = (360 / wheelColors.length) * index;
            return (
              <div
                key={index}
                className="absolute inset-0 origin-center"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  clipPath: `polygon(50% 50%, 50% 0%, 100% 0%)`,
                  backgroundColor: color,
                }}
              />
            );
          })}
        </div>

        {/* Center white circle with icon */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-6 h-6 bg-white rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sparkles className="w-4 h-4 text-indigo-600" style={{ width: '20px', height: '20px' }} />
          </div>
        </div>

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
                {['Moods','Intents','Styles'].map((tab) => {
                  const tabKey = tab as 'Moods' | 'Intents' | 'Styles';
                  const isActive = activeTab === tabKey;
                  return (
                    <button
                      key={tab}
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
                      {tab}
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

