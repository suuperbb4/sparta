// btcard/cards/날짜/시리즈/이미지 폴더 구조를 읽어 btcard/feed.json을 만듭니다.
// 사용법: node scripts/build-feed.mjs
import { readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../btcard/', import.meta.url).pathname;
const CARDS = join(ROOT, 'cards');
const IMG = /\.(png|jpe?g|webp|gif|svg)$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const dirs = (p) => (existsSync(p) ? readdirSync(p).filter((n) => statSync(join(p, n)).isDirectory()) : []);
const byName = (a, b) => a.localeCompare(b, 'en', { numeric: true });

const days = dirs(CARDS)
  .filter((d) => DATE.test(d))
  .sort()
  .reverse()
  .map((date) => ({
    date,
    sets: dirs(join(CARDS, date))
      .map((series) => ({
        series,
        cards: readdirSync(join(CARDS, date, series)).filter((f) => IMG.test(f)).sort(byName)
          .map((f) => `cards/${date}/${series}/${f}`),
      }))
      .filter((s) => s.cards.length),
  }))
  .filter((d) => d.sets.length);

writeFileSync(join(ROOT, 'feed.json'), JSON.stringify({ days }, null, 2) + '\n');
console.log(`feed.json: ${days.length}일, ${days.reduce((n, d) => n + d.sets.reduce((m, s) => m + s.cards.length, 0), 0)}장`);
