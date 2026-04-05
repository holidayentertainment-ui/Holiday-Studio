'use client';

import { useEffect, useState, useCallback } from 'react';

interface Style {
  id: string;
  title: string;
  prompt: string;
  icon: string;
  blurb: string;
  mood: string;
  is_premium: boolean;
  is_active: boolean;
  sort_order: number;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

type ModalMode = 'add' | 'edit';

const emptyForm = {
  title: '',
  prompt: '',
  icon: '🖼️',
  blurb: '',
  mood: '',
  is_premium: false,
  is_active: true,
  sort_order: 0,
  thumbnail_url: '',
};

/* ── Toast ── */
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div
      className="fixed top-5 right-5 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium shadow-2xl animate-fade-up"
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

/* ── Row Skeleton ── */
function SkeletonRow() {
  return (
    <div
      className="grid items-center px-5 py-4"
      style={{ gridTemplateColumns: '56px 2fr 1fr 1fr 80px 96px' }}
    >
      <div className="w-9 h-9 rounded-xl animate-pulse bg-[rgba(255,255,255,0.06)]" />
      <div className="space-y-1.5 pr-6">
        <div className="h-3.5 rounded-lg animate-pulse bg-[rgba(255,255,255,0.07)] w-36" />
        <div className="h-2.5 rounded-lg animate-pulse bg-[rgba(255,255,255,0.04)] w-52" />
      </div>
      <div className="h-6 w-16 rounded-full animate-pulse bg-[rgba(255,255,255,0.05)]" />
      <div className="h-6 w-16 rounded-full animate-pulse bg-[rgba(255,255,255,0.05)]" />
      <div className="h-3 w-6 rounded animate-pulse bg-[rgba(255,255,255,0.04)]" />
      <div className="flex justify-end gap-1.5">
        <div className="w-8 h-8 rounded-lg animate-pulse bg-[rgba(255,255,255,0.04)]" />
        <div className="w-8 h-8 rounded-lg animate-pulse bg-[rgba(255,255,255,0.04)]" />
      </div>
    </div>
  );
}

/* ── Inline save spinner ── */
function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      className="animate-spin"
    >
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M7 1.5A5.5 5.5 0 0112.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function AdminStylesPage() {
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [imagePreviewError, setImagePreviewError] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadStyles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/styles');
      const data = await res.json();
      setStyles(data.styles ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStyles(); }, [loadStyles]);

  const openAdd = () => {
    setForm({ ...emptyForm, sort_order: styles.length + 1 });
    setModalMode('add');
    setEditingId(null);
    setImagePreviewError(false);
    setModalOpen(true);
  };

  const openEdit = (style: Style) => {
    setForm({
      title: style.title,
      prompt: style.prompt,
      icon: style.icon || '🖼️',
      blurb: style.blurb || '',
      mood: style.mood || '',
      is_premium: style.is_premium,
      is_active: style.is_active,
      sort_order: style.sort_order,
      thumbnail_url: style.thumbnail_url ?? '',
    });
    setModalMode('edit');
    setEditingId(style.id);
    setImagePreviewError(false);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { showToast('Title is required.', 'error'); return; }
    setSaving(true);
    try {
      const url = modalMode === 'add' ? '/api/admin/styles' : `/api/admin/styles/${editingId}`;
      const method = modalMode === 'add' ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          sort_order: Number(form.sort_order),
          thumbnail_url: form.thumbnail_url?.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to save.');

      showToast(modalMode === 'add' ? 'Style created!' : 'Style updated!');
      setModalOpen(false);
      loadStyles();
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (style: Style) => {
    setTogglingId(style.id);
    try {
      await fetch(`/api/admin/styles/${style.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !style.is_active }),
      });
      showToast(style.is_active ? 'Style hidden.' : 'Style activated.');
      loadStyles();
    } catch {
      showToast('Failed to update.', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/styles/${deleteConfirmId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete.');
      showToast('Style deleted.');
      setDeleteConfirmId(null);
      loadStyles();
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const styleToDelete = styles.find((s) => s.id === deleteConfirmId);

  const previewUrl = form.thumbnail_url?.trim();
  const showPreview = Boolean(previewUrl) && !imagePreviewError;

  return (
    <div className="max-w-5xl">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Styles</h1>
          <p className="text-sm text-[#8888a0] mt-1">
            Manage photography styles, prompts, and tier access.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Add Style
        </button>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
      >
        {/* Header row */}
        <div
          className="grid items-center px-5 py-3 text-xs font-semibold uppercase tracking-widest text-[#8888a0] border-b"
          style={{ gridTemplateColumns: '56px 2fr 1fr 1fr 80px 96px', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <span>Image</span>
          <span>Title</span>
          <span>Tier</span>
          <span>Status</span>
          <span>Order</span>
          <span className="text-right">Actions</span>
        </div>

        {/* Loading */}
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                <SkeletonRow />
              </div>
            ))
          : styles.length === 0
          ? (
            <div className="py-16 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5l2.5 5H19l-4.5 3.5 1.5 5.5L12 16.5 7.5 19l1.5-5.5L4.5 10H9.5L12 5Z" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-[#8888a0] text-sm">No styles yet.</p>
              <p className="text-[#44444f] text-xs mt-1">Click "Add Style" to create your first one.</p>
            </div>
          )
          : styles.map((style, idx) => (
            <div
              key={style.id}
              className="grid items-center px-5 py-4 transition-colors hover:bg-[rgba(255,255,255,0.02)]"
              style={{
                gridTemplateColumns: '56px 2fr 1fr 1fr 80px 96px',
                borderBottom: idx < styles.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined,
              }}
            >
              {/* Thumbnail */}
              <div>
                {style.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={style.thumbnail_url}
                    alt={style.title}
                    className="w-9 h-9 rounded-xl object-cover border border-[rgba(255,255,255,0.08)]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg border"
                    style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.07)' }}
                  >
                    {style.icon || '🖼️'}
                  </div>
                )}
              </div>

              {/* Title + blurb */}
              <div className="pr-4 min-w-0">
                <p className="text-sm font-medium text-white truncate">{style.title}</p>
                <p className="text-xs text-[#8888a0] mt-0.5 truncate">
                  {style.blurb || (style.prompt.slice(0, 55) + (style.prompt.length > 55 ? '…' : ''))}
                </p>
              </div>

              {/* Tier */}
              <div>
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={style.is_premium
                    ? { background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }
                    : { background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }
                  }
                >
                  {style.is_premium ? '★ Premium' : 'Free'}
                </span>
              </div>

              {/* Status toggle */}
              <div>
                <button
                  onClick={() => handleToggleActive(style)}
                  disabled={togglingId === style.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all disabled:opacity-60"
                  style={style.is_active
                    ? { background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }
                    : { background: 'rgba(255,255,255,0.06)', color: '#8888a0', border: '1px solid rgba(255,255,255,0.1)' }
                  }
                  title={style.is_active ? 'Click to hide' : 'Click to activate'}
                >
                  {togglingId === style.id ? (
                    <Spinner size={10} />
                  ) : (
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: style.is_active ? '#34d399' : '#8888a0' }}
                    />
                  )}
                  {style.is_active ? 'Active' : 'Hidden'}
                </button>
              </div>

              {/* Sort order */}
              <div className="text-sm text-[#8888a0] font-mono">{style.sort_order}</div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1.5">
                <button
                  onClick={() => openEdit(style)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8888a0] hover:text-white hover:bg-[rgba(255,255,255,0.07)] transition-colors"
                  title="Edit"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  onClick={() => setDeleteConfirmId(style.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8888a0] hover:text-red-400 hover:bg-[rgba(239,68,68,0.08)] transition-colors"
                  title="Delete"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 3.5h10M5.5 3.5V2.5h3v1M4 3.5l.75 8h4.5L10 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        }
      </div>

      {/* ── Add / Edit Modal ──────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={() => !saving && setModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border overflow-hidden flex flex-col"
            style={{
              background: 'rgba(12,12,20,0.99)',
              borderColor: 'rgba(255,255,255,0.1)',
              maxHeight: '90vh',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <h2 className="text-base font-semibold text-white">
                {modalMode === 'add' ? 'Add New Style' : `Edit — ${form.title || 'Style'}`}
              </h2>
              <button
                onClick={() => !saving && setModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-[#8888a0] hover:text-white hover:bg-[rgba(255,255,255,0.07)] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Form body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* ── Image section ──────────────────────────────────────── */}
              <div>
                <label className="block text-xs font-semibold text-[#8888a0] uppercase tracking-widest mb-2">
                  Style Image
                </label>
                <div className="flex gap-3 items-start">
                  {/* Preview box */}
                  <div
                    className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border flex items-center justify-center text-3xl"
                    style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}
                  >
                    {showPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt="preview"
                        className="w-full h-full object-cover"
                        onError={() => setImagePreviewError(true)}
                        onLoad={() => setImagePreviewError(false)}
                      />
                    ) : (
                      <span>{form.icon || '🖼️'}</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="url"
                      value={form.thumbnail_url}
                      onChange={(e) => {
                        setImagePreviewError(false);
                        setForm((f) => ({ ...f, thumbnail_url: e.target.value }));
                      }}
                      placeholder="https://… (paste image URL)"
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#44444f] outline-none transition-colors"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    {previewUrl && imagePreviewError && (
                      <p className="text-xs text-red-400/80">⚠ Could not load image from this URL.</p>
                    )}
                    {showPreview && (
                      <p className="text-xs text-emerald-400/70">✓ Image loaded successfully.</p>
                    )}
                    <p className="text-xs text-[#44444f]">
                      Paste a direct image URL. Leave empty to show the emoji icon below.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Title + Icon row ───────────────────────────────────── */}
              <div className="grid grid-cols-[1fr_100px] gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8888a0] uppercase tracking-widest mb-2">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Professional Headshot"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#44444f] outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8888a0] uppercase tracking-widest mb-2">
                    Icon
                  </label>
                  <input
                    type="text"
                    value={form.icon}
                    onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                    placeholder="🖼️"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white text-center outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '1.2rem' }}
                  />
                </div>
              </div>

              {/* ── Blurb ─────────────────────────────────────────────── */}
              <div>
                <label className="block text-xs font-semibold text-[#8888a0] uppercase tracking-widest mb-2">
                  Short Description
                </label>
                <input
                  type="text"
                  value={form.blurb}
                  onChange={(e) => setForm((f) => ({ ...f, blurb: e.target.value }))}
                  placeholder="e.g. Clean, studio-quality portrait with neutral background."
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#44444f] outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              {/* ── Mood tags ─────────────────────────────────────────── */}
              <div>
                <label className="block text-xs font-semibold text-[#8888a0] uppercase tracking-widest mb-2">
                  Mood Tags
                </label>
                <input
                  type="text"
                  value={form.mood}
                  onChange={(e) => setForm((f) => ({ ...f, mood: e.target.value }))}
                  placeholder="e.g. Corporate · LinkedIn · Clean"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#44444f] outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <p className="text-xs text-[#44444f] mt-1.5">Separate tags with " · " (space dot space)</p>
              </div>

              {/* ── Prompt ────────────────────────────────────────────── */}
              <div>
                <label className="block text-xs font-semibold text-[#8888a0] uppercase tracking-widest mb-2">
                  AI Prompt
                </label>
                <textarea
                  value={form.prompt}
                  onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
                  placeholder="Enter the complete AI generation prompt for this style…"
                  rows={7}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#44444f] outline-none resize-y font-mono"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <p className="text-xs text-[#44444f] mt-1.5">
                  This is sent directly to the AI. Negative constraints are automatically appended.
                </p>
              </div>

              {/* ── Tier / Status / Order row ─────────────────────────── */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8888a0] uppercase tracking-widest mb-2">Tier</label>
                  <select
                    value={form.is_premium ? 'premium' : 'free'}
                    onChange={(e) => setForm((f) => ({ ...f, is_premium: e.target.value === 'premium' }))}
                    className="w-full px-3 py-3 rounded-xl text-sm text-white outline-none cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8888a0] uppercase tracking-widest mb-2">Status</label>
                  <select
                    value={form.is_active ? 'active' : 'hidden'}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value === 'active' }))}
                    className="w-full px-3 py-3 rounded-xl text-sm text-white outline-none cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <option value="active">Active</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8888a0] uppercase tracking-widest mb-2">Sort Order</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                    min={0}
                    className="w-full px-3 py-3 rounded-xl text-sm text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-5 border-t shrink-0" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <button
                onClick={() => !saving && setModalOpen(false)}
                disabled={saving}
                className="flex-1 h-11 rounded-2xl text-sm font-medium text-[#8888a0] hover:text-white transition-colors disabled:opacity-40"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-11 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
              >
                {saving && <Spinner size={14} />}
                {saving ? 'Saving…' : modalMode === 'add' ? 'Create Style' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ──────────────────────────────────────────── */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={() => !deleting && setDeleteConfirmId(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 border"
            style={{ background: 'rgba(12,12,20,0.99)', borderColor: 'rgba(255,255,255,0.1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 7v5M10 14.5v.5M3 17L10 3l7 14H3z" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-white text-base font-semibold text-center mb-2">Delete Style?</h3>
            <p className="text-[#8888a0] text-sm text-center mb-6">
              <span className="text-white font-medium">"{styleToDelete?.title}"</span> will be permanently deleted and removed from the website.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleting}
                className="flex-1 h-10 rounded-2xl text-sm font-medium text-[#8888a0] hover:text-white transition-colors disabled:opacity-40"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 h-10 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
              >
                {deleting && <Spinner size={13} />}
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
