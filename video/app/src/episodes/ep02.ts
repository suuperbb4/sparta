// EP02: 코스피 반토막과 빚의 역사 (2026-11-26 기준)
// 모든 문장 끝 주석의 [A1] 같은 번호 = 팩트시트(팩트시트_EP02_코스피반토막.md) 항목.
// 번호 없는 문장은 사실 주장이 아닌 연결 문장이거나 화면 속 계산 예시입니다.
import {FOOTAGE} from '../types.ts';
import type {Episode, Scene} from '../types.ts';

const PARTS = ['빚이 쌓이던 시간', '무너진 다섯 달', '반대매매의 원리', '역사는 반복된다', '얼마나 걸렸나'];

const TICKER = [
  '코스피 장중 최고 9,385.59 (6/19)',
  '11/25 종가 4,697.51',
  '신용융자 최대 38조 6,328억 (6/24)',
  '미수금 반대매매 11/6 70억 → 11/10 630억',
  '다우 1929→1932 -89%',
  '닛케이 1989 고점 회복까지 34년',
];

const TITLE = '코스피 반토막, 그리고 빚의 역사';

const SCENES: Scene[] = [
  // ════════ 콜드 오픈 (시네마틱) ════════
  {
    id: 'o1',
    part: 0,
    cinematic: true,
    bg: FOOTAGE.market,
    bgDim: 1.25,
    lead: 1.2,
    narration: '2026년 6월 24일. 개인 투자자들이 주식을 사려고 증권사에서 빌린 돈이 38조 6천억 원을 넘었습니다. 역대 가장 많은 금액이었습니다.', // [B1]
    visual: {type: 'stamp', date: '2026.06.24', value: '38.6', unit: '조 원', label: '신용거래융자 잔고 · 역대 최대'},
    source: '이투데이·네이트 보도 (2026.7.5), 금융투자협회 집계',
    sfx: [{file: 'riser.wav', at: 0, volume: 0.35}, {file: 'impact.wav', at: 1.1, volume: 0.7}],
  },
  {
    bg: FOOTAGE.traderPhone,
    bgDim: 1.25,
    id: 'o2',
    part: 0,
    cinematic: true,
    lead: 0.4,
    narration: '그 무렵 코스피는 사상 최고치에 있었습니다. 6월 19일, 장중 9,385.', // [A1]
    visual: {type: 'stamp', date: '2026.06.19 장중', value: '9,385', label: '코스피 사상 최고치', tone: 'ink'},
    source: '디지털데일리(2026.6.19)·헤럴드경제(2026.11.25)',
    sfx: [{file: 'tick.wav', at: 0.3, volume: 0.5}],
  },
  {
    bg: FOOTAGE.redChart,
    bgDim: 1.35,
    id: 'o3',
    part: 0,
    cinematic: true,
    lead: 0.6,
    narration: '그리고 다섯 달 뒤인 11월 25일, 코스피는 4,697로 마감했습니다. 고점에서 거의 절반이 사라졌습니다.', // [A4][A5]
    visual: {
      type: 'crash',
      points: [
        {date: '6/22', value: 9114.55, label: '종가 최고'},
        {date: '9/9', value: 7051.64},
        {date: '10/2', value: 7003.74},
        {date: '11/25', value: 4697.51},
      ],
      peakNote: '코스피 종가',
      note: '확인된 종가만 연결한 그래프입니다. 실제 일별 흐름과 다릅니다.',
      dropLabel: '-48%',
      decimals: 2,
    },
    source: '헤럴드경제·굿모닝경제 (2026.11.25), 데일리연합·twig24',
    sfx: [{file: 'whoosh.wav', at: 0.2, volume: 0.5}, {file: 'impact.wav', at: 4.15, volume: 0.9}],
  },
  {
    bg: FOOTAGE.redChart,
    bgDim: 1.3,
    id: 'o4',
    part: 0,
    cinematic: true,
    narration: '그 사이 서킷브레이커가 발동됐고, 빚을 내 투자한 사람들의 주식은 강제로 팔려 나가기 시작했습니다.', // [A9][C1]
    visual: {
      type: 'headlines',
      items: [
        {outlet: '아시아경제', date: '2026.11.06', title: '코스피, 8% 하락에 서킷브레이커 발동', tag: '속보'},
        {outlet: '글로벌이코노믹', date: '2026.11.11', title: "반대매매 하루 만에 '5배'…28조 빚투 '시한폭탄' 되나", tag: '증시'},
        {outlet: '파이낸셜뉴스', date: '2026.11.12', title: "신용융자 잔고, 하루만에 1조5211억 '뚝'", tag: '증시'},
        {outlet: '헤럴드경제', date: '2026.11.25', title: "코스피 6% 폭락에 고점 대비 '반토막'…올해 사이드카 102회", tag: '증시'},
      ],
    },
    source: '각 언론사 보도 제목 인용',
  },
  {
    id: 'o5',
    part: 0,
    cinematic: true,
    narration: '그런데 이 장면, 처음이 아닙니다. 1929년 뉴욕. 1990년 서울. 2015년 상하이.', // [D1][D10][D7]
    visual: {
      type: 'yearFlash',
      items: [
        {year: '1929', city: '뉴욕', line: '주가의 10%만 내고 주식을 샀다'},
        {year: '1990', city: '서울', line: '깡통계좌 일괄 반대매매'},
        {year: '2015', city: '상하이', line: '신용융자 2조 2,700억 위안'},
      ],
      startSec: 3.1,
      slotSec: 1.8,
    },
    sfx: [{file: 'whoosh.wav', at: 2.85, volume: 0.45}, {file: 'whoosh.wav', at: 4.65, volume: 0.45}, {file: 'whoosh.wav', at: 6.45, volume: 0.45}],
  },
  {
    bg: FOOTAGE.emptyHall,
    bgDim: 1.15,
    id: 'o6',
    part: 0,
    cinematic: true,
    lead: 0.3,
    hold: 1.2,
    narration: '세 번의 폭락에는 공통점이 있었습니다. 시장에 빚이 가득했고, 하락이 시작되자 그 빚이 강제 매도로 돌아왔다는 겁니다. 오늘은 그 빚의 역사를 따라가 보겠습니다.', // [D1][D2][D8][D10]
    visual: {type: 'titleCard', kicker: '비티의 경제 · EP.02', title: '코스피 반토막, 그리고 빚의 역사', sub: '1929 · 1990 · 2015 · 2026'},
    sfx: [{file: 'impact.wav', at: 0.3, volume: 0.6}],
  },

  // ════════ 1. 빚이 쌓이던 시간 ════════
  {bg: FOOTAGE.traderPhone, bgDim: 1, id: 'ch1', part: 1, narration: '', visual: {type: 'chapter', index: 1}, sfx: [{file: 'tick.wav', at: 0.1, volume: 0.4}]},
  {
    id: 'p1a',
    part: 1,
    narration: '올해 1월, 코스피 5,000 돌파를 앞두고 빚을 내 주식을 사는 신용거래가 이미 사상 최대를 기록했습니다.', // [B5]
    visual: {type: 'doc', outlet: '네이트(뉴스) 보도', date: '2026.01.21', title: "'꿈의 오천피' 앞두고 빚내서 투자…신용거래 사상 최대", body: ['코스피 5,000 돌파를 앞두고', '신용거래 잔고가 사상 최대를 기록'], highlight: '신용거래 사상 최대'},
    source: '네이트 뉴스 (2026.1.21)',
  },
  {
    id: 'p1b',
    part: 1,
    narration: '3월에는 개인 투자자가 가장 많이 사들인 상장지수펀드 열 개 가운데 다섯 개가, 지수 움직임의 두 배를 따라가는 레버리지 상품이었습니다.', // [B4]
    visual: {
      type: 'bars',
      title: '2026년 3월 · 개인 순매수 상위 ETF 10개',
      rows: [
        {label: '2배 레버리지', value: 5, display: '5개', accent: false},
        {label: '그 외', value: 5, display: '5개', accent: true},
      ],
    },
    source: '네이트 뉴스 (2026.3.4)',
  },
  {
    bg: FOOTAGE.traderPhone,
    bgDim: 1.3,
    id: 'p1c',
    part: 1,
    narration: '2분기에는 주식을 담보로 빌린 돈까지 합친 이른바 빚투가 하루 평균 61조 9천억 원. 역대 최대였습니다. 같은 기간 증권사들이 받은 이자만 약 1조 3,600억 원입니다.', // [B2][B3]
    visual: {type: 'bigNumber', value: '61.9', unit: '조 원', label: '2분기 빚투 하루 평균 (역대 최대)', sub: '증권사 이자수익 약 1조 3,600억 원', tone: 'red'},
    source: '이투데이·헤럴드경제 (2026.7.5)',
  },
  {
    id: 'p1d',
    part: 1,
    narration: '그리고 6월. 코스피가 사상 최고치를 찍던 바로 그 시기에, 신용융자 잔고도 38조 6,328억 원으로 정점을 찍었습니다. 빚은 시장의 꼭대기에서 가장 많았습니다.', // [A1][A2][B1]
    visual: {
      type: 'doc',
      outlet: '정리',
      date: '2026년 6월',
      title: '같은 시기에 찍힌 두 개의 정점',
      body: ['6/19  코스피 장중 최고 9,385.59', '6/22  코스피 종가 최고 9,114.55', '6/24  신용융자 잔고 최대 38조 6,328억 원'],
      highlight: '38조 6,328억 원',
    },
    source: '헤럴드경제·한국일보·이투데이',
  },

  // ════════ 2. 무너진 다섯 달 ════════
  {bg: FOOTAGE.redChart, bgDim: 1, id: 'ch2', part: 2, narration: '', visual: {type: 'chapter', index: 2}, sfx: [{file: 'tick.wav', at: 0.1, volume: 0.4}]},
  {
    id: 'p2a',
    part: 2,
    narration: '고점 이후 코스피는 7,000선 아래로 밀렸다가, 9월과 10월 두 차례 7,000선을 되찾기도 했습니다. 반등이 있었던 겁니다.', // [A8]
    visual: {
      type: 'crash',
      points: [
        {date: '6/22', value: 9114.55, label: '종가 최고'},
        {date: '9/9', value: 7051.64, label: '7,000 회복'},
        {date: '10/2', value: 7003.74, label: '7,000 회복'},
      ],
      note: '확인된 종가만 연결한 그래프입니다.',
      dropLabel: '반등',
      decimals: 2,
    },
    source: '데일리연합·twig24 보도',
  },
  {
    bg: FOOTAGE.redChart,
    bgDim: 1.3,
    id: 'p2b',
    part: 2,
    narration: '하지만 11월 6일, 미국발 인공지능 투자 둔화 우려가 번지면서 코스피는 장 초반 8% 넘게 떨어졌습니다. 서킷브레이커가 발동됐습니다.', // [A9][A10]
    visual: {type: 'bigNumber', value: '-8.55', unit: '%', label: '11월 6일 오전 9시 3분 · 서킷브레이커', sub: '이어서 매도 사이드카 발동', tone: 'red'},
    source: '아시아경제·파이낸셜뉴스·뉴스1 (2026.11.6)',
    sfx: [{file: 'impact.wav', at: 0.2, volume: 0.6}],
  },
  {
    id: 'p2c',
    part: 2,
    narration: '그리고 11월 25일. 삼성전자는 9.87%, SK하이닉스는 11.05% 떨어졌고, 외국인은 하루에만 약 1조 9천억 원어치를 팔았습니다. 코스피는 4,697로 마감했습니다.', // [A4][A6][A7]
    visual: {
      type: 'bars',
      title: '2026.11.25 하루',
      rows: [
        {label: '삼성전자', value: 9.87, display: '-9.87%'},
        {label: 'SK하이닉스', value: 11.05, display: '-11.05%'},
        {label: '코스피', value: 6.16, display: '-6.16%', accent: true},
      ],
    },
    source: '굿모닝경제·미디어워치·이슈온 (2026.11.25)',
  },
  {
    id: 'p2d',
    part: 2,
    narration: '왜 이렇게 떨어졌는지에 대해서는 인공지능 투자의 수익성에 대한 의구심, 반도체 경기에 대한 우려 등 여러 분석이 나옵니다. 그런데 이번 하락에서 눈여겨볼 것이 하나 있습니다. 바로 빚입니다.', // [A10] 원인은 분석으로만, 마지막 문장은 C1·C2로 뒷받침
    visual: {type: 'question', text: '이번 하락에서 눈여겨볼 것 → 빚'},
  },

  // ════════ 3. 반대매매의 원리 ════════
  {bg: FOOTAGE.emptyHall, bgDim: 1, id: 'ch3', part: 3, narration: '', visual: {type: 'chapter', index: 3}, sfx: [{file: 'tick.wav', at: 0.1, volume: 0.4}]},
  {
    bg: FOOTAGE.traderPhone,
    bgDim: 1.35,
    id: 'p3a',
    part: 3,
    narration: '예를 들어 보겠습니다. 내 돈 1,000만 원에 증권사에서 1,000만 원을 빌려, 2,000만 원어치 주식을 샀다고 해 보죠. 증권사는 주식 가치가 빌린 돈의 일정 비율 아래로 떨어지면, 주식을 강제로 팔아 돈을 회수합니다. 이게 반대매매입니다.',
    visual: {type: 'leverage', own: 1000, borrowed: 1000, drop: 0.3, threshold: 1.4, note: '계산 예시 · 담보비율 기준 140% 가정 · 실제 기준은 증권사·상품마다 다릅니다'},
  },
  {
    bg: FOOTAGE.traderPhone,
    bgDim: 1.35,
    id: 'p3b',
    part: 3,
    narration: '기준이 140%라면, 주가가 30% 떨어지는 순간 기준에 닿습니다. 주가는 30% 떨어졌는데, 내 돈은 1,000만 원에서 400만 원, 60%가 사라진 겁니다.',
    visual: {type: 'leverage', own: 1000, borrowed: 1000, drop: 0.3, threshold: 1.4, note: '2,000만 × 0.7 = 1,400만 → 1,400 ÷ 1,000 = 140% · 내 돈 = 1,400 − 1,000 = 400만'},
    sfx: [{file: 'impact.wav', at: 4.3, volume: 0.6}],
  },
  {
    id: 'p3c',
    part: 3,
    narration: '문제는 이게 한 사람의 일이 아니라는 겁니다. 강제로 팔린 주식이 주가를 더 끌어내리고, 그러면 또 다른 사람의 담보가 부족해집니다.',
    visual: {type: 'cycle', nodes: ['주가 하락', '담보 부족', '강제 매도', '추가 하락'], center: '악순환'},
  },
  {
    id: 'p3d',
    part: 3,
    narration: '실제로 미수금 반대매매 금액은 11월 6일 70억 원에서, 9일 379억 원, 10일에는 630억 원으로 불어났습니다. 신용융자 잔고는 10일 하루에만 1조 5천억 원 넘게 줄었습니다.', // [C1][C2]
    visual: {
      type: 'bars',
      title: '미수금 반대매매 금액 (2026년 11월)',
      rows: [
        {label: '11/6', value: 70, display: '70억'},
        {label: '11/9', value: 379, display: '379억'},
        {label: '11/10', value: 630, display: '630억', accent: true},
      ],
    },
    source: '아주경제·글로벌이코노믹·파이낸셜뉴스 (2026.11.11~12)',
  },
  {
    id: 'p3e',
    part: 3,
    narration: '금융당국은 11월 9일부터 증권사의 담보비율 140% 유지 의무를 한시적으로 면제했고, 22일에는 증시안정펀드 가동 준비와 불법 공매도 특별감시에 들어갔습니다.', // [C3][C4]
    visual: {
      type: 'checklist',
      title: '정부 대응 (2026년 11월)',
      items: ['11/9  담보비율 140% 유지 의무 한시 면제 (미수금 제외)', '11/22  증시안정펀드 즉시 가동 준비', '11/22  불법 공매도 3개월 특별감시'],
    },
    source: '아주경제·뉴스웨이·디지털데일리',
  },

  // ════════ 4. 역사는 반복된다 ════════
  {bg: FOOTAGE.wallStreet, bgDim: 1, id: 'ch4', part: 4, narration: '', visual: {type: 'chapter', index: 4}, sfx: [{file: 'tick.wav', at: 0.1, volume: 0.4}]},
  {
    bg: FOOTAGE.wallStreet,
    bgDim: 1.15,
    id: 'p4a',
    part: 4,
    narration: '1929년 미국. 당시에는 주식값의 10%만 내고, 나머지는 빌려서 주식을 사는 일이 가능했습니다. 그해 여름 증권사들이 빌려준 돈은 약 85억 달러. 당시 미국에 풀린 현금보다 많았습니다.', // [D1][D2]
    visual: {type: 'stamp', date: '1929 · NEW YORK', value: '85', unit: '억 달러', label: '증권사 대출 · 당시 미국 통화량보다 많았다'},
    source: 'Wikipedia(Wall Street Crash of 1929), EBSCO, ABA Journal',
  },
  {
    bg: FOOTAGE.wallStreet,
    bgDim: 1.35,
    id: 'p4b',
    part: 4,
    narration: '1929년 9월 381이던 다우지수는, 1932년 7월 41까지 떨어졌습니다. 89%가 사라졌습니다.', // [D3]
    visual: {
      type: 'crash',
      points: [
        {date: '1929.9.3', value: 381.17, label: '고점'},
        {date: '1932.7.8', value: 41.22, label: '저점'},
      ],
      note: '다우존스 산업평균 종가 · 두 시점만 연결',
      dropLabel: '-89%',
      decimals: 2,
    },
    source: 'Benzinga·MoneyWeek·Motley Fool',
    sfx: [{file: 'impact.wav', at: 4.2, volume: 0.7}],
  },
  {
    bg: FOOTAGE.seoul,
    bgDim: 1.15,
    id: 'p4c',
    part: 4,
    narration: '1990년 서울. 1989년 봄 사상 처음 1,000을 넘었던 코스피는 이후 하락장이 길어졌고, 담보가 바닥난 이른바 깡통계좌가 쌓였습니다. 1990년 10월 10일, 이 계좌들은 한꺼번에 반대매매됐습니다.', // [D9][D10]
    visual: {type: 'stamp', date: '1990.10.10 · SEOUL', value: '100', unit: '% 미만', label: '담보비율 100% 미만 깡통계좌 일괄 반대매매'},
    source: '머니투데이·파이낸셜리뷰',
  },
  {
    bg: FOOTAGE.shanghai,
    bgDim: 1.25,
    id: 'p4d',
    part: 4,
    narration: '2015년 중국. 신용융자는 6월 중순 2조 2,700억 위안으로 정점을 찍었고, 상하이 지수는 한 달이 채 안 돼 약 32% 떨어졌습니다. 당시 HSBC의 한 애널리스트는 이렇게 말했습니다. 신용은 오를 때 시장의 주된 동력이었고, 내려갈 때도 핵심 동력이 될 것이다.', // [D7][D8]
    visual: {
      type: 'doc',
      outlet: 'Fortune 인용 · HSBC 애널리스트',
      date: '2015.06.29',
      title: '"Margin financing was the primary market driver on the way up"',
      body: ['신용은 오를 때 시장의 주된 동력이었고,', '내려갈 때도 핵심 동력이 될 것이다.', '2015 신용융자 정점 2.27조 위안 → 상하이 지수 약 -32%'],
      highlight: 'primary market driver',
    },
    source: 'Fortune(2015.6.29), DNB, The China Story',
  },

  // ════════ 5. 얼마나 걸렸나 ════════
  {bg: FOOTAGE.clock, bgDim: 1, id: 'ch5', part: 5, narration: '', visual: {type: 'chapter', index: 5}, sfx: [{file: 'tick.wav', at: 0.1, volume: 0.4}]},
  {
    bg: FOOTAGE.tokyo,
    bgDim: 1.3,
    id: 'p5a',
    part: 5,
    narration: '그렇다면 이전 고점을 되찾기까지는 얼마나 걸렸을까요. 나스닥은 2000년 고점을 2015년에야 넘었습니다. 15년. 다우지수는 1954년, 25년이 걸렸습니다. 일본 닛케이는 1989년 고점을 2024년 2월에야 넘어섰습니다. 34년입니다.', // [D4][D5][D6]
    visual: {
      type: 'hbars',
      title: '이전 고점을 되찾기까지',
      rows: [
        {label: '나스닥', sub: '2000 → 2015', value: 15, display: '15년'},
        {label: '다우지수', sub: '1929 → 1954', value: 25, display: '25년'},
        {label: '닛케이', sub: '1989 → 2024', value: 34, display: '34년'},
      ],
      note: '명목 지수 기준 · 배당과 물가를 감안하면 다우 회복은 더 짧았다는 분석도 있습니다',
    },
    source: 'Fortune·Benzinga·Bloomberg·Boston Globe',
  },
  {
    bg: FOOTAGE.clock,
    bgDim: 1.15,
    id: 'p5b',
    part: 5,
    narration: '물론 모든 폭락이 이렇게 길었던 건 아닙니다. 지금 코스피가 언제 회복할지, 더 떨어질지는 누구도 단정할 수 없습니다.',
    visual: {type: 'question', text: '이번엔 얼마나? → 단정할 수 없다'},
  },
  {
    bg: FOOTAGE.emptyHall,
    bgDim: 1.3,
    id: 'p5c',
    part: 5,
    narration: '다만 역사가 반복해서 보여준 패턴은 있습니다. 빚은 시장의 꼭대기에서 가장 많았고, 빚을 진 사람은 하락을 버틸 시간을 고를 수 없었습니다. 주가가 30% 떨어질 때, 빚을 낸 사람의 돈은 60%가 사라질 수 있습니다.', // [B1 vs A1][계산 예시]
    visual: {
      type: 'checklist',
      title: '역사가 반복해서 보여준 것',
      items: ['빚은 꼭대기에서 가장 많았다 (2026.6 · 1929 · 2015)', '빚이 있으면 버틸 시간을 고를 수 없다', '주가 -30%가 내 돈 -60%가 될 수 있다', '회복 시간은 누구도 장담하지 못했다'],
    },
  },
  {
    id: 'closing',
    part: 0,
    hold: 8,
    narration: '오늘 영상은 여기까지입니다. 이 영상은 투자 권유가 아니며, 확인된 사실만으로 구성했습니다. 매일 경제 소식을 더 빠르게 받아보고 싶으시다면, 카카오톡에서 비티의 경제를 검색해 주세요. 그럼 다음 이야기로 다시 찾아오겠습니다.',
    visual: {type: 'closing', brand: '비티의 경제', kakao: '카카오톡에서 「비티의 경제」 검색'},
  },
];

export const EP02: Episode = {id: 'ep02', title: TITLE, parts: PARTS, ticker: TICKER, scenes: SCENES};
