import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/ToastContext';
import { ThemeProvider } from '@/components/ui/ThemeContext';
import { PwaRegister } from '@/components/ui/PwaRegister';

export const metadata: Metadata = {
  title: 'UangKasir - Aplikasi Pencatatan Kas Keuangan Sederhana',
  description: 'Sistem pencatatan kas keuangan sederhana dengan role Superadmin, Admin, dan User, ekspor Laporan Excel/PDF, serta audit log.',
  manifest: '/manifest.json',
  
  // Strictly prevent Search Engines (Google, Bing, Yahoo) from indexing or caching this private application
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },

  // Rich OpenGraph Metadata for beautiful WhatsApp / Telegram / Social Media link sharing
  openGraph: {
    title: 'UangKasir - Sistem Pencatatan Kas Keuangan Sederhana',
    description: 'Aplikasi Manajemen Kas Keuangan Usaha & Kasir dengan Ekspor Laporan Excel/PDF dan PWA Install.',
    siteName: 'UangKasir',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'UangKasir - Sistem Pencatatan Kas Keuangan',
      },
    ],
  },

  // Twitter Card Metadata
  twitter: {
    card: 'summary_large_image',
    title: 'UangKasir - Sistem Pencatatan Kas Keuangan Sederhana',
    description: 'Aplikasi Manajemen Kas Keuangan Usaha & Kasir dengan Ekspor Laporan Excel/PDF dan PWA Install.',
    images: ['/og-image.svg'],
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'UangKasir',
  },

  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#0070f3',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider>
          <ToastProvider>
            {children}
            <PwaRegister />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
