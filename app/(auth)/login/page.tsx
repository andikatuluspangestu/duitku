'use client';

import React, { useState } from 'react';
import { LogIn, Lock, UserCheck, AlertCircle, Loader2, Sparkles, Sun, Moon } from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';
import { useTheme } from '@/components/ui/ThemeContext';

export default function LoginPage() {
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const [userCode, setUserCode] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!userCode || !password) {
      setErrorMsg('Kode user dan password wajib diisi');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCode, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal login');

      showToast(`Selamat datang kembali, ${data.user.name}!`, 'success');
      window.location.href = '/dashboard';
    } catch (err: any) {
      setErrorMsg(err.message);
      showToast(err.message, 'error');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#000000] text-[#171717] dark:text-[#ededed] flex items-center justify-center p-4 relative overflow-hidden font-sans transition-colors">
      {/* Vercel Atmospheric Mesh Backdrop */}
      <div className="absolute inset-0 bg-mesh-hero opacity-70 pointer-events-none" />

      {/* Theme Switcher Floating Top Right */}
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-5 p-2.5 rounded-full border border-[#ebebeb] dark:border-[#262626] bg-[#ffffff] dark:bg-[#0a0a0a] text-[#4d4d4d] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ffffff] transition-colors z-20"
        title={theme === 'dark' ? 'Ganti ke Tema Terang' : 'Ganti ke Tema Gelap'}
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 text-[#f5a623]" />
        ) : (
          <Moon className="w-5 h-5 text-[#0070f3]" />
        )}
      </button>

      {/* Main Login Card - Vercel Design System ex-auth-form-card */}
      <div className="w-full max-w-md bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] rounded-xl p-7 sm:p-9 relative z-10 animate-in fade-in zoom-in duration-200">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fafafa] dark:bg-[#171717] border border-[#ebebeb] dark:border-[#262626] text-[11px] font-caption-mono text-[#4d4d4d] dark:text-[#a1a1a1] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#50e3c2]" />
            <span>UangKasir Kas v2.0</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#171717] dark:text-[#ffffff]">
            UangKasir<span className="text-[#0070f3]">.</span>
          </h1>
          <p className="text-xs text-[#888888] dark:text-[#737373] mt-2 font-medium">
            Sistem Pencatatan Kas Keuangan Sederhana
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-md bg-[#ee0000]/10 border border-[#ee0000]/30 text-[#ee0000] text-xs font-caption-mono flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#ee0000]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block font-caption-mono text-[11px] text-[#4d4d4d] dark:text-[#a1a1a1] uppercase tracking-wider mb-2 font-semibold">
              Kode User
            </label>
            <div className="relative flex items-center">
              <UserCheck className="w-4 h-4 text-[#888888] dark:text-[#737373] absolute left-3.5 pointer-events-none shrink-0 z-10" />
              <input
                type="text"
                required
                placeholder="cth: USR001"
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                className="w-full vercel-input !pl-10 text-sm font-mono uppercase font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-caption-mono text-[11px] text-[#4d4d4d] dark:text-[#a1a1a1] uppercase tracking-wider mb-2 font-semibold">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-[#888888] dark:text-[#737373] absolute left-3.5 pointer-events-none shrink-0 z-10" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full vercel-input !pl-10 text-sm font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 vercel-button-primary py-3 font-semibold text-xs sm:text-sm rounded-full disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Login...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Masuk ke Dashboard</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
