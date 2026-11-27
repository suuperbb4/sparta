// 손으로 그린 느낌의 요소들: 형광펜, 동그라미, 밑줄, 체크, 화살표, 손글씨 메모
// 모양은 seed 로 조금씩 흔들려서 매번 똑같아 보이지 않게 합니다.
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp01} from './theme';

export const HAND = "'NanumPen', 'Pretendard', sans-serif";
export const SERIF = "'NotoSerifKR', 'Pretendard', serif";
export const INK = {red: '#FF3B4E', yellow: '#FFD23F', white: '#F4F1EA', marker: 'rgba(255, 214, 64, 0.78)'};

// 결정적 난수 (같은 seed → 같은 모양)
const rand = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};
const j = (seed: number, amt: number) => (rand(seed) - 0.5) * 2 * amt;

// ── 형광펜: 글자 뒤에 손으로 그은 듯한 자국 ─────────────────
export const Marker: React.FC<{children: React.ReactNode; progress: number; seed?: number; color?: string}> = ({children, progress, seed = 1, color = INK.marker}) => {
  const y1 = 55 + j(seed, 6);
  const y2 = 52 + j(seed + 1, 6);
  const d = `M2 ${y1} C 25 ${y1 + j(seed + 2, 8)}, 60 ${y2 + j(seed + 3, 8)}, 98 ${y2}`;
  return (
    <span style={{position: 'relative', display: 'inline-block', whiteSpace: 'nowrap'}}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{position: 'absolute', left: 0, top: '-5%', width: '100%', height: '110%', zIndex: 0, overflow: 'hidden'}}>
        <path d={d} stroke={color} strokeWidth={62} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - progress} style={{mixBlendMode: 'multiply'}} />
      </svg>
      <span style={{position: 'relative', zIndex: 1}}>{children}</span>
    </span>
  );
};

// ── 손으로 그린 동그라미 (살짝 겹쳐서 두 바퀴 가까이) ───────────
export const HandCircle: React.FC<{w: number; h: number; progress: number; seed?: number; color?: string; stroke?: number; style?: React.CSSProperties}> = ({w, h, progress, seed = 3, color = INK.red, stroke = 7, style}) => {
  const pts: string[] = [];
  const turns = 1.18;
  const n = 48;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2 * turns - Math.PI * 0.6;
    const r = 1 + j(seed + i * 0.37, 0.05) + (i / n) * 0.06;
    pts.push(`${(w / 2 + Math.cos(t) * (w / 2) * r).toFixed(1)},${(h / 2 + Math.sin(t) * (h / 2) * r).toFixed(1)}`);
  }
  return (
    <svg width={w} height={h} style={{position: 'absolute', overflow: 'visible', pointerEvents: 'none', transform: `rotate(${j(seed, 6)}deg)`, ...style}}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - progress} />
    </svg>
  );
};

// ── 손으로 그은 밑줄 ─────────────────────────────────────
export const HandUnderline: React.FC<{w: number; progress: number; seed?: number; color?: string; stroke?: number; style?: React.CSSProperties}> = ({w, progress, seed = 5, color = INK.red, stroke = 6, style}) => {
  const d = `M0 ${8 + j(seed, 3)} Q ${w * 0.5} ${2 + j(seed + 1, 4)} ${w} ${9 + j(seed + 2, 3)}`;
  return (
    <svg width={w} height={18} style={{position: 'absolute', overflow: 'visible', ...style}}>
      <path d={d} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - progress} />
    </svg>
  );
};

// ── 손으로 그린 체크 표시 ───────────────────────────────────
export const HandCheck: React.FC<{size?: number; progress: number; seed?: number; color?: string}> = ({size = 44, progress, seed = 7, color = INK.yellow}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{overflow: 'visible', flexShrink: 0}}>
    <path d={`M4 ${21 + j(seed, 2)} L ${15 + j(seed + 1, 2)} 32 L 37 ${6 + j(seed + 2, 3)}`} fill="none" stroke={color} strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - progress} />
  </svg>
);

// ── 손으로 그린 화살표 (곡선) ───────────────────────────────
export const HandArrow: React.FC<{from: [number, number]; to: [number, number]; progress: number; seed?: number; color?: string; bend?: number}> = ({from, to, progress, seed = 9, color = INK.red, bend = 0.25}) => {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const mx = (x1 + x2) / 2 - (y2 - y1) * bend + j(seed, 10);
  const my = (y1 + y2) / 2 + (x2 - x1) * bend + j(seed + 1, 10);
  const ang = Math.atan2(y2 - my, x2 - mx);
  const head = 22;
  const h1 = [x2 - head * Math.cos(ang - 0.5), y2 - head * Math.sin(ang - 0.5)];
  const h2 = [x2 - head * Math.cos(ang + 0.5), y2 - head * Math.sin(ang + 0.5)];
  const headP = clamp01(progress, 0.85, 1);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      <path d={`M${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - Math.min(1, progress / 0.85)} />
      <path d={`M${h1[0]} ${h1[1]} L ${x2} ${y2} L ${h2[0]} ${h2[1]}`} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={headP} />
    </svg>
  );
};

// ── 손글씨 메모 ───────────────────────────────────────
export const HandNote: React.FC<{children: React.ReactNode; progress: number; size?: number; color?: string; rotate?: number; style?: React.CSSProperties}> = ({children, progress, size = 64, color = INK.yellow, rotate = -4, style}) => (
  <div
    style={{
      position: 'absolute',
      fontFamily: HAND,
      fontSize: size,
      color,
      transform: `rotate(${rotate}deg) translateY(${(1 - progress) * 10}px)`,
      opacity: progress,
      whiteSpace: 'nowrap',
      textShadow: '0 3px 10px rgba(0,0,0,0.8)',
      lineHeight: 1,
      ...style,
    }}
  >
    {children}
  </div>
);

// 프레임 기반 진행도 헬퍼
export const useDraw = (start: number, dur: number) => {
  const frame = useCurrentFrame();
  return clamp01(frame, start, start + dur);
};
