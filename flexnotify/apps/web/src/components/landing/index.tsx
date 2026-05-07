'use client';

import { motion } from 'framer-motion';
import { Bell, Map, DollarSign, Clock, Smartphone, Shield, Zap, BarChart3 } from 'lucide-react';

const features = [
  { icon: Bell, title: 'Instant Alerts', description: 'Get notified within seconds when a block matching your criteria appears.' },
  { icon: Map, title: 'Zone Filtering', description: 'Choose specific neighborhoods or delivery zones. Only see blocks where you want to work.' },
  { icon: DollarSign, title: 'Price Range Filter', description: 'Set minimum and maximum pay. Focus on blocks worth your time.' },
  { icon: Clock, title: 'Work Schedule', description: 'Define your working hours. No more midnight notifications.' },
  { icon: Smartphone, title: 'iOS & Android', description: 'Native app for both platforms with real push notifications.' },
  { icon: Shield, title: 'Always On', description: 'Our 24/7 monitoring system checks for blocks every 30 seconds.' },
  { icon: Zap, title: 'Multi-Platform', description: 'Monitor Amazon Flex and DoorDash simultaneously.' },
  { icon: BarChart3, title: 'Earnings Analytics', description: 'Track your notification history and estimated earnings.' },
];

export function Features() {
  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[rgb(var(--fg))] mb-4">Everything you need to maximize earnings</h2>
          <p className="text-lg text-[rgb(var(--muted))] max-w-xl mx-auto">
            Powerful filtering tools for Amazon Flex and DoorDash drivers.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, description }, i) => (
            <motion.div key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="card group hover:border-brand-300 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-4 dark:bg-brand-950">
                <Icon className="w-5 h-5 text-brand-600" />
              </div>
              <h3 className="font-semibold text-[rgb(var(--fg))] mb-2">{title}</h3>
              <p className="text-sm text-[rgb(var(--muted))] leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    { n: '01', title: 'Create your account', desc: 'Sign up in seconds. Get 7 days free, no credit card needed.' },
    { n: '02', title: 'Set your preferences', desc: 'Choose platforms, price range, zones, and work hours.' },
    { n: '03', title: 'Install the mobile app', desc: 'Download on iOS or Android for instant push notifications.' },
    { n: '04', title: 'Catch blocks instantly', desc: 'We monitor 24/7 and alert you the moment a matching block appears.' },
  ];

  return (
    <section id="how-it-works" className="py-24 px-4 bg-[rgb(var(--card))]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[rgb(var(--fg))] mb-4">How it works</h2>
          <p className="text-lg text-[rgb(var(--muted))]">From signup to catching blocks in under 5 minutes.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div key={step.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="text-4xl font-bold text-brand-200 dark:text-brand-800 mb-3">{step.n}</div>
              <h3 className="font-semibold text-[rgb(var(--fg))] mb-2">{step.title}</h3>
              <p className="text-sm text-[rgb(var(--muted))] leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Testimonials() {
  const reviews = [
    { name: 'Marcus T.', role: 'Amazon Flex Driver, Seattle', text: 'I was averaging $900/week. With FlexNotify I\'m now hitting $1,400+ consistently.', rating: 5 },
    { name: 'Sofia R.', role: 'DoorDash Dasher, Miami', text: 'I used to refresh the app for hours. Now my phone alerts me the moment a good order comes in.', rating: 5 },
    { name: 'James W.', role: 'Flex + DoorDash, Chicago', text: 'The schedule feature is perfect. I only get notified when I\'m actually available.', rating: 5 },
  ];

  return (
    <section className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[rgb(var(--fg))] mb-4">Drivers earning more every week</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((r, i) => (
            <motion.div key={r.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: r.rating }).map((_, j) => (
                  <span key={j} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-sm text-[rgb(var(--fg))] mb-4 leading-relaxed">&ldquo;{r.text}&rdquo;</p>
              <p className="font-semibold text-sm">{r.name}</p>
              <p className="text-xs text-[rgb(var(--muted))]">{r.role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FAQ() {
  const faqs = [
    { q: 'How fast are the notifications?', a: 'From when a block appears to your phone buzzing is typically under 2 seconds.' },
    { q: 'Does it work for both iOS and Android?', a: 'Yes. Native apps for both platforms using Firebase Cloud Messaging.' },
    { q: 'Will my account get banned?', a: 'FlexNotify monitors through our own accounts. Your personal accounts are never at risk.' },
    { q: 'Which countries are supported?', a: 'Wherever Amazon Flex and DoorDash operate globally.' },
    { q: 'Can I cancel anytime?', a: 'Yes. Monthly plans cancel immediately. Annual plans continue until the period ends.' },
    { q: 'What payment methods do you accept?', a: 'Stripe, PayPal, MercadoPago, Wompi, and PSE.' },
  ];

  return (
    <section id="faq" className="py-24 px-4 bg-[rgb(var(--card))]">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-[rgb(var(--fg))] mb-4">Frequently asked questions</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <details key={faq.q} className="card">
              <summary className="flex justify-between items-center cursor-pointer font-semibold text-[rgb(var(--fg))] text-sm">
                {faq.q}
                <span className="text-[rgb(var(--muted))]">+</span>
              </summary>
              <p className="mt-3 text-sm text-[rgb(var(--muted))] leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-[rgb(var(--border))] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 font-bold mb-3">
              <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
                <Bell className="w-3.5 h-3.5 text-white" />
              </div>
              FlexNotify
            </div>
            <p className="text-sm text-[rgb(var(--muted))]">Real-time delivery block alerts for Amazon Flex and DoorDash drivers worldwide.</p>
          </div>
          {[
            { title: 'Product', links: [['Features', '#features'], ['Pricing', '#pricing'], ['How it works', '#how-it-works']] },
            { title: 'Legal', links: [['Privacy Policy', '/legal/privacy'], ['Terms of Service', '/legal/terms']] },
            { title: 'Support', links: [['Contact Us', '/contact'], ['Help Center', '/help']] },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="font-semibold text-sm mb-3">{title}</h4>
              <ul className="space-y-2">
                {links.map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] transition-colors">{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-[rgb(var(--border))] pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[rgb(var(--muted))]">
          <p>© {new Date().getFullYear()} FlexNotify. All rights reserved.</p>
          <p>English · Español · Português</p>
        </div>
      </div>
    </footer>
  );
}
