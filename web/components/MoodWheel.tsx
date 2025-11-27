'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';

interface MoodWheelProps {
  onMoodChange: (mood: string) => void;
  selectedMoods: string[];
}

const moods = [
  { name: 'Whimsical', color: '#FF6B9D', angle: 0 },
  { name: 'Vintage', color: '#C19A6B', angle: 60 },
  { name: 'Elegant', color: '#9B59B6', angle: 120 },
  { name: 'Quirky', color: '#F39C12', angle: 180 },
  { name: 'Rustic', color: '#8B4513', angle: 240 },
  { name: 'Retro', color: '#3498DB', angle: 300 },
];

export function MoodWheel({ onMoodChange, selectedMoods }: MoodWheelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden"
        whileTap={{ scale: 0.95 }}
      >
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 64 64">
          {moods.map((mood, index) => {
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

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-0 left-0"
        >
          <div className="relative w-48 h-48">
            {moods.map((mood, index) => {
              const angle = (index * 60 * Math.PI) / 180;
              const radius = 70;
              const x = Math.cos(angle) * radius + 24;
              const y = Math.sin(angle) * radius + 24;

              return (
                <motion.button
                  key={mood.name}
                  onClick={() => {
                    onMoodChange(mood.name);
                    setIsExpanded(false);
                  }}
                  className="absolute w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-all"
                  style={{
                    left: `${x + 72}px`,
                    top: `${y + 72}px`,
                    backgroundColor: mood.color,
                    border: selectedMoods.includes(mood.name) ? '3px solid #cfb53b' : 'none',
                  }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <span className="text-white text-[10px]">{mood.name}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

