'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  totalStyles: number;
  activeStyles: number;
  premiumStyles: number;
  totalRoles: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/styles').then((r) => r.json()),
      fetch('/api/admin/roles').then((r) => r.json()),
    ]).then(([stylesData, rolesData]) => {
      const styles = stylesData.styles ?? [];
      setStats({
        totalStyles: styles.length,
        activeStyles: styles.filter((s: { is_active: boolean }) => s.is_active).length,
        premiumStyles: styles.filter((s: { is_premium: boolean }) => s.is_premium).length,
        totalRoles: (rolesData.roles ?? []).length,
      });
    }).finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: 'Total Styles',
      value: stats?.totalStyles,
      sub: `${stats?.activeStyles ?? 0} active`,
      color: '#6366f1',
      href: '/admin/styles',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2.5L12.5 7.5H17L13.5 11L15 16L10 13.5L5 16L6.5 11L3 7.5H7.5L10 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: 'Premium Styles',
      value: stats?.premiumStyles,
      sub: `${(stats?.totalStyles ?? 0) - (stats?.premiumStyles ?? 0)} free`,
      color: '#f59e0b',
      href: '/admin/styles',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2l2.5 5H18l-4.5 3.5 1.5 5.5L10 13l-5 3 1.5-5.5L2 7h5.5L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: 'Team Members',
      value: stats?.totalRoles,
      sub: 'with admin access',
      color: '#10b981',
      href: '/admin/roles',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M2 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M15 9l1.5 1.5L19 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-sm text-[#8888a0] mt-1">Overview of your Holiday Focus Studio admin panel.</p>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl p-5 border transition-all duration-200 hover:border-[rgba(255,255,255,0.12)] group"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-105"
              style={{ background: `${card.color}1a`, color: card.color }}
            >
              {card.icon}
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {loading ? (
                <div className="h-8 w-10 rounded-lg animate-pulse bg-[rgba(255,255,255,0.08)]" />
              ) : (
                card.value ?? '—'
              )}
            </div>
            <div className="text-sm font-medium text-[#f0f0f8]">{card.label}</div>
            <div className="text-xs text-[#8888a0] mt-0.5">{card.sub}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-[#8888a0] uppercase tracking-widest mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link
            href="/admin/styles"
            className="flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 hover:border-[rgba(99,102,241,0.3)] hover:bg-[rgba(99,102,241,0.05)] group"
            style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Add New Style</p>
              <p className="text-xs text-[#8888a0]">Create a new photography style</p>
            </div>
          </Link>

          <Link
            href="/admin/roles"
            className="flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 hover:border-[rgba(16,185,129,0.3)] hover:bg-[rgba(16,185,129,0.05)] group"
            style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M1.5 13c0-2.485 2.015-4.5 4.5-4.5S10.5 10.515 10.5 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M12 7l1.5 1.5L16 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Manage Roles</p>
              <p className="text-xs text-[#8888a0]">Add or remove team access</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
