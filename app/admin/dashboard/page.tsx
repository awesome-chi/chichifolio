'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, C, cardSt } from '@/components/AppContext';

const S = {
  page: { minHeight:'100vh', background:C.bg, color:C.text, fontFamily:"'Pretendard',system-ui,sans-serif" },
  header: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 28px', borderBottom:`1px solid ${C.border}`, background:C.card } as React.CSSProperties,
  logo: { fontWeight:900, fontSize:20, color:'#fff', letterSpacing:'-0.02em' },
  badge: { background:`${C.admin}20`, color:C.admin, border:`1px solid ${C.admin}40`, borderRadius:6, padding:'3px 10px', fontSize:12, fontWeight:700 },
  main: { maxWidth:1100, margin:'0 auto', padding:'32px 24px' },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginBottom:32 } as React.CSSProperties,
  statCard: { ...cardSt, borderRadius:14, padding:'20px 24px', display:'flex', flexDirection:'column', gap:6 } as React.CSSProperties,
  statLabel: { fontSize:12, color:C.muted, fontWeight:500 },
  statValue: { fontSize:28, fontWeight:800, color:'#fff' },
  section: { ...cardSt, borderRadius:16, marginBottom:24 } as React.CSSProperties,
  sectionHead: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  sectionTitle: { fontSize:15, fontWeight:700, color:'#fff' },
  table: { width:'100%', borderCollapse:'collapse' as const },
  th: { fontSize:11, color:C.muted, fontWeight:600, textAlign:'left' as const, padding:'8px 12px', borderBottom:`1px solid ${C.border}`, textTransform:'uppercase' as const, letterSpacing:'0.05em' },
  td: { fontSize:13, color:C.text, padding:'12px 12px', borderBottom:`1px solid ${C.border}20`, verticalAlign:'top' as const },
  tag: { display:'inline-block', borderRadius:4, padding:'2px 8px', fontSize:11, fontWeight:600 },
  btnDanger: { background:`${C.loss}20`, color:C.loss, border:`1px solid ${C.loss}40`, borderRadius:7, padding:'5px 12px', cursor:'pointer', fontSize:12, fontWeight:600 },
  btnSecondary: { background:C.subtle, color:C.text, border:`1px solid ${C.border}`, borderRadius:7, padding:'5px 12px', cursor:'pointer', fontSize:12, fontWeight:600 },
  modal: { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 } as React.CSSProperties,
  modalBox: { background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:28, width:'100%', maxWidth:420 } as React.CSSProperties,
};

type User = { id: string; name: string; isAdmin: boolean; color: string; holdings: any[] };

export default function AdminDashboard() {
  const { users, session, loaded, logout, deleteUser, refreshUsers } = useApp();
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const currentUser = users.find(u => u.id === session?.userId);

  useEffect(() => {
    if (!loaded) return;
    if (!session || !currentUser?.isAdmin) {
      router.replace('/admin');
    }
  }, [loaded, session, currentUser, router]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshUsers();
    setLastRefresh(new Date());
    setRefreshing(false);
  }, [refreshUsers]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteUser(deleteTarget.id);
    setDeleteTarget(null);
    setDeleting(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!loaded || !session || !currentUser?.isAdmin) {
    return <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center', color:C.accent }}>불러오는 중…</div>;
  }

  const normalUsers = users.filter(u => !u.isAdmin);
  const totalHoldings = normalUsers.reduce((sum, u) => sum + (u.holdings?.length || 0), 0);
  const activeUsers = normalUsers.filter(u => (u.holdings?.length || 0) > 0).length;
  const tickers = normalUsers.flatMap(u => u.holdings?.map((h: any) => h.ticker) || []);
  const tickerCount: Record<string, number> = {};
  tickers.forEach(t => { tickerCount[t] = (tickerCount[t] || 0) + 1; });
  const topTickers = Object.entries(tickerCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div style={S.page}>
      {/* Header */}
      <header style={S.header}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <span style={S.logo}>ChiChiFolio<span style={{ color:C.accent }}>.</span></span>
          <span style={S.badge}>🔐 관리자</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:13, color:C.muted }}>
            마지막 갱신: {lastRefresh.toLocaleTimeString('ko-KR')}
          </span>
          <button onClick={handleRefresh} style={S.btnSecondary} disabled={refreshing}>
            {refreshing ? '갱신 중…' : '↻ 새로고침'}
          </button>
          <button onClick={handleLogout} style={{ ...S.btnSecondary, color:C.loss, borderColor:`${C.loss}40` }}>
            로그아웃
          </button>
        </div>
      </header>

      <main style={S.main}>
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', margin:'0 0 4px' }}>관리자 대시보드</h1>
          <p style={{ fontSize:13, color:C.muted, margin:0 }}>전체 회원 및 서비스 현황을 관리합니다</p>
        </div>

        {/* Stats */}
        <div style={S.grid}>
          <div style={S.statCard}>
            <span style={S.statLabel}>전체 회원</span>
            <span style={{ ...S.statValue, color:C.accent }}>{normalUsers.length}</span>
            <span style={{ fontSize:12, color:C.muted }}>관리자 제외</span>
          </div>
          <div style={S.statCard}>
            <span style={S.statLabel}>활성 회원</span>
            <span style={{ ...S.statValue, color:C.gain }}>{activeUsers}</span>
            <span style={{ fontSize:12, color:C.muted }}>보유 종목 있는 회원</span>
          </div>
          <div style={S.statCard}>
            <span style={S.statLabel}>총 보유 종목 수</span>
            <span style={{ ...S.statValue, color:'#a855f7' }}>{totalHoldings}</span>
            <span style={{ fontSize:12, color:C.muted }}>전체 회원 합산</span>
          </div>
          <div style={S.statCard}>
            <span style={S.statLabel}>종목 다양성</span>
            <span style={{ ...S.statValue, color:C.admin }}>{Object.keys(tickerCount).length}</span>
            <span style={{ fontSize:12, color:C.muted }}>고유 티커 수</span>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20, marginBottom:24 } as React.CSSProperties}>
          {/* 인기 종목 */}
          <div style={S.section}>
            <div style={S.sectionHead}>
              <span style={S.sectionTitle}>🔥 인기 종목 TOP 5</span>
              <span style={{ fontSize:12, color:C.muted }}>보유 회원 수 기준</span>
            </div>
            {topTickers.length === 0 ? (
              <p style={{ color:C.muted, fontSize:13 }}>데이터 없음</p>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {topTickers.map(([ticker, count], i) => (
                  <div key={ticker} style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontSize:12, color:C.muted, width:20, textAlign:'right' }}>#{i+1}</span>
                    <span style={{ fontWeight:700, color:'#fff', flex:1, fontSize:14 }}>{ticker}</span>
                    <div style={{ flex:2, background:C.border, borderRadius:4, height:6, overflow:'hidden' }}>
                      <div style={{ height:'100%', background:C.accent, borderRadius:4, width:`${(count / normalUsers.length) * 100}%` }} />
                    </div>
                    <span style={{ fontSize:12, color:C.muted, width:50, textAlign:'right' }}>{count}명</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 시스템 상태 */}
          <div style={S.section}>
            <div style={S.sectionHead}>
              <span style={S.sectionTitle}>⚙️ 시스템 상태</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { label:'웹 서버', status:'정상', ok:true },
                { label:'Supabase DB', status:'연결됨', ok:true },
                { label:'Next.js', status:'v14 운영 중', ok:true },
              ].map(item => (
                <div key={item.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:13, color:C.muted }}>{item.label}</span>
                  <span style={{
                    ...S.tag,
                    background: item.ok ? `${C.gain}20` : `${C.loss}20`,
                    color: item.ok ? C.gain : C.loss,
                  }}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 회원 목록 */}
        <div style={S.section}>
          <div style={S.sectionHead}>
            <span style={S.sectionTitle}>👥 회원 목록</span>
            <span style={{ fontSize:12, color:C.muted }}>총 {normalUsers.length}명</span>
          </div>
          {normalUsers.length === 0 ? (
            <p style={{ color:C.muted, fontSize:13 }}>가입한 회원이 없습니다</p>
          ) : (
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>닉네임</th>
                  <th style={S.th}>보유 종목</th>
                  <th style={S.th}>구분</th>
                  <th style={S.th}></th>
                </tr>
              </thead>
              <tbody>
                {normalUsers.map(user => (
                  <>
                    <tr key={user.id} style={{ cursor:'pointer' }} onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}>
                      <td style={S.td}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:28, height:28, borderRadius:8, background:user.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>
                            {user.name[0]?.toUpperCase()}
                          </div>
                          <span style={{ fontWeight:600 }}>{user.name}</span>
                        </div>
                      </td>
                      <td style={S.td}>
                        <span style={{ ...S.tag, background:`${C.accent}15`, color:C.accent }}>
                          {user.holdings?.length || 0}개
                        </span>
                      </td>
                      <td style={S.td}>
                        <span style={{ ...S.tag, background:`${C.gain}15`, color:C.gain }}>일반</span>
                      </td>
                      <td style={{ ...S.td, textAlign:'right' }}>
                        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                          <button style={S.btnSecondary} onClick={e => { e.stopPropagation(); setExpandedUser(expandedUser === user.id ? null : user.id); }}>
                            {expandedUser === user.id ? '접기 ▲' : '종목 보기 ▼'}
                          </button>
                          <button style={S.btnDanger} onClick={e => { e.stopPropagation(); setDeleteTarget(user); }}>삭제</button>
                        </div>
                      </td>
                    </tr>
                    {expandedUser === user.id && (
                      <tr key={`${user.id}-detail`}>
                        <td colSpan={4} style={{ ...S.td, background:`${C.bg}80`, padding:'12px 24px' }}>
                          {(user.holdings?.length || 0) === 0 ? (
                            <span style={{ fontSize:12, color:C.muted }}>보유 종목 없음</span>
                          ) : (
                            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                              {user.holdings.map((h: any) => (
                                <div key={h.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:'6px 12px' }}>
                                  <span style={{ fontWeight:700, color:'#fff', fontSize:13 }}>{h.ticker}</span>
                                  <span style={{ color:C.muted, fontSize:12, marginLeft:8 }}>{h.shares}주</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div style={S.modal} onClick={() => setDeleteTarget(null)}>
          <div style={S.modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize:17, fontWeight:800, color:'#fff', margin:'0 0 8px' }}>회원 삭제</h3>
            <p style={{ fontSize:14, color:C.muted, margin:'0 0 24px' }}>
              <strong style={{ color:'#fff' }}>{deleteTarget.name}</strong> 회원을 삭제하면 보유 종목 데이터도 함께 삭제됩니다. 계속하시겠습니까?
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ ...S.btnSecondary, flex:1, padding:'10px 0', fontSize:14 }}>취소</button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ flex:1, background:C.loss, color:'#fff', border:'none', borderRadius:8, padding:'10px 0', cursor:'pointer', fontSize:14, fontWeight:700, opacity: deleting ? 0.5 : 1 }}>
                {deleting ? '삭제 중…' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
