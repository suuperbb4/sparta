# 텔레그램 승인 → 비티 카드 자동 발행 (n8n 연결 안내)

지금 흐름: 카드 생성 → 텔레그램 승인 메시지 → **승인** 버튼 → n8n이 인스타·쓰레드에 게시.
여기에 한 갈래만 더하면 됩니다: **승인 → 비티 카드 앱에도 올리기.**

## 준비 (한 번만)

1. GitHub에서 토큰을 만듭니다: Settings → Developer settings → Fine-grained tokens
   - Repository access: `suuperbb4/sparta` 하나만
   - Permissions: Contents → Read and write
2. n8n의 자격 증명(Credentials)에 저장합니다. 토큰을 워크플로 본문이나 프롬프트에 직접 쓰지 않습니다.

## 승인 처리 워크플로에 추가할 단계

승인 콜백(`btmkt:ok:<작업ID>` 등)을 받은 뒤, 인스타 게시와 나란히 아래를 실행합니다.

| 순서 | 노드 | 내용 |
|---|---|---|
| 1 | 값 정리 | `date` = 발행일(YYYY-MM-DD, 한국시간), `series` = `market` / `morning` / `world` / `weekly`, 파일 목록 = 승인 메시지의 FILE1\|FILE2\|… |
| 2 | 반복 | 파일마다 순서 번호 `NN`(01, 02, …)을 붙여 3~5단계를 실행 |
| 3 | Telegram `getFile` | `file_id`로 `file_path`를 받음 |
| 4 | HTTP 다운로드 | 텔레그램 파일 주소에서 이미지를 바이너리로 받음 |
| 5 | GitHub 파일 만들기 | 경로 `btcard/cards/{date}/{series}/{NN}.jpg`, 커밋 메시지 `카드 {date} {series} {NN}` |
| 6 | GitHub 파일 만들기 | (짧은 글이 있으면) 경로 `btcard/cards/{date}/{series}/text.txt`, 내용 = 쓰레드 글 |

n8n의 GitHub 노드(Create file)를 쓰거나, HTTP 노드로 아래 요청을 보내면 됩니다.

```
PUT https://api.github.com/repos/suuperbb4/sparta/contents/btcard/cards/{date}/{series}/{NN}.jpg
Authorization: Bearer <n8n 자격 증명>
Accept: application/vnd.github+json

{ "message": "카드 {date} {series} {NN}", "content": "<이미지 base64>", "branch": "main" }
```

올라가면 GitHub Actions가 `feed.json`을 다시 만들고, 1~2분 안에 앱에 나타납니다.
같은 경로에 다시 올릴 때(수정 재승인)는 요청 본문에 기존 파일의 `sha`를 함께 넣어야 덮어쓸 수 있습니다.

## 시리즈 이름 대응

| 자동화 | series 폴더 |
|---|---|
| MARKET 데일리 브리핑 3장 | `market` |
| 모닝 카드뉴스 9장 | `morning` |
| 5분 세상읽기 9장 | `world` |
| 주간 비티 | `weekly` |
