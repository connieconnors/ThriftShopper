'use client';

import { useId } from 'react';

interface AIAnalysisIndicatorProps {
  isAnalyzing: boolean;
}

export default function AIAnalysisIndicator({ isAnalyzing }: AIAnalysisIndicatorProps) {
  const gradientId = useId();

  if (!isAnalyzing) return null;

  return (
    <div className="flex items-center justify-center my-3" role="status" aria-live="polite" aria-label="Analyzing your item">
      <svg
        viewBox="0 0 120 120"
        className="w-6 h-6 drop-shadow-lg animate-spin"
        style={{ animationDuration: '8s' }}
        aria-hidden
      >
        <defs>
          <linearGradient id={gradientId}>
            <stop offset="0%" stopColor="#DFAF37" />
            <stop offset="50%" stopColor="#FDB931" />
            <stop offset="100%" stopColor="#DFAF37" />
          </linearGradient>
        </defs>

        <circle cx="60" cy="60" r="58" fill="none" stroke={`url(#${gradientId})`} strokeWidth="2" />
        <circle cx="60" cy="60" r="55" fill="#16193a" opacity="0.98" />
        <circle cx="60" cy="60" r="47" fill="#1e2248" opacity="0.95" />
        <circle cx="60" cy="60" r="39" fill="#252a5a" opacity="0.95" />
        <circle cx="60" cy="60" r="31" fill="#2f3568" opacity="0.95" />
        <circle cx="60" cy="60" r="23" fill="#3d4578" opacity="0.98" />

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
              opacity="0.85"
            />
          );
        })}
      </svg>
    </div>
  );
}
