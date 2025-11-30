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

export function VoiceInput({ onVoiceQuery, onListeningChange }: VoiceInputProps) {
  const [internalTranscript, setInternalTranscript] = useState('');

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
    silenceTimeout: 2000,
    maxDuration: 30000,
  });

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

  return (
    <motion.button
      onClick={toggleRecording}
      disabled={isProcessing}
      className="w-11 h-11 rounded-full flex items-center justify-center relative"
      style={{
        backgroundColor: isRecording ? '#cfb53b' : isProcessing ? '#6b46c1' : '#191970',
      }}
      whileTap={{ scale: 0.9 }}
      animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
      transition={isRecording ? { repeat: Infinity, duration: 1 } : {}}
    >
      {isProcessing ? (
        <Loader2 size={22} className="text-white animate-spin" />
      ) : (
        <Mic size={22} className="text-white" />
      )}
    </motion.button>
  );
}

// Separate component for the search bar that appears when listening
interface VoiceSearchBarProps {
  isVisible: boolean;
  transcript: string;
  isProcessing?: boolean;
}

export function VoiceSearchBar({ isVisible, transcript, isProcessing }: VoiceSearchBarProps) {
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
            className="h-10 px-4 rounded-full flex items-center"
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.15)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(207, 181, 59, 0.3)',
            }}
          >
            {isProcessing ? (
              <p 
                className="text-sm flex items-center gap-2"
                style={{ color: '#cfb53b', fontFamily: 'Merriweather, serif' }}
              >
                <Loader2 size={14} className="animate-spin" />
                Transcribing...
              </p>
            ) : transcript ? (
              <p 
                className="text-sm text-white truncate"
                style={{ fontFamily: 'Merriweather, serif' }}
              >
                "{displayText}"
              </p>
            ) : (
              <p 
                className="text-sm italic animate-pulse"
                style={{ color: '#cfb53b', fontFamily: 'Merriweather, serif' }}
              >
                Recording...
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
