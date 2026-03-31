'use client';

import { useState, useEffect } from 'react';

const LOADING_MESSAGES = [
  'Analyzing your reference photo…',
  'Applying identity lock…',
  'Enhancing lighting and tone…',
  'Composing editorial framing…',
  'Applying pose direction…',
  'Finalizing image quality…',
  'Almost there…',
];

const STEPS = [
  { label: 'Identity Analysis', icon: '🔍' },
  { label: 'Pose Synthesis', icon: '🧍' },
  { label: 'Editorial Rendering', icon: '✦' },
  { label: 'Quality Pass', icon: '✔' },
];

export default function LoadingState() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setAnimate(false);
      setTimeout(() => {
        setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
        setAnimate(true);
      }, 200);
    }, 2200);
    return () => clearInterval(msgTimer);
  }, []);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    }, 1800);
    return () => clearInterval(stepTimer);
  }, []);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((p) => {
        if (p >= 94) return p;
        return p + Math.random() * 4;
      });
    }, 300);
    return () => clearInterval(progressTimer);
  }, []);

  return (
    <section className="max-w-2xl mx-auto px-6 py-20 text-center">
      {/* Outer glow ring */}
      <div className="relative w-28 h-28 mx-auto mb-10">
        {/* Pulsing rings */}
        <div
          className="absolute inset-0 rounded-full animate-pulse-ring"
          style={{
            background: 'transparent',
            border: '1px solid rgba(99,102,241,0.2)',
            transform: 'scale(1.3)',
          }}
        />
        <div
          className="absolute inset-0 rounded-full animate-pulse-ring"
          style={{
            background: 'transparent',
            border: '1px solid rgba(99,102,241,0.12)',
            transform: 'scale(1.6)',
            animationDelay: '0.5s',
          }}
        />

        {/* Spinner ring */}
        <div
          className="absolute inset-0 rounded-full animate-spin-slow"
          style={{
            background: 'conic-gradient(from 0deg, rgba(99,102,241,0.8) 0deg, transparent 280deg)',
            WebkitMaskImage: 'radial-gradient(transparent 55%, black 56%)',
            maskImage: 'radial-gradient(transparent 55%, black 56%)',
          }}
        />

        {/* Inner circle */}
        <div
          className="absolute inset-3 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path
              d="M14 4l2.6 5.2L22 10.5l-4 3.9.9 5.5L14 17.4l-4.9 2.5.9-5.5-4-3.9 5.4-.3L14 4z"
              fill="url(#star-grad)"
            />
            <defs>
              <linearGradient id="star-grad" x1="4" y1="4" x2="22" y2="22">
                <stop stopColor="#a5b4fc" />
                <stop offset="1" stopColor="#818cf8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold tracking-tight mb-2">Generating Your Image</h2>

      {/* Cycling message */}
      <p
        className="text-[#8888a0] text-base h-6 transition-all duration-300"
        style={{ opacity: animate ? 1 : 0, transform: animate ? 'translateY(0)' : 'translateY(4px)' }}
      >
        {LOADING_MESSAGES[msgIndex]}
      </p>

      {/* Progress bar */}
      <div className="mt-8 h-1.5 rounded-full overflow-hidden bg-[rgba(255,255,255,0.06)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(progress, 94)}%`,
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            boxShadow: '0 0 12px rgba(99,102,241,0.4)',
          }}
        />
      </div>
      <p className="mt-2 text-xs text-[#44444f]">{Math.round(Math.min(progress, 94))}%</p>

      {/* Step indicators */}
      <div className="mt-10 grid grid-cols-4 gap-3">
        {STEPS.map((step, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex;
          return (
            <div
              key={step.label}
              className="flex flex-col items-center gap-2 text-center"
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm transition-all duration-500"
                style={{
                  background: done
                    ? 'rgba(99,102,241,0.2)'
                    : active
                    ? 'rgba(99,102,241,0.12)'
                    : 'rgba(255,255,255,0.04)',
                  border: done
                    ? '1px solid rgba(99,102,241,0.4)'
                    : active
                    ? '1px solid rgba(99,102,241,0.25)'
                    : '1px solid rgba(255,255,255,0.06)',
                  opacity: done || active ? 1 : 0.4,
                }}
              >
                {done ? '✓' : step.icon}
              </div>
              <span
                className="text-[10px] font-medium leading-tight"
                style={{
                  color: done
                    ? 'rgba(165,180,252,0.9)'
                    : active
                    ? 'rgba(255,255,255,0.7)'
                    : 'rgba(255,255,255,0.25)',
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-xs text-[#44444f]">
        Usually takes 10–30 seconds depending on selected style
      </p>
    </section>
  );
}
