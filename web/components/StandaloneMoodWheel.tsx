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
import { createPortal } from 'react-dom';
import { 
  X, Sparkles, Heart, Gem, Palette, Clock, Coffee, Mountain, 
  Flower2, Minus, Stars, Crown, Zap, PartyPopper, Gift, User, 
  Sofa, Archive, Package, Utensils, Lamp, Calendar, Watch, Brush, Star 
} from 'lucide-react';

interface StandaloneMoodWheelProps {
  selectedMoods: string[];
  onMoodsChange: (moods: string[]) => void;
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

export function StandaloneMoodWheel({ selectedMoods, onMoodsChange }: StandaloneMoodWheelProps) {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'Moods' | 'Intents' | 'Styles'>('Moods');
  const [mounted, setMounted] = useState(false);

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
          setShowModal(true);
        }}
        className="relative group"
        style={{ width: '48px', height: '48px' }}
        aria-label="Open mood selector"
      >
        {/* Spinning color wheel */}
        <div className="absolute inset-0 rounded-full overflow-hidden animate-spin" style={{ animationDuration: '8s' }}>
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
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
        </div>

        {/* Selection badge */}
        {selectedMoods.length > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center z-10" style={{ fontSize: '9px' }}>
            {selectedMoods.length}
          </div>
        )}
      </button>

      {/* MODAL */}
      {showModal && mounted && createPortal(
        <div 
          onClick={(e) => {
            // Prevent any clicks from bubbling to elements below
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            // Prevent touch events from bubbling
            e.stopPropagation();
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'flex-end'
          }}
        >
          {/* Backdrop */}
          <div 
            onClick={(e) => {
              e.stopPropagation();
              setShowModal(false);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowModal(false);
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              touchAction: 'none'
            }}
          />
          
          {/* Modal Content */}
          <div 
            className="mood-drawer"
            onClick={(e) => {
              // Prevent clicks inside modal from closing it or bubbling
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              // Prevent touch events from bubbling
              e.stopPropagation();
            }}
            onTouchEnd={(e) => {
              // Prevent touch end from bubbling
              e.stopPropagation();
            }}
            style={{ 
              width: isMobile ? '85vw' : '280px', 
              maxWidth: isMobile ? '320px' : '300px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              pointerEvents: 'auto',
              borderRadius: isMobile ? '12px' : '16px',
              marginTop: 'auto',
              marginBottom: 'auto',
              backgroundColor: 'rgba(25, 25, 7, 0.82)',
              boxShadow: '0 12px 24px rgba(0,0,0,0.14)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              touchAction: 'none'
            }}
          >
            {/* Header */}
            <div 
              className="text-white" 
              style={{ 
                padding: '8px 12px', 
                width: '100%',
                height: '40px',
                flexShrink: 0,
                backgroundColor: '#000080',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <h2 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>
                Choose Your Vibe
              </h2>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowModal(false);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowModal(false);
                }}
                style={{
                  padding: '3px',
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '3px',
                  transition: 'background-color 0.2s'
                }}
                className="hover:bg-white/20"
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            {/* Tabs */}
            <div 
              style={{ 
                display: 'flex', 
                width: '100%', 
                flexShrink: 0,
                backgroundColor: '#F6F3EE',
                paddingTop: '8px',
                paddingBottom: '4px',
                paddingLeft: isMobile ? '16px' : '16px',
                paddingRight: isMobile ? '16px' : '16px',
                gap: isMobile ? '12px' : '4px'
              }}
            >
              {(Object.keys(categories) as Array<keyof typeof categories>).map((tab) => (
                <button
                  key={tab}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab(tab);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setActiveTab(tab);
                  }}
                  style={{
                    flex: 1,
                    paddingBottom: '4px',
                    fontSize: '12px',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    color: activeTab === tab ? '#000080' : '#333',
                    backgroundColor: 'transparent',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    borderBottom: activeTab === tab ? '2px solid #EFBF04' : '2px solid transparent',
                    cursor: 'pointer'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Mood Grid */}
            <div style={{ 
              padding: isMobile ? '10px 16px 0 16px' : '8px 16px 0 16px', 
              overflowY: 'auto', 
              maxHeight: '75vh', 
              width: '100%'
            }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '10px 8px',
                width: '100%' 
              }}>
                {categories[activeTab].map((mood) => {
                  const isSelected = selectedMoods.includes(mood.name);
                  
                  return (
                <button
                  key={mood.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMood(mood.name);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    toggleMood(mood.name);
                  }}
                  className="mood-chip"
                  style={{ 
                    padding: '7px 10px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#FFFFFF',
                    backgroundColor: mood.color,
                    border: isSelected ? '2px solid #EFBF04' : '1px solid rgba(0,0,0,0.08)',
                    boxShadow: isSelected 
                      ? '0 4px 12px rgba(239, 191, 4, 0.4), 0 2px 6px rgba(0,0,0,0.2)' 
                      : '0 2px 4px rgba(0,0,0,0.10)',
                    outline: 'none',
                    outlineOffset: '0',
                    transition: 'all 120ms ease',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '34px',
                    lineHeight: '1.2'
                  }}
                  onMouseEnter={(e) => {
                    if (window.innerWidth > 767) {
                      e.currentTarget.style.transform = 'scale(1.03)';
                      e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.16)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (window.innerWidth > 767) {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = isSelected 
                        ? '0 4px 10px rgba(0,0,0,0.18)' 
                        : '0 2px 4px rgba(0,0,0,0.10)';
                    }
                  }}
                >
                      {mood.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div 
              style={{ 
                padding: '8px 20px',
                width: '100%', 
                flexShrink: 0,
                backgroundColor: 'white',
                borderTop: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoodsChange([]);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onMoodsChange([]);
                }}
                style={{
                  fontSize: '12px',
                  color: '#666',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 500,
                  padding: '3px 6px'
                }}
              >
                Clear
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowModal(false);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setShowModal(false);
                }}
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  backgroundColor: '#000080',
                  color: 'white',
                  borderRadius: '6px',
                  transition: 'all 120ms ease',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}
                onMouseEnter={(e) => {
                  if (window.innerWidth > 767) {
                    e.currentTarget.style.transform = 'scale(1.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (window.innerWidth > 767) {
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
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

