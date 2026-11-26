import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, clamp01, countUp, Highlighted, MONO, Panel, rise, useEnter} from './theme';
import {Headline, Visual} from './types';
import {useEpisode} from './Main';
import {Crash, Cycle, HBars, Leverage, Stamp, TitleCard, YearFlash} from './VisualsEp02';

const center: React.CSSProperties = {display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'};

const fmt = (v: number, template: string) => {
  const decimals = template.includes('.') ? template.split('.')[1].length : 0;
  const s = v.toFixed(decimals);
  if (!template.includes(',')) return s;
  const [a, b] = s.split('.');
  return a.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (b ? '.' + b : '');
};

const Cursor: React.FC<{color?: string}> = ({color = C.accent}) => {
  const frame = useCurrentFrame();
  return <span style={{color, opacity: Math.floor(frame / 15) % 2 === 0 ? 1 : 0}}>_</span>;
};

// ── 오프닝 훅: 터미널에 한 줄씩 찍히는 지표 ───────────
const Hook: React.FC<{lines: string[]}> = ({lines}) => {
  return (
    <AbsoluteFill style={{...center, alignItems: 'flex-start', paddingLeft: 180, gap: 34}}>
      {lines.map((l, i) => {
        const p = useEnter(i * 16);
        return (
          <div key={l} style={{...rise(p, 0), transform: `translateX(${(1 - p) * -40}px)`, display: 'flex', alignItems: 'baseline', gap: 30}}>
            <span style={{fontFamily: MONO, fontSize: 40, color: C.accent, fontWeight: 800}}>&gt;</span>
            <span style={{fontSize: 124, fontWeight: 900, letterSpacing: -4}}>{l}</span>
            <span style={{fontFamily: MONO, fontSize: 44, color: C.up, fontWeight: 800}}>▲</span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};


// ── 기사 헤드라인 몽타주 ───────────────────────
const layouts = [
  {x: -330, y: -250, r: -3},
  {x: 330, y: -120, r: 2.5},
  {x: -300, y: 20, r: 1.5},
  {x: 320, y: 150, r: -2},
  {x: 0, y: -40, r: -1},
];

const HeadlineCard: React.FC<{h: Headline; delay: number; pos: {x: number; y: number; r: number}; dim: number; solo: boolean}> = ({h, delay, pos, dim, solo}) => {
  const frame = useCurrentFrame();
  const t = frame - delay;
  if (t < 0) return null;
  const p = clamp01(t, 0, 7);
  const flash = 1 - clamp01(t, 0, 5);
  const scale = (solo ? 1.15 : 1) * (1.25 - 0.25 * p);
  const drift = solo ? clamp01(frame, 0, 200) * 0.06 : 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: solo ? 1400 : 1040,
        transform: `translate(-50%,-50%) translate(${pos.x}px, ${pos.y}px) rotate(${pos.r}deg) scale(${scale + drift})`,
        opacity: p,
        filter: `brightness(${1 - dim * 0.55})`,
        background: '#F5F7FB',
        color: '#0A0F1C',
        borderRadius: 6,
        boxShadow: '0 30px 70px rgba(0,0,0,0.55)',
        overflow: 'hidden',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 16, padding: '14px 26px', background: '#E3E8F2', fontSize: 24, fontWeight: 700, color: '#3A4760'}}>
        {h.tag && <span style={{background: h.tag === '속보' ? C.up : '#0A0F1C', color: '#fff', padding: '2px 12px', borderRadius: 3}}>{h.tag}</span>}
        <span>{h.outlet}</span>
        <span style={{marginLeft: 'auto', fontFamily: MONO, fontWeight: 500}}>{h.date}</span>
      </div>
      <div style={{padding: solo ? '40px 50px 48px' : '26px 34px 32px', fontSize: solo ? 64 : 46, fontWeight: 800, lineHeight: 1.3, letterSpacing: -1}}>{h.title}</div>
      <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: flash * 0.8}} />
    </div>
  );
};

const Headlines: React.FC<Extract<Visual, {type: 'headlines'}>> = ({items, stamp}) => {
  const frame = useCurrentFrame();
  const solo = items.length === 1;
  const gap = 46; // 카드 간격(프레임) ≈ 1.5초, 내레이션 속도에 맞춤
  const shown = Math.min(items.length, Math.floor(frame / gap) + 1);
  const stampP = clamp01(frame, 18, 24);
  const shake = frame < 30 && solo ? Math.sin(frame * 2.3) * (1 - frame / 30) * 8 : 0;
  return (
    <AbsoluteFill style={{transform: `translateX(${shake}px)`}}>
      {items.map((h, i) => (
        <HeadlineCard key={i} h={h} delay={i * gap} pos={solo ? {x: 0, y: 0, r: -1.5} : layouts[i % layouts.length]} dim={Math.max(0, shown - 1 - i) > 0 ? 1 : 0} solo={solo} />
      ))}
      {stamp && (
        <div
          style={{
            position: 'absolute',
            right: 230,
            top: 210,
            transform: `rotate(8deg) scale(${2 - stampP})`,
            opacity: stampP,
            border: `8px solid ${C.up}`,
            color: C.up,
            fontFamily: MONO,
            fontWeight: 800,
            fontSize: 76,
            padding: '6px 28px',
            borderRadius: 8,
            background: 'rgba(10,15,28,0.6)',
          }}
        >
          {stamp}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ── 챕터 ───────────────────────────────────
const Chapter: React.FC<{index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const PARTS = useEpisode().parts;
  const title = PARTS[index - 1];
  const typed = Math.floor(clamp01(frame, 8, 8 + title.length * 2.2) * title.length);
  return (
    <AbsoluteFill style={{...center, alignItems: 'flex-start', paddingLeft: 180}}>
      <div style={{fontFamily: MONO, fontSize: 36, fontWeight: 800, color: C.accent, opacity: clamp01(frame, 0, 6)}}>
        &gt; CHAPTER_{String(index).padStart(2, '0')}
      </div>
      <div style={{fontSize: 150, fontWeight: 900, letterSpacing: -5, marginTop: 18, minHeight: 190}}>
        {title.slice(0, typed)}
        <Cursor />
      </div>
      <div style={{display: 'flex', gap: 14, marginTop: 50}}>
        {PARTS.map((name, i) => {
          const active = i + 1 === index;
          const done = i + 1 < index;
          const q = clamp01(frame, 4 + i * 3, 14 + i * 3);
          return (
            <div
              key={name}
              style={{
                opacity: q,
                fontFamily: MONO,
                fontSize: 26,
                fontWeight: active ? 800 : 500,
                padding: '16px 26px',
                borderRadius: 6,
                border: `1px solid ${active ? C.accent : C.border}`,
                background: active ? C.accent : C.panel,
                color: active ? C.bg : done ? C.muted : C.dim,
              }}
            >
              {String(i + 1).padStart(2, '0')} {name}
              {done ? ' ✓' : ''}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── 큰 숫자: 시세판 패널 ──────────────────────
const BigNumber: React.FC<Extract<Visual, {type: 'bigNumber'}>> = ({value, unit, label, sub, tone}) => {
  const frame = useCurrentFrame();
  const p = useEnter(0);
  const target = parseFloat(value.replace(/,/g, ''));
  const shown = isNaN(target) ? value : fmt(countUp(frame, 4, 32, target), value);
  const color = tone === 'red' ? C.up : C.text;
  const lp = useEnter(18);
  return (
    <AbsoluteFill style={{...center}}>
      <Panel label={label} style={{...rise(p), width: 1300, padding: '0 0 50px'}}>
        <div style={{padding: '10px 60px 0', display: 'flex', alignItems: 'baseline', gap: 16, color}}>
          <span style={{fontFamily: MONO, fontSize: 250, fontWeight: 800, letterSpacing: -12, lineHeight: 1.1}}>{shown}</span>
          {unit && <span style={{fontSize: 90, fontWeight: 800}}>{unit}</span>}
        </div>
        {sub && (
          <div style={{...rise(lp, 10), margin: '10px 60px 0', display: 'inline-block', fontSize: 34, fontWeight: 700, color: C.bg, background: tone === 'red' ? C.up : C.accent, padding: '8px 20px', borderRadius: 4}}>
            {sub}
          </div>
        )}
      </Panel>
    </AbsoluteFill>
  );
};

// ── 금리 경로 차트 ─────────────────────────────
const RateSteps: React.FC<Extract<Visual, {type: 'rateSteps'}>> = ({steps, highlight}) => {
  const frame = useCurrentFrame();
  const W = 1300;
  const H = 420;
  const min = 2.25;
  const max = 3.5;
  const y = (v: number) => H - ((v - min) / (max - min)) * H;
  const stepW = W / steps.length;
  const draw = clamp01(frame, 6, 60);
  let d = '';
  steps.forEach((s, i) => {
    const x0 = i * stepW;
    const x1 = (i + 1) * stepW;
    d += i === 0 ? `M ${x0} ${y(s.value)} L ${x1} ${y(s.value)}` : ` L ${x0} ${y(s.value)} L ${x1} ${y(s.value)}`;
  });
  const p = useEnter(0);
  return (
    <AbsoluteFill style={{...center}}>
      <Panel label="BOK BASE RATE · 2026" style={{...rise(p), padding: '0 80px 30px 140px'}}>
        <svg width={W} height={H + 120} style={{overflow: 'visible', marginTop: 50}}>
          {[2.5, 2.75, 3.0, 3.25].map((g) => (
            <g key={g}>
              <line x1={0} x2={W} y1={y(g)} y2={y(g)} stroke={C.border} />
              <text x={-24} y={y(g) + 8} textAnchor="end" fontSize={24} fill={C.dim} fontFamily={MONO}>
                {g.toFixed(2)}
              </text>
            </g>
          ))}
          <path d={d + ` L ${W} ${H} L 0 ${H} Z`} fill="rgba(255,77,94,0.08)" opacity={draw} />
          <path d={d} fill="none" stroke={C.up} strokeWidth={6} strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} />
          {steps.map((s, i) => {
            const appear = clamp01(draw * steps.length, i, i + 0.6);
            const hot = i === highlight;
            const cx = i * stepW + stepW / 2;
            return (
              <g key={s.label} opacity={appear}>
                <text x={cx} y={H + 60} textAnchor="middle" fontSize={28} fontWeight={700} fill={hot ? C.accent : C.muted}>
                  {s.label}
                </text>
                <text x={cx} y={y(s.value) - 22} textAnchor="middle" fontSize={hot ? 46 : 30} fontWeight={800} fill={hot ? C.up : C.text} fontFamily={MONO}>
                  {s.value.toFixed(2)}%
                </text>
                {hot && <circle cx={cx} cy={y(s.value)} r={12 + Math.sin(frame / 5) * 3} fill={C.up} />}
              </g>
            );
          })}
        </svg>
      </Panel>
    </AbsoluteFill>
  );
};

// ── 표결: 7칸 블록 ─────────────────────────
const Vote: React.FC<Extract<Visual, {type: 'vote'}>> = ({yes, no, noNames}) => {
  const frame = useCurrentFrame();
  const total = yes + no;
  const p = useEnter(0);
  return (
    <AbsoluteFill style={{...center}}>
      <Panel label="금융통화위원회 표결" style={{...rise(p), padding: '0 70px 50px', width: 1400}}>
        <div style={{display: 'flex', gap: 22, marginTop: 50}}>
          {Array.from({length: total}).map((_, i) => {
            const q = clamp01(frame, 8 + i * 5, 18 + i * 5);
            const isNo = i >= yes;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 220,
                  borderRadius: 6,
                  opacity: q,
                  transform: `scaleY(${0.3 + q * 0.7})`,
                  transformOrigin: 'bottom',
                  background: isNo ? 'transparent' : C.up,
                  border: isNo ? `3px dashed ${C.dim}` : 'none',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  paddingBottom: 20,
                  fontSize: 30,
                  fontWeight: 800,
                  color: isNo ? C.muted : '#fff',
                }}
              >
                {isNo ? '동결' : '인상'}
              </div>
            );
          })}
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 34, fontFamily: MONO, fontSize: 44, fontWeight: 800}}>
          <span style={{color: C.up}}>인상 {yes}</span>
          <span style={{color: C.muted}}>동결 {no}</span>
        </div>
        <div style={{marginTop: 16, fontSize: 30, color: C.muted, opacity: clamp01(frame, 45, 60)}}>소수의견 · {noNames}</div>
      </Panel>
    </AbsoluteFill>
  );
};

// ── 뉴스 터미널 창 ───────────────────────────
const Doc: React.FC<Extract<Visual, {type: 'doc'}>> = ({outlet, date, title, body, highlight}) => {
  const frame = useCurrentFrame();
  const p = useEnter(0, 22);
  const hl = clamp01(frame, 30, 52);
  return (
    <AbsoluteFill style={{...center}}>
      <div style={{...rise(p, 40), width: 1360, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.45)'}}>
        <div style={{height: 58, background: C.panel2, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 20, fontFamily: MONO, fontSize: 24}}>
          <span style={{color: C.bg, background: C.accent, padding: '2px 12px', borderRadius: 3, fontWeight: 800}}>NEWS</span>
          <span style={{color: C.text}}>{outlet}</span>
          <span style={{color: C.dim, marginLeft: 'auto'}}>{date}</span>
        </div>
        <div style={{padding: '46px 70px 56px'}}>
          <div style={{fontSize: 60, fontWeight: 800, letterSpacing: -1.5, marginBottom: 28}}>
            <Highlighted text={title} mark={highlight} progress={hl} />
          </div>
          {body.map((line, i) => (
            <div key={i} style={{fontSize: 40, lineHeight: 1.7, color: '#C9D4E6', fontWeight: 500, opacity: clamp01(frame, 10 + i * 6, 22 + i * 6)}}>
              <span style={{fontFamily: MONO, color: C.dim, marginRight: 22, fontSize: 28}}>{String(i + 1).padStart(2, '0')}</span>
              <Highlighted text={line} mark={highlight} progress={hl} />
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 전/후 비교 ─────────────────────────────
const Compare: React.FC<Extract<Visual, {type: 'compare'}>> = ({title, rows}) => {
  const frame = useCurrentFrame();
  const p = useEnter(0);
  const maxV = Math.max(...rows.map((r) => r.after)) * 1.15;
  const W = 820;
  return (
    <AbsoluteFill style={{...center}}>
      <Panel label={title} style={{...rise(p), padding: '0 70px 50px'}} right={<span>PREV(8월) → NOW(11월)</span>}>
        <div style={{display: 'flex', flexDirection: 'column', gap: 50, marginTop: 50}}>
          {rows.map((r, i) => {
            const a = clamp01(frame, 8 + i * 10, 28 + i * 10);
            const b = clamp01(frame, 34 + i * 10, 60 + i * 10);
            const cur = r.before + (r.after - r.before) * b;
            const diff = r.after - r.before;
            return (
              <div key={r.label} style={{display: 'flex', alignItems: 'center', gap: 36}}>
                <div style={{width: 150, fontSize: 42, fontWeight: 800}}>{r.label}</div>
                <div style={{width: W, height: 64, position: 'relative', background: C.panel2, borderRadius: 4}}>
                  <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: (r.before / maxV) * W * a, background: C.dim, borderRadius: 4}} />
                  <div style={{position: 'absolute', left: (r.before / maxV) * W, top: 0, bottom: 0, width: (diff / maxV) * W * b, background: C.up}} />
                </div>
                <div style={{width: 380, fontFamily: MONO, fontVariantNumeric: 'tabular-nums'}}>
                  <span style={{fontSize: 56, fontWeight: 800, color: b > 0 ? C.up : C.text}}>{cur.toFixed(1)}{r.unit}</span>
                  <span style={{fontSize: 30, color: C.up, marginLeft: 16, opacity: b}}>▲{diff.toFixed(1)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </AbsoluteFill>
  );
};

// ── 세로 막대 ──────────────────────────────
const Bars: React.FC<Extract<Visual, {type: 'bars'}>> = ({title, rows}) => {
  const frame = useCurrentFrame();
  const p = useEnter(0);
  const maxV = Math.max(...rows.map((r) => r.value)) * 1.2;
  const H = 420;
  return (
    <AbsoluteFill style={{...center}}>
      <Panel label={title} style={{...rise(p), padding: '0 120px 40px'}}>
        <div style={{display: 'flex', alignItems: 'flex-end', gap: 120, height: H + 140, marginTop: 20}}>
          {rows.map((r, i) => {
            const g = clamp01(frame, 8 + i * 8, 38 + i * 8);
            const h = (r.value / maxV) * H * (1 - Math.pow(1 - g, 3));
            const color = r.accent ? C.accent : C.up;
            return (
              <div key={r.label} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
                <div style={{fontFamily: MONO, fontSize: 50, fontWeight: 800, color, opacity: g}}>{r.display}</div>
                <div style={{width: 170, height: h, background: r.accent ? 'transparent' : `linear-gradient(${C.up}, rgba(255,77,94,0.45))`, border: r.accent ? `4px dashed ${C.accent}` : 'none', borderRadius: '4px 4px 0 0'}} />
                <div style={{fontSize: 32, fontWeight: 700, color: r.accent ? C.accent : C.text}}>{r.label}</div>
              </div>
            );
          })}
        </div>
      </Panel>
    </AbsoluteFill>
  );
};

// ── 이자 계산표 ────────────────────────────
const Calc: React.FC<Extract<Visual, {type: 'calc'}>> = ({principal, rows, note}) => {
  const frame = useCurrentFrame();
  const p = useEnter(0);
  return (
    <AbsoluteFill style={{...center}}>
      <Panel label="INTEREST CALC" style={{...rise(p), width: 1300, padding: '0 0 30px'}} right={<span style={{color: C.accent}}>{principal}</span>}>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '30px 50px 10px', fontFamily: MONO, fontSize: 24, color: C.dim, borderBottom: `1px solid ${C.border}`}}>
          <span>대출 원금</span>
          <span style={{textAlign: 'right'}}>연간 이자 증가</span>
        </div>
        {rows.map((r, i) => {
          const q = clamp01(frame, 12 + i * 12, 26 + i * 12);
          return (
            <div key={r.label} style={{opacity: q, display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '26px 50px', borderBottom: `1px solid ${C.border}`, alignItems: 'center'}}>
              <span style={{fontSize: 54, fontWeight: 800}}>{r.label}</span>
              <span style={{textAlign: 'right', fontSize: 60, fontWeight: 800, color: C.up, fontFamily: MONO}}>+{r.value.replace('연 ', '')}</span>
            </div>
          );
        })}
        <div style={{padding: '24px 50px 0', fontSize: 28, color: C.muted, opacity: clamp01(frame, 50, 64)}}>※ {note}</div>
      </Panel>
    </AbsoluteFill>
  );
};

// ── 한미 금리차 ─────────────────────────────
const Gap: React.FC<{kr: number; us: number}> = ({kr, us}) => {
  const frame = useCurrentFrame();
  const p = useEnter(0);
  const H = 440;
  const maxV = 4.6;
  const g = clamp01(frame, 6, 42);
  const e = 1 - Math.pow(1 - g, 3);
  const spread = clamp01(frame, 46, 62);
  const bar = (label: string, v: number, color: string) => (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
      <div style={{fontFamily: MONO, fontSize: 56, fontWeight: 800, color}}>{(v * e).toFixed(2)}%</div>
      <div style={{width: 220, height: (v / maxV) * H * e, background: color, borderRadius: '4px 4px 0 0'}} />
      <div style={{fontSize: 36, fontWeight: 800}}>{label}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{...center}}>
      <Panel label="KR vs US POLICY RATE" style={{...rise(p), padding: '0 150px 40px'}} right={<span style={{opacity: spread, color: C.accent, marginLeft: 60}}>SPREAD {(us - kr).toFixed(2)}%p</span>}>
        <div style={{display: 'flex', alignItems: 'flex-end', gap: 220, marginTop: 50, position: 'relative'}}>
          {bar('한국', kr, C.up)}
          {bar('미국 (상단)', us, C.down)}
          <div style={{position: 'absolute', left: '50%', top: '58%', transform: 'translate(-50%,-50%)', opacity: spread, fontFamily: MONO, fontSize: 30, whiteSpace: 'nowrap', fontWeight: 800, color: C.bg, background: C.accent, padding: '8px 20px', borderRadius: 4}}>
            ↔ {(us - kr).toFixed(2)}%p
          </div>
        </div>
      </Panel>
    </AbsoluteFill>
  );
};

// ── 질문: 프롬프트 타이핑 ─────────────────────
const Question: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const chars = Math.floor(clamp01(frame, 4, 4 + text.length * 1.6) * text.length);
  return (
    <AbsoluteFill style={{...center, alignItems: 'flex-start', paddingLeft: 180, paddingRight: 180}}>
      <div style={{fontFamily: MONO, fontSize: 32, color: C.accent, fontWeight: 800, marginBottom: 24}}>&gt; QUERY</div>
      <div style={{fontSize: 96, fontWeight: 900, letterSpacing: -3, lineHeight: 1.25}}>
        {text.slice(0, chars)}
        <Cursor />
      </div>
    </AbsoluteFill>
  );
};

// ── 체크리스트 ─────────────────────────────
const Checklist: React.FC<{title: string; items: string[]}> = ({title, items}) => {
  const frame = useCurrentFrame();
  const p = useEnter(0);
  return (
    <AbsoluteFill style={{...center}}>
      <Panel label={title} style={{...rise(p), width: 1300, padding: '10px 60px 40px'}}>
        {items.map((it, i) => {
          const q = clamp01(frame, 14 + i * 14, 28 + i * 14);
          return (
            <div key={it} style={{display: 'flex', alignItems: 'center', gap: 28, fontSize: 46, fontWeight: 700, padding: '22px 0', borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : 'none', opacity: q, transform: `translateX(${(1 - q) * 30}px)`}}>
              <span style={{fontFamily: MONO, fontSize: 34, fontWeight: 800, color: C.green}}>[✓]</span>
              {it}
            </div>
          );
        })}
      </Panel>
    </AbsoluteFill>
  );
};


// ── 클로징 (오른쪽은 유튜브 최종 화면용 여백) ─────────────
const Closing: React.FC<{brand: string; kakao: string}> = ({brand, kakao}) => {
  const a = useEnter(0);
  const b = useEnter(14);
  const c = useEnter(30);
  return (
    <AbsoluteFill style={{justifyContent: 'center', paddingLeft: 140}}>
      <div style={{...rise(a), fontFamily: MONO, fontSize: 30, fontWeight: 800, color: C.accent}}>&gt; END_OF_REPORT</div>
      <div style={{...rise(a), fontSize: 104, fontWeight: 900, letterSpacing: -4, lineHeight: 1.15, marginTop: 18}}>
        시청해 주셔서
        <br />
        감사합니다<Cursor />
      </div>
      <div style={{...rise(b), display: 'flex', alignItems: 'center', gap: 18, marginTop: 50}}>
        <span style={{background: '#FEE500', color: '#191919', fontSize: 34, fontWeight: 900, padding: '10px 22px', borderRadius: 10}}>💬 {kakao}</span>
      </div>
      <div style={{...rise(c), marginTop: 34, fontSize: 34, fontWeight: 700, color: C.muted}}>
        다음 이야기로 다시 찾아오겠습니다 · <span style={{color: C.text}}>{brand}</span>
      </div>
    </AbsoluteFill>
  );
};

export const VisualView: React.FC<{v: Visual}> = ({v}) => {
  switch (v.type) {
    case 'hook':
      return <Hook lines={v.lines} />;
    case 'headlines':
      return <Headlines {...v} />;
    case 'chapter':
      return <Chapter index={v.index} />;
    case 'bigNumber':
      return <BigNumber {...v} />;
    case 'rateSteps':
      return <RateSteps {...v} />;
    case 'vote':
      return <Vote {...v} />;
    case 'doc':
      return <Doc {...v} />;
    case 'compare':
      return <Compare {...v} />;
    case 'bars':
      return <Bars {...v} />;
    case 'calc':
      return <Calc {...v} />;
    case 'gap':
      return <Gap kr={v.kr} us={v.us} />;
    case 'question':
      return <Question text={v.text} />;
    case 'checklist':
      return <Checklist title={v.title} items={v.items} />;
    case 'closing':
      return <Closing brand={v.brand} kakao={v.kakao} />;
    case 'stamp':
      return <Stamp {...v} />;
    case 'crash':
      return <Crash {...v} />;
    case 'yearFlash':
      return <YearFlash {...v} />;
    case 'titleCard':
      return <TitleCard {...v} />;
    case 'cycle':
      return <Cycle {...v} />;
    case 'leverage':
      return <Leverage {...v} />;
    case 'hbars':
      return <HBars {...v} />;
  }
};
