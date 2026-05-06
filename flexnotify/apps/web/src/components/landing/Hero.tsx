'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bell, ArrowRight, Smartphone, TrendingUp, Shield } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden px-4 pt-20">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-br from-brand-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-brand-600/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-300 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Real-time monitoring • 24/7
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-[rgb(var(--fg))] leading-tight mb-6">
              Never miss an{' '}
              <span className="bg-gradient-to-r from-brand-500 to-purple-600 bg-clip-text text-transparent">
                Amazon Flex
              </span>{' '}
              or{' '}
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                DoorDash
              </span>{' '}
              block again
            </h1>

            <p className="text-lg text-[rgb(var(--muted))] mb-8 max-w-xl">
              Get instant push notifications for delivery blocks that match your price range,
              preferred zones, and work schedule — automatically filtered just for you.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth/register" className="btn-primary text-base px-8 py-3.5">
                Start Free 7-Day Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="#how-it-works" className="btn-secondary text-base px-8 py-3.5">
                See how it works
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center gap-6 mt-8 pt-8 border-t border-[rgb(var(--border))]">
              {[
                { icon: Shield, text: 'No credit card required' },
                { icon: Smartphone, text: 'iOS & Android' },
                { icon: TrendingUp, text: '10x more blocks caught' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
                  <Icon className="w-4 h-4 text-brand-500" />
                  {text}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — App mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative flex justify-center"
          >
            <div className="relative w-72 h-[580px]">
              {/* Phone frame */}
              <div className="absolute inset-0 rounded-[3rem] bg-[rgb(var(--card))] border-2 border-[rgb(var(--border))] shadow-2xl overflow-hidden">
                {/* Status bar */}
                <div className="h-12 bg-[rgb(var(--card))] flex items-center justify-between px-6 pt-2">
                  <span className="text-xs font-medium">9:41</span>
                  <div className="w-24 h-6 bg-black rounded-full" />
                  <div className="flex gap-1">
                    <div className="w-4 h-3 border border-current rounded-sm" />
                  </div>
                </div>

                {/* App content */}
                <div className="px-4 py-2 space-y-3">
                  <div className="text-center py-3">
                    <Bell className="w-6 h-6 text-brand-500 mx-auto mb-1" />
                    <p className="text-xs font-semibold">FlexNotify</p>
                  </div>

                  {/* Notification cards */}
                  {[
                    { platform: 'Amazon Flex', price: '$36', zone: 'Downtown Seattle', time: '2s ago', color: 'bg-orange-500' },
                    { platform: 'DoorDash', price: '$18', zone: 'Capitol Hill', time: '45s ago', color: 'bg-red-500' },
                    { platform: 'Amazon Flex', price: '$48', zone: 'Bellevue', time: '2m ago', color: 'bg-orange-500' },
                    { platform: 'DoorDash', price: '$22', zone: 'Fremont', time: '5m ago', color: 'bg-red-500' },
                  ].map((notif, i) => (
                    <motion.div
                      key={i}
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5 + i * 0.15 }}
                      className="rounded-2xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))] p-3 flex items-center gap-3"
                    >
                      <div className={`w-9 h-9 rounded-xl ${notif.color} flex items-center justify-center flex-shrink-0`}>
                        <Bell className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{notif.platform}</p>
                        <p className="text-xs text-[rgb(var(--muted))] truncate">{notif.price} • {notif.zone}</p>
                      </div>
                      <span className="text-[10px] text-[rgb(var(--muted))] flex-shrink-0">{notif.time}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Floating badges */}
              <motion.div
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1 }}
                className="absolute -right-12 top-20 card px-3 py-2 shadow-lg"
              >
                <p className="text-xs font-semibold text-green-600">+$36</p>
                <p className="text-[10px] text-[rgb(var(--muted))]">Block grabbed!</p>
              </motion.div>

              <motion.div
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="absolute -left-12 bottom-32 card px-3 py-2 shadow-lg"
              >
                <p className="text-xs font-semibold">⚡ 0.3s</p>
                <p className="text-[10px] text-[rgb(var(--muted))]">Alert speed</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
