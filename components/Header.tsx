'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface HeaderProps {
  hasPremium: boolean;
  onUpgradeClick: () => void;
}

export default function Header({ hasPremium, onUpgradeClick }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    // Get initial session
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    // Listen for auth changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setMenuOpen(false);
  };

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-[rgba(255,255,255,0.05)]"
      style={{ background: 'rgba(7,7,13,0.85)', backdropFilter: 'blur(20px)' }}
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

        {/* Nav links (desktop) */}
        <nav className="hidden md:flex items-center gap-6">
          {['Features', 'Pricing', 'Gallery'].map((item) => (
            <a
              key={item}
              href="#"
              className="text-sm text-[#8888a0] hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
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
              Upgrade — $14.99
            </button>
          )}

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
                  <button
                    onClick={handleSignOut}
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
  );
}
