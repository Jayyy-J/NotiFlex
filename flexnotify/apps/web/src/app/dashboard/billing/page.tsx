'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuthStore } from '../../../lib/hooks/useAuth';
import { supabase } from '../../../lib/supabase/client';
import { CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react';

const PAYMENT_BUTTONS = [
  { id: 'stripe', label: '💳 Pay with Card (Stripe)' },
  { id: 'paypal', label: '🅿️ PayPal' },
  { id: 'mercadopago', label: '💙 MercadoPago' },
  { id: 'wompi', label: '🇨🇴 Wompi' },
  { id: 'pse', label: '🏦 PSE' },
];

export default function BillingPage() {
  const { user, accessToken } = useAuthStore();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('success')) toast.success('Payment successful! Your subscription is now active.');
    if (searchParams.get('cancelled')) toast.error('Payment was cancelled.');
    if (searchParams.get('failed')) toast.error('Payment failed. Please try again.');
  }, [searchParams]);

  const { data: sub } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('subscriptions').select('*').eq('user_id', user!.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('invoices').select('*').eq('user_id', user!.id).order('issued_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const handlePayment = async (provider: string, planType: string) => {
    try {
      const endpoints: Record<string, string> = {
        stripe: '/api/payments/stripe/create-session',
        paypal: '/api/payments/paypal/create-order',
        mercadopago: '/api/payments/mercadopago/create-preference',
        wompi: '/api/payments/wompi/create-transaction',
        pse: '/api/payments/pse/create-transaction',
      };

      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoints[provider]}`,
        { plan_type: planType },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const url = data.data?.url;
      if (url) window.location.href = url;
    } catch (err) {
      toast.error('Payment initiation failed. Please try again.');
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions/cancel`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success('Subscription cancelled. Access continues until period end.');
    } catch {
      toast.error('Failed to cancel');
    }
  };

  const statusIcon = {
    active: <CheckCircle className="w-4 h-4 text-green-500" />,
    trial: <Clock className="w-4 h-4 text-yellow-500" />,
    expired: <XCircle className="w-4 h-4 text-red-500" />,
    cancelled: <XCircle className="w-4 h-4 text-[rgb(var(--muted))]" />,
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">Billing & Subscription</h1>

      {/* Current plan */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-4 h-4 text-brand-600" />
          <h2 className="font-semibold">Current Plan</h2>
        </div>
        {sub ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[rgb(var(--muted))]">Plan</span>
              <span className="font-medium capitalize">{sub.plan_type?.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[rgb(var(--muted))]">Status</span>
              <div className="flex items-center gap-1.5">
                {statusIcon[sub.status as keyof typeof statusIcon]}
                <span className="font-medium capitalize">{sub.status}</span>
              </div>
            </div>
            {sub.status === 'trial' && sub.trial_ends_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-[rgb(var(--muted))]">Trial ends</span>
                <span className="font-medium">{new Date(sub.trial_ends_at).toLocaleDateString()}</span>
              </div>
            )}
            {sub.status === 'active' && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[rgb(var(--muted))]">Amount</span>
                  <span className="font-medium">${sub.amount} {sub.currency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[rgb(var(--muted))]">Next billing</span>
                  <span className="font-medium">{new Date(sub.current_period_end).toLocaleDateString()}</span>
                </div>
                <button onClick={handleCancelSubscription} className="text-xs text-red-500 hover:underline mt-2">
                  Cancel subscription
                </button>
              </>
            )}
          </div>
        ) : (
          <p className="text-sm text-[rgb(var(--muted))]">Loading...</p>
        )}
      </div>

      {/* Upgrade options */}
      {sub?.status !== 'active' && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-4">Upgrade Your Plan</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { id: 'monthly', name: 'Monthly', price: '$9.99/mo', desc: 'Flexible billing' },
              { id: 'annual', name: 'Annual', price: '$79.99/yr', desc: 'Save 33%', badge: 'Best Value' },
            ].map((plan) => (
              <div key={plan.id} className="relative rounded-2xl border-2 border-[rgb(var(--border))] p-4">
                {plan.badge && (
                  <span className="absolute -top-2 left-3 text-xs bg-green-500 text-white rounded-full px-2 py-0.5">{plan.badge}</span>
                )}
                <p className="font-semibold">{plan.name}</p>
                <p className="text-xl font-bold text-brand-600 my-1">{plan.price}</p>
                <p className="text-xs text-[rgb(var(--muted))] mb-4">{plan.desc}</p>

                <div className="space-y-2">
                  {PAYMENT_BUTTONS.map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => handlePayment(btn.id, plan.id)}
                      className="w-full text-xs py-2 px-3 rounded-xl border border-[rgb(var(--border))] hover:bg-[rgb(var(--bg))] transition-colors text-left"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoice history */}
      {invoices.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-4">Invoice History</h2>
          <div className="space-y-3">
            {invoices.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">${Number(inv.amount).toFixed(2)} {inv.currency}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{new Date(inv.issued_at).toLocaleDateString()}</p>
                </div>
                <span className={`badge ${inv.status === 'paid' ? 'badge-green' : 'badge-yellow'}`}>
                  {inv.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
