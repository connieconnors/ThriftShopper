'use client';

import { useEffect, useId, useState } from 'react';

export type AIProcessingStep =
  | 'idle'
  | 'uploading'
  | 'analyzing'
  | 'generating'
  | 'pricing'
  | 'complete';

const STEP_ORDER: AIProcessingStep[] = [
  'uploading',
  'analyzing',
  'generating',
  'pricing',
];

const STEP_LABELS: Record<Exclude<AIProcessingStep, 'idle' | 'complete'>, string> = {
  uploading: 'Uploading photo…',
  analyzing: 'Analyzing your item…',
  generating: 'Writing your listing…',
  pricing: 'Checking prices…',
};

interface AIAnalysisIndicatorProps {
  step: AIProcessingStep;
  startedAt?: number | null;
}

function CompassIcon({ gradientId, className }: { gradientId: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
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

      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const angleRad = (angle * Math.PI) / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const round = (n: number) => Math.round(n * 100) / 100;
        return (
          <circle
            key={`dot-${angle}`}
            cx={round(60 + 51 * cos)}
            cy={round(60 + 51 * sin)}
            r="2"
            fill="#DFAF37"
            opacity="0.9"
          />
        );
      })}
    </svg>
  );
}

export default function AIAnalysisIndicator({ step, startedAt }: AIAnalysisIndicatorProps) {
  const gradientId = useId();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (step === 'idle' || step === 'complete') return;

    const interval = setInterval(() => setNow(Date.now()), 2000);
    return () => clearInterval(interval);
  }, [step]);

  if (step === 'idle' || step === 'complete') return null;

  const currentIndex = STEP_ORDER.indexOf(step);
  const elapsedMs = startedAt ? now - startedAt : 0;
  const baseLabel = STEP_LABELS[step as keyof typeof STEP_LABELS] ?? 'Working on it…';
  const statusLabel =
    elapsedMs > 20_000
      ? 'Almost ready…'
      : elapsedMs > 12_000 && step === 'pricing'
        ? 'Finishing up…'
        : baseLabel;
  const helperText =
    elapsedMs > 12_000 ? 'Detailed items can take up to a minute.' : null;

  return (
    <div
      className="mb-3 rounded-xl border px-4 py-3 flex items-center gap-4"
      style={{
        borderColor: 'rgba(22, 25, 58, 0.12)',
        backgroundColor: 'rgba(22, 25, 58, 0.04)',
      }}
      role="status"
      aria-live="polite"
      aria-label={statusLabel}
    >
      <div className="relative flex-shrink-0">
        <CompassIcon
          gradientId={gradientId}
          className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-md animate-spin [animation-duration:6s]"
        />
        <span
          className="absolute inset-0 rounded-full animate-ping opacity-20"
          style={{ backgroundColor: '#DFAF37' }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug" style={{ color: '#16193a' }}>
          {statusLabel}
        </p>
        {helperText && (
          <p className="text-xs text-gray-500 mt-1 leading-snug">{helperText}</p>
        )}
        <div className="flex items-center gap-1.5 mt-2.5">
          {STEP_ORDER.map((s, index) => {
            const isDone = index < currentIndex;
            const isActive = index === currentIndex;
            return (
              <span
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  isActive ? 'animate-pulse' : ''
                }`}
                style={{
                  backgroundColor: isDone || isActive ? '#16193a' : 'rgba(22, 25, 58, 0.15)',
                  opacity: isActive ? 1 : isDone ? 0.7 : 1,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
