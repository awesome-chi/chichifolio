'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  BarChart3, Coins, Globe, TrendingUp,
  ArrowLeftRight, ShieldCheck, Activity,
  Sparkles, Zap, ArrowRight, ChevronRight,
  LineChart, Search, PieChart,
} from 'lucide-react';
import { useApp } from '@/components/AppContext';
import AppNavBar from '@/components/AppNavBar';

/* ─── Mock data ──────────────────────────────── */
const STOCKS = [
  { symbol:"SPY", name:"S&P 500 ETF", price:"$587.42", change:"+0.21%", up:true },
  { symbol:"AAPL", name:"Apple Inc.", price:"$227.55", change:"+1.39%", up:true },
  { symbol:"NVDA", name:"NVIDIA", price:"$131.28", change:"+4.32%", up:true },
  { symbol:"MSFT", name:"Microsoft", price:"$424.73", change:"+0.69%", up:true },
  { symbol:"TSLA", name:"Tesla Inc.", price:"$272.04", change:"-2.93%", up:false },
  { symbol:"AMZN", name:"Amazon", price:"$204.37", change:"+0.87%", up:true },
  { symbol:"GOOG", name:"Alphabet", price:"$172.91", change:"+0.51%", up:true },
  { symbol:"삼성전자", name:"005930.KS", price:"₩58,200", change:"+1.04%", up:true },
  { symbol:"SK하이닉스", name:"000660.KS", price:"₩198,500", change:"+1.79%", up:true },
  { symbol:"QQQ", name:"Nasdaq 100", price:"$515.23", change:"+0.45%", up:true },
  { symbol:"META", name:"Meta", price:"$612.77", change:"+1.12%", up:true },
  { symbol:"BRK.B", name:"Berkshire", price:"$523.10", change:"+0.33%", up:true },
];

const SPARKS = [
  "M0,30 C10,28 20,22 30,25 C40,28 50,18 60,12 C70,8 80,10 90,5",
  "M0,25 C10,20 20,22 30,15 C40,12 50,18 60,10 C70,8 80,5 90,3",
  "M0,35 C10,30 20,25 30,20 C40,22 50,15 60,10 C70,5 80,8 90,2",
  "M0,28 C10,25 20,20 30,22 C40,18 50,15 60,12 C70,10 80,8 90,5",
  "M0,8 C10,12 20,15 30,20 C40,18 50,25 60,28 C70,30 80,32 90,35",
  "M0,30 C10,25 20,28 30,20 C40,15 50,18 60,12 C70,8 80,5 90,3",
  "M0,25 C10,22 20,18 30,20 C40,15 50,12 60,10 C70,8 80,6 90,5",
  "M0,32 C10,28 20,30 30,22 C40,18 50,15 60,12 C70,10 80,5 90,3",
  "M0,35 C10,30 20,25 30,18 C40,15 50,12 60,8 C70,10 80,5 90,2",
  "M0,28 C10,25 20,22 30,18 C40,20 50,15 60,10 C70,8 80,5 90,3",
  "M0,30 C10,25 20,20 30,18 C40,15 50,12 60,10 C70,8 80,5 90,4",
  "M0,25 C10,22 20,20 30,18 C40,15 50,12 60,10 C70,8 80,6 90,5",
];

const features = [
  { icon: BarChart3, title: "실시간 포트폴리오", desc: "미국·한국 주식을 한눈에 관리하고 수익률을 실시간 추적하세요" },
  { icon: Coins, title: "배당금 분석", desc: "종목별 배당금, 배당주기, 연간 예상 수입을 자동으로 분석합니다" },
  { icon: Globe, title: "환율 자동 반영", desc: "USD/KRW 실시간 환율이 적용되어 원화·달러 전환이 자유롭습니다" },
  { icon: Search, title: "AI 종목 검색", desc: "Finnhub API 기반 실시간 주가, 배당 정보, 종목명을 자동 조회합니다" },
  { icon: ArrowLeftRight, title: "포트폴리오 비교", desc: "여러 포트폴리오의 수익률과 비중을 한눈에 비교할 수 있습니다" },
  { icon: ShieldCheck, title: "안전한 데이터", desc: "모든 데이터는 브라우저에 안전하게 저장되며 외부로 전송되지 않습니다" },
];

const stats = [
  { icon: Activity, value: "실시간", label: "주가 조회", delay: "0s" },
  { icon: ArrowLeftRight, value: "USD/KRW", label: "환율 자동 반영", delay: "0.1s" },
  { icon: Sparkles, value: "AI", label: "종목 검색", delay: "0.2s" },
  { icon: Zap, value: "100%", label: "무료 이용", delay: "0.3s" },
];

/* ─── TradingView Ticker Tape ────────────────── */
function TradingViewTicker() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = '';
    const w = document.createElement('div');
    w.className = 'tradingview-widget-container__widget';
    const s = document.createElement('script');
    s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    s.type = 'text/javascript';
    s.async = true;
    s.textContent = JSON.stringify({
      symbols: [
        { proName:"FOREXCOM:SPXUSD", title:"S&P 500" },
        { proName:"FOREXCOM:NSXUSD", title:"US 100" },
        { proName:"NASDAQ:AAPL", title:"Apple" },
        { proName:"NASDAQ:NVDA", title:"NVIDIA" },
        { proName:"NASDAQ:MSFT", title:"Microsoft" },
        { proName:"NASDAQ:TSLA", title:"Tesla" },
        { proName:"NASDAQ:AMZN", title:"Amazon" },
        { proName:"NASDAQ:GOOG", title:"Google" },
        { proName:"FX:USDKRW", title:"USD/KRW" },
        { proName:"KRX:005930", title:"삼성전자" },
        { proName:"KRX:000660", title:"SK하이닉스" },
      ],
      showSymbolLogo: true,
      colorTheme: "dark",
      isTransparent: true,
      displayMode: "adaptive",
      locale: "kr"
    });
    el.appendChild(w);
    el.appendChild(s);
    return () => { el.innerHTML = ''; };
  }, []);
  return <div ref={ref} className="tradingview-widget-container" />;
}

/* ─── TradingView Advanced Chart ─────────────── */
function TradingViewChart() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = '';
    const w = document.createElement('div');
    w.className = 'tradingview-widget-container__widget';
    w.style.height = 'calc(100% - 32px)';
    w.style.width = '100%';
    const s = document.createElement('script');
    s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    s.type = 'text/javascript';
    s.async = true;
    s.textContent = JSON.stringify({
      autosize: true,
      symbol: "AMEX:SPY",
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "3",
      locale: "kr",
      backgroundColor: "rgba(7, 17, 31, 1)",
      gridColor: "rgba(23, 42, 69, 0.06)",
      hide_side_toolbar: true,
      allow_symbol_change: true,
      save_image: false,
      calendar: false,
      hide_volume: true,
      support_host: "https://www.tradingview.com"
    });
    el.appendChild(w);
    el.appendChild(s);
    return () => { el.innerHTML = ''; };
  }, []);
  return <div ref={ref} className="tradingview-widget-container h-full w-full" />;
}

/* ─── Sparkline SVG ──────────────────────────── */
function Sparkline({ path, up }: { path: string; up: boolean }) {
  const color = up ? '#10b981' : '#ef4444';
  return (
    <svg viewBox="0 0 90 40" className="w-[72px] h-8 shrink-0">
      <defs>
        <linearGradient id={`sp-${up?'g':'r'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={path + " L90,40 L0,40 Z"} fill={`url(#sp-${up?'g':'r'})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Area Chart Preview ─────────────────────── */
function AreaChartPreview() {
  const pts = "M0,90 C30,85 50,75 80,72 C110,69 130,78 160,65 C190,52 210,45 240,38 C270,32 300,25 330,18 C360,12 385,8 400,5";
  return (
    <svg viewBox="0 0 400 100" className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={pts + " L400,100 L0,100 Z"} fill="url(#areaGrad)" />
      <path d={pts} fill="none" stroke="#06b6d4" strokeWidth="2" />
      {[[0,90],[80,72],[160,65],[240,38],[330,18],[400,5]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#06b6d4" />
      ))}
    </svg>
  );
}

/* ─── Donut Preview ──────────────────────────── */
function DonutPreview() {
  const segs = [
    { pct:30, color:"#06b6d4", label:"NVDA" },
    { pct:25, color:"#3b82f6", label:"AAPL" },
    { pct:20, color:"#f59e0b", label:"SPY" },
    { pct:15, color:"#a855f7", label:"삼성" },
    { pct:10, color:"#ec4899", label:"TSLA" },
  ];
  const circ = 2 * Math.PI * 35;
  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-24 h-24 shrink-0">
        {segs.map((seg, i) => {
          const len = (seg.pct / 100) * circ;
          const o = offset;
          offset += seg.pct;
          return <circle key={i} cx="50" cy="50" r="35" fill="none" stroke={seg.color} strokeWidth="10" strokeDasharray={`${len} ${circ}`} strokeDashoffset={-(o/100)*circ} transform="rotate(-90 50 50)" />;
        })}
        <text x="50" y="48" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="800">5종목</text>
        <text x="50" y="60" textAnchor="middle" fill="#64748b" fontSize="7">포트폴리오</text>
      </svg>
      <div className="flex flex-col gap-1">
        {segs.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: seg.color }} />
            <span className="text-slate-500 w-8">{seg.label}</span>
            <span className="text-white font-semibold tabular-nums">{seg.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Landing Page ──────────────────────── */
export default function LandingPage() {
  const { session, loaded, logout } = useApp();

  return (
    <div className="min-h-screen bg-surface text-slate-200">

      {/* ── Navbar (로고 · 검색 정중앙 · 관심종목 · 닉네임) ───── */}
      <AppNavBar />

      {/* ── Hero ────────────────────────────── */}
      <section className="max-w-2xl mx-auto text-center px-4 sm:px-6 pt-10 sm:pt-20 pb-10 sm:pb-12 animate-fade-up">
        <div className="inline-flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1 sm:px-4 sm:py-1.5 mb-6 sm:mb-8">
          <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-[11px] sm:text-xs font-semibold text-cyan-400 tracking-wide">개인 자산관리 대시보드</span>
        </div>

        <h1 className="text-[clamp(22px,5vw,48px)] sm:text-[clamp(28px,5vw,48px)] font-black leading-[1.2] tracking-tight text-white mb-4 sm:mb-5">
          나의 투자 포트폴리오를<br />
          <span className="text-gradient">한눈에 관리하세요</span>
        </h1>

        <p className="text-[13px] sm:text-[15px] text-slate-400 leading-relaxed mb-8 sm:mb-10 max-w-lg mx-auto px-1">
          미국·한국 주식, 실시간 환율, 배당금 분석까지.<br />
          AI 기반 포트폴리오 관리 서비스를 무료로 이용하세요.
        </p>

        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          {loaded && session ? (
            <Link href="/dashboard"
              className="group flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-xl px-6 sm:px-7 py-3 min-h-[48px] text-[14px] sm:text-[15px] shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-400/30 touch-manipulation">
              대시보드로 가기
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </Link>
          ) : (
            <>
              <Link href="/signup"
                className="group flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-xl px-6 sm:px-7 py-3 min-h-[48px] text-[14px] sm:text-[15px] shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-400/30 touch-manipulation">
                무료로 시작하기
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </Link>
              <Link href="/login"
                className="flex items-center justify-center gap-1.5 border border-line hover:border-slate-600 text-slate-400 hover:text-white font-medium rounded-xl px-5 sm:px-6 py-3 min-h-[48px] text-[14px] sm:text-[15px] transition-all touch-manipulation">
                이미 계정이 있으신가요?
                <ChevronRight className="w-4 h-4 shrink-0" />
              </Link>
            </>
          )}
        </div>
      </section>

      {/* ── Ticker Tape ─────────────────────── */}
      <section className="border-y border-line">
        <TradingViewTicker />
      </section>

      {/* ── Market Section ──────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">실시간 시장</span>
        </div>

        <div className="market-row">
          {/* Chart */}
          <div className="market-chart glass-card !rounded-2xl !p-0 overflow-hidden">
            <TradingViewChart />
          </div>

          {/* Scrolling stock list */}
          <div className="market-stocks glass-card !rounded-2xl !p-0 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-line">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">주요 종목</span>
              <span className="text-[10px] text-slate-600">실시간</span>
            </div>
            <div className="flex-1 overflow-hidden relative">
              <div className="absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-surface-card to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-surface-card to-transparent z-10 pointer-events-none" />
              <div className="animate-scroll-up">
                {[...STOCKS, ...STOCKS].map((st, i) => (
                  <div key={i} className="flex items-center px-3 py-2 gap-2 border-b border-line-subtle">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-bold text-xs text-cyan-400">{st.symbol}</span>
                        <span className="text-[9px] text-slate-600 truncate">{st.name}</span>
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-xs font-semibold text-white tabular-nums">{st.price}</span>
                        <span className={`text-[10px] font-semibold tabular-nums ${st.up ? 'text-emerald-400' : 'text-red-400'}`}>
                          {st.change}
                        </span>
                      </div>
                    </div>
                    <Sparkline path={SPARKS[i % SPARKS.length]} up={st.up} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────── */}
      <section className="flex justify-center gap-6 sm:gap-12 px-6 pb-12 flex-wrap">
        {stats.map((s, i) => (
          <div key={i} className="text-center animate-fade-up" style={{ animationDelay: s.delay }}>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/15 mx-auto mb-3">
              <s.icon className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-cyan-400 tabular-nums">{s.value}</div>
            <div className="text-[11px] text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── Dashboard Preview ───────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-[clamp(20px,3vw,28px)] font-extrabold text-white mb-2">대시보드 & 분석</h2>
          <p className="text-sm text-slate-500">포트폴리오 현황과 수익률을 한눈에 파악하세요</p>
        </div>

        <div className="glass-card overflow-hidden bg-gradient-to-br from-surface-card to-[#0a1829]">
          {/* Window chrome */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-line">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
            <span className="text-[11px] text-slate-600 ml-2">ChiChiFolio Dashboard</span>
            <div className="ml-auto flex gap-1.5">
              <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 font-semibold">
                <BarChart3 className="w-3 h-3" /> 대시보드
              </span>
              <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-md border border-line text-slate-500">
                <LineChart className="w-3 h-3" /> 분석
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4">
            {[
              { label:"총 투자 원금", value:"₩12,450,000", color:"text-white" },
              { label:"현재 총 가치", value:"₩15,280,000", color:"text-white" },
              { label:"평가 손익", value:"+₩2,830,000", color:"text-emerald-400" },
              { label:"수익률", value:"+22.73%", color:"text-emerald-400" },
            ].map((item, i) => (
              <div key={i} className="bg-surface-hover rounded-xl px-3 py-2.5 animate-fade-up" style={{ animationDelay: `${0.3 + i * 0.08}s` }}>
                <div className="text-[9px] font-semibold text-slate-600 uppercase tracking-wide mb-1">{item.label}</div>
                <div className={`text-sm sm:text-base font-bold tabular-nums ${item.color}`}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="flex flex-col lg:flex-row gap-3 px-4 pb-4">
            {/* Area chart */}
            <div className="flex-[3] bg-surface-hover rounded-xl p-4 flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">포트폴리오 성장 추이</span>
                <div className="flex gap-1">
                  {["1M","3M","6M","1Y"].map((p, i) => (
                    <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded font-semibold cursor-pointer transition ${i===3 ? 'bg-cyan-500/15 text-cyan-400' : 'text-slate-600 hover:text-slate-400'}`}>{p}</span>
                  ))}
                </div>
              </div>
              <div className="flex-1 min-h-[100px]">
                <AreaChartPreview />
              </div>
              <div className="flex justify-between mt-2">
                {["3월","5월","7월","9월","11월","1월"].map((m, i) => (
                  <span key={i} className="text-[9px] text-slate-600">{m}</span>
                ))}
              </div>
            </div>

            {/* Donut chart */}
            <div className="flex-[2] bg-surface-hover rounded-xl p-4 flex flex-col min-w-0">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-4">종목 비중</div>
              <div className="flex-1 flex items-center justify-center">
                <DonutPreview />
              </div>
              <div className="flex gap-2 mt-4">
                {[
                  { label:"배당 수익", value:"₩840K", color:"text-emerald-400" },
                  { label:"월평균", value:"₩70K", color:"text-cyan-400" },
                ].map((item, i) => (
                  <div key={i} className="flex-1 bg-surface-card rounded-lg px-3 py-2 text-center">
                    <div className="text-[8px] text-slate-600 mb-0.5">{item.label}</div>
                    <div className={`text-xs font-bold tabular-nums ${item.color}`}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-[clamp(20px,3vw,28px)] font-extrabold text-white mb-2">강력한 기능</h2>
          <p className="text-sm text-slate-500">투자 관리에 필요한 모든 것을 제공합니다</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i}
              className="group glass-card p-5 hover:border-cyan-500/30 hover:-translate-y-1 transition-all duration-200 animate-fade-up"
              style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center mb-4 group-hover:bg-cyan-500/15 transition">
                <f.icon className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-[15px] font-bold text-white mb-2">{f.title}</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────── */}
      <section className="text-center px-6 py-16 bg-gradient-to-t from-cyan-500/5 to-transparent">
        {loaded && session ? (
          <>
            <h2 className="text-[clamp(20px,3vw,28px)] font-extrabold text-white mb-3">포트폴리오 관리하러 가기</h2>
            <p className="text-sm text-slate-500 mb-8">대시보드에서 포트폴리오를 확인하세요</p>
            <Link href="/dashboard"
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-xl px-8 py-3 text-base shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-400/30">
              대시보드로 가기
              <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        ) : (
          <>
            <h2 className="text-[clamp(20px,3vw,28px)] font-extrabold text-white mb-3">지금 바로 시작하세요</h2>
            <p className="text-sm text-slate-500 mb-8">30초 회원가입으로 나만의 포트폴리오를 관리하세요</p>
            <Link href="/signup"
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-xl px-8 py-3 text-base shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-400/30">
              무료 회원가입
              <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        )}
      </section>

      {/* ── Footer ──────────────────────────── */}
      <footer className="border-t border-line px-6 py-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-[11px] text-slate-600">© 2026 ChiChiFolio. All rights reserved.</span>
          <div className="flex items-center gap-4 text-[11px] text-slate-600">
            <Link href="/watchlist" className="hover:text-slate-400 transition">관심종목</Link>
            {loaded && session ? (
              <>
                <Link href="/dashboard" className="hover:text-slate-400 transition">대시보드</Link>
                <button onClick={logout} className="hover:text-slate-400 transition cursor-pointer bg-transparent border-none p-0 text-inherit font-inherit">로그아웃</button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-slate-400 transition">로그인</Link>
                <Link href="/signup" className="hover:text-slate-400 transition">회원가입</Link>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* ── Inline styles for market layout (Tailwind can't do everything in static export) ── */}
      <style>{`
        .market-row { display:flex; gap:12px; height:380px; }
        .market-chart { flex:1 1 65%; min-width:0; }
        .market-stocks { flex:1 1 30%; min-width:220px; }
        .market-chart .tradingview-widget-container { height:100% !important; }
        .market-chart iframe { width:100% !important; height:100% !important; }
        @media (max-width:768px) {
          .market-row { flex-direction:column; height:auto; gap:10px; }
          .market-chart { height:56vw; min-height:260px; max-height:360px; width:100%; }
          .market-stocks { min-width:0; max-height:280px; }
        }
        @media (max-width:480px) {
          .market-chart { height:62vw; min-height:240px; max-height:320px; }
          .market-stocks { max-height:220px; }
        }
      `}</style>
    </div>
  );
}
