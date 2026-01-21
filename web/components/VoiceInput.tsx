'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useWhisperTranscription } from '@/hooks/useWhisperTranscription';

interface VoiceInputProps {
  onVoiceQuery: (query: string, detectedMoods: string[]) => void;
  onListeningChange?: (isListening: boolean, transcript?: string) => void;
}

// Mood keywords for NLP detection
const MOOD_KEYWORDS: Record<string, string[]> = {
  whimsical: ['whimsical', 'playful', 'fun', 'cute', 'quirky', 'magical'],
  vintage: ['vintage', 'antique', 'old', 'retro', 'classic', 'nostalgic', 'old-fashioned'],
  elegant: ['elegant', 'sophisticated', 'fancy', 'luxurious', 'classy', 'refined'],
  quirky: ['quirky', 'unique', 'unusual', 'weird', 'eccentric', 'odd', 'interesting'],
  rustic: ['rustic', 'farmhouse', 'country', 'natural', 'wooden', 'handmade', 'cottage'],
  retro: ['retro', '70s', '80s', '60s', 'throwback', 'mid-century', 'groovy'],
};

function detectMoods(text: string): string[] {
  const lowerText = text.toLowerCase();
  const detectedMoods: string[] = [];
  
  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      detectedMoods.push(mood);
    }
  }
  
  return detectedMoods;
}

const MAX_DURATION = 8000; // 8 seconds

export function VoiceInput({ onVoiceQuery, onListeningChange }: VoiceInputProps) {
  const [internalTranscript, setInternalTranscript] = useState('');
  const [countdown, setCountdown] = useState(8);

  const handleTranscriptComplete = useCallback((transcript: string) => {
    if (transcript.trim()) {
      const moods = detectMoods(transcript);
      onVoiceQuery(transcript.trim(), moods);
    }
  }, [onVoiceQuery]);

  const handleTranscriptChange = useCallback((transcript: string) => {
    setInternalTranscript(transcript);
  }, []);

  const {
    isRecording,
    isProcessing,
    transcript,
    isSupported,
    toggleRecording,
  } = useWhisperTranscription({
    onTranscriptChange: handleTranscriptChange,
    onTranscriptComplete: handleTranscriptComplete,
    silenceTimeout: 1500, // 1.5 sec silence = done talking
    maxDuration: MAX_DURATION,
  });

  // Countdown timer when recording
  useEffect(() => {
    if (isRecording) {
      setCountdown(8);
      const interval = setInterval(() => {
        setCountdown(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRecording]);

  // Notify parent of listening state
  useEffect(() => {
    onListeningChange?.(isRecording || isProcessing, transcript || internalTranscript);
  }, [isRecording, isProcessing, transcript, internalTranscript, onListeningChange]);

  if (!isSupported) {
    return (
      <button
        className="w-11 h-11 rounded-full flex items-center justify-center opacity-50 cursor-not-allowed"
        style={{ backgroundColor: '#191970' }}
        disabled
      >
        <Mic size={22} className="text-white/50" />
      </button>
    );
  }

  // Calculate progress for the countdown ring (0 to 1)
  const progress = isRecording ? countdown / 8 : 0;
  const circumference = 2 * Math.PI * 24; // radius 24 for the ring
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="relative">
      {/* Countdown ring - only visible when recording */}
      {isRecording && (
        <svg 
          className="absolute -inset-1 w-[52px] h-[52px] -rotate-90"
          viewBox="0 0 52 52"
        >
          {/* Background ring */}
          <circle
            cx="26"
            cy="26"
            r="24"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2"
          />
          {/* Progress ring */}
          <circle
            cx="26"
            cy="26"
            r="24"
            fill="none"
            stroke="#cfb53b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
      )}
      
      <motion.button
        onClick={toggleRecording}
        disabled={isProcessing}
        className="w-11 h-11 rounded-full flex items-center justify-center relative"
        style={{
          backgroundColor: isRecording ? '#cfb53b' : isProcessing ? '#6b46c1' : '#191970',
        }}
        whileTap={{ scale: 0.9 }}
        animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
        transition={isRecording ? { repeat: Infinity, duration: 1.5 } : {}}
      >
        {isProcessing ? (
          <Loader2 size={22} className="text-white animate-spin" />
        ) : (
          <Mic size={22} className="text-white" />
        )}
      </motion.button>
    </div>
  );
}

// Separate component for the search bar that appears when listening
interface VoiceSearchBarProps {
  isVisible: boolean;
  transcript: string;
  isProcessing?: boolean;
  countdown?: number; // optional countdown in seconds
}

export function VoiceSearchBar({ isVisible, transcript, isProcessing, countdown }: VoiceSearchBarProps) {
  // Truncate to 80 chars max
  const displayText = transcript.length > 80 
    ? transcript.slice(0, 77) + '...' 
    : transcript;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="w-full max-w-md"
        >
          <div 
            className="h-10 px-4 rounded-full flex items-center justify-between"
            style={{ 
              backgroundColor: '#D9A903', 
              backdropFilter: 'blur(12px)',
              border: 'none',
            }}
          >
            {isProcessing ? (
              <p 
                className="text-sm flex items-center gap-2"
                style={{ 
                  color: 'rgba(255,255,255,0.9)',
                  fontWeight: 600
                }}
              >
                <Loader2 size={14} className="animate-spin" />
                Transcribing...
              </p>
            ) : transcript ? (
              <p 
                className="text-sm text-white truncate flex-1"
              >
                "{displayText}"
              </p>
            ) : (
              <p 
                className="text-sm italic"
                style={{ 
                  color: 'rgba(255,255,255,0.8)',
                  fontWeight: 500
                }}
              >
                Listening...
              </p>
            )}
            {/* Countdown indicator when recording and not processing */}
            {!isProcessing && countdown !== undefined && countdown > 0 && (
              <span 
                className="text-xs ml-2 opacity-70"
                style={{ color: 'rgba(255,255,255,0.75)' }}
              >
                {countdown}s
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
