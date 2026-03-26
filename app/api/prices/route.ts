import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function fetchQuote(symbol: string) {
  try {
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, { headers: { 'User-Agent': UA }, cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;
    const price: number = meta.regularMarketPrice;
    const prev: number = meta.chartPreviousClose || meta.previousClose || price;
    return {
      price,
      changePct: prev > 0 ? ((price - prev) / prev) * 100 : 0,
      currency: (meta.currency as string) || 'USD',
      name: (meta.shortName || meta.longName || symbol) as string,
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tickers: string[] = Array.isArray(body?.tickers) ? body.tickers : [];
    if (!tickers.length) return NextResponse.json({ prices: {}, rate: null });

    const [rateData, ...quoteResults] = await Promise.all([
      fetch('https://api.exchangerate-api.com/v4/latest/USD', { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null)
        .then(d => d?.rates?.KRW ?? null)
        .catch(() => null),
      ...tickers.map(fetchQuote),
    ]);

    const prices: Record<string, any> = {};
    for (let i = 0; i < tickers.length; i++) {
      const q = quoteResults[i];
      if (q) prices[tickers[i]] = q;
    }

    return NextResponse.json({ prices, rate: rateData ?? null });
  } catch {
    return NextResponse.json({ prices: {}, rate: null }, { status: 500 });
  }
}
