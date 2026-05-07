'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../../../lib/hooks/useAuth';
import { Users, DollarSign, TrendingUp, Bell, Download, BarChart3, UserCheck, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const { user, accessToken } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user && !['admin_owner', 'admin_super'].includes((user as any).role)) router.push('/dashboard');
  }, [user, router]);

  const isSuper = (user as any)?.role === 'admin_super';

  const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const { data: metrics } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => api.get('/api/admin/metrics').then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/api/admin/users?limit=10').then(r => r.data),
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['admin-invoices'],
    queryFn: () => api.get('/api/admin/invoices').then(r => r.data),
  });

  // Export as Excel (CSV) using browser
  const exportCSV = (data: any[], filename: string) => {
    if (!data?.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map(row => keys.map(k => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  // Export JSON for super admin
  const exportJSON = async () => {
    const res = await api.get('/api/admin/export', { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a'); a.href = url; a.download = `flexnotify-export-${Date.now()}.json`; a.click();
  };

  const statCards = [
    { label: 'Total Users', value: metrics?.total_users ?? '—', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Subscribers', value: metrics?.active_users ?? '—', icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Trial Users', value: metrics?.trial_users ?? '—', icon: Bell, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Churned / Expired', value: (metrics?.total_users && metrics?.active_users) ? (metrics.total_users - metrics.active_users - (metrics.trial_users ?? 0)) : '—', icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Monthly Revenue', value: metrics ? `$${Number(metrics.monthly_revenue).toFixed(2)}` : '—', icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Annual Revenue', value: metrics ? `$${Number(metrics.annual_revenue).toFixed(2)}` : '—', icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Est. Next Month', value: metrics ? `$${Number(metrics.estimated_next_month).toFixed(2)}` : '—', icon: BarChart3, color: 'text-pink-600', bg: 'bg-pink-50' },
    { label: 'Conversion Rate', value: metrics ? `${metrics.conversion_rate}%` : '—', icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Churn Rate', value: metrics ? `${metrics.churn_rate}%` : '—', icon: XCircle, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Notifs Today', value: metrics?.notifications_sent_today ?? '—', icon: Bell, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">{isSuper ? '🔐 Super Admin' : '👑 Owner'} view</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => exportCSV(usersData?.data ?? [], 'users.csv')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium hover:bg-slate-50">
            <Download className="w-4 h-4" /> Export Users CSV
          </button>
          <button onClick={() => exportCSV(invoicesData?.data ?? [], 'invoices.csv')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium hover:bg-slate-50">
            <Download className="w-4 h-4" /> Export Invoices CSV
          </button>
          {isSuper && (
            <button onClick={exportJSON}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
              <Download className="w-4 h-4" /> Full DB Export
            </button>
          )}
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 leading-tight">{label}</span>
              <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
            </div>
            <p className="text-xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Revenue summary */}
      {metrics && (
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <p className="text-sm font-medium text-blue-100 mb-3">Revenue Overview</p>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-2xl font-bold">${Number(metrics.monthly_revenue).toFixed(2)}</p>
              <p className="text-blue-200 text-sm">This month</p>
            </div>
            <div>
              <p className="text-2xl font-bold">${Number(metrics.estimated_next_month).toFixed(2)}</p>
              <p className="text-blue-200 text-sm">Est. next month</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.conversion_rate}%</p>
              <p className="text-blue-200 text-sm">Conversion rate</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Recent Users</h2>
            <button onClick={() => exportCSV(usersData?.data ?? [], 'users.csv')}
              className="text-xs text-blue-600 hover:underline font-medium">Export CSV</button>
          </div>
          <div className="space-y-3">
            {usersData?.data?.map((u: any) => (
              <div key={u.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                  {u.full_name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-slate-900">{u.full_name}</p>
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  u.subscriptions?.status === 'active' ? 'bg-green-100 text-green-700' :
                  u.subscriptions?.status === 'trial' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {u.subscriptions?.status ?? 'free'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent invoices */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Recent Invoices</h2>
            <button onClick={() => exportCSV(invoicesData?.data ?? [], 'invoices.csv')}
              className="text-xs text-blue-600 hover:underline font-medium">Export CSV</button>
          </div>
          <div className="space-y-3">
            {invoicesData?.data?.slice(0, 8).map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{inv.users?.full_name ?? 'User'}</p>
                  <p className="text-xs text-slate-500">{new Date(inv.issued_at).toLocaleDateString()} • {inv.provider}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">${Number(inv.amount).toFixed(2)}</p>
                  <span className={`text-xs font-medium ${inv.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
