import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/ToastContext';
import { ThemeProvider } from '@/components/ui/ThemeContext';
import { PwaRegister } from '@/components/ui/PwaRegister';

export const metadata: Metadata = {
  title: 'UangKasir - Aplikasi Pencatatan Kas Keuangan Sederhana',
  description: 'Sistem pencatatan kas sederhana dengan role Superadmin, Admin, dan User, ekspor Laporan Excel/PDF, serta audit log.',
  manifest: '/manifest.json',
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
