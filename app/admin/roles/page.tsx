'use client';

import { useEffect, useState, useCallback } from 'react';

interface RoleEntry {
  id: string;
  email: string;
  role: 'admin' | 'team_member';
  is_active: boolean;
  created_at: string;
}

const ROLE_META = {
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

function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className="animate-spin">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M7 1.5A5.5 5.5 0 0112.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SkeletonRow() {
  return (
    <div className="grid items-center px-5 py-4" style={{ gridTemplateColumns: '1fr 140px 110px 90px' }}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full animate-pulse bg-[rgba(255,255,255,0.07)] shrink-0" />
        <div className="h-3.5 rounded-lg animate-pulse bg-[rgba(255,255,255,0.07)] w-44" />
      </div>
      <div className="h-6 w-24 rounded-full animate-pulse bg-[rgba(255,255,255,0.05)]" />
      <div className="h-6 w-16 rounded-full animate-pulse bg-[rgba(255,255,255,0.05)]" />
      <div className="flex justify-end gap-1.5">
        <div className="w-8 h-8 rounded-lg animate-pulse bg-[rgba(255,255,255,0.04)]" />
        <div className="w-8 h-8 rounded-lg animate-pulse bg-[rgba(255,255,255,0.04)]" />
      </div>
    </div>
  );
}

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<RoleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ email: '', role: 'team_member' });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<string>('team_member');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
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
      showToast('Access granted!');
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

  const handleToggleActive = async (entry: RoleEntry) => {
    setTogglingId(entry.id);
    try {
      const res = await fetch(`/api/admin/roles/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !entry.is_active }),
      });
      if (!res.ok) throw new Error('Failed to update.');
      showToast(entry.is_active ? 'Access suspended.' : 'Access restored.');
      loadRoles();
    } catch (e) {
      showToast((e as Error).message, 'error');
    } finally {
      setTogglingId(null);
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
  const activeCount = roles.filter((r) => r.is_active).length;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="max-w-3xl">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Roles</h1>
          <p className="text-sm text-[#8888a0] mt-1">
            Control who has access to the admin panel.
            {!loading && ` ${activeCount} of ${roles.length} active.`}
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
          Both <strong>Admin</strong> and <strong>Team Member</strong> roles have full panel access.
          Suspend a member to temporarily block their access without removing them.
        </p>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
      >
        {/* Table header */}
        <div
          className="grid items-center px-5 py-3 text-xs font-semibold uppercase tracking-widest text-[#8888a0] border-b"
          style={{ gridTemplateColumns: '1fr 140px 110px 90px', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <span>Email</span>
          <span>Role</span>
          <span>Access</span>
          <span className="text-right">Actions</span>
        </div>

        {/* Loading */}
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                <SkeletonRow />
              </div>
            ))
          : roles.length === 0
          ? (
            <div className="py-16 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="10" cy="8" r="4" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                  <path d="M3 20c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-[#8888a0] text-sm">No roles configured.</p>
              <p className="text-[#44444f] text-xs mt-1">Click "Add Member" to grant someone access.</p>
            </div>
          )
          : roles.map((entry, idx) => {
            const roleMeta = ROLE_META[entry.role];
            const isEditing = editingId === entry.id;

            return (
              <div
                key={entry.id}
                className="grid items-center px-5 py-4 transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                style={{
                  gridTemplateColumns: '1fr 140px 110px 90px',
                  borderBottom: idx < roles.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined,
                  opacity: entry.is_active ? 1 : 0.55,
                }}
              >
                {/* Email */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: roleMeta.bg, color: roleMeta.color }}
                  >
                    {entry.email[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{entry.email}</p>
                    <p className="text-xs text-[#44444f]">Added {formatDate(entry.created_at)}</p>
                  </div>
                </div>

                {/* Role — inline edit */}
                <div>
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="px-2 py-1.5 rounded-xl text-xs text-white outline-none cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                        autoFocus
                      >
                        <option value="admin">Admin</option>
                        <option value="team_member">Team Member</option>
                      </select>
                      <button
                        onClick={() => handleRoleChange(entry.id, editRole)}
                        className="px-2 py-1.5 rounded-xl text-xs font-semibold text-white"
                        style={{ background: 'rgba(99,102,241,0.7)' }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1.5 rounded-xl text-xs text-[#8888a0] hover:text-white"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingId(entry.id); setEditRole(entry.role); }}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors hover:opacity-75"
                      style={{ background: roleMeta.bg, color: roleMeta.color, border: `1px solid ${roleMeta.border}` }}
                      title="Click to change role"
                    >
                      {roleMeta.label}
                    </button>
                  )}
                </div>

                {/* Access toggle (active / suspended) */}
                <div>
                  <button
                    onClick={() => handleToggleActive(entry)}
                    disabled={togglingId === entry.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all disabled:opacity-60"
                    style={entry.is_active
                      ? { background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }
                      : { background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }
                    }
                    title={entry.is_active ? 'Click to suspend' : 'Click to restore'}
                  >
                    {togglingId === entry.id ? (
                      <Spinner size={10} />
                    ) : (
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: entry.is_active ? '#34d399' : '#f87171' }}
                      />
                    )}
                    {entry.is_active ? 'Active' : 'Suspended'}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => setDeleteConfirmId(entry.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8888a0] hover:text-red-400 hover:bg-[rgba(239,68,68,0.08)] transition-colors"
                    title="Remove access"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 3.5h10M5.5 3.5V2.5h3v1M4 3.5l.75 8h4.5L10 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        }
      </div>

      {/* ── Add Member Modal ────────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={() => !saving && setModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border overflow-hidden"
            style={{ background: 'rgba(12,12,20,0.99)', borderColor: 'rgba(255,255,255,0.1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <h2 className="text-base font-semibold text-white">Add Team Member</h2>
              <button
                onClick={() => !saving && setModalOpen(false)}
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
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <p className="text-xs text-[#44444f] mt-1.5">
                  Must match the email used to sign in with Google.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8888a0] uppercase tracking-widest mb-2">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['team_member', 'admin'] as const).map((r) => {
                    const meta = ROLE_META[r];
                    const selected = form.role === r;
                    return (
                      <button
                        key={r}
                        onClick={() => setForm((f) => ({ ...f, role: r }))}
                        className="px-4 py-3 rounded-xl text-sm font-medium text-left transition-all"
                        style={selected
                          ? { background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }
                          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8888a0' }
                        }
                      >
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <button
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="flex-1 h-11 rounded-2xl text-sm font-medium text-[#8888a0] hover:text-white transition-colors disabled:opacity-40"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={saving}
                className="flex-1 h-11 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
              >
                {saving && <Spinner size={14} />}
                {saving ? 'Adding…' : 'Grant Access'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Revoke Confirm Modal ────────────────────────────────────────────── */}
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
                <circle cx="8" cy="7" r="3" stroke="#f87171" strokeWidth="1.5" />
                <path d="M2 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M15 9.5l3 3M18 9.5l-3 3" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-white text-base font-semibold text-center mb-2">Remove Access?</h3>
            <p className="text-[#8888a0] text-sm text-center mb-2">
              <span className="text-white font-medium">{entryToDelete?.email}</span> will be permanently removed from the admin panel.
            </p>
            <p className="text-[#44444f] text-xs text-center mb-6">
              Tip: Use "Suspend" to temporarily block access instead.
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
                {deleting ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
