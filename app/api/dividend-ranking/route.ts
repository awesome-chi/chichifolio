import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const HIGH_DIV_US = [
  { symbol: 'JEPI',  name: 'JPMorgan Equity Premium Income ETF' },
  { symbol: 'JEPQ',  name: 'JPMorgan Nasdaq Equity Premium Income ETF' },
  { symbol: 'SCHD',  name: 'Schwab US Dividend Equity ETF' },
  { symbol: 'VYM',   name: 'Vanguard High Dividend Yield ETF' },
  { symbol: 'DVY',   name: 'iShares Select Dividend ETF' },
  { symbol: 'HDV',   name: 'iShares Core High Dividend ETF' },
  { symbol: 'DIVO',  name: 'Amplify CWP Enhanced Dividend Income ETF' },
  { symbol: 'DGRO',  name: 'iShares Core Dividend Growth ETF' },
  { symbol: 'SDY',   name: 'SPDR S&P Dividend ETF' },
  { symbol: 'SPYD',  name: 'SPDR Portfolio S&P 500 High Dividend ETF' },
  { symbol: 'MO',    name: 'Altria Group Inc.' },
  { symbol: 'T',     name: 'AT&T Inc.' },
  { symbol: 'VZ',    name: 'Verizon Communications' },
  { symbol: 'KO',    name: 'Coca-Cola Company' },
  { symbol: 'PEP',   name: 'PepsiCo Inc.' },
  { symbol: 'PFE',   name: 'Pfizer Inc.' },
  { symbol: 'ABBV',  name: 'AbbVie Inc.' },
  { symbol: 'BMY',   name: 'Bristol-Myers Squibb' },
  { symbol: 'IBM',   name: 'IBM Corporation' },
  { symbol: 'CVX',   name: 'Chevron Corporation' },
  { symbol: 'XOM',   name: 'Exxon Mobil Corporation' },
  { symbol: 'O',     name: 'Realty Income Corporation' },
  { symbol: 'WPC',   name: 'W. P. Carey Inc.' },
  { symbol: 'JNJ',   name: 'Johnson & Johnson' },
  { symbol: 'MMM',   name: '3M Company' },
  { symbol: 'PM',    name: 'Philip Morris International' },
  { symbol: 'MCD',   name: "McDonald's Corporation" },
  { symbol: 'UPS',   name: 'United Parcel Service' },
  { symbol: 'LYB',   name: 'LyondellBasell Industries' },
  { symbol: 'MPW',   name: 'Medical Properties Trust' },
];

const HIGH_DIV_KR = [
  { symbol: '099140.KS', name: 'KODEX 고배당' },
  { symbol: '210780.KS', name: 'TIGER 고배당' },
  { symbol: '161510.KS', name: 'ACE 고배당주' },
  { symbol: '211560.KS', name: 'PLUS 고배당주' },
  { symbol: '385550.KS', name: 'KBSTAR 고배당' },
  { symbol: '466920.KS', name: 'HANARO 고배당' },
  { symbol: '462980.KS', name: 'SOL 고배당' },
  { symbol: '055550.KS', name: '신한지주' },
  { symbol: '105560.KS', name: 'KB금융' },
  { symbol: '086790.KS', name: '하나금융지주' },
  { symbol: '316140.KS', name: '우리금융지주' },
  { symbol: '017670.KS', name: 'SK텔레콤' },
  { symbol: '030200.KS', name: 'KT' },
  { symbol: '010950.KS', name: 'S-Oil' },
  { symbol: '032830.KS', name: '삼성생명' },
  { symbol: '005930.KS', name: '삼성전자' },
  { symbol: '000270.KS', name: '기아' },
  { symbol: '005380.KS', name: '현대차' },
  { symbol: '003550.KS', name: 'LG' },
  { symbol: '096770.KS', name: 'SK이노베이션' },
];

async function fetchDivData(symbol: string): Promise<{
  yieldPct: number | null;
  annualDiv: number | null;
  price: number | null;
  currency: string;
  frequency: string | null;
  exDivDate: string | null;
  changePct: number | null;
} | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1y&events=div`;
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const price: number = meta?.regularMarketPrice ?? 0;
    const prevClose: number = meta?.chartPreviousClose ?? meta?.previousClose ?? price;
    const currency: string = meta?.currency ?? 'USD';
    const changePct = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : null;

    const divEvents = result.events?.dividends;
    if (!divEvents || Object.keys(divEvents).length === 0) {
      return { yieldPct: null, annualDiv: null, price, currency, frequency: null, exDivDate: null, changePct };
    }

    const divs = Object.values(divEvents) as { date: number; amount?: number }[];
    divs.sort((a, b) => b.date - a.date);

    const totalAnnual = divs.reduce((s, d) => s + (d.amount || 0), 0);
    const count = divs.length;

    let frequency: string | null = null;
    if (count >= 11) frequency = '월배당';
    else if (count >= 3) frequency = '분기배당';
    else if (count >= 2) frequency = '반기배당';
    else if (count >= 1) frequency = '연배당';

    const yieldPct = price > 0 ? (totalAnnual / price) * 100 : null;
    const exDivDate = divs[0]?.date ? new Date(divs[0].date * 1000).toISOString().slice(0, 10) : null;

    return { yieldPct, annualDiv: totalAnnual || null, price, currency, frequency, exDivDate, changePct };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const market = searchParams.get('market') ?? 'all';

  let tickers: { symbol: string; name: string }[] = [];
  if (market === 'us') tickers = HIGH_DIV_US;
  else if (market === 'kr') tickers = HIGH_DIV_KR;
  else tickers = [...HIGH_DIV_US, ...HIGH_DIV_KR];

  const results = await Promise.all(
    tickers.map(async ({ symbol, name }) => {
      const d = await fetchDivData(symbol);
      return { symbol, name, ...d };
    })
  );

  const ranked = results
    .filter(r => r.yieldPct != null && r.yieldPct > 0)
    .sort((a, b) => (b.yieldPct ?? 0) - (a.yieldPct ?? 0));

  return NextResponse.json(ranked);
}
