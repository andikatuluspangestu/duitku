import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { DashboardLayoutClient } from './DashboardLayoutClient';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = getSession();

  if (!session) {
    redirect('/login');
  }

  return <DashboardLayoutClient user={session}>{children}</DashboardLayoutClient>;
}
