'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp, C, cardSt, inpSt, lblSt, btnPrimary } from '@/components/AppContext';

export default function AdminPage() {
  const { adminLogin, session, loaded } = useApp();
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdmin = async () => {
    if (!pw.trim()) { setError("마스터 비밀번호를 입력해주세요"); return; }
    setLoading(true);
    setError("");
    try {
      const result = await adminLogin(pw.trim());
      if (result) {
        router.push('/dashboard');
      } else {
        setError("비밀번호가 올바르지 않습니다");
        setLoading(false);
      }
    } catch {
      setError("서버 연결에 실패했습니다");
      setLoading(false);
    }
  };

  if (!loaded) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", color:C.accent, fontFamily:"system-ui" }}>
      불러오는 중…
    </div>
  );

  if (session) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'Pretendard',system-ui,sans-serif", display:"flex", flexDirection:"column" }}>
      <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 24px" }}>
        <Link href="/" style={{ fontWeight:900, fontSize:20, color:"#fff", letterSpacing:"-0.02em", textDecoration:"none" }}>
          ChiChiFolio<span style={{ color:C.accent }}>.</span>
        </Link>
      </nav>

      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
        <div style={{ width:"100%", maxWidth:380 }}>
          <div style={{ textAlign:"center", marginBottom:36 }}>
            <div style={{
              width:56, height:56, borderRadius:16,
              background:`${C.admin}15`, border:`1px solid ${C.admin}30`,
              display:"inline-flex", alignItems:"center", justifyContent:"center",
              fontSize:26, marginBottom:16
            }}>
              🔐
            </div>
            <h1 style={{ fontSize:22, fontWeight:800, color:"#fff", margin:"0 0 8px" }}>관리자 인증</h1>
            <p style={{ fontSize:13, color:C.muted, margin:0 }}>관리자 전용 페이지입니다</p>
          </div>

          <div style={{ ...cardSt, borderRadius:16, padding:28 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div>
                <label style={lblSt}>마스터 비밀번호</label>
                <input
                  style={inpSt}
                  type="password"
                  value={pw}
                  onChange={e => { setPw(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleAdmin()}
                  placeholder="마스터 비밀번호 입력"
                  autoFocus
                />
              </div>
              {error && (
                <div style={{
                  fontSize:13, color:C.loss,
                  background:`${C.loss}12`, border:`1px solid ${C.loss}30`,
                  borderRadius:8, padding:"8px 12px"
                }}>
                  {error}
                </div>
              )}
              <button onClick={handleAdmin} disabled={loading}
                style={{ ...btnPrimary, marginTop:4, background:C.admin, opacity: loading ? 0.5 : 1 }}>
                {loading ? "인증 중…" : "관리자 로그인"}
              </button>
            </div>
          </div>

          <div style={{ textAlign:"center", marginTop:20 }}>
            <Link href="/" style={{ color:C.muted, fontSize:13, textDecoration:"none" }}>
              ← 메인으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
