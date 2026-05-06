'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bell, Menu, X } from 'lucide-react';
import { clsx } from 'clsx';

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[rgb(var(--border))]/50 backdrop-blur-xl bg-[rgb(var(--bg))]/80">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
            <Bell className="w-4 h-4 text-white" />
          </div>
          FlexNotify
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-[rgb(var(--muted))]">
          <Link href="#features" className="hover:text-[rgb(var(--fg))] transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-[rgb(var(--fg))] transition-colors">How it works</Link>
          <Link href="#pricing" className="hover:text-[rgb(var(--fg))] transition-colors">Pricing</Link>
          <Link href="#faq" className="hover:text-[rgb(var(--fg))] transition-colors">FAQ</Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/auth/login" className="btn-secondary text-sm py-2">Sign In</Link>
          <Link href="/auth/register" className="btn-primary text-sm py-2">Start Free</Link>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden p-2">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-4 space-y-3">
          {['#features', '#how-it-works', '#pricing', '#faq'].map((href) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className="block text-sm text-[rgb(var(--muted))] py-2 capitalize">
              {href.replace('#', '')}
            </Link>
          ))}
          <div className="flex gap-3 pt-2">
            <Link href="/auth/login" className="btn-secondary text-sm flex-1 text-center">Sign In</Link>
            <Link href="/auth/register" className="btn-primary text-sm flex-1 text-center">Start Free</Link>
          </div>
        </div>
      )}
    </header>
  );
}
