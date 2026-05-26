import React from 'react';

interface TSLogoProps {
  size?: number;
  primaryColor?: string;
  accentColor?: string;
  showStar?: boolean;
}

export function TSLogo({ 
  size = 24, 
  primaryColor = '#16193a',
  accentColor = 'var(--gold-accent)',
  showStar = false
}: TSLogoProps) {
  return (
    <div 
      className="flex flex-col items-center justify-center"
      style={{ 
        width: size,
        height: size,
      }}
    >
      <div 
        className="flex items-center justify-center"
        style={{ 
          fontFamily: 'var(--font-editorial)',
          fontSize: size * 0.58,
          lineHeight: 1,
          fontWeight: 400,
          letterSpacing: '-0.04em',
          color: primaryColor,
          textShadow: accentColor.startsWith("#")
            ? `0 0 8px ${accentColor}40`
            : "0 0 8px rgba(197, 160, 40, 0.25)",
          marginTop: size * 0.02,
        }}
      >
        TS
      </div>
      {showStar && (
        <div 
          style={{ 
            fontSize: size * 0.25,
            lineHeight: 1,
            color: accentColor,
            marginTop: size * 0.02,
          }}
        >
          ✦
        </div>
      )}
    </div>
  );
}

