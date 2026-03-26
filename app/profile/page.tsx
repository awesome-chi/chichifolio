'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Camera, Check, Eye, EyeOff, X } from 'lucide-react';
import { useApp, C, inpSt, lblSt } from '@/components/AppContext';
import { getAvatar, resizeImage, PRESET_AVATARS, type AvatarData } from '@/lib/avatar';
import UserAvatar from '@/components/UserAvatar';

export default function ProfilePage() {
  const { session, users, loaded, updateUser, saveUserAvatar } = useApp();
  const router = useRouter();
  const me = users.find((u: any) => u.id === session?.userId);

  const [name, setName] = useState('');
  const [newPw, setNewPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [preview, setPreview] = useState<AvatarData | null>(null);
  const [saving, setSaving] = useState<'name' | 'pw' | 'avatar' | null>(null);
  const [saved, setSaved] = useState<'name' | 'pw' | 'avatar' | null>(null);
  const [imgError, setImgError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (loaded && !session) router.replace('/login');
  }, [loaded, session, router]);

  useEffect(() => {
    if (me) {
      setName(me.name);
      // me.avatar is loaded from cloud by AppContext on login/init
      setPreview(me.avatar ?? getAvatar(me.id));
    }
  }, [me?.id]);

  if (!loaded || !me) {
    return <div className="min-h-screen bg-[#07111f] flex items-center justify-center text-cyan-400">불러오는 중…</div>;
  }

  const flash = (type: 'name' | 'pw' | 'avatar') => {
    setSaved(type);
    setTimeout(() => setSaved(null), 2200);
  };

  const handleSaveAvatar = async () => {
    if (!preview) return;
    setSaving('avatar');
    await saveUserAvatar(me.id, preview);
    setSaving(null);
    flash('avatar');
  };

  const handleSaveName = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === me.name) return;
    setSaving('name');
    await updateUser(me.id, { name: trimmed });
    setSaving(null);
    flash('name');
  };

  const handleSavePw = async () => {
    if (!newPw.trim()) return;
    setSaving('pw');
    await updateUser(me.id, { password: newPw.trim() });
    setNewPw('');
    setSaving(null);
    flash('pw');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImgError('');
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setImgError('이미지 파일만 업로드 가능합니다'); return; }
    if (file.size > 5 * 1024 * 1024) { setImgError('5MB 이하 파일만 업로드 가능합니다'); return; }
    try {
      const data = await resizeImage(file, 220);
      setPreview({ type: 'custom', data });
    } catch { setImgError('이미지 처리 중 오류가 발생했습니다'); }
    e.target.value = '';
  };

  const card = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 14 };
  const secLabel = { fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 18 };

  const SaveBtn = ({ type, disabled, label, savedLabel }: { type: 'name' | 'pw' | 'avatar'; disabled: boolean; label: string; savedLabel: string }) => (
    <button
      onClick={type === 'avatar' ? handleSaveAvatar : type === 'name' ? handleSaveName : handleSavePw}
      disabled={disabled || saving === type}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: saved === type ? C.gain : C.accent,
        border: 'none', color: '#fff', borderRadius: 10,
        padding: '10px 20px', cursor: (disabled || saving === type) ? 'default' : 'pointer',
        fontSize: 13, fontWeight: 700, opacity: (disabled || saving === type) ? 0.45 : 1,
        transition: 'all .2s',
      }}
    >
      {saved === type ? (
        <><Check style={{ width: 13, height: 13 }} />{savedLabel}</>
      ) : saving === type ? '저장 중…' : label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-200 font-sans text-sm">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#07111f]/95 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 sm:px-6 h-14">
          <button onClick={() => router.back()} className="p-1.5 text-slate-400 hover:text-white transition rounded-lg hover:bg-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Link href="/" className="text-base font-black text-white tracking-tight">
            ChiChiFolio<span className="text-cyan-400">.</span>
          </Link>
          <span className="text-slate-700 select-none">/</span>
          <span className="text-[13px] font-semibold text-slate-400">프로필 설정</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8 pb-20">

        {/* 현재 프로필 미리보기 */}
        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <UserAvatar userId={me.id} name={me.name} color={me.color} size={80} previewAvatar={preview} />
            <button
              onClick={() => fileRef.current?.click()}
              style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: C.accent, border: `2px solid ${C.card}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title="사진 업로드"
            >
              <Camera style={{ width: 12, height: 12, color: '#fff' }} />
            </button>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: C.text }}>{me.name}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
              {me.isAdmin
                ? <span style={{ color: '#f59e0b', fontWeight: 600 }}>관리자 계정</span>
                : '일반 계정'}
            </div>
          </div>
        </div>

        {/* 프로필 사진 선택 */}
        <div style={card}>
          <div style={secLabel}>프로필 사진</div>

          {/* 기본 프리셋 6개 */}
          <div style={{ marginBottom: 6, fontSize: 11, color: C.muted, fontWeight: 600 }}>기본 이미지 선택</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
            {PRESET_AVATARS.map(p => {
              const isSelected = preview?.type === 'preset' && (preview as any).id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPreview({ type: 'preset', id: p.id })}
                  title={p.label}
                  style={{
                    position: 'relative', background: 'transparent', border: 'none',
                    padding: 2, cursor: 'pointer', borderRadius: '50%',
                    outline: isSelected ? `2.5px solid ${C.accent}` : '2.5px solid transparent',
                    outlineOffset: 2, transition: 'outline-color .15s',
                    aspectRatio: '1',
                  }}
                >
                  <div style={{
                    width: '100%', paddingBottom: '100%', position: 'relative',
                    borderRadius: '50%', overflow: 'hidden',
                    background: `linear-gradient(135deg, ${p.color1}, ${p.color2})`,
                  }}>
                    <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(18px, 3.5vw, 28px)' }}>
                      {p.emoji}
                    </span>
                  </div>
                  {isSelected && (
                    <span style={{ position: 'absolute', bottom: 0, right: 0, width: 17, height: 17, borderRadius: '50%', background: C.accent, border: `2px solid ${C.card}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check style={{ width: 9, height: 9, color: '#fff' }} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 직접 업로드 */}
          <div style={{ marginBottom: 6, fontSize: 11, color: C.muted, fontWeight: 600 }}>직접 업로드</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => { setImgError(''); fileRef.current?.click(); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(15,30,50,0.8)', border: `1px solid ${C.border}`,
                borderRadius: 10, padding: '9px 16px', color: C.muted,
                cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all .15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.accent; (e.currentTarget as HTMLElement).style.color = C.text; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.muted; }}
            >
              <Camera style={{ width: 14, height: 14 }} />
              이미지 파일 선택
            </button>
            {preview?.type === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: C.gain }}>커스텀 이미지 선택됨</span>
                <button
                  onClick={() => setPreview(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 2 }}
                  title="제거"
                >
                  <X style={{ width: 13, height: 13 }} />
                </button>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
          </div>
          {imgError && <div style={{ fontSize: 12, color: C.loss, marginTop: 8 }}>{imgError}</div>}
          <div style={{ fontSize: 11, color: C.subtle, marginTop: 8 }}>JPG, PNG, GIF 등 · 최대 5MB · 자동으로 200px로 리사이즈됩니다</div>

          <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
            <SaveBtn type="avatar" disabled={!preview} label="사진 저장" savedLabel="저장됨" />
          </div>
        </div>

        {/* 닉네임 변경 */}
        <div style={card}>
          <div style={secLabel}>닉네임 변경</div>
          <label style={lblSt}>닉네임</label>
          <input
            style={inpSt}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSaveName()}
            placeholder="닉네임 입력"
            maxLength={20}
          />
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: C.subtle }}>{name.length} / 20</span>
            <SaveBtn type="name" disabled={!name.trim() || name.trim() === me.name} label="저장" savedLabel="저장됨" />
          </div>
        </div>

        {/* 비밀번호 변경 */}
        <div style={card}>
          <div style={secLabel}>비밀번호 변경</div>
          <label style={lblSt}>새 비밀번호</label>
          <div style={{ position: 'relative' }}>
            <input
              style={{ ...inpSt, paddingRight: 46 }}
              type={showPw ? 'text' : 'password'}
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSavePw()}
              placeholder="새 비밀번호를 입력하세요"
            />
            <button
              onClick={() => setShowPw(v => !v)}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 0, display: 'flex' }}
            >
              {showPw ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
            </button>
          </div>
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
            <SaveBtn type="pw" disabled={!newPw.trim()} label="비밀번호 변경" savedLabel="변경됨" />
          </div>
        </div>

      </div>
    </div>
  );
}
