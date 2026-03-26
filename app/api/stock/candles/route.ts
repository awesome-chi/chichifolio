import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

const RESOLUTION_MAP: Record<string, { interval: string; range: string }> = {
  D: { interval: '1d', range: '1mo' },
  W: { interval: '1wk', range: '3mo' },
  M: { interval: '1mo', range: '1y' },
};

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol');
  const resolution = req.nextUrl.searchParams.get('resolution') ?? 'D';
  if (!symbol) return NextResponse.json([]);

  const { interval, range } = RESOLUTION_MAP[resolution] ?? RESOLUTION_MAP['D'];

  try {
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
    const res = await fetch(url, { headers: { 'User-Agent': UA }, cache: 'no-store' });
    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    const timestamps: number[] = result?.timestamp ?? [];
    const q0 = result?.indicators?.quote?.[0];

    if (!timestamps.length || !q0) return NextResponse.json([]);

    const candles = timestamps
      .map((t, i) => ({
        t,
        o: q0.open?.[i] ?? 0,
        h: q0.high?.[i] ?? 0,
        l: q0.low?.[i] ?? 0,
        c: q0.close?.[i] ?? 0,
        v: q0.volume?.[i] ?? 0,
      }))
      .filter(p => p.c > 0);

    return NextResponse.json(candles);
  } catch {
    return NextResponse.json([]);
  }
}
