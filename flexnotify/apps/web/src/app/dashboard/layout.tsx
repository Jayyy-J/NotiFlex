'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, LayoutDashboard, Settings, CreditCard, LogOut, History } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../lib/hooks/useAuth';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
  { href: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, logout, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/auth/login');
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 border-r border-[rgb(var(--border))] flex flex-col sticky top-0 h-screen bg-[rgb(var(--card))]">
        <div className="p-4 border-b border-[rgb(var(--border))]">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
              <Bell className="w-4 h-4 text-white" />
            </div>
            FlexNotify
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  : 'text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))] hover:text-[rgb(var(--fg))]'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}

          {/* Admin links */}
          {(user?.role === 'admin_owner' || user?.role === 'admin_super') && (
            <>
              <div className="px-3 pt-4 pb-1 text-xs font-semibold text-[rgb(var(--muted))] uppercase tracking-wider">Admin</div>
              <Link href="/admin/owner"
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  pathname.startsWith('/admin')
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950'
                    : 'text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]'
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                Admin Dashboard
              </Link>
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-[rgb(var(--border))]">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
              {user?.full_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-xs text-[rgb(var(--muted))] truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={logout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[rgb(var(--muted))] hover:text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
