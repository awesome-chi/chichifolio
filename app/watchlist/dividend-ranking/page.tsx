'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, TrendingUp, TrendingDown, ArrowLeft, RefreshCw } from 'lucide-react';
import AppNavBar from '@/components/AppNavBar';
import StockLogo from '@/components/StockLogo';
import StockDetailSheet from '@/components/StockDetailSheet';
import { C } from '@/components/AppContext';

type RankItem = {
  symbol: string;
  name: string;
  yieldPct: number | null;
  annualDiv: number | null;
  price: number | null;
  currency: string;
  frequency: string | null;
  exDivDate: string | null;
  changePct: number | null;
};

type Market = 'all' | 'us' | 'kr';

const MARKET_TABS: { key: Market; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'us', label: '미국' },
  { key: 'kr', label: '국내' },
];

const FREQ_COLOR: Record<string, { bg: string; text: string }> = {
  월배당:   { bg: 'rgba(16,185,129,0.15)', text: '#10b981' },
  분기배당: { bg: 'rgba(6,182,212,0.15)',  text: '#06b6d4' },
  반기배당: { bg: 'rgba(168,85,247,0.15)', text: '#a855f7' },
  연배당:   { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-[13px]">🥇</span>;
  if (rank === 2) return <span className="text-[13px]">🥈</span>;
  if (rank === 3) return <span className="text-[13px]">🥉</span>;
  return (
    <span className="text-[12px] font-bold tabular-nums text-slate-500 w-5 text-center">{rank}</span>
  );
}

export default function DividendRankingPage() {
  const [market, setMarket] = useState<Market>('all');
  const [items, setItems] = useState<RankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailItem, setDetailItem] = useState<RankItem | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchRanking = async (m: Market) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dividend-ranking?market=${m}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
        setLastUpdated(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchRanking(market);
  }, [market]);

  const isKR = (symbol: string) => /\.(KS|KQ)$/.test(symbol);

  const formatPrice = (item: RankItem) => {
    if (!item.price) return '—';
    if (item.currency === 'KRW') return `₩${Math.round(item.price).toLocaleString('ko-KR')}`;
    return `$${item.price.toFixed(2)}`;
  };

  const formatDiv = (item: RankItem) => {
    if (!item.annualDiv) return '—';
    if (item.currency === 'KRW') return `₩${Math.round(item.annualDiv).toLocaleString('ko-KR')}`;
    return `$${item.annualDiv.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-surface text-slate-200 font-sans">
      <AppNavBar />
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <Trophy className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg sm:text-xl font-extrabold text-white">배당률 순위</h1>
            <p className="text-[12px] sm:text-[13px] text-slate-500">고배당 종목·ETF 랭킹</p>
          </div>
          {lastUpdated && (
            <button
              onClick={() => fetchRanking(market)}
              className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-cyan-400 transition py-2 px-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {lastUpdated} 기준
            </button>
          )}
        </div>

        {/* 시장 탭 */}
        <div className="flex gap-1.5 mb-5 bg-slate-900/50 rounded-xl p-1 border border-slate-800">
          {MARKET_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setMarket(tab.key)}
              className="flex-1 py-2 rounded-lg text-[13px] font-semibold transition"
              style={{
                background: market === tab.key ? '#a855f720' : 'transparent',
                color: market === tab.key ? '#a855f7' : '#64748b',
                border: market === tab.key ? '1px solid #a855f740' : '1px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 리스트 */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <span className="inline-block w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">배당 데이터 불러오는 중…</p>
          </div>
        ) : items.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed border-line flex flex-col items-center justify-center py-14 px-4 text-center"
            style={{ background: 'rgba(15,30,50,0.5)' }}
          >
            <Trophy className="w-10 h-10 text-slate-600 mb-3" />
            <p className="text-slate-500 text-sm">데이터를 불러올 수 없어요</p>
          </div>
        ) : (
          <>
            {/* 컬럼 헤더 */}
            <div className="flex items-center gap-3 px-4 mb-2">
              <span className="w-5 shrink-0" />
              <span className="w-10 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">종목</span>
              </div>
              <div className="text-right shrink-0 w-[72px]">
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">배당률</span>
              </div>
              <div className="text-right shrink-0 w-[64px] hidden sm:block">
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">연배당금</span>
              </div>
            </div>

            <ul className="space-y-2.5">
              {items.map((item, idx) => {
                const freq = item.frequency ?? '';
                const freqStyle = FREQ_COLOR[freq] ?? { bg: 'rgba(100,116,139,0.1)', text: '#64748b' };
                const pctColor = item.changePct != null
                  ? item.changePct >= 0 ? C.gain : C.loss
                  : C.muted;

                return (
                  <li
                    key={item.symbol}
                    className="rounded-xl border border-line flex items-center gap-3 px-3 sm:px-4 py-3 min-h-[64px] transition hover:border-slate-600 cursor-pointer touch-manipulation"
                    style={{ background: C.card }}
                    onClick={() => setDetailItem(item)}
                  >
                    {/* 순위 */}
                    <div className="w-5 shrink-0 flex justify-center">
                      <RankBadge rank={idx + 1} />
                    </div>

                    {/* 로고 */}
                    <StockLogo ticker={item.symbol} name={item.name} size={40} colorIndex={idx} />

                    {/* 종목 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-white text-[14px] truncate leading-tight">
                          {item.name}
                        </span>
                        {freq && (
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0"
                            style={{ background: freqStyle.bg, color: freqStyle.text }}
                          >
                            {freq}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[11px] text-slate-500">{item.symbol.replace(/\.(KS|KQ)$/, '')}</span>
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                          style={
                            isKR(item.symbol)
                              ? { background: 'rgba(16,185,129,0.15)', color: '#10b981' }
                              : { background: 'rgba(6,182,212,0.15)', color: '#06b6d4' }
                          }
                        >
                          {isKR(item.symbol) ? 'KRX' : 'US'}
                        </span>
                        <span className="text-[12px] font-medium tabular-nums text-slate-400">
                          {formatPrice(item)}
                        </span>
                        {item.changePct != null && (
                          <span className="text-[11px] font-semibold tabular-nums" style={{ color: pctColor }}>
                            {item.changePct >= 0 ? '+' : ''}{item.changePct.toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 배당률 */}
                    <div className="text-right shrink-0 w-[72px]">
                      <div className="text-[15px] sm:text-[16px] font-extrabold tabular-nums" style={{ color: '#10b981' }}>
                        {item.yieldPct != null ? `${item.yieldPct.toFixed(2)}%` : '—'}
                      </div>
                    </div>

                    {/* 연배당금 (데스크탑만) */}
                    <div className="text-right shrink-0 w-[64px] hidden sm:block">
                      <div className="text-[13px] font-semibold tabular-nums text-slate-300">
                        {formatDiv(item)}
                      </div>
                      {item.exDivDate && (
                        <div className="text-[10px] text-slate-600 mt-0.5">{item.exDivDate}</div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <p className="text-center text-[11px] text-slate-600 mt-6">
              최근 1년 배당금 합산 기준 · Yahoo Finance 데이터
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
