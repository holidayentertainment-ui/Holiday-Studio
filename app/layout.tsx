import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Holiday Focus Studio — AI-Powered Editorial Photography',
  description:
    'Transform any photo into professional headshots, editorial portraits, and high-fashion campaign visuals in seconds.',
  keywords: ['AI photography', 'headshot generator', 'editorial portraits', 'fashion AI', 'AI image generation'],
  openGraph: {
    title: 'Holiday Focus Studio',
    description: 'Generate studio-quality images in seconds with AI.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
