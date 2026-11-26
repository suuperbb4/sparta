import React from 'react';
import {AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// ── 디자인 토큰: "트레이딩 터미널" ─────────────────
// 한국 시장 관례: 상승 = 빨강, 하락 = 파랑
export const C = {
  bg: '#0A0F1C',
  panel: '#0F1729',
  panel2: '#131D33',
  border: '#22314F',
  grid: 'rgba(80,120,200,0.08)',
  text: '#E6EDF7',
  muted: '#8FA3C4',
  dim: '#5E7196',
  up: '#FF4D5E',
  down: '#3D8BFF',
  accent: '#FFC233',
  green: '#2BD69B',
};

export const SANS = "'Pretendard', sans-serif";
export const MONO = "'JBM', 'Pretendard', monospace"; // 숫자·영문은 JetBrains Mono, 한글은 Pretendard

const faces: [string, string, number][] = [
  ['Pretendard', 'Pretendard-Regular.woff2', 400],
  ['Pretendard', 'Pretendard-Medium.woff2', 500],
  ['Pretendard', 'Pretendard-SemiBold.woff2', 600],
  ['Pretendard', 'Pretendard-Bold.woff2', 700],
  ['Pretendard', 'Pretendard-ExtraBold.woff2', 800],
  ['Pretendard', 'Pretendard-Black.woff2', 900],
  ['JBM', 'jetbrains-mono-latin-500-normal.woff2', 500],
  ['JBM', 'jetbrains-mono-latin-800-normal.woff2', 800],
];

export const FontFaces: React.FC = () => (
  <style>
    {faces
      .map(([fam, file, w]) => `@font-face{font-family:'${fam}';src:url('${staticFile(`fonts/${file}`)}') format('woff2');font-weight:${w};font-display:block;}`)
      .join('\n')}
  </style>
);

// ── 애니메이션 헬퍼 ─────────────────────────
export const useEnter = (delay = 0, damping = 20) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - delay, fps, config: {damping, mass: 0.6}});
};

export const rise = (p: number, dist = 30): React.CSSProperties => ({
  opacity: p,
  transform: `translateY(${(1 - p) * dist}px)`,
});

export const clamp01 = (frame: number, a: number, b: number) =>
  interpolate(frame, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export const countUp = (frame: number, start: number, dur: number, target: number) => {
  const t = clamp01(frame, start, start + dur);
  return target * (1 - Math.pow(1 - t, 3));
};

// ── 배경: 남색 + 격자 + 스캔 라인 ─────────────────
export const Screen: React.FC<{children?: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  const scan = (frame * 4) % 1300;
  return (
    <AbsoluteFill style={{background: C.bg, fontFamily: SANS, color: C.text}}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${C.grid} 1px, transparent 1px), linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          backgroundPosition: `${-frame * 0.3}px 0`,
        }}
      />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(61,139,255,0.10), transparent 65%)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: scan - 200, height: 200, background: 'linear-gradient(transparent, rgba(61,139,255,0.035), transparent)'}} />
      {children}
    </AbsoluteFill>
  );
};

// ── 패널 ───────────────────────────────────
export const Panel: React.FC<{label?: string; children: React.ReactNode; style?: React.CSSProperties; right?: React.ReactNode}> = ({label, children, style, right}) => (
  <div style={{background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6, position: 'relative', ...style}}>
    {label && (
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: MONO, fontSize: 24, color: C.muted, padding: '22px 34px 0', letterSpacing: 1}}>
        <span>{label}</span>
        {right}
      </div>
    )}
    {children}
  </div>
);

// ── 자막 ───────────────────────────────────
export const Subtitle: React.FC<{text: string}> = ({text}) => {
  if (!text) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 100, display: 'flex', justifyContent: 'center'}}>
      <div
        style={{
          background: 'rgba(10,15,28,0.92)',
          border: `1px solid ${C.border}`,
          borderLeft: `6px solid ${C.accent}`,
          color: '#FFFFFF',
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 46,
          lineHeight: 1.35,
          padding: '14px 32px',
          borderRadius: 4,
          maxWidth: 1600,
          textAlign: 'center',
          letterSpacing: -0.5,
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ── 형광펜 텍스트 (노란 블록) ───────────────────
export const Highlighted: React.FC<{text: string; mark?: string; progress: number}> = ({text, mark, progress}) => {
  if (!mark || !text.includes(mark)) return <>{text}</>;
  const i = text.indexOf(mark);
  return (
    <>
      {text.slice(0, i)}
      <span
        style={{
          backgroundImage: `linear-gradient(${C.accent}, ${C.accent})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: `${progress * 100}% 100%`,
          color: progress > 0.6 ? C.bg : 'inherit',
          padding: '0 6px',
        }}
      >
        {mark}
      </span>
      {text.slice(i + mark.length)}
    </>
  );
};
