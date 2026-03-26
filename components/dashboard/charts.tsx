'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PALETTE, fmtKRW, fmtUSD, fmtPct, calcH, makeFormatter } from '@/lib/dashboard';

const C = { bg:"#07111f", card:"#0f1e32", border:"#172a45", accent:"#06b6d4", gain:"#ef4444", loss:"#3b82f6", text:"#e2e8f0", muted:"#64748b" };
const mono = { fontVariantNumeric:"tabular-nums" as const, fontFamily:"'SF Mono','Fira Code',monospace" };

export function DonutChart({ holdings, prices, rate, size = 170 }: any) {
  const data = holdings.map((h: any) => {
    const c = calcH(h, prices[h.ticker], rate);
    return { ticker: h.ticker, val: c.valKRW ?? c.costKRW ?? 0 };
  }).filter((d: any) => d.val > 0);
  const total = data.reduce((s: number, d: any) => s + d.val, 0);

  if (!total) return (
    <div style={{ width: size, height: size, borderRadius: '50%', border: `2px dashed ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 11, flexShrink: 0 }}>
      No data
    </div>
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

export function HoldingLegend({ holdings, prices, rate, fmt }: any) {
  const rows = holdings.map((h: any, i: number) => {
    const c = calcH(h, prices[h.ticker], rate);
    return { h, c, val: c.valKRW ?? c.costKRW ?? 0, color: PALETTE[i % PALETTE.length], name: prices[h.ticker]?.name ?? h._name ?? h.ticker };
  });
  const total = rows.reduce((s: number, r: any) => s + r.val, 0);

  return (
    <div className="flex flex-col gap-2">
      {rows.map(({ h, c, val, color, name }: any) => {
        const w = total > 0 ? (val / total) * 100 : 0;
        return (
          <div key={h.id} className="flex items-center gap-2 min-w-0">
            <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-xs shrink-0" style={{ color: C.accent }}>{h.ticker}</span>
                <span className="text-[10px] truncate flex-1" style={{ color: C.muted }}>{name}</span>
                <span className="text-[11px] font-semibold shrink-0" style={{ ...mono, color: C.text }}>{w.toFixed(1)}%</span>
              </div>
              <div style={{ height: 3, background: C.border, borderRadius: 2, marginTop: 2 }}>
                <div style={{ height: '100%', width: `${Math.min(w, 100)}%`, background: color, borderRadius: 2, transition: 'width .5s' }} />
              </div>
              <div className="flex gap-2 mt-0.5">
                <span style={{ ...mono, fontSize: 10, color: C.muted }}>{fmt(c.valKRW)}</span>
                <span style={{ ...mono, fontSize: 10, color: c.plPct != null ? (c.plPct >= 0 ? C.gain : C.loss) : C.muted }}>{fmtPct(c.plPct)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
