'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Star } from 'lucide-react';
import { useApp } from '@/components/AppContext';
import { getWatchlist, setWatchlist, searchStocks, fetchCompanyLogo, type WatchlistItem, type SearchResult } from '@/lib/watchlist';
import StockLogo from '@/components/StockLogo';

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
  const searchGenRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
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
      if (gen !== searchGenRef.current) return;
      setResults(list);
      setDropdownOpen(true);
      setSearching(false);
    }, 250);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
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
    <div
      ref={boxRef}
      className="relative flex-1 min-w-0"
      style={{ maxWidth: 340 }}
    >
      {/* 검색 입력 */}
      <div
        className="flex items-center gap-2 rounded-xl border transition-all"
        style={{
          background: 'rgba(15,30,50,0.9)',
          borderColor: dropdownOpen || query ? 'rgba(6,182,212,0.5)' : 'rgba(23,42,69,0.8)',
          padding: '0 12px',
          height: 38,
        }}
      >
        {searching ? (
          <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shrink-0" />
        ) : (
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setDropdownOpen(true)}
          placeholder="주식, ETF 검색"
          className="flex-1 bg-transparent text-[13px] text-white placeholder-slate-500 outline-none min-w-0"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setDropdownOpen(false); inputRef.current?.focus(); }}
            className="text-slate-500 hover:text-slate-300 transition shrink-0 text-[16px] leading-none pb-0.5"
          >
            ×
          </button>
        )}
      </div>

      {/* 검색 결과 드롭다운 */}
      {dropdownOpen && results.length > 0 && (
        <div
          className="absolute top-full mt-2 rounded-2xl border border-[#172a45] shadow-2xl overflow-hidden z-[200]"
          style={{
            background: '#0d1b2e',
            left: 0,
            right: 0,
            minWidth: 300,
            maxHeight: 420,
            overflowY: 'auto',
          }}
        >
          <div className="px-4 pt-3 pb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">검색 결과</span>
          </div>
          <ul>
            {results.map((item, i) => {
              const added = watchlist.some(x => x.symbol === item.symbol);
              const adding = addingSymbol === item.symbol;
              const isKR = /\.(KS|KQ)$/.test(item.symbol);
              return (
                <li key={`${item.symbol}-${i}`}>
                  <div
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#122030] transition cursor-pointer"
                    onClick={() => setDropdownOpen(false)}
                  >
                    {/* 로고 */}
                    <StockLogo ticker={item.symbol} name={item.name} size={40} colorIndex={i} />

                    {/* 종목 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[14px] text-white truncate leading-tight">
                        {item.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-500">{item.symbol}</span>
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                          style={{
                            background: isKR ? 'rgba(16,185,129,0.15)' : 'rgba(6,182,212,0.15)',
                            color: isKR ? '#10b981' : '#06b6d4',
                          }}
                        >
                          {isKR ? 'KRX' : 'US'}
                        </span>
                      </div>
                    </div>

                    {/* 관심종목 버튼 */}
                    <button
                      type="button"
                      onClick={e => toggleWatchlist(item, e)}
                      className="shrink-0 p-2 rounded-lg hover:bg-[#172a45] transition touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center"
                      title={session ? (added ? '관심종목 해제' : '관심종목 추가') : '로그인 후 이용 가능'}
                    >
                      {adding ? (
                        <span className="inline-block w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      ) : added ? (
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      ) : (
                        <Star className="w-4 h-4 text-slate-600 hover:text-amber-400 transition" />
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* 검색 결과 없음 */}
      {dropdownOpen && query.trim() && !searching && results.length === 0 && (
        <div
          className="absolute top-full mt-2 rounded-2xl border border-[#172a45] px-4 py-5 text-center text-slate-500 text-[13px] z-[200]"
          style={{ background: '#0d1b2e', left: 0, right: 0 }}
        >
          <div className="text-2xl mb-2">🔍</div>
          <div>"{query}" 검색 결과가 없습니다</div>
        </div>
      )}
    </div>
  );
}
