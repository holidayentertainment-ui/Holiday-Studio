'use client';

import { useEffect, useState, useCallback } from 'react';

interface UserEntry {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  created_at: string;
  last_sign_in_at: string | null;
  total_credits: number;
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

function SkeletonRow() {
  return (
    <div className="grid items-center px-5 py-4" style={{ gridTemplateColumns: '1fr 100px 120px 130px' }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full animate-pulse bg-[rgba(255,255,255,0.07)] shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3.5 rounded-lg animate-pulse bg-[rgba(255,255,255,0.07)] w-36" />
          <div className="h-3 rounded-lg animate-pulse bg-[rgba(255,255,255,0.05)] w-48" />
        </div>
      </div>
      <div className="h-5 w-14 rounded-full animate-pulse bg-[rgba(255,255,255,0.05)]" />
      <div className="h-3 w-24 rounded animate-pulse bg-[rgba(255,255,255,0.05)]" />
      <div className="h-8 w-28 rounded-xl animate-pulse bg-[rgba(255,255,255,0.05)]" />
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Credit modal state
  const [creditModal, setCreditModal] = useState<{ open: boolean; user: UserEntry | null }>({ open: false, user: null });
  const [creditAmount, setCreditAmount] = useState('1');
  const [creditNote, setCreditNote] = useState('');
  const [saving, setSaving] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch {
      showToast('Failed to load users.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const openCreditModal = (user: UserEntry) => {
    setCreditModal({ open: true, user });
    setCreditAmount('1');
    setCreditNote('');
  };

  const closeCreditModal = () => {
    setCreditModal({ open: false, user: null });
  };

  const handleGiveCredit = async () => {
    if (!creditModal.user) return;
    const amount = parseInt(creditAmount, 10);
    if (isNaN(amount) || amount < 1) {
      showToast('Enter a valid credit amount.', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${creditModal.user.id}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credits: amount,
          note: creditNote,
          userEmail: creditModal.user.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to give credits.');
      showToast(`${amount} credit${amount > 1 ? 's' : ''} given to ${creditModal.user.email}!`);
      closeCreditModal();
      // Refresh users to show updated credit count
      loadUsers();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to give credits.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.name.toLowerCase().includes(search.toLowerCase()),
  );

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="max-w-5xl">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Users</h1>
          <p className="text-sm text-[#8888a0] mt-1">
            View registered users and give free credits.
          </p>
        </div>
        <div className="text-sm text-[#8888a0] px-4 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {loading ? '…' : `${users.length} user${users.length !== 1 ? 's' : ''}`}
        </div>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#44444f]" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full h-10 pl-9 pr-4 rounded-xl text-sm text-white placeholder-[#44444f] outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
        {/* Table header */}
        <div
          className="grid px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#8888a0]"
          style={{ gridTemplateColumns: '1fr 100px 130px 130px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span>User</span>
          <span>Credits</span>
          <span>Joined</span>
          <span></span>
        </div>

        {loading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-[#44444f] text-sm">
            {search ? 'No users match your search.' : 'No users found.'}
          </div>
        ) : (
          filteredUsers.map((user, idx) => (
            <div
              key={user.id}
              className="grid items-center px-5 py-4 transition-colors hover:bg-[rgba(255,255,255,0.02)]"
              style={{
                gridTemplateColumns: '1fr 100px 130px 130px',
                borderTop: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
              }}
            >
              {/* Avatar + info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-[rgba(255,255,255,0.1)]">
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-sm font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
                    >
                      {(user.email[0] ?? 'U').toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  {user.name && (
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  )}
                  <p className={`text-xs text-[#8888a0] truncate ${!user.name ? 'text-sm text-white' : ''}`}>
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Credits */}
              <div>
                {user.total_credits > 0 ? (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                      <path d="M5 1l.9 2.8H9L6.5 5.5l.9 2.8L5 6.5l-2.4 1.8.9-2.8L1 3.8h3.1L5 1z" />
                    </svg>
                    {user.total_credits}
                  </span>
                ) : (
                  <span className="text-xs text-[#44444f]">0</span>
                )}
              </div>

              {/* Joined */}
              <div className="text-xs text-[#8888a0]">{formatDate(user.created_at)}</div>

              {/* Action */}
              <div>
                <button
                  onClick={() => openCreditModal(user)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    color: '#818cf8',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(99,102,241,0.18)';
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)';
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  Give Credit
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Credit Modal */}
      {creditModal.open && creditModal.user && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={closeCreditModal}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-7 border"
            style={{ background: 'rgba(14,14,22,0.98)', borderColor: 'rgba(255,255,255,0.1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M11 2l2.5 6H20l-5.5 4 2 6.5L11 15l-5.5 3.5 2-6.5L2 8h6.5L11 2z" stroke="white" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <h2 className="text-white text-lg font-semibold text-center tracking-tight mb-1">Give Free Credits</h2>
            <p className="text-[#8888a0] text-sm text-center mb-6 truncate px-2">{creditModal.user.email}</p>

            {/* Amount */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-[#8888a0] mb-2">Number of Credits</label>
              <input
                type="number"
                min="1"
                max="100"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                className="w-full h-11 rounded-xl px-4 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>

            {/* Note */}
            <div className="mb-6">
              <label className="block text-xs font-medium text-[#8888a0] mb-2">Note <span className="text-[#44444f]">(optional)</span></label>
              <input
                type="text"
                value={creditNote}
                onChange={(e) => setCreditNote(e.target.value)}
                placeholder="e.g. Welcome bonus, Referral reward…"
                className="w-full h-11 rounded-xl px-4 text-sm text-white placeholder-[#44444f] outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeCreditModal}
                className="flex-1 h-11 rounded-2xl text-sm font-medium text-[#8888a0] hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleGiveCredit}
                disabled={saving}
                className="flex-1 h-11 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
              >
                {saving ? <Spinner size={16} /> : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 2v10M2 7h10" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                    Give Credit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
