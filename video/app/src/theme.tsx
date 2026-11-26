import React from 'react';
import {AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

// ── 디자인 토큰 ─────────────────────────────
export const C = {
  paper: '#EEECE7',
  paperDark: '#E3E0D9',
  ink: '#16161A',
  inkSoft: '#55555C',
  line: '#C9C5BC',
  red: '#D92B2B',
  redSoft: '#F6D9D6',
  highlight: '#FFE36E',
  night: '#111216',
};

export const FONT = 'Pretendard';

const weights: [string, number][] = [
  ['Regular', 400],
  ['Medium', 500],
  ['SemiBold', 600],
  ['Bold', 700],
  ['ExtraBold', 800],
  ['Black', 900],
];

export const FontFaces: React.FC = () => (
  <style>
    {weights
      .map(
        ([n, w]) =>
          `@font-face{font-family:'${FONT}';src:url('${staticFile(`fonts/Pretendard-${n}.woff2`)}') format('woff2');font-weight:${w};font-display:block;}`,
      )
      .join('\n')}
  </style>
);

// ── 애니메이션 헬퍼 ─────────────────────────
export const useEnter = (delay = 0, damping = 18) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - delay, fps, config: {damping, mass: 0.7}});
};

export const rise = (p: number, dist = 40): React.CSSProperties => ({
  opacity: p,
  transform: `translateY(${(1 - p) * dist}px)`,
});

export const countUp = (frame: number, start: number, dur: number, target: number) => {
  const t = interpolate(frame, [start, start + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const eased = 1 - Math.pow(1 - t, 3);
  return target * eased;
};

// ── 배경: 종이 질감 ─────────────────────────
export const Paper: React.FC<{dark?: boolean; children?: React.ReactNode}> = ({dark, children}) => {
  const frame = useCurrentFrame();
  // 아주 느린 카메라 드리프트로 화면이 '살아있게'
  const drift = Math.sin(frame / 90) * 6;
  return (
    <AbsoluteFill style={{background: dark ? C.night : C.paper, fontFamily: FONT, color: dark ? '#F2F2F2' : C.ink}}>
      <AbsoluteFill
        style={{
          backgroundImage: dark
            ? 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.06), transparent 65%)'
            : 'radial-gradient(ellipse at 50% 35%, rgba(255,255,255,0.75), transparent 60%), radial-gradient(ellipse at 50% 110%, rgba(0,0,0,0.08), transparent 60%)',
        }}
      />
      <svg width="100%" height="100%" style={{position: 'absolute', opacity: dark ? 0.12 : 0.22, mixBlendMode: 'multiply'}}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      <AbsoluteFill style={{transform: `translateY(${drift}px)`}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── 출처 라벨 (왼쪽 위) ─────────────────────
export const SourceLabel: React.FC<{text?: string; dark?: boolean}> = ({text, dark}) => {
  const p = useEnter(6);
  if (!text) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 72,
        top: 56,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontSize: 24,
        fontWeight: 500,
        color: dark ? '#9A9AA2' : C.inkSoft,
        opacity: p,
      }}
    >
      <span style={{width: 10, height: 10, borderRadius: 5, background: C.red}} />
      출처 · {text}
    </div>
  );
};

// ── 자막 ───────────────────────────────────
export const Subtitle: React.FC<{text: string}> = ({text}) => {
  if (!text) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 64, display: 'flex', justifyContent: 'center'}}>
      <div
        style={{
          background: 'rgba(22,22,26,0.88)',
          color: '#FFFFFF',
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 46,
          lineHeight: 1.35,
          padding: '14px 30px',
          borderRadius: 10,
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

// ── 형광펜 텍스트 ───────────────────────────
export const Highlighted: React.FC<{text: string; mark?: string; progress: number}> = ({text, mark, progress}) => {
  if (!mark || !text.includes(mark)) return <>{text}</>;
  const i = text.indexOf(mark);
  return (
    <>
      {text.slice(0, i)}
      <span
        style={{
          backgroundImage: `linear-gradient(${C.highlight}, ${C.highlight})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: `${progress * 100}% 100%`,
          padding: '0 4px',
        }}
      >
        {mark}
      </span>
      {text.slice(i + mark.length)}
    </>
  );
};
