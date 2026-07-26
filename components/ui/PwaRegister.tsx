'use client';

import React, { useEffect, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => console.log('PWA ServiceWorker registered: ', reg.scope))
          .catch((err) => console.log('ServiceWorker registration failed: ', err));
      });
    }

    // Capture PWA Install Prompt Event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-[#171717] dark:bg-[#ffffff] text-[#ffffff] dark:text-[#000000] p-4 rounded-xl shadow-2xl border border-[#333333] dark:border-[#ebebeb] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0070f3] text-white flex items-center justify-center font-bold font-mono text-sm shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-sans">Install UangKasir PWA</h4>
            <p className="text-[11px] font-caption-mono text-[#a1a1a1] dark:text-[#666666]">
              Akses cepat tanpa browser di Layar Utama HP / Komputer.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-full bg-[#0070f3] hover:bg-[#0051a8] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>

          <button
            onClick={() => setShowInstallBanner(false)}
            className="p-1.5 rounded-full hover:bg-white/10 dark:hover:bg-black/10 text-white dark:text-black transition-colors"
            aria-label="Tutup Banner PWA"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
