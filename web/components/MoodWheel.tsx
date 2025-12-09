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

  // Show first 6 moods in the compact wheel
  const compactMoods = moods.slice(0, 6);

  return (
    <div className="relative">
      {/* Compact Wheel Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden"
        whileTap={{ scale: 0.95 }}
      >
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 64 64">
          {compactMoods.map((mood, index) => {
            const startAngle = (index * 60 - 90) * (Math.PI / 180);
            const endAngle = ((index + 1) * 60 - 90) * (Math.PI / 180);
            const x1 = 32 + Math.cos(startAngle) * 32;
            const y1 = 32 + Math.sin(startAngle) * 32;
            const x2 = 32 + Math.cos(endAngle) * 32;
            const y2 = 32 + Math.sin(endAngle) * 32;
            
            return (
              <path
                key={mood.name}
                d={`M 32 32 L ${x1} ${y1} A 32 32 0 0 1 ${x2} ${y2} Z`}
                fill={mood.color}
                opacity="0.7"
              />
            );
          })}
          <circle cx="32" cy="32" r="20" fill="#191970" />
        </svg>
        
        <span className="text-2xl relative z-10">✨</span>
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
