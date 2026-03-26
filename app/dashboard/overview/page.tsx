'use client';

import { useRouter } from 'next/navigation';
import { Crown } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp, C, mono, cardSt } from '@/components/AppContext';
import { useDashboard } from '@/components/DashboardContext';
import { calcH, userTotals, makeFormatter, fmtKRW, fmtPct, PALETTE } from '@/lib/dashboard';

function DonutChart({ holdings, prices, rate, size = 110 }: any) {
  const data = holdings.map((h: any) => {
    const c = calcH(h, prices[h.ticker], rate);
    return { ticker: h.ticker, val: c.valKRW ?? c.costKRW ?? 0 };
  }).filter((d: any) => d.val > 0);
  const total = data.reduce((s: number, d: any) => s + d.val, 0);
  if (!total) return (
    <div style={{ width: size, height: size, borderRadius: '50%', border: `2px dashed ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 10, flexShrink: 0 }}>No data</div>
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
        <div style={{ fontSize: 8, color: C.muted }}>총자산</div>
        <div style={{ ...mono, fontSize: 9, fontWeight: 700, color: C.text, whiteSpace: 'nowrap' }}>{fmtKRW(total)}</div>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const { users, session } = useApp();
  const { prices, rate, displayCcy } = useDashboard();
  const router = useRouter();
  const me = users.find((u: any) => u.id === session?.userId);

  if (!me?.isAdmin) {
    return <div className="flex items-center justify-center py-20 text-slate-500">관리자 전용 페이지입니다</div>;
  }

  const fmt = makeFormatter(displayCcy, rate);
  const totals = users.map((u: any) => ({ user: u, ...userTotals(u, prices, rate) }));
  const grand = totals.reduce((a: any, t: any) => ({
    cost: a.cost + t.totalCost,
    val: t.totalVal != null ? (a.val || 0) + t.totalVal : a.val,
  }), { cost: 0, val: null as number | null });
  const grandPl = grand.val != null ? grand.val - grand.cost : null;
  const grandPct = grandPl != null && grand.cost ? (grandPl / grand.cost) * 100 : null;

  return (
    <div>
      {/* Grand total bar */}
      <div style={{ ...cardSt, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0, marginBottom: 18, padding: 0, overflow: 'hidden' }} className="sm:grid-cols-4">
        {[
          { label: '전체 투자 원금', value: fmt(grand.cost) },
          { label: '전체 현재 가치', value: fmt(grand.val) },
          { label: '전체 평가손익', value: fmt(grandPl), color: grandPl != null ? (grandPl >= 0 ? C.gain : C.loss) : undefined },
          { label: '전체 수익률', value: fmtPct(grandPct), color: grandPct != null ? (grandPct >= 0 ? C.gain : C.loss) : undefined },
        ].map((item, i) => (
          <div key={i} style={{ padding: '18px 22px', borderRight: i < 3 ? `1px solid ${C.border}` : 'none', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{item.label}</div>
            <div style={{ ...mono, fontSize: 'clamp(14px,3vw,19px)', fontWeight: 700, color: (item as any).color || C.text }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Per-user cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {totals.map(({ user, totalCost, totalVal, pl, plPct }: any) => (
          <div key={user.id} onClick={() => router.push('/dashboard')}
            style={{ ...cardSt, cursor: 'pointer', borderColor: `${user.color}30`, transition: 'all .2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = user.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = `${user.color}30`; e.currentTarget.style.transform = 'none'; }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full flex items-center justify-center font-extrabold shrink-0"
                style={{ width: 34, height: 34, background: `${user.color}15`, border: `2px solid ${user.color}40`, fontSize: 13, color: user.color }}>
                {user.name[0]}
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-[13px]">
                  {user.name}
                  {user.isAdmin && <Crown className="w-3 h-3 text-amber-400" />}
                </div>
                <div style={{ fontSize: 10, color: C.muted }}>{user.holdings.length}개 종목</div>
              </div>
              <div style={{ marginLeft: 'auto', color: C.subtle }}>›</div>
            </div>
            <div className="flex gap-4 items-center">
              <DonutChart holdings={user.holdings} prices={prices} rate={rate} size={110} />
              <div className="flex-1 flex flex-col gap-2">
                {[
                  { label: '투자 원금', value: fmt(totalCost) },
                  { label: '현재 가치', value: fmt(totalVal) },
                  { label: '평가손익', value: fmt(pl), color: pl != null ? (pl >= 0 ? C.gain : C.loss) : undefined },
                  { label: '수익률', value: fmtPct(plPct), color: plPct != null ? (plPct >= 0 ? C.gain : C.loss) : undefined },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-baseline">
                    <span style={{ fontSize: 10, color: C.muted }}>{item.label}</span>
                    <span style={{ ...mono, fontSize: 12, fontWeight: 600, color: (item as any).color || C.text }}>{item.value}</span>
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
