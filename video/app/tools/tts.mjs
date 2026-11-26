// Google Cloud Text-to-Speech로 장면별 내레이션 mp3를 만들고 src/timings.json 을 갱신합니다.
//
// 실행:  node --experimental-strip-types tools/tts.mjs [--voice ko-KR-Chirp3-HD-Charon] [--rate 1.08] [--only hook1,hook2]
//
// API 키는 코드에 넣지 않습니다. 클라우드 세션에서는 환경의 네트워크 시크릿이
// texttospeech.googleapis.com 요청에 x-goog-api-key 헤더를 붙여 줍니다.
// 내 컴퓨터에서 돌릴 때는 GOOGLE_TTS_API_KEY 환경변수를 쓰면 됩니다.

import {execFileSync} from 'node:child_process';
import {mkdirSync, writeFileSync, readFileSync, existsSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const {SCENES} = await import(join(root, 'src/script.ts'));

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : def;
};
const voice = arg('voice', 'ko-KR-Chirp3-HD-Algenib');
const rate = Number(arg('rate', '1.04'));
const only = arg('only', '')?.split(',').filter(Boolean);

const key = process.env.GOOGLE_TTS_API_KEY || 'injected-by-proxy';
const outDir = join(root, 'public/audio');
mkdirSync(outDir, {recursive: true});

const timingsPath = join(root, 'src/timings.json');
const timings = existsSync(timingsPath) ? JSON.parse(readFileSync(timingsPath, 'utf8')) : {};
timings.scenes ??= {};
timings.voice = voice;

// 숫자·기호를 TTS가 자연스럽게 읽도록 다듬기 (화면 자막은 원문 그대로)
const speakable = (t) =>
  t
    .replace(/(\d)%포인트/g, '$1퍼센트포인트')
    .replace(/(\d)%/g, '$1퍼센트')
    .replace(/(\d),(\d{3})/g, '$1$2');

for (const s of SCENES) {
  if (!s.narration) continue;
  if (only?.length && !only.includes(s.id)) continue;
  const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'x-goog-api-key': key},
    body: JSON.stringify({
      input: {text: speakable(s.narration)},
      voice: {languageCode: 'ko-KR', name: voice},
      audioConfig: {audioEncoding: 'MP3', speakingRate: rate, sampleRateHertz: 44100},
    }),
  });
  if (!res.ok) {
    console.error(`✗ ${s.id}: HTTP ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  const {audioContent} = await res.json();
  const file = join(outDir, `${s.id}.mp3`);
  writeFileSync(file, Buffer.from(audioContent, 'base64'));
  const dur = Number(
    execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim(),
  );
  timings.scenes[s.id] = Math.round(dur * 100) / 100;
  console.log(`✓ ${s.id}  ${dur.toFixed(2)}s`);
}

writeFileSync(timingsPath, JSON.stringify(timings, null, 2) + '\n');
const total = Object.values(timings.scenes).reduce((a, b) => a + b, 0);
console.log(`\n내레이션 합계 ${total.toFixed(1)}초 → src/timings.json 갱신`);
