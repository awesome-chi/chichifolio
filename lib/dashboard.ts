// ─── Finnhub ────────────────────────────────────────────────
export const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_KEY || "";

export async function finnhubFetch(endpoint: string) {
  if (!FINNHUB_KEY) return null;
  const sep = endpoint.includes("?") ? "&" : "?";
  const res = await fetch(`https://finnhub.io/api/v1${endpoint}${sep}token=${FINNHUB_KEY}`);
  if (!res.ok) return null;
  return res.json();
}

// ─── Constants ───────────────────────────────────────────────
export const PALETTE = ["#06b6d4","#3b82f6","#f59e0b","#a855f7","#ec4899","#10b981","#f97316","#6366f1","#14b8a6","#ef4444"];
export const MONTHS_KR = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
export const DIV_SOURCE_TIMEOUT = 5000;
export const DIV_TOTAL_TIMEOUT_MS = 20000;

// ─── Formatters ──────────────────────────────────────────────
export const uid = () => Math.random().toString(36).slice(2, 9);
export const fmtKRW = (n: number | null) => n != null ? `₩${Math.round(n).toLocaleString("ko-KR")}` : "—";
export const fmtUSD = (n: number | null) => n != null ? `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
export const fmtPct = (n: number | null) => n != null ? `${n >= 0 ? "+" : ""}${n.toFixed(2)}%` : "—";
export const fmtDate = (ts: number | null) => ts ? new Date(ts * 1000).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }) : "—";
export function makeFormatter(displayCcy: string, rate: number | null) {
  return (krwVal: number | null) => {
    if (krwVal == null) return "—";
    if (displayCcy === "USD") { if (!rate) return "—"; return fmtUSD(krwVal / rate); }
    return fmtKRW(krwVal);
  };
}

// ─── Timeout helper ──────────────────────────────────────────
export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
}

// ─── Stock DB ────────────────────────────────────────────────
export const STOCK_DB = [
  {s:"AAPL",n:"Apple Inc.",e:"NASDAQ"},{s:"MSFT",n:"Microsoft Corporation",e:"NASDAQ"},{s:"NVDA",n:"NVIDIA Corporation",e:"NASDAQ"},
  {s:"GOOG",n:"Alphabet Inc.",e:"NASDAQ"},{s:"GOOGL",n:"Alphabet Inc. Class A",e:"NASDAQ"},{s:"AMZN",n:"Amazon.com Inc.",e:"NASDAQ"},
  {s:"META",n:"Meta Platforms Inc.",e:"NASDAQ"},{s:"TSLA",n:"Tesla Inc.",e:"NASDAQ"},{s:"BRK.B",n:"Berkshire Hathaway B",e:"NYSE"},
  {s:"AVGO",n:"Broadcom Inc.",e:"NASDAQ"},{s:"JPM",n:"JPMorgan Chase & Co.",e:"NYSE"},{s:"LLY",n:"Eli Lilly and Company",e:"NYSE"},
  {s:"V",n:"Visa Inc.",e:"NYSE"},{s:"UNH",n:"UnitedHealth Group",e:"NYSE"},{s:"MA",n:"Mastercard Inc.",e:"NYSE"},
  {s:"XOM",n:"Exxon Mobil Corporation",e:"NYSE"},{s:"COST",n:"Costco Wholesale",e:"NASDAQ"},{s:"HD",n:"The Home Depot",e:"NYSE"},
  {s:"PG",n:"Procter & Gamble",e:"NYSE"},{s:"JNJ",n:"Johnson & Johnson",e:"NYSE"},{s:"ABBV",n:"AbbVie Inc.",e:"NYSE"},
  {s:"NFLX",n:"Netflix Inc.",e:"NASDAQ"},{s:"CRM",n:"Salesforce Inc.",e:"NYSE"},{s:"BAC",n:"Bank of America",e:"NYSE"},
  {s:"AMD",n:"Advanced Micro Devices",e:"NASDAQ"},{s:"ORCL",n:"Oracle Corporation",e:"NYSE"},{s:"KO",n:"Coca-Cola Company",e:"NYSE"},
  {s:"MRK",n:"Merck & Co.",e:"NYSE"},{s:"PEP",n:"PepsiCo Inc.",e:"NASDAQ"},{s:"TMO",n:"Thermo Fisher Scientific",e:"NYSE"},
  {s:"ADBE",n:"Adobe Inc.",e:"NASDAQ"},{s:"WMT",n:"Walmart Inc.",e:"NYSE"},{s:"CSCO",n:"Cisco Systems",e:"NASDAQ"},
  {s:"DIS",n:"Walt Disney Company",e:"NYSE"},{s:"MCD",n:"McDonald's Corporation",e:"NYSE"},{s:"INTC",n:"Intel Corporation",e:"NASDAQ"},
  {s:"QCOM",n:"Qualcomm Inc.",e:"NASDAQ"},{s:"INTU",n:"Intuit Inc.",e:"NASDAQ"},{s:"TXN",n:"Texas Instruments",e:"NASDAQ"},
  {s:"IBM",n:"IBM Corporation",e:"NYSE"},{s:"GE",n:"General Electric",e:"NYSE"},{s:"NOW",n:"ServiceNow Inc.",e:"NYSE"},
  {s:"AMGN",n:"Amgen Inc.",e:"NASDAQ"},{s:"BKNG",n:"Booking Holdings",e:"NASDAQ"},{s:"GS",n:"Goldman Sachs",e:"NYSE"},
  {s:"PLTR",n:"Palantir Technologies",e:"NYSE"},{s:"PANW",n:"Palo Alto Networks",e:"NASDAQ"},{s:"CRWD",n:"CrowdStrike Holdings",e:"NASDAQ"},
  {s:"SHOP",n:"Shopify Inc.",e:"NYSE"},{s:"COIN",n:"Coinbase Global",e:"NASDAQ"},{s:"MSTR",n:"MicroStrategy Inc.",e:"NASDAQ"},
  {s:"ARM",n:"Arm Holdings",e:"NASDAQ"},{s:"SNOW",n:"Snowflake Inc.",e:"NYSE"},{s:"NET",n:"Cloudflare Inc.",e:"NYSE"},
  {s:"SPY",n:"SPDR S&P 500 ETF",e:"NYSE Arca"},{s:"QQQ",n:"Invesco QQQ Trust (Nasdaq 100)",e:"NASDAQ"},
  {s:"VOO",n:"Vanguard S&P 500 ETF",e:"NYSE Arca"},{s:"VTI",n:"Vanguard Total Stock Market ETF",e:"NYSE Arca"},
  {s:"ARKK",n:"ARK Innovation ETF",e:"NYSE Arca"},{s:"SCHD",n:"Schwab US Dividend Equity ETF",e:"NYSE Arca"},
  {s:"JEPI",n:"JPMorgan Equity Premium Income ETF",e:"NYSE Arca"},{s:"JEPQ",n:"JPMorgan Nasdaq Equity Premium Income ETF",e:"NASDAQ"},
  {s:"TQQQ",n:"ProShares UltraPro QQQ (3x)",e:"NASDAQ"},{s:"SOXL",n:"Direxion Semiconductor Bull 3x",e:"NYSE Arca"},
  {s:"005930.KS",n:"삼성전자",e:"KRX"},{s:"000660.KS",n:"SK하이닉스",e:"KRX"},{s:"373220.KS",n:"LG에너지솔루션",e:"KRX"},
  {s:"207940.KS",n:"삼성바이오로직스",e:"KRX"},{s:"005380.KS",n:"현대자동차",e:"KRX"},{s:"000270.KS",n:"기아",e:"KRX"},
  {s:"035420.KS",n:"NAVER",e:"KRX"},{s:"035720.KS",n:"카카오",e:"KRX"},{s:"068270.KS",n:"셀트리온",e:"KRX"},
  {s:"005930.KS",n:"삼성전자",e:"KRX"},{s:"086790.KS",n:"하나금융지주",e:"KRX"},{s:"259960.KS",n:"크래프톤",e:"KRX"},
];

export function getStockName(symbol: string): string {
  const found = STOCK_DB.find(s => s.s === symbol);
  return found?.n || symbol;
}

// ─── Price fetching ──────────────────────────────────────────
async function fetchYahooPrice(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const proxies = [
    (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  ];
  for (const proxy of proxies) {
    try {
      const res = await fetch(proxy(url));
      if (!res.ok) continue;
      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (meta?.regularMarketPrice > 0) {
        const prev = meta.chartPreviousClose || meta.previousClose || 0;
        return { price: meta.regularMarketPrice, changePct: prev > 0 ? ((meta.regularMarketPrice - prev) / prev * 100) : 0 };
      }
    } catch {}
  }
  return null;
}

export async function fetchPrices(tickers: string[]): Promise<Record<string, any>> {
  if (!tickers.length) return {};
  const results: Record<string, any> = {};
  await Promise.all(tickers.map(async (ticker) => {
    const isKRW = ticker.endsWith(".KS") || ticker.endsWith(".KQ");
    if (isKRW) {
      try {
        const kr = await fetchYahooPrice(ticker);
        if (kr) { results[ticker] = { price: kr.price, name: getStockName(ticker), changePct: kr.changePct, currency: "KRW" }; return; }
      } catch {}
    }
    try {
      const data = await finnhubFetch(`/quote?symbol=${encodeURIComponent(ticker)}`);
      if (data && data.c > 0) { results[ticker] = { price: data.c, name: getStockName(ticker), changePct: data.dp, currency: isKRW ? "KRW" : "USD" }; }
    } catch {}
  }));
  return results;
}

export async function fetchRate(): Promise<number | null> {
  const apis = [
    async () => { const r = await fetch("https://api.exchangerate-api.com/v4/latest/USD"); return (await r.json())?.rates?.KRW ?? null; },
    async () => { const r = await fetch("https://open.er-api.com/v6/latest/USD"); return (await r.json())?.rates?.KRW ?? null; },
    async () => { const d = await finnhubFetch("/forex/rates?base=USD"); return d?.quote?.KRW ?? null; },
  ];
  for (const api of apis) {
    try { const r = await api(); if (r && r > 0) return r; } catch {}
  }
  return null;
}

// ─── Dividend fetching ───────────────────────────────────────
export const emptyDiv = { annualDividendUSD: null, annualDividendKRW: null, yieldPct: null, frequency: null, exDividendDate: null };

async function fetchDivFromFinnhubCalendar(ticker: string) {
  if (!FINNHUB_KEY) return null;
  const to = new Date(), from = new Date(to.getFullYear() - 2, to.getMonth(), 1);
  try {
    const data = await withTimeout(finnhubFetch(`/stock/dividend?symbol=${encodeURIComponent(ticker)}&from=${from.toISOString().slice(0,10)}&to=${to.toISOString().slice(0,10)}`), DIV_SOURCE_TIMEOUT);
    const list = Array.isArray(data) ? data : data?.data;
    if (!Array.isArray(list) || !list.length) return null;
    const sorted = [...list].sort((a: any, b: any) => (b.date || "").localeCompare(a.date || ""));
    const total = sorted.reduce((s: number, d: any) => s + (Number(d.dividend ?? d.amount ?? 0) || 0), 0);
    const count = sorted.length;
    const isKRW = ticker.endsWith(".KS") || ticker.endsWith(".KQ");
    const perYear = total / 2;
    let frequency: string | null = null;
    if (count >= 11) frequency = "월배당"; else if (count >= 3) frequency = "분기배당"; else if (count >= 2) frequency = "반기배당"; else if (count >= 1) frequency = "연배당";
    return { annualDividendUSD: isKRW ? null : (perYear || null), annualDividendKRW: isKRW ? (perYear || null) : null, yieldPct: null, frequency, exDividendDate: sorted[0]?.date ? String(sorted[0].date).slice(0, 10) : null };
  } catch { return null; }
}

async function fetchDivFromFinnhubMetric(ticker: string) {
  try {
    const data = await withTimeout(finnhubFetch(`/stock/metric?symbol=${encodeURIComponent(ticker)}&metric=all`), DIV_SOURCE_TIMEOUT);
    if (data?.metric) {
      const m = data.metric;
      const isKRW = ticker.endsWith(".KS") || ticker.endsWith(".KQ");
      if (m.dividendPerShareAnnual > 0 || m.dividendYieldIndicatedAnnual > 0) {
        return { annualDividendUSD: isKRW ? null : (m.dividendPerShareAnnual || null), annualDividendKRW: isKRW ? (m.dividendPerShareAnnual || null) : null, yieldPct: m.dividendYieldIndicatedAnnual ? m.dividendYieldIndicatedAnnual / 100 : null, frequency: m.dividendPayDateFwd ? "분기배당" : null, exDividendDate: m.exDividendDate ? String(m.exDividendDate).slice(0, 10) : null };
      }
    }
  } catch {}
  return null;
}

async function fetchDivFromChart(ticker: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1mo&range=2y&events=div`;
  const proxies = [(u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`, (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`];
  for (const proxy of proxies) {
    try {
      const res = await withTimeout(fetch(proxy(url)), DIV_SOURCE_TIMEOUT);
      if (!res.ok) continue;
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      if (!result) continue;
      const divEvents = result.events?.dividends;
      if (!divEvents || !Object.keys(divEvents).length) return { ...emptyDiv };
      const divs = (Object.values(divEvents) as any[]).sort((a: any, b: any) => b.date - a.date);
      const totalAnnual = divs.reduce((s, d: any) => s + (d.amount || 0), 0);
      const isKRW = ticker.endsWith(".KS") || ticker.endsWith(".KQ");
      let frequency: string | null = null;
      const count = divs.length;
      if (count >= 11) frequency = "월배당"; else if (count >= 3) frequency = "분기배당"; else if (count >= 2) frequency = "반기배당"; else if (count >= 1) frequency = "연배당";
      const price = result.meta?.regularMarketPrice || 0;
      return { annualDividendUSD: isKRW ? null : (totalAnnual || null), annualDividendKRW: isKRW ? (totalAnnual || null) : null, yieldPct: price > 0 ? totalAnnual / price : null, frequency, exDividendDate: divs[0]?.date ? new Date(divs[0].date * 1000).toISOString().slice(0, 10) : null };
    } catch {}
  }
  return null;
}

export async function fetchDividends(tickers: string[]): Promise<Record<string, any>> {
  if (!tickers.length) return {};
  try {
    const res = await fetch("/api/dividends", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tickers }) });
    if (!res.ok) throw new Error("API error");
    return res.json();
  } catch {
    const results: Record<string, any> = {};
    const deadline = Date.now() + DIV_TOTAL_TIMEOUT_MS;
    await Promise.all(tickers.map(async (ticker) => {
      const take = (v: any) => { if (v && (v.annualDividendUSD || v.annualDividendKRW || v.frequency || v.exDividendDate)) { results[ticker] = v; return true; } return false; };
      try {
        if (Date.now() >= deadline) { results[ticker] = emptyDiv; return; }
        if (FINNHUB_KEY) { const cal = await fetchDivFromFinnhubCalendar(ticker); if (take(cal)) return; const met = await fetchDivFromFinnhubMetric(ticker); if (take(met)) return; }
        if (Date.now() >= deadline) { results[ticker] = emptyDiv; return; }
        const chart = await fetchDivFromChart(ticker); if (take(chart)) return;
        results[ticker] = emptyDiv;
      } catch { results[ticker] = emptyDiv; }
    }));
    return results;
  }
}

// ─── Business Logic ──────────────────────────────────────────
export function calcH(h: any, pi: any, rate: number | null) {
  const isKRW = h.currency === "KRW";
  if (isKRW) {
    const costKRW = h.shares * h.avgCost;
    const currentPrice = pi?.price ?? null;
    const valKRW = currentPrice != null ? h.shares * currentPrice : null;
    const plKRW = valKRW != null ? valKRW - costKRW : null;
    const plPct = plKRW != null && costKRW ? (plKRW / costKRW) * 100 : null;
    return { costKRW, valKRW, plKRW, plPct, currentPrice, isKRW: true };
  } else {
    const costKRW = h.shares * h.avgCost * (h.purchaseRate || 1);
    const currentPrice = pi?.price ?? null;
    const valUSD = currentPrice != null ? h.shares * currentPrice : null;
    const valKRW = valUSD != null && rate ? valUSD * rate : null;
    const plKRW = valKRW != null ? valKRW - costKRW : null;
    const plPct = plKRW != null && costKRW ? (plKRW / costKRW) * 100 : null;
    return { costKRW, valKRW, plKRW, plPct, currentPrice, isKRW: false };
  }
}

export function userTotals(user: any, prices: Record<string, any>, rate: number | null) {
  let cost = 0, val: number | null = null;
  for (const h of user.holdings) {
    const c = calcH(h, prices[h.ticker], rate);
    cost += c.costKRW;
    if (c.valKRW != null) val = (val || 0) + c.valKRW;
  }
  const pl = val != null ? val - cost : null;
  const plPct = pl != null && cost ? (pl / cost) * 100 : null;
  return { totalCost: cost, totalVal: val, pl, plPct };
}
