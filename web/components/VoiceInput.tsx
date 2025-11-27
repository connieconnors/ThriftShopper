'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

export function VoiceInput({ onVoiceQuery, onListeningChange }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Notify parent of listening state and transcript changes
  useEffect(() => {
    onListeningChange?.(isListening, transcript);
  }, [isListening, transcript, onListeningChange]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let fullTranscript = '';

      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;
      }

      setTranscript(fullTranscript);

      // Reset timeout on each result
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Auto-stop after 2 seconds of silence
      timeoutRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          recognition.stop();
        }
      }, 2000);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      
      // Process the final transcript
      if (transcript.trim()) {
        const moods = detectMoods(transcript);
        onVoiceQuery(transcript.trim(), moods);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Use ref to access latest transcript in onend
  const transcriptRef = useRef(transcript);
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current) return;

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error('Microphone permission denied');
      return;
    }

    setTranscript('');
    setIsListening(true);

    try {
      recognitionRef.current.start();
    } catch (err) {
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    
    setIsListening(false);
    
    // Process transcript
    const finalText = transcriptRef.current.trim();
    if (finalText) {
      const moods = detectMoods(finalText);
      onVoiceQuery(finalText, moods);
    }
  }, [onVoiceQuery]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

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
      onClick={toggleListening}
      className="w-11 h-11 rounded-full flex items-center justify-center"
      style={{
        backgroundColor: isListening ? '#cfb53b' : '#191970',
      }}
      whileTap={{ scale: 0.9 }}
      animate={isListening ? { scale: [1, 1.1, 1] } : {}}
      transition={isListening ? { repeat: Infinity, duration: 1 } : {}}
    >
      <Mic size={22} className="text-white" />
    </motion.button>
  );
}

// Separate component for the search bar that appears when listening
interface VoiceSearchBarProps {
  isVisible: boolean;
  transcript: string;
}

export function VoiceSearchBar({ isVisible, transcript }: VoiceSearchBarProps) {
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
            {transcript ? (
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
                Listening...
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
