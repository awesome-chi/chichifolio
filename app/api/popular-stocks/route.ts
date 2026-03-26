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

type PopularItem = {
  symbol: string;
  name: string;
  price: number | null;
  changePct: number | null;
  currency: string;
  volume: number | null;
  avgVolume: number | null;
  marketCap: number | null;
};

async function fetchStockData(symbol: string): Promise<Omit<PopularItem, 'symbol' | 'name'>> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return { price: null, changePct: null, currency: 'USD', volume: null, avgVolume: null, marketCap: null };

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return { price: null, changePct: null, currency: 'USD', volume: null, avgVolume: null, marketCap: null };

    const meta = result.meta;
    const price: number = meta?.regularMarketPrice ?? null;
    const prev: number = meta?.chartPreviousClose ?? meta?.previousClose ?? price;
    const currency: string = meta?.currency ?? 'USD';
    const changePct = (price != null && prev > 0) ? ((price - prev) / prev) * 100 : null;
    const volume: number | null = meta?.regularMarketVolume ?? null;

    // 5일 평균 거래량 계산
    const volumes: number[] = result.indicators?.quote?.[0]?.volume ?? [];
    const validVols = volumes.filter((v: number) => v > 0);
    const avgVolume = validVols.length > 0
      ? Math.round(validVols.reduce((a: number, b: number) => a + b, 0) / validVols.length)
      : null;

    const marketCap: number | null = meta?.marketCap ?? null;

    return { price, changePct, currency, volume, avgVolume, marketCap };
  } catch {
    return { price: null, changePct: null, currency: 'USD', volume: null, avgVolume: null, marketCap: null };
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const market = searchParams.get('market') ?? 'all';
  const sortBy = searchParams.get('sort') ?? 'volume';

  let tickers: { symbol: string; name: string }[] = [];
  if (market === 'us') tickers = POPULAR_US;
  else if (market === 'kr') tickers = POPULAR_KR;
  else tickers = [...POPULAR_US, ...POPULAR_KR];

  const results: PopularItem[] = await Promise.all(
    tickers.map(async ({ symbol, name }) => {
      const d = await fetchStockData(symbol);
      return { symbol, name, ...d };
    })
  );

  const valid = results.filter(r => r.price != null);

  let sorted: PopularItem[];
  if (sortBy === 'marketcap') {
    sorted = valid
      .filter(r => r.marketCap != null)
      .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0));
    // marketCap 없는 항목은 뒤에 추가
    const noMcap = valid.filter(r => r.marketCap == null);
    sorted = [...sorted, ...noMcap];
  } else {
    // 기본: 거래량 순
    sorted = valid
      .filter(r => r.volume != null)
      .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
    const noVol = valid.filter(r => r.volume == null);
    sorted = [...sorted, ...noVol];
  }

  return NextResponse.json(sorted);
}
