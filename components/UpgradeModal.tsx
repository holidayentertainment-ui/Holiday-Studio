'use client';

import { useEffect, useState } from 'react';

const BENEFITS = [
  {
    icon: '✦',
    title: 'All 7 Styles Unlocked',
    desc: 'Full Editorial, Beauty, High Fashion, Cinematic Portrait, and more.',
  },
  {
    icon: '📥',
    title: 'Unlimited Downloads',
    desc: 'Download full-resolution, professional-quality images every time.',
  },
  {
    icon: '🎨',
    title: 'Full Creative Control',
    desc: 'Custom wardrobe, location, and art direction input on all styles.',
  },
  {
    icon: '⚡',
    title: 'Priority Generation',
    desc: 'Jump the queue with faster, higher-resolution outputs.',
  },
];

interface UpgradeModalProps {
  onClose: () => void;
  onUpgrade: (plan: 'monthly' | 'yearly') => void;
}

export default function UpgradeModal({ onClose, onUpgrade }: UpgradeModalProps) {
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly');

  // Trap body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const isYearly = plan === 'yearly';
  const price    = isYearly ? '$99.99' : '$9.99';
  const period   = isYearly ? '/ year' : '/ month';
  const saving   = isYearly ? 'Save 17% vs monthly' : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-lg rounded-4xl overflow-hidden animate-fade-up"
        style={{
          background: '#0e0e1a',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 80px rgba(99,102,241,0.06)',
        }}
      >
        {/* Top accent gradient */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.5), transparent)',
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245,158,11,0.08) 0%, transparent 80%)',
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)';
            (e.target as HTMLButtonElement).style.color = 'white';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)';
            (e.target as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)';
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M1.5 1.5l9 9M10.5 1.5l-9 9"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="p-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-6">
            <div
              className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.15))',
                border: '1px solid rgba(245,158,11,0.25)',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2l2.5 5L20 8l-4 3.9 1 5.6L12 15l-5 2.5 1-5.6L4 8l5.5-.9L12 2z"
                  fill="url(#crown-grad)"
                />
                <defs>
                  <linearGradient id="crown-grad" x1="4" y1="2" x2="20" y2="18">
                    <stop stopColor="#fcd34d" />
                    <stop offset="1" stopColor="#d97706" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-1">Unlock Premium</h2>
            <p className="text-[#8888a0] text-sm">
              Everything you need for professional editorial results
            </p>
          </div>

          {/* Plan Toggle */}
          <div
            className="flex rounded-2xl p-1 mb-6"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {(['monthly', 'yearly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className="flex-1 h-10 rounded-xl text-sm font-semibold transition-all capitalize flex items-center justify-center gap-2"
                style={
                  plan === p
                    ? {
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(217,119,6,0.2))',
                        border: '1px solid rgba(245,158,11,0.35)',
                        color: '#fcd34d',
                      }
                    : { color: 'rgba(255,255,255,0.4)' }
                }
              >
                {p}
                {p === 'yearly' && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}
                  >
                    Save 17%
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Price */}
          <div className="text-center mb-6">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold tracking-tight gradient-text-premium">{price}</span>
              <span className="text-[#8888a0] text-sm">{period}</span>
            </div>
            {saving && (
              <p className="text-xs text-emerald-400 mt-1">{saving}</p>
            )}
          </div>

          {/* Benefits */}
          <div className="space-y-3 mb-8">
            {BENEFITS.map((b) => (
              <div
                key={b.title}
                className="flex items-start gap-4 p-4 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
                  style={{
                    background: 'rgba(245,158,11,0.1)',
                    border: '1px solid rgba(245,158,11,0.15)',
                  }}
                >
                  {b.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold">{b.title}</div>
                  <div className="text-xs text-[#8888a0] mt-0.5 leading-relaxed">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="space-y-3">
            <button
              onClick={() => onUpgrade(plan)}
              className="btn-premium w-full h-14 rounded-2xl text-base"
            >
              {isYearly ? 'Upgrade Now — $99.99 / year' : 'Upgrade Now — $9.99 / month'}
            </button>
            <button
              onClick={onClose}
              className="btn-ghost w-full h-11 rounded-2xl text-sm"
            >
              Continue with Free
            </button>
          </div>

          {/* Trust line */}
          <p className="text-center text-xs text-[#44444f] mt-5">
            Secure checkout via Stripe · Instant access after payment
          </p>
        </div>
      </div>
    </div>
  );
}
