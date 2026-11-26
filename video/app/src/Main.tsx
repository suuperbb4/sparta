import React, {createContext, useContext} from 'react';
import {AbsoluteFill, Audio, interpolate, Loop, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Episode, Footage, Scene} from './types';
import ep01Timings from './timings/ep01.json';
import ep02Timings from './timings/ep02.json';
import {C, FontFaces, MONO, Screen, Subtitle} from './theme';
import {VisualView} from './Visuals';

export const FPS = 30;
const PAD_AFTER = 0.45; // 문장 끝 뒤 여백(초)

type Timings = {scenes?: Record<string, number>; bgm?: string};
const TIMINGS: Record<string, Timings> = {ep01: ep01Timings as Timings, ep02: ep02Timings as Timings};

// 지금 렌더링 중인 편 (Visuals 에서 챕터 이름 등을 읽음)
export const EpisodeContext = createContext<Episode | null>(null);
export const useEpisode = () => {
  const ep = useContext(EpisodeContext);
  if (!ep) throw new Error('EpisodeContext 없음');
  return ep;
};

// TTS 오디오가 있으면 그 길이, 없으면 글자 수로 추정 (한국어 약 7자/초)
export const sceneSeconds = (ep: Episode, s: Scene) => {
  if (s.seconds) return s.seconds;
  if (!s.narration) return 2.6;
  const audio = TIMINGS[ep.id]?.scenes?.[s.id];
  if (audio) return (s.lead ?? 0) + audio + PAD_AFTER + (s.hold ?? 0);
  return (s.lead ?? 0) + Math.max(3, s.narration.replace(/\s/g, '').length / 7 + PAD_AFTER) + (s.hold ?? 0);
};

export const layout = (ep: Episode) => {
  let from = 0;
  return ep.scenes.map((s) => {
    const dur = Math.round(sceneSeconds(ep, s) * FPS);
    const item = {scene: s, from, dur};
    from += dur;
    return item;
  });
};

export const totalFrames = (ep: Episode) => layout(ep).reduce((a, b) => a + b.dur, 0);

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

// ── 출처 (왼쪽 위) ─────────────────────────────
const SourceLine: React.FC<{text?: string; top?: number}> = ({text, top = 40}) => {
  const frame = useCurrentFrame();
  if (!text) return null;
  return (
    <div style={{position: 'absolute', top, left: 50, fontFamily: MONO, fontSize: 22, color: C.dim, opacity: interpolate(frame, [4, 14], [0, 1], {extrapolateRight: 'clamp'})}}>
      SRC <span style={{color: C.muted, fontFamily: "'Pretendard'"}}>{text}</span>
    </div>
  );
};

// ── 아래쪽 시세 띠 (계속 흐름) ───────────────────
const Ticker: React.FC<{items: string[]}> = ({items: base}) => {
  const frame = useCurrentFrame();
  const items = [...base, ...base, ...base];
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

// ── 배경 영상: 남색으로 덮어 그래픽이 잘 보이게 ──────────
const Backdrop: React.FC<{f: Footage; dim?: number}> = ({f, dim = 1}) => {
  const frame = useCurrentFrame();
  const zoom = 1.05 + frame * 0.0004; // 느린 줌인
  return (
    <AbsoluteFill>
      <Loop durationInFrames={Math.floor(f.seconds * FPS)}>
        <OffthreadVideo src={staticFile(f.clip)} muted style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})`}} />
      </Loop>
      <AbsoluteFill style={{background: `linear-gradient(rgba(10,15,28,${0.62 * dim}), rgba(10,15,28,${0.8 * dim}))`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(10,15,28,0.7) 100%)'}} />
      <div style={{position: 'absolute', right: 40, bottom: 70, fontSize: 20, fontWeight: 600, color: 'rgba(230,237,247,0.75)', fontFamily: "'Pretendard'"}}>{f.credit}</div>
    </AbsoluteFill>
  );
};

// ── 시네마틱: 위아래 검은 띠 + 필름 그레인 ───────────────
const Letterbox: React.FC = () => {
  const frame = useCurrentFrame();
  const grainShift = (frame * 37) % 200;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width="100%" height="100%" style={{position: 'absolute', opacity: 0.09, mixBlendMode: 'screen', transform: `translate(${-grainShift / 10}px, ${grainShift / 14}px)`}}>
        <filter id="g2">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 7} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="110%" height="110%" filter="url(#g2)" />
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 120, background: '#000'}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 120, background: '#000'}} />
    </AbsoluteFill>
  );
};

const SceneView: React.FC<{ep: Episode; scene: Scene; dur: number}> = ({ep, scene, dur}) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, scene.cinematic ? 10 : 6], [0, 1], {extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [dur - 5, dur], [1, 0], {extrapolateLeft: 'clamp'});
  const audioSec = TIMINGS[ep.id]?.scenes?.[scene.id];
  const lead = Math.round((scene.lead ?? 0) * FPS);
  const speechFrames = audioSec ? audioSec * FPS : dur - lead - PAD_AFTER * FPS;
  return (
    <AbsoluteFill>
      {scene.bg ? (
        <AbsoluteFill style={{opacity: Math.min(fadeIn, fadeOut)}}>
          <Backdrop f={scene.bg} dim={scene.bgDim} />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{opacity: Math.min(fadeIn, fadeOut), transform: 'translateY(-10px)'}}>
        <VisualView v={scene.visual} />
      </AbsoluteFill>
      {scene.cinematic ? <Letterbox /> : null}
      <SourceLine text={scene.source} top={scene.cinematic ? 140 : 40} />
      <Sequence from={lead}>
        <SubtitleTrack text={scene.narration} speechFrames={speechFrames} />
        {audioSec ? <Audio src={staticFile(`audio/${ep.id}/${scene.id}.mp3`)} /> : null}
      </Sequence>
      {(scene.sfx ?? []).map((s, i) => (
        <Sequence key={i} from={Math.round(s.at * FPS)}>
          <Audio src={staticFile(`sfx/${s.file}`)} volume={s.volume ?? 0.6} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// 지금 프레임이 시네마틱 장면이면 아래 시세 띠를 숨김
const TickerUnlessCinematic: React.FC<{ep: Episode; items: ReturnType<typeof layout>}> = ({ep, items}) => {
  const frame = useCurrentFrame();
  const cur = items.find((it) => frame >= it.from && frame < it.from + it.dur);
  if (cur?.scene.cinematic || cur?.scene.noTicker) return null;
  return <Ticker items={ep.ticker} />;
};

export const Main: React.FC<{ep: Episode}> = ({ep}) => {
  const items = layout(ep);
  const t = TIMINGS[ep.id] ?? {};
  return (
    <EpisodeContext.Provider value={ep}>
      <AbsoluteFill style={{background: C.bg}}>
        <FontFaces />
        <Screen>
          {items.map(({scene, from, dur}) => (
            <Sequence key={scene.id} from={from} durationInFrames={dur} name={scene.id}>
              <SceneView ep={ep} scene={scene} dur={dur} />
            </Sequence>
          ))}
          <TickerUnlessCinematic ep={ep} items={items} />
        </Screen>
        {t.bgm ? <Audio src={staticFile(t.bgm)} volume={0.1} loop /> : null}
      </AbsoluteFill>
    </EpisodeContext.Provider>
  );
};
