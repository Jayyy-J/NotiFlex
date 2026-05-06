import type { Metadata } from 'next';
import { Navbar } from '../../components/landing/Navbar';
import { Hero } from '../../components/landing/Hero';
import { Features } from '../../components/landing/Features';
import { HowItWorks } from '../../components/landing/HowItWorks';
import { Pricing } from '../../components/landing/Pricing';
import { Testimonials } from '../../components/landing/Testimonials';
import { FAQ } from '../../components/landing/FAQ';
import { Footer } from '../../components/landing/Footer';

export const metadata: Metadata = {
  title: 'FlexNotify — Amazon Flex & DoorDash Block Alerts',
  description: 'Stop missing Amazon Flex blocks and DoorDash orders. Get instant push notifications filtered by price, zone, and schedule.',
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[rgb(var(--bg))]">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <FAQ />
      <Footer />
    </main>
  );
}
