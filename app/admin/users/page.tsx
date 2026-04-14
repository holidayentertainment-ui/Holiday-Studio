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


function SkeletonRow() {
  return (
    <div className="grid items-center px-5 py-4" style={{ gridTemplateColumns: '1fr 150px 150px' }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full animate-pulse bg-[rgba(255,255,255,0.07)] shrink-0" />
        <div className="space-y-1.5">
          <div className="h-3.5 rounded-lg animate-pulse bg-[rgba(255,255,255,0.07)] w-36" />
          <div className="h-3 rounded-lg animate-pulse bg-[rgba(255,255,255,0.05)] w-48" />
        </div>
      </div>
      <div className="h-3 w-24 rounded animate-pulse bg-[rgba(255,255,255,0.05)]" />
      <div className="h-3 w-24 rounded animate-pulse bg-[rgba(255,255,255,0.05)]" />
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);


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
          style={{ gridTemplateColumns: '1fr 150px 150px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span>User</span>
          <span>Joined</span>
          <span>Last Sign In</span>
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
                gridTemplateColumns: '1fr 150px 150px',
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

              {/* Joined */}
              <div className="text-xs text-[#8888a0]">{formatDate(user.created_at)}</div>

              {/* Last seen */}
              <div className="text-xs text-[#44444f]">{formatDate(user.last_sign_in_at)}</div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
