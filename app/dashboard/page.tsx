'use client';

import { useState, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, Coins, Calendar, Crown, X, Plus, Search } from 'lucide-react';
import { useApp, C, mono, cardSt, inpSt, lblSt } from '@/components/AppContext';
import UserAvatar from '@/components/UserAvatar';
import { useDashboard } from '@/components/DashboardContext';
import { calcH, userTotals, makeFormatter, fmtKRW, fmtUSD, fmtPct, PALETTE, MONTHS_KR, uid } from '@/lib/dashboard';
import { searchStocks } from '@/lib/watchlist';
import StockLogoShared from '@/components/StockLogo';

// StockLogo: 공유 컴포넌트 래퍼 (colorIndex 매핑)
function StockLogo({ ticker, name, size = 44, color }: { ticker: string; name?: string; size?: number; color?: string }) {
  const colorIndex = color ? PALETTE.indexOf(color) : 0;
  return <StockLogoShared ticker={ticker} name={name} size={size} colorIndex={colorIndex >= 0 ? colorIndex : 0} />;
}

const btnSt = (v?: string) => ({
  background: v === 'primary' ? C.accent : v === 'danger' ? 'transparent' : v === 'ghost' ? 'transparent' : 'rgba(15,30,50,0.8)',
  color: v === 'primary' ? '#fff' : v === 'danger' ? C.loss : C.muted,
  border: v === 'ghost' ? `1px dashed ${C.border}` : v === 'danger' ? `1px solid #3a1020` : `1px solid ${C.border}`,
  borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all .2s',
});

function Modal({ title, onClose, children }: any) {
  return (
    <div className="fixed inset-0 bg-black/75 flex items-end sm:items-center justify-center z-[300] backdrop-blur-md"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full sm:w-auto bg-[#0f1e32] border border-[#172a45] rounded-t-2xl sm:rounded-2xl p-6 sm:p-7 overflow-y-auto"
        style={{ maxWidth: 430, maxHeight: '90vh', width: '100%' }}>
        <div className="flex items-center justify-between mb-5">
          <span className="font-extrabold text-[17px] text-white">{title}</span>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition p-1"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function TabBtn({ active, color, onClick, children }: any) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-all duration-150 text-[12px] sm:text-[13px] rounded-lg px-3 sm:px-3.5 py-2 sm:py-1.5 min-h-[44px] sm:min-h-0 cursor-pointer touch-manipulation"
      style={{ fontWeight: active ? 600 : 400, color: active ? '#fff' : '#64748b', background: active ? `${color}18` : 'transparent', border: active ? `1px solid ${color}40` : '1px solid transparent' }}>
      {children}
    </button>
  );
}

function DonutChart({ holdings, prices, rate, size = 170 }: any) {
  const data = holdings.map((h: any) => {
    const c = calcH(h, prices[h.ticker], rate);
    return { ticker: h.ticker, val: c.valKRW ?? c.costKRW ?? 0 };
  }).filter((d: any) => d.val > 0);
  const total = data.reduce((s: number, d: any) => s + d.val, 0);
  if (!total) return (
    <div style={{ width: size, height: size, borderRadius: '50%', border: `2px dashed ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 11, flexShrink: 0 }}>No data</div>
  );
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="val" cx="50%" cy="50%" innerRadius={size * 0.33} outerRadius={size * 0.46} paddingAngle={2} strokeWidth={0}>
            {data.map((_: any, i: number) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Pie>
          <Tooltip formatter={(v: any, n: any, p: any) => [`${((Number(v) / total) * 100).toFixed(1)}%`, p.payload.ticker]}
            contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.text }} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
        <div style={{ fontSize: 9, color: C.muted }}>총자산</div>
        <div style={{ ...mono, fontSize: 10, fontWeight: 700, color: C.text, whiteSpace: 'nowrap' }}>{fmtKRW(total)}</div>
      </div>
    </div>
  );
}

function HoldingLegend({ holdings, prices, rate, fmt }: any) {
  const rows = holdings.map((h: any, i: number) => {
    const c = calcH(h, prices[h.ticker], rate);
    return { h, c, val: c.valKRW ?? c.costKRW ?? 0, color: PALETTE[i % PALETTE.length], name: prices[h.ticker]?.name ?? h._name ?? h.ticker };
  });
  const total = rows.reduce((s: number, r: any) => s + r.val, 0);
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map(({ h, c, val, color, name }: any) => {
        const w = total > 0 ? (val / total) * 100 : 0;
        return (
          <div key={h.id} className="flex items-center gap-2 min-w-0">
            <StockLogo ticker={h.ticker} name={name} size={28} color={color} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-bold text-[12px] truncate flex-1 leading-tight" style={{ color: C.text }}>{name}</span>
                <span className="text-[11px] font-semibold shrink-0" style={{ ...mono, color: C.text }}>{w.toFixed(1)}%</span>
              </div>
              <div style={{ height: 3, background: C.border, borderRadius: 2, marginTop: 3 }}>
                <div style={{ height: '100%', width: `${Math.min(w, 100)}%`, background: color, borderRadius: 2, transition: 'width .5s' }} />
              </div>
              <div className="flex gap-2 mt-0.5 items-center">
                <span style={{ fontSize: 10, color: C.muted }}>{h.ticker}</span>
                <span style={{ ...mono, fontSize: 10, color: c.plPct != null ? (c.plPct >= 0 ? C.gain : C.loss) : C.muted }}>{fmtPct(c.plPct)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StockSearchInput({ value, onChange, onSelect }: any) {
  const [results, setResults] = useState<any[]>([]);
  const [status, setStatus] = useState('idle');
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const timer = useRef<any>(null);
  const searchGen = useRef(0);

  const handleChange = (v: string) => {
    onChange(v);
    clearTimeout(timer.current);
    if (v.trim().length < 1) { setResults([]); setOpen(false); setStatus('idle'); return; }
    setStatus('loading');
    timer.current = setTimeout(async () => {
      const gen = ++searchGen.current;
      try {
        const list = await searchStocks(v.trim());
        const merged = list.map((r: any) => ({ symbol: r.symbol, name: r.name || r.symbol }));
        if (gen !== searchGen.current) return;
        setResults(merged);
        setOpen(merged.length > 0);
        setStatus(merged.length > 0 ? 'ok' : 'empty');
      } catch { setStatus('empty'); }
    }, 350);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(15,30,50,0.9)',
        border: `1px solid ${focused || open ? 'rgba(6,182,212,0.5)' : 'rgba(23,42,69,0.8)'}`,
        borderRadius: 12, padding: '0 12px', height: 48, transition: 'border-color .15s',
      }}>
        {status === 'loading'
          ? <span style={{ width: 16, height: 16, border: `2px solid ${C.accent}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite', flexShrink: 0 }} />
          : <Search style={{ width: 16, height: 16, color: '#64748b', flexShrink: 0 }} />}
        <input
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: '#fff', minWidth: 0 }}
          value={value}
          onChange={e => handleChange(e.target.value)}
          placeholder="예: AAPL, 삼성전자, VOO"
          autoComplete="off"
          onFocus={() => { setFocused(true); results.length > 0 && setOpen(true); }}
          onBlur={() => { setFocused(false); setTimeout(() => setOpen(false), 200); }}
        />
        {value && (
          <button onClick={() => { onChange(''); setResults([]); setOpen(false); setStatus('idle'); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
        )}
      </div>
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: '#0d1b2e', border: '1px solid #172a45', borderRadius: 16,
          zIndex: 200, maxHeight: 280, overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,.6)',
        }}>
          <div style={{ padding: '10px 16px 6px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>검색 결과</div>
          <ul style={{ listStyle: 'none', margin: 0, padding: '0 0 8px' }}>
            {results.map((r: any) => {
              const isKR = /\.(KS|KQ)$/.test(r.symbol);
              return (
                <li key={r.symbol}>
                  <div
                    onMouseDown={() => { onSelect({ ticker: r.symbol, name: r.name }); setOpen(false); setResults([]); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer', transition: 'background .1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#122030')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <StockLogoShared ticker={r.symbol} name={r.name} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span style={{ fontSize: 11, color: '#64748b' }}>{r.symbol}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 5, background: isKR ? 'rgba(16,185,129,0.15)' : 'rgba(6,182,212,0.15)', color: isKR ? '#10b981' : '#06b6d4' }}>
                          {isKR ? 'KRX' : 'US'}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {open && value.trim() && status === 'empty' && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#0d1b2e', border: '1px solid #172a45', borderRadius: 16, padding: '20px 16px', textAlign: 'center', color: '#64748b', fontSize: 13, zIndex: 200 }}>
          "{value}" 검색 결과가 없습니다
        </div>
      )}
    </div>
  );
}

function StockModal({ holding = null, onSave, onClose }: any) {
  const [ticker, setTicker] = useState(holding?.ticker || '');
  const [name, setName] = useState(holding?._name || '');
  const [currency, setCurrency] = useState(holding?.currency || 'USD');
  const [shares, setShares] = useState(String(holding?.shares || ''));
  const [avgCost, setAvgCost] = useState(String(holding?.avgCost || ''));
  const [purchaseRate, setPurchaseRate] = useState(String(holding?.purchaseRate || ''));
  const valid = ticker.trim() && shares && avgCost && (currency === 'KRW' || purchaseRate);

  return (
    <Modal title={holding ? '종목 수정' : '종목 추가'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={lblSt}>종목 검색 (티커 / 종목명)</label>
          <StockSearchInput value={ticker} onChange={setTicker}
            onSelect={({ ticker: t, name: n }: any) => { setTicker(t); setName(n); setCurrency(t.endsWith('.KS') || t.endsWith('.KQ') ? 'KRW' : 'USD'); }} />
          {name && <div style={{ fontSize: 11, color: C.gain, marginTop: 5 }}>✓ {name}</div>}
        </div>
        <div>
          <label style={lblSt}>주가 통화</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['USD', 'KRW'].map(c => (
              <button key={c} onClick={() => setCurrency(c)}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, cursor: 'pointer', fontWeight: currency === c ? 700 : 400, fontSize: 13, background: currency === c ? (c === 'USD' ? C.accent : C.gain) : '#0a1829', color: currency === c ? '#fff' : C.muted, border: `1px solid ${currency === c ? (c === 'USD' ? C.accent : C.gain) : C.border}`, transition: 'all .15s' }}>
                {c === 'USD' ? '🇺🇸 USD (미국 주식)' : '🇰🇷 KRW (국내 주식)'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label style={lblSt}>보유 수량</label>
          <input style={inpSt} type="number" value={shares} onChange={e => setShares(e.target.value)} placeholder="10" />
        </div>
        <div>
          <label style={lblSt}>평균 매입가 ({currency === 'KRW' ? '₩ 원화' : '$ USD'})</label>
          <input style={inpSt} type="number" value={avgCost} onChange={e => setAvgCost(e.target.value)} placeholder={currency === 'KRW' ? '예: 75000' : '예: 150.00'} />
        </div>
        {currency === 'USD' && (
          <div>
            <label style={lblSt}>매입 당시 환율 (₩/USD)</label>
            <input style={inpSt} type="number" value={purchaseRate} onChange={e => setPurchaseRate(e.target.value)} placeholder="예: 1380" />
          </div>
        )}
        {currency === 'KRW' && (
          <div style={{ background: '#0a1829', borderRadius: 8, padding: '9px 13px', fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
            🇰🇷 국내 주식은 원화로 직접 입력합니다.
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
        <button style={btnSt()} onClick={onClose}>취소</button>
        <button style={{ ...btnSt('primary'), opacity: valid ? 1 : 0.4 }}
          onClick={() => valid && onSave({ id: holding?.id, ticker: ticker.trim().toUpperCase(), _name: name, currency, shares: Number(shares), avgCost: Number(avgCost), purchaseRate: currency === 'KRW' ? 1 : Number(purchaseRate) })}>
          {holding ? '저장' : '추가'}
        </button>
      </div>
    </Modal>
  );
}

function HoldingDetailModal({ holding, prices, rate, fmt, onClose, onEdit, onDel, canEdit }: any) {
  const pi = prices[holding?.ticker];
  const c = holding ? calcH(holding, pi, rate) : null;
  const pos = c?.plKRW != null && c.plKRW >= 0;
  const priceDisplay = c?.currentPrice != null ? (holding.currency === 'KRW' ? fmtKRW(c.currentPrice) : fmtUSD(c.currentPrice)) : null;
  const name = holding ? (pi?.name ?? holding._name ?? holding.ticker) : '';
  if (!holding) return null;
  return (
    <Modal title="" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <StockLogo ticker={holding.ticker} name={name} size={52} color={PALETTE[0]} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: C.text }}>{name}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{holding.ticker} · {holding.currency === 'KRW' ? '원화' : 'USD'}</div>
            {priceDisplay && (
              <div style={{ marginTop: 4, fontSize: 13, color: C.text }}>{priceDisplay}
                {pi?.changePct != null && <span style={{ marginLeft: 6, color: pi.changePct >= 0 ? C.gain : C.loss }}>({pi.changePct >= 0 ? '+' : ''}{pi.changePct.toFixed(2)}%)</span>}
              </div>
            )}
          </div>
        </div>
        <div style={{ background: '#0a1829', borderRadius: 12, padding: 16 }}>
          <div style={{ ...mono, fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 16 }}>{c?.valKRW != null ? fmt(c.valKRW) : '—'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
            {[
              { label: '원금', value: fmt(c?.costKRW) },
              { label: '보유 수량', value: `${holding.shares.toLocaleString()}주` },
              { label: '평균 매입가', value: holding.currency === 'KRW' ? fmtKRW(holding.avgCost) : fmtUSD(holding.avgCost) },
              ...(holding.currency !== 'KRW' ? [{ label: '매입 환율', value: `₩${Number(holding.purchaseRate || 0).toLocaleString()}` }] : []),
              { label: '평가손익', value: c != null ? fmt(c.plKRW) : '—', color: c?.plKRW != null ? (pos ? C.gain : C.loss) : undefined },
              { label: '수익률', value: c != null ? fmtPct(c.plPct) : '—', color: c?.plPct != null ? (pos ? C.gain : C.loss) : undefined },
            ].map((item, i) => (
              <div key={i}><span style={{ color: C.muted }}>{item.label}</span><div style={{ ...mono, fontWeight: 700, color: (item as any).color || C.text }}>{item.value}</div></div>
            ))}
          </div>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ ...btnSt(), flex: 1, padding: '10px' }} onClick={() => { onEdit(holding); onClose(); }}>수정</button>
            <button style={{ ...btnSt('danger'), flex: 1, padding: '10px' }} onClick={() => { onDel(holding.id); onClose(); }}>삭제</button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function HoldingsTab({ user, prices, rate, canEdit, displayCcy, onAdd, onEdit, onDel }: any) {
  const [detailHolding, setDetailHolding] = useState(null);
  const fmt = makeFormatter(displayCcy, rate);
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: C.muted, textTransform: 'uppercase' }}>
          보유 종목 {user.holdings.length > 0 && <span style={{ color: C.accent }}>{user.holdings.length}</span>}
        </div>
        {canEdit && (
          <button style={{ ...btnSt('primary'), display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px' }} onClick={onAdd}>
            <Plus className="w-3.5 h-3.5" /> 종목 추가
          </button>
        )}
      </div>
      {user.holdings.length === 0 ? (
        <div style={{ ...cardSt, textAlign: 'center', padding: '50px 20px', color: C.subtle }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 14, marginBottom: 8, color: C.muted }}>등록된 종목이 없습니다</div>
          {canEdit && <button style={btnSt('ghost')} onClick={onAdd}>+ 첫 번째 종목 추가</button>}
        </div>
      ) : (
        <div style={{ maxHeight: 'clamp(320px, calc(100vh - 360px), 680px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 2 }}>
          {user.holdings.map((h: any, hi: number) => {
            const pi = prices[h.ticker];
            const c = calcH(h, pi, rate);
            const pos = c.plKRW != null && c.plKRW >= 0;
            const col = PALETTE[hi % PALETTE.length];
            const hasVal = c.currentPrice != null && (c.isKRW || rate != null);
            const name = pi?.name ?? h._name ?? h.ticker;
            const currentPriceStr = c.currentPrice != null
              ? (h.currency === 'KRW' ? fmtKRW(c.currentPrice) : fmtUSD(c.currentPrice))
              : null;
            const changePct = pi?.changePct;
            return (
              <div key={h.id}
                onClick={() => setDetailHolding(h)}
                role="button" tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setDetailHolding(h)}
                style={{ background: '#0a1829', border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px', cursor: 'pointer', transition: 'all .15s' }}
                className="touch-manipulation"
                onMouseEnter={e => { e.currentTarget.style.background = '#0d1f36'; e.currentTarget.style.borderColor = col + '60'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#0a1829'; e.currentTarget.style.borderColor = C.border; }}>
                {/* 상단 행: 로고 + 종목명/티커 + 평가액/수익 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <StockLogo ticker={h.ticker} name={name} size={46} color={col} />
                  {/* 종목명 영역 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{h.ticker}</span>
                      <span style={{ fontSize: 10, color: C.subtle }}>·</span>
                      <span style={{ fontSize: 11, color: C.muted }}>{h.shares.toLocaleString()}주</span>
                      {changePct != null && (
                        <span style={{ fontSize: 10, fontWeight: 600, color: changePct >= 0 ? C.gain : C.loss, background: changePct >= 0 ? `${C.gain}18` : `${C.loss}18`, padding: '1px 5px', borderRadius: 5 }}>
                          {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>
                  {/* 평가액 영역 */}
                  <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 90 }}>
                    {hasVal ? (
                      <>
                        <div style={{ ...mono, fontSize: 15, fontWeight: 700, color: C.text }}>{fmt(c.valKRW)}</div>
                        {c.plPct != null && (
                          <div style={{ marginTop: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: pos ? `${C.gain}22` : `${C.loss}22`, color: pos ? C.gain : C.loss }}>
                              {pos ? '+' : ''}{c.plPct.toFixed(2)}%
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="skel" style={{ height: 18, borderRadius: 4, width: 80, marginLeft: 'auto' }} />
                        <div className="skel" style={{ height: 14, borderRadius: 4, width: 50, marginLeft: 'auto', marginTop: 5 }} />
                      </>
                    )}
                  </div>
                </div>
                {/* 하단 행: 매입가 → 현재가 + 손익금액 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`, gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.muted, flexWrap: 'wrap' }}>
                    <span style={{ ...mono }}>{h.currency === 'KRW' ? fmtKRW(h.avgCost) : fmtUSD(h.avgCost)}</span>
                    <span style={{ color: C.subtle }}>→</span>
                    {currentPriceStr ? (
                      <span style={{ ...mono, color: C.text, fontWeight: 600 }}>{currentPriceStr}</span>
                    ) : (
                      <span className="skel" style={{ display: 'inline-block', height: 12, borderRadius: 3, width: 55, verticalAlign: 'middle' }} />
                    )}
                  </div>
                  {hasVal ? (
                    <div style={{ ...mono, fontSize: 12, fontWeight: 700, color: pos ? C.gain : C.loss, flexShrink: 0 }}>
                      {pos ? '+' : ''}{fmt(c.plKRW)}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: C.subtle, flexShrink: 0 }}>원금 {fmt(c.costKRW)}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {detailHolding && (
        <HoldingDetailModal holding={detailHolding} prices={prices} rate={rate} fmt={fmt} displayCcy={displayCcy}
          onClose={() => setDetailHolding(null)} onEdit={onEdit} onDel={onDel} canEdit={canEdit} />
      )}
    </div>
  );
}

function DividendsTab({ user, prices, divData, rate, onFetch, fmt, divLoadError }: any) {
  const rows = user.holdings.map((h: any, i: number) => {
    const dv = divData[h.ticker];
    const isKRW = h.currency === 'KRW';
    let annualIncome = null;
    if (dv && dv !== 'loading') {
      if (isKRW && dv.annualDividendKRW) annualIncome = h.shares * dv.annualDividendKRW;
      else if (!isKRW && dv.annualDividendUSD && rate) annualIncome = h.shares * dv.annualDividendUSD * rate;
    }
    return { h, dv, annualIncome, color: PALETTE[i % PALETTE.length], name: prices[h.ticker]?.name ?? h._name ?? h.ticker };
  });
  const totalAnnual = rows.reduce((s: number, r: any) => s + (r.annualIncome || 0), 0);
  const loading = user.holdings.some((h: any) => divData[h.ticker] === 'loading');
  const fetched = user.holdings.length > 0 && user.holdings.every((h: any) => divData[h.ticker] && divData[h.ticker] !== 'loading');
  const divTickers = rows.filter((r: any) => r.dv && r.dv !== 'loading' && (r.dv.annualDividendUSD || r.dv.annualDividendKRW)).map((r: any) => r.h.ticker);
  const monthlyData = MONTHS_KR.map((m, mi) => {
    const point: Record<string, any> = { month: m, income: 0 };
    rows.forEach(({ h, dv }: any) => {
      if (!dv || dv === 'loading') return;
      const isKRW = h.currency === 'KRW';
      const base = isKRW ? (dv.annualDividendKRW || 0) : ((dv.annualDividendUSD || 0) * (rate || 1380));
      const freq = dv.frequency;
      let amt = 0;
      if (freq === '월배당') amt = h.shares * base / 12;
      else if (freq === '분기배당' && [2, 5, 8, 11].includes(mi)) amt = h.shares * base / 4;
      else if (freq === '반기배당' && [5, 11].includes(mi)) amt = h.shares * base / 2;
      else if (freq === '연배당' && mi === 11) amt = h.shares * base;
      if (amt > 0) point.income = (point.income || 0) + Math.round(amt);
    });
    return point;
  });

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: '연간 예상 배당금', value: fmt(totalAnnual || null), color: totalAnnual > 0 ? C.gain : C.text },
          { label: '월평균 예상 배당금', value: fmt(totalAnnual > 0 ? totalAnnual / 12 : null), color: C.text },
          { label: '배당 종목', value: `${divTickers.length} / ${rows.length}종목`, color: C.text },
        ].map((item, i) => (
          <div key={i} style={{ ...cardSt, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{item.label}</div>
            <div style={{ ...mono, fontSize: 'clamp(14px,3vw,20px)', fontWeight: 800, color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      {divLoadError && (
        <div style={{ textAlign: 'center', padding: '12px 16px', marginBottom: 14, background: '#3a1020', border: `1px solid ${C.loss}40`, borderRadius: 10, color: '#fca5a5', fontSize: 13 }}>{divLoadError}</div>
      )}
      {!fetched && !loading && (
        <div style={{ textAlign: 'center', padding: '24px 0', marginBottom: 14 }}>
          <button style={{ ...btnSt('primary'), padding: '10px 28px' }} onClick={onFetch}>배당 정보 불러오기</button>
        </div>
      )}
      {loading && (
        <div style={{ textAlign: 'center', padding: '16px 0', color: C.muted, fontSize: 13, marginBottom: 14 }}>
          <span style={{ display: 'inline-block', marginRight: 6, animation: 'spin .8s linear infinite' }}>↻</span>배당 정보 조회 중…
        </div>
      )}

      {fetched && totalAnnual > 0 && (
        <div style={{ ...cardSt, marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>월별 예상 배당 수입</div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>연간 12개월 기준 · 단위 원화</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
              <defs>
                <linearGradient id="divGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.gain} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={C.gain} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: C.muted, fontSize: 11 }} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis hide domain={[0, (d: number) => Math.max(d * 1.1, 1)]} />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 12, color: C.text }}
                formatter={(v: number) => [fmt(v), '예상 배당']} labelFormatter={(l: string) => `📅 ${l}`} />
              <Area type="monotone" dataKey="income" stroke={C.gain} strokeWidth={2} fill="url(#divGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map(({ h, dv, color, name, annualIncome }: any) => {
          const isLoading = dv === 'loading';
          const isKRW = h.currency === 'KRW';
          const perShare = isKRW ? (dv?.annualDividendKRW ? fmtKRW(dv.annualDividendKRW) : '—') : (dv?.annualDividendUSD ? fmtUSD(dv.annualDividendUSD) : '—');
          return (
            <div key={h.id} style={{ background: '#0a1829', border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px' }}>
              {/* 헤더 행: 로고+종목명 + 연간 예상 배당 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                  <StockLogo ticker={h.ticker} name={name} size={40} color={color} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: C.muted }}>{h.ticker}</span>
                      <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 6, background: isKRW ? `${C.gain}20` : `${C.accent}20`, color: isKRW ? C.gain : C.accent, fontWeight: 600 }}>{isKRW ? 'KRW' : 'USD'}</span>
                      {!isLoading && dv?.frequency && (
                        <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 6, background: `${C.gain}20`, color: C.gain, fontWeight: 600 }}>{dv.frequency}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>연간 예상 배당</div>
                  <div style={{ ...mono, fontSize: 15, fontWeight: 700, color: annualIncome > 0 ? C.gain : C.subtle }}>
                    {isLoading ? '조회 중…' : annualIncome != null ? fmt(annualIncome) : '—'}
                  </div>
                </div>
              </div>
              {/* 세부 정보 그리드 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px 12px' }}>
                {[
                  { label: '보유 수량', value: isLoading ? '…' : `${h.shares.toLocaleString()}주` },
                  { label: '연간 배당/주', value: isLoading ? '…' : perShare },
                  { label: '배당수익률', value: isLoading ? '…' : (dv?.yieldPct != null ? `${(dv.yieldPct * 100).toFixed(2)}%` : '—') },
                  { label: '배당락일', value: isLoading ? '…' : (dv?.exDividendDate || '—') },
                ].map((item, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>{item.label}</div>
                    <div style={{ ...mono, fontSize: 12, fontWeight: 600, color: C.text }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getEstimatedPaymentDates(exDateStr: string | null, frequency: string | null, count: number): string[] {
  if (!exDateStr) return [];
  const d = new Date(exDateStr + 'T12:00:00Z');
  if (isNaN(d.getTime())) return [];
  d.setUTCDate(d.getUTCDate() + 14);
  const out: string[] = [];
  const addMonths = (date: Date, m: number) => { const n = new Date(date); n.setUTCMonth(n.getUTCMonth() + m); return n; };
  const toYMD = (x: Date) => x.toISOString().slice(0, 10);
  if (frequency === '월배당') for (let i = 0; i < count; i++) out.push(toYMD(addMonths(d, i)));
  else if (frequency === '분기배당') for (let i = 0; i < count; i++) out.push(toYMD(addMonths(d, i * 3)));
  else if (frequency === '반기배당') for (let i = 0; i < count; i++) out.push(toYMD(addMonths(d, i * 6)));
  else if (frequency === '연배당') for (let i = 0; i < count; i++) out.push(toYMD(addMonths(d, i * 12)));
  else out.push(toYMD(d));
  return out;
}

function buildDividendEvents(user: any, divData: Record<string, any>, rate: number | null) {
  const events: { date: string; ticker: string; amountKRW: number; label: string }[] = [];
  const todayStr = new Date().toISOString().slice(0, 10);
  user.holdings.forEach((h: any) => {
    const dv = divData[h.ticker];
    if (!dv || dv === 'loading' || (!dv.annualDividendUSD && !dv.annualDividendKRW)) return;
    const isKRW = h.currency === 'KRW';
    const annualKRW = isKRW ? (dv.annualDividendKRW || 0) * h.shares : (dv.annualDividendUSD || 0) * h.shares * (rate || 0);
    if (annualKRW <= 0) return;
    const freq = dv.frequency || '분기배당';
    const n = freq === '월배당' ? 24 : freq === '분기배당' ? 12 : freq === '반기배당' ? 6 : 4;
    const dates = getEstimatedPaymentDates(dv.exDividendDate, freq, n);
    const perPayment = annualKRW / (freq === '월배당' ? 12 : freq === '분기배당' ? 4 : freq === '반기배당' ? 2 : 1);
    dates.forEach(date => events.push({ date, ticker: h.ticker, amountKRW: Math.round(perPayment), label: `${h.ticker} ${Math.round(perPayment).toLocaleString()}원` }));
  });
  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}

function DividendCalendarTab({ user, divData, rate, fmt }: any) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const events = buildDividendEvents(user, divData, rate);
  const y = viewDate.getFullYear(), m = viewDate.getMonth();
  const firstDay = new Date(y, m, 1), lastDay = new Date(y, m + 1, 0);
  const startPad = firstDay.getDay(), daysInMonth = lastDay.getDate();
  const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;
  const monthEvents = events.filter(e => e.date.startsWith(monthKey));
  const monthTotal = monthEvents.reduce((s, e) => s + e.amountKRW, 0);
  const todayStr = new Date().toISOString().slice(0, 10);
  const nextEvent = events.find(e => e.date >= todayStr);
  const dday = nextEvent ? Math.max(0, Math.ceil((new Date(nextEvent.date + 'T12:00:00Z').getTime() - Date.now()) / 86400000)) : null;
  const grid: (number | null)[][] = [];
  let row: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) row.push(null);
  for (let d = 1; d <= daysInMonth; d++) { row.push(d); if (row.length === 7) { grid.push(row); row = []; } }
  if (row.length) { while (row.length < 7) row.push(null); grid.push(row); }
  const dayEvents = (day: number) => {
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };
  const dayTotal = (day: number) => dayEvents(day).reduce((s, e) => s + e.amountKRW, 0);
  const selectedEvents = selectedDay ? dayEvents(selectedDay) : [];
  const selectedDateStr = selectedDay ? `${y}년 ${m + 1}월 ${selectedDay}일` : '';

  // 배당 데이터 로드 여부
  const hasData = user.holdings.length > 0 && user.holdings.some((h: any) => divData[h.ticker] && divData[h.ticker] !== 'loading');
  const allLoaded = user.holdings.length > 0 && user.holdings.every((h: any) => divData[h.ticker] && divData[h.ticker] !== 'loading');

  // 이번 달 이벤트 데이터 (날짜 중복 제거하여 날짜별로 묶기)
  const monthSchedule = monthEvents.reduce<{ date: string; items: typeof events }[]>((acc, e) => {
    const found = acc.find(a => a.date === e.date);
    if (found) found.items.push(e);
    else acc.push({ date: e.date, items: [e] });
    return acc;
  }, []);

  return (
    <div>
      {/* 상단 요약 */}
      <div style={{ ...cardSt, marginBottom: 14 }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{y}년 {m + 1}월 예상 배당 수령액</div>
            <div style={{ ...mono, fontSize: 20, fontWeight: 800, color: monthTotal > 0 ? C.gain : C.text }}>{monthTotal > 0 ? fmt(monthTotal) : hasData ? '—' : '배당 정보 미조회'}</div>
          </div>
          {nextEvent && dday != null ? (
            <div>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>다음 배당일</div>
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ ...mono, fontSize: 18, fontWeight: 800, color: C.accent }}>D-{dday}</span>
                <span style={{ fontSize: 12, color: C.muted }}>{nextEvent.date}</span>
                <span style={{ fontSize: 12, color: C.text }}>{nextEvent.ticker} {fmt(nextEvent.amountKRW)}</span>
              </div>
            </div>
          ) : hasData ? (
            <div style={{ fontSize: 13, color: C.muted, display: 'flex', alignItems: 'center' }}>예정된 배당이 없습니다</div>
          ) : (
            <div style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center' }}>
              배당 정보 탭에서 먼저 배당 정보를 불러와 주세요
            </div>
          )}
        </div>
      </div>

      {/* 달력 */}
      <div style={{ ...cardSt, marginBottom: 14 }}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1)); setSelectedDay(null); }} style={{ ...btnSt('ghost'), padding: '6px 14px' }}>← 이전</button>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{y}년 {m + 1}월</span>
          <button onClick={() => { setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1)); setSelectedDay(null); }} style={{ ...btnSt('ghost'), padding: '6px 14px' }}>다음 →</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 280 }}>
            <thead>
              <tr>{['일', '월', '화', '수', '목', '금', '토'].map((w, i) => (
                <th key={i} style={{ fontSize: 11, fontWeight: 600, color: C.muted, padding: '0 2px 10px 2px', textAlign: 'center', borderBottom: `1px solid ${C.border}` }}>{w}</th>
              ))}</tr>
            </thead>
            <tbody>
              {grid.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => {
                    if (cell === null) return <td key={ci} style={{ padding: 3, borderBottom: `1px solid ${C.border}` }} />;
                    const isToday = new Date().getDate() === cell && viewDate.getMonth() === new Date().getMonth() && viewDate.getFullYear() === new Date().getFullYear();
                    const evs = dayEvents(cell);
                    const hasEvs = evs.length > 0;
                    const isSelected = selectedDay === cell;
                    const dt = hasEvs ? dayTotal(cell) : 0;
                    return (
                      <td key={ci}
                        onClick={() => hasEvs && setSelectedDay(isSelected ? null : cell)}
                        style={{
                          verticalAlign: 'top', padding: 3,
                          borderBottom: `1px solid ${C.border}`,
                          background: isSelected ? `${C.gain}18` : hasEvs ? `${C.gain}08` : 'transparent',
                          cursor: hasEvs ? 'pointer' : 'default',
                          borderRadius: isSelected ? 6 : 0,
                          transition: 'background .15s',
                        }}>
                        <div style={{ fontSize: 12, fontWeight: isToday ? 800 : 600, color: isToday ? C.accent : C.text, textAlign: 'center', marginBottom: 3,
                          ...(isToday ? { background: `${C.accent}20`, borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 3px' } : {}) }}>
                          {cell}
                        </div>
                        {evs.length > 0 && (
                          <div style={{ textAlign: 'center' }}>
                            {evs.slice(0, 2).map((e, i) => (
                              <div key={i} style={{ fontSize: 9, padding: '1px 3px', borderRadius: 3, background: `${C.gain}25`, color: C.gain, marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.label}>{e.ticker}</div>
                            ))}
                            {evs.length > 2 && <div style={{ fontSize: 9, color: C.muted }}>+{evs.length - 2}</div>}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 선택된 날 상세 */}
        {selectedDay && selectedEvents.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 10 }}>{selectedDateStr} 배당 예정</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedEvents.map((e, i) => {
                const holding = user.holdings.find((h: any) => h.ticker === e.ticker);
                const name = holding?._name || e.ticker;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: '#0a1829', borderRadius: 10, padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <StockLogo ticker={e.ticker} name={name} size={34} color={PALETTE[i % PALETTE.length]} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{name}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{e.ticker}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ ...mono, fontSize: 14, fontWeight: 700, color: C.gain }}>{fmt(e.amountKRW)}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>예상 배당 수령</div>
                    </div>
                  </div>
                );
              })}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
                <span style={{ fontSize: 12, color: C.muted, marginRight: 8 }}>합계</span>
                <span style={{ ...mono, fontSize: 13, fontWeight: 800, color: C.gain }}>{fmt(selectedEvents.reduce((s, e) => s + e.amountKRW, 0))}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 이번 달 배당 일정 리스트 */}
      {hasData && (
        <div style={cardSt}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 12 }}>{y}년 {m + 1}월 배당 일정</div>
          {monthSchedule.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontSize: 13 }}>이번 달 예정된 배당이 없습니다</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {monthSchedule.map(({ date, items }) => {
                const dayNum = parseInt(date.slice(8, 10));
                const isToday = date === todayStr;
                const isPast = date < todayStr;
                return (
                  <div key={date} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', borderRadius: 10, background: isToday ? `${C.accent}12` : '#0a1829', border: `1px solid ${isToday ? C.accent + '40' : C.border}`, opacity: isPast ? 0.6 : 1 }}>
                    <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 32 }}>
                      <div style={{ ...mono, fontSize: 16, fontWeight: 800, color: isToday ? C.accent : C.text }}>{dayNum}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>일</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {items.map((e, i) => {
                        const holding = user.holdings.find((h: any) => h.ticker === e.ticker);
                        const name = holding?._name || e.ticker;
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, ...(i > 0 ? { marginTop: 6, paddingTop: 6, borderTop: `1px solid ${C.border}` } : {}) }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                              <StockLogo ticker={e.ticker} name={name} size={28} color={PALETTE[i % PALETTE.length]} />
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                                <div style={{ fontSize: 10, color: C.muted }}>{e.ticker}</div>
                              </div>
                            </div>
                            <div style={{ ...mono, fontSize: 13, fontWeight: 700, color: C.gain, flexShrink: 0 }}>{fmt(e.amountKRW)}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      {items.length > 1 && <div style={{ ...mono, fontSize: 12, fontWeight: 700, color: C.gain }}>{fmt(items.reduce((s, e) => s + e.amountKRW, 0))}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!hasData && (
        <div style={{ ...cardSt, textAlign: 'center', padding: '32px 20px', color: C.muted }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 14, marginBottom: 6, color: C.text }}>배당 정보가 없습니다</div>
          <div style={{ fontSize: 12, color: C.muted }}>배당 정보 탭에서 배당 정보를 먼저 불러와 주세요</div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { users, session, saveHoldings } = useApp();
  const { prices, rate, divData, displayCcy, divLoadError, loadDividends, refreshing, lastUpdate } = useDashboard();
  const [activeTab, setActiveTab] = useState('holdings');
  const [modal, setModal] = useState<any>(null);

  const me = users.find((u: any) => u.id === session?.userId);
  const isAdmin = me?.isAdmin;

  if (!me) return <div className="flex items-center justify-center py-20 text-slate-500">불러오는 중…</div>;

  const t = userTotals(me, prices, rate);
  const fmt = makeFormatter(displayCcy, rate);

  const upsertHolding = async (h: any) => {
    const ticker = h.ticker.toUpperCase().trim();
    // 새 종목 추가인데 동일 티커가 이미 있으면 합산
    if (!h.id) {
      const existing = me.holdings.find((x: any) => x.ticker === ticker);
      if (existing) {
        const totalShares = existing.shares + h.shares;
        const newAvgCost = (existing.shares * existing.avgCost + h.shares * h.avgCost) / totalShares;
        const newPurchaseRate = existing.currency === 'USD'
          ? (existing.shares * (existing.purchaseRate || 1) + h.shares * (h.purchaseRate || 1)) / totalShares
          : 1;
        const merged = { ...existing, shares: totalShares, avgCost: newAvgCost, purchaseRate: newPurchaseRate };
        const newHoldings = me.holdings.map((x: any) => x.id === existing.id ? merged : x);
        await saveHoldings(me.id, newHoldings);
        setModal(null);
        return;
      }
    }
    const i = me.holdings.findIndex((x: any) => x.id === h.id);
    const newH = { ...h, ticker };
    const newHoldings = i >= 0 ? me.holdings.map((x: any, idx: number) => idx === i ? newH : x) : [...me.holdings, { ...newH, id: uid() }];
    await saveHoldings(me.id, newHoldings);
    setModal(null);
  };

  const delHolding = async (hid: string) => {
    const newHoldings = me.holdings.filter((h: any) => h.id !== hid);
    await saveHoldings(me.id, newHoldings);
  };

  return (
    <div className="min-w-0">
      {/* Summary card */}
      <div style={{ ...cardSt, marginBottom: 16, background: `linear-gradient(135deg,${C.card} 55%,${me.color}08)` }} className="overflow-hidden">

        {/* 프로필 헤더 */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <UserAvatar userId={me.id} name={me.name} color={me.color} size={44} serverAvatar={me.avatar ?? null} />
            <div>
              <div className="flex items-center gap-2 font-extrabold text-[17px]">
                {me.name}
                {isAdmin && <Crown className="w-3.5 h-3.5 text-amber-400" />}
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>{me.holdings.length}개 종목 보유</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: refreshing ? C.accent : C.subtle, display: 'flex', alignItems: 'center', gap: 4 }}>
            {refreshing && <span style={{ display: 'inline-block', animation: 'spin .8s linear infinite' }}>↻</span>}
            <span>{refreshing ? '업데이트 중' : lastUpdate ? `${lastUpdate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준` : ''}</span>
          </div>
        </div>

        {/* Hero: 현재 총 가치 */}
        <div className="mb-5 pb-5" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>현재 총 가치</div>
          {t.totalVal != null ? (
            <div style={{ ...mono, fontSize: 'clamp(26px,5.5vw,40px)', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
              {fmt(t.totalVal)}
            </div>
          ) : (
            <div className="skel" style={{ height: 42, borderRadius: 8, width: '55%' }} />
          )}
          {t.pl != null && t.totalVal != null ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <span style={{ ...mono, fontSize: 17, fontWeight: 700, color: t.pl >= 0 ? C.gain : C.loss }}>
                {t.pl >= 0 ? '+' : ''}{fmt(t.pl)}
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, padding: '4px 12px', borderRadius: 8, background: t.pl >= 0 ? `${C.gain}22` : `${C.loss}22`, color: t.pl >= 0 ? C.gain : C.loss }}>
                {fmtPct(t.plPct)}
              </span>
            </div>
          ) : t.totalVal == null ? (
            <div className="skel" style={{ height: 26, borderRadius: 6, width: '40%', marginTop: 10 }} />
          ) : null}
        </div>

        {/* 보조 지표 3개 */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: '투자 원금', value: fmt(t.totalCost), color: undefined as string | undefined },
            { label: '평가 손익', value: t.pl != null ? `${t.pl >= 0 ? '+' : ''}${fmt(t.pl)}` : null, color: t.pl != null ? (t.pl >= 0 ? C.gain : C.loss) : undefined },
            { label: 'USD/KRW', value: rate ? `₩${Math.round(rate).toLocaleString()}` : null, color: undefined as string | undefined },
          ].map((item, i) => (
            <div key={i} style={{ background: '#0a1829', borderRadius: 10, padding: '11px 13px' }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{item.label}</div>
              {item.value != null ? (
                <div style={{ ...mono, fontSize: 'clamp(12px,2.5vw,14px)', fontWeight: 700, color: item.color || C.text }}>{item.value}</div>
              ) : (
                <div className="skel" style={{ height: 16, borderRadius: 4, width: '75%' }} />
              )}
            </div>
          ))}
        </div>

        {/* 도넛 + 비중 */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-center sm:items-start">
          <DonutChart holdings={me.holdings} prices={prices} rate={rate} size={165} />
          <div className="flex-1 min-w-0 w-full">
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>종목 비중</div>
            <HoldingLegend holdings={me.holdings} prices={prices} rate={rate} fmt={fmt} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1 -mx-1 px-1 mb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        <TabBtn active={activeTab === 'holdings'} color={C.accent} onClick={() => setActiveTab('holdings')}><BarChart3 className="w-3.5 h-3.5 shrink-0" /><span>보유 종목</span></TabBtn>
        <TabBtn active={activeTab === 'dividends'} color={C.gain} onClick={() => setActiveTab('dividends')}><Coins className="w-3.5 h-3.5 shrink-0" /><span>배당 정보</span></TabBtn>
        <TabBtn active={activeTab === 'calendar'} color="#a855f7" onClick={() => setActiveTab('calendar')}><Calendar className="w-3.5 h-3.5 shrink-0" /><span>배당 캘린더</span></TabBtn>
      </div>

      {activeTab === 'holdings' && (
        <HoldingsTab user={me} prices={prices} rate={rate} canEdit={true} displayCcy={displayCcy}
          onAdd={() => setModal({ type: 'addStock' })}
          onEdit={(h: any) => setModal({ type: 'editStock', holding: h })}
          onDel={delHolding} />
      )}
      {activeTab === 'dividends' && (
        <DividendsTab user={me} prices={prices} divData={divData} rate={rate} fmt={fmt} divLoadError={divLoadError}
          onFetch={() => loadDividends(me)} />
      )}
      {activeTab === 'calendar' && <DividendCalendarTab user={me} divData={divData} rate={rate} fmt={fmt} />}

      {modal?.type === 'addStock' && <StockModal onSave={upsertHolding} onClose={() => setModal(null)} />}
      {modal?.type === 'editStock' && <StockModal holding={modal.holding} onSave={upsertHolding} onClose={() => setModal(null)} />}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes skel{0%,100%{opacity:.35}50%{opacity:.7}}
        .skel{background:rgba(255,255,255,0.08);animation:skel 1.4s ease-in-out infinite;}
      `}</style>
    </div>
  );
}
