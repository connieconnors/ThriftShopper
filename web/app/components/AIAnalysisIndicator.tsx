'use client';

import { useId } from 'react';

interface AIAnalysisIndicatorProps {
  isAnalyzing: boolean;
}

export default function AIAnalysisIndicator({ isAnalyzing }: AIAnalysisIndicatorProps) {
  const gradientId = useId();

  if (!isAnalyzing) return null;

  return (
    <div className="flex items-center justify-center my-4">
      <svg
        viewBox="0 0 120 120"
        className="w-6 h-6 drop-shadow-lg animate-spin"
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
    </div>
  );
}
