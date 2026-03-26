'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LogOut, Crown, Star, Menu, X, ChevronDown,
  BarChart3, PieChart, TrendingUp,
  Calendar, History, Coins,
  Search, Trophy, Flame,
  LineChart, RefreshCw, Shield, Zap,
} from 'lucide-react';
import { useApp } from '@/components/AppContext';
import HeaderSearch from '@/components/HeaderSearch';
import UserAvatar from '@/components/UserAvatar';

const NAV = [
  {
    id: 'portfolio',
    label: '포트폴리오',
    color: '#06b6d4',
    desc: '내 포트폴리오 관리',
    sub: [
      { icon: BarChart3, label: '보유종목 리스트', desc: '종목별 현황과 수익률 확인', href: '/dashboard' },
      { icon: PieChart,  label: '비중 그래프',    desc: '자산 배분 도넛 차트',       href: '/dashboard' },
      { icon: TrendingUp,label: '수익률 대시보드',desc: '전체 포트폴리오 성과 요약',  href: '/dashboard' },
    ],
  },
  {
    id: 'dividend',
    label: '배당',
    color: '#10b981',
    desc: '배당 일정·수익 분석',
    sub: [
      { icon: Calendar,  label: '월별 배당 캘린더', desc: '월별 배당 수령 일정',     href: '/dashboard' },
      { icon: History,   label: '배당 히스토리',    desc: '보유 종목 배당 내역',     href: '/dashboard' },
      { icon: Coins,     label: '예상 배당금',      desc: '연간·월간 예상 수익 계산', href: '/dashboard' },
    ],
  },
  {
    id: 'explore',
    label: '종목탐색',
    color: '#a855f7',
    desc: 'ETF·주식 탐색',
    sub: [
      { icon: Search,  label: 'ETF / 주식 검색', desc: '국내외 종목 빠른 검색',    href: '/watchlist' },
      { icon: Trophy,  label: '배당률 순위',      desc: '고배당 종목 랭킹',         href: '/watchlist/dividend-ranking' },
      { icon: Flame,   label: '인기 종목',        desc: '거래량·시가총액 기준 TOP',  href: '/watchlist/popular-stocks' },
    ],
  },
  {
    id: 'analysis',
    label: '분석',
    color: '#f59e0b',
    badge: 'BETA',
    desc: '심층 포트폴리오 분석',
    sub: [
      { icon: Zap,        label: '단기투자',        desc: '단타 전략 종목 스크리너',  href: '/analysis/short-term' },
      { icon: LineChart,  label: '포트폴리오 분석', desc: '수익·손실 심층 분석',      href: '#soon', badge: '준비중' },
      { icon: RefreshCw, label: '리밸런싱 전략',   desc: '최적 비중 자동 추천',       href: '#soon', badge: '준비중' },
      { icon: Shield,    label: '리스크 분석',     desc: '변동성·리스크 측정',        href: '#soon', badge: '준비중' },
    ],
  },
];

export default function AppNavBar() {
  const { session, users, loaded, logout } = useApp();
  const pathname = usePathname();
  const me = users.find((u: any) => u.id === session?.userId);

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 페이지 이동 시 메뉴 닫기
  useEffect(() => { setMobileOpen(false); setOpenDropdown(null); }, [pathname]);

  const onEnter = (id: string) => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setOpenDropdown(id);
  };
  const onLeave = () => {
    leaveTimer.current = setTimeout(() => setOpenDropdown(null), 120);
  };

  const handleSoonClick = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <header className="sticky top-0 z-50 bg-[#07111f]/96 backdrop-blur-xl">
      {/* ── 상단 바 ── */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-14 gap-3">
          {/* 로고 */}
          <Link href="/" className="shrink-0 text-base sm:text-lg font-black tracking-tight text-white hover:opacity-90 transition no-underline">
            ChiChiFolio<span className="text-cyan-400">.</span>
          </Link>

          {/* 검색 (데스크탑) */}
          <div className="hidden sm:block flex-1 max-w-xs">
            <HeaderSearch />
          </div>

          {/* 오른쪽 버튼들 */}
          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            {loaded && session ? (
              me ? (
                <>
                  <Link href="/watchlist"
                    className="hidden sm:flex items-center gap-1.5 min-h-[36px] px-2 text-[12px] sm:text-[13px] font-medium text-slate-400 hover:text-cyan-400 transition touch-manipulation">
                    <Star className="w-3.5 h-3.5" />
                    <span>관심종목</span>
                  </Link>
                  <Link href="/profile"
                    className="flex items-center gap-1.5 rounded-full px-2 sm:px-2.5 py-1.5 text-[12px] sm:text-[13px] font-medium border transition min-h-[36px] touch-manipulation"
                    style={{ background: `${me.color}10`, borderColor: `${me.color}30` }}>
                    <UserAvatar userId={me.id} name={me.name} color={me.color} size={20} />
                    <span className="hidden sm:inline font-semibold" style={{ color: me.color }}>{me.name}</span>
                    {me.isAdmin && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                  </Link>
                  <button
                    onClick={logout}
                    className="p-2 text-slate-500 hover:text-slate-300 transition rounded-lg hover:bg-slate-800 min-h-[36px] flex items-center touch-manipulation"
                    title="로그아웃">
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <Link href="/profile" className="flex items-center gap-1.5 text-[12px] sm:text-[13px] font-medium text-slate-400 hover:text-cyan-400 transition px-2 min-h-[36px] touch-manipulation">
                    <Star className="w-3.5 h-3.5" />프로필
                  </Link>
                  <Link href="/dashboard" className="px-3 py-1.5 text-[12px] sm:text-[13px] font-medium text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition min-h-[36px] flex items-center touch-manipulation">
                    대시보드
                  </Link>
                  <button onClick={logout} className="p-2 text-slate-500 hover:text-slate-300 transition rounded-lg hover:bg-slate-800 min-h-[36px] flex items-center touch-manipulation">
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              )
            ) : (
              <>
                <Link href="/login"
                  className="px-3 py-1.5 text-[12px] sm:text-[13px] font-medium text-slate-300 border border-slate-700 rounded-lg hover:border-slate-500 hover:text-white transition min-h-[36px] flex items-center touch-manipulation">
                  로그인
                </Link>
                <Link href="/signup"
                  className="px-3 py-1.5 text-[12px] sm:text-[13px] font-semibold text-white bg-cyan-500 hover:bg-cyan-400 rounded-lg transition min-h-[36px] flex items-center touch-manipulation">
                  시작하기
                </Link>
              </>
            )}

            {/* 모바일 햄버거 */}
            <button
              className="sm:hidden p-2 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-800 min-h-[36px] flex items-center"
              onClick={() => setMobileOpen(v => !v)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── 카테고리 네비게이션 바 (데스크탑) ── */}
      <div className="hidden sm:block bg-slate-900/25 border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex items-center h-10 gap-0.5">
            {NAV.map(item => (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => onEnter(item.id)}
                onMouseLeave={onLeave}
              >
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all cursor-pointer"
                  style={{ color: openDropdown === item.id ? item.color : '#94a3b8', background: openDropdown === item.id ? `${item.color}12` : 'transparent' }}
                >
                  {item.label}
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${item.color}20`, color: item.color }}>
                      {item.badge}
                    </span>
                  )}
                  <ChevronDown className="w-3 h-3 transition-transform" style={{ transform: openDropdown === item.id ? 'rotate(180deg)' : 'none' }} />
                </button>

                {/* 드롭다운 패널 */}
                {openDropdown === item.id && (
                  <div
                    className="absolute top-full left-0 pt-1.5 z-[100]"
                    onMouseEnter={() => onEnter(item.id)}
                    onMouseLeave={onLeave}
                  >
                    <div style={{ background: '#0a1726', border: '1px solid #172a45', borderRadius: 18, boxShadow: '0 20px 60px rgba(0,0,0,0.6)', padding: 8, minWidth: 260 }}>
                      {/* 카테고리 헤더 */}
                      <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid #172a45', marginBottom: 6 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: item.color }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>{item.desc}</div>
                      </div>
                      {/* 서브 아이템 */}
                      {item.sub.map((s, i) => (
                        <Link
                          key={i}
                          href={s.href}
                          onClick={s.href === '#soon' ? handleSoonClick : () => setOpenDropdown(null)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '9px 12px', borderRadius: 12, transition: 'background .12s',
                            textDecoration: 'none', opacity: s.href === '#soon' ? 0.65 : 1,
                          }}
                          onMouseEnter={e => { if (s.href !== '#soon') (e.currentTarget as HTMLElement).style.background = '#122030'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: `${item.color}18` }}>
                            <s.icon style={{ width: 16, height: 16, color: item.color }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{s.label}</span>
                              {s.badge && (
                                <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 5, background: '#1e293b', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>{s.badge}</span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>{s.desc}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* ── 모바일 풀 메뉴 ── */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-slate-800 bg-[#07111f] max-h-[80vh] overflow-y-auto">
          {/* 모바일 검색 */}
          <div className="px-4 py-3 border-b border-slate-800">
            <HeaderSearch />
          </div>

          {/* 모바일 카테고리 아코디언 */}
          {NAV.map(item => (
            <div key={item.id} className="border-b border-slate-800/60">
              <button
                className="w-full flex items-center justify-between px-4 py-3.5 text-left touch-manipulation"
                onClick={() => setMobileExpanded(v => v === item.id ? null : item.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold" style={{ color: mobileExpanded === item.id ? item.color : '#cbd5e1' }}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${item.color}20`, color: item.color }}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <ChevronDown
                  className="w-4 h-4 transition-transform"
                  style={{ color: '#475569', transform: mobileExpanded === item.id ? 'rotate(180deg)' : 'none' }}
                />
              </button>

              {mobileExpanded === item.id && (
                <div className="pb-2 px-3">
                  {item.sub.map((s, i) => (
                    <Link
                      key={i}
                      href={s.href}
                      onClick={s.href === '#soon' ? handleSoonClick : () => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl touch-manipulation"
                      style={{ opacity: s.href === '#soon' ? 0.6 : 1, textDecoration: 'none' }}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: `${item.color}18` }}>
                        <s.icon style={{ width: 15, height: 15, color: item.color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{s.label}</span>
                          {s.badge && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: '#1e293b', color: '#64748b', fontWeight: 700 }}>{s.badge}</span>}
                        </div>
                        <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>{s.desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* 모바일 유저 영역 */}
          {loaded && !session && (
            <div className="flex gap-3 px-4 py-4">
              <Link href="/login" className="flex-1 text-center py-2.5 text-[13px] font-medium text-slate-300 border border-slate-700 rounded-xl hover:border-slate-500 transition" onClick={() => setMobileOpen(false)}>
                로그인
              </Link>
              <Link href="/signup" className="flex-1 text-center py-2.5 text-[13px] font-semibold text-white bg-cyan-500 hover:bg-cyan-400 rounded-xl transition" onClick={() => setMobileOpen(false)}>
                시작하기
              </Link>
            </div>
          )}
          {loaded && session && me && (
            <div className="flex items-center justify-between px-4 py-3.5 border-t border-slate-800">
              <Link href="/profile" className="flex items-center gap-3 touch-manipulation" onClick={() => setMobileOpen(false)}>
                <UserAvatar userId={me.id} name={me.name} color={me.color} size={36} />
                <div>
                  <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                    {me.name}
                    {me.isAdmin && <Crown className="w-3 h-3 text-amber-400" />}
                  </div>
                  <div className="text-[11px] text-slate-500">프로필 설정</div>
                </div>
              </Link>
              <button onClick={() => { logout(); setMobileOpen(false); }} className="text-slate-500 hover:text-red-400 transition p-2 touch-manipulation">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
