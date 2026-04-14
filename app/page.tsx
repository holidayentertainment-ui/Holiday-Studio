'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import UploadArea from '@/components/UploadArea';
import StyleSelection from '@/components/StyleSelection';
import PoseSelection from '@/components/PoseSelection';
import LoadingState from '@/components/LoadingState';
import ResultDisplay from '@/components/ResultDisplay';
import UpgradeModal from '@/components/UpgradeModal';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Purchase } from '@/app/api/payment-status/route';

export type AppStep = 'idle' | 'ready' | 'generating' | 'result';

// Empty string → uses Next.js internal /api routes (no cross-origin issues)
const API_BASE = '';
const STRIPE_MONTHLY_URL = 'https://buy.stripe.com/8x2dR89zxc5I1iw6hf3F600';
const STRIPE_YEARLY_URL  = 'https://buy.stripe.com/6oU5kC6nl7Psgdq8pn3F601';

export default function Home() {
  const [step, setStep] = useState<AppStep>('idle');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedMimeType, setUploadedMimeType] = useState('image/jpeg');
  const [selectedStyle, setSelectedStyle] = useState('professional_headshot');
  const [selectedPose, setSelectedPose] = useState('female');
  const [hasPremium, setHasPremium] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [wardrobeInput, setWardrobeInput] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [beforeAfterImages, setBeforeAfterImages] = useState<{ before: string; after: string; enabled: boolean } | null>(null);
  const pendingGenerateRef = useRef(false);

  // ── Fetch premium status from the server ──────────────────────────────
  const fetchPremiumStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/payment-status`);
      if (!res.ok) return;
      const data = await res.json();
      setHasPremium(data.hasPremium ?? false);
      setPurchases(data.purchases ?? []);
    } catch {
      // Non-blocking — silently fail
    }
  }, []);

  // ── Auth listener + premium check on login ────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) fetchPremiumStatus();
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchPremiumStatus();
      } else {
        setHasPremium(false);
        setPurchases([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchPremiumStatus]);

  // ── Fetch before/after images ─────────────────────────────────────────
  useEffect(() => {
    fetch('/api/site-settings')
      .then((r) => r.json())
      .then((data) => {
        const s = data.settings ?? {};
        console.log('[site-settings]', s);
        if (s.before_after_enabled === 'true' && s.before_image_url && s.after_image_url) {
          setBeforeAfterImages({ before: s.before_image_url, after: s.after_image_url, enabled: true });
        }
      })
      .catch((err) => console.error('[site-settings] fetch failed:', err));
  }, []);

  // ── Handle Stripe redirect: ?payment=success ──────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      window.history.replaceState({}, '', '/');
      setShowPaymentSuccess(true);
      // Retry fetching premium status to handle webhook processing delay
      // Stripe webhooks can take a few seconds — we try at 2s, 5s, and 10s
      setTimeout(() => fetchPremiumStatus(), 2000);
      setTimeout(() => fetchPremiumStatus(), 5000);
      setTimeout(() => fetchPremiumStatus(), 10000);
      // Keep the banner visible long enough for premium to activate
      setTimeout(() => setShowPaymentSuccess(false), 14000);
    }
  }, [fetchPremiumStatus]);

  // ── Fire pending generate once auth resolves ─────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!pendingGenerateRef.current) return;
    pendingGenerateRef.current = false;
    if (user) {
      handleGenerate();
    } else {
      setShowLoginPrompt(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  // ── Restore state saved before login redirect ─────────────────────────
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('hfs_pending');
      if (!saved) return;
      sessionStorage.removeItem('hfs_pending');
      const state = JSON.parse(saved);

      // Restore image selections if present
      if (state.uploadedImage) {
        setUploadedImage(state.uploadedImage);
        setUploadedMimeType(state.uploadedMimeType || 'image/jpeg');
        setSelectedStyle(state.selectedStyle || 'professional_headshot');
        setSelectedPose(state.selectedPose || 'female');
        setLocationInput(state.locationInput || '');
        setWardrobeInput(state.wardrobeInput || '');
        setStep('ready');
      }

      // If user came back from login to complete a purchase, open Stripe
      if (state.pendingStripe) {
        const pendingBase = state.pendingPlan === 'yearly' ? STRIPE_YEARLY_URL : STRIPE_MONTHLY_URL;
        setTimeout(() => window.open(pendingBase, '_blank'), 800);
      }
    } catch {
      // sessionStorage unavailable or corrupted — ignore
    }
  }, []);

  const styleRef = useRef<HTMLElement>(null);
  const resultRef = useRef<HTMLElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLElement>) => {
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleImageUpload = useCallback((imageDataUrl: string, file: File) => {
    setUploadedImage(imageDataUrl);
    setUploadedFile(file);
    setUploadedMimeType(file.type || 'image/jpeg');
    setStep('ready');
    setGeneratedImage(null);
    setErrorMessage('');
    scrollTo(styleRef);
  }, []);

  const handleStyleSelect = useCallback(
    (styleId: string, isPremium: boolean) => {
      if (isPremium && !hasPremium) {
        setShowUpgradeModal(true);
        return;
      }
      setSelectedStyle(styleId);
    },
    [hasPremium],
  );

  const handleGenerate = useCallback(async () => {
    if (!uploadedImage) return;
    // Gate: require login before generating
    if (!user) {
      if (authLoading) {
        // Auth still resolving — queue generate, fires automatically when done
        pendingGenerateRef.current = true;
        return;
      }
      setShowLoginPrompt(true);
      return;
    }
    setStep('generating');
    setErrorMessage('');
    scrollTo(resultRef);

    try {
      // Convert to base64
      const base64 = uploadedImage.includes(',') ? uploadedImage.split(',')[1] : uploadedImage;

      const response = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureId: selectedStyle,
          poseId: selectedPose,
          imageBase64: base64,
          mimeType: uploadedMimeType,
          location: locationInput || undefined,
          wardrobe: wardrobeInput || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Generation failed.');

      setGeneratedImage(data.imageUrl || uploadedImage);
      setStep('result');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      // Demo fallback: use uploaded image as mock result
      if (message.includes('fetch') || message.includes('network') || message.includes('Failed')) {
        setGeneratedImage(uploadedImage);
        setStep('result');
      } else {
        setErrorMessage(message);
        setStep('ready');
      }
    }
  }, [uploadedImage, uploadedMimeType, selectedStyle, selectedPose, locationInput, wardrobeInput, authLoading, user]);

  const handleRegenerate = useCallback(() => {
    handleGenerate();
  }, [handleGenerate]);

  const handleReset = useCallback(() => {
    setStep('idle');
    setUploadedImage(null);
    setUploadedFile(null);
    setUploadedMimeType('image/jpeg');
    setGeneratedImage(null);
    setErrorMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleUpgrade = useCallback((plan: 'monthly' | 'yearly' = 'monthly') => {
    if (!user) {
      // Not logged in — save Stripe intent (+ any image state) and go to login first
      try {
        sessionStorage.setItem('hfs_pending', JSON.stringify({
          pendingStripe: true,
          pendingPlan: plan,
          ...(uploadedImage ? {
            uploadedImage,
            uploadedMimeType,
            selectedStyle,
            selectedPose,
            locationInput,
            wardrobeInput,
          } : {}),
        }));
      } catch { /* sessionStorage full — proceed without saving */ }
      setShowUpgradeModal(false);
      window.location.href = '/login';
      return;
    }
    // Build Stripe URL with user ID + prefilled email
    // client_reference_id lets the webhook find the user by ID regardless of
    // which email they type in the Stripe form
    const baseUrl = plan === 'yearly' ? STRIPE_YEARLY_URL : STRIPE_MONTHLY_URL;
    const stripeUrl = new URL(baseUrl);
    stripeUrl.searchParams.set('client_reference_id', user.id);
    if (user.email) stripeUrl.searchParams.set('prefilled_email', user.email);
    window.open(stripeUrl.toString(), '_blank');
    setShowUpgradeModal(false);
  }, [user, uploadedImage, uploadedMimeType, selectedStyle, selectedPose, locationInput, wardrobeInput]);

  const canGenerate = step === 'ready' && !!uploadedImage;

  return (
    <div className="min-h-screen bg-[#07070d] text-white overflow-x-hidden">

      {/* Payment success banner */}
      {showPaymentSuccess && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl"
          style={{
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.3)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8l3.5 3.5L13 4.5" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm font-semibold text-emerald-300">
            Payment successful — Premium unlocked!
          </span>
        </div>
      )}

      <Header
        hasPremium={hasPremium}
        purchases={purchases}
        onUpgradeClick={() => setShowUpgradeModal(true)}
      />

      <Hero
        onUploadClick={() => {
          document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Before / After showcase — shown only when admin has set images */}
      {beforeAfterImages?.enabled && (
        <section className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-2">See the Difference</p>
            <h2 className="text-2xl font-bold tracking-tight text-white">Before &amp; After</h2>
            <p className="text-sm text-[#8888a0] mt-2">Drag the slider to compare the original with the AI-generated result.</p>
          </div>
          <BeforeAfterSlider beforeUrl={beforeAfterImages.before} afterUrl={beforeAfterImages.after} />
        </section>
      )}

      <UploadArea
        id="upload-section"
        uploadedImage={uploadedImage}
        onImageUpload={handleImageUpload}
      />

      {/* Style + Pose + Generate — always visible */}
      <StyleSelection
        ref={styleRef}
        selectedStyle={selectedStyle}
        hasPremium={hasPremium}
        onStyleSelect={handleStyleSelect}
      />

      <PoseSelection selectedPose={selectedPose} onPoseSelect={setSelectedPose} />

      {/* Optional customization: location + wardrobe */}
      <section className="max-w-7xl mx-auto px-6 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          >
            4
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Customize Your Look</h2>
            <p className="text-sm text-[#8888a0] mt-0.5">Optional — location and wardrobe hints for the AI</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#8888a0] mb-2">Location / Background</label>
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="e.g. clean studio, rooftop, luxury lobby"
              className="w-full h-12 rounded-2xl px-4 text-sm text-white placeholder-[#44444f] outline-none transition-colors"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#8888a0] mb-2">Wardrobe / Styling</label>
            <input
              type="text"
              value={wardrobeInput}
              onChange={(e) => setWardrobeInput(e.target.value)}
              placeholder="e.g. black suit, casual denim, editorial dress"
              className="w-full h-12 rounded-2xl px-4 text-sm text-white placeholder-[#44444f] outline-none transition-colors"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>
        </div>
      </section>

      {/* Generate CTA */}
      <section className="max-w-2xl mx-auto px-6 py-12 text-center">
        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/8 px-5 py-4 text-sm text-red-300">
            {errorMessage}
          </div>
        )}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="btn-primary w-full h-16 rounded-2xl text-lg font-semibold tracking-tight"
        >
          {step === 'idle' ? 'Upload a photo to generate' : 'Generate Image'}
        </button>
        {!uploadedImage && (
          <p className="mt-3 text-sm text-[#44444f]">
            Upload your photo above to get started
          </p>
        )}
        {uploadedImage && !user && (
          <p className="mt-3 text-sm text-[#8888a0]">
            <button
              onClick={() => {
                try {
                  sessionStorage.setItem('hfs_pending', JSON.stringify({
                    uploadedImage,
                    uploadedMimeType,
                    selectedStyle,
                    selectedPose,
                    locationInput,
                    wardrobeInput,
                  }));
                } catch { /* ignore */ }
                window.location.href = '/login';
              }}
              className="underline underline-offset-2 hover:text-white transition-colors"
            >Sign in</button> to generate your image
          </p>
        )}
      </section>

      {/* Loading + Result */}
      <section ref={resultRef} id="result-section">
        {step === 'generating' && <LoadingState />}
        {step === 'result' && generatedImage && (
          <ResultDisplay
            generatedImage={generatedImage}
            hasPremium={hasPremium}
            selectedStyle={selectedStyle}
            onRegenerate={handleRegenerate}
            onReset={handleReset}
            onUpgrade={() => setShowUpgradeModal(true)}
          />
        )}
      </section>

      {/* Footer nudge */}
      {step !== 'generating' && step !== 'result' && (
        <footer className="border-t border-[rgba(255,255,255,0.05)] mt-24 py-12 text-center">
          <p className="text-[#44444f] text-sm">
            Holiday Focus Studio · AI-Powered Visual Architect
          </p>
        </footer>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={handleUpgrade}
        />
      )}

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowLoginPrompt(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-8 border"
            style={{
              background: 'rgba(14,14,22,0.98)',
              borderColor: 'rgba(255,255,255,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
              >
                <svg width="24" height="24" viewBox="0 0 15 15" fill="none">
                  <path
                    d="M7.5 7a3 3 0 100-6 3 3 0 000 6zm-4.5 7a4.5 4.5 0 019 0"
                    stroke="white"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            <h2 className="text-white text-xl font-semibold text-center tracking-tight mb-2">
              Sign in to generate
            </h2>
            <p className="text-[#8888a0] text-sm text-center mb-7">
              Create a free account to start generating AI photos.
            </p>

            <button
              onClick={() => {
                // Save current selections so they survive the login redirect
                try {
                  if (uploadedImage) {
                    sessionStorage.setItem('hfs_pending', JSON.stringify({
                      uploadedImage,
                      uploadedMimeType,
                      selectedStyle,
                      selectedPose,
                      locationInput,
                      wardrobeInput,
                    }));
                  }
                } catch {
                  // sessionStorage full — proceed without saving
                }
                window.location.href = '/login';
              }}
              className="flex items-center justify-center gap-3 w-full h-12 rounded-2xl font-medium text-sm text-white transition-all"
              style={{
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              }}
            >
              {/* Google G */}
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => setShowLoginPrompt(false)}
              className="w-full mt-3 h-10 rounded-2xl text-sm text-[#8888a0] hover:text-white transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Mobile sticky CTA */}
      {canGenerate && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden px-4 pb-6 pt-3 bg-gradient-to-t from-[#07070d] via-[#07070d]/90 to-transparent">
          <button
            onClick={handleGenerate}
            className="btn-primary w-full h-14 rounded-2xl text-base font-semibold"
          >
            Generate Image
          </button>
        </div>
      )}
    </div>
  );
}
