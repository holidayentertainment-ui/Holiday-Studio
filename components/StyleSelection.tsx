'use client';

import { forwardRef, useEffect, useState } from 'react';

interface Style {
  id: string;
  title: string;
  blurb: string;
  is_premium: boolean;
  icon: string;
  mood: string;
  thumbnail_url: string | null;
}

interface StyleSelectionProps {
  selectedStyle: string;
  hasPremium: boolean;
  onStyleSelect: (id: string, isPremium: boolean) => void;
}

const StyleSelection = forwardRef<HTMLElement, StyleSelectionProps>(
  ({ selectedStyle, hasPremium, onStyleSelect }, ref) => {
    const [styles, setStyles] = useState<Style[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      fetch('/api/styles', { cache: 'no-store' })
        .then((r) => r.json())
        .then((data) => setStyles(data.styles ?? []))
        .catch(() => setStyles([]))
        .finally(() => setLoading(false));
    }, []);

    const freeStyles = styles.filter((s) => !s.is_premium);
    const premiumStyles = styles.filter((s) => s.is_premium);

    return (
      <section ref={ref} className="max-w-7xl mx-auto px-6 section-spacing">
        {/* Section header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
            >
              2
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Choose Your Style</h2>
              {!loading && (
                <p className="text-sm text-[#8888a0] mt-0.5">
                  {freeStyles.length} free {freeStyles.length === 1 ? 'style' : 'styles'} included
                  {premiumStyles.length > 0 && ` · ${premiumStyles.length} premium unlocked with upgrade`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-3xl p-5 border animate-pulse"
                  style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <div className="w-8 h-8 rounded-xl bg-[rgba(255,255,255,0.06)] mb-3" />
                  <div className="h-4 w-32 rounded-lg bg-[rgba(255,255,255,0.06)] mb-2" />
                  <div className="h-3 w-full rounded-lg bg-[rgba(255,255,255,0.04)]" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Free styles */}
        {!loading && freeStyles.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#8888a0]">Free</span>
              <div className="h-px flex-1 bg-[rgba(255,255,255,0.05)]" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {freeStyles.map((style) => (
                <StyleCard
                  key={style.id}
                  style={style}
                  isSelected={selectedStyle === style.id}
                  isLocked={false}
                  onClick={() => onStyleSelect(style.id, false)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Premium styles */}
        {!loading && premiumStyles.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <span
                className="text-xs font-semibold uppercase tracking-widest"
                style={{
                  background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Premium
              </span>
              <div className="h-px flex-1 bg-[rgba(245,158,11,0.15)]" />
              {!hasPremium && (
                <span className="text-xs text-[#8888a0]">Upgrade from $9.99</span>
              )}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {premiumStyles.map((style) => (
                <StyleCard
                  key={style.id}
                  style={style}
                  isSelected={selectedStyle === style.id}
                  isLocked={!hasPremium}
                  onClick={() => onStyleSelect(style.id, true)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Free vs Premium note */}
        {!loading && (
          <p className="mt-5 text-xs text-[#44444f] text-center">
            {freeStyles.length} {freeStyles.length === 1 ? 'style' : 'styles'} available free
            {premiumStyles.length > 0 && ` · Upgrade to unlock all ${premiumStyles.length} premium ${premiumStyles.length === 1 ? 'style' : 'styles'}`}
          </p>
        )}
      </section>
    );
  },
);

StyleSelection.displayName = 'StyleSelection';
export default StyleSelection;

/* ----- StyleCard sub-component ----- */

interface StyleCardProps {
  style: Style;
  isSelected: boolean;
  isLocked: boolean;
  onClick: () => void;
}

function StyleCard({ style, isSelected, isLocked, onClick }: StyleCardProps) {
  const isPremium = style.is_premium;

  return (
    <button
      onClick={onClick}
      className={`text-left rounded-3xl p-5 border transition-all duration-200 relative overflow-hidden group
        ${
          isSelected
            ? 'card-selected'
            : isPremium && isLocked
            ? 'border-[rgba(245,158,11,0.15)] bg-[rgba(245,158,11,0.04)] hover:bg-[rgba(245,158,11,0.07)]'
            : 'glass-card glass-card-hover'
        }
      `}
      style={
        isSelected
          ? undefined
          : isPremium && !isLocked
          ? { borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.04)' }
          : undefined
      }
    >
      {/* Blur overlay for locked */}
      {isLocked && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5"
          style={{ background: 'rgba(7,7,13,0.55)', backdropFilter: 'blur(3px)' }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="7" width="10" height="7" rx="2" stroke="rgba(245,158,11,0.8)" strokeWidth="1.5" />
              <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="rgba(245,158,11,0.8)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-amber-400/80">Premium</span>
        </div>
      )}

      {/* Thumbnail image (if available) */}
      {style.thumbnail_url && !isLocked && (
        <div className="mb-3 -mx-5 -mt-5 overflow-hidden rounded-t-3xl h-28">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={style.thumbnail_url}
            alt={style.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      {/* Card content */}
      <div className={`relative z-0 ${isLocked ? 'blur-[1px]' : ''}`}>
        {/* Icon + selected check */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl">{style.icon || '🖼️'}</span>
          {isSelected && !isLocked && (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.9)' }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
          {!isSelected && !isLocked && isPremium && (
            <div
              className="px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
              style={{ background: 'rgba(245,158,11,0.12)', color: 'rgba(245,158,11,0.9)', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              Pro
            </div>
          )}
        </div>

        <h3 className="font-semibold text-[15px] leading-tight tracking-tight">{style.title}</h3>
        {style.blurb && (
          <p className="text-xs text-[#8888a0] mt-2 leading-relaxed">{style.blurb}</p>
        )}

        {/* Mood tags */}
        {style.mood && (
          <div className="mt-3 flex flex-wrap gap-1">
            {style.mood.split(' · ').map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{
                  background: isSelected ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
                  color: isSelected ? 'rgba(165,180,252,0.9)' : 'rgba(255,255,255,0.4)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
