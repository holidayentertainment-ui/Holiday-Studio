'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface SiteSettings {
  before_image_url: string | null;
  after_image_url: string | null;
  before_after_enabled: string | null;
}

/* ── Toast ── */
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div
      className="fixed top-5 right-5 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium shadow-2xl"
      style={{
        background: type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
        border: `1px solid ${type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
        color: type === 'success' ? '#34d399' : '#f87171',
        backdropFilter: 'blur(12px)',
      }}
    >
      {type === 'success' ? (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
          <path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
          <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      )}
      {msg}
    </div>
  );
}

function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className="animate-spin">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M7 1.5A5.5 5.5 0 0112.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ── Image Preview Card with upload + URL ── */
function ImagePreviewCard({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange(e.target?.result as string);
      setUploading(false);
    };
    reader.onerror = () => setUploading(false);
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // reset so same file can be re-selected
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      className="rounded-2xl p-5 border"
      style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      <p className="text-sm font-semibold text-white mb-1">{label}</p>
      <p className="text-xs text-[#8888a0] mb-4">{description}</p>

      {/* Preview / Drop Zone */}
      <div
        className="w-full h-44 rounded-xl mb-4 overflow-hidden flex items-center justify-center relative transition-colors cursor-pointer"
        style={{
          background: dragOver ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.04)',
          border: `1px ${dragOver ? 'dashed' : 'solid'} ${dragOver ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)'}`,
        }}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {uploading ? (
          <div className="text-center">
            <svg className="mx-auto mb-2 animate-spin text-indigo-400" width="22" height="22" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
              <path d="M7 1.5A5.5 5.5 0 0112.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="text-xs text-[#8888a0]">Processing…</p>
          </div>
        ) : value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={label}
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.55)' }}>
              <p className="text-xs font-medium text-white">Click to replace</p>
            </div>
          </>
        ) : (
          <div className="text-center pointer-events-none">
            <svg className="mx-auto mb-2 text-[#44444f]" width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="5" width="24" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="9" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2 19l6-5 4 4 4-3.5 8 6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <p className="text-xs text-[#8888a0]">Click or drag &amp; drop to upload</p>
            <p className="text-[10px] text-[#44444f] mt-1">JPG, PNG, WebP</p>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Upload button row */}
      <div className="flex items-center gap-2 mb-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.18)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M5.5 8V3M3 5.5l2.5-2.5 2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M1.5 9.5h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Upload File
        </button>
        {value && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#f87171' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
          >
            Remove
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <span className="text-[10px] text-[#44444f] uppercase tracking-wider">or paste URL</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* URL Input */}
      <input
        type="url"
        value={value.startsWith('data:') ? '' : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://example.com/image.jpg"
        className="w-full h-10 rounded-xl px-3 text-sm text-white placeholder-[#44444f] outline-none"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
      />
      {value.startsWith('data:') && (
        <p className="text-[10px] text-[#44444f] mt-1.5">Uploaded file — saved as base64</p>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>({
    before_image_url: null,
    after_image_url: null,
    before_after_enabled: 'false',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Local form state
  const [beforeUrl, setBeforeUrl] = useState('');
  const [afterUrl, setAfterUrl] = useState('');
  const [enabled, setEnabled] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      const s: SiteSettings = data.settings ?? {};
      setSettings(s);
      setBeforeUrl(s.before_image_url ?? '');
      setAfterUrl(s.after_image_url ?? '');
      setEnabled(s.before_after_enabled === 'true');
    } catch {
      showToast('Failed to load settings.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          before_image_url: beforeUrl.trim() || null,
          after_image_url: afterUrl.trim() || null,
          before_after_enabled: enabled ? 'true' : 'false',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed.');
      showToast('Settings saved successfully!');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">Site Settings</h1>
        <p className="text-sm text-[#8888a0] mt-1">
          Manage the before &amp; after showcase displayed on the main website.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-sm text-[#8888a0]">
          <Spinner size={16} /> Loading settings…
        </div>
      ) : (
        <div className="space-y-6">
          {/* Enable toggle */}
          <div
            className="flex items-center justify-between p-5 rounded-2xl border"
            style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <div>
              <p className="text-sm font-semibold text-white">Show Before &amp; After Section</p>
              <p className="text-xs text-[#8888a0] mt-0.5">
                When enabled, the comparison slider will appear on the main website.
              </p>
            </div>
            <button
              onClick={() => setEnabled((v) => !v)}
              className="relative w-11 h-6 rounded-full transition-colors shrink-0"
              style={{ background: enabled ? 'rgba(99,102,241,0.8)' : 'rgba(255,255,255,0.1)' }}
              aria-pressed={enabled}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                style={{ transform: enabled ? 'translateX(21px)' : 'translateX(2px)' }}
              />
            </button>
          </div>

          {/* Image inputs */}
          <div className="grid sm:grid-cols-2 gap-4">
            <ImagePreviewCard
              label="Before Image"
              description="The original / unedited photo (left side of slider)."
              value={beforeUrl}
              onChange={setBeforeUrl}
            />
            <ImagePreviewCard
              label="After Image"
              description="The AI-generated / edited result (right side of slider)."
              value={afterUrl}
              onChange={setAfterUrl}
            />
          </div>

          {/* Preview note */}
          {(beforeUrl || afterUrl) && (
            <div
              className="flex items-start gap-3 p-4 rounded-xl"
              style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)' }}
            >
              <svg className="shrink-0 mt-0.5 text-indigo-400" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
                <path d="M7 6v4M7 4.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <p className="text-xs text-[#8888a0]">
                Make sure both images are set and the section is enabled for the slider to appear on the website.
              </p>
            </div>
          )}

          {/* Save button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
            >
              {saving ? <Spinner size={14} /> : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7l3.5 3.5L12 3.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
