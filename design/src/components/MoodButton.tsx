import { useState } from 'react';
import { MoodSelector } from './MoodSelector';

interface MoodButtonProps {
  onGo: (moods: string[]) => void;
}

export function MoodButton({ onGo }: MoodButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [shouldSpin, setShouldSpin] = useState(false);

  const handleOpenSelector = () => {
    setIsOpen(true);
    // Trigger spin animation when opening
    setShouldSpin(true);
    setTimeout(() => setShouldSpin(false), 600);
  };

  const handleMoodsChange = (moods: string[]) => {
    setSelectedMoods(moods);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (selectedMoods.length > 0) {
      onGo(selectedMoods);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handleOpenSelector}
        className={`
          relative bg-white/95 backdrop-blur-sm p-2.5 rounded-full hover:bg-white transition-colors shadow-md
          ${selectedMoods.length > 0 ? 'ring-2 ring-indigo-600' : ''}
        `}
        aria-label="Select mood"
      >
        {/* Colorful Wheel Icon */}
        <svg 
          className={`w-5 h-5 transition-transform ${shouldSpin ? 'animate-spin' : ''}`}
          viewBox="0 0 24 24" 
          fill="none"
          style={{ animationDuration: shouldSpin ? '0.6s' : undefined, animationIterationCount: shouldSpin ? '1' : undefined }}
        >
          {/* Color wheel segments */}
          <path d="M12 12 L12 2 A10 10 0 0 1 19.66 6.34 Z" fill="#FF6B6B" />
          <path d="M12 12 L19.66 6.34 A10 10 0 0 1 22 12 Z" fill="#F59E0B" />
          <path d="M12 12 L22 12 A10 10 0 0 1 19.66 17.66 Z" fill="#FCD34D" />
          <path d="M12 12 L19.66 17.66 A10 10 0 0 1 12 22 Z" fill="#10B981" />
          <path d="M12 12 L12 22 A10 10 0 0 1 4.34 17.66 Z" fill="#3B82F6" />
          <path d="M12 12 L4.34 17.66 A10 10 0 0 1 2 12 Z" fill="#8B5CF6" />
          <path d="M12 12 L2 12 A10 10 0 0 1 4.34 6.34 Z" fill="#EC4899" />
          <path d="M12 12 L4.34 6.34 A10 10 0 0 1 12 2 Z" fill="#EF4444" />
          <circle cx="12" cy="12" r="3" fill="white" />
        </svg>
        {selectedMoods.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {selectedMoods.length}
          </span>
        )}
      </button>

      {/* MoodSelector Modal */}
      {isOpen && (
        <MoodSelector
          selectedMoods={selectedMoods}
          onMoodsChange={handleMoodsChange}
          onClose={handleClose}
        />
      )}
    </>
  );
}