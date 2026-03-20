'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Plus, Trash2, Star, LogIn, UserPlus } from 'lucide-react';
import { useApp, C } from '@/components/AppContext';
import AppNavBar from '@/components/AppNavBar';
import StockDetailSheet from '@/components/StockDetailSheet';
import { getWatchlist, setWatchlist, searchStocks, fetchCompanyLogo, type WatchlistItem, type SearchResult } from '@/lib/watchlist';

const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_KEY || '';
const PALETTE = ['#06b6d4', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899', '#10b981'];

function isDomestic(ticker: string): boolean {
  return /\.(KS|KQ)$/.test(ticker) || /^\d{6}$/.test(ticker.replace(/\.(KS|KQ)$/, ''));
}

async function fetchQuote(ticker: string): Promise<{ price: number; changePct: number; currency: string } | null> {
  if (!FINNHUB_KEY) return null;
  const sym = ticker.includes('.') ? ticker : ticker.length === 6 && /^\d+$/.test(ticker) ? `${ticker}.KS` : ticker;
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(sym)}&token=${FINNHUB_KEY}`
    );
    const data = await res.json();
    if (data?.c != null && data.c > 0) {
      const changePct = data.dp != null ? data.dp : 0;
      return {
        price: data.c,
        changePct,
        currency: isDomestic(ticker) ? 'KRW' : 'USD',
      };
    }
  } catch {}
  return null;
}

export default function WatchlistPage() {
  const { session, users, loaded } = useApp();
  const [watchlist, setWatchlistState] = useState<WatchlistItem[]>([]);
  const [prices, setPrices] = useState<Record<string, { price: number; changePct: number; currency: string }>>({});
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<WatchlistItem | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const userId = session?.userId ?? '';

  useEffect(() => {
    if (userId) setWatchlistState(getWatchlist(userId));
  }, [userId]);

  useEffect(() => {
    if (!watchlist.length) return;
    const tickers = watchlist.map(w => w.symbol);
    let cancelled = false;
    (async () => {
      const next: Record<string, { price: number; changePct: number; currency: string }> = {};
      for (const t of tickers) {
        if (cancelled) return;
        const q = await fetchQuote(t);
        if (q) next[t] = q;
      }
      if (!cancelled) setPrices(prev => ({ ...prev, ...next }));
    })();
    return () => { cancelled = true; };
  }, [watchlist.map(w => w.symbol).join(',')]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setDropdownOpen(false);
      return;
    }
    setSearching(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const list = await searchStocks(query);
      setResults(list);
      setDropdownOpen(true);
      setSearching(false);
      timerRef.current = null;
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addItem = async (item: SearchResult) => {
    if (!userId) return;
    const sym = item.symbol.toUpperCase().trim();
    const next = [...watchlist];
    if (next.some(x => x.symbol === sym)) return;
    setAddingSymbol(sym);
    const logo = await fetchCompanyLogo(sym);
    setAddingSymbol(null);
    next.push({ symbol: sym, name: item.name || sym, logo: logo ?? undefined });
    setWatchlistState(next);
    setWatchlist(userId, next);
    setQuery('');
    setResults([]);
    setDropdownOpen(false);
  };

  const removeItem = (symbol: string) => {
    const next = watchlist.filter(x => x.symbol !== symbol);
    setWatchlistState(next);
    setWatchlist(userId, next);
  };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center text-cyan-400 font-sans">
        불러오는 중…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-surface text-slate-200 font-sans">
        <AppNavBar />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-6">
            <Star className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-3">관심종목</h1>
          <p className="text-slate-400 text-[15px] leading-relaxed mb-8">
            관심종목을 검색하고 추가하려면<br />로그인 또는 회원가입이 필요해요.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-xl px-6 py-3.5 transition"
            >
              <LogIn className="w-5 h-5" />
              로그인
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 border border-line hover:border-slate-500 text-slate-300 hover:text-white font-medium rounded-xl px-6 py-3.5 transition"
            >
              <UserPlus className="w-5 h-5" />
              회원가입
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-slate-200 font-sans">
      <AppNavBar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <Star className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-white">관심종목</h1>
          <p className="text-[12px] sm:text-[13px] text-slate-500">종목을 검색해 추가하세요</p>
          </div>
        </div>

        <div className="relative mb-6" ref={boxRef}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="종목명 또는 티커 검색 (예: AAPL, 삼성전자)"
                className="w-full bg-surface-hover border border-line rounded-xl pl-10 pr-4 py-3 min-h-[48px] text-base sm:text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 transition touch-manipulation"
              />
              {dropdownOpen && results.length > 0 && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-line bg-surface-card shadow-xl z-50 overflow-hidden"
                  style={{ maxHeight: 320 }}
                >
                  <ul className="py-1 overflow-y-auto max-h-80">
                    {results.map((item, i) => {
                      const added = watchlist.some(x => x.symbol === item.symbol);
                      return (
                        <li key={`${item.symbol}-${i}`}>
                          <button
                            type="button"
                            onClick={() => !added && addItem(item)}
                            disabled={added}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3 min-h-[52px] text-left hover:bg-surface-hover transition disabled:opacity-50 disabled:cursor-default touch-manipulation"
                          >
                            <div className="min-w-0">
                              <span className="font-semibold text-cyan-400 block truncate">{item.symbol}</span>
                              <span className="text-xs text-slate-500 truncate block">{item.name}</span>
                            </div>
                            {addingSymbol === item.symbol ? (
                              <span className="inline-block w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shrink-0" />
                            ) : added ? (
                              <span className="text-[11px] text-slate-500 shrink-0">추가됨</span>
                            ) : (
                              <Plus className="w-4 h-4 text-cyan-400 shrink-0" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              {dropdownOpen && query.trim() && !searching && results.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-line bg-surface-card px-4 py-4 text-center text-slate-500 text-sm z-50">
                  검색 결과가 없어요
                </div>
              )}
            </div>
          </div>
          {searching && (
            <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <span className="inline-block w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              검색 중…
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">내 관심종목</span>
            {watchlist.length > 0 && (
              <span className="text-xs text-slate-500">{watchlist.length}종목</span>
            )}
          </div>
          {watchlist.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed border-line flex flex-col items-center justify-center py-14 px-4 text-center"
              style={{ background: 'rgba(15,30,50,0.5)' }}
            >
              <Star className="w-10 h-10 text-slate-600 mb-3" />
              <p className="text-slate-500 text-sm mb-1">아직 추가한 종목이 없어요</p>
              <p className="text-slate-600 text-xs">위 검색창에서 종목을 검색해 추가해 보세요</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {watchlist.map((item, idx) => {
                const isDom = isDomestic(item.symbol);
                const quote = prices[item.symbol];
                const line1 = isDom ? `${item.name} ${item.symbol}` : `${item.symbol} ${item.name}`;
                const priceStr = quote
                  ? quote.currency === 'KRW'
                    ? `₩${Math.round(quote.price).toLocaleString('ko-KR')}`
                    : `$${quote.price.toFixed(2)}`
                  : '—';
                const pctStr = quote != null ? `${quote.changePct >= 0 ? '+' : ''}${quote.changePct.toFixed(2)}%` : '—';
                const pctColor = quote != null ? (quote.changePct >= 0 ? '#10b981' : '#f43f5e') : C.muted;
                const color = PALETTE[idx % PALETTE.length];
                const initial = item.symbol.replace(/\.(KS|KQ)$/, '').slice(0, 2).toUpperCase();
                return (
                  <li
                    key={item.symbol}
                    className="rounded-xl border border-line flex items-center gap-4 px-4 py-3 min-h-[64px] transition hover:border-slate-600 touch-manipulation"
                    style={{ background: C.card }}
                  >
                    {item.logo ? (
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-surface-hover shrink-0 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.logo} alt="" className="object-cover w-full h-full" />
                      </div>
                    ) : (
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ background: color }}
                      >
                        {initial}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-white text-[15px] truncate">{line1}</div>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-sm font-semibold tabular-nums text-white">{priceStr}</span>
                        <span className="text-[13px] font-semibold tabular-nums" style={{ color: pctColor }}>
                          {pctStr}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setDetailItem(item)}
                        className="text-[12px] font-medium text-slate-500 hover:text-cyan-400 transition py-2 px-2 min-h-[44px] flex items-center touch-manipulation"
                      >
                        상세보기
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.symbol)}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition touch-manipulation"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {detailItem && (
        <StockDetailSheet
          symbol={detailItem.symbol}
          name={detailItem.name}
          logo={detailItem.logo}
          currency={prices[detailItem.symbol]?.currency ?? (isDomestic(detailItem.symbol) ? 'KRW' : 'USD')}
          onClose={() => setDetailItem(null)}
          isInWatchlist={true}
        />
      )}
    </div>
  );
}
