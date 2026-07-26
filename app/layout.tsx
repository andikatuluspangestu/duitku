import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/ToastContext';
import { ThemeProvider } from '@/components/ui/ThemeContext';

export const metadata: Metadata = {
  title: 'Duitku - Aplikasi Pencatatan Kas Keuangan Sederhana',
  description: 'Sistem pencatatan kas sederhana dengan role Superadmin, Admin, dan User, ekspor Laporan Excel/PDF, serta audit log.',
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
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
