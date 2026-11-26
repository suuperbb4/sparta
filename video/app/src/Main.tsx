import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {PARTS, Scene, SCENES, STATUS, TICKER} from './script';
import timingsJson from './timings.json';
import {C, FontFaces, MONO, Screen, Subtitle} from './theme';
import {VisualView} from './Visuals';

export const FPS = 30;
const PAD_AFTER = 0.45; // 문장 끝 뒤 여백(초)

type Timings = {scenes?: Record<string, number>; bgm?: string};
const timings = timingsJson as Timings;

// TTS 오디오가 있으면 그 길이, 없으면 글자 수로 추정 (한국어 약 7자/초)
export const sceneSeconds = (s: Scene) => {
  if (!s.narration) return 2.6;
  const audio = timings.scenes?.[s.id];
  if (audio) return audio + PAD_AFTER;
  return Math.max(3, s.narration.replace(/\s/g, '').length / 7 + PAD_AFTER);
};

export const layout = () => {
  let from = 0;
  return SCENES.map((s) => {
    const dur = Math.round(sceneSeconds(s) * FPS);
    const item = {scene: s, from, dur};
    from += dur;
    return item;
  });
};

export const totalFrames = () => layout().reduce((a, b) => a + b.dur, 0);

// 자막: 문장 → 화면에 맞는 길이로 쪼개고, 글자 수 비율로 시간 배분
const chunk = (text: string, max = 30): string[] => {
  const sentences = text.split(/(?<=[.?!])\s+/);
  const out: string[] = [];
  for (const s of sentences) {
    if (s.length <= max) {
      out.push(s);
      continue;
    }
    const parts = s.split(/(?<=,)\s+/);
    let cur = '';
    for (const p of parts) {
      if ((cur + ' ' + p).trim().length > max && cur) {
        out.push(cur.trim());
        cur = p;
      } else cur = (cur + ' ' + p).trim();
    }
    if (cur) {
      if (cur.length > max + 8) {
        const words = cur.split(' ');
        const half = Math.ceil(words.length / 2);
        out.push(words.slice(0, half).join(' '), words.slice(half).join(' '));
      } else out.push(cur);
    }
  }
  return out;
};

const SubtitleTrack: React.FC<{text: string; speechFrames: number}> = ({text, speechFrames}) => {
  const frame = useCurrentFrame();
  const parts = chunk(text);
  const total = parts.reduce((a, p) => a + p.length, 0);
  let acc = 0;
  let current = parts[parts.length - 1] ?? '';
  for (const p of parts) {
    acc += p.length;
    if (frame < (acc / total) * speechFrames) {
      current = p;
      break;
    }
  }
  return <Subtitle text={current} />;
};

// ── 위쪽 상태바 (항상 표시) ─────────────────────
const TopBar: React.FC<{scene: Scene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const blink = Math.floor(frame / 20) % 2 === 0;
  return (
    <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 64, background: '#111A2E', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 38, padding: '0 50px', fontFamily: MONO, fontSize: 23, color: C.muted, whiteSpace: 'nowrap'}}>
      <span style={{color: C.accent, fontWeight: 800}}>
        <span style={{opacity: blink ? 1 : 0.3}}>●</span> LIVE
      </span>
      {STATUS.map((s) => (
        <span key={s.k}>
          {s.k} <span style={{color: C.text}}>{s.v}</span>{' '}
          <span style={{color: s.up === true ? C.up : s.up === false ? C.down : C.dim}}>{s.d}</span>
        </span>
      ))}
      <span style={{marginLeft: 'auto', color: scene.part ? C.text : C.dim}}>
        {scene.part ? `CH${String(scene.part).padStart(2, '0')} · ${PARTS[scene.part - 1]}` : '2026-11-26'}
      </span>
    </div>
  );
};

// ── 출처 (상태바 아래) ─────────────────────────
const SourceLine: React.FC<{text?: string}> = ({text}) => {
  const frame = useCurrentFrame();
  if (!text) return null;
  return (
    <div style={{position: 'absolute', top: 88, left: 50, fontFamily: MONO, fontSize: 22, color: C.dim, opacity: interpolate(frame, [4, 14], [0, 1], {extrapolateRight: 'clamp'})}}>
      SRC <span style={{color: C.muted, fontFamily: "'Pretendard'"}}>{text}</span>
    </div>
  );
};

// ── 아래쪽 시세 띠 (계속 흐름) ───────────────────
const Ticker: React.FC = () => {
  const frame = useCurrentFrame();
  const items = [...TICKER, ...TICKER, ...TICKER];
  const x = -((frame * 2.2) % 2400);
  return (
    <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 56, background: C.accent, overflow: 'hidden', display: 'flex', alignItems: 'center'}}>
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 2, background: C.bg, color: C.accent, fontFamily: MONO, fontWeight: 800, fontSize: 24, display: 'flex', alignItems: 'center', padding: '0 26px'}}>
        KEY DATA
      </div>
      <div style={{display: 'flex', gap: 70, transform: `translateX(${x + 220}px)`, whiteSpace: 'nowrap', fontFamily: MONO, fontWeight: 800, fontSize: 25, color: C.bg}}>
        {items.map((t, i) => (
          <span key={i}>■ {t}</span>
        ))}
      </div>
    </div>
  );
};

const SceneView: React.FC<{scene: Scene; dur: number}> = ({scene, dur}) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 6], [0, 1], {extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [dur - 5, dur], [1, 0], {extrapolateLeft: 'clamp'});
  const audioSec = timings.scenes?.[scene.id];
  const speechFrames = audioSec ? audioSec * FPS : dur - PAD_AFTER * FPS;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{opacity: Math.min(fadeIn, fadeOut), transform: 'translateY(-10px)'}}>
        <VisualView v={scene.visual} />
      </AbsoluteFill>
      <SourceLine text={scene.source} />
      <SubtitleTrack text={scene.narration} speechFrames={speechFrames} />
      {audioSec ? <Audio src={staticFile(`audio/${scene.id}.mp3`)} /> : null}
    </AbsoluteFill>
  );
};

const CurrentTopBar: React.FC<{items: ReturnType<typeof layout>}> = ({items}) => {
  const frame = useCurrentFrame();
  const cur = items.find((it) => frame >= it.from && frame < it.from + it.dur) ?? items[items.length - 1];
  return <TopBar scene={cur.scene} />;
};

export const Main: React.FC = () => {
  const items = layout();
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <FontFaces />
      <Screen>
        {items.map(({scene, from, dur}) => (
          <Sequence key={scene.id} from={from} durationInFrames={dur} name={scene.id}>
            <SceneView scene={scene} dur={dur} />
          </Sequence>
        ))}
        <CurrentTopBar items={items} />
        <Ticker />
      </Screen>
      {timings.bgm ? <Audio src={staticFile(timings.bgm)} volume={0.12} loop /> : null}
    </AbsoluteFill>
  );
};
