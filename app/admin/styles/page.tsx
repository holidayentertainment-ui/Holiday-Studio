'use client';

import { useEffect, useState, useCallback } from 'react';

interface Style {
  id: string;
  title: string;
  prompt: string;
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
  is_premium: false,
  is_active: true,
  sort_order: 0,
  thumbnail_url: '',
};

export default function AdminStylesPage() {
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
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
    setModalOpen(true);
  };

  const openEdit = (style: Style) => {
    setForm({
      title: style.title,
      prompt: style.prompt,
      is_premium: style.is_premium,
      is_active: style.is_active,
      sort_order: style.sort_order,
      thumbnail_url: style.thumbnail_url ?? '',
    });
    setModalMode('edit');
    setEditingId(style.id);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { showToast('Title is required.', 'error'); return; }
    setSaving(true);
    try {
      const url = modalMode === 'add'
        ? '/api/admin/styles'
        : `/api/admin/styles/${editingId}`;
      const method = modalMode === 'add' ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          sort_order: Number(form.sort_order),
          thumbnail_url: form.thumbnail_url || null,
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

  return (
    <div className="max-w-5xl">
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl text-sm font-medium shadow-xl"
          style={{
            background: toast.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: toast.type === 'success' ? '#34d399' : '#f87171',
          }}
        >
          {toast.msg}
        </div>
      )}

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
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-150 hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Add Style
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
        {/* Table header */}
        <div
          className="grid items-center px-5 py-3 text-xs font-semibold uppercase tracking-widest text-[#8888a0] border-b"
          style={{ gridTemplateColumns: '2fr 1fr 1fr 80px 80px', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <span>Title</span>
          <span>Tier</span>
          <span>Status</span>
          <span>Order</span>
          <span className="text-right">Actions</span>
        </div>

        {/* Rows */}
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <div className="h-4 rounded-lg animate-pulse bg-[rgba(255,255,255,0.06)] w-48" />
            </div>
          ))
        ) : styles.length === 0 ? (
          <div className="px-5 py-12 text-center text-[#8888a0] text-sm">
            No styles yet. Click "Add Style" to create your first one.
          </div>
        ) : (
          styles.map((style, idx) => (
            <div
              key={style.id}
              className="grid items-center px-5 py-4 transition-colors hover:bg-[rgba(255,255,255,0.02)]"
              style={{
                gridTemplateColumns: '2fr 1fr 1fr 80px 80px',
                borderBottom: idx < styles.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined,
              }}
            >
              {/* Title */}
              <div>
                <p className="text-sm font-medium text-white">{style.title}</p>
                <p className="text-xs text-[#8888a0] mt-0.5 line-clamp-1">
                  {style.prompt.slice(0, 60)}{style.prompt.length > 60 ? '…' : ''}
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

              {/* Status */}
              <div>
                <button
                  onClick={() => handleToggleActive(style)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors"
                  style={style.is_active
                    ? { background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }
                    : { background: 'rgba(255,255,255,0.06)', color: '#8888a0', border: '1px solid rgba(255,255,255,0.1)' }
                  }
                  title={style.is_active ? 'Click to hide' : 'Click to activate'}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: style.is_active ? '#34d399' : '#8888a0' }}
                  />
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
        )}
      </div>

      {/* ── Add / Edit Modal ───────────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border overflow-hidden"
            style={{ background: 'rgba(12,12,20,0.99)', borderColor: 'rgba(255,255,255,0.1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <h2 className="text-base font-semibold text-white">
                {modalMode === 'add' ? 'Add New Style' : 'Edit Style'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-[#8888a0] hover:text-white hover:bg-[rgba(255,255,255,0.07)] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-[#8888a0] uppercase tracking-widest mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Professional Headshot"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#44444f] outline-none transition-colors focus:border-indigo-500/50"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              {/* Prompt */}
              <div>
                <label className="block text-xs font-semibold text-[#8888a0] uppercase tracking-widest mb-2">
                  Prompt
                </label>
                <textarea
                  value={form.prompt}
                  onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
                  placeholder="Enter the AI prompt for this style…"
                  rows={7}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#44444f] outline-none transition-colors focus:border-indigo-500/50 resize-y font-mono"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              {/* Row: Tier + Status + Sort order */}
              <div className="grid grid-cols-3 gap-3">
                {/* Tier */}
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

                {/* Status */}
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

                {/* Sort order */}
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

              {/* Thumbnail URL */}
              <div>
                <label className="block text-xs font-semibold text-[#8888a0] uppercase tracking-widest mb-2">
                  Thumbnail URL <span className="normal-case text-[#44444f]">(optional)</span>
                </label>
                <input
                  type="url"
                  value={form.thumbnail_url}
                  onChange={(e) => setForm((f) => ({ ...f, thumbnail_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#44444f] outline-none transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 h-11 rounded-2xl text-sm font-medium text-[#8888a0] hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-11 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
              >
                {saving ? 'Saving…' : modalMode === 'add' ? 'Create Style' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ───────────────────────────────────────── */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={() => setDeleteConfirmId(null)}
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
              <span className="text-white font-medium">"{styleToDelete?.title}"</span> will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 h-10 rounded-2xl text-sm font-medium text-[#8888a0] hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 h-10 rounded-2xl text-sm font-semibold transition-colors disabled:opacity-50"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
