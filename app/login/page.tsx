'use client';

import { Suspense, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageShell />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const [loading, setLoading] = useState(false);
  const [setupError, setSetupError] = useState('');
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const handleGoogleLogin = async () => {
    setSetupError('');
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setSetupError(
        'Google sign-in is not configured yet. Add your Supabase public environment variables in Vercel.',
      );
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setSetupError(error.message || 'Google sign-in failed. Please try again.');
      setLoading(false);
      return;
    }

    if (data?.url) {
      window.location.assign(data.url);
      return;
    }

    setSetupError(
      'Google sign-in could not start. Check your Supabase Google provider settings and redirect URL.',
    );
    setLoading(false);
  };

  return (
    <LoginPageShell
      error={error}
      setupError={setupError}
      loading={loading}
      onGoogleLogin={handleGoogleLogin}
    />
  );
}

interface LoginPageShellProps {
  error?: string | null;
  setupError?: string;
  loading?: boolean;
  onGoogleLogin?: () => void;
}

function LoginPageShell({
  error = null,
  setupError = '',
  loading = false,
  onGoogleLogin,
}: LoginPageShellProps) {
  return (
    <div className="min-h-screen bg-[#07070d] flex items-center justify-center px-4">
      <div
        className="w-full max-w-sm rounded-3xl p-8 border"
        style={{
          background: 'rgba(255,255,255,0.03)',
          borderColor: 'rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex justify-center mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1.5L14 5v6l-6 3.5L2 11V5L8 1.5z"
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <circle cx="8" cy="8" r="2" fill="white" fillOpacity="0.8" />
            </svg>
          </div>
        </div>

        <h1 className="text-white text-2xl font-semibold text-center tracking-tight mb-2">
          Welcome back
        </h1>
        <p className="text-[#8888a0] text-sm text-center mb-8">
          Sign in to Holiday Focus Studio
        </p>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-300 text-center">
            Authentication failed. Please try again.
          </div>
        )}

        {setupError && (
          <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-sm text-amber-200 text-center">
            {setupError}
          </div>
        )}

        <button
          onClick={onGoogleLogin}
          disabled={loading}
          className="w-full h-12 rounded-2xl flex items-center justify-center gap-3 font-medium text-sm transition-all"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'white',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
          }}
        >
          {loading ? (
            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeOpacity="0.25"
              />
              <path
                d="M12 2a10 10 0 0110 10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                fill="#4285F4"
              />
              <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"
                fill="#EA4335"
              />
            </svg>
          )}
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <p className="text-[#44444f] text-xs text-center mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
