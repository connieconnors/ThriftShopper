"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface VoiceSearchButtonProps {
  onTranscriptComplete: (transcript: string) => void;
  onTranscriptChange?: (transcript: string) => void;
  language?: string;
  className?: string;
}

type RecognitionState = "idle" | "listening" | "processing" | "error";

export default function VoiceSearchButton({
  onTranscriptComplete,
  onTranscriptChange,
  language = "en-US",
  className = "",
}: VoiceSearchButtonProps) {
  const [state, setState] = useState<RecognitionState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef("");
  const interimRef = useRef("");

  // Check browser support on mount
  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      setErrorMessage("Voice search not supported in this browser");
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    // Auto-stop after 2 seconds of silence
    silenceTimerRef.current = setTimeout(() => {
      if (recognitionRef.current && state === "listening") {
        recognitionRef.current.stop();
      }
    }, 2000);
  }, [state]);

  const startListening = useCallback(async () => {
    if (!isSupported) return;

    // Request microphone permission
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      setState("error");
      setErrorMessage("Microphone permission denied");
      return;
    }

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      setState("listening");
      setTranscript("");
      setInterimTranscript("");
      setErrorMessage("");
      transcriptRef.current = "";
      interimRef.current = "";
      resetSilenceTimer();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let currentInterim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          currentInterim += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => {
          const newTranscript = prev + finalTranscript;
          transcriptRef.current = newTranscript;
          onTranscriptChange?.(newTranscript);
          return newTranscript;
        });
      }

      interimRef.current = currentInterim;
      setInterimTranscript(currentInterim);
      resetSilenceTimer();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed") {
        setErrorMessage("Microphone permission denied");
      } else if (event.error === "no-speech") {
        setErrorMessage("No speech detected");
      } else if (event.error === "network") {
        setErrorMessage("Network error occurred");
      } else {
        setErrorMessage(`Error: ${event.error}`);
      }
      setState("error");
    };

    recognition.onend = () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      
      const finalTranscript = transcriptRef.current + interimRef.current;
      if (finalTranscript.trim()) {
        onTranscriptComplete(finalTranscript.trim());
      }
      
      // Reset refs
      transcriptRef.current = "";
      interimRef.current = "";
      
      setState("idle");
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, language, onTranscriptChange, onTranscriptComplete, resetSilenceTimer]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const toggleListening = () => {
    if (state === "listening") {
      stopListening();
    } else {
      startListening();
    }
  };

  const displayTranscript = transcript + interimTranscript;

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {/* Microphone Button */}
      <button
        onClick={toggleListening}
        disabled={!isSupported}
        aria-label={state === "listening" ? "Stop listening" : "Start voice search"}
        className={`
          relative w-16 h-16 rounded-full 
          flex items-center justify-center
          transition-all duration-300 ease-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
          ${
            !isSupported
              ? "bg-slate-700 cursor-not-allowed opacity-50"
              : state === "listening"
              ? "bg-rose-500 focus:ring-rose-400 shadow-lg shadow-rose-500/40"
              : state === "error"
              ? "bg-amber-600 hover:bg-amber-500 focus:ring-amber-400"
              : "bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 focus:ring-violet-400 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50"
          }
        `}
      >
        {/* Pulse animation rings when listening */}
        {state === "listening" && (
          <>
            <span className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-40" />
            <span className="absolute inset-[-4px] rounded-full border-2 border-rose-300 animate-pulse opacity-60" />
            <span 
              className="absolute inset-[-10px] rounded-full border border-rose-200 opacity-30"
              style={{ animation: "pulse 1.5s ease-in-out infinite" }}
            />
          </>
        )}

        {/* Microphone Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`
            w-7 h-7 text-white relative z-10
            transition-transform duration-200
            ${state === "listening" ? "scale-110" : ""}
          `}
        >
          {state === "listening" ? (
            // Stop icon when listening
            <path d="M6 6h12v12H6z" />
          ) : (
            // Microphone icon
            <path
              fillRule="evenodd"
              d="M12 1.5a4.5 4.5 0 00-4.5 4.5v5.25a4.5 4.5 0 109 0V6a4.5 4.5 0 00-4.5-4.5zm0 16.5a6.75 6.75 0 006.75-6.75V10.5a.75.75 0 00-1.5 0v.75a5.25 5.25 0 01-10.5 0V10.5a.75.75 0 00-1.5 0v.75A6.75 6.75 0 0012 18zm.75 2.25V21a.75.75 0 00-1.5 0v-.75a.75.75 0 001.5 0z"
              clipRule="evenodd"
            />
          )}
        </svg>
      </button>

      {/* Status Text */}
      <div className="text-center min-h-[24px]">
        {state === "listening" && (
          <span className="text-rose-400 text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-rose-400 rounded-full animate-pulse" />
            Listening...
          </span>
        )}
        {state === "idle" && !displayTranscript && (
          <span className="text-slate-400 text-sm">
            {isSupported ? "Tap to speak" : "Voice search unavailable"}
          </span>
        )}
        {state === "error" && (
          <span className="text-amber-400 text-sm">{errorMessage}</span>
        )}
      </div>

      {/* Transcript Display */}
      {displayTranscript && (
        <div 
          className={`
            w-full max-w-xs px-4 py-3 rounded-xl
            bg-slate-800/80 backdrop-blur-sm
            border border-slate-700/50
            transition-all duration-300
            ${state === "listening" ? "ring-2 ring-rose-500/30" : ""}
          `}
        >
          <p className="text-slate-100 text-sm leading-relaxed">
            {transcript}
            {interimTranscript && (
              <span className="text-slate-400 italic">{interimTranscript}</span>
            )}
          </p>
        </div>
      )}

      {/* Browser compatibility notice */}
      {!isSupported && (
        <p className="text-xs text-slate-500 text-center max-w-xs mt-2">
          Voice search requires Chrome, Edge, or Safari on a secure connection (HTTPS).
        </p>
      )}
    </div>
  );
}

