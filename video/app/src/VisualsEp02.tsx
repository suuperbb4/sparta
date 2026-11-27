// EP02(코스피 반토막) 시네마틱 부품
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, clamp01, countUp, MONO, rise, useEnter} from './theme';
import {Visual} from './types';
import {HAND, HandCircle, HandNote, HandUnderline, INK} from './hand';

const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const fmtInt = (v: number) => Math.round(v).toLocaleString('en-US');
const fmtLike = (v: number, tpl: string) => {
  const dec = tpl.includes('.') ? tpl.split('.')[1].length : 0;
  const [a, b] = v.toFixed(dec).split('.');
  const withComma = tpl.includes(',') ? a.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : a;
  return b ? `${withComma}.${b}` : withComma;
};

// ── 날짜 + 큰 숫자가 찍히는 장면 ─────────────────────
export const Stamp: React.FC<Extract<Visual, {type: 'stamp'}>> = ({date, value, unit, label, tone}) => {
  const frame = useCurrentFrame();
  const dateChars = Math.floor(clamp01(frame, 0, 18) * date.length);
  const target = parseFloat(value.replace(/,/g, ''));
  const counting = clamp01(frame, 16, 56);
  const shown = isNaN(target) ? value : fmtLike(target * ease(counting), value);
  const blur = (1 - clamp01(frame, 16, 40)) * 14;
  const lp = useEnter(48);
  const color = tone === 'red' ? C.up : '#FFFFFF';
  const glow = tone === 'red' ? 'rgba(255,77,94,0.55)' : 'rgba(255,194,51,0.35)';
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
      <div style={{fontFamily: MONO, fontSize: 40, fontWeight: 700, color: C.accent, letterSpacing: 2, minHeight: 52}}>
        {date.slice(0, dateChars)}
      </div>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 18, marginTop: 20, filter: `blur(${blur}px)`, color, textShadow: `0 0 60px ${glow}`}}>
        <span style={{fontFamily: MONO, fontSize: 230, fontWeight: 800, letterSpacing: -10, lineHeight: 1}}>{shown}</span>
        {unit && <span style={{fontSize: 90, fontWeight: 900}}>{unit}</span>}
      </div>
      <div style={{position: 'relative', marginTop: 34}}>
        <div style={{...rise(lp, 16), fontSize: 46, fontWeight: 800, color: '#F2F4F8'}}>{label}</div>
        <HandUnderline w={Math.min(900, label.length * 44)} progress={clamp01(frame, 56, 74)} seed={label.length} color={tone === 'red' ? INK.red : INK.yellow} stroke={6} style={{left: 0, bottom: -16}} />
      </div>
    </AbsoluteFill>
  );
};

// ── 고점 → 폭락 차트 (확인된 종가만 연결) ─────────────────
export const Crash: React.FC<Extract<Visual, {type: 'crash'}>> = ({points, note, dropLabel, decimals = 0}) => {
  const fmtV = (v: number) => v.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const W = 1500;
  const H = 470;
  const max = Math.max(...points.map((p) => p.value)) * 1.06;
  const min = Math.min(...points.map((p) => p.value)) * 0.82;
  const x = (i: number) => (i / (points.length - 1)) * W;
  const y = (v: number) => H - ((v - min) / (max - min)) * H;
  const draw = clamp01(frame, 10, 10 + Math.min(110, durationInFrames * 0.55));
  const segs = points.length - 1;
  const headPos = draw * segs;
  const hi = Math.min(segs - 1, Math.floor(headPos));
  const ht = headPos - hi;
  const hx = x(hi) + (x(hi + 1) - x(hi)) * ht;
  const hy = y(points[hi].value) + (y(points[hi + 1].value) - y(points[hi].value)) * ht;
  const headVal = points[hi].value + (points[hi + 1].value - points[hi].value) * ht;
  const d = points.map((p, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(p.value)}`).join(' ');
  const done = draw >= 1;
  const stamp = clamp01(frame, 10 + Math.min(110, durationInFrames * 0.55) + 4, 10 + Math.min(110, durationInFrames * 0.55) + 12);
  const shake = done && stamp < 1 ? Math.sin(frame * 2.1) * 10 * (1 - stamp) : 0;
  // 카메라: 그려지는 지점을 따라 살짝 이동
  const camX = interpolate(draw, [0, 1], [60, -20]);
  const zoom = 1 + draw * 0.04;
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', transform: `translateX(${shake}px)`}}>
      <div style={{transform: `translateX(${camX}px) scale(${zoom})`}}>
        <svg width={W + 260} height={H + 140} viewBox={`-130 -60 ${W + 260} ${H + 140}`} style={{overflow: 'visible'}}>
          <defs>
            <linearGradient id="crashFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="rgba(255,77,94,0.35)" />
              <stop offset="1" stopColor="rgba(255,77,94,0)" />
            </linearGradient>
            <clipPath id="reveal">
              <rect x={-130} y={-200} width={130 + hx + 2} height={H + 400} />
            </clipPath>
          </defs>
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1={0} x2={W} y1={H * g} y2={H * g} stroke={C.border} strokeDasharray="4 10" />
          ))}
          <g clipPath="url(#reveal)">
            <path d={`${d} L ${W} ${H} L 0 ${H} Z`} fill="url(#crashFill)" />
            <path d={d} fill="none" stroke={C.up} strokeWidth={9} strokeLinejoin="round" style={{filter: 'drop-shadow(0 0 18px rgba(255,77,94,0.8))'}} />
          </g>
          {points.map((p, i) => {
            const vis = done ? 1 : clamp01(headPos, i - 0.05, i + 0.15);
            return (
              <g key={i} opacity={vis}>
                <circle cx={x(i)} cy={y(p.value)} r={i === 0 || i === points.length - 1 ? 14 : 9} fill={i === points.length - 1 ? C.up : '#fff'} />
                <text x={x(i)} y={y(p.value) - 30} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={i === 0 || i === points.length - 1 ? 52 : 34} fill="#fff">
                  {fmtV(p.value)}
                </text>
                <text x={x(i)} y={H + 56} textAnchor="middle" fontFamily={MONO} fontSize={28} fill={C.muted}>
                  {p.date}
                </text>
                {p.label && (
                  <text x={x(i)} y={H + 94} textAnchor="middle" fontSize={26} fontWeight={700} fill={C.dim}>
                    {p.label}
                  </text>
                )}
              </g>
            );
          })}
          {!done && <circle cx={hx} cy={hy} r={16} fill={C.up} style={{filter: 'drop-shadow(0 0 20px #FF4D5E)'}} />}
          {!done && (
            <text x={hx + 26} y={hy + 12} fontFamily={MONO} fontWeight={800} fontSize={40} fill={C.up}>
              {fmtV(headVal)}
            </text>
          )}
        </svg>
      </div>
      <div style={{position: 'absolute', right: 230, top: 250, opacity: stamp, transform: `rotate(-7deg) scale(${1.3 - stamp * 0.3})`}}>
        <div style={{fontFamily: HAND, fontSize: 170, color: INK.red, lineHeight: 1, textShadow: '0 4px 16px rgba(0,0,0,0.8)'}}>{dropLabel}</div>
        <HandUnderline w={260} progress={clamp01(frame, 10 + Math.min(110, durationInFrames * 0.55) + 10, 10 + Math.min(110, durationInFrames * 0.55) + 22)} seed={7} color={INK.red} stroke={8} style={{left: 10, bottom: -6}} />
      </div>
      <div style={{position: 'absolute', right: 60, top: 140, fontSize: 22, color: C.dim, fontWeight: 600}}>※ {note}</div>
    </AbsoluteFill>
  );
};

// ── 연도 플래시: 1929 뉴욕 / 1990 서울 / 2015 상하이 ─────────
export const YearFlash: React.FC<Extract<Visual, {type: 'yearFlash'}>> = ({items, startSec = 1, slotSec}) => {
  const frame = useCurrentFrame();
  const {durationInFrames, fps} = useVideoConfig();
  const lead = Math.round(startSec * fps);
  const slot = slotSec ? slotSec * fps : Math.max(20, (durationInFrames - lead - 20) / items.length);
  const idx = Math.max(0, Math.min(items.length - 1, Math.floor((frame - lead) / slot)));
  const local = frame - lead - idx * slot;
  const p = clamp01(local, 0, 6);
  const flash = frame >= lead ? 1 - clamp01(local, 0, 5) : 0;
  const it = items[idx];
  const zoom = 1.08 - clamp01(local, 0, slot) * 0.08;
  if (frame < lead) return null;
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
      <div style={{transform: `scale(${zoom})`, opacity: p, textAlign: 'center'}}>
        <div style={{fontFamily: MONO, fontSize: 250, fontWeight: 800, letterSpacing: -8, lineHeight: 1, color: '#fff', textShadow: '0 0 50px rgba(255,194,51,0.35)'}}>{it.year}</div>
        <div style={{fontSize: 64, fontWeight: 900, color: C.accent, marginTop: 10}}>{it.city}</div>
        <div style={{fontSize: 36, fontWeight: 700, color: C.muted, marginTop: 18}}>{it.line}</div>
      </div>
      <div style={{position: 'absolute', bottom: 160, display: 'flex', gap: 14}}>
        {items.map((_, i) => (
          <span key={i} style={{width: i === idx ? 60 : 18, height: 6, borderRadius: 3, background: i === idx ? C.accent : C.border}} />
        ))}
      </div>
      <AbsoluteFill style={{background: '#fff', opacity: flash * 0.6}} />
    </AbsoluteFill>
  );
};

// ── 제목 카드 ────────────────────────────────────
export const TitleCard: React.FC<Extract<Visual, {type: 'titleCard'}>> = ({kicker, title, sub}) => {
  const frame = useCurrentFrame();
  const a = useEnter(0);
  const b = useEnter(10);
  const c = useEnter(26);
  const line = clamp01(frame, 6, 30);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center'}}>
      <div style={{...rise(a, 20), fontFamily: MONO, fontSize: 32, fontWeight: 800, color: C.accent, letterSpacing: 8}}>{kicker}</div>
      <div style={{width: 700 * line, height: 3, background: C.up, margin: '26px 0'}} />
      <div style={{...rise(b, 30), fontSize: 120, fontWeight: 900, letterSpacing: -5, lineHeight: 1.1, textShadow: '0 8px 40px rgba(0,0,0,0.6)'}}>{title}</div>
      {sub && <div style={{...rise(c, 20), fontSize: 40, fontWeight: 700, color: C.muted, marginTop: 30}}>{sub}</div>}
    </AbsoluteFill>
  );
};

// ── 악순환 고리 (반대매매) ─────────────────────────────
export const Cycle: React.FC<Extract<Visual, {type: 'cycle'}>> = ({nodes, center}) => {
  const frame = useCurrentFrame();
  const R = 330;
  const cx = 960;
  const cy = 510;
  const n = nodes.length;
  const spin = clamp01(frame, 20 + n * 14, 20 + n * 14 + 60) * 360 + Math.max(0, frame - (80 + n * 14)) * 1.2;
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <defs>
          <marker id="arr" markerWidth="12" markerHeight="12" refX="6" refY="6" orient="auto">
            <path d="M0 0 L12 6 L0 12 Z" fill={C.up} />
          </marker>
        </defs>
        {nodes.map((_, i) => {
          const a0 = (-90 + (360 / n) * i + 22) * (Math.PI / 180);
          const a1 = (-90 + (360 / n) * (i + 1) - 22) * (Math.PI / 180);
          const p = clamp01(frame, 14 + i * 14 + 8, 14 + i * 14 + 20);
          const x0 = cx + R * Math.cos(a0);
          const y0 = cy + R * Math.sin(a0);
          const x1 = cx + R * Math.cos(a1);
          const y1 = cy + R * Math.sin(a1);
          return <path key={i} d={`M ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1}`} fill="none" stroke={C.up} strokeWidth={7} markerEnd="url(#arr)" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p} />;
        })}
        <circle cx={cx + R * Math.cos(((spin - 90) * Math.PI) / 180)} cy={cy + R * Math.sin(((spin - 90) * Math.PI) / 180)} r={12} fill={C.accent} opacity={clamp01(frame, 20 + n * 14, 30 + n * 14)} />
      </svg>
      {nodes.map((t, i) => {
        const a = (-90 + (360 / n) * i) * (Math.PI / 180);
        const p = clamp01(frame, 14 + i * 14, 24 + i * 14);
        return (
          <div
            key={t}
            style={{
              position: 'absolute',
              left: cx + R * Math.cos(a),
              top: cy + R * Math.sin(a),
              transform: `translate(-50%,-50%) scale(${0.8 + p * 0.2})`,
              opacity: p,
              background: 'rgba(12,18,34,0.82)',
              border: `2px solid ${i === n - 1 ? C.up : 'rgba(255,255,255,0.12)'}`,
              borderRadius: 16,
              padding: '18px 30px',
              fontSize: 40,
              fontWeight: 800,
              whiteSpace: 'nowrap',
              boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
            }}
          >
            {t}
          </div>
        );
      })}
      <div style={{position: 'absolute', left: cx, top: cy, transform: 'translate(-50%,-50%) rotate(-5deg)', textAlign: 'center', fontFamily: HAND, fontSize: 130, color: C.up, opacity: clamp01(frame, 20 + n * 14, 34 + n * 14)}}>{center}</div>
    </AbsoluteFill>
  );
};

// ── 레버리지 계산 예시 ─────────────────────────────
export const Leverage: React.FC<Extract<Visual, {type: 'leverage'}>> = ({own, borrowed, drop, threshold, note}) => {
  const frame = useCurrentFrame();
  const total = own + borrowed;
  const d = drop * ease(clamp01(frame, 40, 130));
  const value = total * (1 - d);
  const equity = value - borrowed;
  const ratio = value / borrowed;
  const hit = ratio <= threshold + 1e-9 && d > 0;
  const BW = 1100;
  const scale = BW / total;
  const intro = useEnter(0);
  const stamp = hit ? clamp01(frame, 128, 136) : 0;
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
      <div style={{...rise(intro), display: 'flex', gap: 40, fontSize: 36, fontWeight: 800, marginBottom: 30}}>
        <span>내 돈 <span style={{fontFamily: MONO, color: C.accent}}>{fmtInt(own)}만</span></span>
        <span style={{color: C.dim}}>+</span>
        <span>빌린 돈 <span style={{fontFamily: MONO, color: C.muted}}>{fmtInt(borrowed)}만</span></span>
        <span style={{color: C.dim}}>=</span>
        <span>주식 <span style={{fontFamily: MONO}}>{fmtInt(total)}만</span></span>
      </div>
      <div style={{width: BW, height: 120, background: C.panel2, borderRadius: 10, position: 'relative', overflow: 'hidden', border: `1px solid ${C.border}`}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: borrowed * scale, background: '#2A3A5E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, color: C.muted}}>빌린 돈 {fmtInt(borrowed)}만</div>
        <div style={{position: 'absolute', left: borrowed * scale, top: 0, bottom: 0, width: Math.max(0, equity) * scale, background: C.up, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden'}}>내 돈 {fmtInt(equity)}만</div>
      </div>
      <div style={{display: 'flex', gap: 80, marginTop: 44, alignItems: 'flex-end'}}>
        <Metric label="주가 변화" value={`-${Math.round(d * 100)}%`} color={C.down} />
        <Metric label="담보비율 (주식 ÷ 빌린 돈)" value={`${Math.round(ratio * 100)}%`} color={hit ? C.up : '#fff'} sub={`기준 ${Math.round(threshold * 100)}%`} />
        <Metric label="내 돈 변화" value={`${equity >= own ? '' : '-'}${Math.round(((own - equity) / own) * 100)}%`} color={C.up} circle={hit ? clamp01(frame, 134, 152) : 0} />
      </div>
      <HandNote progress={stamp} size={120} color={INK.red} rotate={-6} style={{top: 210, right: 250}}>
        반대매매!
      </HandNote>
      <div style={{position: 'absolute', top: 120, fontSize: 26, color: C.muted, fontWeight: 700, background: 'rgba(15,23,41,0.85)', padding: '8px 18px', borderRadius: 6}}>※ {note}</div>
    </AbsoluteFill>
  );
};

const Metric: React.FC<{label: string; value: string; color: string; sub?: string; circle?: number}> = ({label, value, color, sub, circle}) => (
  <div style={{textAlign: 'center', minWidth: 300, position: 'relative'}}>
    {circle !== undefined && <HandCircle w={300} h={150} progress={circle} seed={11} color={INK.yellow} stroke={6} style={{left: 0, top: 18}} />}
    <div style={{fontSize: 26, fontWeight: 700, color: C.muted}}>{label}</div>
    <div style={{fontFamily: MONO, fontSize: 96, fontWeight: 800, color, lineHeight: 1.1}}>{value}</div>
    {sub && <div style={{fontSize: 24, color: C.dim, fontWeight: 700}}>{sub}</div>}
  </div>
);

// ── 가로 막대 (회복까지 걸린 시간 등) ───────────────────────
export const HBars: React.FC<Extract<Visual, {type: 'hbars'}>> = ({title, rows, note}) => {
  const frame = useCurrentFrame();
  const max = Math.max(...rows.map((r) => r.value));
  const tp = useEnter(0);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
      <div style={{...rise(tp), fontSize: 50, fontWeight: 900, marginBottom: 50}}>{title}</div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 40}}>
        {rows.map((r, i) => {
          const g = ease(clamp01(frame, 14 + i * 16, 54 + i * 16));
          return (
            <div key={r.label} style={{display: 'flex', alignItems: 'center', gap: 30}}>
              <div style={{width: 330, textAlign: 'right'}}>
                <div style={{fontSize: 40, fontWeight: 900}}>{r.label}</div>
                {r.sub && <div style={{fontSize: 24, color: C.dim, fontWeight: 600}}>{r.sub}</div>}
              </div>
              <div style={{width: 1000 * (r.value / max) * g, height: 70, background: `linear-gradient(90deg, rgba(255,77,94,0.5), ${C.up})`, borderRadius: 6}} />
              <div style={{fontFamily: MONO, fontSize: 56, fontWeight: 800, opacity: g}}>{r.display}</div>
            </div>
          );
        })}
      </div>
      {note && <div style={{marginTop: 50, fontSize: 26, color: C.dim, fontWeight: 600}}>※ {note}</div>}
    </AbsoluteFill>
  );
};

export {countUp};
