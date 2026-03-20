'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { useApp } from '@/components/AppContext';
import AppNavBar from '@/components/AppNavBar';

export default function LoginPage() {
  const { login, session, loaded } = useApp();
  const router = useRouter();
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!name.trim() || !pw) { setError("닉네임과 비밀번호를 입력해주세요"); return; }
    setLoading(true);
    setError("");
    try {
      const result = await login(name.trim(), pw);
      if (result.error) { setError(result.error); setLoading(false); return; }
      router.push('/dashboard');
    } catch {
      setError("서버 연결에 실패했습니다");
      setLoading(false);
    }
  };

  if (!loaded) return (
    <div className="min-h-screen bg-surface flex items-center justify-center text-cyan-400 font-sans">불러오는 중…</div>
  );

  if (session) { router.push('/dashboard'); return null; }

  return (
    <div className="min-h-screen bg-surface text-slate-200 font-sans flex flex-col">
      <AppNavBar />

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[400px] animate-fade-up">
          <div className="text-center mb-9">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 inline-flex items-center justify-center mb-4">
              <LogIn className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white mb-2">로그인</h1>
            <p className="text-[13px] sm:text-sm text-slate-500">포트폴리오를 확인하려면 로그인하세요</p>
          </div>

          <div className="glass-card p-5 sm:p-7">
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[13px] sm:text-xs text-slate-500 font-medium mb-1.5 block">닉네임</label>
                <input className="w-full bg-[#050d1a] border border-line rounded-xl px-4 py-3 min-h-[48px] text-base text-slate-200 outline-none focus:border-cyan-500/50 transition touch-manipulation"
                  value={name} onChange={e => { setName(e.target.value); setError(""); }}
                  placeholder="닉네임 입력" autoFocus
                  onKeyDown={e => e.key === "Enter" && document.getElementById("login-pw")?.focus()} />
              </div>
              <div>
                <label className="text-[13px] sm:text-xs text-slate-500 font-medium mb-1.5 block">비밀번호</label>
                <input id="login-pw" className="w-full bg-[#050d1a] border border-line rounded-xl px-4 py-3 min-h-[48px] text-base text-slate-200 outline-none focus:border-cyan-500/50 transition touch-manipulation"
                  type="password" value={pw}
                  onChange={e => { setPw(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="비밀번호 입력" />
              </div>
              {error && (
                <div className="text-[13px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">{error}</div>
              )}
              <button onClick={handleLogin} disabled={loading}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-xl py-3 min-h-[48px] text-[15px] cursor-pointer border-none transition-all mt-1 disabled:opacity-50 touch-manipulation">
                {loading ? "로그인 중…" : "로그인"}
              </button>
            </div>
          </div>

          <div className="text-center mt-5">
            <span className="text-[13px] text-slate-500">계정이 없으신가요? </span>
            <Link href="/signup" className="text-cyan-400 text-[13px] font-semibold no-underline hover:text-cyan-300 transition">회원가입</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
