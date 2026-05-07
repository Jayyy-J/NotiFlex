'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bell, LayoutDashboard, Users, BarChart3, LogOut, ShieldCheck, Download, Menu, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../lib/hooks/useAuth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, logout, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) { router.push('/auth/login'); return; }
      const role = (user as any)?.role;
      if (!['admin_owner', 'admin_super'].includes(role)) {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated) return null;

  const role = (user as any)?.role;
  const isSuper = role === 'admin_super';

  const navItems = [
    { href: '/admin/owner', icon: BarChart3, label: 'Dashboard & Metrics' },
    { href: '/dashboard', icon: LayoutDashboard, label: 'User Dashboard' },
  ];

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
            <Bell className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900">FlexNotify</span>
        </Link>
      </div>

      {/* Role badge */}
      <div className="mx-3 mt-3 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-blue-700">{isSuper ? '🔐 Super Admin' : '👑 Admin Owner'}</p>
          <p className="text-xs text-blue-500">{(user as any)?.email}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 mt-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">Admin Panel</p>

        {navItems.map(({ href, icon: Icon, label }) => (
          <Link key={label} href={href} onClick={() => setMobileOpen(false)}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              pathname === href || (href === '/admin/owner' && pathname.startsWith('/admin'))
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}>
            <Icon className="w-4 h-4" />{label}
          </Link>
        ))}

        {isSuper && (
          <>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 pt-4 pb-2">Super Admin Only</p>
            <Link href="/admin/super" onClick={() => setMobileOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                pathname === '/admin/super'
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-slate-600 hover:bg-purple-50 hover:text-purple-700'
              )}>
              <Download className="w-4 h-4" /> Export & Reports
            </Link>
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-100">
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
          <span className="font-bold text-slate-900">FlexNotify Admin</span>
        </div>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
