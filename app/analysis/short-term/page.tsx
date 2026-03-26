'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Zap, RefreshCw, TrendingUp, TrendingDown,
  ChevronDown, Activity, BarChart2, Crosshair, ShieldAlert,
} from 'lucide-react';
import AppNavBar from '@/components/AppNavBar';
import StockLogo from '@/components/StockLogo';
import StockDetailSheet from '@/components/StockDetailSheet';
import { C } from '@/components/AppContext';

// ─── Types ───────────────────────────────────────────────────
type ShortTermItem = {
  symbol: string;
  name: string;
  price: number | null;
  changePct: number | null;
  currency: string;
  volume: number | null;
  avgVolume: number | null;
  volRatio: number | null;
  gapPct: number | null;
  rsi: number | null;
  tags: string[];
  score: number;
};

type Market = 'all' | 'us' | 'kr';
type FilterKey = 'all' | 'volume2x' | 'volatility5' | 'gap' | 'rsi';

// ─── Market Status ────────────────────────────────────────────
type MStatus = 'pre' | 'open' | 'closed';

function getMarketStatus(): { us: MStatus; kr: MStatus } {
  const now = new Date();
  const dow = now.getUTCDay();
  if (dow === 0 || dow === 6) return { us: 'closed', kr: 'closed' };

  const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();

  // KR UTC+9
  const krMin = (utcMin + 9 * 60) % (24 * 60);
  let kr: MStatus;
  if (krMin >= 510 && krMin < 540) kr = 'pre';       // 8:30-9:00
  else if (krMin >= 540 && krMin < 930) kr = 'open'; // 9:00-15:30
  else kr = 'closed';

  // US EDT UTC-4 (after Mar 2nd Sun in Mar)
  const usMin = (utcMin - 4 * 60 + 24 * 60) % (24 * 60);
  let us: MStatus;
  if (usMin >= 240 && usMin < 570) us = 'pre';        // 4:00-9:30
  else if (usMin >= 570 && usMin < 960) us = 'open';  // 9:30-16:00
  else us = 'closed';

  return { us, kr };
}

// ─── Tag Config ───────────────────────────────────────────────
const TAG: Record<string, { color: string; bg: string; label: string }> = {
  갭상승:    { color: '#f97316', bg: 'rgba(249,115,22,0.15)',   label: '갭상승' },
  갭하락:    { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  label: '갭하락' },
  거래량급증: { color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',   label: '거래량↑↑' },
  급등:      { color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   label: '급등+5%' },
  급락:      { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', label: '급락-5%' },
  RSI과매도:  { color: '#a855f7', bg: 'rgba(168,85,247,0.15)', label: 'RSI↓30' },
  RSI과열:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'RSI↑70' },
};

// ─── Formatters ───────────────────────────────────────────────
function fmtPrice(price: number | null, currency: string) {
  if (price == null) return '—';
  if (currency === 'KRW') return `₩${Math.round(price).toLocaleString('ko-KR')}`;
  return `$${price.toFixed(2)}`;
}

function fmtVol(vol: number | null, currency: string) {
  if (vol == null) return '—';
  if (currency === 'KRW') {
    if (vol >= 1e12) return `${(vol / 1e12).toFixed(1)}조`;
    if (vol >= 1e8)  return `${(vol / 1e8).toFixed(1)}억`;
    if (vol >= 1e4)  return `${(vol / 1e4).toFixed(0)}만`;
    return vol.toLocaleString('ko-KR');
  }
  if (vol >= 1e9) return `${(vol / 1e9).toFixed(1)}B`;
  if (vol >= 1e6) return `${(vol / 1e6).toFixed(1)}M`;
  if (vol >= 1e3) return `${(vol / 1e3).toFixed(0)}K`;
  return vol.toLocaleString();
}

const isKR = (s: string) => /\.(KS|KQ)$/.test(s);

// ─── Sub-components ───────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-base">🥇</span>;
  if (rank === 2) return <span className="text-base">🥈</span>;
  if (rank === 3) return <span className="text-base">🥉</span>;
  return (
    <span className="text-[12px] font-bold tabular-nums text-slate-500 w-5 text-center">{rank}</span>
  );
}

function StatusDot({ status }: { status: MStatus }) {
  const color = status === 'open' ? '#22c55e' : status === 'pre' ? '#f59e0b' : '#475569';
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${status === 'open' ? 'animate-pulse' : ''}`}
      style={{ background: color }}
    />
  );
}

function RsiBar({ rsi }: { rsi: number | null }) {
  if (rsi == null) return <span className="text-[11px] text-slate-600">—</span>;
  const color = rsi < 30 ? '#a855f7' : rsi > 70 ? '#f59e0b' : '#64748b';
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-[12px] font-bold tabular-nums" style={{ color }}>{rsi.toFixed(0)}</span>
      <div className="w-14 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(rsi, 100)}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function ShortTermPage() {
  const [market, setMarket]         = useState<Market>('all');
  const [filter, setFilter]         = useState<FilterKey>('all');
  const [items, setItems]           = useState<ShortTermItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [detailItem, setDetailItem] = useState<ShortTermItem | null>(null);
  const [mktStatus, setMktStatus]   = useState(getMarketStatus());
  const [guideOpen, setGuideOpen]   = useState(false);

  const fetchData = useCallback(async (m: Market) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/short-term?market=${m}`);
      if (res.ok) {
        setItems(await res.json());
        setLastUpdated(
          new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        );
      }
    } catch { /* noop */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(market); }, [market, fetchData]);

  useEffect(() => {
    const t = setInterval(() => setMktStatus(getMarketStatus()), 30_000);
    return () => clearInterval(t);
  }, []);

  // ── 필터 적용
  const filtered = items
    .filter((item) => {
      if (filter === 'volume2x')    return (item.volRatio ?? 0) >= 2;
      if (filter === 'volatility5') return Math.abs(item.changePct ?? 0) >= 5;
      if (filter === 'gap')         return item.tags.includes('갭상승') || item.tags.includes('갭하락');
      if (filter === 'rsi')         return item.tags.includes('RSI과매도');
      return true;
    })
    .slice(0, 10);

  // ── 조건 충족 카운트 (전체 아이템 기준)
  const vol2xCount   = items.filter((i) => (i.volRatio ?? 0) >= 2).length;
  const vol5pctCount = items.filter((i) => Math.abs(i.changePct ?? 0) >= 5).length;
  const gapCount     = items.filter((i) => i.tags.includes('갭상승')).length;

  const anyOpen     = mktStatus.us === 'open' || mktStatus.kr === 'open';
  const anyPreMarket = mktStatus.us === 'pre'  || mktStatus.kr === 'pre';

  const modeTitle = anyOpen
    ? '지금 거래량 급증 종목 분석'
    : anyPreMarket
    ? '오늘 단타 가능성 높은 종목 TOP10'
    : '오늘 마감 데이터 · 내일 시장 준비';

  return (
    <div className="min-h-screen bg-surface text-slate-200 font-sans">
      <AppNavBar />
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* ── 헤더 ── */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <Zap className="w-5 h-5" style={{ color: '#ef4444' }} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-extrabold text-white">단기투자</h1>
            <p className="text-[12px] sm:text-[13px] text-slate-500">
              국내·해외 단타 전략 종목 스크리너
            </p>
          </div>
          <button
            onClick={() => fetchData(market)}
            className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-red-400 transition px-2 py-2 touch-manipulation"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {lastUpdated || '갱신'}
          </button>
        </div>

        {/* ── 마켓 상태 카드 ── */}
        <div
          className="rounded-2xl border mb-5 overflow-hidden"
          style={{ background: '#0a1626', borderColor: '#172a45' }}
        >
          {/* 모드 타이틀 */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b" style={{ borderColor: '#172a45' }}>
            <StatusDot status={anyOpen ? 'open' : anyPreMarket ? 'pre' : 'closed'} />
            <span className="text-[13px] font-bold text-white">{modeTitle}</span>
          </div>

          {/* 미국/국내 상태 */}
          <div className="grid grid-cols-2 divide-x" style={{ borderColor: '#172a45' }}>
            {[
              {
                label: '미국장',
                status: mktStatus.us,
                text: { open: '개장중', pre: '프리마켓', closed: '종료' }[mktStatus.us],
                detail: 'NYSE/NASDAQ · 9:30–16:00 EDT',
              },
              {
                label: '국내장',
                status: mktStatus.kr,
                text: { open: '개장중', pre: '장전', closed: '종료' }[mktStatus.kr],
                detail: 'KRX · 9:00–15:30 KST',
              },
            ].map(({ label, status, text, detail }) => (
              <div key={label} className="px-4 py-3" style={{ borderColor: '#172a45' }}>
                <div className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-1">{label}</div>
                <div className="flex items-center gap-1.5">
                  <StatusDot status={status} />
                  <span
                    className="text-[13px] font-bold"
                    style={{
                      color:
                        status === 'open' ? '#22c55e' :
                        status === 'pre'  ? '#f59e0b' : '#475569',
                    }}
                  >
                    {text}
                  </span>
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">{detail}</div>
              </div>
            ))}
          </div>

          {/* 조건 충족 요약 */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 border-t flex-wrap"
            style={{ borderColor: '#172a45', background: '#071220' }}
          >
            <span className="text-[11px] text-slate-600 shrink-0">현재 스크리닝:</span>
            {[
              { label: `거래량 2배↑ ${vol2xCount}종목`, active: vol2xCount > 0, color: '#06b6d4' },
              { label: `변동성 5%↑ ${vol5pctCount}종목`, active: vol5pctCount > 0, color: '#ef4444' },
              { label: `갭상승 ${gapCount}종목`, active: gapCount > 0, color: '#f97316' },
            ].map(({ label, active, color }) => (
              <span
                key={label}
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: active ? `${color}20` : '#1e293b',
                  color: active ? color : '#475569',
                  border: `1px solid ${active ? `${color}40` : 'transparent'}`,
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* ── 단타 전략 가이드 (아코디언) ── */}
        <div
          className="rounded-2xl border mb-5 overflow-hidden"
          style={{ background: '#0a1626', borderColor: '#172a45' }}
        >
          <button
            className="w-full flex items-center justify-between px-4 py-3 touch-manipulation"
            onClick={() => setGuideOpen((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: '#ef4444' }} />
              <span className="text-[13px] font-bold text-white">단타 3대 원칙 · 스크리닝 조건</span>
            </div>
            <ChevronDown
              className="w-4 h-4 transition-transform text-slate-500"
              style={{ transform: guideOpen ? 'rotate(180deg)' : 'none' }}
            />
          </button>

          {guideOpen && (
            <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: '#172a45' }}>
              {/* 원칙 3개 */}
              {[
                {
                  icon: BarChart2,
                  color: '#06b6d4',
                  title: '종목 선택',
                  items: [
                    '조건1 — 거래량이 평균 대비 2배 이상',
                    '조건2 — 하루 변동률 ±5% 이상',
                    '조건3 — 뉴스·실적·AI·금리 이슈 모멘텀',
                  ],
                },
                {
                  icon: Crosshair,
                  color: '#f97316',
                  title: '진입 타이밍',
                  items: [
                    '갭상승 + 거래량 급증 → 첫 눌림목 반등 진입',
                    'RSI 30 이하 과매도 → 반등 신호 확인 후 진입',
                    '시가 대비 +3% 돌파 → 모멘텀 추종 진입',
                  ],
                },
                {
                  icon: ShieldAlert,
                  color: '#ef4444',
                  title: '손절 규칙',
                  items: [
                    '진입가 기준 -3% 이탈 시 즉시 손절',
                    '목표 수익: +6%~+10% 분할 매도',
                    '시가 갭 채움 후 추가 하락 시 재진입 금지',
                  ],
                },
              ].map(({ icon: Icon, color, title, items }) => (
                <div
                  key={title}
                  className="rounded-xl p-3 mt-3"
                  style={{ background: `${color}08`, border: `1px solid ${color}20` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                    <span className="text-[12px] font-extrabold" style={{ color }}>{title}</span>
                  </div>
                  <ul className="space-y-1">
                    {items.map((t) => (
                      <li key={t} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                        <span className="mt-0.5 shrink-0" style={{ color }}>›</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* 뉴스 모멘텀 안내 */}
              <div
                className="rounded-xl p-3 text-[11px] text-slate-500"
                style={{ background: '#0d1f35', border: '1px solid #172a45' }}
              >
                💡 뉴스·실적 이슈는 자동 스크리닝이 어렵습니다. 거래량 급증 종목은 반드시
                뉴스·공시를 직접 확인하세요. (네이버증권, 전자공시 DART, Yahoo Finance)
              </div>
            </div>
          )}
        </div>

        {/* ── 시장 탭 ── */}
        <div
          className="flex gap-1.5 mb-3 rounded-xl p-1 border"
          style={{ background: 'rgba(15,30,50,0.5)', borderColor: '#172a45' }}
        >
          {(['all', 'us', 'kr'] as Market[]).map((m) => (
            <button
              key={m}
              onClick={() => setMarket(m)}
              className="flex-1 py-2 rounded-lg text-[13px] font-semibold transition touch-manipulation"
              style={{
                background: market === m ? 'rgba(239,68,68,0.15)' : 'transparent',
                color:      market === m ? '#ef4444' : '#64748b',
                border:     market === m ? '1px solid rgba(239,68,68,0.3)' : '1px solid transparent',
              }}
            >
              {{ all: '전체', us: '미국', kr: '국내' }[m]}
            </button>
          ))}
        </div>

        {/* ── 조건 필터 ── */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {[
            { key: 'all',          label: '전체' },
            { key: 'volume2x',     label: '거래량 2배↑' },
            { key: 'volatility5',  label: '변동성 5%↑' },
            { key: 'gap',          label: '갭상승' },
            { key: 'rsi',          label: 'RSI과매도' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as FilterKey)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition border touch-manipulation"
              style={{
                background:   filter === key ? 'rgba(239,68,68,0.15)' : 'transparent',
                color:        filter === key ? '#ef4444' : '#64748b',
                borderColor:  filter === key ? 'rgba(239,68,68,0.35)' : '#1e293b',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── 종목 리스트 ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <span
              className="inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#ef4444', borderTopColor: 'transparent' }}
            />
            <p className="text-slate-500 text-sm">스크리닝 중…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed flex flex-col items-center justify-center py-14 px-4 text-center"
            style={{ borderColor: '#172a45', background: 'rgba(15,30,50,0.5)' }}
          >
            <Zap className="w-10 h-10 text-slate-700 mb-3" />
            <p className="text-slate-500 text-sm">조건에 맞는 종목이 없습니다</p>
            <p className="text-slate-600 text-xs mt-1">필터를 변경하거나 데이터를 갱신해보세요</p>
          </div>
        ) : (
          <>
            {/* 컬럼 헤더 */}
            <div className="flex items-center gap-2 px-3 mb-2">
              <span className="w-5 shrink-0" />
              <span className="w-10 shrink-0" />
              <span className="flex-1 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">종목</span>
              <span className="text-right w-[64px] shrink-0 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">거래량비율</span>
              <span className="text-right w-[44px] shrink-0 text-[11px] font-semibold text-slate-600 uppercase tracking-wider hidden sm:block">RSI</span>
            </div>

            <ul className="space-y-2.5">
              {filtered.map((item, idx) => {
                const up       = (item.changePct ?? 0) >= 0;
                const pctColor = item.changePct != null ? (up ? '#ef4444' : '#3b82f6') : '#64748b';
                const volColor = (item.volRatio ?? 0) >= 2 ? '#06b6d4' : '#475569';

                return (
                  <li
                    key={item.symbol}
                    className="rounded-xl border flex items-center gap-2 sm:gap-3 px-3 py-3 min-h-[68px] transition hover:border-slate-600 cursor-pointer touch-manipulation"
                    style={{ background: C.card, borderColor: C.border }}
                    onClick={() => setDetailItem(item)}
                  >
                    {/* 순위 */}
                    <div className="w-5 shrink-0 flex justify-center">
                      <RankBadge rank={idx + 1} />
                    </div>

                    {/* 로고 */}
                    <StockLogo ticker={item.symbol} name={item.name} size={40} />

                    {/* 종목 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-white text-[14px] truncate leading-tight max-w-[120px] sm:max-w-none">
                          {item.name}
                        </span>
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-md shrink-0"
                          style={
                            isKR(item.symbol)
                              ? { background: 'rgba(16,185,129,0.15)', color: '#10b981' }
                              : { background: 'rgba(6,182,212,0.15)',  color: '#06b6d4' }
                          }
                        >
                          {isKR(item.symbol) ? 'KRX' : 'US'}
                        </span>
                      </div>

                      {/* 가격 + 등락 */}
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[12px] font-medium tabular-nums text-slate-400">
                          {fmtPrice(item.price, item.currency)}
                        </span>
                        {item.changePct != null && (
                          <span
                            className="text-[11px] font-bold tabular-nums flex items-center gap-0.5"
                            style={{ color: pctColor }}
                          >
                            {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {up ? '+' : ''}{item.changePct.toFixed(2)}%
                          </span>
                        )}
                        {item.gapPct != null && Math.abs(item.gapPct) >= 0.5 && (
                          <span
                            className="text-[10px] font-semibold tabular-nums"
                            style={{ color: item.gapPct >= 0 ? '#f97316' : '#3b82f6' }}
                          >
                            갭{item.gapPct >= 0 ? '+' : ''}{item.gapPct.toFixed(1)}%
                          </span>
                        )}
                      </div>

                      {/* 태그들 */}
                      {item.tags.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {item.tags.map((tag) => {
                            const cfg = TAG[tag];
                            if (!cfg) return null;
                            return (
                              <span
                                key={tag}
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                                style={{ background: cfg.bg, color: cfg.color }}
                              >
                                {cfg.label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 거래량 비율 */}
                    <div className="text-right shrink-0 w-[64px]">
                      {item.volRatio != null ? (
                        <>
                          <div
                            className="text-[15px] font-extrabold tabular-nums"
                            style={{ color: volColor }}
                          >
                            {item.volRatio}x
                          </div>
                          <div className="text-[10px] text-slate-600 mt-0.5">
                            {fmtVol(item.volume, item.currency)}
                          </div>
                        </>
                      ) : (
                        <span className="text-[13px] text-slate-600">—</span>
                      )}
                    </div>

                    {/* RSI (데스크탑만) */}
                    <div className="shrink-0 w-[44px] hidden sm:flex justify-end">
                      <RsiBar rsi={item.rsi} />
                    </div>
                  </li>
                );
              })}
            </ul>

            <p className="text-center text-[11px] text-slate-600 mt-6">
              종합 단타 스코어 기준 상위 {filtered.length}종목 · Yahoo Finance 데이터
            </p>
          </>
        )}
      </div>

      {detailItem && (
        <StockDetailSheet
          symbol={detailItem.symbol}
          name={detailItem.name}
          currency={detailItem.currency}
          onClose={() => setDetailItem(null)}
          isInWatchlist={false}
        />
      )}
    </div>
  );
}
