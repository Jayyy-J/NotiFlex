'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const plans = [
  {
    id: 'free_trial',
    name: 'Free Trial',
    monthlyPrice: 0,
    annualPrice: 0,
    description: '7 days free, no credit card required',
    features: [
      'Amazon Flex + DoorDash alerts',
      'Push notifications',
      'Price range filter',
      'Zone/district filter',
      'Schedule your work hours',
      'iOS & Android app',
    ],
    cta: 'Start Free Trial',
    href: '/auth/register',
    highlighted: false,
  },
  {
    id: 'monthly',
    name: 'Monthly',
    monthlyPrice: 9.99,
    annualPrice: 9.99,
    description: 'Flexible month-to-month billing',
    features: [
      'Everything in Free Trial',
      'Unlimited notification history',
      'Priority alert delivery',
      'Multi-zone support',
      'Email support',
      'Analytics dashboard',
    ],
    cta: 'Get Monthly',
    href: '/auth/register?plan=monthly',
    highlighted: false,
  },
  {
    id: 'annual',
    name: 'Annual',
    monthlyPrice: 6.66,
    annualPrice: 79.99,
    description: 'Save 33% vs monthly billing',
    badge: 'Best Value',
    features: [
      'Everything in Monthly',
      'Best price — save $40/yr',
      'Priority customer support',
      'Advanced earnings analytics',
      'Early access to new features',
      'Export your data',
    ],
    cta: 'Get Annual',
    href: '/auth/register?plan=annual',
    highlighted: true,
  },
];

export function Pricing() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');

  return (
    <section id="pricing" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-[rgb(var(--fg))] mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-[rgb(var(--muted))] max-w-xl mx-auto mb-8">
            Start free for 7 days. No credit card required. Cancel anytime.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-1.5">
            <button
              onClick={() => setBilling('monthly')}
              className={clsx(
                'rounded-xl px-5 py-2 text-sm font-medium transition-all',
                billing === 'monthly'
                  ? 'bg-white text-[rgb(var(--fg))] shadow-sm dark:bg-[rgb(var(--bg))]'
                  : 'text-[rgb(var(--muted))]'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={clsx(
                'rounded-xl px-5 py-2 text-sm font-medium transition-all flex items-center gap-2',
                billing === 'annual'
                  ? 'bg-white text-[rgb(var(--fg))] shadow-sm dark:bg-[rgb(var(--bg))]'
                  : 'text-[rgb(var(--muted))]'
              )}
            >
              Annual
              <span className="badge-green text-[10px]">Save 33%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={clsx(
                'relative rounded-3xl border p-8 flex flex-col',
                plan.highlighted
                  ? 'border-brand-500 bg-brand-600 text-white shadow-2xl shadow-brand-500/25 scale-105'
                  : 'border-[rgb(var(--border))] bg-[rgb(var(--card))]'
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 px-3 py-1 text-xs font-bold text-white">
                    <Zap className="w-3 h-3" />
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className={clsx('text-lg font-bold mb-1', plan.highlighted ? 'text-white' : 'text-[rgb(var(--fg))]')}>
                  {plan.name}
                </h3>
                <p className={clsx('text-sm', plan.highlighted ? 'text-blue-100' : 'text-[rgb(var(--muted))]')}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className={clsx('text-4xl font-bold', plan.highlighted ? 'text-white' : 'text-[rgb(var(--fg))]')}>
                    ${billing === 'annual' ? plan.monthlyPrice : plan.monthlyPrice}
                  </span>
                  {plan.monthlyPrice > 0 && (
                    <span className={clsx('text-sm', plan.highlighted ? 'text-blue-100' : 'text-[rgb(var(--muted))]')}>
                      /mo
                    </span>
                  )}
                </div>
                {billing === 'annual' && plan.annualPrice > 0 && (
                  <p className={clsx('text-xs mt-1', plan.highlighted ? 'text-blue-100' : 'text-[rgb(var(--muted))]')}>
                    Billed ${plan.annualPrice}/year
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className={clsx('w-4 h-4 mt-0.5 flex-shrink-0', plan.highlighted ? 'text-green-300' : 'text-brand-500')} />
                    <span className={clsx('text-sm', plan.highlighted ? 'text-blue-50' : 'text-[rgb(var(--fg))]')}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={clsx(
                  'block text-center rounded-2xl px-6 py-3 text-sm font-semibold transition-all',
                  plan.highlighted
                    ? 'bg-white text-brand-600 hover:bg-blue-50'
                    : 'btn-primary'
                )}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Payment methods */}
        <div className="text-center mt-12">
          <p className="text-sm text-[rgb(var(--muted))] mb-4">Accepted payment methods</p>
          <div className="flex flex-wrap justify-center gap-3 items-center">
            {['Stripe', 'PayPal', 'MercadoPago', 'Wompi', 'PSE'].map((provider) => (
              <span key={provider} className="card px-4 py-2 text-xs font-medium">
                {provider}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
