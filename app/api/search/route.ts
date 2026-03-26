import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

const BLOCKED_TYPES = new Set(['CURRENCY', 'CRYPTOCURRENCY', 'INDEX', 'FOREX_PAIR', 'MUTUALFUND']);

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q) return NextResponse.json([]);

  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&newsCount=0&quotesCount=20&listsCount=0`;
    const res = await fetch(url, { headers: { 'User-Agent': UA }, cache: 'no-store' });
    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    const quotes: any[] = data?.finance?.result?.quotes ?? data?.quotes ?? [];

    const results = quotes
      .filter((r: any) => r?.symbol && !BLOCKED_TYPES.has(r.quoteType))
      .map((r: any) => ({
        symbol: r.symbol as string,
        name: (r.longname || r.shortname || r.symbol) as string,
      }));

    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
