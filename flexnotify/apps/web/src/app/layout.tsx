import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '../components/layout/Providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://flexnotify.app'),
  title: {
    default: 'FlexNotify — Amazon Flex & DoorDash Block Alerts',
    template: '%s | FlexNotify',
  },
  description: 'Get instant push notifications for Amazon Flex and DoorDash delivery blocks matching your price range and preferred zones. Never miss a block again.',
  keywords: ['Amazon Flex', 'DoorDash', 'delivery blocks', 'block alerts', 'flex notifications', 'dasher alerts', 'gig economy'],
  authors: [{ name: 'FlexNotify' }],
  creator: 'FlexNotify',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://flexnotify.app',
    title: 'FlexNotify — Amazon Flex & DoorDash Block Alerts',
    description: 'Get instant push notifications for Amazon Flex and DoorDash delivery blocks matching your price range and zones.',
    siteName: 'FlexNotify',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlexNotify — Block Alerts',
    description: 'Instant notifications for Amazon Flex & DoorDash blocks.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="canonical" href="https://flexnotify.app" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
