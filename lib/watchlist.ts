const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_KEY || '';
/** Optional: FMP API key for higher-quality symbol/name search (search-symbol + search-name). See https://site.financialmodelingprep.com/developer/docs */
const FMP_API_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY || '';

export const WATCHLIST_KEY = 'chichifolio-watchlist';

export type WatchlistItem = { symbol: string; name: string; logo?: string };

const STOCK_DB_LOCAL: { s: string; n: string }[] = [
  { s: 'AAPL', n: 'Apple Inc.' }, { s: 'MSFT', n: 'Microsoft' }, { s: 'NVDA', n: 'NVIDIA' },
  { s: 'GOOGL', n: 'Alphabet' }, { s: 'AMZN', n: 'Amazon' }, { s: 'META', n: 'Meta' },
  { s: 'TSLA', n: 'Tesla' }, { s: 'BRK.B', n: 'Berkshire Hathaway' }, { s: '005930.KS', n: '삼성전자' },
  { s: '000660.KS', n: 'SK하이닉스' }, { s: 'SPY', n: 'S&P 500 ETF' }, { s: 'QQQ', n: 'Nasdaq 100 ETF' },
  { s: 'TQQQ', n: '나스닥100 3배 ETF' }, { s: 'VOO', n: 'Vanguard S&P 500' }, { s: 'VTI', n: 'Vanguard Total Stock Market' },
];

/** 해외주식 한국어 검색용: 한국어 이름 → [심볼, 영문명]. 영문/티커 검색 API에 넘길 보조 검색어 생성 */
const KR_TO_US_STOCKS: { ko: string; symbol: string; en: string }[] = [
  { ko: '앤비디아', symbol: 'NVDA', en: 'NVIDIA' }, { ko: '엔비디아', symbol: 'NVDA', en: 'NVIDIA' }, { ko: '엔브이디에이', symbol: 'NVDA', en: 'NVIDIA' },
  { ko: '애플', symbol: 'AAPL', en: 'Apple' }, { ko: '에플', symbol: 'AAPL', en: 'Apple' },
  { ko: '마이크로소프트', symbol: 'MSFT', en: 'Microsoft' }, { ko: '마소', symbol: 'MSFT', en: 'Microsoft' },
  { ko: '테슬라', symbol: 'TSLA', en: 'Tesla' }, { ko: '텔사', symbol: 'TSLA', en: 'Tesla' },
  { ko: '아마존', symbol: 'AMZN', en: 'Amazon' }, { ko: '아마젠', symbol: 'AMZN', en: 'Amazon' },
  { ko: '구글', symbol: 'GOOGL', en: 'Alphabet' }, { ko: '알파벳', symbol: 'GOOGL', en: 'Alphabet' },
  { ko: '메타', symbol: 'META', en: 'Meta' }, { ko: '페이스북', symbol: 'META', en: 'Facebook' },
  { ko: '넷플릭스', symbol: 'NFLX', en: 'Netflix' },
  { ko: '인텔', symbol: 'INTC', en: 'Intel' },
  { ko: '에이엠디', symbol: 'AMD', en: 'AMD' },
  { ko: '코카콜라', symbol: 'KO', en: 'Coca-Cola' }, { ko: '펩시', symbol: 'PEP', en: 'PepsiCo' },
  { ko: '버크셔', symbol: 'BRK.B', en: 'Berkshire' }, { ko: '워렌버핏', symbol: 'BRK.B', en: 'Berkshire Hathaway' },
  { ko: '존슨앤존슨', symbol: 'JNJ', en: 'Johnson & Johnson' },
  { ko: 'jp모간', symbol: 'JPM', en: 'JPMorgan' }, { ko: '제이피모건', symbol: 'JPM', en: 'JPMorgan Chase' },
  { ko: '뱅크오브아메리카', symbol: 'BAC', en: 'Bank of America' }, { ko: '보아', symbol: 'BAC', en: 'Bank of America' },
  { ko: '비자', symbol: 'V', en: 'Visa' }, { ko: '마스터카드', symbol: 'MA', en: 'Mastercard' },
  { ko: '월마트', symbol: 'WMT', en: 'Walmart' }, { ko: '홈디포', symbol: 'HD', en: 'Home Depot' },
  { ko: '코스트코', symbol: 'COST', en: 'Costco' },
  { ko: '페이팔', symbol: 'PYPL', en: 'PayPal' },
  { ko: '나스닥', symbol: 'QQQ', en: 'Nasdaq' }, { ko: '스파이', symbol: 'SPY', en: 'S&P 500' },
  { ko: '오라클', symbol: 'ORCL', en: 'Oracle' }, { ko: '어도비', symbol: 'ADBE', en: 'Adobe' },
  { ko: '퀄컴', symbol: 'QCOM', en: 'Qualcomm' }, { ko: '브로드컴', symbol: 'AVGO', en: 'Broadcom' },
  { ko: '머크', symbol: 'MRK', en: 'Merck' }, { ko: '화이자', symbol: 'PFE', en: 'Pfizer' },
  { ko: '유니레버', symbol: 'UL', en: 'Unilever' },
  { ko: '디즈니', symbol: 'DIS', en: 'Disney' }, { ko: '월트디즈니', symbol: 'DIS', en: 'Walt Disney' },
  { ko: '우버', symbol: 'UBER', en: 'Uber' }, { ko: '에어비앤비', symbol: 'ABNB', en: 'Airbnb' },
  { ko: '스타벅스', symbol: 'SBUX', en: 'Starbucks' }, { ko: '맥도날드', symbol: 'MCD', en: "McDonald's" },
  { ko: '팔란티어', symbol: 'PLTR', en: 'Palantir' }, { ko: '크라우드스트라이크', symbol: 'CRWD', en: 'CrowdStrike' },
  { ko: '스노우플레이크', symbol: 'SNOW', en: 'Snowflake' }, { ko: '코인베이스', symbol: 'COIN', en: 'Coinbase' },
];

function hasHangul(str: string): boolean {
  return /[\uAC00-\uD7A3]/.test(str);
}

/** 한국어 검색어일 때 API에 쓸 추가 영문/티커 검색어 목록 반환 (원본 쿼리 + 매칭된 심볼·영문명) */
function expandSearchTerms(query: string): string[] {
  const q = query.trim();
  const terms = new Set<string>([q]);
  if (!hasHangul(q)) return [q];
  const qLower = q.toLowerCase();
  for (const { ko, symbol, en } of KR_TO_US_STOCKS) {
    if (ko.includes(q) || q.includes(ko) || qLower === ko.toLowerCase()) {
      terms.add(symbol);
      terms.add(en);
    }
  }
  return Array.from(terms);
}

export function getWatchlist(userId: string): WatchlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${WATCHLIST_KEY}-${userId}`);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.map((x: any) => ({
      symbol: x.symbol ?? '',
      name: x.name ?? x.symbol ?? '',
      logo: x.logo ?? undefined,
    }));
  } catch {
    return [];
  }
}

export function setWatchlist(userId: string, list: WatchlistItem[]): void {
  try {
    localStorage.setItem(`${WATCHLIST_KEY}-${userId}`, JSON.stringify(list));
  } catch {}
}

export type SearchResult = { symbol: string; name: string };

/** FMP Stock Symbol Search + Name Search (더 정확한 종목/회사명 매칭) */
async function searchFmp(query: string): Promise<SearchResult[]> {
  if (!FMP_API_KEY || !query.trim()) return [];
  const q = query.trim();
  try {
    const [symbolRes, nameRes] = await Promise.all([
      fetch(
        `https://financialmodelingprep.com/stable/search-symbol?query=${encodeURIComponent(q)}&apikey=${FMP_API_KEY}`
      ).then((r) => r.ok ? r.json() : []),
      fetch(
        `https://financialmodelingprep.com/stable/search-name?query=${encodeURIComponent(q)}&apikey=${FMP_API_KEY}`
      ).then((r) => r.ok ? r.json() : []),
    ]);
    const map = new Map<string, string>();
    const add = (arr: any[]) => {
      if (!Array.isArray(arr)) return;
      for (const r of arr) {
        const sym = r?.symbol ?? r?.ticker;
        const name = r?.name ?? r?.companyName ?? r?.description ?? sym;
        if (sym && typeof sym === 'string' && sym.length <= 12) {
          if (!map.has(sym)) map.set(sym, name);
        }
      }
    };
    add(symbolRes);
    add(nameRes);
    return Array.from(map.entries()).map(([symbol, name]) => ({ symbol, name }));
  } catch {
    return [];
  }
}

/** Finnhub search (기존) */
async function searchFinnhub(query: string): Promise<SearchResult[]> {
  if (!FINNHUB_KEY) return [];
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${FINNHUB_KEY}`
    );
    const data = await res.json();
    if (data?.result?.length) {
      return data.result
        .filter((r: any) => ['Common Stock', 'ETP', 'ETF', 'REIT'].includes(r.type))
        .slice(0, 12)
        .map((r: any) => ({ symbol: r.symbol, name: r.description || r.symbol }));
    }
  } catch {}
  return [];
}

/** 검색어와 결과의 관련도 점수. boostSymbols 있으면 해당 심볼에 가산점 (한국어 검색 매칭) */
function scoreMatch(query: string, symbol: string, name: string, boostSymbols?: Set<string>): number {
  const q = query.trim().toLowerCase();
  const s = symbol.toLowerCase();
  const n = (name ?? '').toLowerCase();
  const boost = boostSymbols?.has(symbol) ? 92 : 0;
  if (!q) return boost;
  if (s === q) return 100 + boost;
  if (s.startsWith(q)) return 88 + boost;
  if (n === q) return 85 + boost;
  if (n.startsWith(q)) return 75 + boost;
  if (s.includes(q)) return 55 + boost;
  if (n.includes(q)) return 45 + boost;
  const qWords = q.split(/\s+/).filter(Boolean);
  if (qWords.every((w) => n.includes(w))) return 35 + boost;
  if (qWords.some((w) => n.includes(w) || s.includes(w))) return 20 + boost;
  return 5 + boost;
}

/** 한국어 쿼리일 때 매칭된 해외주식 심볼 집합 (정렬 시 상위 노출용) */
function koreanMatchedSymbols(query: string): Set<string> {
  const q = query.trim();
  if (!hasHangul(q)) return new Set();
  const syms = new Set<string>();
  const qLower = q.toLowerCase();
  for (const { ko, symbol } of KR_TO_US_STOCKS) {
    if (ko.includes(q) || q.includes(ko) || qLower === ko.toLowerCase()) syms.add(symbol);
  }
  return syms;
}

export async function searchStocks(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const searchTerms = expandSearchTerms(q);
  const boostSymbols = koreanMatchedSymbols(q);

  const local = STOCK_DB_LOCAL.filter(
    (st) =>
      st.s.toLowerCase().includes(q.toLowerCase()) ||
      st.n.toLowerCase().includes(q.toLowerCase()) ||
      searchTerms.some((t) => st.s.toUpperCase().includes(t.toUpperCase()) || st.n.toLowerCase().includes(t.toLowerCase()))
  )
    .slice(0, 10)
    .map((st) => ({ symbol: st.s, name: st.n }));

  const apiCalls: Promise<SearchResult[]>[] = [];
  for (const term of searchTerms) {
    if (FMP_API_KEY) apiCalls.push(searchFmp(term));
    if (FINNHUB_KEY) apiCalls.push(searchFinnhub(term));
  }

  const apiResults = apiCalls.length > 0 ? await Promise.all(apiCalls) : [];
  const merged = new Map<string, SearchResult>();

  for (const item of local) {
    merged.set(item.symbol, item);
  }
  for (const list of apiResults) {
    for (const item of list) {
      const sym = item.symbol?.trim();
      if (!sym) continue;
      if (!merged.has(sym)) merged.set(sym, item);
      else if (FMP_API_KEY && list.some((x) => x.symbol === sym) && (item.name?.length ?? 0) > (merged.get(sym)!.name?.length ?? 0)) {
        merged.set(sym, item);
      }
    }
  }

  const sorted = Array.from(merged.values())
    .map((item) => ({
      ...item,
      score: scoreMatch(q, item.symbol, item.name, boostSymbols),
    }))
    .sort((a, b) => b.score - a.score)
    .filter((x) => x.score >= 5)
    .slice(0, 20)
    .map(({ symbol, name }) => ({ symbol, name }));

  return sorted.length > 0 ? sorted : local;
}

/** Finnhub company profile2 returns logo URL. Use for US symbols; KR may not have logo. */
export async function fetchCompanyLogo(symbol: string): Promise<string | null> {
  if (!FINNHUB_KEY) return null;
  const sym = symbol.includes('.') ? symbol : symbol.length === 6 && /^\d+$/.test(symbol) ? `${symbol}.KS` : symbol;
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${FINNHUB_KEY}`
    );
    const data = await res.json();
    if (data?.logo && typeof data.logo === 'string') return data.logo;
  } catch {}
  return null;
}

/** 심볼(및 선택적 종목명)로 로고 URL 조회. 국내 종목은 name으로 검색 시 로고를 더 잘 찾음. */
export async function getStockLogoUrl(symbol: string, name?: string): Promise<string | null> {
  const sym = (symbol || '').trim().toUpperCase();
  const baseSym = sym.replace(/\.(KS|KQ)$/, '');
  if (!baseSym) return null;
  const fromFinnhub = await fetchCompanyLogo(symbol);
  if (fromFinnhub) return fromFinnhub;
  const isKR = /\.(KS|KQ)$/.test(sym);
  const queries = isKR && name?.trim() ? [name.trim(), baseSym] : [baseSym];
  for (const q of queries) {
    try {
      const res = await fetch(
        `https://www.allinvestview.com/api/logo-search/?q=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      const website = data?.results?.[0]?.website;
      if (website && typeof website === 'string') {
        return `https://cdn.tickerlogos.com/${website}`;
      }
    } catch {}
  }
  return null;
}

/** Finnhub quote full (for detail: o, h, l, pc, v) */
export type QuoteDetail = {
  c: number; d: number; dp: number; o: number; h: number; l: number; pc: number; v: number;
  currency?: string;
};

export async function fetchQuoteDetail(ticker: string): Promise<QuoteDetail | null> {
  if (!FINNHUB_KEY) return null;
  const sym = ticker.includes('.') ? ticker : ticker.length === 6 && /^\d+$/.test(ticker) ? `${ticker}.KS` : ticker;
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(sym)}&token=${FINNHUB_KEY}`
    );
    const data = await res.json();
    if (data?.c != null && data.c > 0) {
      return {
        c: data.c,
        d: data.d ?? 0,
        dp: data.dp ?? 0,
        o: data.o ?? data.c,
        h: data.h ?? data.c,
        l: data.l ?? data.c,
        pc: data.pc ?? data.c,
        v: data.v ?? 0,
      };
    }
  } catch {}
  return null;
}

/** Finnhub stock candles: resolution 1,5,15,30,60 (min), D, W, M. from/to Unix seconds */
export type CandlePoint = { t: number; o: number; h: number; l: number; c: number; v: number };

export async function fetchStockCandles(
  symbol: string,
  resolution: '1' | '5' | '15' | '30' | '60' | 'D' | 'W' | 'M',
  from: number,
  to: number
): Promise<CandlePoint[]> {
  if (!FINNHUB_KEY) return [];
  const sym = symbol.includes('.') ? symbol : symbol.length === 6 && /^\d+$/.test(symbol) ? `${symbol}.KS` : symbol;
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(sym)}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_KEY}`
    );
    const data = await res.json();
    if (data?.t && Array.isArray(data.t) && data.t.length > 0) {
      return data.t.map((t: number, i: number) => ({
        t,
        o: data.o?.[i] ?? data.c?.[i],
        h: data.h?.[i] ?? data.c?.[i],
        l: data.l?.[i] ?? data.c?.[i],
        c: data.c?.[i] ?? 0,
        v: data.v?.[i] ?? 0,
      }));
    }
  } catch {}
  return [];
}
