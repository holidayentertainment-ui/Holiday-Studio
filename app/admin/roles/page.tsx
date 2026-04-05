'use client';

import { useEffect, useState, useCallback } from 'react';

interface RoleEntry {
  id: string;
  email: string;
  role: 'admin' | 'team_member';
  created_at: string;
}

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  admin: {
    label: 'Admin',
    color: '#818cf8',
    bg: 'rgba(99,102,241,0.12)',
    border: 'rgba(99,102,241,0.25)',
  },
  team_member: {
    label: 'Team Member',
    color: '#34d399',
    bg: 'rgba(16,185,129,0.1)',
    border: 'rgba(16,185,129,0.2)',
  },
};

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<RoleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ email: '', role: 'team_member' });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<string>('team_member');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/roles');
      const data = await res.json();
      setRoles(data.roles ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  const handleAdd = async () => {
    if (!form.email.trim()) { showToast('Email is required.', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to add role.');
      showToast('Role assigned!');
      setModalOpen(false);
      setForm({ email: '', role: 'team_member' });
      loadRoles();
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/roles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error('Failed to update role.');
      showToast('Role updated!');
      setEditingId(null);
      loadRoles();
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/roles/${deleteConfirmId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to revoke access.');
      showToast('Access revoked.');
      setDeleteConfirmId(null);
      loadRoles();
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const entryToDelete = roles.find((r) => r.id === deleteConfirmId);

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="max-w-3xl">
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
          <h1 className="text-2xl font-bold tracking-tight text-white">Roles</h1>
          <p className="text-sm text-[#8888a0] mt-1">
            Control who has access to the admin panel.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Add Member
        </button>
      </div>

      {/* Info banner */}
      <div
        className="flex items-start gap-3 px-4 py-3.5 rounded-2xl mb-6 text-sm"
        style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0" style={{ color: '#818cf8' }}>
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M8 7v4M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <p className="text-[#a5b4fc]">
          Both <strong>Admin</strong> and <strong>Team Member</strong> roles have full access to this panel.
          The Admin role is the account owner.
        </p>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
        {/* Table header */}
        <div
          className="grid items-center px-5 py-3 text-xs font-semibold uppercase tracking-widest text-[#8888a0] border-b"
          style={{ gridTemplateColumns: '1fr auto 100px 80px', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <span>Email</span>
          <span>Role</span>
          <span>Added</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <div className="h-4 rounded-lg animate-pulse bg-[rgba(255,255,255,0.06)] w-56" />
            </div>
          ))
        ) : roles.length === 0 ? (
          <div className="px-5 py-12 text-center text-[#8888a0] text-sm">
            No roles configured. Click "Add Member" to grant access.
          </div>
        ) : (
          roles.map((entry, idx) => {
            const style = ROLE_LABELS[entry.role];
            const isEditing = editingId === entry.id;

            return (
              <div
                key={entry.id}
                className="grid items-center px-5 py-4 transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                style={{
                  gridTemplateColumns: '1fr auto 100px 80px',
                  borderBottom: idx < roles.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined,
                }}
              >
                {/* Email */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: style.bg, color: style.color }}
                  >
                    {entry.email[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-white truncate">{entry.email}</span>
                </div>

                {/* Role — inline edit */}
                <div className="px-4">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="px-3 py-1.5 rounded-xl text-sm text-white outline-none cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                        autoFocus
                      >
                        <option value="admin">Admin</option>
                        <option value="team_member">Team Member</option>
                      </select>
                      <button
                        onClick={() => handleRoleChange(entry.id, editRole)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-colors hover:opacity-90"
                        style={{ background: 'rgba(99,102,241,0.8)' }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 rounded-xl text-xs text-[#8888a0] hover:text-white transition-colors"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingId(entry.id); setEditRole(entry.role); }}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors hover:opacity-80"
                      style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
                      title="Click to change role"
                    >
                      {style.label}
                    </button>
                  )}
                </div>

                {/* Date */}
                <div className="text-xs text-[#8888a0]">{formatDate(entry.created_at)}</div>

                {/* Actions */}
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => setDeleteConfirmId(entry.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8888a0] hover:text-red-400 hover:bg-[rgba(239,68,68,0.08)] transition-colors"
                    title="Revoke access"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 3.5h10M5.5 3.5V2.5h3v1M4 3.5l.75 8h4.5L10 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Add Member Modal ──────────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border overflow-hidden"
            style={{ background: 'rgba(12,12,20,0.99)', borderColor: 'rgba(255,255,255,0.1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <h2 className="text-base font-semibold text-white">Add Team Member</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-[#8888a0] hover:text-white hover:bg-[rgba(255,255,255,0.07)] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8888a0] uppercase tracking-widest mb-2">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="team@example.com"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#44444f] outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <p className="text-xs text-[#44444f] mt-1.5">
                  Must match the email they use to sign in with Google.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8888a0] uppercase tracking-widest mb-2">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['team_member', 'admin'] as const).map((r) => {
                    const s = ROLE_LABELS[r];
                    const selected = form.role === r;
                    return (
                      <button
                        key={r}
                        onClick={() => setForm((f) => ({ ...f, role: r }))}
                        className="px-4 py-3 rounded-xl text-sm font-medium text-left transition-all"
                        style={selected
                          ? { background: s.bg, border: `1px solid ${s.border}`, color: s.color }
                          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8888a0' }
                        }
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 h-11 rounded-2xl text-sm font-medium text-[#8888a0] hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={saving}
                className="flex-1 h-11 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
              >
                {saving ? 'Adding…' : 'Grant Access'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Revoke Confirm Modal ──────────────────────────────────────── */}
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
                <circle cx="8" cy="7" r="3" stroke="#f87171" strokeWidth="1.5" />
                <path d="M2 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M15 9.5l3 3M18 9.5l-3 3" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-white text-base font-semibold text-center mb-2">Revoke Access?</h3>
            <p className="text-[#8888a0] text-sm text-center mb-6">
              <span className="text-white font-medium">{entryToDelete?.email}</span> will lose access to the admin panel immediately.
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
                {deleting ? 'Revoking…' : 'Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
