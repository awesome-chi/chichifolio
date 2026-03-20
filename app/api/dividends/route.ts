import { NextRequest, NextResponse } from "next/server";

const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_KEY || process.env.FINNHUB_KEY || "";

async function finnhubFetch(endpoint: string) {
  if (!FINNHUB_KEY) return null;
  const sep = endpoint.includes("?") ? "&" : "?";
  const res = await fetch(
    `https://finnhub.io/api/v1${endpoint}${sep}token=${FINNHUB_KEY}`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) return null;
  return res.json();
}

/** Yahoo Finance chart (dividend events) - no CORS on server */
async function fetchDivFromChart(ticker: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1mo&range=1y&events=div`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ChiChiFolio/1.0)" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    const meta = result.meta;
    const divEvents = result.events?.dividends;
    if (!divEvents || Object.keys(divEvents).length === 0) {
      return { annualDividendUSD: null, annualDividendKRW: null, yieldPct: null, frequency: null, exDividendDate: null };
    }
    const divs = Object.values(divEvents) as { date: number; amount?: number }[];
    divs.sort((a, b) => b.date - a.date);
    const totalAnnual = divs.reduce((s, d) => s + (d.amount || 0), 0);
    const count = divs.length;
    const price = meta?.regularMarketPrice || 0;
    const isKRW = ticker.endsWith(".KS") || ticker.endsWith(".KQ");
    let frequency: string | null = null;
    if (count >= 11) frequency = "월배당";
    else if (count >= 3) frequency = "분기배당";
    else if (count >= 2) frequency = "반기배당";
    else if (count >= 1) frequency = "연배당";
    const yieldPct = price > 0 ? totalAnnual / price : null;
    const latestDate = divs[0]?.date ? new Date(divs[0].date * 1000).toISOString().slice(0, 10) : null;
    return {
      annualDividendUSD: isKRW ? null : totalAnnual || null,
      annualDividendKRW: isKRW ? totalAnnual || null : null,
      yieldPct,
      frequency,
      exDividendDate: latestDate,
    };
  } catch {
    return null;
  }
}

async function fetchDivFromFinnhub(ticker: string) {
  try {
    const data = await finnhubFetch(`/stock/metric?symbol=${encodeURIComponent(ticker)}&metric=all`);
    if (data?.metric) {
      const m = data.metric;
      const isKRW = ticker.endsWith(".KS") || ticker.endsWith(".KQ");
      if (m.dividendPerShareAnnual > 0 || m.dividendYieldIndicatedAnnual > 0) {
        return {
          annualDividendUSD: isKRW ? null : (m.dividendPerShareAnnual || null),
          annualDividendKRW: isKRW ? (m.dividendPerShareAnnual || null) : null,
          yieldPct: m.dividendYieldIndicatedAnnual ? m.dividendYieldIndicatedAnnual / 100 : null,
          frequency: m.dividendPayDateFwd ? "분기배당" : null,
          exDividendDate: m.exDividendDate || null,
        };
      }
    }
  } catch {}
  return null;
}

const emptyDiv = {
  annualDividendUSD: null,
  annualDividendKRW: null,
  yieldPct: null,
  frequency: null,
  exDividendDate: null,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tickers = Array.isArray(body.tickers) ? body.tickers : [];
    if (tickers.length === 0) {
      return NextResponse.json({});
    }
    const results: Record<string, typeof emptyDiv> = {};
    await Promise.all(
      tickers.map(async (ticker: string) => {
        const chart = await fetchDivFromChart(ticker);
        if (chart) {
          results[ticker] = chart;
          return;
        }
        const fh = await fetchDivFromFinnhub(ticker);
        if (fh) {
          results[ticker] = fh;
          return;
        }
        results[ticker] = { ...emptyDiv };
      })
    );
    return NextResponse.json(results);
  } catch (e) {
    console.error("[api/dividends]", e);
    return NextResponse.json({ error: "Failed to fetch dividends" }, { status: 500 });
  }
}
