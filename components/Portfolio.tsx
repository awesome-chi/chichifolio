import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, AreaChart, Area } from "recharts";
import { useApp, C, mono, cardSt, inpSt, lblSt } from "./AppContext";
import { searchStocks as searchStocksLib, getStockLogoUrl } from "@/lib/watchlist";
import {
  BarChart3, ArrowLeftRight, RefreshCw, LogOut, Plus, Trash2,
  Crown, ChevronDown, Pencil, Search, DollarSign, CircleDot,
  Wallet, TrendingUp, AlertTriangle, Check, X, Coins, Users, Calendar, Star,
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────
const PALETTE = ["#06b6d4","#3b82f6","#f59e0b","#a855f7","#ec4899","#10b981","#f97316","#6366f1","#14b8a6","#ef4444"];
const USER_COLORS = ["#06b6d4","#3b82f6","#f59e0b","#a855f7","#ec4899"];
const MONTHS_KR = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

const uid = () => Math.random().toString(36).slice(2, 9);
const fmtKRW = (n) => n != null ? `₩${Math.round(n).toLocaleString("ko-KR")}` : "—";
const fmtUSD = (n) => n != null ? `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
const fmtPct = (n) => n != null ? `${n >= 0 ? "+" : ""}${n.toFixed(2)}%` : "—";
const fmtDate = (ts) => ts ? new Date(ts * 1000).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" }) : "—";

// ─── Styles ──────────────────────────────────────────────────
const btnSt = (v?) => ({ background:v==="primary"?C.accent:v==="danger"?"transparent":v==="ghost"?"transparent":"rgba(15,30,50,0.8)", color:v==="primary"?"#fff":v==="danger"?C.loss:C.muted, border:v==="ghost"?`1px dashed ${C.border}`:v==="danger"?`1px solid #3a1020`:`1px solid ${C.border}`, borderRadius:10, padding:"8px 16px", cursor:"pointer", fontSize:13, fontWeight:500, transition:"all .2s", backdropFilter:"blur(4px)" });
const thSt = { fontSize:10, fontWeight:600, color:"#64748b", textTransform:"uppercase" as const, letterSpacing:"0.08em", padding:"0 12px 12px 0", textAlign:"left" as const, borderBottom:`1px solid ${C.border}`, whiteSpace:"nowrap" as const };
const tdSt = { padding:"12px 12px 12px 0", borderBottom:"1px solid rgba(23,42,69,0.5)", verticalAlign:"middle" as const };

// ─── Finnhub API ─────────────────────────────────────────────
const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_KEY || "";

async function finnhubFetch(endpoint: string) {
  if (!FINNHUB_KEY) return null;
  const sep = endpoint.includes('?') ? '&' : '?';
  const res = await fetch(`https://finnhub.io/api/v1${endpoint}${sep}token=${FINNHUB_KEY}`);
  if (!res.ok) return null;
  return res.json();
}

function getStockName(symbol: string): string {
  const found = STOCK_DB.find(s => s.s === symbol);
  return found?.n || symbol;
}

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
        const changePct = prev > 0
          ? ((meta.regularMarketPrice - prev) / prev * 100) : 0;
        return { price: meta.regularMarketPrice, changePct };
      }
    } catch {}
  }
  return null;
}

async function fetchPrices(tickers) {
  if (!tickers.length) return {};
  const results = {};
  const promises = tickers.map(async (ticker) => {
    const isKRW = ticker.endsWith('.KS') || ticker.endsWith('.KQ');

    if (isKRW) {
      try {
        const kr = await fetchYahooPrice(ticker);
        if (kr) {
          results[ticker] = {
            price: kr.price,
            name: getStockName(ticker),
            changePct: kr.changePct,
            currency: "KRW"
          };
          return;
        }
      } catch {}
    }

    try {
      const data = await finnhubFetch(`/quote?symbol=${encodeURIComponent(ticker)}`);
      if (data && data.c > 0) {
        results[ticker] = {
          price: data.c,
          name: getStockName(ticker),
          changePct: data.dp,
          currency: isKRW ? "KRW" : "USD"
        };
      }
    } catch {}
  });
  await Promise.all(promises);
  return results;
}

async function fetchRate() {
  const apis = [
    async () => {
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (!res.ok) return null;
      const d = await res.json();
      return d?.rates?.KRW ?? null;
    },
    async () => {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!res.ok) return null;
      const d = await res.json();
      return d?.rates?.KRW ?? null;
    },
    async () => {
      const data = await finnhubFetch('/forex/rates?base=USD');
      return data?.quote?.KRW ?? null;
    },
  ];
  for (const api of apis) {
    try {
      const rate = await api();
      if (rate && rate > 0) return rate;
    } catch {}
  }
  return null;
}

const STOCK_DB = [
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
  {s:"ACN",n:"Accenture plc",e:"NYSE"},{s:"DIS",n:"Walt Disney Company",e:"NYSE"},{s:"MCD",n:"McDonald's Corporation",e:"NYSE"},
  {s:"ABT",n:"Abbott Laboratories",e:"NYSE"},{s:"INTC",n:"Intel Corporation",e:"NASDAQ"},{s:"QCOM",n:"Qualcomm Inc.",e:"NASDAQ"},
  {s:"INTU",n:"Intuit Inc.",e:"NASDAQ"},{s:"TXN",n:"Texas Instruments",e:"NASDAQ"},{s:"IBM",n:"IBM Corporation",e:"NYSE"},
  {s:"GE",n:"General Electric",e:"NYSE"},{s:"NOW",n:"ServiceNow Inc.",e:"NYSE"},{s:"ISRG",n:"Intuitive Surgical",e:"NASDAQ"},
  {s:"AMGN",n:"Amgen Inc.",e:"NASDAQ"},{s:"BKNG",n:"Booking Holdings",e:"NASDAQ"},{s:"GS",n:"Goldman Sachs",e:"NYSE"},
  {s:"AMAT",n:"Applied Materials",e:"NASDAQ"},{s:"CAT",n:"Caterpillar Inc.",e:"NYSE"},{s:"UBER",n:"Uber Technologies",e:"NYSE"},
  {s:"T",n:"AT&T Inc.",e:"NYSE"},{s:"VZ",n:"Verizon Communications",e:"NYSE"},{s:"LOW",n:"Lowe's Companies",e:"NYSE"},
  {s:"NEE",n:"NextEra Energy",e:"NYSE"},{s:"SPGI",n:"S&P Global Inc.",e:"NYSE"},{s:"PFE",n:"Pfizer Inc.",e:"NYSE"},
  {s:"UNP",n:"Union Pacific Corp.",e:"NYSE"},{s:"AXP",n:"American Express",e:"NYSE"},{s:"HON",n:"Honeywell International",e:"NASDAQ"},
  {s:"DE",n:"Deere & Company",e:"NYSE"},{s:"RTX",n:"RTX Corporation",e:"NYSE"},{s:"PLTR",n:"Palantir Technologies",e:"NYSE"},
  {s:"PANW",n:"Palo Alto Networks",e:"NASDAQ"},{s:"SQ",n:"Block Inc.",e:"NYSE"},{s:"SHOP",n:"Shopify Inc.",e:"NYSE"},
  {s:"SNAP",n:"Snap Inc.",e:"NYSE"},{s:"COIN",n:"Coinbase Global",e:"NASDAQ"},{s:"SOFI",n:"SoFi Technologies",e:"NASDAQ"},
  {s:"MSTR",n:"MicroStrategy Inc.",e:"NASDAQ"},{s:"ARM",n:"Arm Holdings",e:"NASDAQ"},{s:"CRWD",n:"CrowdStrike Holdings",e:"NASDAQ"},
  {s:"SNOW",n:"Snowflake Inc.",e:"NYSE"},{s:"DDOG",n:"Datadog Inc.",e:"NASDAQ"},{s:"NET",n:"Cloudflare Inc.",e:"NYSE"},
  {s:"RBLX",n:"Roblox Corporation",e:"NYSE"},{s:"U",n:"Unity Software",e:"NYSE"},{s:"ZS",n:"Zscaler Inc.",e:"NASDAQ"},
  {s:"NIO",n:"NIO Inc.",e:"NYSE"},{s:"RIVN",n:"Rivian Automotive",e:"NASDAQ"},{s:"LCID",n:"Lucid Group",e:"NASDAQ"},
  {s:"F",n:"Ford Motor Company",e:"NYSE"},{s:"GM",n:"General Motors",e:"NYSE"},{s:"BA",n:"Boeing Company",e:"NYSE"},
  {s:"LMT",n:"Lockheed Martin",e:"NYSE"},{s:"NOC",n:"Northrop Grumman",e:"NYSE"},
  {s:"SPY",n:"SPDR S&P 500 ETF",e:"NYSE Arca"},{s:"QQQ",n:"Invesco QQQ Trust (Nasdaq 100)",e:"NASDAQ"},
  {s:"VOO",n:"Vanguard S&P 500 ETF",e:"NYSE Arca"},{s:"VTI",n:"Vanguard Total Stock Market ETF",e:"NYSE Arca"},
  {s:"IWM",n:"iShares Russell 2000 ETF",e:"NYSE Arca"},{s:"DIA",n:"SPDR Dow Jones ETF",e:"NYSE Arca"},
  {s:"ARKK",n:"ARK Innovation ETF",e:"NYSE Arca"},{s:"SCHD",n:"Schwab US Dividend Equity ETF",e:"NYSE Arca"},
  {s:"VYM",n:"Vanguard High Dividend Yield ETF",e:"NYSE Arca"},{s:"JEPI",n:"JPMorgan Equity Premium Income ETF",e:"NYSE Arca"},
  {s:"JEPQ",n:"JPMorgan Nasdaq Equity Premium Income ETF",e:"NASDAQ"},{s:"VGT",n:"Vanguard Information Technology ETF",e:"NYSE Arca"},
  {s:"SOXX",n:"iShares Semiconductor ETF",e:"NASDAQ"},{s:"SMH",n:"VanEck Semiconductor ETF",e:"NASDAQ"},
  {s:"XLF",n:"Financial Select Sector SPDR Fund",e:"NYSE Arca"},{s:"XLE",n:"Energy Select Sector SPDR Fund",e:"NYSE Arca"},
  {s:"XLK",n:"Technology Select Sector SPDR Fund",e:"NYSE Arca"},{s:"XLV",n:"Health Care Select Sector SPDR Fund",e:"NYSE Arca"},
  {s:"GLD",n:"SPDR Gold Shares",e:"NYSE Arca"},{s:"SLV",n:"iShares Silver Trust",e:"NYSE Arca"},
  {s:"TLT",n:"iShares 20+ Year Treasury Bond ETF",e:"NASDAQ"},{s:"BND",n:"Vanguard Total Bond Market ETF",e:"NASDAQ"},
  {s:"EEM",n:"iShares MSCI Emerging Markets ETF",e:"NYSE Arca"},{s:"VWO",n:"Vanguard FTSE Emerging Markets ETF",e:"NYSE Arca"},
  {s:"TQQQ",n:"ProShares UltraPro QQQ (3x)",e:"NASDAQ"},{s:"SOXL",n:"Direxion Semiconductor Bull 3x",e:"NYSE Arca"},
  {s:"005930.KS",n:"삼성전자",e:"KRX"},{s:"000660.KS",n:"SK하이닉스",e:"KRX"},{s:"373220.KS",n:"LG에너지솔루션",e:"KRX"},
  {s:"207940.KS",n:"삼성바이오로직스",e:"KRX"},{s:"005380.KS",n:"현대자동차",e:"KRX"},{s:"000270.KS",n:"기아",e:"KRX"},
  {s:"006400.KS",n:"삼성SDI",e:"KRX"},{s:"051910.KS",n:"LG화학",e:"KRX"},{s:"035420.KS",n:"NAVER",e:"KRX"},
  {s:"035720.KS",n:"카카오",e:"KRX"},{s:"068270.KS",n:"셀트리온",e:"KRX"},{s:"105560.KS",n:"KB금융",e:"KRX"},
  {s:"055550.KS",n:"신한지주",e:"KRX"},{s:"003670.KS",n:"포스코퓨처엠",e:"KRX"},{s:"012330.KS",n:"현대모비스",e:"KRX"},
  {s:"066570.KS",n:"LG전자",e:"KRX"},{s:"034730.KS",n:"SK Inc.",e:"KRX"},{s:"003550.KS",n:"LG",e:"KRX"},
  {s:"028260.KS",n:"삼성물산",e:"KRX"},{s:"017670.KS",n:"SK텔레콤",e:"KRX"},{s:"030200.KS",n:"KT",e:"KRX"},
  {s:"032830.KS",n:"삼성생명",e:"KRX"},{s:"096770.KS",n:"SK이노베이션",e:"KRX"},{s:"009150.KS",n:"삼성전기",e:"KRX"},
  {s:"010950.KS",n:"S-Oil",e:"KRX"},{s:"086790.KS",n:"하나금융지주",e:"KRX"},{s:"259960.KS",n:"크래프톤",e:"KRX"},
  {s:"352820.KS",n:"하이브",e:"KRX"},{s:"263750.KS",n:"펄어비스",e:"KRX"},{s:"036570.KS",n:"엔씨소프트",e:"KRX"},
  {s:"251270.KS",n:"넷마블",e:"KRX"},{s:"293490.KS",n:"카카오게임즈",e:"KRX"},
  {s:"247540.KS",n:"에코프로비엠",e:"KRX"},{s:"086520.KS",n:"에코프로",e:"KRX"},{s:"042700.KS",n:"한미반도체",e:"KRX"},
  {s:"402340.KS",n:"SK스퀘어",e:"KRX"},{s:"316140.KS",n:"우리금융지주",e:"KRX"},
];

// 소스별 타임아웃(ms). 프록시/외부 지연 시 빠르게 다음 소스로 넘어감
const DIV_SOURCE_TIMEOUT = 5000;
const DIV_TOTAL_TIMEOUT_MS = 20000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]);
}

/** Finnhub 배당 캘린더 API (직접 호출, CORS 없음 → 가장 빠르고 안정적) */
async function fetchDivFromFinnhubCalendar(ticker: string) {
  if (!FINNHUB_KEY) return null;
  const to = new Date();
  const from = new Date(to.getFullYear() - 2, to.getMonth(), 1);
  const fromStr = from.toISOString().slice(0, 10);
  const toStr = to.toISOString().slice(0, 10);
  try {
    const data = await withTimeout(
      finnhubFetch(`/stock/dividend?symbol=${encodeURIComponent(ticker)}&from=${fromStr}&to=${toStr}`),
      DIV_SOURCE_TIMEOUT
    );
    const list = Array.isArray(data) ? data : data?.data;
    if (!Array.isArray(list) || list.length === 0) return null;
    const sorted = [...list].sort((a: any, b: any) => (b.date || "").localeCompare(a.date || ""));
    const total = sorted.reduce((s: number, d: any) => s + (Number(d.dividend ?? d.amount ?? 0) || 0), 0);
    const count = sorted.length;
    const isKRW = ticker.endsWith(".KS") || ticker.endsWith(".KQ");
    const yearsCovered = 2;
    const perYear = total / yearsCovered;
    let frequency: string | null = null;
    if (count >= 11) frequency = "월배당";
    else if (count >= 3) frequency = "분기배당";
    else if (count >= 2) frequency = "반기배당";
    else if (count >= 1) frequency = "연배당";
    const latestDate = sorted[0]?.date ? String(sorted[0].date).slice(0, 10) : null;
    return {
      annualDividendUSD: isKRW ? null : (perYear || null),
      annualDividendKRW: isKRW ? (perYear || null) : null,
      yieldPct: null,
      frequency,
      exDividendDate: latestDate,
    };
  } catch {
    return null;
  }
}

/** Finnhub metric (연배당/수익률 등) - 보조용 */
async function fetchDivFromFinnhubMetric(ticker: string) {
  try {
    const data = await withTimeout(
      finnhubFetch(`/stock/metric?symbol=${encodeURIComponent(ticker)}&metric=all`),
      DIV_SOURCE_TIMEOUT
    );
    if (data?.metric) {
      const m = data.metric;
      const isKRW = ticker.endsWith(".KS") || ticker.endsWith(".KQ");
      if (m.dividendPerShareAnnual > 0 || m.dividendYieldIndicatedAnnual > 0) {
        return {
          annualDividendUSD: isKRW ? null : (m.dividendPerShareAnnual || null),
          annualDividendKRW: isKRW ? (m.dividendPerShareAnnual || null) : null,
          yieldPct: m.dividendYieldIndicatedAnnual ? m.dividendYieldIndicatedAnnual / 100 : null,
          frequency: m.dividendPayDateFwd ? "분기배당" : null,
          exDividendDate: m.exDividendDate ? String(m.exDividendDate).slice(0, 10) : null,
        };
      }
    }
  } catch {}
  return null;
}

/** Yahoo Chart (CORS 프록시 사용 → 느리거나 실패 많음) */
async function fetchDivFromChart(ticker: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1mo&range=2y&events=div`;
  const proxies = [
    (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  ];
  for (const proxy of proxies) {
    try {
      const res = await withTimeout(fetch(proxy(url)), DIV_SOURCE_TIMEOUT);
      if (!res.ok) continue;
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      if (!result) continue;
      const meta = result.meta;
      const divEvents = result.events?.dividends;
      if (!divEvents || Object.keys(divEvents).length === 0) {
        return { annualDividendUSD: null, annualDividendKRW: null, yieldPct: null, frequency: null, exDividendDate: null };
      }
      const divs = Object.values(divEvents) as any[];
      divs.sort((a: any, b: any) => b.date - a.date);
      const totalAnnual = divs.reduce((s, d: any) => s + (d.amount || 0), 0);
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
        annualDividendUSD: isKRW ? null : (totalAnnual || null),
        annualDividendKRW: isKRW ? (totalAnnual || null) : null,
        yieldPct,
        frequency,
        exDividendDate: latestDate,
      };
    } catch {}
  }
  return null;
}

const emptyDiv = { annualDividendUSD: null, annualDividendKRW: null, yieldPct: null, frequency: null, exDividendDate: null };

async function fetchDividends(tickers: string[]) {
  if (!tickers.length) return {};
  try {
    const res = await fetch("/api/dividends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickers }),
    });
    if (!res.ok) throw new Error("Dividend API error");
    return res.json();
  } catch {
    // Fallback: client-side fetch when API route fails
    const results: Record<string, any> = {};
    const deadline = Date.now() + DIV_TOTAL_TIMEOUT_MS;
    const promises = tickers.map(async (ticker) => {
      const take = (v: any) => {
        if (v && (v.annualDividendUSD || v.annualDividendKRW || v.frequency || v.exDividendDate)) {
          results[ticker] = v;
          return true;
        }
        return false;
      };
      try {
        if (Date.now() >= deadline) { results[ticker] = emptyDiv; return; }
        if (FINNHUB_KEY) {
          const cal = await fetchDivFromFinnhubCalendar(ticker);
          if (take(cal)) return;
          const met = await fetchDivFromFinnhubMetric(ticker);
          if (take(met)) return;
        }
        if (Date.now() >= deadline) { results[ticker] = emptyDiv; return; }
        const chart = await fetchDivFromChart(ticker);
        if (take(chart)) return;
        results[ticker] = emptyDiv;
      } catch {
        results[ticker] = emptyDiv;
      }
    });
    await Promise.all(promises);
    return results;
  }
}

// ─── Business Logic ───────────────────────────────────────────
function calcH(h, pi, rate) {
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

function userTotals(user, prices, rate) {
  let cost = 0, val = null;
  for (const h of user.holdings) {
    const c = calcH(h, prices[h.ticker], rate);
    cost += c.costKRW;
    if (c.valKRW != null) val = (val || 0) + c.valKRW;
  }
  const pl = val != null ? val - cost : null;
  const plPct = pl != null && cost ? (pl / cost) * 100 : null;
  return { totalCost: cost, totalVal: val, pl, plPct };
}

// ─── Display Formatting (KRW / USD 토글) ─────────────────────
function makeFormatter(displayCcy, rate) {
  return (krwVal) => {
    if (krwVal == null) return "—";
    if (displayCcy === "USD") {
      if (!rate) return "—";
      return fmtUSD(krwVal / rate);
    }
    return fmtKRW(krwVal);
  };
}

// ─── Shared UI ────────────────────────────────────────────────
function Modal({ title, onClose, width = 430, children }) {
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[300] backdrop-blur-md"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface-card border border-line rounded-2xl p-7 overflow-y-auto" style={{ width, maxWidth:"94vw", maxHeight:"90vh" }}>
        <div className="flex items-center justify-between mb-5">
          <span className="font-extrabold text-[17px] text-white">{title}</span>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition p-1"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function TabBtn({ active, color, onClick, children }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-all duration-150 text-[12px] sm:text-[13px] rounded-lg px-3 sm:px-3.5 py-2 sm:py-1.5 min-h-[44px] sm:min-h-0 cursor-pointer touch-manipulation"
      style={{ fontWeight:active?600:400, color:active?"#fff":"#64748b", background:active?`${color}18`:"transparent", border:active?`1px solid ${color}40`:"1px solid transparent" }}>
      {children}
    </button>
  );
}

function Avatar({ user, size = 38 }) {
  return (
    <div className="rounded-full flex items-center justify-center font-extrabold shrink-0"
      style={{ width:size, height:size, background:`${user.color}15`, border:`2px solid ${user.color}40`, fontSize:size*.38, color:user.color }}>
      {user.name[0]}
    </div>
  );
}

function CcyToggle({ value, onChange }) {
  return (
    <div className="flex items-center rounded-lg border border-line overflow-hidden bg-surface-hover">
      {["KRW","USD"].map(c => (
        <button key={c} onClick={() => onChange(c)}
          className="px-3 py-1.5 text-xs font-medium border-none cursor-pointer transition-all"
          style={{ background:value===c?"#06b6d4":"transparent", color:value===c?"#fff":"#64748b", fontWeight:value===c?700:400 }}>
          {c === "KRW" ? "₩ 원화" : "$ 달러"}
        </button>
      ))}
    </div>
  );
}

// ─── DonutChart ───────────────────────────────────────────────
function DonutChart({ holdings, prices, rate, size = 170 }) {
  const data = holdings.map(h => {
    const c = calcH(h, prices[h.ticker], rate);
    return { ticker: h.ticker, val: c.valKRW ?? c.costKRW ?? 0 };
  }).filter(d => d.val > 0);
  const total = data.reduce((s, d) => s + d.val, 0);
  if (!total) return (
    <div style={{ width:size, height:size, borderRadius:"50%", border:`2px dashed ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", color:C.muted, fontSize:11, flexShrink:0 }}>No data</div>
  );
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="val" cx="50%" cy="50%" innerRadius={size*.33} outerRadius={size*.46} paddingAngle={2} strokeWidth={0}>
            {data.map((_, i) => <Cell key={i} fill={PALETTE[i%PALETTE.length]} />)}
          </Pie>
          <Tooltip formatter={(v: any, n: any, p: any) => [`${((Number(v)/total)*100).toFixed(1)}%`, p.payload.ticker]}
            contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, fontSize:12, color:C.text }} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center", pointerEvents:"none" }}>
        <div style={{ fontSize:9, color:C.muted }}>총자산</div>
        <div style={{ ...mono, fontSize:10, fontWeight:700, color:C.text, whiteSpace:"nowrap" }}>{fmtKRW(total)}</div>
      </div>
    </div>
  );
}

function HoldingLegend({ holdings, prices, rate, fmt }) {
  const rows = holdings.map((h, i) => {
    const c = calcH(h, prices[h.ticker], rate);
    return { h, c, val: c.valKRW ?? c.costKRW ?? 0, color: PALETTE[i%PALETTE.length], name: prices[h.ticker]?.name ?? h._name ?? h.ticker };
  });
  const total = rows.reduce((s, r) => s + r.val, 0);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {rows.map(({ h, c, val, color, name }) => {
        const w = total > 0 ? (val/total)*100 : 0;
        return (
          <div key={h.id} style={{ display:"flex", alignItems:"center", gap:7, minWidth:0 }}>
            <div style={{ width:9, height:9, borderRadius:2, background:color, flexShrink:0 }} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                <span style={{ fontWeight:700, fontSize:12, color:C.accent, flexShrink:0 }}>{h.ticker}</span>
                <span style={{ fontSize:10, color:C.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{name}</span>
                <span style={{ ...mono, fontSize:11, fontWeight:600, color:C.text, flexShrink:0 }}>{w.toFixed(1)}%</span>
              </div>
              <div style={{ height:3, background:C.border, borderRadius:2, marginTop:3 }}>
                <div style={{ height:"100%", width:`${Math.min(w,100)}%`, background:color, borderRadius:2, transition:"width .5s" }} />
              </div>
              <div style={{ display:"flex", gap:8, marginTop:1 }}>
                <span style={{ ...mono, fontSize:10, color:C.muted }}>{fmt(c.valKRW)}</span>
                <span style={{ ...mono, fontSize:10, color:c.plPct!=null?(c.plPct>=0?C.gain:C.loss):C.muted }}>{fmtPct(c.plPct)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Stock Search Input (FMP + Finnhub 통합 검색) ────────────────────────
type SearchResultItem = { symbol: string; name: string; exchange?: string; logo?: string | null };

function StockSearchInput({ value, onChange, onSelect }) {
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [status, setStatus] = useState("idle");
  const [open, setOpen] = useState(false);
  const timer = useRef<any>(null);
  const searchGen = useRef(0);

  const handleChange = (v) => {
    onChange(v);
    clearTimeout(timer.current);
    if (v.trim().length < 1) { setResults([]); setOpen(false); setStatus("idle"); return; }
    setStatus("loading");
    timer.current = setTimeout(async () => {
      const gen = ++searchGen.current;
      try {
        const list = await searchStocksLib(v.trim());
        const merged: SearchResultItem[] = list.map(r => ({ symbol: r.symbol, name: r.name || r.symbol, exchange: "" }));
        setResults(merged);
        setOpen(merged.length > 0);
        setStatus(merged.length > 0 ? "ok" : "empty");
        if (merged.length > 0) {
          Promise.all(merged.map(async (r) => ({ symbol: r.symbol, logo: await getStockLogoUrl(r.symbol, r.name) }))).then((pairs) => {
            if (gen !== searchGen.current) return;
            setResults(prev => prev.map(r => {
              const p = pairs.find(x => x.symbol === r.symbol);
              return p ? { ...r, logo: p.logo ?? null } : r;
            }));
          });
        }
      } catch {
        setStatus("empty");
      }
    }, 350);
  };

  return (
    <div style={{ position:"relative" }}>
      <div style={{ position:"relative" }}>
        <input style={{ ...inpSt, paddingRight:110 }} value={value}
          onChange={e => handleChange(e.target.value)}
          placeholder="예: AAPL, 삼성전자, VOO, NVDA"
          autoComplete="off"
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)} />
        <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", fontSize:11, color:status==="error"?C.loss:C.muted }}>
          {status==="loading" ? "🔍 검색 중…" : status==="error" ? "⚠ 오류" : status==="empty" ? "결과 없음" : ""}
        </span>
      </div>
      {open && results.length > 0 && (
        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, background:C.card, border:`1px solid ${C.border}`, borderRadius:10, zIndex:200, maxHeight:260, overflowY:"auto", boxShadow:"0 8px 32px rgba(0,0,0,.5)" }}>
          {results.map(r => {
            const initials = (r.name || r.symbol).replace(/\.[A-Z]+$/, "").slice(0, 2);
            return (
              <div key={r.symbol} onMouseDown={() => { onSelect({ ticker: r.symbol, name: r.name || r.symbol }); setOpen(false); setResults([]); }}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", cursor:"pointer", borderBottom:`1px solid ${C.border}` }}
                onMouseEnter={e => e.currentTarget.style.background="#0a1829"}
                onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                <div style={{ width:40, height:40, borderRadius:10, background:"#0a1829", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:C.accent, flexShrink:0, overflow:"hidden", position:"relative" }}>
                  {r.logo ? (
                    <>
                      <img src={r.logo} alt="" width={40} height={40} style={{ objectFit:"contain", width:40, height:40 }} onError={(e) => { const t = e.target as HTMLImageElement; t.style.display = "none"; const s = t.nextElementSibling as HTMLElement; if (s) s.style.display = "inline"; }} />
                      <span style={{ position:"absolute", display:"none", left:0, right:0, textAlign:"center" }}>{initials}</span>
                    </>
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:15, color:"#fff", lineHeight:1.25, marginBottom:2 }}>{r.name}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{r.symbol}</div>
                </div>
                {r.exchange ? <div style={{ fontSize:10, color:C.subtle, flexShrink:0 }}>{r.exchange}</div> : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Stock Modal ──────────────────────────────────────────────
function StockModal({ holding = null, onSave, onClose }: { holding?: any; onSave: any; onClose: any }) {
  const [ticker, setTicker] = useState(holding?.ticker || "");
  const [name, setName] = useState(holding?._name || "");
  const [currency, setCurrency] = useState(holding?.currency || "USD");
  const [shares, setShares] = useState(String(holding?.shares || ""));
  const [avgCost, setAvgCost] = useState(String(holding?.avgCost || ""));
  const [purchaseRate, setPurchaseRate] = useState(String(holding?.purchaseRate || ""));

  const valid = ticker.trim() && shares && avgCost && (currency === "KRW" || purchaseRate);

  const submit = () => {
    if (!valid) return;
    onSave({
      id: holding?.id,
      ticker: ticker.trim().toUpperCase(),
      _name: name,
      currency,
      shares: Number(shares),
      avgCost: Number(avgCost),
      purchaseRate: currency === "KRW" ? 1 : Number(purchaseRate),
    });
  };

  return (
    <Modal title={holding ? "종목 수정" : "종목 추가"} onClose={onClose}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div>
          <label style={lblSt}>종목 검색 (티커 / 종목명)</label>
          <StockSearchInput value={ticker} onChange={setTicker}
            onSelect={({ ticker: t, name: n }) => {
              setTicker(t);
              setName(n);
              if (t.endsWith(".KS") || t.endsWith(".KQ")) setCurrency("KRW");
              else setCurrency("USD");
            }} />
          {name && <div style={{ fontSize:11, color:C.gain, marginTop:5 }}>✓ {name}</div>}
        </div>

        <div>
          <label style={lblSt}>주가 통화</label>
          <div style={{ display:"flex", gap:8 }}>
            {["USD","KRW"].map(c => (
              <button key={c} onClick={() => setCurrency(c)}
                style={{ flex:1, padding:"9px 0", borderRadius:8, cursor:"pointer", fontWeight:currency===c?700:400, fontSize:13, background:currency===c?(c==="USD"?C.accent:C.gain):"#0a1829", color:currency===c?"#fff":C.muted, border:`1px solid ${currency===c?(c==="USD"?C.accent:C.gain):C.border}`, transition:"all .15s" }}>
                {c === "USD" ? "🇺🇸 USD (미국 주식)" : "🇰🇷 KRW (국내 주식)"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={lblSt}>보유 수량</label>
          <input style={inpSt} type="number" value={shares} onChange={e => setShares(e.target.value)} placeholder="10" />
        </div>

        <div>
          <label style={lblSt}>평균 매입가 ({currency === "KRW" ? "₩ 원화" : "$ USD"})</label>
          <input style={inpSt} type="number" value={avgCost} onChange={e => setAvgCost(e.target.value)}
            placeholder={currency === "KRW" ? "예: 75000" : "예: 150.00"} />
        </div>

        {currency === "USD" && (
          <div>
            <label style={lblSt}>매입 당시 환율 (₩/USD)</label>
            <input style={inpSt} type="number" value={purchaseRate} onChange={e => setPurchaseRate(e.target.value)} placeholder="예: 1380" />
          </div>
        )}
      </div>

      {currency === "KRW" && (
        <div style={{ background:"#0a1829", borderRadius:8, padding:"9px 13px", marginTop:12, fontSize:11, color:C.muted, lineHeight:1.6 }}>
          🇰🇷 국내 주식은 원화로 직접 입력합니다. 매입환율 입력이 필요 없습니다.
        </div>
      )}

      <div style={{ display:"flex", gap:8, marginTop:20, justifyContent:"flex-end" }}>
        <button style={btnSt()} onClick={onClose}>취소</button>
        <button style={{ ...btnSt("primary"), opacity: valid ? 1 : 0.4 }} onClick={submit}>{holding ? "저장" : "추가"}</button>
      </div>
    </Modal>
  );
}

function UserFormModal({ existing = null, onSave, onClose }: { existing?: any; onSave: any; onClose: any }) {
  const [name, setName] = useState(existing?.name || "");
  const [pw, setPw] = useState("");
  const [isAdmin, setIsAdmin] = useState(existing?.isAdmin || false);
  const valid = name.trim() && (existing || pw.trim());
  return (
    <Modal title={existing ? "사용자 수정" : "사용자 추가"} onClose={onClose}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <div><label style={lblSt}>이름</label><input style={inpSt} value={name} onChange={e => setName(e.target.value)} placeholder="홍길동" autoFocus /></div>
        <div>
          <label style={lblSt}>비밀번호{existing && <span style={{ color:C.subtle }}> (변경 시만 입력)</span>}</label>
          <input style={inpSt} type="text" value={pw} onChange={e => setPw(e.target.value)} placeholder={existing ? "변경할 비밀번호" : "비밀번호 입력"} />
        </div>
        {!existing && (
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13, color:C.muted }}>
            <input type="checkbox" checked={isAdmin} onChange={e => setIsAdmin(e.target.checked)} />
            관리자 권한
          </label>
        )}
      </div>
      <div style={{ display:"flex", gap:8, marginTop:22, justifyContent:"flex-end" }}>
        <button style={btnSt()} onClick={onClose}>취소</button>
        <button style={{ ...btnSt("primary"), opacity: valid ? 1 : 0.4 }}
          onClick={() => valid && onSave({ name: name.trim(), password: pw.trim() || null, isAdmin })}>
          {existing ? "저장" : "추가"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Holding Detail Modal (클릭 시 상세정보) ───────────────────
function HoldingDetailModal({ holding, prices, rate, fmt, displayCcy, onClose, onEdit, onDel, canEdit }) {
  const pi = prices[holding?.ticker];
  const c = holding ? calcH(holding, pi, rate) : null;
  const pos = c && c.plKRW != null && c.plKRW >= 0;
  const priceDisplay = c?.currentPrice != null
    ? (holding.currency === "KRW" ? fmtKRW(c.currentPrice) : fmtUSD(c.currentPrice))
    : null;
  const name = holding ? (pi?.name ?? holding._name ?? holding.ticker) : "";

  if (!holding) return null;
  return (
    <Modal title="" onClose={onClose}>
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:48, height:48, borderRadius:"50%", background:PALETTE[0], display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:16, flexShrink:0 }}>
            {holding.ticker.replace(/\.(KS|KQ)$/,"").slice(0,2)}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontWeight:800, fontSize:17, color:C.text }}>{name}</div>
            <div style={{ fontSize:12, color:C.muted }}>{holding.ticker} · {holding.currency === "KRW" ? "원화" : "USD"}</div>
            {priceDisplay && (
              <div style={{ marginTop:4, fontSize:13, color:C.text }}>{priceDisplay}
                {pi?.changePct != null && (
                  <span style={{ marginLeft:6, color:pi.changePct >= 0 ? C.gain : C.loss }}>({pi.changePct >= 0 ? "+" : ""}{pi.changePct.toFixed(2)}%)</span>
                )}
              </div>
            )}
          </div>
        </div>
        <div style={{ background:"#0a1829", borderRadius:12, padding:16 }}>
          <div style={{ ...mono, fontSize:22, fontWeight:800, color:C.text, marginBottom:16 }}>{c?.valKRW != null ? fmt(c.valKRW) : "—"}</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, fontSize:13 }}>
            <div><span style={{ color:C.muted }}>원금</span><div style={{ ...mono, fontWeight:700, color:C.text }}>{fmt(c?.costKRW)}</div></div>
            <div><span style={{ color:C.muted }}>보유 수량</span><div style={{ ...mono, fontWeight:700, color:C.text }}>{holding.shares.toLocaleString()}주</div></div>
            <div><span style={{ color:C.muted }}>평균 매입가</span><div style={{ ...mono, fontWeight:700, color:C.text }}>{holding.currency === "KRW" ? fmtKRW(holding.avgCost) : fmtUSD(holding.avgCost)}</div></div>
            {holding.currency !== "KRW" && <div><span style={{ color:C.muted }}>매입 환율</span><div style={{ ...mono, fontWeight:700, color:C.text }}>₩{Number(holding.purchaseRate || 0).toLocaleString()}</div></div>}
            <div><span style={{ color:C.muted }}>평가손익</span><div style={{ ...mono, fontWeight:700, color:c?.plKRW != null ? (pos ? C.gain : C.loss) : C.text }}>{c != null ? fmt(c.plKRW) : "—"}</div></div>
            <div><span style={{ color:C.muted }}>수익률</span><div style={{ ...mono, fontWeight:700, color:c?.plPct != null ? (pos ? C.gain : C.loss) : C.text }}>{c != null ? fmtPct(c.plPct) : "—"}</div></div>
          </div>
        </div>
        {canEdit && (
          <div style={{ display:"flex", gap:8 }}>
            <button style={{ ...btnSt(), flex:1, padding:"10px" }} onClick={() => { onEdit(holding); onClose(); }}>수정</button>
            <button style={{ ...btnSt("danger"), flex:1, padding:"10px" }} onClick={() => { onDel(holding.id); onClose(); }}>삭제</button>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Holdings (모바일 친화: 카드 리스트 + 클릭 시 상세) ─────────
function HoldingsTab({ user, prices, rate, canEdit, displayCcy, onAdd, onEdit, onDel }) {
  const [detailHolding, setDetailHolding] = useState(null);
  const fmt = makeFormatter(displayCcy, rate);

  const allCalc = user.holdings.map(h => calcH(h, prices[h.ticker], rate));
  const totalVal = allCalc.reduce((s, c) => s + (c.valKRW ?? c.costKRW ?? 0), 0) || 0;

  return (
    <div style={cardSt}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:8 }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", color:C.muted, textTransform:"uppercase" }}>보유 종목</div>
        {canEdit && <button style={{ ...btnSt("primary"), display:"flex", alignItems:"center", gap:5 }} onClick={onAdd}><span style={{ fontSize:16, lineHeight:1 }}>+</span> 종목 추가</button>}
      </div>

      {user.holdings.length === 0 ? (
        <div style={{ textAlign:"center", padding:"50px 0", color:C.subtle }}>
          <div style={{ fontSize:13, marginBottom:10 }}>등록된 종목이 없습니다</div>
          {canEdit && <button style={btnSt("ghost")} onClick={onAdd}>+ 첫 번째 종목 추가</button>}
        </div>
      ) : (
        <ul style={{ listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:10 }}>
          {user.holdings.map((h, hi) => {
            const pi = prices[h.ticker];
            const c = calcH(h, pi, rate);
            const pos = c.plKRW != null && c.plKRW >= 0;
            const col = PALETTE[hi % PALETTE.length];
            const hasData = c.currentPrice != null && (c.isKRW || rate != null);
            const name = pi?.name ?? h._name ?? h.ticker;

            return (
              <li
                key={h.id}
                onClick={() => setDetailHolding(h)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === "Enter" && setDetailHolding(h)}
                style={{
                  display:"flex", alignItems:"center", gap:12, padding:"14px 12px", borderRadius:12, background:"#0a1829", border:`1px solid ${C.border}`,
                  cursor:"pointer", transition:"background .15s, border-color .15s", minHeight:56,
                }}
                className="touch-manipulation active:bg-[#0d1520]"
                onMouseEnter={e => { e.currentTarget.style.background="#0d1520"; e.currentTarget.style.borderColor=C.subtle; }}
                onMouseLeave={e => { e.currentTarget.style.background="#0a1829"; e.currentTarget.style.borderColor=C.border; }}
              >
                <div style={{ width:44, height:44, borderRadius:"50%", background:col, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:13, flexShrink:0 }}>
                  {h.ticker.replace(/\.(KS|KQ)$/,"").slice(0,2)}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, color:C.text, fontSize:"clamp(13px,2.5vw,15px)" }}>{name}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                    {h.ticker} · {h.shares.toLocaleString()}주
                  </div>
                  <div style={{ display:"flex", alignItems:"baseline", gap:8, marginTop:6, flexWrap:"wrap" }}>
                    <span style={{ ...mono, fontSize:"clamp(13px,2.5vw,15px)", fontWeight:700, color:C.text }}>{hasData ? fmt(c.valKRW) : "—"}</span>
                    <span style={{ ...mono, fontSize:12, fontWeight:600, color:hasData ? (pos ? C.gain : C.loss) : C.subtle }}>
                      {hasData ? fmt(c.plKRW) : "—"} {hasData && c.plPct != null ? `(${pos ? "+" : ""}${c.plPct.toFixed(2)}%)` : ""}
                    </span>
                  </div>
                </div>
                <div style={{ flexShrink:0, color:C.subtle }}>›</div>
              </li>
            );
          })}
        </ul>
      )}

      {detailHolding && (
        <HoldingDetailModal
          holding={detailHolding}
          prices={prices}
          rate={rate}
          fmt={fmt}
          displayCcy={displayCcy}
          onClose={() => setDetailHolding(null)}
          onEdit={onEdit}
          onDel={onDel}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}

// ─── Dividends Tab ────────────────────────────────────────────
function DividendsTab({ user, prices, divData, rate, onFetch, fmt, divLoadError }) {
  const rows = user.holdings.map((h, i) => {
    const dv = divData[h.ticker];
    const isKRW = h.currency === "KRW";
    let annualIncome = null;
    if (dv && dv !== "loading") {
      if (isKRW && dv.annualDividendKRW) annualIncome = h.shares * dv.annualDividendKRW;
      else if (!isKRW && dv.annualDividendUSD && rate) annualIncome = h.shares * dv.annualDividendUSD * rate;
    }
    return { h, dv, annualIncome, color: PALETTE[i%PALETTE.length], name: prices[h.ticker]?.name ?? h._name ?? h.ticker };
  });

  const totalAnnual = rows.reduce((s, r) => s + (r.annualIncome || 0), 0);
  const loading = user.holdings.some(h => divData[h.ticker] === "loading");
  const fetched = user.holdings.length > 0 && user.holdings.every(h => divData[h.ticker] && divData[h.ticker] !== "loading");

  const divTickers = rows.filter(r => r.dv && r.dv !== "loading" && (r.dv.annualDividendUSD || r.dv.annualDividendKRW)).map(r => r.h.ticker);
  const monthlyData = MONTHS_KR.map((m, mi) => {
    const point: Record<string, number | string> = { month: m, income: 0 };
    rows.forEach(({ h, dv, color }) => {
      if (!dv || dv === "loading") return;
      const isKRW = h.currency === "KRW";
      const baseAmt = isKRW ? (dv.annualDividendKRW || 0) : ((dv.annualDividendUSD || 0) * (rate || 1380));
      const freq = dv.frequency;
      let amt = 0;
      if (freq === "월배당") amt = h.shares * baseAmt / 12;
      else if (freq === "분기배당" && [2, 5, 8, 11].includes(mi)) amt = h.shares * baseAmt / 4;
      else if (freq === "반기배당" && [5, 11].includes(mi)) amt = h.shares * baseAmt / 2;
      else if (freq === "연배당" && mi === 11) amt = h.shares * baseAmt;
      if (amt > 0) {
        point[h.ticker] = Math.round(amt);
        point.income = (point.income as number) + Math.round(amt);
      }
    });
    point.income = Math.round(point.income as number);
    return point;
  });

  return (
    <div>
      {/* 요약 카드 3열 — ChiChiFolio 스타일 */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:12, marginBottom:16 }}>
        {[
          { label:"연간 예상 배당금", value: fmt(totalAnnual || null), color: totalAnnual > 0 ? C.gain : C.text, left: `3px solid ${totalAnnual > 0 ? C.gain : C.border}` },
          { label:"월평균 예상 배당금", value: fmt(totalAnnual > 0 ? totalAnnual / 12 : null), color: C.text, left: `3px solid ${C.border}` },
          { label:"배당 종목", value: `${divTickers.length} / ${rows.length}종목`, color: C.text, left: `3px solid ${C.border}` },
        ].map((item, i) => (
          <div key={i} style={{ ...cardSt, padding: "16px 18px", borderLeft: item.left, background: "linear-gradient(135deg, rgba(15,30,50,0.95) 0%, rgba(10,24,41,0.98) 100%)" }}>
            <div style={{ fontSize:10, color:C.muted, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600 }}>{item.label}</div>
            <div style={{ ...mono, fontSize:20, fontWeight:800, color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      {divLoadError && (
        <div style={{ textAlign:"center", padding:"12px 16px", marginBottom:14, background:"#3a1020", border:`1px solid ${C.loss}40`, borderRadius:10, color:"#fca5a5", fontSize:13 }}>
          {divLoadError}
        </div>
      )}
      {!fetched && !loading && (
        <div style={{ textAlign:"center", padding:"24px 0", marginBottom:14 }}>
          <button style={{ ...btnSt("primary"), padding:"10px 28px" }} onClick={onFetch}>배당 정보 불러오기</button>
        </div>
      )}
      {loading && (
        <div style={{ textAlign:"center", padding:"16px 0", color:C.muted, fontSize:13, marginBottom:14 }}>
          <span style={{ animation:"spin .8s linear infinite", display:"inline-block", marginRight:6 }}>↻</span>배당 정보 조회 중…
        </div>
      )}

      {/* 월별 배당 추이 — Area 차트 + 종목별 스택 */}
      {fetched && totalAnnual > 0 && (
        <div style={{ ...cardSt, marginBottom:14, overflow:"hidden", background: "linear-gradient(180deg, rgba(15,30,50,0.6) 0%, rgba(7,17,31,0.9) 100%)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8, marginBottom:16 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:2 }}>월별 예상 배당 수입</div>
              <div style={{ fontSize:11, color:C.muted }}>연간 12개월 기준 · 단위 원화</div>
            </div>
            {divTickers.length > 0 && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:10, alignItems:"center" }}>
                {rows.filter(r => r.dv && r.dv !== "loading" && (r.dv.annualDividendUSD || r.dv.annualDividendKRW)).map((r, i) => (
                  <span key={r.h.ticker} style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, color:C.muted }}>
                    <span style={{ width:8, height:8, borderRadius:4, background:PALETTE[i % PALETTE.length] }} />
                    {r.h.ticker}
                  </span>
                ))}
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData} margin={{ top:8, right:8, left:8, bottom:4 }}>
              <defs>
                <linearGradient id="divAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.gain} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={C.gain} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill:C.muted, fontSize:11 }} axisLine={{ stroke:C.border }} tickLine={false} />
              <YAxis hide domain={[0, (dataMax: number) => Math.max(dataMax * 1.1, 1)]} />
              <Tooltip
                contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, fontSize:12, color:C.text, padding:"12px 14px" }}
                formatter={(value: number) => [fmt(value), "예상 배당"]}
                labelFormatter={(label) => `📅 ${label}`}
              />
              <Area type="monotone" dataKey="income" stroke={C.gain} strokeWidth={2} fill="url(#divAreaGrad)" />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 4px 0", borderTop:`1px solid ${C.border}`, marginTop:4 }}>
            <span style={{ fontSize:10, color:C.muted }}>1월</span>
            <span style={{ fontSize:10, color:C.muted }}>12월</span>
          </div>
        </div>
      )}

      <div style={cardSt}>
        <div style={{ fontSize:11, color:C.muted, marginBottom:14, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>종목별 배당 정보</div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>{["종목명 / 티커","구분","보유수량","연간 배당/주","배당수익률","배당주기","배당락일","연간 예상 배당"].map((h,i)=><th key={i} style={thSt}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map(({ h, dv, color, name, annualIncome }) => {
                const isLoading = dv === "loading";
                const isKRW = h.currency === "KRW";
                const perShare = isKRW ? (dv?.annualDividendKRW ? fmtKRW(dv.annualDividendKRW) : "—") : (dv?.annualDividendUSD ? fmtUSD(dv.annualDividendUSD) : "—");
                return (
                  <tr key={h.id} onMouseEnter={e=>e.currentTarget.style.background="#0a1829"} onMouseLeave={e=>e.currentTarget.style.background="transparent"} style={{ transition:"background .1s" }}>
                    <td style={tdSt}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <div style={{ width:4, height:30, borderRadius:2, background:color, flexShrink:0 }} />
                        <div>
                          <div style={{ fontWeight:700, color:C.accent, fontSize:12 }}>{h.ticker}</div>
                          <div style={{ fontSize:10, color:C.muted, maxWidth:130, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={tdSt}>
                      <span style={{ fontSize:10, padding:"2px 6px", borderRadius:10, background:isKRW?`${C.gain}20`:`${C.accent}20`, color:isKRW?C.gain:C.accent, fontWeight:600 }}>
                        {isKRW?"🇰🇷 KRW":"🇺🇸 USD"}
                      </span>
                    </td>
                    <td style={{ ...tdSt, ...mono }}>{h.shares.toLocaleString()}</td>
                    <td style={{ ...tdSt, ...mono }}>{isLoading?"…":perShare}</td>
                    <td style={{ ...tdSt, ...mono }}>{isLoading?"…":dv?.yieldPct!=null?`${(dv.yieldPct*100).toFixed(2)}%`:"—"}</td>
                    <td style={tdSt}>{isLoading?<span style={{color:C.muted}}>…</span>:dv?.frequency?<span style={{ fontSize:11, padding:"2px 7px", borderRadius:12, background:`${C.gain}20`, color:C.gain, fontWeight:600 }}>{dv.frequency}</span>:<span style={{color:C.subtle}}>—</span>}</td>
                    <td style={{ ...tdSt, ...mono }}>{isLoading?"…":dv?.exDividendDate||"—"}</td>
                    <td style={{ ...tdSt, ...mono, color:annualIncome>0?C.gain:C.subtle, fontWeight:600 }}>{isLoading?"…":annualIncome!=null?fmt(annualIncome):"—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── 배당 지급일 추정 (exDividendDate + frequency → 예상 지급일 목록) ───
function getEstimatedPaymentDates(exDateStr: string | null, frequency: string | null, count: number): string[] {
  if (!exDateStr) return [];
  const d = new Date(exDateStr + "T12:00:00Z");
  if (isNaN(d.getTime())) return [];
  const paymentOffsetDays = 14;
  d.setUTCDate(d.getUTCDate() + paymentOffsetDays);
  const out: string[] = [];
  const addMonths = (date: Date, m: number) => { const n = new Date(date); n.setUTCMonth(n.getUTCMonth() + m); return n; };
  const toYMD = (x: Date) => x.toISOString().slice(0, 10);
  if (frequency === "월배당") {
    for (let i = 0; i < count; i++) out.push(toYMD(addMonths(d, i)));
  } else if (frequency === "분기배당") {
    for (let i = 0; i < count; i++) out.push(toYMD(addMonths(d, i * 3)));
  } else if (frequency === "반기배당") {
    for (let i = 0; i < count; i++) out.push(toYMD(addMonths(d, i * 6)));
  } else if (frequency === "연배당") {
    for (let i = 0; i < count; i++) out.push(toYMD(addMonths(d, i * 12)));
  } else {
    out.push(toYMD(d));
  }
  return out;
}

function buildDividendEvents(user: any, divData: Record<string, any>, rate: number | null) {
  const events: { date: string; ticker: string; amountKRW: number; label: string }[] = [];
  const today = new Date().toISOString().slice(0, 10);
  user.holdings.forEach((h: any) => {
    const dv = divData[h.ticker];
    if (!dv || dv === "loading" || (!dv.annualDividendUSD && !dv.annualDividendKRW)) return;
    const isKRW = h.currency === "KRW";
    const annualKRW = isKRW
      ? (dv.annualDividendKRW || 0) * h.shares
      : (dv.annualDividendUSD || 0) * h.shares * (rate || 0);
    if (annualKRW <= 0) return;
    const freq = dv.frequency || "분기배당";
    const n = freq === "월배당" ? 24 : freq === "분기배당" ? 12 : freq === "반기배당" ? 6 : 4;
    const dates = getEstimatedPaymentDates(dv.exDividendDate, freq, n);
    const perPayment = annualKRW / (freq === "월배당" ? 12 : freq === "분기배당" ? 4 : freq === "반기배당" ? 2 : 1);
    dates.forEach((date) => {
      events.push({ date, ticker: h.ticker, amountKRW: Math.round(perPayment), label: `${h.ticker} ${Math.round(perPayment).toLocaleString()}원` });
    });
  });
  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}

// ─── Dividend Calendar Tab ────────────────────────────────────
function DividendCalendarTab({ user, divData, rate, fmt }) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const events = buildDividendEvents(user, divData, rate);
  const y = viewDate.getFullYear();
  const m = viewDate.getMonth();
  const firstDay = new Date(y, m, 1);
  const lastDay = new Date(y, m + 1, 0);
  const startPad = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const monthKey = `${y}-${String(m + 1).padStart(2, "0")}`;
  const monthEvents = events.filter((e) => e.date.startsWith(monthKey));
  const monthTotal = monthEvents.reduce((s, e) => s + e.amountKRW, 0);
  const todayStr = new Date().toISOString().slice(0, 10);
  const nextEvent = events.find((e) => e.date >= todayStr);
  const dday = nextEvent ? Math.max(0, Math.ceil((new Date(nextEvent.date + "T12:00:00Z").getTime() - Date.now()) / (24 * 60 * 60 * 1000))) : null;

  const prevMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1));
  const nextMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1));
  const dayEvents = (day: number) => {
    const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.date === dateStr);
  };

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
  const grid: (number | null)[][] = [];
  let row: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) row.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    row.push(d);
    if (row.length === 7) { grid.push(row); row = []; }
  }
  if (row.length) { while (row.length < 7) row.push(null); grid.push(row); }

  return (
    <div>
      <div style={{ ...cardSt, marginBottom:14, display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:12, alignItems:"center", flexWrap:"wrap" }}>
        <div>
          <div style={{ fontSize:10, color:C.muted, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600 }}>이번 달 예상 배당 수령액</div>
          <div style={{ ...mono, fontSize:20, fontWeight:800, color: monthTotal > 0 ? C.gain : C.text }}>{fmt(monthTotal)}</div>
        </div>
        {nextEvent && dday != null && (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:10, color:C.muted, marginBottom:4, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600 }}>다음 배당일</div>
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
              <span style={{ ...mono, fontSize:18, fontWeight:800, color:C.accent }}>D-{dday}</span>
              <span style={{ fontSize:12, color:C.muted }}>{nextEvent.date}</span>
              <span style={{ fontSize:12, color:C.text }}>{nextEvent.ticker} {fmt(nextEvent.amountKRW)}</span>
            </div>
          </div>
        )}
        {!nextEvent && events.length === 0 && (
          <div style={{ fontSize:12, color:C.muted }}>배당 정보를 불러온 후 캘린더에 표시됩니다</div>
        )}
      </div>

      <div style={{ ...cardSt, marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <button onClick={prevMonth} style={{ ...btnSt("ghost"), padding:"6px 12px" }}>← 이전</button>
          <span style={{ fontSize:16, fontWeight:700, color:C.text }}>{y}년 {m + 1}월</span>
          <button onClick={nextMonth} style={{ ...btnSt("ghost"), padding:"6px 12px" }}>다음 →</button>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", tableLayout:"fixed" }}>
            <thead>
              <tr>{weekDays.map((w, i) => <th key={i} style={{ ...thSt, padding:"8px 4px", fontSize:11 }}>{w}</th>)}</tr>
            </thead>
            <tbody>
              {grid.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => {
                    const isToday = cell !== null && new Date().getDate() === cell && viewDate.getMonth() === new Date().getMonth() && viewDate.getFullYear() === new Date().getFullYear();
                    const evs = cell !== null ? dayEvents(cell) : [];
                    return (
                      <td key={ci} style={{ verticalAlign:"top", padding:4, borderBottom:`1px solid ${C.border}`, minHeight:64 }}>
                        {cell !== null && (
                          <>
                            <div style={{ fontSize:12, fontWeight:600, color:cell ? (isToday ? C.accent : C.text) : C.subtle, marginBottom:4 }}>{cell}</div>
                            {evs.map((e, i) => (
                              <div key={i} style={{ fontSize:9, padding:"2px 4px", borderRadius:4, background:`${C.gain}20`, color:C.gain, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis" }} title={e.label}>{e.ticker} {fmt(e.amountKRW)}</div>
                            ))}
                          </>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── User View ────────────────────────────────────────────────
function UserView({ user, prices, divData, rate, canEdit, isAdmin, displayCcy, onRename, onAdd, onEdit, onDel, onDelUser, onFetchDividends, divLoadError }) {
  const [activeTab, setActiveTab] = useState("holdings");
  const t = userTotals(user, prices, rate);
  const fmt = makeFormatter(displayCcy, rate);

  return (
    <div className="min-w-0">
      <div style={{ ...cardSt, marginBottom:14, background:`linear-gradient(135deg,${C.card} 60%,${user.color}0d)` }} className="overflow-hidden">
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-5">
          <div className="flex-1 min-w-0" style={{ minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
              <Avatar user={user} size={44} />
              <div className="min-w-0">
                <div style={{ fontSize:17, fontWeight:800, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                  {user.name}
                  {user.isAdmin && <Crown className="w-3.5 h-3.5 text-amber-400 inline flex-shrink-0" />}
                  {canEdit && <button onClick={onRename} style={{ background:"none", border:`1px solid ${C.border}`, color:C.muted, cursor:"pointer", borderRadius:6, padding:"1px 7px", fontSize:10 }}>수정</button>}
                </div>
                <div style={{ fontSize:11, color:C.muted }}>{user.holdings.length}개 종목 보유</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {[
                { label:"총 투자 원금", value: fmt(t.totalCost) },
                { label:"현재 총 가치", value: t.totalVal != null ? fmt(t.totalVal) : "로딩 중…" },
                { label:"평가손익", value: t.pl != null ? fmt(t.pl) : "—", color: t.pl != null ? (t.pl >= 0 ? C.gain : C.loss) : null },
                { label:"수익률", value: fmtPct(t.plPct), color: t.plPct != null ? (t.plPct >= 0 ? C.gain : C.loss) : null },
              ].map((item, i) => (
                <div key={i} style={{ background:"#0a1829", borderRadius:10, padding:"11px 13px" }} className="min-w-0">
                  <div style={{ fontSize:10, color:C.muted, marginBottom:3, textTransform:"uppercase", letterSpacing:"0.05em", fontWeight:600 }}>{item.label}</div>
                  <div style={{ ...mono, fontSize:"clamp(13px,2.5vw,15px)", fontWeight:700, color: item.color || C.text }} className="truncate">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-center sm:items-start flex-1 min-w-0">
            <DonutChart holdings={user.holdings} prices={prices} rate={rate} size={165} />
            <div className="flex-1 min-w-0 w-full sm:w-auto" style={{ paddingTop:0 }}>
              <div style={{ fontSize:10, color:C.muted, marginBottom:10, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>종목 비중</div>
              <HoldingLegend holdings={user.holdings} prices={prices} rate={rate} fmt={fmt} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ marginBottom:14, WebkitOverflowScrolling: "touch" }} role="tablist">
        <TabBtn active={activeTab==="holdings"} color={C.accent} onClick={() => setActiveTab("holdings")}><BarChart3 className="w-3.5 h-3.5 flex-shrink-0" /> <span className="whitespace-nowrap">보유 종목</span></TabBtn>
        <TabBtn active={activeTab==="dividends"} color={C.gain} onClick={() => setActiveTab("dividends")}><Coins className="w-3.5 h-3.5 flex-shrink-0" /> <span className="whitespace-nowrap">배당 정보</span></TabBtn>
        <TabBtn active={activeTab==="calendar"} color="#a855f7" onClick={() => setActiveTab("calendar")}><Calendar className="w-3.5 h-3.5 flex-shrink-0" /> <span className="whitespace-nowrap">배당 캘린더</span></TabBtn>
      </div>

      {activeTab === "holdings" && <HoldingsTab user={user} prices={prices} rate={rate} canEdit={canEdit} displayCcy={displayCcy} onAdd={onAdd} onEdit={onEdit} onDel={onDel} />}
      {activeTab === "dividends" && <DividendsTab user={user} prices={prices} divData={divData} rate={rate} onFetch={onFetchDividends} fmt={fmt} divLoadError={divLoadError} />}
      {activeTab === "calendar" && <DividendCalendarTab user={user} divData={divData} rate={rate} fmt={fmt} />}

      {isAdmin && <div style={{ marginTop:10, textAlign:"right" }}><button style={{ background:"none", border:"none", color:C.subtle, cursor:"pointer", fontSize:11 }} onClick={onDelUser}>사용자 삭제</button></div>}
    </div>
  );
}

// ─── All View ─────────────────────────────────────────────────
function AllView({ users, prices, rate, displayCcy, onTabChange }) {
  const totals = users.map(u => ({ user:u, ...userTotals(u,prices,rate) }));
  const grand = totals.reduce((a,t) => ({ cost:a.cost+t.totalCost, val:t.totalVal!=null?(a.val||0)+t.totalVal:a.val }),{cost:0,val:null});
  const grandPl = grand.val != null ? grand.val - grand.cost : null;
  const grandPct = grandPl != null && grand.cost ? (grandPl/grand.cost)*100 : null;
  const fmt = makeFormatter(displayCcy, rate);

  return (
    <div>
      <div style={{ ...cardSt, display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", marginBottom:18, padding:0, overflow:"hidden" }}>
        {[
          { label:"전체 투자 원금", value: fmt(grand.cost) },
          { label:"전체 현재 가치", value: fmt(grand.val) },
          { label:"전체 평가손익", value: fmt(grandPl), color: grandPl!=null?(grandPl>=0?C.gain:C.loss):null },
          { label:"전체 수익률", value: fmtPct(grandPct), color: grandPct!=null?(grandPct>=0?C.gain:C.loss):null },
        ].map((item, i) => (
          <div key={i} style={{ padding:"18px 22px", borderRight: i<3?`1px solid ${C.border}`:"none" }}>
            <div style={{ fontSize:10, color:C.muted, marginBottom:5, textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600 }}>{item.label}</div>
            <div style={{ ...mono, fontSize:19, fontWeight:700, color: item.color||C.text }}>{item.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
        {totals.map(({ user, totalCost, totalVal, pl, plPct }) => (
          <div key={user.id} onClick={() => onTabChange(user.id)}
            style={{ ...cardSt, cursor:"pointer", borderColor:`${user.color}30`, transition:"all .2s" }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=user.color;e.currentTarget.style.transform="translateY(-2px)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=`${user.color}30`;e.currentTarget.style.transform="none";}}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <Avatar user={user} size={34} />
              <div>
                <div className="flex items-center gap-1.5 font-bold text-[13px]">{user.name}{user.isAdmin&&<Crown className="w-3 h-3 text-amber-400" />}</div>
                <div style={{ fontSize:10, color:C.muted }}>{user.holdings.length}개 종목</div>
              </div>
              <div style={{ marginLeft:"auto", color:C.subtle }}>›</div>
            </div>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <DonutChart holdings={user.holdings} prices={prices} rate={rate} size={110} />
              <div style={{ flex:1, display:"flex", flexDirection:"column", gap:7 }}>
                {[
                  { label:"투자 원금", value: fmt(totalCost) },
                  { label:"현재 가치", value: fmt(totalVal) },
                  { label:"평가손익", value: fmt(pl), color: pl!=null?(pl>=0?C.gain:C.loss):null },
                  { label:"수익률", value: fmtPct(plPct), color: plPct!=null?(plPct>=0?C.gain:C.loss):null },
                ].map((item, i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                    <span style={{ fontSize:10, color:C.muted }}>{item.label}</span>
                    <span style={{ ...mono, fontSize:12, fontWeight:600, color: item.color||C.text }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompareView({ users, prices, rate, compareIds, setCompareIds, fmt }) {
  const toggle = id => setCompareIds(ids => ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]);
  const selected = users.filter(u => compareIds.includes(u.id));
  return (
    <div>
      <div style={{ ...cardSt, marginBottom:16 }}>
        <div style={{ fontSize:11, color:C.muted, marginBottom:12, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>비교할 포트폴리오 선택</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {users.map(u => { const on=compareIds.includes(u.id); return (
            <button key={u.id} onClick={()=>toggle(u.id)} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 14px", borderRadius:20, background:on?`${u.color}22`:"#0d1a2d", border:`1.5px solid ${on?u.color:C.border}`, cursor:"pointer", color:on?u.color:C.muted, fontSize:13, fontWeight:on?600:400, transition:"all .15s" }}>
              <div style={{ width:18, height:18, borderRadius:"50%", background:on?u.color:`${u.color}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, color:on?"#fff":u.color }}>{u.name[0]}</div>
              {u.name}
            </button>
          );})}
        </div>
      </div>
      {selected.length===0&&<div style={{ textAlign:"center", padding:"60px 0", color:C.subtle, fontSize:13 }}>비교할 포트폴리오를 선택하세요</div>}
      {selected.length>0&&(
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${Math.min(selected.length,2)},1fr)`, gap:14 }}>
          {selected.map(user => { const t=userTotals(user,prices,rate); return (
            <div key={user.id} style={{ ...cardSt, borderColor:`${user.color}40` }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, paddingBottom:12, borderBottom:`1px solid ${C.border}` }}>
                <Avatar user={user} size={34} />
                <div><div style={{ fontWeight:700, fontSize:14 }}>{user.name}</div><div style={{ fontSize:10, color:C.muted }}>{user.holdings.length}개 종목</div></div>
                <div style={{ marginLeft:"auto", textAlign:"right" }}>
                  <div style={{ ...mono, fontSize:14, fontWeight:700, color:C.text }}>{fmt(t.totalVal)}</div>
                  <div style={{ ...mono, fontSize:11, color:t.pl!=null?(t.pl>=0?C.gain:C.loss):C.muted }}>{fmtPct(t.plPct)}</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:14, alignItems:"flex-start", marginBottom:14 }}>
                <DonutChart holdings={user.holdings} prices={prices} rate={rate} size={150} />
                <div style={{ flex:1, minWidth:0 }}><HoldingLegend holdings={user.holdings} prices={prices} rate={rate} fmt={fmt} /></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                {[{label:"투자원금",value:fmt(t.totalCost)},{label:"평가금액",value:fmt(t.totalVal)},{label:"손익",value:fmt(t.pl),color:t.pl!=null?(t.pl>=0?C.gain:C.loss):null}].map((item,i)=>(
                  <div key={i} style={{ background:"#0a1829", borderRadius:8, padding:10 }}>
                    <div style={{ fontSize:9, color:C.muted, marginBottom:3 }}>{item.label}</div>
                    <div style={{ ...mono, fontSize:11, fontWeight:600, color:item.color||C.text }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          );})}
        </div>
      )}
    </div>
  );
}

function AdminUsersView({ users, onAdd, onEdit, onDelete }) {
  return (
    <div style={cardSt}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.1em" }}>사용자 관리</div>
        <button style={{ ...btnSt("primary"), display:"flex", alignItems:"center", gap:5 }} onClick={onAdd}>+ 사용자 추가</button>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {users.map(u => (
          <div key={u.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:12, background:"#0a1829", border:`1px solid ${u.color}30` }}>
            <Avatar user={u} size={36} />
            <div>
              <div className="flex items-center gap-2 font-bold text-sm">{u.name}{u.isAdmin&&<span className="flex items-center gap-1 text-[10px] text-amber-400"><Crown className="w-3 h-3" />관리자</span>}</div>
              <div style={{ fontSize:11, color:C.muted }}>{u.holdings.length}개 종목</div>
            </div>
            <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
              <button style={{ ...btnSt(), padding:"4px 12px", fontSize:12 }} onClick={() => onEdit(u)}>수정</button>
              <button style={{ ...btnSt("danger"), padding:"4px 12px", fontSize:12, border:`1px solid #2a1825` }} onClick={() => onDelete(u.id)}>삭제</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── App Root (Dashboard Only) ────────────────────────────────
export default function App() {
  const { users, session, addUser: ctxAddUser, updateUser: ctxUpdateUser, deleteUser: ctxDeleteUser, saveHoldings: ctxSaveHoldings, logout: ctxLogout, loaded, refreshUsers } = useApp();
  const router = useRouter();

  const [prices, setPrices] = useState({});
  const [divData, setDivData] = useState({});
  const [divLoadError, setDivLoadError] = useState<string | null>(null);
  const [rate, setRate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState("idle");
  const [lastUpdate, setLastUpdate] = useState(null);
  const [modal, setModal] = useState(null);
  const [view, setViewState] = useState("all");
  const [compareIds, setCompareIds] = useState([]);
  const [displayCcy, setDisplayCcy] = useState("KRW");

  const usersRef = useRef([]);
  const viewInit = useRef(false);

  const setView = useCallback((v: string) => {
    setViewState(v);
    if (typeof window !== 'undefined') {
      const newHash = `#${v}`;
      if (window.location.hash !== newHash) {
        window.history.pushState(null, '', `/dashboard${newHash}`);
      }
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const hash = window.location.hash.slice(1);
      if (hash) setViewState(hash);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => { usersRef.current = users; }, [users]);

  useEffect(() => {
    if (!viewInit.current && session && users.length > 0) {
      const me = users.find(u => u.id === session.userId);
      const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
      if (hash && (hash === 'all' || hash === 'compare' || hash === 'admin' || users.some(u => u.id === hash))) {
        setViewState(hash);
      } else if (me && !me.isAdmin) {
        setView(me.id);
      }
      viewInit.current = true;
    }
  }, [session, users, setView]);

  const doRefresh = useCallback(async (curUsers?) => {
    const src = curUsers ?? usersRef.current;
    if (!src.length) return;
    const tickers = [...new Set(src.flatMap(u => u.holdings.map(h => h.ticker)))];

    setRefreshing(true);
    setRefreshStatus("loading");
    try {
      const [newRate, priceMap] = await Promise.all([
        fetchRate(),
        tickers.length > 0 ? fetchPrices(tickers) : Promise.resolve({}),
      ]);
      let anySuccess = false;
      if (newRate) { setRate(newRate); anySuccess = true; }
      if (priceMap && Object.keys(priceMap).length > 0) {
        setPrices(p => ({ ...p, ...priceMap }));
        anySuccess = true;
      }
      if (anySuccess) {
        setLastUpdate(new Date());
        setRefreshStatus("ok");
      } else {
        setRefreshStatus("error");
      }
    } catch (e) {
      setRefreshStatus("error");
    }
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    doRefresh(users);
    const id = setInterval(() => doRefresh(), 60000);
    return () => clearInterval(id);
  }, [loaded]);

  const saveUser = async (data: any, existing?: any) => {
    if (existing) {
      await ctxUpdateUser(existing.id, { name: data.name, password: data.password || undefined });
    } else {
      const u = await ctxAddUser({ name: data.name, password: data.password, isAdmin: !!data.isAdmin });
      if (u) doRefresh([...users, u]);
    }
    setModal(null);
  };

  const delUser = async (id: string) => {
    await ctxDeleteUser(id);
    if (session?.userId === id) {
      ctxLogout();
      router.push('/');
    }
    setView("all");
  };

  const upsertHolding = async (userId: string, h: any) => {
    const ticker = h.ticker.toUpperCase().trim();
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const i = user.holdings.findIndex((x: any) => x.id === h.id);
    const newH = { ...h, ticker };
    const newHoldings = i >= 0
      ? user.holdings.map((x: any, idx: number) => idx === i ? newH : x)
      : [...user.holdings, { ...newH, id: uid() }];
    await ctxSaveHoldings(userId, newHoldings);
    fetchPrices([ticker]).then(pm => { if (pm[ticker]) setPrices(p => ({ ...p, [ticker]: pm[ticker] })); }).catch(() => {});
    if (!rate) fetchRate().then(r => { if (r) setRate(r); }).catch(() => {});
    setModal(null);
  };

  const delHolding = async (userId: string, hid: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newHoldings = user.holdings.filter((h: any) => h.id !== hid);
    await ctxSaveHoldings(userId, newHoldings);
  };

  const loadDividends = async (user: any) => {
    const tickers = user.holdings.map((h: any) => h.ticker);
    if (!tickers.length) return;
    setDivLoadError(null);
    setDivData(d => { const n = {...d}; tickers.forEach((t: string) => { if (!d[t]) n[t] = "loading"; }); return n; });
    try {
      const result = await Promise.race([
        fetchDividends(tickers),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), DIV_TOTAL_TIMEOUT_MS)),
      ]);
      setDivData(d => { const n = {...d}; tickers.forEach((t: string) => n[t] = result[t] ?? null); return n; });
    } catch {
      setDivData(d => { const n = {...d}; tickers.forEach((t: string) => { if (n[t] === "loading") n[t] = null; }); return n; });
      setDivLoadError("배당 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  const fmt = makeFormatter(displayCcy, rate);

  const me = users.find(u => u.id === session?.userId);
  const isAdmin = me?.isAdmin;
  const visibleUsers = isAdmin ? users : users.filter(u => u.id === session?.userId);
  const curUser = users.find(u => u.id === view);

  const handleLogout = () => {
    ctxLogout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-surface text-slate-200 font-sans text-sm">
      {/* Header — 모바일: 상단 여백 + 2줄(로고|사용자 / 원화|달러|새로고침), 데스크톱: 1줄 */}
      <header className="sticky top-0 z-[100] border-b border-line bg-surface/95 backdrop-blur-xl pt-[max(0.75rem,env(safe-area-inset-top))]">
        {/* 모바일: flex-col 2줄 */}
        <div className="flex flex-col gap-3 sm:hidden px-4 pb-4">
          <div className="flex items-center justify-between min-h-[2.5rem]">
            <Link href="/" className="text-base font-black text-white tracking-tight hover:opacity-90 transition no-underline shrink-0">
              ChiChiFolio<span className="text-cyan-400">.</span>
            </Link>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/watchlist" className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 transition px-2 py-1 text-[13px] font-medium">
                <Star className="w-3.5 h-3.5" />
                <span>관심종목</span>
              </Link>
              <div className="flex items-center gap-2 rounded-full px-2.5 py-1.5" style={{ background:`${me?.color}10`, border:`1px solid ${me?.color}30` }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white shrink-0" style={{ background:me?.color }}>{me?.name[0]}</div>
                <span className="text-[13px] font-semibold" style={{ color:me?.color }}>{me?.name}</span>
                {isAdmin && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              </div>
              <button onClick={handleLogout} className="p-2 -mr-1 text-slate-500 hover:text-slate-300 hover:bg-surface-hover rounded-lg transition shrink-0 touch-manipulation" title="로그아웃">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <CcyToggle value={displayCcy} onChange={setDisplayCcy} />
            <div className="flex items-center gap-1.5 text-xs">
              <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500">USD/KRW</span>
              <span className="tabular-nums font-bold" style={{ color:rate?"#06b6d4":"#334155" }}>
                {refreshStatus==="loading"&&!rate ? "조회 중…" : rate ? rate.toFixed(0) : "—"}
              </span>
            </div>
            {refreshStatus === "error" && (
              <span className="flex items-center gap-1 text-[11px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-md px-2 py-0.5">
                <AlertTriangle className="w-3 h-3" /> API 오류
              </span>
            )}
            <button className="flex items-center gap-1.5 border border-line rounded-lg px-2.5 py-1.5 text-[11px] cursor-pointer bg-transparent hover:border-slate-600 transition disabled:opacity-50 ml-auto"
              style={{ color:refreshing?"#06b6d4":"#64748b" }}
              onClick={() => doRefresh()} disabled={refreshing}>
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing?"갱신 중…":"새로고침"}
            </button>
          </div>
        </div>
        {/* 데스크톱: 1줄 (sm 이상) */}
        <div className="hidden sm:flex items-center justify-between px-4 sm:px-6 h-14">
          <Link href="/" className="text-base font-black text-white tracking-tight hover:opacity-90 transition no-underline">
            ChiChiFolio<span className="text-cyan-400">.</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <CcyToggle value={displayCcy} onChange={setDisplayCcy} />
            <div className="flex items-center gap-1.5 text-xs">
              <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500">USD/KRW</span>
              <span className="tabular-nums font-bold" style={{ color:rate?"#06b6d4":"#334155" }}>
                {refreshStatus==="loading"&&!rate ? "조회 중…" : rate ? rate.toFixed(0) : "—"}
              </span>
            </div>
            {refreshStatus === "error" && (
              <span className="flex items-center gap-1 text-[11px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-md px-2 py-0.5">
                <AlertTriangle className="w-3 h-3" /> API 오류
              </span>
            )}
            {lastUpdate && <span className="text-[10px] text-slate-600">{lastUpdate.toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</span>}
            <button className="flex items-center gap-1.5 border border-line rounded-lg px-2.5 py-1.5 text-[11px] cursor-pointer bg-transparent hover:border-slate-600 transition disabled:opacity-50"
              style={{ color:refreshing?"#06b6d4":"#64748b" }}
              onClick={() => doRefresh()} disabled={refreshing}>
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing?"갱신 중…":"새로고침"}
            </button>
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-line">
              <Link href="/watchlist" className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 transition text-[13px] font-medium">
                <Star className="w-3.5 h-3.5" />
                관심종목
              </Link>
              <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background:`${me?.color}10`, border:`1px solid ${me?.color}30` }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white" style={{ background:me?.color }}>{me?.name[0]}</div>
                <span className="text-xs font-semibold" style={{ color:me?.color }}>{me?.name}</span>
                {isAdmin && <Crown className="w-3 h-3 text-amber-400" />}
              </div>
              <button onClick={handleLogout} className="text-slate-600 hover:text-slate-300 transition p-0.5">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 sm:px-6 py-2 border-b border-line overflow-x-auto bg-surface-card/50">
        {isAdmin && <>
          <TabBtn active={view==="all"} color={C.accent} onClick={()=>setView("all")}><BarChart3 className="w-3.5 h-3.5" /> 전체</TabBtn>
          <TabBtn active={view==="compare"} color="#a855f7" onClick={()=>setView("compare")}><ArrowLeftRight className="w-3.5 h-3.5" /> 비교</TabBtn>
          <TabBtn active={view==="admin"} color={C.admin} onClick={()=>setView("admin")}><Crown className="w-3.5 h-3.5" /> 사용자</TabBtn>
        </>}
        {visibleUsers.map(u => (
          <TabBtn key={u.id} active={view===u.id} color={u.color} onClick={()=>setView(u.id)}>
            <CircleDot className="w-3 h-3" style={{ color:view===u.id?u.color:"#334155" }} />{u.name}
          </TabBtn>
        ))}
        {isAdmin && users.length < 5 && (
          <button onClick={()=>setModal({type:"addUser"})} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-slate-600 bg-transparent border border-dashed border-line hover:border-slate-500 transition whitespace-nowrap shrink-0 cursor-pointer">
            <Plus className="w-3 h-3" /> 추가
          </button>
        )}
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {view==="all" && isAdmin && <AllView users={users} prices={prices} rate={rate} displayCcy={displayCcy} onTabChange={setView} />}
        {view==="compare" && isAdmin && <CompareView users={users} prices={prices} rate={rate} compareIds={compareIds} setCompareIds={setCompareIds} fmt={fmt} />}
        {view==="admin" && isAdmin && <AdminUsersView users={users} onAdd={()=>setModal({type:"addUser"})} onEdit={u=>setModal({type:"editUser",user:u})} onDelete={delUser} />}
        {curUser && (
          <UserView user={curUser} prices={prices} divData={divData} rate={rate} divLoadError={divLoadError}
            canEdit={isAdmin || curUser.id === session?.userId}
            isAdmin={isAdmin} displayCcy={displayCcy}
            onRename={() => setModal({type:"editUser",user:curUser})}
            onAdd={() => setModal({type:"addStock",userId:curUser.id})}
            onEdit={h => setModal({type:"editStock",userId:curUser.id,holding:h})}
            onDel={hid => delHolding(curUser.id, hid)}
            onDelUser={() => delUser(curUser.id)}
            onFetchDividends={() => loadDividends(curUser)}
          />
        )}
      </div>

      {modal?.type==="addUser" && <UserFormModal onClose={()=>setModal(null)} onSave={data=>saveUser(data)} />}
      {modal?.type==="editUser" && <UserFormModal existing={modal.user} onClose={()=>setModal(null)} onSave={data=>saveUser(data,modal.user)} />}
      {modal?.type==="addStock" && <StockModal onSave={h=>upsertHolding(modal.userId,h)} onClose={()=>setModal(null)} />}
      {modal?.type==="editStock" && <StockModal holding={modal.holding} onSave={h=>upsertHolding(modal.userId,h)} onClose={()=>setModal(null)} />}
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-thumb { background:#1e3a5f; border-radius:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        * { box-sizing:border-box; }
      `}</style>
    </div>
  );
}
