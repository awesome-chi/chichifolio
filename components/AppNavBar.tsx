'use client';

import Link from 'next/link';
import { LogOut, Crown, Star } from 'lucide-react';
import { useApp } from '@/components/AppContext';
import HeaderSearch from '@/components/HeaderSearch';

export default function AppNavBar() {
  const { session, users, loaded, logout } = useApp();
  const me = users.find((u: { id: string }) => u.id === session?.userId);

  return (
    <nav className="max-w-6xl mx-auto flex items-center gap-2 sm:gap-3 h-11 sm:h-14 px-3 sm:px-6">
      <Link href="/" className="shrink-0 text-base sm:text-lg font-black tracking-tight text-white hover:opacity-90 transition no-underline">
        ChiChiFolio<span className="text-cyan-400">.</span>
      </Link>

      <HeaderSearch />

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {loaded && session ? (
          me ? (
            <>
              <Link href="/watchlist" className="flex items-center justify-center min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:gap-1.5 text-[12px] sm:text-[13px] font-medium text-slate-400 hover:text-cyan-400 transition px-2 py-2 sm:py-1 touch-manipulation">
                <Star className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">관심종목</span>
              </Link>
              <Link href="/dashboard"
                className="flex items-center gap-1.5 rounded-full px-2 sm:px-2.5 py-1.5 sm:py-1 text-[12px] sm:text-[13px] font-medium border border-line hover:border-slate-600 transition min-h-[44px] sm:min-h-0 touch-manipulation"
                style={{ background: `${me.color}10`, borderColor: `${me.color}30` }}>
                <div className="w-5 h-5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white shrink-0" style={{ background: me.color }}>{me.name[0]}</div>
                <span className="font-semibold hidden sm:inline" style={{ color: me.color }}>{me.name}</span>
                {me.isAdmin && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
              </Link>
              <button onClick={logout} className="p-2 sm:p-1.5 text-slate-500 hover:text-slate-300 transition rounded-lg hover:bg-surface-hover min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center touch-manipulation" title="로그아웃">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link href="/watchlist" className="flex items-center gap-1.5 text-[12px] sm:text-[13px] font-medium text-slate-400 hover:text-cyan-400 transition px-2 py-2 sm:py-1 min-h-[44px] sm:min-h-0 touch-manipulation">
                <Star className="w-3.5 h-3.5" />
                관심종목
              </Link>
              <Link href="/dashboard" className="px-3 sm:px-3.5 py-2 sm:py-1.5 text-[12px] sm:text-[13px] font-medium text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition min-h-[44px] sm:min-h-0 flex items-center touch-manipulation">
                대시보드
              </Link>
              <button onClick={logout} className="p-2 sm:p-1.5 text-slate-500 hover:text-slate-300 transition rounded-lg hover:bg-surface-hover min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center touch-manipulation" title="로그아웃">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )
        ) : (
          <>
            <Link href="/login"
              className="px-3 sm:px-3.5 py-2 sm:py-1.5 text-[12px] sm:text-[13px] font-medium text-slate-300 border border-line rounded-lg hover:border-slate-600 hover:text-white transition min-h-[44px] sm:min-h-0 flex items-center touch-manipulation">
              로그인
            </Link>
            <Link href="/signup"
              className="px-3 sm:px-3.5 py-2 sm:py-1.5 text-[12px] sm:text-[13px] font-semibold text-white bg-cyan-500 hover:bg-cyan-400 rounded-lg transition min-h-[44px] sm:min-h-0 flex items-center touch-manipulation">
              시작하기
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
