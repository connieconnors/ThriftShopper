import { X, Sparkles, Heart, Gem, Palette, Clock, Coffee, Mountain, Flower2, Minus, Stars, Crown, Zap, PartyPopper, Gift, User, Sofa, Archive, Package, Utensils, Lamp, Calendar, Watch, Brush, Star } from 'lucide-react';
import { useState } from 'react';

interface MoodSelectorProps {
  selectedMoods: string[];
  onMoodsChange: (moods: string[]) => void;
  onClose: () => void;
}

const categories = {
  Moods: [
    { name: 'Surprise', icon: Zap, color: 'from-yellow-600 to-amber-600', description: 'Unexpected finds' },
    { name: 'Whimsical', icon: Sparkles, color: 'from-purple-700 to-indigo-700', description: 'Playful & imaginative' },
    { name: 'Impulse', icon: Stars, color: 'from-rose-700 to-red-700', description: 'Must-have now' },
    { name: 'Quirky', icon: Stars, color: 'from-emerald-700 to-teal-700', description: 'Unique & fun' },
    { name: 'Crazy', icon: PartyPopper, color: 'from-fuchsia-700 to-purple-800', description: 'Wild & bold' },
    { name: 'Calming', icon: Heart, color: 'from-blue-700 to-indigo-800', description: 'Peaceful vibes' },
    { name: 'Nostalgic', icon: Clock, color: 'from-amber-700 to-orange-700', description: 'Memory lane' },
    { name: 'Party', icon: PartyPopper, color: 'from-red-700 to-rose-700', description: 'Celebration ready' },
    { name: 'Playful', icon: Flower2, color: 'from-teal-700 to-cyan-700', description: 'Fun & lighthearted' },
  ],
  Intents: [
    { name: 'Gift', icon: Gift, color: 'from-rose-700 to-pink-800', description: 'Perfect for giving' },
    { name: 'For Me', icon: User, color: 'from-indigo-700 to-purple-800', description: 'Treat yourself' },
    { name: 'Home Decor', icon: Sofa, color: 'from-amber-800 to-yellow-700', description: 'Style your space' },
    { name: 'Collectibles', icon: Archive, color: 'from-violet-800 to-purple-900', description: 'For collectors' },
    { name: 'Heartful', icon: Heart, color: 'from-red-700 to-rose-800', description: 'Meaningful items' },
    { name: 'Functional', icon: Package, color: 'from-slate-800 to-gray-900', description: 'Practical use' },
    { name: 'Kitchen', icon: Utensils, color: 'from-orange-700 to-red-800', description: 'Cook & serve' },
    { name: 'Living', icon: Lamp, color: 'from-yellow-700 to-amber-800', description: 'Living room finds' },
    { name: 'Special Occasion', icon: Calendar, color: 'from-pink-800 to-fuchsia-900', description: 'Event-ready' },
    { name: 'Accessory', icon: Watch, color: 'from-cyan-800 to-blue-900', description: 'Finishing touches' },
  ],
  Styles: [
    { name: 'Vintage', icon: Clock, color: 'from-amber-800 to-orange-700', description: 'Classic & timeless' },
    { name: 'Antique', icon: Crown, color: 'from-yellow-800 to-amber-900', description: 'Historical pieces' },
    { name: 'Rustic', icon: Mountain, color: 'from-stone-800 to-amber-900', description: 'Natural & earthy' },
    { name: 'Retro', icon: Coffee, color: 'from-teal-800 to-cyan-900', description: 'Nostalgic vibes' },
    { name: 'Elegant', icon: Gem, color: 'from-slate-800 to-gray-950', description: 'Refined & sophisticated' },
    { name: 'Artsy', icon: Brush, color: 'from-violet-700 to-purple-800', description: 'Creative expression' },
    { name: 'Folk Art', icon: Palette, color: 'from-green-800 to-emerald-900', description: 'Traditional craft' },
    { name: 'Holiday', icon: Star, color: 'from-green-900 to-red-900', description: 'Seasonal spirit' },
    { name: 'Trinket', icon: Sparkles, color: 'from-pink-700 to-rose-800', description: 'Small treasures' },
    { name: 'Modern', icon: Minus, color: 'from-gray-700 to-slate-800', description: 'Contemporary style' },
  ],
};

export function MoodSelector({ selectedMoods, onMoodsChange, onClose }: MoodSelectorProps) {
  const [activeTab, setActiveTab] = useState<'Moods' | 'Intents' | 'Styles'>('Moods');

  const toggleMood = (mood: string) => {
    if (selectedMoods.includes(mood)) {
      onMoodsChange(selectedMoods.filter(m => m !== mood));
    } else {
      onMoodsChange([...selectedMoods, mood]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-2" style={{ marginLeft: '-14pt', paddingRight: '23pt' }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl max-h-[70vh] overflow-hidden" style={{ width: '6.6rem', minWidth: '6.6rem', maxWidth: '90vw' }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-1 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 style={{ fontSize: '6px' }}>Choose Your Vibe</h2>
            </div>
            <button
              onClick={onClose}
              className="p-0.5 hover:bg-white/20 rounded-full transition-colors"
            >
              <X style={{ width: '10px', height: '10px' }} />
            </button>
          </div>
          
          {/* Selected count */}
          {selectedMoods.length > 0 && (
            <div style={{ fontSize: '5px', marginTop: '2px' }}>
              {selectedMoods.length} {selectedMoods.length === 1 ? 'selection' : 'selections'}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {(Object.keys(categories) as Array<keyof typeof categories>).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                flex-1 py-0.5 transition-colors
                ${activeTab === tab 
                  ? 'bg-white border-b-2 border-indigo-600 text-indigo-900' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
              style={{ fontSize: '5px', paddingLeft: '1px', paddingRight: '1px' }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Mood Grid */}
        <div className="p-2 overflow-y-auto" style={{ maxHeight: 'calc(70vh - 50px)' }}>
          <div className="grid grid-cols-4 gap-1.5">
            {categories[activeTab].map((mood) => {
              const isSelected = selectedMoods.includes(mood.name);
              
              return (
                <button
                  key={mood.name}
                  onClick={() => toggleMood(mood.name)}
                  className={`
                    group relative overflow-hidden rounded text-center transition-all duration-300
                    ${isSelected 
                      ? 'ring-1 ring-indigo-600 scale-105 shadow-sm' 
                      : 'hover:scale-105 hover:shadow-sm ring-1 ring-gray-200 hover:ring-gray-300'
                    }
                  `}
                  style={{ paddingLeft: '2px', paddingRight: '2px', paddingTop: '3px', paddingBottom: '3px' }}
                >
                  {/* Gradient background */}
                  <div className={`
                    absolute inset-0 bg-gradient-to-br ${mood.color} 
                    ${isSelected ? 'opacity-100' : 'opacity-90 group-hover:opacity-100'}
                    transition-opacity
                  `} />
                  
                  {/* Content */}
                  <div className="relative z-10 text-white">
                    <div style={{ fontSize: '5px', lineHeight: '1.3' }}>{mood.name}</div>
                  </div>

                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-0.5 right-0.5 bg-white rounded-full flex items-center justify-center z-20" style={{ width: '8px', height: '8px' }}>
                      <div className="bg-indigo-600 rounded-full" style={{ width: '4px', height: '4px' }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-0.5 bg-gray-50">
          <div className="flex gap-1 justify-end">
            <button
              onClick={() => onMoodsChange([])}
              className="px-1.5 py-0.5 text-gray-700 hover:bg-gray-200 rounded transition-colors"
              style={{ fontSize: '4px' }}
            >
              Clear
            </button>
            <button
              onClick={onClose}
              className="px-2 py-0.5 bg-indigo-900 text-white rounded hover:bg-indigo-800 transition-colors"
              style={{ fontSize: '4px' }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}