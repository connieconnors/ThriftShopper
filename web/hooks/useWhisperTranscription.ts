// Custom hook for OpenAI Whisper transcription
// Works on mobile and all browsers with MediaRecorder support

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseWhisperTranscriptionOptions {
  onTranscriptChange?: (transcript: string) => void;
  onTranscriptComplete?: (transcript: string) => void;
  onError?: (error: string) => void;
  silenceTimeout?: number; // ms before auto-stop (default 2000)
  maxDuration?: number; // max recording duration in ms (default 30000)
}

interface UseWhisperTranscriptionReturn {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
  isSupported: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  toggleRecording: () => void;
}

export function useWhisperTranscription(
  options: UseWhisperTranscriptionOptions = {}
): UseWhisperTranscriptionReturn {
  const {
    onTranscriptChange,
    onTranscriptComplete,
    onError,
    silenceTimeout = 2000,
    maxDuration = 30000,
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxDurationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check browser support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
      const hasGetUserMedia = !!(navigator.mediaDevices?.getUserMedia);
      setIsSupported(hasMediaRecorder && hasGetUserMedia);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    if (silenceCheckIntervalRef.current) {
      clearInterval(silenceCheckIntervalRef.current);
      silenceCheckIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Transcription failed');
      }

      const transcribedText = data.transcript || '';
      setTranscript(transcribedText);
      onTranscriptChange?.(transcribedText);
      onTranscriptComplete?.(transcribedText);
      
      return transcribedText;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transcription failed';
      setError(errorMessage);
      onError?.(errorMessage);
      return '';
    } finally {
      setIsProcessing(false);
    }
  }, [onTranscriptChange, onTranscriptComplete, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    cleanup();
  }, [isRecording, cleanup]);

  const setupSilenceDetection = useCallback((stream: MediaStream) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let silenceStart: number | null = null;

      // Check for silence every 100ms
      silenceCheckIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        
        if (average < 10) {
          // Silence detected
          if (silenceStart === null) {
            silenceStart = Date.now();
          } else if (Date.now() - silenceStart > silenceTimeout) {
            // Silence exceeded timeout, stop recording
            stopRecording();
          }
        } else {
          // Sound detected, reset silence timer
          silenceStart = null;
        }
      }, 100);
    } catch (err) {
      console.warn('Silence detection not available:', err);
    }
  }, [silenceTimeout, stopRecording]);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('Audio recording not supported in this browser');
      onError?.('Audio recording not supported in this browser');
      return;
    }

    setError(null);
    setTranscript('');
    audioChunksRef.current = [];

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;

      // Determine best mime type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        cleanup();
        
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          await transcribeAudio(audioBlob);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording failed');
        onError?.('Recording failed');
        setIsRecording(false);
        cleanup();
      };

      // Setup silence detection
      setupSilenceDetection(stream);

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);

      // Set max duration timer
      maxDurationTimerRef.current = setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, maxDuration);

    } catch (err) {
      console.error('Error starting recording:', err);
      const errorMessage = err instanceof Error 
        ? err.message.includes('Permission denied') || err.message.includes('NotAllowedError')
          ? 'Microphone permission denied'
          : err.message
        : 'Failed to start recording';
      
      setError(errorMessage);
      onError?.(errorMessage);
      cleanup();
    }
  }, [isSupported, maxDuration, transcribeAudio, cleanup, setupSilenceDetection, stopRecording, onError]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isProcessing,
    transcript,
    error,
    isSupported,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}

