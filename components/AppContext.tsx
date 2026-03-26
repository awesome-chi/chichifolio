'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getSupabase } from '@/lib/supabase';
import { saveAvatar, saveAvatarToCloud, loadAvatarFromCloud, type AvatarData } from '@/lib/avatar';

const SESSION_KEY = "chichifolio-session";
const USER_COLORS = ["#06b6d4","#3b82f6","#f59e0b","#a855f7","#ec4899"];
const uid = () => Math.random().toString(36).slice(2, 9);

function parseRpc(data: any): any {
  if (!data) return null;
  return typeof data === 'string' ? JSON.parse(data) : data;
}

async function rpc(fn: string, params?: Record<string, any>) {
  const sb = getSupabase();
  if (!sb) return { data: null, error: { message: 'Supabase not configured' } };
  try {
    const result = await Promise.race([
      sb.rpc(fn, params),
      new Promise<{ data: null; error: { message: string } }>(resolve =>
        setTimeout(() => resolve({ data: null, error: { message: 'Request timeout' } }), 10000)
      ),
    ]);
    return result;
  } catch (e) {
    return { data: null, error: { message: String(e) } };
  }
}

interface AppContextType {
  users: any[];
  session: { userId: string } | null;
  loaded: boolean;
  login: (name: string, password: string) => Promise<{ error?: string; user?: any }>;
  logout: () => void;
  signup: (name: string, password: string) => Promise<{ error?: string; user?: any }>;
  adminLogin: (masterPw: string) => Promise<any>;
  addUser: (data: { name: string; password: string; isAdmin?: boolean }) => Promise<any>;
  updateUser: (id: string, data: { name?: string; password?: string }) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  saveHoldings: (userId: string, holdings: any[]) => Promise<void>;
  refreshUsers: () => Promise<void>;
  saveUserAvatar: (userId: string, data: AvatarData) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<any[]>([]);
  const [session, setSession] = useState<{ userId: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadAllUsers = useCallback(async () => {
    try {
      const { data, error } = await rpc('fn_load_users');
      if (!error && data) {
        const parsed = parseRpc(data);
        if (Array.isArray(parsed)) setUsers(parsed);
      }
    } catch {}
  }, []);

  const saveUserAvatar = useCallback(async (userId: string, data: AvatarData) => {
    saveAvatar(userId, data);
    await saveAvatarToCloud(userId, data);
    setUsers(prev => prev.map(u => u.id !== userId ? u : { ...u, avatar: data }));
  }, []);

  const loadUserAvatar = useCallback(async (userId: string) => {
    const cloud = await loadAvatarFromCloud(userId);
    if (cloud) {
      saveAvatar(userId, cloud);
      setUsers(prev => prev.map(u => u.id !== userId ? u : { ...u, avatar: cloud }));
    }
  }, []);

  useEffect(() => {
    async function init() {
      let userId: string | null = null;
      try {
        const sess = localStorage.getItem(SESSION_KEY);
        if (sess) { const parsed = JSON.parse(sess); setSession(parsed); userId = parsed.userId; }
      } catch {}
      try {
        await loadAllUsers();
      } catch (e) {
        console.error('[ChiChiFolio] Failed to load users from Supabase:', e);
      }
      if (userId) loadUserAvatar(userId).catch(() => {});
      setLoaded(true);
    }
    init();
  }, [loadAllUsers, loadUserAvatar]);

  const login = useCallback(async (name: string, password: string) => {
    const { data, error } = await rpc('fn_login', { p_name: name, p_password: password });
    if (error) {
      console.error('[ChiChiFolio] Supabase login error:', error);
      return { error: (error as any).message || "서버 오류가 발생했습니다" };
    }

    const user = parseRpc(data);
    if (!user?.id) return { error: "존재하지 않는 닉네임이거나 비밀번호가 올바르지 않습니다" };

    setUsers(prev => {
      const idx = prev.findIndex(u => u.id === user.id);
      if (idx >= 0) return prev.map(u => u.id === user.id ? { ...u, ...user } : u);
      return [...prev, user];
    });

    const sess = { userId: user.id };
    setSession(sess);
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(sess)); } catch {}
    loadUserAvatar(user.id).catch(() => {});
    return { user };
  }, [loadUserAvatar]);

  const logout = useCallback(() => {
    setSession(null);
    try { localStorage.removeItem(SESSION_KEY); } catch {}
  }, []);

  const signup = useCallback(async (name: string, password: string) => {
    const id = uid();
    const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];

    const { data, error } = await rpc('fn_signup', {
      p_id: id, p_name: name, p_password: password, p_color: color
    });
    if (error) {
      console.error('[ChiChiFolio] Supabase signup error:', error);
      return { error: (error as any).message || "서버 오류가 발생했습니다" };
    }

    const user = parseRpc(data);
    if (!user?.id) return { error: "이미 사용 중인 닉네임입니다" };

    user.holdings = [];
    setUsers(prev => [...prev, user]);

    const sess = { userId: user.id };
    setSession(sess);
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(sess)); } catch {}
    return { user };
  }, []);

  const adminLogin = useCallback(async (masterPw: string) => {
    const correctPw = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "";
    if (!correctPw || masterPw !== correctPw) return null;

    const id = uid();
    const { data, error } = await rpc('fn_admin_login', {
      p_id: id, p_name: '관리자', p_password: masterPw
    });
    if (error || !data) return null;

    const admin = parseRpc(data);
    if (!admin?.id) return null;

    setUsers(prev => {
      const idx = prev.findIndex(u => u.id === admin.id);
      if (idx >= 0) return prev.map(u => u.id === admin.id ? { ...u, ...admin } : u);
      return [...prev, admin];
    });

    const sess = { userId: admin.id };
    setSession(sess);
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(sess)); } catch {}
    return admin;
  }, []);

  const addUser = useCallback(async (data: { name: string; password: string; isAdmin?: boolean }) => {
    const id = uid();
    const color = USER_COLORS[users.length % USER_COLORS.length];

    const { data: result, error } = await rpc('fn_add_user', {
      p_id: id, p_name: data.name, p_password: data.password,
      p_is_admin: !!data.isAdmin, p_color: color
    });
    if (error || !result) return null;

    const user = parseRpc(result);
    if (!user?.id) return null;
    user.holdings = [];
    setUsers(prev => [...prev, user]);
    return user;
  }, [users.length]);

  const updateUser = useCallback(async (id: string, data: { name?: string; password?: string }) => {
    const user = users.find(u => u.id === id);
    if (!user) return;

    await rpc('fn_update_user', {
      p_user_id: id,
      p_name: data.name || user.name,
      p_password: data.password || '',
      p_color: user.color
    });

    setUsers(prev => prev.map(u =>
      u.id !== id ? u : { ...u, ...(data.name ? { name: data.name } : {}) }
    ));
  }, [users]);

  const deleteUser = useCallback(async (id: string) => {
    await rpc('fn_delete_user', { p_user_id: id });
    setUsers(prev => prev.filter(u => u.id !== id));
  }, []);

  const saveHoldings = useCallback(async (userId: string, holdings: any[]) => {
    const payload = holdings.map(h => ({
      id: h.id || uid(),
      ticker: h.ticker,
      shares: h.shares,
      avgPrice: h.avgPrice ?? 0,
      avgCost: h.avgCost ?? 0,
      purchaseRate: h.purchaseRate ?? 1,
      currency: h.currency || 'USD'
    }));

    await rpc('fn_save_holdings', {
      p_user_id: userId,
      p_holdings: payload
    });

    setUsers(prev => prev.map(u =>
      u.id !== userId ? u : { ...u, holdings }
    ));
  }, []);

  return (
    <AppContext.Provider value={{
      users, session, loaded,
      login, logout, signup, adminLogin,
      addUser, updateUser, deleteUser,
      saveHoldings, refreshUsers: loadAllUsers, saveUserAvatar,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export const C = { bg:"#07111f", card:"#0f1e32", border:"#172a45", accent:"#06b6d4", gain:"#ef4444", loss:"#3b82f6", text:"#e2e8f0", muted:"#64748b", subtle:"#334155", admin:"#f59e0b" };
export const mono = { fontVariantNumeric:"tabular-nums", fontFamily:"'SF Mono','Fira Code',monospace" } as const;
export const cardSt = { background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:20 };
export const btnPrimary = { background:C.accent, border:"none", color:"#fff", borderRadius:10, padding:"12px 0", minHeight:48, cursor:"pointer", fontSize:15, fontWeight:700, transition:"all .2s" };
export const inpSt = { background:"#050d1a", border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 14px", minHeight:48, color:C.text, fontSize:14, width:"100%", outline:"none", boxSizing:"border-box" as const };
export const lblSt = { fontSize:12, color:C.muted, marginBottom:5, display:"block" as const, fontWeight:500 };
