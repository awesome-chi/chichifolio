import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol');
  if (!symbol) return NextResponse.json(null);

  try {
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, { headers: { 'User-Agent': UA }, cache: 'no-store' });
    if (!res.ok) return NextResponse.json(null);

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    const meta = result?.meta;
    if (!meta?.regularMarketPrice) return NextResponse.json(null);

    const c: number = meta.regularMarketPrice;
    const pc: number = meta.chartPreviousClose || meta.previousClose || c;
    const d = c - pc;
    const dp = pc > 0 ? (d / pc) * 100 : 0;

    // Try to get intraday OHLV from indicators
    const q0 = result?.indicators?.quote?.[0];
    const lastIdx = (result?.timestamp?.length ?? 1) - 1;
    const o: number = q0?.open?.[lastIdx] ?? meta.regularMarketOpen ?? c;
    const h: number = q0?.high?.[lastIdx] ?? meta.regularMarketDayHigh ?? c;
    const l: number = q0?.low?.[lastIdx] ?? meta.regularMarketDayLow ?? c;
    const v: number = q0?.volume?.[lastIdx] ?? meta.regularMarketVolume ?? 0;

    return NextResponse.json({ c, d, dp, o, h, l, pc, v });
  } catch {
    return NextResponse.json(null);
  }
}
