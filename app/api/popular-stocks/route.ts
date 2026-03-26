import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const POPULAR_US = [
  { symbol: 'NVDA',  name: 'NVIDIA Corporation' },
  { symbol: 'AAPL',  name: 'Apple Inc.' },
  { symbol: 'TSLA',  name: 'Tesla Inc.' },
  { symbol: 'MSFT',  name: 'Microsoft Corporation' },
  { symbol: 'AMZN',  name: 'Amazon.com Inc.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'META',  name: 'Meta Platforms Inc.' },
  { symbol: 'AMD',   name: 'Advanced Micro Devices' },
  { symbol: 'PLTR',  name: 'Palantir Technologies' },
  { symbol: 'SOFI',  name: 'SoFi Technologies' },
  { symbol: 'SPY',   name: 'SPDR S&P 500 ETF' },
  { symbol: 'QQQ',   name: 'Invesco QQQ Trust' },
  { symbol: 'SOXL',  name: 'Direxion Daily Semiconductor Bull 3x' },
  { symbol: 'TQQQ',  name: 'ProShares UltraPro QQQ' },
  { symbol: 'SQQQ',  name: 'ProShares UltraPro Short QQQ' },
  { symbol: 'BABA',  name: 'Alibaba Group' },
  { symbol: 'COIN',  name: 'Coinbase Global' },
  { symbol: 'MSTR',  name: 'MicroStrategy Inc.' },
  { symbol: 'IONQ',  name: 'IonQ Inc.' },
  { symbol: 'SMCI',  name: 'Super Micro Computer' },
];

const POPULAR_KR = [
  { symbol: '005930.KS', name: '삼성전자' },
  { symbol: '000660.KS', name: 'SK하이닉스' },
  { symbol: '373220.KS', name: 'LG에너지솔루션' },
  { symbol: '207940.KS', name: '삼성바이오로직스' },
  { symbol: '005380.KS', name: '현대차' },
  { symbol: '000270.KS', name: '기아' },
  { symbol: '035420.KS', name: 'NAVER' },
  { symbol: '051910.KS', name: 'LG화학' },
  { symbol: '068270.KS', name: '셀트리온' },
  { symbol: '035720.KS', name: '카카오' },
  { symbol: '105560.KS', name: 'KB금융' },
  { symbol: '055550.KS', name: '신한지주' },
  { symbol: '012330.KS', name: '현대모비스' },
  { symbol: '028260.KS', name: '삼성물산' },
  { symbol: '003550.KS', name: 'LG' },
  { symbol: '006400.KS', name: '삼성SDI' },
  { symbol: '096770.KS', name: 'SK이노베이션' },
  { symbol: '030200.KS', name: 'KT' },
  { symbol: '017670.KS', name: 'SK텔레콤' },
  { symbol: '066570.KS', name: 'LG전자' },
];

// ── Yahoo Finance crumb cache (모듈 레벨, 프로세스 내 1시간 캐시)
let crumbCache: { crumb: string; cookie: string; expires: number } | null = null;

async function getYFAuth(): Promise<{ crumb: string; cookie: string } | null> {
  if (crumbCache && Date.now() < crumbCache.expires) return crumbCache;
  try {
    const pageRes = await fetch('https://finance.yahoo.com/', {
      headers: { 'User-Agent': UA, 'Accept': 'text/html' },
      redirect: 'follow',
    });
    // Set-Cookie 헤더 수집
    const setCookies: string[] = [];
    pageRes.headers.forEach((val, key) => {
      if (key.toLowerCase() === 'set-cookie') setCookies.push(val.split(';')[0]);
    });
    const cookieStr = setCookies.join('; ');

    const crumbRes = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
      headers: { 'User-Agent': UA, 'Cookie': cookieStr },
    });
    const crumb = await crumbRes.text();
    if (crumb && !crumb.includes('{') && crumb.length < 30) {
      crumbCache = { crumb: crumb.trim(), cookie: cookieStr, expires: Date.now() + 3_600_000 };
      return crumbCache;
    }
  } catch {}
  return null;
}

// ── market cap: Yahoo Finance quoteSummary (crumb 필요)
async function fetchMarketCap(
  symbol: string,
  crumb: string,
  cookie: string,
): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=summaryDetail&crumb=${encodeURIComponent(crumb)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Cookie': cookie },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.quoteSummary?.result?.[0]?.summaryDetail?.marketCap?.raw ?? null;
  } catch {
    return null;
  }
}

// ── 가격·거래량·수익률: Yahoo Finance chart v8 (1년 일봉)
async function fetchChartData(symbol: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1y`;
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const closes: number[] = (result.indicators?.quote?.[0]?.close ?? []).filter(
      (c: number | null) => c != null && !isNaN(c) && c > 0,
    );
    const volumes: number[] = (result.indicators?.quote?.[0]?.volume ?? []).filter(
      (v: number | null) => v != null && v > 0,
    );

    const price: number | null = meta?.regularMarketPrice ?? null;
    const prevClose: number = meta?.chartPreviousClose ?? meta?.previousClose ?? price ?? 0;
    const currency: string = meta?.currency ?? 'USD';
    const volume: number | null = meta?.regularMarketVolume ?? null;

    const changePct =
      price != null && prevClose > 0
        ? +((((price - prevClose) / prevClose) * 100).toFixed(2))
        : null;

    // 평균 거래량 (최근 3개월 ≈ 63거래일 평균, 오늘 제외)
    const recentVols = volumes.slice(-64, -1);
    const avgVolume =
      recentVols.length > 0
        ? Math.round(recentVols.reduce((a, b) => a + b, 0) / recentVols.length)
        : null;

    // 1개월 수익률 (약 22거래일 전 vs 현재)
    const monthIdx = Math.max(0, closes.length - 23);
    const monthAgoPrice = closes[monthIdx];
    const returnMonth =
      monthAgoPrice > 0 && price != null
        ? +((((price - monthAgoPrice) / monthAgoPrice) * 100).toFixed(2))
        : null;

    // 1년 수익률 (1년 전 vs 현재)
    const yearAgoPrice = closes[0];
    const returnYear =
      yearAgoPrice > 0 && price != null
        ? +((((price - yearAgoPrice) / yearAgoPrice) * 100).toFixed(2))
        : null;

    return { price, changePct, currency, volume, avgVolume, returnMonth, returnYear };
  } catch {
    return null;
  }
}

type PopularItem = {
  symbol: string;
  name: string;
  price: number | null;
  changePct: number | null;
  currency: string;
  volume: number | null;
  avgVolume: number | null;
  marketCap: number | null;
  returnMonth: number | null;
  returnYear: number | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const market = searchParams.get('market') ?? 'all';
  const sortBy = searchParams.get('sort') ?? 'volume';

  let tickers: { symbol: string; name: string }[];
  if (market === 'us') tickers = POPULAR_US;
  else if (market === 'kr') tickers = POPULAR_KR;
  else tickers = [...POPULAR_US, ...POPULAR_KR];

  // crumb 1회 획득 (캐시됨)
  const auth = await getYFAuth();

  const results: PopularItem[] = await Promise.all(
    tickers.map(async ({ symbol, name }) => {
      const [chart, marketCap] = await Promise.all([
        fetchChartData(symbol),
        auth ? fetchMarketCap(symbol, auth.crumb, auth.cookie) : Promise.resolve(null),
      ]);
      if (!chart || chart.price == null) {
        return { symbol, name, price: null, changePct: null, currency: 'USD', volume: null, avgVolume: null, marketCap: null, returnMonth: null, returnYear: null };
      }
      return { symbol, name, ...chart, marketCap };
    }),
  );

  const valid = results.filter((r) => r.price != null);

  let sorted: PopularItem[];
  if (sortBy === 'marketcap') {
    sorted = [
      ...valid.filter((r) => r.marketCap != null).sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0)),
      ...valid.filter((r) => r.marketCap == null),
    ];
  } else {
    sorted = [
      ...valid.filter((r) => r.volume != null).sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0)),
      ...valid.filter((r) => r.volume == null),
    ];
  }

  return NextResponse.json(sorted);
}
