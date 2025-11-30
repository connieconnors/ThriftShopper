"use client";

import { useCallback } from "react";
import { useWhisperTranscription } from "@/hooks/useWhisperTranscription";

interface VoiceSearchButtonProps {
  onTranscriptComplete: (transcript: string) => void;
  onTranscriptChange?: (transcript: string) => void;
  className?: string;
}

export default function VoiceSearchButton({
  onTranscriptComplete,
  onTranscriptChange,
  className = "",
}: VoiceSearchButtonProps) {
  const {
    isRecording,
    isProcessing,
    transcript,
    error,
    isSupported,
    toggleRecording,
  } = useWhisperTranscription({
    onTranscriptChange,
    onTranscriptComplete,
    silenceTimeout: 2000,
    maxDuration: 30000,
  });

  const getButtonState = useCallback(() => {
    if (!isSupported) return "unsupported";
    if (isProcessing) return "processing";
    if (isRecording) return "recording";
    if (error) return "error";
    return "idle";
  }, [isSupported, isProcessing, isRecording, error]);

  const state = getButtonState();

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {/* Microphone Button */}
      <button
        onClick={toggleRecording}
        disabled={!isSupported || isProcessing}
        aria-label={isRecording ? "Stop recording" : "Start voice search"}
        className={`
          relative w-16 h-16 rounded-full 
          flex items-center justify-center
          transition-all duration-300 ease-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
          ${
            state === "unsupported"
              ? "bg-slate-700 cursor-not-allowed opacity-50"
              : state === "recording"
              ? "bg-rose-500 focus:ring-rose-400 shadow-lg shadow-rose-500/40"
              : state === "processing"
              ? "bg-violet-600 cursor-wait"
              : state === "error"
              ? "bg-amber-600 hover:bg-amber-500 focus:ring-amber-400"
              : "bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 focus:ring-violet-400 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50"
          }
        `}
      >
        {/* Pulse animation rings when recording */}
        {state === "recording" && (
          <>
            <span className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-40" />
            <span className="absolute inset-[-4px] rounded-full border-2 border-rose-300 animate-pulse opacity-60" />
            <span 
              className="absolute inset-[-10px] rounded-full border border-rose-200 opacity-30"
              style={{ animation: "pulse 1.5s ease-in-out infinite" }}
            />
          </>
        )}

        {/* Processing spinner */}
        {state === "processing" && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </span>
        )}

        {/* Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`
            w-7 h-7 text-white relative z-10
            transition-transform duration-200
            ${state === "recording" ? "scale-110" : ""}
            ${state === "processing" ? "opacity-0" : ""}
          `}
        >
          {state === "recording" ? (
            // Stop icon when recording
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
        {state === "recording" && (
          <span className="text-rose-400 text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-rose-400 rounded-full animate-pulse" />
            Recording...
          </span>
        )}
        {state === "processing" && (
          <span className="text-violet-400 text-sm font-medium">
            Transcribing...
          </span>
        )}
        {state === "idle" && !transcript && (
          <span className="text-slate-400 text-sm">
            Tap to speak
          </span>
        )}
        {state === "unsupported" && (
          <span className="text-slate-400 text-sm">
            Voice search unavailable
          </span>
        )}
        {state === "error" && (
          <span className="text-amber-400 text-sm">{error}</span>
        )}
      </div>

      {/* Transcript Display */}
      {transcript && (
        <div 
          className={`
            w-full max-w-xs px-4 py-3 rounded-xl
            bg-slate-800/80 backdrop-blur-sm
            border border-slate-700/50
            transition-all duration-300
            ${state === "recording" ? "ring-2 ring-rose-500/30" : ""}
          `}
        >
          <p className="text-slate-100 text-sm leading-relaxed">
            {transcript}
          </p>
        </div>
      )}

      {/* Browser compatibility notice */}
      {!isSupported && (
        <p className="text-xs text-slate-500 text-center max-w-xs mt-2">
          Voice search requires a modern browser with microphone access.
        </p>
      )}
    </div>
  );
}
