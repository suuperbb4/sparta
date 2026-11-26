// 모든 편이 공유하는 타입과 스톡 영상 목록

export type Headline = {outlet: string; date: string; title: string; tag?: string};

export type Visual =
  | {type: 'hook'; lines: string[]}
  | {type: 'headlines'; items: Headline[]; stamp?: string}
  | {type: 'chapter'; index: number}
  | {type: 'bigNumber'; value: string; unit?: string; label: string; sub?: string; tone?: 'red' | 'ink'}
  | {type: 'rateSteps'; steps: {label: string; value: number}[]; highlight: number}
  | {type: 'vote'; yes: number; no: number; noNames: string}
  | {type: 'doc'; outlet: string; date: string; title: string; body: string[]; highlight?: string}
  | {type: 'compare'; title: string; rows: {label: string; before: number; after: number; unit: string}[]}
  | {type: 'bars'; title: string; rows: {label: string; value: number; display: string; accent?: boolean}[]}
  | {type: 'calc'; principal: string; rows: {label: string; value: string}[]; note: string}
  | {type: 'gap'; kr: number; us: number}
  | {type: 'question'; text: string}
  | {type: 'checklist'; title: string; items: string[]}
  | {type: 'closing'; brand: string; kakao: string}
  // ── EP02 시네마틱 부품 ──
  | {type: 'stamp'; date: string; value: string; unit?: string; label: string; tone?: 'red' | 'ink'}
  | {type: 'crash'; points: {date: string; value: number; label?: string}[]; peakNote?: string; note: string; dropLabel: string; decimals?: number}
  | {type: 'yearFlash'; items: {year: string; city: string; line: string}[]; startSec?: number; slotSec?: number}
  | {type: 'titleCard'; kicker: string; title: string; sub?: string}
  | {type: 'cycle'; nodes: string[]; center: string}
  | {type: 'leverage'; own: number; borrowed: number; drop: number; threshold: number; note: string}
  | {type: 'hbars'; title: string; rows: {label: string; value: number; display: string; sub?: string}[]; note?: string};

export type Footage = {clip: string; seconds: number; credit: string};

// 무료 스톡 영상 (Pexels 등). 파일은 public/stock/ 에 두고 저장소에는 올리지 않음
export const FOOTAGE = {
  market: {clip: 'stock/market.mp4', seconds: 12.8, credit: '영상: Rafael Minguet Delgado / Pexels'},
  bok: {clip: 'stock/bok.mp4', seconds: 10.2, credit: '영상: FREE VIDEO HAPPY / Pexels'},
  port: {clip: 'stock/port.mp4', seconds: 16, credit: '영상: Toàn BDS / Pexels'},
  apartments: {clip: 'stock/apartments.mp4', seconds: 16, credit: '영상: Aaron Hairston / Pexels'},
  calculator: {clip: 'stock/calculator.mp4', seconds: 10.3, credit: '영상: Mikhail Nilov / Pexels'},
} satisfies Record<string, Footage>;

export type Scene = {
  bg?: Footage; // 배경 영상 (선택)
  hold?: number; // 내레이션이 끝난 뒤 화면을 더 보여줄 시간(초). 유튜브 최종 화면용
  lead?: number; // 내레이션 시작 전 여백(초). 화면이 먼저 나오고 말이 뒤따르게
  seconds?: number; // 장면 길이를 직접 지정 (내레이션 없는 연출 장면)
  cinematic?: boolean; // 위아래 검은 띠 + 그레인, 시세 띠 숨김 (오프닝용)
  noTicker?: boolean; // 시세 띠 숨김
  bgDim?: number; // 배경 영상 어둡게 덮는 정도 (기본 1)
  sfx?: {file: string; at: number; volume?: number}[]; // 효과음 (public/sfx/, 장면 시작 기준 초)
  id: string;
  part: number; // 0 = 오프닝
  narration: string; // TTS로 읽을 문장
  visual: Visual;
  source?: string; // 화면 왼쪽 위 출처 라벨
};

export type Episode = {
  id: string; // 'ep01' → 음성은 public/audio/ep01/, 타이밍은 src/timings/ep01.json
  title: string;
  parts: string[]; // 챕터 이름
  ticker: string[]; // 아래 시세 띠 문구 (팩트시트에 출처 있는 것만)
  scenes: Scene[];
};
