'use client';

import React, { useState, useEffect } from 'react';
import { LogIn, Lock, UserCheck, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';

export default function LoginPage() {
  const { showToast } = useToast();

  const [userCode, setUserCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const savedCode = localStorage.getItem('uangkasir_remember_usercode');
    if (savedCode) {
      setUserCode(savedCode);
      setRememberMe(true);
    }
  }, []);

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

      // Remember me handling
      if (rememberMe) {
        localStorage.setItem('uangkasir_remember_usercode', userCode.trim().toUpperCase());
      } else {
        localStorage.removeItem('uangkasir_remember_usercode');
      }

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

      {/* Clean Frameless Login Container */}
      <div className="w-full max-w-sm relative z-10 p-2 sm:p-4 animate-in fade-in zoom-in duration-200">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
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
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full vercel-input !pl-10 !pr-10 text-sm font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-[#888888] dark:text-[#737373] hover:text-[#171717] dark:hover:text-[#ffffff] transition-colors p-1"
                title={showPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Ingat Saya Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#0070f3] bg-[#ffffff] dark:bg-[#000000] border-[#ebebeb] dark:border-[#262626] focus:ring-0 cursor-pointer"
              />
              <span className="font-caption-mono text-xs text-[#4d4d4d] dark:text-[#a1a1a1] font-semibold">
                Ingat Saya
              </span>
            </label>
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
