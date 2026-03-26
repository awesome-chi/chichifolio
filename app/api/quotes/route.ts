import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const STOCKS = [
  { yahoo: 'SPY',       currency: 'USD' },
  { yahoo: 'AAPL',      currency: 'USD' },
  { yahoo: 'NVDA',      currency: 'USD' },
  { yahoo: 'MSFT',      currency: 'USD' },
  { yahoo: 'TSLA',      currency: 'USD' },
  { yahoo: 'AMZN',      currency: 'USD' },
  { yahoo: 'GOOG',      currency: 'USD' },
  { yahoo: '005930.KS', currency: 'KRW' },
  { yahoo: '000660.KS', currency: 'KRW' },
  { yahoo: 'QQQ',       currency: 'USD' },
  { yahoo: 'META',      currency: 'USD' },
  { yahoo: 'BRK-B',     currency: 'USD' },
];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function fetchQuote(symbol: string): Promise<{ price: string; change: string; up: boolean } | null> {
  try {
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, { headers: { 'User-Agent': UA }, cache: 'no-store' });
    if (!res.ok) return null;

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const price: number = meta.regularMarketPrice ?? 0;
    const prev: number = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const pct = prev ? ((price - prev) / prev) * 100 : 0;
    const currency: string = meta.currency ?? 'USD';

    const priceStr = currency === 'KRW'
      ? `₩${Math.round(price).toLocaleString('ko-KR')}`
      : `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return {
      price: priceStr,
      change: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
      up: pct >= 0,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const results = await Promise.all(STOCKS.map((s) => fetchQuote(s.yahoo)));
  const quotes: Record<string, { price: string; change: string; up: boolean }> = {};

  for (let i = 0; i < STOCKS.length; i++) {
    const q = results[i];
    if (q) quotes[STOCKS[i].yahoo] = q;
  }

  return NextResponse.json(quotes, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
