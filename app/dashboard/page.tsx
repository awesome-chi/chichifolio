'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useApp, C } from '@/components/AppContext';

const Portfolio = dynamic(() => import('@/components/Portfolio'), { ssr: false });

export default function DashboardPage() {
  const { session, loaded } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (loaded && !session) {
      router.replace('/login');
    }
  }, [loaded, session, router]);

  if (!loaded || !session) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface text-cyan-400 font-sans">
        불러오는 중…
      </div>
    );
  }

  return <Portfolio />;
}
