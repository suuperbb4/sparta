// 영상 대본 + 장면 정의.
// 이 파일 하나만 고치면 내레이션(TTS), 자막, 화면이 함께 바뀝니다.
// 모든 숫자는 ../../research/factsheet.md 에 출처가 있어야 합니다.

export type Visual =
  | {type: 'hook'; lines: string[]}
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
  | {type: 'checklist'; title: string; items: string[]};

export type Scene = {
  id: string;
  part: number; // 0 = 오프닝
  narration: string; // TTS로 읽을 문장
  visual: Visual;
  source?: string; // 화면 왼쪽 위 출처 라벨
};

export const PARTS = [
  '오늘 무슨 일이',
  '왜 지금 올렸나',
  '2030조 원의 빚',
  '내 이자는 얼마나',
  '미국과 다음 수',
];

// 화면 위 상태바와 아래 시세 띠에 계속 흐르는 지표 (팩트시트에 출처 있음)
export const STATUS = [
  {k: 'BOK', v: '3.25%', d: '▲0.25', up: true},
  {k: 'FED', v: '4.00%', d: '상단', up: null},
  {k: 'KOSPI', v: '4,697.51', d: '▼6.16% (11/25)', up: false},
];
export const TICKER = [
  '기준금리 3.00% → 3.25%',
  '성장률 전망 2026 3.9% · 2027 4.1%',
  '10월 소비자물가 2.8% · 근원 2.8%',
  '가계신용 2,030.5조 원 (3Q)',
  '10월 신규 주담대 4.98%',
  '한미 금리차 0.75%p',
];

export const TITLE = '2년 만의 금리 인상, 내 대출이자는 얼마나 늘어날까';

export const SCENES: Scene[] = [
  // ── 오프닝 ─────────────────────────────
  {
    id: 'hook1',
    part: 0,
    narration: '수출은 사상 처음 1조 달러를 넘었고, 성장률 전망은 4%대로 올라갔습니다.',
    visual: {type: 'hook', lines: ['수출 1조 달러', '내년 성장률 전망 4.1%']},
    source: '산업통상부(2026.11.19) · 한국은행 수정경제전망(2026.11.26)',
  },
  {
    id: 'hook2',
    part: 0,
    narration: '그런데 바로 그 순간, 한국은행은 브레이크를 밟았습니다.',
    visual: {type: 'bigNumber', value: '3.25', unit: '%', label: '기준금리 인상', sub: '2026.11.26 금융통화위원회', tone: 'red'},
  },
  {
    id: 'hook3',
    part: 0,
    narration: '경제가 좋다는데 왜 금리를 올렸을까요? 그리고 이 결정은 우리 대출이자를 얼마나 바꿀까요?',
    visual: {type: 'question', text: '경제가 좋은데, 왜 브레이크를?'},
  },

  // ── 1. 오늘 무슨 일이 ─────────────────────
  {id: 'ch1', part: 1, narration: '', visual: {type: 'chapter', index: 1}},
  {
    id: 'p1a',
    part: 1,
    narration: '11월 26일, 한국은행 금융통화위원회는 기준금리를 연 3%에서 3.25%로 0.25%포인트 올렸습니다.',
    visual: {
      type: 'doc',
      outlet: '한국은행 통화정책방향',
      date: '2026.11.26',
      title: '기준금리 3.00% → 3.25%',
      body: ['금융통화위원회는 다음 통화정책방향 결정시까지', '한국은행 기준금리를 3.25%로 상향 조정하여', '통화정책을 운용하기로 하였다.'],
      highlight: '3.25%로 상향 조정',
    },
    source: '서울신문·파이낸셜뉴스 보도 (2026.11.26)',
  },
  {
    id: 'p1b',
    part: 1,
    narration: '올해 7월과 8월에 이어 세 번째 인상입니다. 10월에 한 번 쉬어 갔다가, 석 달 만에 다시 올린 겁니다.',
    visual: {
      type: 'rateSteps',
      steps: [
        {label: '상반기', value: 2.5},
        {label: '7월', value: 2.75},
        {label: '8월', value: 3.0},
        {label: '10월', value: 3.0},
        {label: '11월', value: 3.25},
      ],
      highlight: 4,
    },
    source: 'ZDNet·재경일보·SBS Biz 보도 (2026.11.26)',
  },
  {
    id: 'p1c',
    part: 1,
    narration: '3.25%는 2024년 11월 이후, 약 2년 만에 가장 높은 수준입니다.',
    visual: {type: 'bigNumber', value: '2', unit: '년 만', label: '가장 높은 기준금리', sub: '2024년 11월 이후 최고', tone: 'ink'},
    source: '파이낸셜뉴스 (2026.11.26)',
  },
  {
    id: 'p1d',
    part: 1,
    narration: '다만 만장일치는 아니었습니다. 위원 일곱 명 중 두 명은 금리를 그대로 두자는 의견을 냈습니다.',
    visual: {type: 'vote', yes: 5, no: 2, noNames: '황건일 · 이수형 위원 (3.00% 유지)'},
    source: '이코노믹리뷰 (2026.11.26)',
  },

  // ── 2. 왜 지금 올렸나 ─────────────────────
  {id: 'ch2', part: 2, narration: '', visual: {type: 'chapter', index: 2}},
  {
    id: 'p2a',
    part: 2,
    narration: '첫 번째 이유는 경기가 예상보다 훨씬 뜨겁다는 겁니다. 한국은행은 이날 성장률 전망을 크게 올렸습니다.',
    visual: {
      type: 'compare',
      title: '한국은행 성장률 전망',
      rows: [
        {label: '2026년', before: 3.3, after: 3.9, unit: '%'},
        {label: '2027년', before: 2.9, after: 4.1, unit: '%'},
      ],
    },
    source: '한국은행 수정경제전망 · 파이낸셜뉴스 (2026.11.26) · 이전값은 8월 전망',
  },
  {
    id: 'p2b',
    part: 2,
    narration: '결정문은 그 배경으로 반도체 경기 호조, 그리고 수출과 투자의 높은 증가세를 꼽았습니다.',
    visual: {
      type: 'doc',
      outlet: '통화정책방향 결정문',
      date: '2026.11.26',
      title: '국내경제',
      body: ['반도체 경기 호조의 영향으로', '수출과 투자의 높은 증가세가 지속되고', '성장세가 한층 강화되었다.'],
      highlight: '반도체 경기 호조',
    },
    source: '한국금융신문·네이트(뉴스1) 결정문 인용',
  },
  {
    id: 'p2c',
    part: 2,
    narration: '두 번째 이유는 물가입니다. 10월 소비자물가는 1년 전보다 2.8% 올랐고, 변동이 큰 식료품과 에너지를 뺀 근원물가도 똑같이 2.8% 올랐습니다.',
    visual: {
      type: 'bars',
      title: '2026년 10월 물가 (전년 동월 대비)',
      rows: [
        {label: '소비자물가', value: 2.8, display: '2.8%'},
        {label: '근원물가', value: 2.8, display: '2.8%'},
        {label: '물가 목표', value: 2.0, display: '2.0%', accent: true},
      ],
    },
    source: '국가데이터처 「2026년 10월 소비자물가동향」(2026.11.3)',
  },
  {
    id: 'p2d',
    part: 2,
    narration: '특히 석유류는 14.9%나 뛰었습니다. 정부는 석유 최고가격제가 없었다면 물가가 0.8%포인트 더 높았을 거라고 추산했습니다.',
    visual: {type: 'bigNumber', value: '14.9', unit: '%', label: '석유류 가격 상승률 (10월)', sub: '최고가격제 효과: 물가 0.8%p 낮춤 (정부 추산)', tone: 'red'},
    source: '머니투데이·뉴스핌 (2026.11.3)',
  },
  {
    id: 'p2e',
    part: 2,
    narration: '한국은행은 물가가 상당 기간 목표인 2%를 웃돌 것으로 내다봤습니다. 경기는 뜨겁고 물가는 높으니, 열을 식히겠다는 판단입니다.',
    visual: {
      type: 'doc',
      outlet: '통화정책방향 결정문',
      date: '2026.11.26',
      title: '물가',
      body: ['물가상승률은 상당기간 목표수준을', '상회할 것으로 예상된다.'],
      highlight: '상당기간 목표수준을',
    },
    source: '네이트(뉴스1) 결정문 인용',
  },

  // ── 3. 2030조 원의 빚 ─────────────────────
  {id: 'ch3', part: 3, narration: '', visual: {type: 'chapter', index: 3}},
  {
    id: 'p3a',
    part: 3,
    narration: '세 번째 이유는 빚입니다. 올해 3분기 말 우리나라 가계 빚은 2030조 5000억 원. 통계 작성 이래 가장 많습니다.',
    visual: {type: 'bigNumber', value: '2,030.5', unit: '조 원', label: '가계신용 잔액 (2026년 3분기 말)', sub: '통계 작성 이래 최대', tone: 'ink'},
    source: '한국은행 「2026년 3분기 가계신용」(2026.11.18)',
  },
  {
    id: 'p3b',
    part: 3,
    narration: '다만 늘어나는 속도는 줄었습니다. 2분기에는 26조 원 넘게 늘었는데, 3분기에는 9조 8000억 원 늘었습니다.',
    visual: {
      type: 'bars',
      title: '가계신용 분기 증가액',
      rows: [
        {label: '2분기', value: 26.4, display: '+26.4조'},
        {label: '3분기', value: 9.8, display: '+9.8조', accent: true},
      ],
    },
    source: '한국은행 가계신용 · 연합뉴스 보도 (2026.11.18)',
  },
  {
    id: 'p3c',
    part: 3,
    narration: '그래서 결정문에는 수도권 주택시장과 가계부채에 따른 금융불균형 위험에 계속 유의하겠다는 문장이 들어갔습니다.',
    visual: {
      type: 'doc',
      outlet: '통화정책방향 결정문',
      date: '2026.11.26',
      title: '금융안정',
      body: ['수도권 주택시장 및 가계부채와 관련한', '금융불균형 위험에 계속 유의할 필요가 있다.'],
      highlight: '수도권 주택시장 및 가계부채',
    },
    source: '파이낸셜뉴스 결정문 인용 (2026.11.26)',
  },

  // ── 4. 내 이자는 얼마나 ─────────────────────
  {id: 'ch4', part: 4, narration: '', visual: {type: 'chapter', index: 4}},
  {
    id: 'p4a',
    part: 4,
    narration: '대출금리는 이미 오르고 있었습니다. 10월에 새로 나간 주택담보대출 평균 금리는 4.98%. 14년여 만에 가장 높습니다.',
    visual: {type: 'bigNumber', value: '4.98', unit: '%', label: '10월 신규 주택담보대출 평균 금리', sub: '14년여 만의 최고', tone: 'red'},
    source: '한국은행 금융기관 가중평균금리 · 뉴데일리 (2026.11.25)',
  },
  {
    id: 'p4b',
    part: 4,
    narration: '그럼 이번 인상으로 이자는 얼마나 늘까요? 0.25%포인트가 대출금리에 그대로 반영된다고 단순하게 가정하면, 1억 원당 1년에 25만 원입니다.',
    visual: {
      type: 'calc',
      principal: '대출금리 +0.25%p 가정',
      rows: [
        {label: '1억 원', value: '연 25만 원'},
        {label: '3억 원', value: '연 75만 원'},
        {label: '5억 원', value: '연 125만 원'},
      ],
      note: '단순 계산 · 실제 반영 폭과 시점은 대출 조건마다 다름',
    },
    source: '단순 계산: 대출 원금 × 0.25%',
  },
  {
    id: 'p4c',
    part: 4,
    narration: '하지만 이건 어디까지나 단순 계산입니다. 은행마다 반영하는 폭과 시점이 다르고, 고정금리라면 당장은 영향이 없을 수도 있습니다.',
    visual: {
      type: 'checklist',
      title: '내 대출, 이것부터 확인',
      items: ['변동금리인가, 고정금리인가', '금리가 다시 정해지는 주기 (3개월·6개월 등)', '연동된 기준 (코픽스·금융채 등)'],
    },
  },

  // ── 5. 미국과 다음 수 ─────────────────────
  {id: 'ch5', part: 5, narration: '', visual: {type: 'chapter', index: 5}},
  {
    id: 'p5a',
    part: 5,
    narration: '미국 기준금리의 상단은 4%. 이번 인상으로 두 나라의 금리 차이는 0.75%포인트로 줄었습니다.',
    visual: {type: 'gap', kr: 3.25, us: 4.0},
    source: '파이낸셜뉴스 (2026.11.26)',
  },
  {
    id: 'p5b',
    part: 5,
    narration: '그런데 시장에서는 12월 미국 연준이 금리를 올릴 가능성을 높게 보고 있습니다. 그렇게 되면 금리 차이는 다시 벌어질 수 있습니다.',
    visual: {
      type: 'doc',
      outlet: '시장 전망',
      date: '2026.11.26 기준',
      title: '12월 FOMC (12월 8~9일)',
      body: ['금리 선물 시장은 연준의 0.25%p 인상 가능성을', '높게 반영하고 있다.', '※ 전망은 매일 바뀝니다'],
      highlight: '인상 가능성',
    },
    source: 'CME FedWatch 인용 보도 · 전망치는 변동',
  },
  {
    id: 'p5c',
    part: 5,
    narration: '흥미로운 점도 있습니다. 지난번 결정문에 있던 추가 인상의 시기와 속도라는 표현에서, 이번엔 속도라는 단어가 빠졌습니다.',
    visual: {
      type: 'doc',
      outlet: '결정문 문구 비교',
      date: '10월 → 11월',
      title: '"추가 인상의 시기와 속도"',
      body: ['10월: 추가 인상의 시기와 속도 등을 결정', '11월: 추가 인상의 시기 등을 결정', '→ \'속도\' 삭제'],
      highlight: '속도',
    },
    source: '네이트(뉴스1)·파이낸셜뉴스 (2026.11.26)',
  },
  {
    id: 'p5d',
    part: 5,
    narration: '이걸 두고 인상을 서두르지 않겠다는 신호라는 해석이 나오지만, 한국은행이 직접 그렇게 말한 건 아닙니다. 다음 인상이 언제일지는, 지금으로선 누구도 단정할 수 없습니다.',
    visual: {type: 'question', text: '다음 인상은 언제? → 아직 단정할 수 없다'},
  },
  {
    id: 'outro',
    part: 5,
    narration: '정리하면, 경기는 뜨겁고, 물가는 높고, 빚은 사상 최대입니다. 한국은행은 그 사이에서 브레이크를 밟기로 했습니다. 지금 내 대출이 변동금리라면, 금리가 다시 정해지는 날짜부터 확인해 보시길 바랍니다.',
    visual: {
      type: 'checklist',
      title: '오늘의 요약',
      items: ['기준금리 3.25% · 2년 만의 최고', '성장 강하고 물가 목표 상회', '가계 빚 2030조 원 사상 최대', '이자: 1억당 연 25만 원 (단순 계산)'],
    },
  },
];
