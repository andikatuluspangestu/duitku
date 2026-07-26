import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const session = getSession();
  if (session) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
