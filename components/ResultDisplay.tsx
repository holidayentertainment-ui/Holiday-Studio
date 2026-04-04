'use client';

import { useRef } from 'react';

const STYLE_LABELS: Record<string, string> = {
  professional_headshot: 'Professional Headshot',
  model_casting: 'Model Casting',
  quarter_editorial: 'Quarter Editorial',
  full_editorial: 'Full Editorial',
  beauty_editorial: 'Beauty Editorial',
  high_fashion: 'High Fashion',
  cinematic_portrait: 'Cinematic Portrait',
};

const FREE_STYLES = ['professional_headshot', 'model_casting', 'quarter_editorial'];

interface ResultDisplayProps {
  generatedImage: string;
  hasPremium: boolean;
  selectedStyle: string;
  onRegenerate: () => void;
  onReset: () => void;
  onUpgrade: () => void;
}

export default function ResultDisplay({
  generatedImage,
  hasPremium,
  selectedStyle,
  onRegenerate,
  onReset,
  onUpgrade,
}: ResultDisplayProps) {
  const imgRef = useRef<HTMLImageElement>(null);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `holiday-focus-studio-${selectedStyle}-${Date.now()}.jpg`;
    a.click();
  };

  const styleName = STYLE_LABELS[selectedStyle] || 'Editorial';
  const isFreeStyle = FREE_STYLES.includes(selectedStyle);

  return (
    <section className="max-w-7xl mx-auto px-6 section-spacing animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-10">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M2.5 7l3 3L11.5 4"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Your Image is Ready</h2>
          <p className="text-sm text-[#8888a0] mt-0.5">
            {styleName} · Generated just now
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
        {/* Image panel */}
        <div
          className="relative rounded-4xl overflow-hidden"
          style={{
            background: '#0d0d1a',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 60px rgba(0,0,0,0.6)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={generatedImage}
            alt="Generated editorial image"
            className="w-full object-contain"
            style={{ maxHeight: 700, display: 'block' }}
          />

          {/* Premium badge */}
          {!isFreeStyle && hasPremium && (
            <div className="absolute top-4 right-4">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{
                  background: 'rgba(245,158,11,0.15)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M5 1l1.2 2.4L9 4 7 5.9l.5 2.8L5 7.5 2.5 8.7 3 5.9 1 4l2.8-.6L5 1z"
                    fill="rgba(245,158,11,0.9)"
                  />
                </svg>
                <span className="text-[11px] font-semibold text-amber-400">Premium</span>
              </div>
            </div>
          )}

          {/* Style tag */}
          <div className="absolute top-4 left-4">
            <div
              className="px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: 'rgba(7,7,13,0.7)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(8px)',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              {styleName}
            </div>
          </div>
        </div>

        {/* Right panel: actions + info */}
        <div className="flex flex-col gap-5">
          {/* Primary actions */}
          <div
            className="rounded-3xl p-5"
            style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <h3 className="text-sm font-semibold text-[#8888a0] uppercase tracking-widest mb-4">
              Export
            </h3>
            <button
              onClick={handleDownload}
              className="btn-primary h-12 rounded-2xl text-sm font-semibold w-full"
            >
              <svg
                className="inline mr-2 -mt-0.5"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
              >
                <path
                  d="M7 2v7M4 7l3 3 3-3M2 12h10"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Download Image
            </button>
          </div>

          {/* Upgrade prompt — shown to non-premium users trying premium styles */}
          {!isFreeStyle && !hasPremium && (
            <div
              className="rounded-3xl p-5"
              style={{
                background: 'rgba(245,158,11,0.05)',
                border: '1px solid rgba(245,158,11,0.15)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M7 1l1.5 3L12 4.5l-2.5 2.4.6 3.6L7 9l-3.1 1.5.6-3.6L2 4.5 5.5 4 7 1z"
                    fill="rgba(245,158,11,0.8)"
                  />
                </svg>
                <span className="text-sm font-semibold text-amber-300">Unlock Premium Styles</span>
              </div>
              <p className="text-xs text-[#8888a0] mb-4 leading-relaxed">
                Upgrade to Premium to access all editorial styles and generate unlimited images.
              </p>
              <button
                onClick={onUpgrade}
                className="btn-premium w-full h-10 rounded-xl text-sm"
              >
                Upgrade — $9.99
              </button>
            </div>
          )}

          {/* Regenerate + Reset */}
          <div
            className="rounded-3xl p-5 space-y-3"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <h3 className="text-sm font-semibold text-[#8888a0] uppercase tracking-widest mb-4">
              Actions
            </h3>
            <button
              onClick={onRegenerate}
              className="btn-ghost w-full h-11 rounded-xl text-sm font-medium"
            >
              <svg
                className="inline mr-2 -mt-0.5"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
              >
                <path
                  d="M2 7a5 5 0 1010 0M12 4V1l-3 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Regenerate
            </button>
            <button
              onClick={onReset}
              className="btn-ghost w-full h-11 rounded-xl text-sm font-medium"
            >
              <svg
                className="inline mr-2 -mt-0.5"
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
              >
                <path
                  d="M7 2v3l3-3H7zM3 7a4 4 0 008 0"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Generate Another
            </button>
          </div>

          {/* Details card */}
          <div
            className="rounded-3xl p-5"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <h3 className="text-sm font-semibold text-[#8888a0] uppercase tracking-widest mb-3">
              Details
            </h3>
            {[
              { label: 'Style', value: styleName },
              { label: 'Tier', value: isFreeStyle ? 'Free' : 'Premium' },
              { label: 'Quality', value: 'High Resolution' },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-2.5 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.05)' }}
              >
                <span className="text-xs text-[#8888a0]">{row.label}</span>
                <span className="text-xs font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
