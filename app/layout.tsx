import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PalmPay — The Future of Invisible Payments',
  description:
    'Biometric payments powered by palm vein intelligence. No phone. No QR. No card. No cash. Your palm is now your wallet.',
  keywords: ['palm vein', 'biometric payments', 'fintech', 'invisible payments', 'PalmPay'],
  authors: [{ name: 'PalmPay Technologies' }],
  openGraph: {
    title: 'PalmPay — Your Palm Is Now Your Wallet',
    description: 'Biometric payments powered by palm vein intelligence.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#05070A',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Fonts via CDN — gracefully falls back to system fonts offline (no build dependency). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
