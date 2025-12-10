import { useState } from 'react';
import { MoodButton } from './components/MoodButton';
import { SearchBox } from './components/SearchBox';
import { Mic, Bookmark } from 'lucide-react';
import productImage from 'figma:asset/5ba3797dad8f98b29cfc166bffa5d4c2f3afc769.png';
import tsBadge from 'figma:asset/9648081df70149b8c11d023c8dc993f326f75d1c.png';

export default function App() {
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(3);

  const handleMoodSearch = (moods: string[]) => {
    setSelectedMoods(moods);
    setIsVoiceMode(false);
    setShowSearchBox(true);
  };

  const handleMicClick = () => {
    setIsVoiceMode(true);
    setShowSearchBox(true);
  };

  const handleSearch = (terms: string[]) => {
    console.log('Searching with terms:', terms);
    // Handle the search/filter action here
  };

  const handleFavorites = () => {
    console.log('Opening favorites');
    // Handle favorites view
  };

  const handleTSClick = () => {
    console.log('Return to dashboard/login');
    // Handle navigation to dashboard or login
  };

  return (
    <div className="w-full h-full relative bg-gray-50 overflow-hidden" style={{ border: 'none', outline: 'none' }}>
      {/* Main Content Area */}
      <div className="relative z-10 pb-6 h-full overflow-y-auto" style={{ border: 'none' }}>
        {/* Product Card */}
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Product Image with overlaid header */}
            <div className="aspect-[3/4] bg-gray-100 relative">
              <img 
                src={productImage} 
                alt="Vintage Irish Angel Figurine" 
                className="w-full h-full object-cover"
              />
              
              {/* TS Logo & Tagline overlaid on image */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: '#000080' }}>
                  <span className="text-white" style={{ fontFamily: 'Merriweather, serif' }}>TS</span>
                </div>
                <span className="text-yellow-400 italic text-sm drop-shadow-lg">the magic of discovery™</span>
              </div>
            </div>
            
            {/* Product Details */}
            <div className="p-4">
              <h2 className="text-lg" style={{ fontFamily: 'Merriweather, serif', color: '#000080' }}>
                Vintage Irish Angel Figurine
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Charming vintage porcelain angel with gold-trimmed wings and delicate shamrock details. 
                Perfect for collectors of Irish heritage items or vintage home decor.
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xl" style={{ color: '#000080', fontFamily: 'Merriweather, serif' }}>$24</span>
                <span className="text-xs text-gray-500">Excellent condition</span>
              </div>
              
              {/* Seller Info */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img 
                    src="https://images.unsplash.com/photo-1594318223885-20dc4b889f9e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHNtaWxpbmclMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjUyMzg2NDV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Thrifter Connie"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-xs text-gray-600">Thrifter Connie</span>
                </div>
                <img 
                  src={tsBadge}
                  alt="TS Verified"
                  className="w-5 h-5"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons - Right side (TikTok/Reels style) */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4">
        {/* Mood Wheel */}
        <MoodButton onGo={handleMoodSearch} />
        
        {/* Bookmark/Favorites */}
        <button
          onClick={handleFavorites}
          className="bg-white/95 backdrop-blur-sm p-2.5 rounded-full hover:bg-white transition-colors shadow-md relative"
          aria-label="Favorites"
        >
          <Bookmark className="w-5 h-5 text-gray-700" />
          {favoritesCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {favoritesCount}
            </span>
          )}
        </button>

        {/* Voice Search */}
        <button
          onClick={handleMicClick}
          className="bg-white/95 backdrop-blur-sm p-2.5 rounded-full hover:bg-white transition-colors shadow-md"
          aria-label="Voice search"
        >
          <Mic className="w-5 h-5" style={{ color: '#000080' }} />
        </button>
      </div>

      {/* Search Box Modal */}
      {showSearchBox && (
        <SearchBox
          initialTerms={isVoiceMode ? [] : selectedMoods}
          isVoiceMode={isVoiceMode}
          onClose={() => setShowSearchBox(false)}
          onSearch={handleSearch}
        />
      )}

      {/* Dashboard Button - Lower Right */}
      <button
        onClick={handleTSClick}
        className="fixed bottom-6 right-6 z-10 w-12 h-12 rounded-full shadow-lg transition-all hover:scale-110"
        style={{ backgroundColor: '#000080' }}
        aria-label="Return to dashboard"
      >
        <span className="text-white" style={{ fontFamily: 'Merriweather, serif' }}>TS</span>
      </button>
    </div>
  );
}