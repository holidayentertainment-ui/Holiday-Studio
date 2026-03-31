'use client';

import { useRef, useState, useCallback, DragEvent } from 'react';

// ── Format support ────────────────────────────────────────────────────────
// image/* covers JPG, PNG, WebP, AVIF, GIF, BMP natively in browsers.
// HEIC/HEIF and others need explicit extensions since MIME is rarely registered.
const ACCEPT =
  'image/*,.heic,.heif,.tiff,.tif,.bmp,.avif,.webp,.jfif,.jpe';

// Formats that require heic2any before canvas can render them
const HEIC_TYPES = ['image/heic', 'image/heif'];
const HEIC_EXTS  = /\.(heic|heif)$/i;

// Formats the browser canvas can render without conversion
const CANVAS_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/avif',
  'image/gif',  'image/bmp', 'image/tiff', 'image/x-tiff',
  'image/jfif', '',           // '' = unknown MIME, try anyway
];

// Max output dimension to keep memory/API payload sane
const MAX_PX = 3840;

// ── Conversion helpers ────────────────────────────────────────────────────

/** Convert a Blob to a JPEG data-URL via canvas (handles most browser formats) */
function blobToJpegDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      let { naturalWidth: w, naturalHeight: h } = img;
      if (w > MAX_PX || h > MAX_PX) {
        const r = Math.min(MAX_PX / w, MAX_PX / h);
        w = Math.round(w * r);
        h = Math.round(h * r);
      }
      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas unavailable')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image failed to load')); };
    img.src = url;
  });
}

/** Build a File object from a JPEG data-URL */
function dataUrlToFile(dataUrl: string, originalName: string): File {
  const base64 = dataUrl.split(',')[1];
  const bytes   = atob(base64);
  const buf     = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
  const stem = originalName.replace(/\.[^.]+$/, '') || 'photo';
  return new File([buf], `${stem}.jpg`, { type: 'image/jpeg' });
}

/**
 * Master converter — normalises ANY image format to JPEG.
 * Pipeline:
 *   HEIC/HEIF  → heic2any (browser lib) → canvas → JPEG
 *   Everything else                      → canvas → JPEG
 */
async function normaliseToJpeg(
  file: File,
): Promise<{ dataUrl: string; file: File }> {
  const isHeic =
    HEIC_TYPES.includes(file.type) || HEIC_EXTS.test(file.name);

  let blob: Blob = file;

  if (isHeic) {
    // Dynamic import keeps heic2any out of the server bundle (browser-only lib)
    const heic2any = (await import('heic2any')).default;
    const result   = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
    blob = Array.isArray(result) ? result[0] : result;
  }

  const dataUrl = await blobToJpegDataUrl(blob);
  return { dataUrl, file: dataUrlToFile(dataUrl, file.name) };
}

// ── Component ─────────────────────────────────────────────────────────────

interface UploadAreaProps {
  id?: string;
  uploadedImage: string | null;
  onImageUpload: (dataUrl: string, file: File) => void;
}

type ConvertState = 'idle' | 'converting' | 'error';

const FORMAT_BADGES = ['JPG · PNG · WebP', 'HEIC · HEIF', 'AVIF · TIFF · BMP'];

export default function UploadArea({ id, uploadedImage, onImageUpload }: UploadAreaProps) {
  const [isDragging,    setIsDragging]    = useState(false);
  const [convertState,  setConvertState]  = useState<ConvertState>('idle');
  const [convertLabel,  setConvertLabel]  = useState('');
  const [errorMsg,      setErrorMsg]      = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      setErrorMsg('');

      // Reject anything that's clearly not an image (e.g. PDF, video)
      const looksLikeImage =
        file.type.startsWith('image/') ||
        HEIC_EXTS.test(file.name)      ||
        CANVAS_TYPES.includes(file.type);

      if (!looksLikeImage) {
        setErrorMsg(`"${file.name}" doesn't appear to be an image file.`);
        return;
      }

      try {
        setConvertState('converting');

        const isHeic = HEIC_TYPES.includes(file.type) || HEIC_EXTS.test(file.name);
        setConvertLabel(isHeic ? 'Converting HEIC → JPEG…' : 'Preparing image…');

        const { dataUrl, file: converted } = await normaliseToJpeg(file);

        setConvertState('idle');
        onImageUpload(dataUrl, converted);
      } catch (err) {
        setConvertState('error');
        const msg = err instanceof Error ? err.message : 'Conversion failed';
        setErrorMsg(`Could not process "${file.name}": ${msg}`);
      }
    },
    [onImageUpload],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleDragOver  = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset value so the same file can be re-selected after a replace
    e.target.value = '';
    if (file) processFile(file);
  };

  return (
    <section id={id} className="max-w-4xl mx-auto px-6 section-spacing">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
        >
          1
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Upload Your Photo</h2>
          <p className="text-sm text-[#8888a0] mt-0.5">
            Upload a clear photo — face should be fully visible
          </p>
        </div>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-2xl border border-red-500/20 bg-red-500/8 text-sm text-red-300">
          <span className="mt-0.5 shrink-0">⚠</span>
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="ml-auto shrink-0 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {!uploadedImage ? (
        /* ── Drop zone ── */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !convertState.startsWith('conv') && inputRef.current?.click()}
          className={`relative group rounded-3xl border-2 border-dashed transition-all duration-200 ${
            convertState === 'converting'
              ? 'border-indigo-500/40 bg-indigo-500/5 cursor-wait'
              : isDragging
              ? 'drop-active cursor-copy'
              : 'border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.035)] cursor-pointer'
          }`}
          style={{ minHeight: 280 }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex flex-col items-center justify-center gap-5 py-20 px-6 text-center">
            {convertState === 'converting' ? (
              /* Converting state */
              <>
                <div className="relative w-16 h-16">
                  {/* Spinner */}
                  <div
                    className="absolute inset-0 rounded-full animate-spin-slow"
                    style={{
                      background:
                        'conic-gradient(from 0deg, rgba(99,102,241,0.9) 0deg, transparent 260deg)',
                      WebkitMaskImage: 'radial-gradient(transparent 52%, black 53%)',
                      maskImage: 'radial-gradient(transparent 52%, black 53%)',
                    }}
                  />
                  <div
                    className="absolute inset-3 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-indigo-300">
                      <path d="M9 3v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 3"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-base font-semibold text-white">{convertLabel}</p>
                  <p className="text-sm text-[#8888a0] mt-1">Processing your photo…</p>
                </div>
              </>
            ) : (
              /* Idle / drag state */
              <>
                {/* Upload icon */}
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                    isDragging ? 'scale-110' : 'group-hover:scale-105'
                  }`}
                  style={{
                    background: isDragging ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <svg
                    width="28" height="28" viewBox="0 0 28 28" fill="none"
                    className={isDragging ? 'text-indigo-300' : 'text-[#8888a0]'}
                  >
                    <path d="M14 6v12M8 10l6-6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 22h20"             stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                  </svg>
                </div>

                <div>
                  <p className="text-base font-semibold text-white">
                    {isDragging ? 'Drop your image here' : 'Drag & drop your photo'}
                  </p>
                  <p className="text-sm text-[#8888a0] mt-1.5">
                    or{' '}
                    <span className="text-indigo-400 font-medium group-hover:text-indigo-300 transition-colors">
                      click to browse
                    </span>
                    {' '}· up to 50 MB
                  </p>
                </div>

                {/* Supported format badges */}
                <div className="flex flex-wrap justify-center gap-2 mt-1">
                  {FORMAT_BADGES.map((f) => (
                    <span
                      key={f}
                      className="px-3 py-1 rounded-full text-xs text-[#8888a0] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)]"
                    >
                      {f}
                    </span>
                  ))}
                </div>

                {/* Tip pills */}
                <div className="flex flex-wrap justify-center gap-2">
                  {['Clear face visible', 'Good lighting', 'High resolution'].map((tip) => (
                    <span
                      key={tip}
                      className="px-3 py-1 rounded-full text-xs text-[#8888a0] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)]"
                    >
                      ✓ {tip}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* ── Preview panel ── */
        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Image */}
          <div
            className="relative rounded-3xl overflow-hidden"
            style={{ aspectRatio: '3/4', boxShadow: '0 4px 40px rgba(0,0,0,0.5)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={uploadedImage} alt="Uploaded reference" className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-medium text-emerald-300">Photo ready</span>
              </div>
            </div>
          </div>

          {/* Info + actions */}
          <div className="flex flex-col gap-4">
            <div
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <h3 className="font-semibold text-base mb-1">Photo uploaded ✓</h3>
              <p className="text-sm text-[#8888a0]">
                Your reference image is locked in. Choose a style below and hit Generate.
              </p>
            </div>

            {/* AI checks */}
            <div
              className="rounded-2xl p-5 space-y-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="text-xs font-semibold text-[#8888a0] uppercase tracking-widest mb-3">AI Analysis</div>
              {[
                { label: 'Face detected',        ok: true },
                { label: 'Lighting adequate',    ok: true },
                { label: 'Resolution sufficient', ok: true },
              ].map((check) => (
                <div key={check.label} className="flex items-center gap-3 text-sm">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      check.ok ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                    }`}
                  >
                    {check.ok ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : '✕'}
                  </div>
                  <span className={check.ok ? 'text-white/80' : 'text-red-300'}>{check.label}</span>
                </div>
              ))}
            </div>

            {/* Replace */}
            <button
              onClick={() => inputRef.current?.click()}
              className="btn-ghost h-11 rounded-xl text-sm font-medium"
            >
              <svg className="inline mr-2 -mt-0.5" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7a6 6 0 1012 0A6 6 0 001 7zm6-3v3l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              Replace photo
            </button>
            <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={handleFileChange} />
          </div>
        </div>
      )}
    </section>
  );
}
