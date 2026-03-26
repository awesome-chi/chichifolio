'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Star } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { C } from '@/components/AppContext';
import { type QuoteDetail, type CandlePoint } from '@/lib/watchlist';

async function fetchQuoteDetail(symbol: string): Promise<QuoteDetail | null> {
  try {
    const res = await fetch(`/api/stock/quote?symbol=${encodeURIComponent(symbol)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchStockCandles(symbol: string, resolution: string): Promise<CandlePoint[]> {
  try {
    const res = await fetch(`/api/stock/candles?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

type Resolution = 'D' | 'W' | 'M';

const RESOLUTION_LABELS: { key: Resolution; label: string }[] = [
  { key: 'D', label: '1일' },
  { key: 'W', label: '1주' },
  { key: 'M', label: '1달' },
];


function formatChartDate(t: number, res: Resolution): string {
  const d = new Date(t * 1000);
  if (res === 'D') return `${d.getMonth() + 1}/${d.getDate()}`;
  if (res === 'W') return `${d.getMonth() + 1}월`;
  return `${d.getFullYear()}/${d.getMonth() + 1}`;
}

type Props = {
  symbol: string;
  name: string;
  logo?: string;
  currency?: string;
  onClose: () => void;
  isInWatchlist: boolean;
};

export default function StockDetailSheet({
  symbol,
  name,
  currency = 'USD',
  onClose,
  isInWatchlist,
}: Props) {
  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [candles, setCandles] = useState<CandlePoint[]>([]);
  const [resolution, setResolution] = useState<Resolution>('D');
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingQuote(true);
    fetchQuoteDetail(symbol).then((q) => {
      if (!cancelled) {
        setQuote(q);
        setLoadingQuote(false);
      }
    });
    return () => { cancelled = true; };
  }, [symbol]);

  useEffect(() => {
    let cancelled = false;
    setLoadingChart(true);
    fetchStockCandles(symbol, resolution).then((data) => {
      if (!cancelled) {
        setCandles(data);
        setLoadingChart(false);
      }
    });
    return () => { cancelled = true; };
  }, [symbol, resolution]);

  const chartData = candles.map((p) => ({
    ...p,
    date: formatChartDate(p.t, resolution),
    close: p.c,
  }));

  const fmtPrice = (v: number) =>
    currency === 'KRW' ? `₩${Math.round(v).toLocaleString('ko-KR')}` : `$${v.toFixed(2)}`;
  const fmtVol = (v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : String(v));

  const isPositive = quote != null && quote.dp >= 0;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-[200] backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={sheetRef}
        className="fixed left-0 right-0 bottom-0 z-[201] rounded-t-2xl bg-surface-card border border-line border-b-0 shadow-2xl flex flex-col animate-slide-up-sheet"
        style={{
          maxHeight: '92vh',
          minHeight: '70vh',
          paddingBottom: 'env(safe-area-inset-bottom, 0)',
        }}
      >
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <button
            type="button"
            onClick={onClose}
            className="p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white transition touch-manipulation"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0 text-center px-2">
            <div className="font-semibold text-white text-[15px] truncate">{name}</div>
            <div className="text-[12px] text-slate-500">{symbol}</div>
          </div>
          <div className="w-10 flex justify-end">
            {isInWatchlist && <Star className="w-5 h-5 text-amber-400 fill-amber-400" />}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-4 pt-4 pb-2">
            {loadingQuote ? (
              <div className="h-14 flex items-center text-slate-500 text-sm">로딩 중…</div>
            ) : quote ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tabular-nums text-white">
                    {fmtPrice(quote.c)}
                  </span>
                  <span className="text-[13px] text-slate-500">{currency}</span>
                </div>
                <div
                  className="text-[15px] font-semibold tabular-nums mt-0.5"
                  style={{ color: isPositive ? C.gain : C.loss }}
                >
                  {isPositive ? '+' : ''}{quote.d?.toFixed(2)} ({isPositive ? '+' : ''}{quote.dp?.toFixed(2)}%) 전일 대비
                </div>
              </>
            ) : (
              <div className="text-slate-500 text-sm">가격 정보 없음</div>
            )}
          </div>

          <div className="px-4 py-3">
            <div className="rounded-xl bg-surface-hover border border-line overflow-hidden" style={{ height: 220 }}>
              {loadingChart ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                  차트 로딩 중…
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
                    <defs>
                      <linearGradient id="chartGradDetail" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isPositive ? C.gain : C.loss} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={isPositive ? C.gain : C.loss} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => (currency === 'KRW' ? `${(v / 10000).toFixed(0)}만` : `$${v}`)}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
                      formatter={(value: number) => [fmtPrice(value), '종가']}
                      labelFormatter={(label) => label}
                    />
                    <Area
                      type="monotone"
                      dataKey="close"
                      stroke={isPositive ? C.gain : C.loss}
                      strokeWidth={2}
                      fill="url(#chartGradDetail)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                  차트 데이터 없음
                </div>
              )}
            </div>

            <div className="flex gap-1 mt-2">
              {RESOLUTION_LABELS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setResolution(key)}
                  className={`flex-1 py-2 rounded-lg text-[13px] font-medium transition touch-manipulation ${
                    resolution === key
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                      : 'text-slate-500 border border-transparent hover:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {quote && (
            <div className="px-4 pb-6">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                통계 한눈에 보기
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '전일종가', value: fmtPrice(quote.pc) },
                  { label: '시가', value: fmtPrice(quote.o) },
                  { label: '고가', value: fmtPrice(quote.h), color: C.gain },
                  { label: '저가', value: fmtPrice(quote.l), color: C.loss },
                  { label: '거래량', value: fmtVol(quote.v), colSpan: true },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`rounded-xl bg-surface-hover border border-line px-3 py-2.5 ${(item as { colSpan?: boolean }).colSpan ? 'col-span-2' : ''}`}
                  >
                    <div className="text-[11px] text-slate-500 mb-0.5">{item.label}</div>
                    <div
                      className="text-[13px] font-semibold tabular-nums"
                      style={item.color ? { color: item.color } : undefined}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
