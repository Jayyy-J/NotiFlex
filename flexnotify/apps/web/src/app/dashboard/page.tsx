'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, TrendingUp, DollarSign, Package, Truck, Settings, ArrowRight, ExternalLink, Zap } from 'lucide-react';
import { useAuthStore } from '../../lib/hooks/useAuth';
import { supabase } from '../../lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

function getDeliveryLink(delivery: any): string {
  if (delivery.platform === 'amazon_flex') return 'https://flex.amazon.com/offers';
  if (delivery.platform === 'doordash') return 'https://www.doordash.com/dasher/signup';
  return '#';
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  const sub = (user as any)?.subscriptions;
  const prefs = (user as any)?.user_preferences;
  const trialDaysLeft = sub?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(sub.trial_ends_at).getTime() - Date.now()) / 86400000))
    : null;

  const { data: deliveries = [], isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['live-deliveries'],
    queryFn: async () => {
      const { data } = await supabase
        .from('deliveries').select('*')
        .eq('status', 'available')
        .order('available_at', { ascending: false })
        .limit(30);
      return data ?? [];
    },
    refetchInterval: 10_000,
  });

  useEffect(() => {
    if (!deliveries.length) return;
    const ids = new Set<string>(deliveries.slice(0, 3).map((d: any) => d.id));
    setNewIds(ids);
    const t = setTimeout(() => setNewIds(new Set()), 4000);
    return () => clearTimeout(t);
  }, [dataUpdatedAt]);

  useEffect(() => {
    const ch = supabase.channel('deliveries-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'deliveries' }, (payload) => {
        setNewIds(prev => new Set([...prev, payload.new.id]));
        setTimeout(() => setNewIds(prev => { const n = new Set(prev); n.delete(payload.new.id); return n; }), 4000);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const { data: notifCount = 0 } = useQuery({
    queryKey: ['notif-count', (user as any)?.id],
    queryFn: async () => {
      const { count } = await supabase.from('notifications')
        .select('id', { count: 'exact', head: true }).eq('user_id', (user as any).id);
      return count ?? 0;
    },
    enabled: !!(user as any)?.id,
  });

  const amazonList = deliveries.filter((d: any) => d.platform === 'amazon_flex');
  const doordashList = deliveries.filter((d: any) => d.platform === 'doordash');
  const topEarning = [...deliveries].sort((a: any, b: any) => b.price - a.price)[0];
  const needsSetup = !prefs?.zones?.length;

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'},{' '}
          {(user as any)?.full_name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Live blocks — refreshes every 10 seconds.</p>
      </div>

      {sub?.status === 'trial' && trialDaysLeft !== null && (
        <div className="mb-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">{trialDaysLeft === 0 ? '⚠️ Trial expires today!' : `🎁 ${trialDaysLeft} days left in your free trial`}</p>
            <p className="text-blue-100 text-sm mt-0.5">Upgrade to keep receiving alerts.</p>
          </div>
          <Link href="/dashboard/billing" className="bg-white text-blue-600 rounded-xl px-4 py-2 text-sm font-bold hover:bg-blue-50 flex-shrink-0 ml-4">Upgrade →</Link>
        </div>
      )}

      {needsSetup && (
        <div className="mb-5 rounded-2xl border-2 border-dashed border-blue-200 p-4 flex items-center justify-between bg-blue-50">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-semibold text-slate-900 text-sm">Complete your setup</p>
              <p className="text-slate-500 text-xs">Add zones and price filters for personalized alerts.</p>
            </div>
          </div>
          <Link href="/dashboard/settings" className="flex items-center gap-1 text-sm text-blue-600 font-bold hover:underline flex-shrink-0 ml-4">
            Set up <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Live Blocks', value: deliveries.length, icon: Bell, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Alerts Received', value: notifCount, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Amazon Flex', value: amazonList.length, icon: Package, color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'DoorDash', value: doordashList.length, icon: Truck, color: 'text-red-500', bg: 'bg-red-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">{label}</span>
              <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {topEarning && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-green-700 uppercase tracking-wider">💰 Top Earning Block</p>
            <p className="font-semibold text-slate-900 text-sm truncate">{topEarning.title}</p>
            <p className="text-xs text-slate-500">{topEarning.delivery_zone}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xl font-bold text-green-600">${topEarning.price}</p>
            <a href={getDeliveryLink(topEarning)} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-green-700 font-semibold hover:underline mt-1">
              Grab it <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Live Blocks</h2>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs text-green-600 font-medium">Real-time</span>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)}</div>
        ) : deliveries.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-600">No blocks available right now</p>
            <p className="text-sm text-slate-400 mt-1">We&apos;ll notify you the moment one appears.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {deliveries.map((d: any) => {
              const isNew = newIds.has(d.id);
              const isAmazon = d.platform === 'amazon_flex';
              return (
                <div key={d.id} className={`relative flex items-center gap-4 rounded-2xl border p-4 transition-all duration-500 ${
                  isNew ? 'border-green-300 bg-green-50 shadow-md' : 'border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm'
                }`}>
                  <div className={`w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center ${isAmazon ? 'bg-orange-50' : 'bg-red-50'}`}>
                    {isAmazon ? <Package className="w-5 h-5 text-orange-500" /> : <Truck className="w-5 h-5 text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-slate-900 truncate">{d.title}</p>
                      {isNew && (
                        <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex-shrink-0">
                          <Zap className="w-3 h-3" /> NEW
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      📍 {d.delivery_zone}{d.estimated_duration_min && ` • ~${d.estimated_duration_min} min`}{d.distance_km && ` • ${Number(d.distance_km).toFixed(1)} km`}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDistanceToNow(new Date(d.available_at), { addSuffix: true })}</p>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
                    <p className="text-lg font-bold text-green-600">${d.price}</p>
                    <a href={getDeliveryLink(d)} target="_blank" rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl ${isAmazon ? 'bg-orange-500 hover:bg-orange-600' : 'bg-red-500 hover:bg-red-600'} text-white`}>
                      {isAmazon ? 'Open Flex' : 'Open DoorDash'} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
