import React from 'react';

interface TSLogoProps {
  size?: number;
  primaryColor?: string;
  accentColor?: string;
}

export function TSLogo({ 
  size = 24, 
  primaryColor = '#191970',
  accentColor = '#cfb53b' 
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
          fontFamily: 'Playfair Display, serif',
          fontSize: size * 0.65,
          lineHeight: 1,
          fontWeight: 500,
          letterSpacing: '-0.04em',
          color: primaryColor,
          textShadow: `0 0 8px ${accentColor}40`,
        }}
      >
        TS
      </div>
      <div 
        style={{ 
          fontSize: size * 0.45,
          lineHeight: 0.8,
          color: accentColor,
          marginTop: size * -0.05,
        }}
      >
        ✦
      </div>
    </div>
  );
}

