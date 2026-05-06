'use client';

import { useQuery } from '@tanstack/react-query';
import { Bell, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { useAuthStore } from '../../lib/hooks/useAuth';
import { supabase } from '../../lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuthStore();

  // Realtime deliveries matching user preferences
  const { data: deliveries = [] } = useQuery({
    queryKey: ['deliveries'],
    queryFn: async () => {
      const { data } = await supabase
        .from('deliveries')
        .select('*')
        .eq('status', 'available')
        .order('available_at', { ascending: false })
        .limit(20);
      return data ?? [];
    },
    refetchInterval: 15_000,
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      const [notifResult, subResult] = await Promise.all([
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('subscriptions').select('*').eq('user_id', user!.id).single(),
      ]);
      return { notifications: notifResult.count ?? 0, subscription: subResult.data };
    },
    enabled: !!user?.id,
  });

  const sub = stats?.subscription;
  const trialDaysLeft = sub?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(sub.trial_ends_at).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
          {user?.full_name?.split(' ')[0]}!
        </h1>
        <p className="text-[rgb(var(--muted))] mt-1">Here&apos;s what&apos;s available right now.</p>
      </div>

      {/* Trial banner */}
      {sub?.status === 'trial' && trialDaysLeft !== null && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-brand-50 to-purple-50 border border-brand-100 dark:from-brand-950 dark:to-purple-950 dark:border-brand-800 p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-brand-700 dark:text-brand-300">
              {trialDaysLeft} days left in your free trial
            </p>
            <p className="text-sm text-brand-600/70 dark:text-brand-400">Upgrade to keep receiving alerts after your trial ends.</p>
          </div>
          <a href="/dashboard/billing" className="btn-primary text-sm py-2">Upgrade Now</a>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Live Blocks', value: deliveries.length, icon: Bell, color: 'text-brand-600' },
          { label: 'Alerts Received', value: stats?.notifications ?? 0, icon: TrendingUp, color: 'text-green-600' },
          { label: 'Amazon Flex', value: deliveries.filter(d => d.platform === 'amazon_flex').length, icon: DollarSign, color: 'text-orange-600' },
          { label: 'DoorDash', value: deliveries.filter(d => d.platform === 'doordash').length, icon: Clock, color: 'text-red-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[rgb(var(--muted))]">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-3xl font-bold text-[rgb(var(--fg))]">{value}</p>
          </div>
        ))}
      </div>

      {/* Live deliveries */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[rgb(var(--fg))]">Live Available Blocks</h2>
          <span className="flex items-center gap-1.5 text-xs text-green-600">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            Real-time
          </span>
        </div>

        {deliveries.length === 0 ? (
          <div className="card text-center py-12">
            <Bell className="w-8 h-8 text-[rgb(var(--muted))] mx-auto mb-3" />
            <p className="font-medium text-[rgb(var(--fg))]">No blocks available right now</p>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">We&apos;ll notify you the moment one appears.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deliveries.map((d) => (
              <div key={d.id} className="card flex items-center gap-4 hover:border-brand-200 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
                  d.platform === 'amazon_flex' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                }`}>
                  {d.platform === 'amazon_flex' ? '📦' : '🍕'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{d.title}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{d.delivery_zone} • {d.estimated_duration_min ?? '?'} min</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-green-600">${d.price}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">
                    {formatDistanceToNow(new Date(d.available_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
