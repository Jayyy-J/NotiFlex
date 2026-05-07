'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../../../lib/hooks/useAuth';
import { Users, DollarSign, TrendingUp, Bell, Download, BarChart3 } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
  const { user, accessToken } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user && !['admin_owner', 'admin_super'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const { data: metrics } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => api.get('/api/admin/metrics').then(r => r.data.data),
    refetchInterval: 60_000,
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/api/admin/users?limit=10').then(r => r.data),
  });

  const { data: invoices } = useQuery({
    queryKey: ['admin-invoices'],
    queryFn: () => api.get('/api/admin/invoices').then(r => r.data),
  });

  const isSuper = user?.role === 'admin_super';

  const handleExport = async () => {
    const res = await api.get('/api/admin/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `flexnotify-export-${Date.now()}.json`;
    a.click();
  };

  const statCards = [
    { label: 'Total Users', value: metrics?.total_users ?? '—', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Subscribers', value: metrics?.active_users ?? '—', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Trial Users', value: metrics?.trial_users ?? '—', icon: Bell, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Monthly Revenue', value: metrics ? `$${Number(metrics.monthly_revenue).toFixed(2)}` : '—', icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Annual Revenue', value: metrics ? `$${Number(metrics.annual_revenue).toFixed(2)}` : '—', icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Est. Next Month', value: metrics ? `$${Number(metrics.estimated_next_month).toFixed(2)}` : '—', icon: BarChart3, color: 'text-pink-600', bg: 'bg-pink-50' },
    { label: 'Conversion Rate', value: metrics ? `${metrics.conversion_rate}%` : '—', icon: TrendingUp, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Notifs Today', value: metrics?.notifications_sent_today ?? '—', icon: Bell, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-[rgb(var(--muted))] text-sm mt-1">
            {isSuper ? 'Super Admin' : 'Owner'} view
          </p>
        </div>
        {isSuper && (
          <button onClick={handleExport} className="btn-primary gap-2">
            <Download className="w-4 h-4" />
            Export Database
          </button>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[rgb(var(--muted))]">{label}</span>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="card">
          <h2 className="font-semibold mb-4">Recent Users</h2>
          <div className="space-y-3">
            {usersData?.data?.map((u: any) => (
              <div key={u.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0">
                  {u.full_name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.full_name}</p>
                  <p className="text-xs text-[rgb(var(--muted))] truncate">{u.email}</p>
                </div>
                <span className={`badge ${
                  u.subscriptions?.status === 'active' ? 'badge-green' :
                  u.subscriptions?.status === 'trial' ? 'badge-blue' : 'badge-yellow'
                }`}>
                  {u.subscriptions?.status ?? 'free'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent invoices */}
        <div className="card">
          <h2 className="font-semibold mb-4">Recent Invoices</h2>
          <div className="space-y-3">
            {invoices?.data?.slice(0, 8).map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{inv.users?.full_name ?? 'User'}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{new Date(inv.issued_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">${Number(inv.amount).toFixed(2)}</p>
                  <span className={`badge ${inv.status === 'paid' ? 'badge-green' : 'badge-yellow'}`}>
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
