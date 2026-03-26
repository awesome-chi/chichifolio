const FINNHUB_KEY = process.env.NEXT_PUBLIC_FINNHUB_KEY || '';
/** Optional: FMP API key for higher-quality symbol/name search (search-symbol + search-name). See https://site.financialmodelingprep.com/developer/docs */
const FMP_API_KEY = process.env.NEXT_PUBLIC_FMP_API_KEY || '';

export const WATCHLIST_KEY = 'chichifolio-watchlist';

export type WatchlistItem = { symbol: string; name: string; logo?: string };

const STOCK_DB_LOCAL: { s: string; n: string }[] = [
  // US Mega Cap
  { s: 'AAPL', n: 'Apple Inc.' }, { s: 'MSFT', n: 'Microsoft Corporation' }, { s: 'NVDA', n: 'NVIDIA Corporation' },
  { s: 'GOOGL', n: 'Alphabet Inc.' }, { s: 'AMZN', n: 'Amazon.com Inc.' }, { s: 'META', n: 'Meta Platforms Inc.' },
  { s: 'TSLA', n: 'Tesla Inc.' }, { s: 'BRK.B', n: 'Berkshire Hathaway' }, { s: 'JPM', n: 'JPMorgan Chase' },
  { s: 'V', n: 'Visa Inc.' }, { s: 'MA', n: 'Mastercard' }, { s: 'AVGO', n: 'Broadcom Inc.' },
  { s: 'NFLX', n: 'Netflix Inc.' }, { s: 'AMD', n: 'Advanced Micro Devices' }, { s: 'INTC', n: 'Intel Corporation' },
  { s: 'ORCL', n: 'Oracle Corporation' }, { s: 'CRM', n: 'Salesforce Inc.' }, { s: 'ADBE', n: 'Adobe Inc.' },
  { s: 'COST', n: 'Costco Wholesale' }, { s: 'WMT', n: 'Walmart Inc.' }, { s: 'DIS', n: 'Walt Disney Company' },
  { s: 'PLTR', n: 'Palantir Technologies' }, { s: 'COIN', n: 'Coinbase Global' }, { s: 'CRWD', n: 'CrowdStrike Holdings' },
  // Korean Blue Chip Stocks
  { s: '005930.KS', n: '삼성전자' }, { s: '000660.KS', n: 'SK하이닉스' },
  { s: '035420.KS', n: 'NAVER' }, { s: '035720.KS', n: '카카오' },
  { s: '207940.KS', n: '삼성바이오로직스' }, { s: '068270.KS', n: '셀트리온' },
  { s: '005380.KS', n: '현대차' }, { s: '000270.KS', n: '기아' },
  { s: '051910.KS', n: 'LG화학' }, { s: '006400.KS', n: '삼성SDI' },
  { s: '105560.KS', n: 'KB금융' }, { s: '055550.KS', n: '신한지주' },
  { s: '086790.KS', n: '하나금융지주' }, { s: '316140.KS', n: '우리금융지주' },
  { s: '003550.KS', n: 'LG' }, { s: '066570.KS', n: 'LG전자' },
  { s: '012330.KS', n: '현대모비스' }, { s: '028260.KS', n: '삼성물산' },
  { s: '017670.KS', n: 'SK텔레콤' }, { s: '030200.KS', n: 'KT' },
  { s: '032830.KS', n: '삼성생명' }, { s: '018260.KS', n: '삼성에스디에스' },
  { s: '096770.KS', n: 'SK이노베이션' }, { s: '010950.KS', n: 'S-Oil' },
  { s: '009150.KS', n: '삼성전기' }, { s: '000100.KS', n: '유한양행' },
  // KODEX ETFs (삼성자산운용)
  { s: '069500.KS', n: 'KODEX 200' }, { s: '229200.KS', n: 'KODEX 코스닥150' },
  { s: '122630.KS', n: 'KODEX 레버리지' }, { s: '252670.KS', n: 'KODEX 200선물인버스2X' },
  { s: '379800.KS', n: 'KODEX 미국S&P500TR' }, { s: '273130.KS', n: 'KODEX 미국나스닥100TR' },
  { s: '099140.KS', n: 'KODEX 고배당' }, { s: '114820.KS', n: 'KODEX 국고채3년' },
  { s: '292190.KS', n: 'KODEX 미국FANG+' }, { s: '251340.KS', n: 'KODEX 선진국MSCI World' },
  { s: '305080.KS', n: 'KODEX 200미국채혼합' }, { s: '280940.KS', n: 'KODEX 삼성그룹' },
  { s: '214980.KS', n: 'KODEX 부동산' }, { s: '453810.KS', n: 'KODEX 인도Nifty50' },
  { s: '446720.KS', n: 'KODEX 미국AI반도체나스닥' }, { s: '091160.KS', n: 'KODEX 반도체' },
  { s: '091180.KS', n: 'KODEX 자동차' }, { s: '102960.KS', n: 'KODEX 코스피' },
  { s: '148020.KS', n: 'KODEX 코스피 TR' }, { s: '287310.KS', n: 'KODEX 미국달러선물' },
  // TIGER ETFs (미래에셋자산운용)
  { s: '102110.KS', n: 'TIGER 200' }, { s: '133690.KS', n: 'TIGER 나스닥100' },
  { s: '360750.KS', n: 'TIGER 미국S&P500TR' }, { s: '210780.KS', n: 'TIGER 고배당' },
  { s: '143850.KS', n: 'TIGER 국채3년' }, { s: '195930.KS', n: 'TIGER 해외선진국MSCI(H)' },
  { s: '329200.KS', n: 'TIGER 미국채10년선물' }, { s: '381180.KS', n: 'TIGER 미국나스닥100TR(H)' },
  { s: '157490.KS', n: 'TIGER 미국S&P500선물(H)' }, { s: '117700.KS', n: 'TIGER 200IT' },
  { s: '139220.KS', n: 'TIGER 200 에너지화학' }, { s: '227550.KS', n: 'TIGER 단기채권액티브' },
  { s: '411060.KS', n: 'TIGER 미국테크TOP10INDXX' }, { s: '463050.KS', n: 'TIGER 미국AI빅테크10' },
  { s: '455890.KS', n: 'TIGER 미국배당다우존스' }, { s: '458760.KS', n: 'TIGER 미국배당+7%프리미엄다우존스' },
  // ACE ETFs (한국투자신탁운용, 구 ARIRANG)
  { s: '152100.KS', n: 'ACE 코스피100' }, { s: '195980.KS', n: 'ACE 미국나스닥100' },
  { s: '360200.KS', n: 'ACE 미국S&P500' }, { s: '161510.KS', n: 'ACE 고배당주' },
  { s: '290130.KS', n: 'ACE 코스피200' }, { s: '411590.KS', n: 'ACE 미국빅테크TOP7Plus' },
  { s: '441640.KS', n: 'ACE 미국500액티브' }, { s: '448290.KS', n: 'ACE 인도시장대표BankNifty' },
  // PLUS ETFs (한화자산운용)
  { s: '211560.KS', n: 'PLUS 고배당주' }, { s: '251600.KS', n: 'PLUS 코스피200' },
  { s: '441680.KS', n: 'PLUS 미국S&P500' }, { s: '462900.KS', n: 'PLUS 미국나스닥100' },
  { s: '472160.KS', n: 'PLUS 고배당주채권혼합' }, { s: '476550.KS', n: 'PLUS 미국배당다우존스' },
  // KBSTAR ETFs (KB자산운용)
  { s: '261220.KS', n: 'KBSTAR 200' }, { s: '322400.KS', n: 'KBSTAR 미국S&P500' },
  { s: '411270.KS', n: 'KBSTAR 미국나스닥100' }, { s: '385550.KS', n: 'KBSTAR 고배당' },
  { s: '460750.KS', n: 'KBSTAR 미국배당다우존스' },
  // HANARO ETFs (NH-Amundi자산운용)
  { s: '269530.KS', n: 'HANARO 200' }, { s: '400010.KS', n: 'HANARO 미국S&P500' },
  { s: '441800.KS', n: 'HANARO 미국배당다우존스' }, { s: '466920.KS', n: 'HANARO 고배당' },
  // SOL ETFs (신한자산운용)
  { s: '447770.KS', n: 'SOL 미국S&P500' }, { s: '460870.KS', n: 'SOL 미국나스닥100' },
  { s: '473640.KS', n: 'SOL 미국배당다우존스' }, { s: '462980.KS', n: 'SOL 고배당' },
  // KINDEX ETFs (한국투자신탁운용 → ACE 전환 전)
  { s: '214980.KS', n: 'KINDEX 부동산리츠' },
  // Broad Market ETFs
  { s: 'SPY', n: 'SPDR S&P 500 ETF Trust' }, { s: 'IVV', n: 'iShares Core S&P 500 ETF' },
  { s: 'VOO', n: 'Vanguard S&P 500 ETF' }, { s: 'VTI', n: 'Vanguard Total Stock Market ETF' },
  { s: 'QQQ', n: 'Invesco QQQ Trust (Nasdaq 100)' }, { s: 'QQQM', n: 'Invesco Nasdaq 100 ETF (Mini)' },
  { s: 'TQQQ', n: 'ProShares UltraPro QQQ 3x ETF' }, { s: 'SQQQ', n: 'ProShares UltraPro Short QQQ' },
  { s: 'VEA', n: 'Vanguard FTSE Developed Markets ETF' }, { s: 'VWO', n: 'Vanguard FTSE Emerging Markets ETF' },
  { s: 'EFA', n: 'iShares MSCI EAFE ETF' }, { s: 'EEM', n: 'iShares MSCI Emerging Markets ETF' },
  // Bond & Treasury ETFs
  { s: 'SGOV', n: 'iShares 0-3 Month Treasury Bond ETF' }, { s: 'BIL', n: 'SPDR Bloomberg 1-3 Month T-Bill ETF' },
  { s: 'SHV', n: 'iShares Short Treasury Bond ETF' }, { s: 'SHY', n: 'iShares 1-3 Year Treasury Bond ETF' },
  { s: 'IEF', n: 'iShares 7-10 Year Treasury Bond ETF' }, { s: 'TLT', n: 'iShares 20+ Year Treasury Bond ETF' },
  { s: 'BND', n: 'Vanguard Total Bond Market ETF' }, { s: 'AGG', n: 'iShares Core US Aggregate Bond ETF' },
  { s: 'VGSH', n: 'Vanguard Short-Term Treasury ETF' }, { s: 'VGIT', n: 'Vanguard Intermediate-Term Treasury ETF' },
  { s: 'VGLT', n: 'Vanguard Long-Term Treasury ETF' }, { s: 'SCHO', n: 'Schwab Short-Term US Treasury ETF' },
  { s: 'SPTS', n: 'SPDR Portfolio Short Term Treasury ETF' }, { s: 'SCHR', n: 'Schwab Intermediate-Term US Treasury ETF' },
  { s: 'LQD', n: 'iShares iBoxx Investment Grade Corporate Bond ETF' }, { s: 'HYG', n: 'iShares iBoxx High Yield Corporate Bond ETF' },
  // Dividend ETFs
  { s: 'JEPI', n: 'JPMorgan Equity Premium Income ETF' }, { s: 'JEPQ', n: 'JPMorgan Nasdaq Equity Premium Income ETF' },
  { s: 'SCHD', n: 'Schwab US Dividend Equity ETF' }, { s: 'VYM', n: 'Vanguard High Dividend Yield ETF' },
  { s: 'DVY', n: 'iShares Select Dividend ETF' }, { s: 'HDV', n: 'iShares Core High Dividend ETF' },
  { s: 'DIVO', n: 'Amplify CWP Enhanced Dividend Income ETF' }, { s: 'DGRO', n: 'iShares Core Dividend Growth ETF' },
  // Leveraged & Inverse ETFs
  { s: 'SOXL', n: 'Direxion Daily Semiconductor Bull 3X ETF' }, { s: 'SOXS', n: 'Direxion Daily Semiconductor Bear 3X ETF' },
  { s: 'SPXL', n: 'Direxion Daily S&P 500 Bull 3X ETF' }, { s: 'SPXS', n: 'Direxion Daily S&P 500 Bear 3X ETF' },
  { s: 'FNGU', n: 'MicroSectors FANG+ 3X Leveraged ETN' }, { s: 'FNGD', n: 'MicroSectors FANG+ -3X Inverse ETN' },
  { s: 'UPRO', n: 'ProShares UltraPro S&P 500 3x ETF' }, { s: 'SPXU', n: 'ProShares UltraPro Short S&P 500' },
  { s: 'SSO', n: 'ProShares Ultra S&P 500 2x ETF' }, { s: 'SDS', n: 'ProShares UltraShort S&P 500 2x' },
  { s: 'QLD', n: 'ProShares Ultra QQQ 2x ETF' }, { s: 'QID', n: 'ProShares UltraShort QQQ 2x' },
  // Sector ETFs
  { s: 'XLK', n: 'Technology Select Sector SPDR ETF' }, { s: 'XLF', n: 'Financial Select Sector SPDR ETF' },
  { s: 'XLE', n: 'Energy Select Sector SPDR ETF' }, { s: 'XLV', n: 'Health Care Select Sector SPDR ETF' },
  { s: 'XLI', n: 'Industrial Select Sector SPDR ETF' }, { s: 'XLY', n: 'Consumer Discretionary Select Sector SPDR ETF' },
  { s: 'XLP', n: 'Consumer Staples Select Sector SPDR ETF' }, { s: 'XLRE', n: 'Real Estate Select Sector SPDR ETF' },
  { s: 'SMH', n: 'VanEck Semiconductor ETF' }, { s: 'SOXX', n: 'iShares Semiconductor ETF' },
  { s: 'AIQ', n: 'Global X Artificial Intelligence & Technology ETF' }, { s: 'BOTZ', n: 'Global X Robotics & AI ETF' },
  { s: 'CLOU', n: 'Global X Cloud Computing ETF' }, { s: 'HACK', n: 'ETFMG Prime Cyber Security ETF' },
  { s: 'CIBR', n: 'First Trust Nasdaq Cybersecurity ETF' }, { s: 'FINX', n: 'Global X FinTech ETF' },
  // SPDR Portfolio Series
  { s: 'SPMD', n: 'SPDR Portfolio S&P 400 Mid Cap ETF' }, { s: 'SPSM', n: 'SPDR Portfolio S&P 600 Small Cap ETF' },
  { s: 'SPYG', n: 'SPDR Portfolio S&P 500 Growth ETF' }, { s: 'SPYV', n: 'SPDR Portfolio S&P 500 Value ETF' },
  { s: 'SPYM', n: 'SPDR Portfolio S&P 500 Momentum ETF' }, { s: 'SPLG', n: 'SPDR Portfolio S&P 500 ETF' },
  // Commodity & Alternative ETFs
  { s: 'GLD', n: 'SPDR Gold Shares ETF' }, { s: 'IAU', n: 'iShares Gold Trust ETF' },
  { s: 'SLV', n: 'iShares Silver Trust ETF' }, { s: 'USO', n: 'United States Oil Fund ETF' },
  { s: 'DBA', n: 'Invesco DB Agriculture Fund ETF' },
  // Innovation / Thematic ETFs
  { s: 'ARKK', n: 'ARK Innovation ETF' }, { s: 'ARKG', n: 'ARK Genomic Revolution ETF' },
  { s: 'ARKW', n: 'ARK Next Generation Internet ETF' }, { s: 'ARKF', n: 'ARK Fintech Innovation ETF' },
  { s: 'WCLD', n: 'WisdomTree Cloud Computing Fund ETF' },
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

/** Finnhub search */
async function searchFinnhub(query: string): Promise<SearchResult[]> {
  if (!FINNHUB_KEY) return [];
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${FINNHUB_KEY}`
    );
    const data = await res.json();
    if (data?.result?.length) {
      const BLOCKED = new Set(['Crypto', 'Currency', 'Index', 'Forex', 'Cryptocurrency']);
      return data.result
        .filter((r: any) => !BLOCKED.has(r.type))
        .slice(0, 15)
        .map((r: any) => ({ symbol: r.symbol, name: r.description || r.symbol }));
    }
  } catch {}
  return [];
}

/** 서버사이드 Yahoo Finance 검색 (API 키 불필요) */
async function searchYahoo(query: string): Promise<SearchResult[]> {
  if (typeof window === 'undefined') return [];
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/** 티커처럼 생긴 쿼리에 대해 Finnhub/FMP 프로필 직접 조회 */
async function lookupTickerDirect(symbol: string): Promise<SearchResult | null> {
  const sym = symbol.toUpperCase().trim();
  if (FINNHUB_KEY) {
    try {
      const res = await fetch(
        `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${FINNHUB_KEY}`
      );
      const data = await res.json();
      if (data?.name && data?.ticker) {
        return { symbol: data.ticker, name: data.name };
      }
    } catch {}
  }
  if (FMP_API_KEY) {
    try {
      const res = await fetch(
        `https://financialmodelingprep.com/stable/profile?symbol=${encodeURIComponent(sym)}&apikey=${FMP_API_KEY}`
      );
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.symbol) {
        return { symbol: data[0].symbol, name: data[0].companyName || data[0].name || sym };
      }
    } catch {}
  }
  return null;
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
  // 서버사이드 Yahoo Finance 검색: 항상 호출 (API 키 불필요)
  for (const term of searchTerms) {
    apiCalls.push(searchYahoo(term));
  }
  for (const term of searchTerms) {
    if (FMP_API_KEY) apiCalls.push(searchFmp(term));
    if (FINNHUB_KEY) apiCalls.push(searchFinnhub(term));
  }
  // 티커처럼 생긴 쿼리(1~8자, 영숫자+점)는 프로필 직접 조회로 보완
  const isTickerLike = /^[A-Z0-9]{1,8}(\.(KS|KQ))?$/i.test(q) && !hasHangul(q);
  if (isTickerLike) {
    apiCalls.push(lookupTickerDirect(q).then(r => r ? [r] : []));
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

export async function saveWatchlistToCloud(userId: string, items: WatchlistItem[]): Promise<void> {
  try {
    await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, items }),
    });
  } catch {}
}

export async function loadWatchlistFromCloud(userId: string): Promise<WatchlistItem[] | null> {
  try {
    const res = await fetch(`/api/watchlist?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    return data.map((x: any) => ({
      symbol: x.symbol ?? '',
      name: x.name ?? x.symbol ?? '',
      logo: x.logo ?? undefined,
    }));
  } catch {
    return null;
  }
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
