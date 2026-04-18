'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────

interface WeeklyPoint {
  label: string;
  count: number;
}

interface AdminStats {
  totalUsers: number;
  todayUsers: number;
  totalSubscribed: number;
  todaySubscriptions: number;
  weeklyUsers: WeeklyPoint[];
  weeklySubscriptions: WeeklyPoint[];
}

interface StyleStats {
  totalStyles: number;
  activeStyles: number;
  premiumStyles: number;
  totalRoles: number;
}

// ── Inline bar chart ──────────────────────────────────────────────────────

function BarChart({
  data,
  color,
  label,
}: {
  data: WeeklyPoint[];
  color: string;
  label: string;
}) {
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const chartH = 80;
  const barW = 28;
  const gap = 10;
  const totalW = data.length * (barW + gap) - gap;

  return (
    <div
      className="rounded-2xl p-5 border"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(255,255,255,0.07)',
      }}
    >
      <p className="text-xs font-semibold text-[#8888a0] uppercase tracking-widest mb-4">
        {label}
      </p>

      {/* SVG chart */}
      <div className="overflow-x-auto">
        <svg
          width={totalW}
          height={chartH + 24}
          className="block mx-auto"
          style={{ minWidth: '100%' }}
          viewBox={`0 0 ${totalW} ${chartH + 24}`}
        >
          {data.map((d, i) => {
            const barH = maxVal === 0 ? 2 : Math.max(2, (d.count / maxVal) * chartH);
            const x = i * (barW + gap);
            const y = chartH - barH;

            return (
              <g key={d.label}>
                {/* Bar background track */}
                <rect
                  x={x}
                  y={0}
                  width={barW}
                  height={chartH}
                  rx={6}
                  fill="rgba(255,255,255,0.04)"
                />
                {/* Filled bar */}
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={6}
                  fill={color}
                  opacity={0.85}
                />
                {/* Count above bar */}
                {d.count > 0 && (
                  <text
                    x={x + barW / 2}
                    y={y - 4}
                    textAnchor="middle"
                    fontSize="9"
                    fill="rgba(255,255,255,0.6)"
                    fontFamily="inherit"
                  >
                    {d.count}
                  </text>
                )}
                {/* Day label below */}
                <text
                  x={x + barW / 2}
                  y={chartH + 16}
                  textAnchor="middle"
                  fontSize="9"
                  fill="rgba(255,255,255,0.35)"
                  fontFamily="inherit"
                >
                  {d.label.split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Day labels row */}
      <div
        className="grid mt-1"
        style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}
      >
        {data.map((d) => (
          <span
            key={d.label}
            className="text-center text-[9px] text-[rgba(255,255,255,0.25)]"
          >
            {d.label.split(' ')[1]}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
  loading,
  href,
}: {
  label: string;
  value: number | undefined;
  sub: string;
  color: string;
  icon: React.ReactNode;
  loading: boolean;
  href?: string;
}) {
  const inner = (
    <div
      className="rounded-2xl p-5 border h-full transition-all duration-200 hover:border-[rgba(255,255,255,0.12)] group"
      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-105"
        style={{ background: `${color}1a`, color }}
      >
        {icon}
      </div>
      <div className="text-3xl font-bold text-white mb-1">
        {loading ? (
          <div className="h-8 w-12 rounded-lg animate-pulse bg-[rgba(255,255,255,0.08)]" />
        ) : (
          (value ?? '—')
        )}
      </div>
      <div className="text-sm font-medium text-[#f0f0f8]">{label}</div>
      <div className="text-xs text-[#8888a0] mt-0.5">{sub}</div>
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [styleStats, setStyleStats] = useState<StyleStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then((r) => r.json()),
      fetch('/api/admin/styles').then((r) => r.json()),
      fetch('/api/admin/roles').then((r) => r.json()),
    ])
      .then(([statsData, stylesData, rolesData]) => {
        setStats(statsData);
        const styles = stylesData.styles ?? [];
        setStyleStats({
          totalStyles: styles.length,
          activeStyles: styles.filter((s: { is_active: boolean }) => s.is_active).length,
          premiumStyles: styles.filter((s: { is_premium: boolean }) => s.is_premium).length,
          totalRoles: (rolesData.roles ?? []).length,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-sm text-[#8888a0] mt-1">
          Overview of your Holiday Focus Studio.
        </p>
      </div>

      {/* ── Section: Users ──────────────────────────────────────────────── */}
      <div className="mb-2">
        <h2 className="text-xs font-semibold text-[#8888a0] uppercase tracking-widest mb-4">
          Users
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Users"
            value={stats?.totalUsers}
            sub="all time"
            color="#6366f1"
            loading={loading}
            href="/admin/users"
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M2 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M14 10a3 3 0 010-6M17 17c0-2.485-1.343-4.5-3-5.196" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            }
          />
          <StatCard
            label="New Today"
            value={stats?.todayUsers}
            sub="signed up today"
            color="#8b5cf6"
            loading={loading}
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M2 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M14 8v4M12 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            }
          />
          <StatCard
            label="Subscribed"
            value={stats?.totalSubscribed}
            sub="paying users"
            color="#f59e0b"
            loading={loading}
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2l2.5 5H18l-4.5 3.5 1.5 5.5L10 13l-5 3 1.5-5.5L2 7h5.5L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            }
          />
          <StatCard
            label="Sales Today"
            value={stats?.todaySubscriptions}
            sub="purchases today"
            color="#10b981"
            loading={loading}
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M2 5h16M2 5a1 1 0 00-1 1v9a1 1 0 001 1h16a1 1 0 001-1V6a1 1 0 00-1-1M2 5V4a2 2 0 012-2h12a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M7 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            }
          />
        </div>

        {/* Weekly charts */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {loading ? (
            <>
              <div className="rounded-2xl h-44 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
              <div className="rounded-2xl h-44 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            </>
          ) : (
            <>
              <BarChart
                data={stats?.weeklyUsers ?? []}
                color="#6366f1"
                label="New Users — Last 7 Days"
              />
              <BarChart
                data={stats?.weeklySubscriptions ?? []}
                color="#f59e0b"
                label="New Subscriptions — Last 7 Days"
              />
            </>
          )}
        </div>
      </div>

      {/* ── Section: Content ─────────────────────────────────────────────── */}
      <h2 className="text-xs font-semibold text-[#8888a0] uppercase tracking-widest mb-4">
        Content
      </h2>
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <StatCard
          label="Total Styles"
          value={styleStats?.totalStyles}
          sub={`${styleStats?.activeStyles ?? 0} active`}
          color="#6366f1"
          loading={loading}
          href="/admin/styles"
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2.5L12.5 7.5H17L13.5 11L15 16L10 13.5L5 16L6.5 11L3 7.5H7.5L10 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          }
        />
        <StatCard
          label="Premium Styles"
          value={styleStats?.premiumStyles}
          sub={`${(styleStats?.totalStyles ?? 0) - (styleStats?.premiumStyles ?? 0)} free`}
          color="#f59e0b"
          loading={loading}
          href="/admin/styles"
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2l2.5 5H18l-4.5 3.5 1.5 5.5L10 13l-5 3 1.5-5.5L2 7h5.5L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          }
        />
        <StatCard
          label="Team Members"
          value={styleStats?.totalRoles}
          sub="with admin access"
          color="#10b981"
          loading={loading}
          href="/admin/roles"
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M15 9l1.5 1.5L19 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
      </div>

      {/* ── Quick actions ─────────────────────────────────────────────────── */}
      <h2 className="text-xs font-semibold text-[#8888a0] uppercase tracking-widest mb-4">
        Quick Actions
      </h2>
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
          href="/admin/users"
          className="flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 hover:border-[rgba(99,102,241,0.3)] hover:bg-[rgba(99,102,241,0.05)] group"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M1.5 13c0-2.485 2.015-4.5 4.5-4.5S10.5 10.515 10.5 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M12 7l1.5 1.5L16 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-white">View All Users</p>
            <p className="text-xs text-[#8888a0]">Browse and manage user accounts</p>
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

        <Link
          href="/admin/settings"
          className="flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 hover:border-[rgba(245,158,11,0.3)] hover:bg-[rgba(245,158,11,0.05)] group"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Site Settings</p>
            <p className="text-xs text-[#8888a0]">Configure hero images and settings</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
