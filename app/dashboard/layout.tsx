'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/components/AppContext';
import { DashboardProvider, useDashboard } from '@/components/DashboardContext';
import { RefreshCw, LogOut, Star, Users, LayoutDashboard, BarChart3, ArrowLeftRight } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';

function DashboardHeader() {
  const { session, users, logout } = useApp();
  const { rate, refreshing, displayCcy, setDisplayCcy, doRefresh } = useDashboard();
  const router = useRouter();
  const me = users.find((u: any) => u.id === session?.userId);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#07111f]/95 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 sm:px-6 h-14 gap-3">
        <Link href="/" className="text-base font-black text-white tracking-tight shrink-0">
          ChiChiFolio<span className="text-cyan-400">.</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto flex-1 justify-end">
          <div className="hidden sm:flex items-center gap-1.5 text-xs shrink-0">
            <span className="text-slate-500">USD/KRW</span>
            <span className="tabular-nums font-bold text-cyan-400">{rate ? rate.toFixed(0) : '—'}</span>
          </div>
          <div className="flex items-center rounded-lg border border-slate-800 overflow-hidden bg-slate-900 shrink-0">
            {['KRW','USD'].map(c => (
              <button key={c} onClick={() => setDisplayCcy(c)}
                className="px-2.5 py-1.5 text-xs font-medium border-none cursor-pointer transition-all"
                style={{ background: displayCcy === c ? '#06b6d4' : 'transparent', color: displayCcy === c ? '#fff' : '#64748b' }}>
                {c === 'KRW' ? '₩ 원' : '$ 달러'}
              </button>
            ))}
          </div>
          <button onClick={() => doRefresh()} disabled={refreshing}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-500 hover:border-slate-600 transition disabled:opacity-50 shrink-0">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">{refreshing ? '갱신 중…' : '새로고침'}</span>
          </button>
          {me && (
            <Link href="/profile" className="flex items-center gap-2 shrink-0 hover:opacity-80 transition">
              <UserAvatar userId={me.id} name={me.name} color={me.color} size={28} />
              <span className="hidden sm:inline text-sm font-semibold" style={{ color: me.color }}>{me.name}</span>
            </Link>
          )}
          <button onClick={() => { logout(); router.push('/'); }} className="text-slate-500 hover:text-slate-300 transition p-1 shrink-0">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

function DashboardNav() {
  const { session, users } = useApp();
  const pathname = usePathname();
  const me = users.find((u: any) => u.id === session?.userId);
  const isAdmin = me?.isAdmin;

  const navItems = [
    { href: '/dashboard', label: '내 포트폴리오', icon: LayoutDashboard },
    { href: '/watchlist', label: '관심종목', icon: Star },
    ...(isAdmin ? [
      { href: '/dashboard/overview', label: '전체 현황', icon: BarChart3 },
      { href: '/dashboard/compare', label: '비교', icon: ArrowLeftRight },
      { href: '/dashboard/users', label: '사용자', icon: Users },
    ] : []),
  ];

  return (
    <>
      <nav className="hidden sm:flex items-center gap-1 px-4 sm:px-6 border-b border-slate-800 bg-slate-900/30 overflow-x-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className="flex items-center gap-2 px-3 py-3 text-[13px] font-medium border-b-2 transition-all shrink-0 whitespace-nowrap"
              style={{ color: active ? '#06b6d4' : '#64748b', borderBottomColor: active ? '#06b6d4' : 'transparent' }}>
              <Icon className="w-4 h-4" />{label}
            </Link>
          );
        })}
      </nav>
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#07111f] border-t border-slate-800 flex safe-area-pb">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-all touch-manipulation"
              style={{ color: active ? '#06b6d4' : '#475569' }}>
              <Icon className="w-5 h-5" />{label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function Guard({ children }: { children: React.ReactNode }) {
  const { session, loaded } = useApp();
  const router = useRouter();
  useEffect(() => { if (loaded && !session) router.replace('/login'); }, [loaded, session, router]);
  if (!loaded || !session) return <div className="min-h-screen bg-[#07111f] flex items-center justify-center text-cyan-400">불러오는 중…</div>;
  return <>{children}</>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <Guard>
        <div className="min-h-screen bg-[#07111f] text-slate-200 font-sans text-sm">
          <DashboardHeader />
          <DashboardNav />
          <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-8">
            {children}
          </main>
        </div>
      </Guard>
    </DashboardProvider>
  );
}
