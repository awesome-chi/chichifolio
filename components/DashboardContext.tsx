'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useApp } from './AppContext';
import { fetchPrices, fetchRate, fetchDividends, DIV_TOTAL_TIMEOUT_MS } from '@/lib/dashboard';

interface DashboardContextType {
  prices: Record<string, any>;
  rate: number | null;
  divData: Record<string, any>;
  displayCcy: string;
  setDisplayCcy: (v: string) => void;
  refreshStatus: 'idle' | 'loading' | 'ok' | 'error';
  lastUpdate: Date | null;
  refreshing: boolean;
  divLoadError: string | null;
  doRefresh: (overrideUsers?: any[]) => Promise<void>;
  loadDividends: (user: any) => Promise<void>;
  modal: any;
  setModal: (m: any) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { users } = useApp();
  const [prices, setPrices] = useState<Record<string, any>>({});
  const [rate, setRate] = useState<number | null>(null);
  const [divData, setDivData] = useState<Record<string, any>>({});
  const [displayCcy, setDisplayCcy] = useState('KRW');
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [divLoadError, setDivLoadError] = useState<string | null>(null);
  const [modal, setModal] = useState<any>(null);
  const usersRef = useRef(users);

  useEffect(() => { usersRef.current = users; }, [users]);

  const doRefresh = useCallback(async (overrideUsers?: any[]) => {
    const src = overrideUsers ?? usersRef.current;
    if (!src.length) return;
    const tickers = [...new Set(src.flatMap((u: any) => u.holdings.map((h: any) => h.ticker)))] as string[];
    setRefreshing(true);
    setRefreshStatus('loading');
    try {
      // 서버사이드 API 우선 (CORS 없이 Yahoo Finance 직접 호출)
      const res = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers }),
      });
      if (!res.ok) throw new Error('API error');
      const { prices: priceMap, rate: newRate } = await res.json();
      let anySuccess = false;
      if (newRate) { setRate(newRate); anySuccess = true; }
      if (priceMap && Object.keys(priceMap).length > 0) { setPrices(p => ({ ...p, ...priceMap })); anySuccess = true; }
      if (anySuccess) { setLastUpdate(new Date()); setRefreshStatus('ok'); }
      else setRefreshStatus('error');
    } catch {
      // 클라이언트 fallback
      try {
        const [newRate, priceMap] = await Promise.all([
          fetchRate(),
          tickers.length > 0 ? fetchPrices(tickers) : Promise.resolve({}),
        ]);
        let anySuccess = false;
        if (newRate) { setRate(newRate); anySuccess = true; }
        if (priceMap && Object.keys(priceMap).length > 0) { setPrices(p => ({ ...p, ...priceMap })); anySuccess = true; }
        if (anySuccess) { setLastUpdate(new Date()); setRefreshStatus('ok'); }
        else setRefreshStatus('error');
      } catch { setRefreshStatus('error'); }
    }
    setRefreshing(false);
  }, []);

  const loadDividends = useCallback(async (user: any) => {
    const tickers = user.holdings.map((h: any) => h.ticker);
    if (!tickers.length) return;
    setDivLoadError(null);
    setDivData(d => { const n = { ...d }; tickers.forEach((t: string) => { if (!d[t]) n[t] = 'loading'; }); return n; });
    try {
      const result = await Promise.race([
        fetchDividends(tickers),
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), DIV_TOTAL_TIMEOUT_MS)),
      ]);
      setDivData(d => { const n = { ...d }; tickers.forEach((t: string) => n[t] = result[t] ?? null); return n; });
    } catch {
      setDivData(d => { const n = { ...d }; tickers.forEach((t: string) => { if (n[t] === 'loading') n[t] = null; }); return n; });
      setDivLoadError('배당 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      doRefresh(users);
      const id = setInterval(() => doRefresh(), 60000);
      return () => clearInterval(id);
    }
  }, [users.length > 0]);

  return (
    <DashboardContext.Provider value={{ prices, rate, divData, displayCcy, setDisplayCcy, refreshStatus, lastUpdate, refreshing, divLoadError, doRefresh, loadDividends, modal, setModal }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}
