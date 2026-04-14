'use client';

interface HeroProps {
  onUploadClick: () => void;
  beforeImageUrl?: string | null;
  afterImageUrl?: string | null;
}

const CARD_STYLES = [
  { name: 'Professional Headshot', label: 'Before', fallbackBg: 'linear-gradient(160deg, #1a1a2e 0%, #2d1b4e 50%, #1a2a3a 100%)' },
  { name: 'High Fashion Editorial', label: 'After',  fallbackBg: 'linear-gradient(160deg, #0d1117 0%, #1a0a2e 40%, #2a1040 100%)' },
];

const STATS = [
  { value: '10K+', label: 'Images Generated' },
  { value: '4.9★', label: 'Average Rating' },
  { value: '<30s', label: 'Generation Time' },
];

export default function Hero({ onUploadClick, beforeImageUrl, afterImageUrl }: HeroProps) {
  const cardImages = [beforeImageUrl, afterImageUrl];
  return (
    <section className="relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.14) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-6 pt-20 pb-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <div className="max-w-xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(99,102,241,0.25)] bg-[rgba(99,102,241,0.08)] text-sm text-indigo-300 mb-7 animate-fade-up">
              <span
                className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse-ring"
                style={{ boxShadow: '0 0 8px rgba(99,102,241,0.8)' }}
              />
              AI-powered visual architect
            </div>

            {/* Headline */}
            <h1
              className="text-5xl md:text-6xl font-bold leading-[1.06] tracking-[-0.03em] animate-fade-up"
              style={{ animationDelay: '0.1s', animationFillMode: 'both', opacity: 0 }}
            >
              Generate
              <br />
              <span className="gradient-text">Studio-Quality</span>
              <br />
              Images in Seconds
            </h1>

            <p
              className="mt-6 text-lg text-[#8888a0] leading-relaxed animate-fade-up"
              style={{ animationDelay: '0.2s', animationFillMode: 'both', opacity: 0 }}
            >
              Upload one photo. Get professional headshots, editorial portraits,
              and high-fashion campaign visuals — powered by AI.
            </p>

            {/* CTA row */}
            <div
              className="mt-10 flex flex-wrap gap-3 animate-fade-up"
              style={{ animationDelay: '0.3s', animationFillMode: 'both', opacity: 0 }}
            >
              <button
                onClick={onUploadClick}
                className="btn-primary h-13 px-7 py-3.5 rounded-xl text-base font-semibold"
              >
                Upload Image
                <svg
                  className="inline ml-2 -mt-0.5"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M8 3v10M3 8l5-5 5 5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Stats row */}
            <div
              className="mt-10 flex items-center gap-8 animate-fade-up"
              style={{ animationDelay: '0.4s', animationFillMode: 'both', opacity: 0 }}
            >
              {STATS.map((stat, i) => (
                <div key={i}>
                  <div className="text-xl font-bold tracking-tight">{stat.value}</div>
                  <div className="text-xs text-[#8888a0] mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Before/After visual */}
          <div
            className="relative animate-fade-up"
            style={{ animationDelay: '0.25s', animationFillMode: 'both', opacity: 0 }}
          >
            {/* Glow behind cards */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(99,102,241,0.12) 0%, transparent 70%)',
              }}
            />

            <div className="grid grid-cols-2 gap-4 relative z-10">
              {CARD_STYLES.map((card, i) => {
                const imgUrl = cardImages[i];
                return (
                  <div
                    key={i}
                    className="relative rounded-3xl overflow-hidden"
                    style={{
                      background: imgUrl ? 'transparent' : card.fallbackBg,
                      aspectRatio: '3/4',
                      boxShadow: '0 4px 32px rgba(0,0,0,0.6)',
                    }}
                  >
                    {/* Actual image (when set in admin) */}
                    {imgUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imgUrl}
                        alt={card.label}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      /* Fallback silhouette placeholder */
                      <svg
                        viewBox="0 0 200 280"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="absolute inset-0 w-full h-full opacity-25"
                      >
                        <ellipse cx="100" cy="80" rx="40" ry="48" fill="rgba(255,255,255,0.7)" />
                        <path
                          d="M40 220 Q60 150 100 140 Q140 150 160 220"
                          fill="rgba(255,255,255,0.5)"
                        />
                      </svg>
                    )}

                    {/* Gradient overlay for readability */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)',
                      }}
                    />

                    {/* Style name — top */}
                    <div className="absolute top-3 left-3 right-3">
                      <div className="inline-block px-2.5 py-1 rounded-full text-[11px] font-medium bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.12)] backdrop-blur-sm text-white/70">
                        {card.name}
                      </div>
                    </div>

                    {/* Before / After label — bottom */}
                    <div className="absolute bottom-3 left-3">
                      <span
                        className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-white"
                        style={{
                          background: i === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(99,102,241,0.7)',
                          backdropFilter: 'blur(6px)',
                        }}
                      >
                        {card.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Arrow between cards */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 4px 20px rgba(99,102,241,0.5)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M3 7h8M8 4l3 3-3 3"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Trust badge */}
            <div className="mt-4 flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] text-xs text-[#8888a0]">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M6 1l1.35 2.74L10.5 4.26l-2.25 2.19.53 3.09L6 8.04l-2.78 1.5.53-3.09L1.5 4.26l3.15-.52L6 1z"
                    fill="rgba(99,102,241,0.7)"
                  />
                </svg>
                Identity-locked · Realistic anatomy · Professional quality
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
