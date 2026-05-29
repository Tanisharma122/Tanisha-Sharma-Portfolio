import type { Metadata } from 'next';
import { Inter, Space_Grotesk, Space_Mono } from 'next/font/google';
import './globals.css';

// ── Google Fonts ──────────────────────────────────────────────────────
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '700'],
});

// ── SEO Metadata ──────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Tanisha Sharma Portfolio',
  description:
    'Portfolio of Tanisha Sharma: Computer Engineering student & AI Researcher specializing in Machine Learning, Computer Vision, and Deep Learning. MYOSA 4.0 International Finalist. IEEE EMBS Research Fellow.',
  keywords: [
    'Tanisha Sharma',
    'AI Researcher',
    'Computer Vision',
    'Machine Learning',
    'Deep Learning',
    'LDRP Institute',
    'IEEE EMBS',
    'Portfolio',
  ],
  authors: [{ name: 'Tanisha Sharma' }],
  openGraph: {
    title: 'Tanisha Sharma Portfolio',
    description:
      'Building research-backed AI prototypes and real-time computer vision systems.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${spaceMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
