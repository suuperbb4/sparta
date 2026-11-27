#!/usr/bin/env bash
# 비티 노트 앱에 카드 한 묶음을 올린다. 자동화(클로드 예약 작업, 로컬 세션, NAS)에서 공통으로 쓴다.
#
# 사용: bash scripts/btnote-publish.sh 발행일 시리즈 이미지폴더_또는_파일들 [캡션파일]
#   발행일   YYYY-MM-DD (한국 시간)
#   시리즈   morning | market | world | weekly
#   이미지   폴더 하나(안의 이미지를 파일 이름 순서대로) 또는 쉼표로 이은 파일 목록(그 순서대로)
#   캡션파일 텍스트 파일(선택). 앱에서 카드 마지막 장으로 보인다.
#
# 이미지·캡션만 커밋한다. 미리보기(thumb.jpg)와 목록(feed.json)은 GitHub Actions가 1~2분 안에 만든다.
set -euo pipefail

DATE=${1:?발행일}; SERIES=${2:?시리즈}; SRC=${3:?이미지}; CAP=${4:-}
BRANCH=${BTNOTE_BRANCH:-claude/youthful-hopper-tkvfr8}
[[ $DATE =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || { echo "발행일 형식 오류: $DATE" >&2; exit 1; }
[[ $SERIES =~ ^(morning|market|world|weekly)$ ]] || { echo "시리즈 오류: $SERIES" >&2; exit 1; }

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"
git fetch -q --depth 20 origin "$BRANCH"
git checkout -q -B "$BRANCH" "origin/$BRANCH"

# 이미지 목록 만들기
FILES=()
if [[ -d $SRC ]]; then
  while IFS= read -r f; do FILES+=("$f"); done < <(find "$SRC" -maxdepth 1 -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.webp' \) ! -iname 'thumb.*' | sort -V)
else
  IFS=',' read -ra FILES <<< "$SRC"
fi
(( ${#FILES[@]} > 0 )) || { echo "이미지가 없습니다: $SRC" >&2; exit 1; }

DIR="btcard/cards/$DATE/$SERIES"
rm -rf "$DIR"; mkdir -p "$DIR"
i=0
for f in "${FILES[@]}"; do
  i=$((i + 1)); out=$(printf '%s/%02d.jpg' "$DIR" "$i")
  # 가로 1080px 이하 JPEG로 (Pillow가 없으면 원본 그대로 복사)
  if python3 -c 'import PIL' 2>/dev/null; then
    python3 -I - "$f" "$out" <<'PY'
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB')
if im.width > 1080: im = im.resize((1080, round(im.height * 1080 / im.width)), Image.LANCZOS)
im.save(sys.argv[2], 'JPEG', quality=88, optimize=True)
PY
  else
    ext="${f##*.}"; cp "$f" "${out%.jpg}.${ext,,}"
  fi
done
[[ -n $CAP && -s $CAP ]] && cp "$CAP" "$DIR/text.txt"

git add "$DIR"
git -c user.name="btnote-bot" -c user.email="btnote-bot@users.noreply.github.com" commit -q -m "카드 발행 $DATE $SERIES (${#FILES[@]}장)"
for n in 1 2 3 4; do
  git push -q origin "HEAD:$BRANCH" && { echo "비티 노트 발행 완료: $DATE $SERIES ${#FILES[@]}장${CAP:+ + 캡션}"; exit 0; }
  sleep $((n * 3)); git pull -q --rebase origin "$BRANCH"
done
echo "푸시 실패" >&2; exit 1
