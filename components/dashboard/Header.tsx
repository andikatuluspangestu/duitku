'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, LogOut, Command, Sun, Moon, User } from 'lucide-react';
import { UserSession } from '@/lib/types';
import { useToast } from '../ui/ToastContext';
import { useTheme } from '../ui/ThemeContext';

interface HeaderProps {
  user: UserSession;
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onMenuToggle }) => {
  const router = useRouter();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      showToast('Anda telah logout dari sistem.', 'info');
      router.push('/login');
      router.refresh();
    } catch {
      showToast('Gagal logout. Silakan coba lagi.', 'error');
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#ffffff]/90 dark:bg-[#000000]/90 backdrop-blur-md border-b border-[#ebebeb] dark:border-[#262626] flex items-center justify-between px-4 lg:px-8 transition-colors">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-md text-[#4d4d4d] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ffffff] hover:bg-[#fafafa] dark:hover:bg-[#171717] focus:outline-none transition-colors"
          aria-label="Buka menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* User Breadcrumb Link to Profile */}
        <Link
          href="/profile"
          className="flex items-center gap-2 text-xs font-sans hover:opacity-80 transition-opacity"
          title="Ke Pengaturan Profil"
        >
          <span className="font-semibold text-[#171717] dark:text-[#ffffff]">{user.name}</span>
          <span className="text-[#a1a1a1] dark:text-[#525252]">/</span>
          <span className="font-caption-mono text-[#0070f3] dark:text-[#50e3c2] font-medium">{user.userCode}</span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {/* System Identifier */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fafafa] dark:bg-[#171717] border border-[#ebebeb] dark:border-[#262626] text-[11px] text-[#171717] dark:text-[#a1a1a1] font-caption-mono">
          <Command className="w-3 h-3 text-[#0070f3]" />
          <span>duitku-v2</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full border border-[#ebebeb] dark:border-[#262626] bg-[#ffffff] dark:bg-[#0a0a0a] text-[#4d4d4d] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ffffff] hover:bg-[#fafafa] dark:hover:bg-[#171717] transition-colors"
          title={theme === 'dark' ? 'Ganti ke Tema Terang' : 'Ganti ke Tema Gelap'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#f5a623]" />
          ) : (
            <Moon className="w-4 h-4 text-[#0070f3]" />
          )}
        </button>

        {/* User Initial Avatar & Logout Button */}
        <div className="flex items-center gap-3 pl-3 border-l border-[#ebebeb] dark:border-[#262626]">
          <Link
            href="/profile"
            className="w-8 h-8 rounded-full bg-[#171717] dark:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] flex items-center justify-center font-bold text-xs font-mono hover:scale-105 transition-transform"
            title="Pengaturan Profil Saya"
          >
            {user.name.charAt(0).toUpperCase()}
          </Link>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#ee0000]/10 dark:bg-[#ee0000]/20 text-[#ee0000] border border-[#ee0000]/30 hover:bg-[#ee0000]/20 transition-all duration-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isLoggingOut ? 'Keluar...' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
