'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bell, LayoutDashboard, Settings, CreditCard, LogOut, ShieldCheck, Users, BarChart3, Menu } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../lib/hooks/useAuth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, logout, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated) return null;

  const role = (user as any)?.role;
  const isAdmin = role === 'admin_owner' || role === 'admin_super';
  const isSuper = role === 'admin_super';
  const sub = (user as any)?.subscriptions;

  const userNav = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
    { href: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
  ];

  const adminNav = [
    { href: '/admin/owner', icon: BarChart3, label: isSuper ? 'Analytics & Users' : 'Admin Dashboard' },
  ];

  const statusColor: Record<string, string> = {
    active: 'bg-green-500', trial: 'bg-yellow-500',
    expired: 'bg-red-500', cancelled: 'bg-slate-400',
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
            <Bell className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900">FlexNotify</span>
        </Link>
      </div>

      {isAdmin && (
        <div className="mx-3 mt-3 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="text-xs font-semibold text-blue-700">{isSuper ? '🔐 Super Admin' : '👑 Admin Owner'}</span>
        </div>
      )}

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {userNav.map(({ href, icon: Icon, label }) => (
          <Link key={label} href={href} onClick={() => setMobileOpen(false)}
            className={clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              pathname === href ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}>
            <Icon className="w-4 h-4" />{label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="px-3 pt-5 pb-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin</p>
            </div>
            {adminNav.map(({ href, icon: Icon, label }) => (
              <Link key={label} href={href} onClick={() => setMobileOpen(false)}
                className={clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  pathname.startsWith('/admin') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}>
                <Icon className="w-4 h-4" />{label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="mx-3 mb-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusColor[sub?.status] ?? 'bg-slate-400'}`} />
          <span className="text-xs font-medium text-slate-600 capitalize">
            {sub?.plan_type?.replace('_', ' ') ?? 'Free'} plan
          </span>
          {sub?.status === 'trial' && (
            <Link href="/dashboard/billing" className="ml-auto text-xs text-blue-600 font-semibold hover:underline">Upgrade</Link>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
            {(user as any)?.full_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{(user as any)?.full_name}</p>
            <p className="text-xs text-slate-500 truncate">{(user as any)?.email}</p>
          </div>
        </div>
        <button onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="hidden lg:flex w-64 border-r border-slate-200 flex-col sticky top-0 h-screen bg-white">
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 flex flex-col bg-white h-full shadow-xl"><Sidebar /></aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-slate-100">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Bell className="w-3.5 h-3.5 text-white" />
            </div>
            FlexNotify
          </div>
        </div>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
