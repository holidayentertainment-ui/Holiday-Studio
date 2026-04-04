'use client';

import { useEffect } from 'react';
import type { Purchase } from '@/app/api/payment-status/route';

interface PurchaseHistoryProps {
  purchases: Purchase[];
  onClose: () => void;
}

function formatAmount(cents: number, currency: string): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function PurchaseHistory({ purchases, onClose }: PurchaseHistoryProps) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-md rounded-4xl overflow-hidden animate-fade-up"
        style={{
          background: '#0e0e1a',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* Top accent */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)',
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
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

        <div className="p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-7">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 5h12M2 5a1 1 0 00-1 1v7a1 1 0 001 1h12a1 1 0 001-1V6a1 1 0 00-1-1M2 5V4a2 2 0 012-2h8a2 2 0 012 2v1"
                  stroke="white"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Purchase History</h2>
              <p className="text-xs text-[#8888a0] mt-0.5">
                {purchases.length} {purchases.length === 1 ? 'purchase' : 'purchases'} on your account
              </p>
            </div>
          </div>

          {/* Purchase list */}
          {purchases.length === 0 ? (
            <div
              className="rounded-3xl p-8 text-center"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <p className="text-sm text-[#8888a0]">No purchases yet.</p>
              <p className="text-xs text-[#44444f] mt-1">
                Upgrade to Premium to unlock all styles.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {purchases.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl p-4"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  {/* Plan + status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M6 1l1.4 2.9L11 4.5 8.5 6.9l.6 3.6L6 9l-3.1 1.5.6-3.6L1 4.5l3.6-.6L6 1z"
                          fill="rgba(245,158,11,0.8)"
                        />
                      </svg>
                      <span className="text-sm font-semibold">{p.plan_name}</span>
                    </div>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        background: 'rgba(16,185,129,0.12)',
                        color: '#10b981',
                        border: '1px solid rgba(16,185,129,0.2)',
                      }}
                    >
                      {p.status}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8888a0]">Amount</span>
                      <span className="text-xs font-medium">
                        {formatAmount(p.amount_cents, p.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8888a0]">Date</span>
                      <span className="text-xs font-medium">{formatDate(p.purchased_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer note */}
          <p className="text-center text-xs text-[#44444f] mt-6">
            Payments are processed securely via Stripe
          </p>
        </div>
      </div>
    </div>
  );
}
