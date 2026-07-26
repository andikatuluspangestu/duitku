'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ReceiptText,
  FolderTree,
  Users,
  FileSpreadsheet,
  History,
  Plus,
} from 'lucide-react';
import { UserSession } from '@/lib/types';

interface MobileBottomNavProps {
  user: UserSession;
  onOpenAddTransaction?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  user,
  onOpenAddTransaction,
}) => {
  const pathname = usePathname();
  const isAdmin = user.role === 'ADMIN';

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Ledger', icon: ReceiptText, href: '/transactions' },
    { label: 'Kategori', icon: FolderTree, href: '/categories' },
    ...(isAdmin
      ? [
          { label: 'Team', icon: Users, href: '/users' },
          { label: 'Reports', icon: FileSpreadsheet, href: '/reports' },
        ]
      : [{ label: 'Reports', icon: FileSpreadsheet, href: '/reports' }]),
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-[#262626] px-2 py-1.5 pb-safe flex items-center justify-around shadow-vercel-modal">
      {navItems.slice(0, isAdmin ? 2 : 3).map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-all active:scale-95 ${
              isActive ? 'text-[#ffffff] font-bold' : 'text-[#737373] hover:text-[#a1a1a1]'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-[#0070f3]' : 'text-[#737373]'}`} />
            <span className="font-caption-mono text-[10px] tracking-tight">{item.label}</span>
          </Link>
        );
      })}

      {/* Admin Quick Add Transaction FAB */}
      {isAdmin && onOpenAddTransaction && (
        <button
          onClick={onOpenAddTransaction}
          className="flex flex-col items-center justify-center -mt-5"
          aria-label="Add transaction"
        >
          <div className="w-12 h-12 rounded-full bg-[#ffffff] text-black shadow-lg shadow-white/10 flex items-center justify-center active:scale-90 transition-transform">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="font-caption-mono text-[9px] text-[#a1a1a1] mt-0.5 font-semibold">
            + Transaksi
          </span>
        </button>
      )}

      {navItems.slice(isAdmin ? 2 : 3).map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-all active:scale-95 ${
              isActive ? 'text-[#ffffff] font-bold' : 'text-[#737373] hover:text-[#a1a1a1]'
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-[#0070f3]' : 'text-[#737373]'}`} />
            <span className="font-caption-mono text-[10px] tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};
