'use client';

import { useState, useEffect } from 'react';
import { Flame, RefreshCw, TrendingUp, TrendingDown, BarChart2, DollarSign } from 'lucide-react';
import AppNavBar from '@/components/AppNavBar';
import StockLogo from '@/components/StockLogo';
import StockDetailSheet from '@/components/StockDetailSheet';
import { C } from '@/components/AppContext';

type PopularItem = {
  symbol: string;
  name: string;
  price: number | null;
  changePct: number | null;
  currency: string;
  volume: number | null;
  avgVolume: number | null;
  marketCap: number | null;
};

type Market = 'all' | 'us' | 'kr';
type SortBy = 'volume' | 'marketcap';

const MARKET_TABS: { key: Market; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'us', label: '미국' },
  { key: 'kr', label: '국내' },
];

const SORT_TABS: { key: SortBy; label: string; icon: React.ElementType }[] = [
  { key: 'volume', label: '거래량순', icon: BarChart2 },
  { key: 'marketcap', label: '시가총액순', icon: DollarSign },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-[14px]">🥇</span>;
  if (rank === 2) return <span className="text-[14px]">🥈</span>;
  if (rank === 3) return <span className="text-[14px]">🥉</span>;
  return (
    <span className="text-[12px] font-bold tabular-nums text-slate-500 w-5 text-center">{rank}</span>
  );
}

function formatVolume(vol: number | null, currency: string): string {
  if (vol == null) return '—';
  if (currency === 'KRW') {
    if (vol >= 1_000_000_000_000) return `${(vol / 1_000_000_000_000).toFixed(1)}조`;
    if (vol >= 100_000_000) return `${(vol / 100_000_000).toFixed(1)}억`;
    if (vol >= 10_000) return `${(vol / 10_000).toFixed(0)}만`;
    return vol.toLocaleString('ko-KR');
  }
  if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(1)}B`;
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return vol.toLocaleString();
}

function formatMarketCap(mc: number | null, currency: string): string {
  if (mc == null) return '—';
  if (currency === 'KRW') {
    if (mc >= 1_000_000_000_000) return `₩${(mc / 1_000_000_000_000).toFixed(1)}조`;
    if (mc >= 100_000_000) return `₩${(mc / 100_000_000).toFixed(0)}억`;
    return `₩${mc.toLocaleString('ko-KR')}`;
  }
  if (mc >= 1_000_000_000_000) return `$${(mc / 1_000_000_000_000).toFixed(2)}T`;
  if (mc >= 1_000_000_000) return `$${(mc / 1_000_000_000).toFixed(1)}B`;
  if (mc >= 1_000_000) return `$${(mc / 1_000_000).toFixed(0)}M`;
  return `$${mc.toLocaleString()}`;
}

function formatPrice(item: PopularItem): string {
  if (item.price == null) return '—';
  if (item.currency === 'KRW') return `₩${Math.round(item.price).toLocaleString('ko-KR')}`;
  return `$${item.price.toFixed(2)}`;
}

const isKR = (symbol: string) => /\.(KS|KQ)$/.test(symbol);

export default function PopularStocksPage() {
  const [market, setMarket] = useState<Market>('all');
  const [sortBy, setSortBy] = useState<SortBy>('volume');
  const [items, setItems] = useState<PopularItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [detailItem, setDetailItem] = useState<PopularItem | null>(null);

  const fetchData = async (m: Market, s: SortBy) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/popular-stocks?market=${m}&sort=${s}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
        setLastUpdated(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchData(market, sortBy);
  }, [market, sortBy]);

  return (
    <div className="min-h-screen bg-surface text-slate-200 font-sans">
      <AppNavBar />
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <Flame className="w-5 h-5 text-orange-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg sm:text-xl font-extrabold text-white">인기 종목</h1>
            <p className="text-[12px] sm:text-[13px] text-slate-500">거래량 · 시가총액 기준 인기 종목 순위</p>
          </div>
          {lastUpdated && (
            <button
              onClick={() => fetchData(market, sortBy)}
              className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-cyan-400 transition py-2 px-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {lastUpdated} 기준
            </button>
          )}
        </div>

        {/* 시장 탭 */}
        <div className="flex gap-1.5 mb-3 bg-slate-900/50 rounded-xl p-1 border border-slate-800">
          {MARKET_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setMarket(tab.key)}
              className="flex-1 py-2 rounded-lg text-[13px] font-semibold transition"
              style={{
                background: market === tab.key ? '#f97316' + '20' : 'transparent',
                color: market === tab.key ? '#f97316' : '#64748b',
                border: market === tab.key ? '1px solid #f9731640' : '1px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 정렬 탭 */}
        <div className="flex gap-2 mb-5">
          {SORT_TABS.map(tab => {
            const Icon = tab.icon;
            const active = sortBy === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setSortBy(tab.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition border"
                style={{
                  background: active ? '#f97316' + '18' : 'transparent',
                  color: active ? '#f97316' : '#64748b',
                  borderColor: active ? '#f9731640' : '#1e293b',
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 리스트 */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <span className="inline-block w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">데이터 불러오는 중…</p>
          </div>
        ) : items.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed border-line flex flex-col items-center justify-center py-14 px-4 text-center"
            style={{ background: 'rgba(15,30,50,0.5)' }}
          >
            <Flame className="w-10 h-10 text-slate-600 mb-3" />
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
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  {sortBy === 'volume' ? '거래량' : '시가총액'}
                </span>
              </div>
              <div className="text-right shrink-0 w-[60px] hidden sm:block">
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  {sortBy === 'volume' ? '시가총액' : '거래량'}
                </span>
              </div>
            </div>

            <ul className="space-y-2.5">
              {items.map((item, idx) => {
                const pctColor = item.changePct != null
                  ? item.changePct >= 0 ? C.gain : C.loss
                  : C.muted;
                const primaryValue = sortBy === 'volume'
                  ? formatVolume(item.volume, item.currency)
                  : formatMarketCap(item.marketCap, item.currency);
                const secondaryValue = sortBy === 'volume'
                  ? formatMarketCap(item.marketCap, item.currency)
                  : formatVolume(item.volume, item.currency);

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
                      <div className="font-semibold text-white text-[14px] truncate leading-tight">
                        {item.name}
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
                          <span className="text-[11px] font-semibold tabular-nums flex items-center gap-0.5" style={{ color: pctColor }}>
                            {item.changePct >= 0
                              ? <TrendingUp className="w-3 h-3" />
                              : <TrendingDown className="w-3 h-3" />}
                            {item.changePct >= 0 ? '+' : ''}{item.changePct.toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 주요 지표 */}
                    <div className="text-right shrink-0 w-[72px]">
                      <div className="text-[14px] sm:text-[15px] font-extrabold tabular-nums" style={{ color: '#f97316' }}>
                        {primaryValue}
                      </div>
                    </div>

                    {/* 부가 지표 (데스크탑만) */}
                    <div className="text-right shrink-0 w-[60px] hidden sm:block">
                      <div className="text-[12px] font-semibold tabular-nums text-slate-400">
                        {secondaryValue}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <p className="text-center text-[11px] text-slate-600 mt-6">
              {sortBy === 'volume' ? '당일 거래량 기준' : '시가총액 기준'} · Yahoo Finance 데이터
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
