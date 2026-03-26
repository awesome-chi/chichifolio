'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Crown } from 'lucide-react';
import { useApp, C, mono, cardSt } from '@/components/AppContext';
import { useDashboard } from '@/components/DashboardContext';
import { calcH, userTotals, makeFormatter, fmtKRW, fmtPct, PALETTE } from '@/lib/dashboard';

function DonutChart({ holdings, prices, rate, size = 150 }: any) {
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
                <span className="text-[11px] font-semibold shrink-0" style={{ ...mono }}>{w.toFixed(1)}%</span>
              </div>
              <div style={{ height: 3, background: C.border, borderRadius: 2, marginTop: 2 }}>
                <div style={{ height: '100%', width: `${Math.min(w, 100)}%`, background: color, borderRadius: 2, transition: 'width .5s' }} />
              </div>
              <div style={{ ...mono, fontSize: 10, color: C.muted, marginTop: 2 }}>{fmt(c.valKRW)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ComparePage() {
  const { users, session } = useApp();
  const { prices, rate, displayCcy } = useDashboard();
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const me = users.find((u: any) => u.id === session?.userId);

  if (!me?.isAdmin) {
    return <div className="flex items-center justify-center py-20 text-slate-500">관리자 전용 페이지입니다</div>;
  }

  const fmt = makeFormatter(displayCcy, rate);
  const toggle = (id: string) => setCompareIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  const selected = users.filter((u: any) => compareIds.includes(u.id));

  return (
    <div>
      <div style={{ ...cardSt, marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>비교할 포트폴리오 선택</div>
        <div className="flex flex-wrap gap-2">
          {users.map((u: any) => {
            const on = compareIds.includes(u.id);
            return (
              <button key={u.id} onClick={() => toggle(u.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 20, background: on ? `${u.color}22` : '#0d1a2d', border: `1.5px solid ${on ? u.color : C.border}`, cursor: 'pointer', color: on ? u.color : C.muted, fontSize: 13, fontWeight: on ? 600 : 400, transition: 'all .15s' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: on ? u.color : `${u.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: on ? '#fff' : u.color }}>{u.name[0]}</div>
                {u.name}
                {u.isAdmin && <Crown className="w-3 h-3 text-amber-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {selected.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: C.subtle, fontSize: 13 }}>비교할 포트폴리오를 선택하세요</div>
      )}

      {selected.length > 0 && (
        <div className={`grid gap-4 ${selected.length >= 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
          {selected.map((user: any) => {
            const t = userTotals(user, prices, rate);
            return (
              <div key={user.id} style={{ ...cardSt, borderColor: `${user.color}40` }}>
                <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <div className="rounded-full flex items-center justify-center font-extrabold shrink-0"
                    style={{ width: 34, height: 34, background: `${user.color}15`, border: `2px solid ${user.color}40`, fontSize: 13, color: user.color }}>
                    {user.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-[14px]">{user.name}{user.isAdmin && <Crown className="w-3 h-3 text-amber-400" />}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{user.holdings.length}개 종목</div>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ ...mono, fontSize: 14, fontWeight: 700, color: C.text }}>{fmt(t.totalVal)}</div>
                    <div style={{ ...mono, fontSize: 11, color: t.pl != null ? (t.pl >= 0 ? C.gain : C.loss) : C.muted }}>{fmtPct(t.plPct)}</div>
                  </div>
                </div>
                <div className="flex gap-4 items-start mb-4">
                  <DonutChart holdings={user.holdings} prices={prices} rate={rate} size={150} />
                  <div className="flex-1 min-w-0">
                    <HoldingLegend holdings={user.holdings} prices={prices} rate={rate} fmt={fmt} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '투자원금', value: fmt(t.totalCost) },
                    { label: '평가금액', value: fmt(t.totalVal) },
                    { label: '손익', value: fmt(t.pl), color: t.pl != null ? (t.pl >= 0 ? C.gain : C.loss) : undefined },
                  ].map((item, i) => (
                    <div key={i} style={{ background: '#0a1829', borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>{item.label}</div>
                      <div style={{ ...mono, fontSize: 11, fontWeight: 600, color: (item as any).color || C.text }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
