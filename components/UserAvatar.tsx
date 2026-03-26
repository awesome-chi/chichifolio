'use client';

import { useState, useEffect } from 'react';
import { getAvatar, PRESET_AVATARS, type AvatarData } from '@/lib/avatar';

interface Props {
  userId?: string;
  name: string;
  color: string;
  size?: number;
  /** 서버에서 로드된 아바타 (크로스 디바이스 동기화용) */
  serverAvatar?: AvatarData | null;
  /** 미리보기용 외부 주입 avatar (profile 페이지에서 사용) */
  previewAvatar?: AvatarData | null;
  className?: string;
}

export default function UserAvatar({ userId, name, color, size = 36, serverAvatar, previewAvatar, className }: Props) {
  const [localAvatar, setLocalAvatar] = useState<AvatarData | null>(null);

  useEffect(() => {
    if (userId) setLocalAvatar(getAvatar(userId));
  }, [userId]);

  // storage 이벤트로 다른 컴포넌트의 저장 반영
  useEffect(() => {
    if (!userId) return;
    const handler = () => setLocalAvatar(getAvatar(userId));
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [userId]);

  // 우선순위: previewAvatar > serverAvatar > localAvatar
  const display = previewAvatar !== undefined ? previewAvatar : (serverAvatar !== undefined ? serverAvatar : localAvatar);
  const preset = display?.type === 'preset' ? PRESET_AVATARS.find(p => p.id === (display as any).id) : null;
  const fontSize = Math.round(size * 0.46);

  if (display?.type === 'custom') {
    return (
      <div className={className} style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#0a1829' }}>
        <img src={display.data} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }

  if (preset) {
    return (
      <div className={className} style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: `linear-gradient(135deg, ${preset.color1}, ${preset.color2})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize, userSelect: 'none',
      }}>
        {preset.emoji}
      </div>
    );
  }

  // 기본: 이니셜
  return (
    <div className={className} style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.42), fontWeight: 800, color: '#fff',
      userSelect: 'none',
    }}>
      {(name || '?')[0]}
    </div>
  );
}
