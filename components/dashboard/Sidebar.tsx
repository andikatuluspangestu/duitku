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
  User,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Heart,
  PanelLeftClose,
  PanelLeftOpen,
  FilePlus,
  Database,
} from 'lucide-react';
import { UserSession } from '@/lib/types';

interface SidebarProps {
  user: UserSession;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}) => {
  const pathname = usePathname();
  const isSuperadmin = user.role === 'SUPERADMIN';
  const isAdmin = user.role === 'ADMIN';
  const userPerms = user.permissions;

  // Strict Permission Check for Menu Visibility
  const hasPerm = (permKey: string) => {
    if (isSuperadmin) return true;
    if (Array.isArray(userPerms)) {
      return userPerms.includes(permKey);
    }
    // Default fallback if permissions array is not set
    if (isAdmin) {
      return permKey !== 'can_manage_users';
    }
    return ['can_view_dashboard', 'can_view_transactions', 'can_view_categories'].includes(permKey);
  };

  const menuGroups = [
    {
      label: 'UMUM',
      items: [
        { label: 'Dashboard Kas', icon: LayoutDashboard, href: '/dashboard', show: hasPerm('can_view_dashboard') },
      ],
    },
    {
      label: 'TRANSAKSI',
      items: [
        { label: 'Riwayat Transaksi', icon: ReceiptText, href: '/transactions', show: hasPerm('can_view_transactions') },
        { label: 'Input Transaksi', icon: FilePlus, href: '/transactions/create', show: hasPerm('can_manage_transactions') },
      ],
    },
    {
      label: 'MASTER',
      items: [
        { label: 'Kategori Transaksi', icon: FolderTree, href: '/categories', show: hasPerm('can_view_categories') },
        { label: 'Manajemen Pengguna', icon: Users, href: '/users', show: hasPerm('can_manage_users') },
      ],
    },
    {
      label: 'LAPORAN',
      items: [
        { label: 'Export Laporan', icon: FileSpreadsheet, href: '/reports', show: hasPerm('can_export_reports') },
      ],
    },
    {
      label: 'SISTEM',
      items: [
        { label: 'Audit Log Sistem', icon: History, href: '/audit-log', show: hasPerm('can_view_audit_logs') },
        { label: 'Backup & Restore', icon: Database, href: '/backup', show: isSuperadmin },
      ],
    },
    {
      label: 'AKUN',
      items: [
        { label: 'Profil Saya', icon: User, href: '/profile', show: true },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Vercel Design System Adaptive Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full bg-[#ffffff] dark:bg-[#0a0a0a] border-r border-[#ebebeb] dark:border-[#262626] flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'lg:w-16' : 'lg:w-64'} w-64`}
      >
        {/* Brand Header */}
        <div
          className={`h-16 border-b border-[#ebebeb] dark:border-[#262626] flex items-center justify-between ${
            isCollapsed ? 'lg:px-0 lg:justify-center px-6' : 'px-6'
          }`}
        >
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="flex flex-col">
                <span className="font-extrabold text-[#171717] dark:text-[#ffffff] text-lg tracking-tight">
                  UangKasir<span className="text-[#0070f3]">.</span>
                </span>
                <span className="font-caption-mono text-[10px] text-[#888888] dark:text-[#737373] uppercase tracking-wider whitespace-nowrap">
                  Kas Keuangan
                </span>
              </div>
            </Link>
          )}

          {/* Desktop Collapse Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className={`hidden lg:flex p-2 rounded-md text-[#4d4d4d] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ffffff] hover:bg-[#fafafa] dark:hover:bg-[#171717] transition-colors ${
              isCollapsed ? 'mx-auto' : ''
            }`}
            title={isCollapsed ? 'Buka Sidebar' : 'Tutup Sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Status Akses */}
        <div
          className={`py-3 border-b border-[#ebebeb] dark:border-[#262626] bg-[#fafafa] dark:bg-[#000000] px-6 ${
            isCollapsed ? 'lg:px-2 lg:text-center' : ''
          }`}
        >
          {/* Collapsed view icon on desktop */}
          {isCollapsed && (
            <div className="hidden lg:flex justify-center" title={`Role: ${user.role}`}>
              {isSuperadmin ? (
                <ShieldAlert className="w-4 h-4 text-[#ff0080]" />
              ) : isAdmin ? (
                <ShieldCheck className="w-4 h-4 text-[#0070f3]" />
              ) : (
                <Eye className="w-4 h-4 text-[#f5a623]" />
              )}
            </div>
          )}

          {/* Expanded view */}
          <div className={`flex items-center justify-between ${isCollapsed ? 'lg:hidden' : ''}`}>
            <span className="font-caption-mono text-[11px] text-[#888888] dark:text-[#a1a1a1]">PERAN:</span>
            {isSuperadmin ? (
              <span className="vercel-badge-mono bg-[#ff0080]/10 text-[#ff0080] border-[#ff0080]/30 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                SUPERADMIN
              </span>
            ) : isAdmin ? (
              <span className="vercel-badge-mono bg-[#0070f3]/10 text-[#0070f3] border-[#0070f3]/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                ADMIN
              </span>
            ) : (
              <span className="vercel-badge-mono bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/30 flex items-center gap-1">
                <Eye className="w-3 h-3" />
                USER
              </span>
            )}
          </div>
        </div>

        {/* Menu Navigasi */}
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
          {menuGroups.map((group) => {
            const visibleItems = group.items.filter((i) => i.show);
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label} className="space-y-0.5">
                {!isCollapsed && (
                  <div className="px-3 pt-2 pb-1">
                    <span className="font-caption-mono text-[10px] text-[#888888] dark:text-[#737373] uppercase tracking-widest font-bold">
                      {group.label}
                    </span>
                  </div>
                )}
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      title={isCollapsed ? item.label : undefined}
                      className={`flex items-center gap-3 py-2.5 rounded-lg text-xs font-medium transition-colors duration-150 ${
                        isCollapsed ? 'lg:justify-center lg:px-0 px-3' : 'px-3'
                      } ${
                        isActive
                          ? 'bg-[#f5f5f5] dark:bg-[#171717] text-[#171717] dark:text-[#ffffff] border border-[#ebebeb] dark:border-[#333333] font-semibold'
                          : 'text-[#4d4d4d] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ffffff] hover:bg-[#fafafa] dark:hover:bg-[#171717]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#171717] dark:text-[#ffffff]' : 'text-[#888888] dark:text-[#737373]'}`} />
                      <span className={`${isCollapsed ? 'lg:hidden' : 'inline'}`}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer Custom Attribution */}
        <div className="p-4 border-t border-[#ebebeb] dark:border-[#262626] text-center bg-[#fafafa] dark:bg-[#000000]">
          {isCollapsed && (
            <div className="hidden lg:flex justify-center" title="Build with Love by Tulus">
              <Heart className="w-4 h-4 text-[#ee0000] fill-[#ee0000]" />
            </div>
          )}
          <p className={`font-caption-mono text-[10px] text-[#888888] dark:text-[#737373] flex items-center justify-center gap-1 whitespace-nowrap ${isCollapsed ? 'lg:hidden' : ''}`}>
            <span>Build with</span>
            <Heart className="w-3.5 h-3.5 text-[#ee0000] fill-[#ee0000] inline-block" />
            <span>by Tulus</span>
          </p>
        </div>
      </aside>
    </>
  );
};
