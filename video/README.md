# 경제 영상 제작 파이프라인 (Claude Code + Remotion)

첫 영상: **「2년 만의 금리 인상, 내 대출이자는 얼마나 늘어날까」** (2026-11-26 한국은행 기준금리 인상)

```
video/
├─ research/factsheet.md   ← 모든 숫자의 출처·확인 수준 (업로드 전 ❓ 항목 확인)
└─ app/                    ← Remotion 프로젝트
   ├─ src/script.ts        ← 대본 + 장면 정의 (이것만 고치면 됨)
   ├─ src/Visuals.tsx      ← 장면 부품 (큰 숫자, 문서 카드, 그래프, 표결, 계산기 …)
   ├─ src/theme.tsx        ← 색·폰트·종이 배경·자막·출처 라벨
   ├─ src/Main.tsx         ← 장면 배치, 자막 타이밍, 오디오
   ├─ src/timings.json     ← TTS가 생성 (장면별 음성 길이)
   └─ tools/tts.mjs        ← Google Cloud TTS로 장면별 mp3 생성
```

## 작업 순서

1. `research/factsheet.md`에 사실과 출처를 정리
2. `app/src/script.ts`에 장면별 내레이션과 화면 종류를 작성
3. AI 음성 생성: `npm run tts` (음성: `-- --voice ko-KR-Chirp3-HD-Algenib --rate 1.04`)
4. 미리보기: `npm run preview` → `out/preview.mp4` (절반 해상도)
5. 최종본: `npm run render` → `out/video.mp4` (1920×1080)
6. (선택) 배경음악: `public/bgm.mp3`를 넣고 `src/timings.json`에 `"bgm": "bgm.mp3"` 추가

## 장면 종류 (`visual.type`)

| type | 용도 |
|---|---|
| `hook` | 오프닝 큰 문구 |
| `chapter` | 파트 전환 화면 |
| `bigNumber` | 숫자 카운트업 (3.25%, 2,030.5조 …) |
| `rateSteps` | 금리 계단 그래프 |
| `vote` | 금통위 표결 인원 |
| `doc` | 브라우저 창 모양 문서 카드 + 형광펜 |
| `compare` | 이전 → 이후 막대 비교 |
| `bars` | 세로 막대 |
| `calc` | 대출 이자 계산표 |
| `gap` | 한국 vs 미국 금리 |
| `question` | 타이핑되는 질문 |
| `checklist` | 체크리스트 / 요약 |

## 팩트 원칙

- 확인된 수치만 단정해서 말하기. 해석은 "~라는 해석이 나온다", 전망은 "시장에서는 ~로 보고 있다".
- 아무도 모르는 것(다음 인상 시점 등)은 "단정할 수 없다"로 처리.
- 계산값은 "단순 계산" 가정을 반드시 밝히기.
- 투자 권유로 들릴 표현 금지.
