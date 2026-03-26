'use client';

import { useState } from 'react';

/** 티커 → 로고 URL 목록 (순서대로 시도) */
export function getLogoUrls(ticker: string): string[] {
  const isKR = /\.(KS|KQ)$/.test(ticker);
  const base = ticker.replace(/\.(KS|KQ)$/, '');
  if (isKR) {
    return [
      `https://file.alphasquare.co.kr/media/images/stock_logo/${base}.png`,
      `https://thumb.tossinvest.com/image/resized/96x0/https%3A%2F%2Fstatic.toss.im%2Fpng-icons%2Fsecurities%2Ficn-sec-fill-${base}.png`,
    ];
  }
  return [
    `https://financialmodelingprep.com/image-stock/${base}.png`,
    `https://assets.parqet.com/logos/symbol/${encodeURIComponent(base)}?format=svg`,
  ];
}

// 문자열 → 양의 정수 해시
function strHash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33 ^ s.charCodeAt(i)) >>> 0;
  return h;
}

// 그라디언트 쌍 (시작색, 끝색)
const GRAD_PAIRS: [string, string][] = [
  ['#06b6d4', '#0369a1'], // cyan → blue
  ['#3b82f6', '#4f46e5'], // blue → indigo
  ['#f59e0b', '#ea580c'], // amber → orange
  ['#a855f7', '#db2777'], // purple → pink
  ['#10b981', '#0891b2'], // green → cyan
  ['#f43f5e', '#9f1239'], // rose → crimson
  ['#8b5cf6', '#6366f1'], // violet → indigo
  ['#14b8a6', '#0ea5e9'], // teal → sky
  ['#ef4444', '#b45309'], // red → amber
  ['#22c55e', '#0d9488'], // green → teal
];

/** 로고 이미지 없을 때 사용하는 SVG 생성 로고 */
function GeneratedLogo({ ticker, name, size }: { ticker: string; name?: string; size: number }) {
  const isKR = /\.(KS|KQ)$/.test(ticker);
  const base = ticker.replace(/\.(KS|KQ)$/, '');
  const h = strHash(base);
  const [c1, c2] = GRAD_PAIRS[h % GRAD_PAIRS.length];

  // 이니셜
  const raw = isKR
    ? (name ?? base).replace(/\s?(주식회사|홀딩스|그룹|코리아|인터내셔널|게임즈|테크놀로지)$/g, '').trim()
    : base.replace(/[^A-Za-z]/g, '');
  const initials = (raw.slice(0, 2) || base.slice(0, 2)).toUpperCase();

  // 각 종목 고유 SVG ID (충돌 방지)
  const gradId = `ccf-g-${base.replace(/[^a-z0-9]/gi, '').toLowerCase()}-${h % 9999}`;

  // 폰트 크기 결정
  const fontSize = initials.length === 1
    ? Math.round(size * 0.46)
    : Math.round(size * 0.36);

  // 장식용 호 (gradient에 따라 다른 각도)
  const arcAngle = (h % 4) * 45; // 0, 45, 90, 135도 중 하나
  const r2 = 50;
  const rad = (arcAngle * Math.PI) / 180;
  const ax = 50 + r2 * Math.cos(rad);
  const ay = 50 + r2 * Math.sin(rad);
  const bx = 50 + r2 * Math.cos(rad + Math.PI * 0.75);
  const by = 50 + r2 * Math.sin(rad + Math.PI * 0.75);

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      style={{ borderRadius: '50%', flexShrink: 0, display: 'block' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>

      {/* 배경 원 */}
      <circle cx="50" cy="50" r="50" fill={`url(#${gradId})`} />

      {/* 밝은 타원형 하이라이트 (광택 효과) */}
      <ellipse cx="50" cy="28" rx="28" ry="16" fill="white" fillOpacity="0.12" />

      {/* 장식 호선 */}
      <path
        d={`M ${ax.toFixed(1)} ${ay.toFixed(1)} A ${r2} ${r2} 0 0 1 ${bx.toFixed(1)} ${by.toFixed(1)}`}
        fill="none"
        stroke="white"
        strokeOpacity="0.15"
        strokeWidth="10"
        strokeLinecap="round"
      />

      {/* 이니셜 텍스트 */}
      <text
        x="50"
        y="50"
        dominantBaseline="central"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif"
        fontWeight="800"
        fontSize={fontSize}
        fill="white"
        letterSpacing={initials.length === 2 ? '-1.5' : '0'}
        style={{ userSelect: 'none' }}
      >
        {initials}
      </text>

      {/* 우하단 작은 'C' 치치폴리오 워터마크 */}
      <text
        x="76"
        y="82"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
        fontWeight="900"
        fontSize="14"
        fill="white"
        fillOpacity="0.35"
        style={{ userSelect: 'none' }}
      >
        c
      </text>
    </svg>
  );
}

interface StockLogoProps {
  ticker: string;
  name?: string;
  size?: number;
  colorIndex?: number;
  className?: string;
}

export default function StockLogo({ ticker, name, size = 44, colorIndex = 0, className }: StockLogoProps) {
  const isKR = /\.(KS|KQ)$/.test(ticker);
  const urls = getLogoUrls(ticker);
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  const onErr = () => {
    if (idx + 1 < urls.length) setIdx(i => i + 1);
    else setFailed(true);
  };

  if (failed) {
    return (
      <div className={className} style={{ width: size, height: size, flexShrink: 0, borderRadius: '50%', overflow: 'hidden' }}>
        <GeneratedLogo ticker={ticker} name={name} size={size} />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#ffffff',
        border: '1.5px solid rgba(226,232,240,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <img
        src={urls[idx]}
        alt={ticker}
        width={size}
        height={size}
        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: isKR ? 4 : 3 }}
        onError={onErr}
      />
    </div>
  );
}
