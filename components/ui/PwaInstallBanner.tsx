'use client';

import React, { useEffect, useState } from 'react';
import { Smartphone, Download, Share, PlusSquare, CheckCircle, X, Sparkles } from 'lucide-react';

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode (already installed)
    const isInStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    
    setIsStandalone(isInStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(iosDevice);

    // Capture standard PWA install prompt for Android/Chrome/Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback for browsers that don't support automated prompt
      setShowIosGuide(true);
    }
  };

  if (isStandalone || isDismissed) return null;

  return (
    <>
      {/* Dashboard Top Banner */}
      <div className="vercel-card p-4 sm:p-5 bg-gradient-to-r from-[#0070f3]/10 via-[#50e3c2]/10 to-transparent border-[#0070f3]/30 relative overflow-hidden animate-in fade-in duration-300">
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-3 right-3 p-1 rounded-md text-[#888888] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ffffff] transition-colors"
          title="Tutup Banner"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 pr-6">
            <div className="w-10 h-10 rounded-xl bg-[#0070f3] text-white flex items-center justify-center font-bold shrink-0 shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#171717] dark:text-[#ffffff]">
                  Install Aplikasi UangKasir di HP &amp; iPhone
                </h3>
                <span className="vercel-badge-mono bg-[#0070f3]/10 text-[#0070f3] dark:text-[#50e3c2] border-[#0070f3]/30 text-[9px] flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> PWA SUPPORT
                </span>
              </div>
              <p className="text-xs text-[#4d4d4d] dark:text-[#a1a1a1] mt-0.5 font-sans">
                Akses kasir langsung dari Layar Utama HP / iPhone Anda tanpa perlu membuka browser. Performa lebih cepat &amp; hemat data.
              </p>
            </div>
          </div>

          <button
            onClick={handleInstallClick}
            className="vercel-button-primary py-2 px-4 text-xs font-semibold shrink-0 bg-[#0070f3] hover:bg-[#0051a8] text-white border-none shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>{isIos ? 'Panduan Install iPhone' : 'Install Aplikasi'}</span>
          </button>
        </div>
      </div>

      {/* iPhone / iOS Installation Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-[#171717] dark:text-[#ffffff]">
            <div className="flex items-center justify-between border-b border-[#ebebeb] dark:border-[#262626] pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#0070f3]" />
                <span>Cara Install PWA di iPhone &amp; iPad</span>
              </h3>
              <button onClick={() => setShowIosGuide(false)} className="text-[#888888] p-1 hover:text-[#171717] dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <p className="text-[#4d4d4d] dark:text-[#a1a1a1]">
                Untuk menambahkan **UangKasir** ke Layar Utama iPhone/iPad Anda melalui Safari:
              </p>

              <div className="p-3 rounded-lg bg-[#fafafa] dark:bg-[#171717] border border-[#ebebeb] dark:border-[#262626] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0070f3]/10 text-[#0070f3] flex items-center justify-center font-bold font-mono">1</div>
                <div>
                  <p className="font-semibold text-[#171717] dark:text-[#ffffff]">Tekan Tombol Bagikan (Share)</p>
                  <p className="text-[11px] text-[#888888] dark:text-[#a1a1a1] flex items-center gap-1 mt-0.5">
                    Sentuh ikon <Share className="w-3.5 h-3.5 text-[#0070f3]" /> di bilah bawah browser Safari Anda.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#fafafa] dark:bg-[#171717] border border-[#ebebeb] dark:border-[#262626] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0070f3]/10 text-[#0070f3] flex items-center justify-center font-bold font-mono">2</div>
                <div>
                  <p className="font-semibold text-[#171717] dark:text-[#ffffff]">Pilih "Tambah ke Layar Utama"</p>
                  <p className="text-[11px] text-[#888888] dark:text-[#a1a1a1] flex items-center gap-1 mt-0.5">
                    Gulir ke bawah lalu pilih menu <PlusSquare className="w-3.5 h-3.5 text-[#50e3c2]" /> <strong>Add to Home Screen</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#fafafa] dark:bg-[#171717] border border-[#ebebeb] dark:border-[#262626] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0070f3]/10 text-[#0070f3] flex items-center justify-center font-bold font-mono">3</div>
                <div>
                  <p className="font-semibold text-[#171717] dark:text-[#ffffff]">Konfirmasi "Tambah"</p>
                  <p className="text-[11px] text-[#888888] dark:text-[#a1a1a1]">
                    Tekan tombol <strong>Tambah (Add)</strong> di pojok kanan atas. Aplikasi UangKasir akan muncul di Home Screen iPhone!
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowIosGuide(false)}
                className="vercel-button-primary w-full py-2.5 text-xs"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Saya Mengerti</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
