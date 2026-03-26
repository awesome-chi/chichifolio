import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// 단기 고변동성 종목 유니버스 (미국)
const VOLATILE_US = [
  { symbol: 'NVDA',  name: 'NVIDIA' },
  { symbol: 'TSLA',  name: 'Tesla' },
  { symbol: 'AMD',   name: 'AMD' },
  { symbol: 'MSTR',  name: 'MicroStrategy' },
  { symbol: 'PLTR',  name: 'Palantir' },
  { symbol: 'COIN',  name: 'Coinbase' },
  { symbol: 'SOFI',  name: 'SoFi Technologies' },
  { symbol: 'SMCI',  name: 'Super Micro Computer' },
  { symbol: 'IONQ',  name: 'IonQ' },
  { symbol: 'RGTI',  name: 'Rigetti Computing' },
  { symbol: 'SOXL',  name: 'SOXL 3x반도체 ETF' },
  { symbol: 'TQQQ',  name: 'TQQQ 3x나스닥 ETF' },
  { symbol: 'SQQQ',  name: 'SQQQ 인버스 ETF' },
  { symbol: 'SPXL',  name: 'SPXL 3x S&P500 ETF' },
  { symbol: 'RIVN',  name: 'Rivian Automotive' },
  { symbol: 'GME',   name: 'GameStop' },
  { symbol: 'HOOD',  name: 'Robinhood Markets' },
  { symbol: 'BABA',  name: 'Alibaba Group' },
  { symbol: 'NIO',   name: 'NIO Inc.' },
  { symbol: 'AAPL',  name: 'Apple Inc.' },
  { symbol: 'META',  name: 'Meta Platforms' },
  { symbol: 'AMZN',  name: 'Amazon.com' },
  { symbol: 'MSFT',  name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'ARM',   name: 'Arm Holdings' },
  { symbol: 'AVGO',  name: 'Broadcom' },
  { symbol: 'CRWD',  name: 'CrowdStrike' },
  { symbol: 'PANW',  name: 'Palo Alto Networks' },
  { symbol: 'UBER',  name: 'Uber Technologies' },
  { symbol: 'SNAP',  name: 'Snap Inc.' },
];

// 단기 고변동성 종목 유니버스 (국내)
const VOLATILE_KR = [
  { symbol: '005930.KS', name: '삼성전자' },
  { symbol: '000660.KS', name: 'SK하이닉스' },
  { symbol: '086520.KQ', name: '에코프로' },
  { symbol: '247540.KQ', name: '에코프로비엠' },
  { symbol: '035720.KS', name: '카카오' },
  { symbol: '068270.KS', name: '셀트리온' },
  { symbol: '003670.KS', name: '포스코퓨처엠' },
  { symbol: '012450.KS', name: '한화에어로스페이스' },
  { symbol: '034020.KS', name: '두산에너빌리티' },
  { symbol: '373220.KS', name: 'LG에너지솔루션' },
  { symbol: '323410.KS', name: '카카오뱅크' },
  { symbol: '207940.KS', name: '삼성바이오로직스' },
  { symbol: '035420.KS', name: 'NAVER' },
  { symbol: '006400.KS', name: '삼성SDI' },
  { symbol: '000270.KS', name: '기아' },
  { symbol: '267260.KS', name: 'HD현대일렉트릭' },
  { symbol: '009540.KS', name: 'HD한국조선해양' },
  { symbol: '051910.KS', name: 'LG화학' },
  { symbol: '028260.KS', name: '삼성물산' },
  { symbol: '066570.KS', name: 'LG전자' },
];

// RSI(14) 계산
function calcRSI(closes: number[]): number | null {
  const valid = closes.filter((c) => c != null && !isNaN(c) && c > 0);
  if (valid.length < 15) return null;
  const slice = valid.slice(-15);
  let gains = 0, losses = 0;
  for (let i = 1; i < slice.length; i++) {
    const diff = slice[i] - slice[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  const avgGain = gains / 14;
  const avgLoss = losses / 14;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round((100 - 100 / (1 + rs)) * 10) / 10;
}

async function fetchData(symbol: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1mo`;
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;

    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
    const volumes: number[] = result.indicators?.quote?.[0]?.volume ?? [];

    const price: number | null = meta?.regularMarketPrice ?? null;
    const prevClose: number = meta?.chartPreviousClose ?? meta?.previousClose ?? price ?? 0;
    const open: number | null = meta?.regularMarketOpen ?? null;
    const currency: string = meta?.currency ?? 'USD';
    const volume: number | null = meta?.regularMarketVolume ?? null;
    const marketCap: number | null = meta?.marketCap ?? null;

    // 등락률
    const changePct =
      price != null && prevClose > 0
        ? +((((price - prevClose) / prevClose) * 100).toFixed(2))
        : null;

    // 갭 (시가 vs 전일 종가)
    const gapPct =
      open != null && prevClose > 0
        ? +((((open - prevClose) / prevClose) * 100).toFixed(2))
        : null;

    // 평균 거래량: 3개월 평균이 있으면 우선, 없으면 과거 20일 평균
    const avg3m: number | null = meta?.averageDailyVolume3Month ?? null;
    const validVols = volumes.filter((v) => v > 0);
    const avgFromHistory =
      validVols.length > 1
        ? Math.round(
            validVols.slice(0, -1).reduce((a, b) => a + b, 0) /
              (validVols.length - 1),
          )
        : null;
    const avgVolume = avg3m ?? avgFromHistory;

    // 거래량 배율
    const volRatio =
      volume != null && avgVolume != null && avgVolume > 0
        ? +((volume / avgVolume).toFixed(1))
        : null;

    // RSI
    const rsi = calcRSI(closes);

    // 태그
    const tags: string[] = [];
    if (gapPct != null && gapPct >= 1)  tags.push('갭상승');
    if (gapPct != null && gapPct <= -1) tags.push('갭하락');
    if (volRatio != null && volRatio >= 2) tags.push('거래량급증');
    if (changePct != null && changePct >= 5)  tags.push('급등');
    if (changePct != null && changePct <= -5) tags.push('급락');
    if (rsi != null && rsi < 30) tags.push('RSI과매도');
    if (rsi != null && rsi > 70) tags.push('RSI과열');

    // 종합 스코어 (단타 매력도)
    const score =
      (volRatio ?? 1) * 40 +
      Math.abs(changePct ?? 0) * 30 +
      Math.abs(gapPct ?? 0) * 30;

    return {
      price, prevClose, open, currency, volume, avgVolume, volRatio,
      changePct, gapPct, marketCap, rsi, tags, score,
    };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const market = searchParams.get('market') ?? 'all';

  let universe: { symbol: string; name: string }[];
  if (market === 'us') universe = VOLATILE_US;
  else if (market === 'kr') universe = VOLATILE_KR;
  else universe = [...VOLATILE_US, ...VOLATILE_KR];

  const results = await Promise.all(
    universe.map(async ({ symbol, name }) => {
      const d = await fetchData(symbol);
      if (!d || d.price == null) return null;
      return { symbol, name, ...d };
    }),
  );

  const valid = results.filter(Boolean);
  valid.sort((a, b) => (b!.score - a!.score));

  return NextResponse.json(valid);
}
