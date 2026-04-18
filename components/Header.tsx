'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import PurchaseHistory from '@/components/PurchaseHistory';
import GenerationHistory from '@/components/GenerationHistory';
import NotificationBell from '@/components/NotificationBell';
import type { Purchase } from '@/app/api/payment-status/route';

interface HeaderProps {
  hasPremium: boolean;
  purchases: Purchase[];
  onUpgradeClick: () => void;
}

export default function Header({ hasPremium, purchases, onUpgradeClick }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
  const [showGenerationHistory, setShowGenerationHistory] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    // Get initial session
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    // Listen for auth changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setIsAdmin(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check admin access whenever user changes
  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    fetch('/api/admin/check')
      .then((r) => r.json())
      .then((data) => setIsAdmin(Boolean(data.hasAccess)))
      .catch(() => setIsAdmin(false));
  }, [user]);

  const handleSignOut = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setMenuOpen(false);
    // Redirect to home — clears all image/generation state cleanly
    window.location.href = '/';
  };

  return (
    <>
    <header
      className="fixed top-0 left-0 right-0 z-50 w-full border-b border-[rgba(255,255,255,0.05)]"
      style={{ background: 'rgba(7,7,13,0.92)', backdropFilter: 'blur(20px)' }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1.5L14 5v6l-6 3.5L2 11V5L8 1.5z"
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <circle cx="8" cy="8" r="2" fill="white" fillOpacity="0.8" />
            </svg>
          </div>
          <span className="font-semibold text-[15px] tracking-tight hidden sm:block">
            Holiday Focus Studio
          </span>
          <span className="font-semibold text-[15px] tracking-tight sm:hidden">HFS</span>
        </div>


        {/* Nav — Gallery button (logged-in users only) */}
        {user && (
          <button
            onClick={() => setShowGenerationHistory(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-[#8888a0] hover:text-white transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect x="1" y="1" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
              <rect x="7.5" y="1" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
              <rect x="1" y="7.5" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
              <rect x="7.5" y="7.5" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            Gallery
          </button>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {hasPremium ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)]">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="text-amber-400"
              >
                <path
                  d="M7 1l1.8 3.6L13 5.5l-3 2.9.7 4.1L7 10.4 3.3 12.5 4 8.4 1 5.5l4.2-.9L7 1z"
                  fill="currentColor"
                />
              </svg>
              <span className="text-xs font-semibold text-amber-400 tracking-wide uppercase">
                Premium
              </span>
            </div>
          ) : (
            <button onClick={onUpgradeClick} className="btn-premium px-4 py-2 rounded-xl text-sm">
              Upgrade — $9.99
            </button>
          )}

          {/* Notification Bell — only for logged-in users */}
          <NotificationBell user={user ? { id: user.id, email: user.email ?? '' } : null} />

          {/* Auth — logged in: avatar + dropdown / logged out: Sign In link */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="w-8 h-8 rounded-full overflow-hidden border border-[rgba(255,255,255,0.15)] flex items-center justify-center focus:outline-none"
                title={user.email ?? 'Account'}
              >
                {user.user_metadata?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-xs font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                  >
                    {(user.email ?? 'U')[0].toUpperCase()}
                  </div>
                )}
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 rounded-2xl border py-2 z-50"
                  style={{
                    background: 'rgba(14,14,22,0.95)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  <div className="px-4 py-2 border-b border-[rgba(255,255,255,0.06)]">
                    <p className="text-xs text-[#8888a0] truncate">{user.email}</p>
                  </div>
                  {/* Admin Panel link — only visible to admins / team members */}
                  {isAdmin && (
                    <a
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-[rgba(255,255,255,0.05)] transition-colors flex items-center gap-2"
                      style={{ color: '#818cf8' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <rect x="1" y="1" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
                        <rect x="7.5" y="1" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
                        <rect x="1" y="7.5" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
                        <rect x="7.5" y="7.5" width="4.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
                      </svg>
                      Admin Panel
                    </a>
                  )}
                  <button
                    onClick={() => { setShowPurchaseHistory(true); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#8888a0] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors flex items-center gap-2"
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path
                        d="M1.5 4h10M1.5 4a.75.75 0 00-.75.75v6.5c0 .414.336.75.75.75h10a.75.75 0 00.75-.75v-6.5A.75.75 0 0011.5 4M1.5 4V3a1.5 1.5 0 011.5-1.5h7A1.5 1.5 0 0111.5 3v1"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                    </svg>
                    Purchase History
                  </button>
                  <button
                    onClick={() => { setShowSignOutConfirm(true); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#8888a0] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a
              href="/login"
              className="text-sm text-[#8888a0] hover:text-white transition-colors px-3 py-1.5 rounded-xl border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.18)]"
            >
              Sign in
            </a>
          )}
        </div>
      </div>
    </header>

    {/* Sign out confirmation */}
    {showSignOutConfirm && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        onClick={() => setShowSignOutConfirm(false)}
      >
        <div
          className="w-full max-w-xs rounded-3xl p-6 border"
          style={{ background: 'rgba(14,14,22,0.98)', borderColor: 'rgba(255,255,255,0.1)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-white text-base font-semibold text-center mb-2">Sign out?</h3>
          <p className="text-[#8888a0] text-sm text-center mb-6">
            You'll need to sign in again to generate images.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowSignOutConfirm(false)}
              className="flex-1 h-10 rounded-2xl text-sm font-medium text-[#8888a0] hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Cancel
            </button>
            <button
              onClick={() => { setShowSignOutConfirm(false); handleSignOut(); }}
              className="flex-1 h-10 rounded-2xl text-sm font-semibold text-white transition-colors"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Purchase History modal */}
    {showPurchaseHistory && (
      <PurchaseHistory
        purchases={purchases}
        onClose={() => setShowPurchaseHistory(false)}
      />
    )}

    {/* Generation History modal */}
    {showGenerationHistory && (
      <GenerationHistory
        onClose={() => setShowGenerationHistory(false)}
      />
    )}
</>
  );
}
