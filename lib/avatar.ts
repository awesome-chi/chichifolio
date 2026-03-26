export type AvatarData =
  | { type: 'preset'; id: number }
  | { type: 'custom'; data: string }; // base64 data URL

export const PRESET_AVATARS = [
  { id: 0, emoji: '🦊', color1: '#f97316', color2: '#dc2626', label: '여우' },
  { id: 1, emoji: '🐻', color1: '#d97706', color2: '#78350f', label: '곰' },
  { id: 2, emoji: '🚀', color1: '#8b5cf6', color2: '#4f46e5', label: '로켓' },
  { id: 3, emoji: '💎', color1: '#06b6d4', color2: '#0369a1', label: '다이아' },
  { id: 4, emoji: '⭐', color1: '#eab308', color2: '#d97706', label: '별' },
  { id: 5, emoji: '🌿', color1: '#10b981', color2: '#0891b2', label: '나뭇잎' },
];

const key = (userId: string) => `ccf-av-${userId}`;

export function getAvatar(userId: string): AvatarData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key(userId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveAvatar(userId: string, data: AvatarData): void {
  try {
    localStorage.setItem(key(userId), JSON.stringify(data));
    window.dispatchEvent(new StorageEvent('storage', { key: key(userId) }));
  } catch {}
}

export async function saveAvatarToCloud(userId: string, data: AvatarData): Promise<void> {
  await fetch('/api/avatar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, avatar: data }),
  });
}

export async function loadAvatarFromCloud(userId: string): Promise<AvatarData | null> {
  try {
    const res = await fetch(`/api/avatar?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data ?? null;
  } catch { return null; }
}

export async function resizeImage(file: File, maxSize = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > h) { if (w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize; } }
      else { if (h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize; } }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load failed')); };
    img.src = url;
  });
}
