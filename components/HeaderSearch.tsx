'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Star } from 'lucide-react';
import { useApp } from '@/components/AppContext';
import { getWatchlist, setWatchlist, searchStocks, fetchCompanyLogo, getStockLogoUrl, type WatchlistItem, type SearchResult } from '@/lib/watchlist';

/** 헤더 정중앙용 컴팩트 종목 검색 (높이 축소, 모바일 친화) */
export default function HeaderSearch() {
  const { session, loaded } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [watchlist, setWatchlistState] = useState<WatchlistItem[]>([]);
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [logos, setLogos] = useState<Record<string, string | null>>({});
  const searchGenRef = useRef(0);
  const userId = session?.userId ?? '';

  useEffect(() => {
    if (userId) setWatchlistState(getWatchlist(userId));
  }, [userId]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setDropdownOpen(false);
      return;
    }
    setSearching(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const gen = ++searchGenRef.current;
      const list = await searchStocks(query);
      setResults(list);
      setDropdownOpen(true);
      setSearching(false);
      timerRef.current = null;
      if (list.length > 0) {
        Promise.all(
          list.map(async (item) => ({
            symbol: item.symbol,
            logo: await getStockLogoUrl(item.symbol, item.name),
          }))
        ).then((pairs) => {
          if (gen !== searchGenRef.current) return;
          setLogos((prev) => {
            const next = { ...prev };
            for (const p of pairs) {
              next[p.symbol] = p.logo ?? null;
            }
            return next;
          });
        });
      }
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleWatchlist = async (item: SearchResult, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session) return;
    const sym = item.symbol.toUpperCase().trim();
    const inList = watchlist.some(x => x.symbol === sym);
    if (inList) {
      const next = watchlist.filter(x => x.symbol !== sym);
      setWatchlistState(next);
      setWatchlist(userId, next);
      return;
    }
    setAddingSymbol(sym);
    const logo = await fetchCompanyLogo(sym);
    setAddingSymbol(null);
    const next = [...watchlist, { symbol: sym, name: item.name || sym, logo: logo ?? undefined }];
    setWatchlistState(next);
    setWatchlist(userId, next);
  };

  return (
    <div className="relative flex-1 flex justify-center min-w-0 max-w-[220px] sm:max-w-[280px] mx-auto px-1 sm:px-2" ref={boxRef}>
      <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="종목 검색"
        className="w-full h-8 sm:h-8 bg-surface-hover border border-line rounded-lg pl-8 sm:pl-9 pr-8 text-[13px] sm:text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 transition"
      />
      {searching && (
        <span className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 inline-block w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      )}
      {dropdownOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-line bg-surface-card shadow-xl z-[200] overflow-hidden max-h-72 overflow-y-auto">
          <ul className="py-0.5">
            {results.map((item, i) => {
              const added = watchlist.some(x => x.symbol === item.symbol);
              const adding = addingSymbol === item.symbol;
              const logoUrl = logos[item.symbol] ?? null;
              const initials = (item.name || item.symbol).replace(/\.[A-Z]+$/, '').slice(0, 2);
              return (
                <li key={`${item.symbol}-${i}`}>
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4 sm:py-3 hover:bg-surface-hover transition">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-surface-hover border border-line flex items-center justify-center text-[11px] sm:text-[12px] font-semibold text-cyan-400 overflow-hidden relative shrink-0">
                        {logoUrl ? (
                          <>
                            <img
                              src={logoUrl}
                              alt=""
                              className="w-full h-full object-contain"
                              onError={e => {
                                const t = e.target as HTMLImageElement;
                                t.style.display = 'none';
                                const s = t.nextElementSibling as HTMLElement;
                                if (s) s.style.display = 'flex';
                              }}
                            />
                            <span className="absolute inset-0 hidden items-center justify-center text-[11px] sm:text-[12px]">
                              {initials}
                            </span>
                          </>
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-[11px] sm:text-[12px]">
                            {initials}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] sm:text-[14px] font-semibold text-white truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] sm:text-[11px] text-slate-500 truncate">
                          {item.symbol}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={e => toggleWatchlist(item, e)}
                      className="shrink-0 p-2 rounded-lg hover:bg-surface-hover transition touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title={session ? (added ? '관심종목 해제' : '관심종목 추가') : '로그인하면 관심종목에 추가할 수 있어요'}
                    >
                      {adding ? (
                        <span className="inline-block w-4 h-4 sm:w-5 sm:h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      ) : added ? (
                        <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400" />
                      ) : session ? (
                        <Star className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 hover:text-amber-400 transition" />
                      ) : (
                        <Star className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {dropdownOpen && query.trim() && !searching && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-line bg-surface-card px-3 py-3 text-center text-slate-500 text-[13px] sm:text-sm z-[200]">
          검색 결과 없음
        </div>
      )}
    </div>
  );
}
