// 장면별 시작 프레임 출력: npm run -s layout -- ep02  (Main.tsx 의 sceneSeconds 와 같은 계산)
import {readFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const epId = process.argv[2] ?? 'ep02';
const ep = (await import(join(root, `src/episodes/${epId}.ts`)))[epId.toUpperCase()];
const t = JSON.parse(readFileSync(join(root, `src/timings/${epId}.json`), 'utf8')).scenes ?? {};
let f = 0;
for (const s of ep.scenes) {
  let sec;
  if (s.seconds) sec = s.seconds;
  else if (!s.narration) sec = 2.6;
  else sec = (s.lead ?? 0) + (t[s.id] ?? Math.max(3, s.narration.replace(/\s/g, '').length / 7)) + 0.45 + (s.hold ?? 0);
  const d = Math.round(sec * 30);
  console.log(`${s.id}\t${f}\t${d}`);
  f += d;
}
console.log(`TOTAL\t${f}\t${(f / 30).toFixed(1)}s`);
