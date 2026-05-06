'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase/client';
import { useAuthStore } from '../../../lib/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { initAuth } = useAuthStore();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm<{ email: string; password: string }>();

  const onSubmit = async (data: { email: string; password: string }) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword(data);
      if (error) throw error;
      await initAuth();
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            FlexNotify
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-[rgb(var(--fg))]">Sign in to your account</h1>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" className="input" placeholder="you@example.com" required />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="label mb-0">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-brand-600 hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input {...register('password')} type={showPw ? 'text' : 'password'} className="input pr-10" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[rgb(var(--muted))] mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="text-brand-600 font-medium hover:underline">Start free trial</Link>
        </p>
      </div>
    </div>
  );
}
