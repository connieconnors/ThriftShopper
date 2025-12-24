'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface MoodWheelProps {
  onMoodChange: (mood: string) => void;
  selectedMoods: string[];
}

// Expanded mood list (20+ moods for thrift/vintage shopping)
const moods = [
  // Original 6
  { name: 'Whimsical', color: '#FF6B9D', category: 'playful' },
  { name: 'Vintage', color: '#C19A6B', category: 'classic' },
  { name: 'Elegant', color: '#9B59B6', category: 'sophisticated' },
  { name: 'Quirky', color: '#F39C12', category: 'playful' },
  { name: 'Rustic', color: '#8B4513', category: 'natural' },
  { name: 'Retro', color: '#3498DB', category: 'classic' },
  
  // New additions
  { name: 'Cozy', color: '#D4A574', category: 'comfort' },
  { name: 'Romantic', color: '#E75480', category: 'sophisticated' },
  { name: 'Bohemian', color: '#CD853F', category: 'natural' },
  { name: 'Industrial', color: '#696969', category: 'modern' },
  { name: 'Minimalist', color: '#A9A9A9', category: 'modern' },
  { name: 'Eclectic', color: '#FF8C00', category: 'playful' },
  { name: 'Nostalgic', color: '#BC8F8F', category: 'classic' },
  { name: 'Glamorous', color: '#FFD700', category: 'sophisticated' },
  { name: 'Artisan', color: '#8B7355', category: 'natural' },
  { name: 'Farmhouse', color: '#DEB887', category: 'comfort' },
  { name: 'Victorian', color: '#800080', category: 'classic' },
  { name: 'Coastal', color: '#5F9EA0', category: 'natural' },
  { name: 'Mid-Century', color: '#F4A460', category: 'classic' },
  { name: 'Cottage', color: '#FFE4B5', category: 'comfort' },
  { name: 'Gothic', color: '#2F4F4F', category: 'sophisticated' },
  { name: 'Scandinavian', color: '#B0C4DE', category: 'modern' },
];

export function MoodWheel({ onMoodChange, selectedMoods }: MoodWheelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Return a simple placeholder during SSR to prevent hydration mismatch
    return (
      <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden" style={{ backgroundColor: '#191970' }}>
        <span className="text-2xl relative z-10">✨</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Hybrid Wheel Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative w-16 h-16 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-full transition-transform duration-300 hover:scale-105"
        whileTap={{ scale: 0.95 }}
        aria-label="Open discovery wheel"
      >
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full drop-shadow-lg"
        >
          {/* Outer gold frame */}
          <circle cx="60" cy="60" r="58" fill="none" stroke="url(#hybridGold)" strokeWidth="2" />

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
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
            <line
              key={angle}
              x1="60"
              y1="60"
              x2={60 + 20 * Math.cos((angle * Math.PI) / 180)}
              y2={60 + 20 * Math.sin((angle * Math.PI) / 180)}
              stroke="url(#hybridGold)"
              strokeWidth="1"
              opacity="0.8"
            />
          ))}

          {/* Decorative dots on rings - multi-mode indicators */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <g key={`dots-${angle}`}>
              <circle
                cx={60 + 51 * Math.cos((angle * Math.PI) / 180)}
                cy={60 + 51 * Math.sin((angle * Math.PI) / 180)}
                r="2"
                fill="#FFD700"
                opacity="0.9"
              />
              <circle
                cx={60 + 43 * Math.cos((angle * Math.PI) / 180)}
                cy={60 + 43 * Math.sin((angle * Math.PI) / 180)}
                r="1.5"
                fill="#FBBF24"
                opacity="0.8"
              />
              <circle
                cx={60 + 35 * Math.cos((angle * Math.PI) / 180)}
                cy={60 + 35 * Math.sin((angle * Math.PI) / 180)}
                r="1"
                fill="#FCD34D"
                opacity="0.7"
              />
            </g>
          ))}

          {/* Center starburst pattern */}
          {[0, 72, 144, 216, 288].map((angle) => (
            <circle
              key={`center-${angle}`}
              cx={60 + 12 * Math.cos((angle * Math.PI) / 180)}
              cy={60 + 12 * Math.sin((angle * Math.PI) / 180)}
              r="1.5"
              fill="#FFFFFF"
              opacity="0.8"
            />
          ))}

          <defs>
            <linearGradient id="hybridGold">
              <stop offset="0%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="#FDB931" />
              <stop offset="100%" stopColor="#FFD700" />
            </linearGradient>
          </defs>
        </svg>
      </motion.button>

      {/* Expanded Grid */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute bottom-20 left-0 z-50"
          >
            <div 
              className="rounded-2xl p-4 shadow-2xl"
              style={{ 
                backgroundColor: 'rgba(25, 25, 112, 0.95)',
                backdropFilter: 'blur(20px)',
                maxHeight: '60vh',
                width: '280px',
                overflowY: 'auto',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                <span className="text-white font-medium text-sm">Choose a Vibe</span>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-white/60 hover:text-white text-lg"
                >
                  ×
                </button>
              </div>

              {/* Mood Grid */}
              <div className="grid grid-cols-2 gap-2">
                {moods.map((mood, index) => (
                  <motion.button
                    key={mood.name}
                    onClick={() => {
                      onMoodChange(mood.name);
                      // Don't close automatically - let user select multiple
                    }}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      backgroundColor: selectedMoods.includes(mood.name) 
                        ? mood.color 
                        : 'rgba(255, 255, 255, 0.1)',
                      color: selectedMoods.includes(mood.name) ? 'white' : 'rgba(255, 255, 255, 0.8)',
                      border: selectedMoods.includes(mood.name) ? '2px solid #cfb53b' : '2px solid transparent',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    {mood.name}
                  </motion.button>
                ))}
              </div>

              {/* Selected Count & Apply Button */}
              {selectedMoods.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                  <div className="text-center">
                    <span className="text-xs" style={{ color: '#efbf04' }}>
                      {selectedMoods.length} mood{selectedMoods.length !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="w-full py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      backgroundColor: '#efbf04',
                      color: '#191970',
                    }}
                  >
                    Apply Filter
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
