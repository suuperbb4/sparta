import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {PARTS, Scene, SCENES} from './script';
import timingsJson from './timings.json';
import {C, FontFaces, Paper, SourceLabel, Subtitle} from './theme';
import {isDark, VisualView} from './Visuals';

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
      // 쉼표 없이 긴 문장은 어절 기준으로 반 나눔
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

const PartTag: React.FC<{part: number; dark: boolean}> = ({part, dark}) => {
  if (part === 0) return null;
  return (
    <div style={{position: 'absolute', right: 72, top: 52, display: 'flex', gap: 8, alignItems: 'center'}}>
      {PARTS.map((_, i) => (
        <span key={i} style={{width: i + 1 === part ? 40 : 14, height: 6, borderRadius: 3, background: i + 1 === part ? C.red : dark ? '#3A3A42' : C.line}} />
      ))}
      <span style={{marginLeft: 10, fontSize: 22, fontWeight: 700, color: dark ? '#9A9AA2' : C.inkSoft}}>{PARTS[part - 1]}</span>
    </div>
  );
};

const SceneView: React.FC<{scene: Scene; dur: number}> = ({scene, dur}) => {
  const frame = useCurrentFrame();
  const dark = isDark(scene.visual);
  const fadeIn = interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [dur - 6, dur], [1, 0], {extrapolateLeft: 'clamp'});
  const audioSec = timings.scenes?.[scene.id];
  const speechFrames = audioSec ? audioSec * FPS : dur - PAD_AFTER * FPS;
  return (
    <AbsoluteFill style={{opacity: Math.min(fadeIn, fadeOut)}}>
      <Paper dark={dark}>
        <AbsoluteFill style={{transform: 'translateY(-40px)'}}>
          <VisualView v={scene.visual} />
        </AbsoluteFill>
      </Paper>
      <SourceLabel text={scene.source} dark={dark} />
      <PartTag part={scene.part} dark={dark} />
      <SubtitleTrack text={scene.narration} speechFrames={speechFrames} />
      {audioSec ? <Audio src={staticFile(`audio/${scene.id}.mp3`)} /> : null}
    </AbsoluteFill>
  );
};

export const Main: React.FC = () => {
  const items = layout();
  return (
    <AbsoluteFill style={{background: C.night}}>
      <FontFaces />
      {items.map(({scene, from, dur}) => (
        <Sequence key={scene.id} from={from} durationInFrames={dur} name={scene.id}>
          <SceneView scene={scene} dur={dur} />
        </Sequence>
      ))}
      {timings.bgm ? <Audio src={staticFile(timings.bgm)} volume={0.12} loop /> : null}
    </AbsoluteFill>
  );
};
