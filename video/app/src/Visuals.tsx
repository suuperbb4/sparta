import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, countUp, Highlighted, rise, useEnter} from './theme';
import {PARTS, Visual} from './script';

const center: React.CSSProperties = {display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'};

const fmt = (v: number, template: string) => {
  // template 의 소수 자릿수와 천 단위 콤마를 따라감
  const decimals = template.includes('.') ? template.split('.')[1].length : 0;
  const s = v.toFixed(decimals);
  if (!template.includes(',')) return s;
  const [a, b] = s.split('.');
  return a.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (b ? '.' + b : '');
};

// ── 오프닝 훅 ───────────────────────────────
const Hook: React.FC<{lines: string[]}> = ({lines}) => {
  return (
    <AbsoluteFill style={{...center, gap: 28}}>
      {lines.map((l, i) => {
        const p = useEnter(i * 14);
        return (
          <div key={l} style={{...rise(p, 60), fontSize: 120, fontWeight: 900, letterSpacing: -4}}>
            {l}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ── 챕터 화면 ──────────────────────────────
const Chapter: React.FC<{index: number}> = ({index}) => {
  const frame = useCurrentFrame();
  const p = useEnter(0);
  return (
    <AbsoluteFill style={{...center, gap: 48}}>
      <div style={{...rise(p), textAlign: 'center'}}>
        <div style={{fontSize: 30, fontWeight: 700, color: C.red, letterSpacing: 6}}>PART {index}</div>
        <div style={{fontSize: 96, fontWeight: 800, marginTop: 12, letterSpacing: -3}}>{PARTS[index - 1]}</div>
      </div>
      <div style={{display: 'flex', gap: 16}}>
        {PARTS.map((name, i) => {
          const active = i + 1 === index;
          const q = interpolate(frame, [6 + i * 3, 16 + i * 3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <div
              key={name}
              style={{
                width: 220,
                padding: '16px 18px',
                borderRadius: 8,
                border: `3px solid ${active ? C.red : 'rgba(255,255,255,0.12)'}`,
                background: active ? 'rgba(217,43,43,0.12)' : 'rgba(255,255,255,0.05)',
                opacity: q * (active ? 1 : 0.55),
                transform: `translateY(${(1 - q) * 20}px)`,
              }}
            >
              <div style={{fontSize: 28, fontWeight: 800}}>{String(i + 1).padStart(2, '0')}</div>
              <div style={{fontSize: 20, fontWeight: 500, marginTop: 6, color: '#BFBFC6'}}>{name}</div>
            </div>
          );
        })}
      </div>
      <div style={{fontSize: 22, color: '#8A8A92', opacity: p}}>2026.11.26 금리 인상</div>
    </AbsoluteFill>
  );
};

// ── 큰 숫자 ────────────────────────────────
const BigNumber: React.FC<Extract<Visual, {type: 'bigNumber'}>> = ({value, unit, label, sub, tone}) => {
  const frame = useCurrentFrame();
  const p = useEnter(0);
  const target = parseFloat(value.replace(/,/g, ''));
  const shown = isNaN(target) ? value : fmt(countUp(frame, 4, 34, target), value);
  const color = tone === 'red' ? C.red : C.ink;
  const lp = useEnter(20);
  return (
    <AbsoluteFill style={{...center}}>
      <div style={{...rise(p, 30), display: 'flex', alignItems: 'baseline', gap: 10, color}}>
        <span style={{fontSize: 260, fontWeight: 900, letterSpacing: -10, fontVariantNumeric: 'tabular-nums'}}>{shown}</span>
        {unit && <span style={{fontSize: 96, fontWeight: 800}}>{unit}</span>}
      </div>
      <div style={{...rise(lp, 20), fontSize: 52, fontWeight: 700, marginTop: 8}}>{label}</div>
      {sub && (
        <div
          style={{
            ...rise(lp, 20),
            marginTop: 22,
            fontSize: 30,
            fontWeight: 600,
            color: tone === 'red' ? C.red : C.inkSoft,
            border: `2px solid ${tone === 'red' ? C.red : C.line}`,
            padding: '8px 18px',
            borderRadius: 6,
          }}
        >
          {sub}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ── 금리 계단 ──────────────────────────────
const RateSteps: React.FC<Extract<Visual, {type: 'rateSteps'}>> = ({steps, highlight}) => {
  const frame = useCurrentFrame();
  const W = 1300;
  const H = 440;
  const min = 2.25;
  const max = 3.5;
  const y = (v: number) => H - ((v - min) / (max - min)) * H;
  const stepW = W / steps.length;
  const draw = interpolate(frame, [6, 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  let d = '';
  steps.forEach((s, i) => {
    const x0 = i * stepW;
    const x1 = (i + 1) * stepW;
    d += i === 0 ? `M ${x0} ${y(s.value)} L ${x1} ${y(s.value)}` : ` L ${x0} ${y(s.value)} L ${x1} ${y(s.value)}`;
  });
  const titleP = useEnter(0);
  return (
    <AbsoluteFill style={{...center}}>
      <div style={{...rise(titleP), fontSize: 46, fontWeight: 800, marginBottom: 50}}>2026년 한국은행 기준금리</div>
      <svg width={W} height={H + 80} style={{overflow: 'visible'}}>
        {[2.5, 3.0, 3.25].map((g) => (
          <g key={g}>
            <line x1={0} x2={W} y1={y(g)} y2={y(g)} stroke={C.line} strokeDasharray="6 8" />
            <text x={-20} y={y(g) + 8} textAnchor="end" fontSize={26} fill={C.inkSoft} fontWeight={600}>
              {g.toFixed(2)}%
            </text>
          </g>
        ))}
        <path d={d} fill="none" stroke={C.ink} strokeWidth={8} strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - draw} />
        {steps.map((s, i) => {
          const appear = interpolate(draw, [i / steps.length, (i + 0.6) / steps.length], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          const hot = i === highlight;
          return (
            <g key={s.label} opacity={appear}>
              <text x={i * stepW + stepW / 2} y={H + 60} textAnchor="middle" fontSize={30} fontWeight={700} fill={hot ? C.red : C.ink}>
                {s.label}
              </text>
              <text x={i * stepW + stepW / 2} y={y(s.value) - 22} textAnchor="middle" fontSize={hot ? 44 : 30} fontWeight={800} fill={hot ? C.red : C.ink}>
                {s.value.toFixed(2)}%
              </text>
              {hot && <circle cx={i * stepW + stepW / 2} cy={y(s.value)} r={14} fill={C.red} />}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

// ── 표결 ───────────────────────────────────
const Vote: React.FC<Extract<Visual, {type: 'vote'}>> = ({yes, no, noNames}) => {
  const frame = useCurrentFrame();
  const total = yes + no;
  return (
    <AbsoluteFill style={{...center, gap: 50}}>
      <div style={{fontSize: 46, fontWeight: 800}}>금융통화위원회 표결</div>
      <div style={{display: 'flex', gap: 34}}>
        {Array.from({length: total}).map((_, i) => {
          const p = interpolate(frame, [8 + i * 5, 20 + i * 5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          const isNo = i >= yes;
          const color = isNo ? C.inkSoft : C.red;
          return (
            <div key={i} style={{opacity: p, transform: `translateY(${(1 - p) * 30}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
              <svg width={110} height={170} viewBox="0 0 110 170">
                <circle cx={55} cy={36} r={30} fill={color} />
                <path d="M10 170 L10 108 Q10 74 55 74 Q100 74 100 108 L100 170 Z" fill={color} />
              </svg>
              <div style={{fontSize: 28, fontWeight: 800, color}}>{isNo ? '동결' : '인상'}</div>
            </div>
          );
        })}
      </div>
      <div style={{display: 'flex', gap: 40, alignItems: 'center', fontSize: 40, fontWeight: 800}}>
        <span style={{color: C.red}}>인상 {yes}</span>
        <span style={{color: C.line}}>|</span>
        <span style={{color: C.inkSoft}}>동결 {no}</span>
      </div>
      <div style={{fontSize: 28, color: C.inkSoft, fontWeight: 600, opacity: interpolate(frame, [50, 65], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
        소수의견: {noNames}
      </div>
    </AbsoluteFill>
  );
};

// ── 문서 카드 (브라우저 창 + 형광펜) ───────────
const Doc: React.FC<Extract<Visual, {type: 'doc'}>> = ({outlet, date, title, body, highlight}) => {
  const frame = useCurrentFrame();
  const p = useEnter(0, 20);
  const hl = interpolate(frame, [30, 55], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const scale = interpolate(frame, [0, 240], [1, 1.04], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{...center}}>
      <div
        style={{
          ...rise(p, 50),
          transform: `translateY(${(1 - p) * 50}px) scale(${scale}) rotate(-0.6deg)`,
          width: 1280,
          background: '#FFFFFF',
          borderRadius: 14,
          boxShadow: '0 30px 80px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        <div style={{height: 52, background: '#2A2A30', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10}}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
            <span key={c} style={{width: 16, height: 16, borderRadius: 8, background: c}} />
          ))}
          <span style={{marginLeft: 18, color: '#B8B8C0', fontSize: 22, fontWeight: 500}}>
            {outlet} · {date}
          </span>
        </div>
        <div style={{padding: '50px 70px 60px'}}>
          <div style={{fontSize: 62, fontWeight: 800, letterSpacing: -1.5, marginBottom: 30}}>
            <Highlighted text={title} mark={highlight} progress={hl} />
          </div>
          {body.map((line, i) => {
            const q = interpolate(frame, [10 + i * 6, 24 + i * 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            return (
              <div key={i} style={{fontSize: 40, lineHeight: 1.7, color: '#2C2C33', fontWeight: 500, opacity: q}}>
                <Highlighted text={line} mark={highlight} progress={hl} />
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 전/후 비교 ─────────────────────────────
const Compare: React.FC<Extract<Visual, {type: 'compare'}>> = ({title, rows}) => {
  const frame = useCurrentFrame();
  const tp = useEnter(0);
  const maxV = Math.max(...rows.map((r) => r.after)) * 1.15;
  const W = 900;
  return (
    <AbsoluteFill style={{...center, gap: 60}}>
      <div style={{...rise(tp), fontSize: 50, fontWeight: 800}}>{title}</div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 54}}>
        {rows.map((r, i) => {
          const a = interpolate(frame, [8 + i * 10, 30 + i * 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          const b = interpolate(frame, [36 + i * 10, 64 + i * 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          const cur = r.before + (r.after - r.before) * b;
          return (
            <div key={r.label} style={{display: 'flex', alignItems: 'center', gap: 36}}>
              <div style={{width: 170, fontSize: 44, fontWeight: 800}}>{r.label}</div>
              <div style={{width: W, height: 74, position: 'relative', background: C.paperDark, borderRadius: 6}}>
                <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: (r.before / maxV) * W * a, background: '#B9B5AC', borderRadius: 6}} />
                <div
                  style={{
                    position: 'absolute',
                    left: (r.before / maxV) * W,
                    top: 0,
                    bottom: 0,
                    width: ((r.after - r.before) / maxV) * W * b,
                    background: C.red,
                    borderRadius: '0 6px 6px 0',
                  }}
                />
              </div>
              <div style={{width: 300, fontSize: 50, fontWeight: 900, fontVariantNumeric: 'tabular-nums'}}>
                <span style={{color: C.inkSoft, fontSize: 34, fontWeight: 600, opacity: a}}>{r.before.toFixed(1)} → </span>
                <span style={{color: b > 0 ? C.red : C.ink}}>{cur.toFixed(1)}{r.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{display: 'flex', gap: 30, fontSize: 26, color: C.inkSoft, fontWeight: 600}}>
        <span><span style={{display: 'inline-block', width: 18, height: 18, background: '#B9B5AC', marginRight: 8}} />이전 전망 (8월)</span>
        <span><span style={{display: 'inline-block', width: 18, height: 18, background: C.red, marginRight: 8}} />상향분 (11월)</span>
      </div>
    </AbsoluteFill>
  );
};

// ── 막대 ───────────────────────────────────
const Bars: React.FC<Extract<Visual, {type: 'bars'}>> = ({title, rows}) => {
  const frame = useCurrentFrame();
  const tp = useEnter(0);
  const maxV = Math.max(...rows.map((r) => r.value)) * 1.2;
  const H = 460;
  return (
    <AbsoluteFill style={{...center, gap: 40}}>
      <div style={{...rise(tp), fontSize: 46, fontWeight: 800}}>{title}</div>
      <div style={{display: 'flex', alignItems: 'flex-end', gap: 110, height: H + 120}}>
        {rows.map((r, i) => {
          const g = interpolate(frame, [8 + i * 8, 40 + i * 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          const eased = 1 - Math.pow(1 - g, 3);
          const h = (r.value / maxV) * H * eased;
          return (
            <div key={r.label} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16}}>
              <div style={{fontSize: 52, fontWeight: 900, color: r.accent ? C.red : C.ink, opacity: g}}>{r.display}</div>
              <div
                style={{
                  width: 190,
                  height: h,
                  background: r.accent ? 'transparent' : C.ink,
                  border: r.accent ? `5px dashed ${C.red}` : 'none',
                  borderRadius: '6px 6px 0 0',
                }}
              />
              <div style={{fontSize: 34, fontWeight: 700, color: r.accent ? C.red : C.ink}}>{r.label}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ── 이자 계산 ──────────────────────────────
const Calc: React.FC<Extract<Visual, {type: 'calc'}>> = ({principal, rows, note}) => {
  const frame = useCurrentFrame();
  const tp = useEnter(0);
  return (
    <AbsoluteFill style={{...center, gap: 40}}>
      <div style={{...rise(tp), fontSize: 34, fontWeight: 700, color: C.red, border: `3px solid ${C.red}`, padding: '10px 24px', borderRadius: 8}}>{principal}</div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 22, width: 1100}}>
        {rows.map((r, i) => {
          const p = interpolate(frame, [12 + i * 12, 30 + i * 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <div
              key={r.label}
              style={{
                opacity: p,
                transform: `translateX(${(1 - p) * -60}px)`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#FFFFFF',
                borderRadius: 12,
                padding: '30px 50px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
              }}
            >
              <span style={{fontSize: 52, fontWeight: 800}}>대출 {r.label}</span>
              <span style={{fontSize: 30, color: C.inkSoft, fontWeight: 600}}>이자 증가</span>
              <span style={{fontSize: 58, fontWeight: 900, color: C.red}}>+{r.value.replace('연 ', '')}<span style={{fontSize: 30, color: C.inkSoft}}> /년</span></span>
            </div>
          );
        })}
      </div>
      <div style={{fontSize: 28, color: C.inkSoft, fontWeight: 600, opacity: interpolate(frame, [55, 70], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>※ {note}</div>
    </AbsoluteFill>
  );
};

// ── 한미 금리차 ─────────────────────────────
const Gap: React.FC<{kr: number; us: number}> = ({kr, us}) => {
  const frame = useCurrentFrame();
  const H = 520;
  const maxV = 4.6;
  const g = interpolate(frame, [6, 44], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const e = 1 - Math.pow(1 - g, 3);
  const bracket = interpolate(frame, [48, 66], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const bar = (label: string, v: number, color: string) => (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16}}>
      <div style={{fontSize: 56, fontWeight: 900, color}}>{(v * e).toFixed(2)}%</div>
      <div style={{width: 220, height: (v / maxV) * H * e, background: color, borderRadius: '8px 8px 0 0'}} />
      <div style={{fontSize: 38, fontWeight: 800}}>{label}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{...center}}>
      <div style={{fontSize: 46, fontWeight: 800, marginBottom: 150}}>한국 vs 미국 기준금리</div>
      <div style={{display: 'flex', alignItems: 'flex-end', gap: 200, position: 'relative'}}>
        {bar('한국', kr, C.red)}
        {bar('미국 (상단)', us, C.ink)}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: -110,
            transform: 'translateX(-50%)',
            opacity: bracket,
            background: C.highlight,
            padding: '10px 22px',
            borderRadius: 8,
            fontSize: 40,
            fontWeight: 900,
            whiteSpace: 'nowrap',
          }}
        >
          차이 {(us - kr).toFixed(2)}%p
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── 질문 / 체크리스트 ─────────────────────────
const Question: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const chars = Math.floor(interpolate(frame, [4, 4 + text.length * 1.6], [0, text.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const caret = Math.floor(frame / 15) % 2 === 0;
  return (
    <AbsoluteFill style={{...center}}>
      <div style={{fontSize: 92, fontWeight: 900, letterSpacing: -3, maxWidth: 1500, textAlign: 'center', lineHeight: 1.25}}>
        {text.slice(0, chars)}
        <span style={{color: C.red, opacity: caret ? 1 : 0}}>▍</span>
      </div>
    </AbsoluteFill>
  );
};

const Checklist: React.FC<{title: string; items: string[]}> = ({title, items}) => {
  const frame = useCurrentFrame();
  const tp = useEnter(0);
  return (
    <AbsoluteFill style={{...center}}>
      <div style={{width: 1200}}>
        <div style={{...rise(tp), fontSize: 56, fontWeight: 900, marginBottom: 40, borderBottom: `5px solid ${C.ink}`, paddingBottom: 20}}>{title}</div>
        {items.map((it, i) => {
          const p = interpolate(frame, [14 + i * 14, 28 + i * 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <div key={it} style={{display: 'flex', alignItems: 'center', gap: 26, fontSize: 46, fontWeight: 700, padding: '18px 0', opacity: p, transform: `translateX(${(1 - p) * 40}px)`}}>
              <span style={{width: 50, height: 50, borderRadius: 8, background: C.red, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34}}>✓</span>
              {it}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const isDark = (v: Visual) => v.type === 'chapter' || v.type === 'question' || v.type === 'hook';

export const VisualView: React.FC<{v: Visual}> = ({v}) => {
  const {width} = useVideoConfig();
  void width;
  switch (v.type) {
    case 'hook':
      return <Hook lines={v.lines} />;
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
  }
};
