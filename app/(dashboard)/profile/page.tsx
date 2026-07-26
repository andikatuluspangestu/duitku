'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, KeyRound, CheckCircle, AlertCircle, Loader2, ShieldCheck, ShieldAlert, Eye, Calendar, Sparkles } from 'lucide-react';
import { UserItem } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/ToastContext';

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<UserItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form Profile Name
  const [name, setName] = useState('');
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Form Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/profile');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat profil');

      setProfile(data.data);
      setName(data.data.name);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    if (!name.trim()) {
      setProfileError('Nama lengkap wajib diisi');
      return;
    }

    setIsSubmittingProfile(true);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui profil');

      showToast('Informasi nama profil berhasil diperbarui', 'success');
      window.location.reload();
    } catch (err: any) {
      setProfileError(err.message);
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Password saat ini wajib diisi');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password baru minimal 6 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi password baru tidak cocok');
      return;
    }

    setIsSubmittingPassword(true);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah password');

      showToast('Password berhasil diubah. Silakan gunakan password baru pada login berikutnya.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-6 h-6 text-[#0070f3] animate-spin" />
        <p className="font-caption-mono text-xs text-[#888888] dark:text-[#a1a1a1]">Memuat profil pengguna...</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-[#ebebeb] dark:border-[#262626] pb-4">
        <span className="font-caption-mono text-xs text-[#0070f3] dark:text-[#50e3c2] font-semibold">PENGATURAN AKUN</span>
        <h1 className="text-xl sm:text-2xl font-bold text-[#171717] dark:text-[#ffffff] tracking-tight">Profil Pengguna</h1>
      </div>

      {/* User Info Overview Card */}
      <div className="vercel-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#171717] dark:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] flex items-center justify-center font-bold text-xl font-mono shrink-0">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#171717] dark:text-[#ffffff]">{profile.name}</h2>
              {profile.role === 'SUPERADMIN' ? (
                <span className="vercel-badge-mono bg-[#ff0080]/10 text-[#ff0080] border-[#ff0080]/30 text-[10px] flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  SUPERADMIN
                </span>
              ) : profile.role === 'ADMIN' ? (
                <span className="vercel-badge-mono bg-[#0070f3]/10 text-[#0070f3] border-[#0070f3]/30 text-[10px] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  ADMIN
                </span>
              ) : (
                <span className="vercel-badge-mono bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/30 text-[10px] flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  USER
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 font-caption-mono text-xs text-[#888888] dark:text-[#a1a1a1]">
              <span>KODE: <strong className="text-[#0070f3] dark:text-[#50e3c2]">{profile.userCode}</strong></span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Terdaftar: {formatDate(profile.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form 1: Edit Nama Profil */}
        <div className="vercel-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 border-b border-[#ebebeb] dark:border-[#262626] pb-3 mb-4">
              <User className="w-4 h-4 text-[#0070f3] dark:text-[#50e3c2]" />
              <h3 className="text-sm font-bold text-[#171717] dark:text-[#ffffff] tracking-tight">Edit Nama Pengguna</h3>
            </div>

            {profileError && (
              <div className="mb-4 p-3 rounded-md bg-[#ee0000]/10 border border-[#ee0000]/30 text-[#ee0000] text-xs font-caption-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#ee0000]" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block font-caption-mono text-[11px] text-[#888888] dark:text-[#a1a1a1] uppercase tracking-wider mb-1.5 font-semibold">
                  Kode User (Read-Only)
                </label>
                <input
                  type="text"
                  disabled
                  value={profile.userCode}
                  className="w-full vercel-input font-mono font-bold uppercase bg-[#fafafa] dark:bg-[#171717] opacity-70 cursor-not-allowed text-xs"
                />
              </div>

              <div>
                <label className="block font-caption-mono text-[11px] text-[#4d4d4d] dark:text-[#a1a1a1] uppercase tracking-wider mb-1.5 font-semibold">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap Anda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full vercel-input text-xs font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingProfile}
                className="vercel-button-primary w-full py-2.5 text-xs font-semibold mt-2 disabled:opacity-50"
              >
                {isSubmittingProfile ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan Nama...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Simpan Nama Profil</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Form 2: Ubah Password */}
        <div className="vercel-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 border-b border-[#ebebeb] dark:border-[#262626] pb-3 mb-4">
              <KeyRound className="w-4 h-4 text-[#0070f3] dark:text-[#50e3c2]" />
              <h3 className="text-sm font-bold text-[#171717] dark:text-[#ffffff] tracking-tight">Ubah Password Akun</h3>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 rounded-md bg-[#ee0000]/10 border border-[#ee0000]/30 text-[#ee0000] text-xs font-caption-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#ee0000]" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block font-caption-mono text-[11px] text-[#4d4d4d] dark:text-[#a1a1a1] uppercase tracking-wider mb-1.5 font-semibold">
                  Password Saat Ini *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full vercel-input text-xs font-sans"
                />
              </div>

              <div>
                <label className="block font-caption-mono text-[11px] text-[#4d4d4d] dark:text-[#a1a1a1] uppercase tracking-wider mb-1.5 font-semibold">
                  Password Baru * (Min 6 karakter)
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full vercel-input text-xs font-sans"
                />
              </div>

              <div>
                <label className="block font-caption-mono text-[11px] text-[#4d4d4d] dark:text-[#a1a1a1] uppercase tracking-wider mb-1.5 font-semibold">
                  Konfirmasi Password Baru *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full vercel-input text-xs font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingPassword}
                className="vercel-button-primary w-full py-2.5 text-xs font-semibold mt-2 disabled:opacity-50"
              >
                {isSubmittingPassword ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengubah Password...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Ubah Password</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
