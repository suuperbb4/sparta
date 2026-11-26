#!/usr/bin/env bash
# 스톡 영상을 렌더링용 규격으로 변환: 1920x1080, 30fps, 영상 트랙만(소리·타임코드·데이터 트랙 제거)
# 사용: bash tools/prep_clip.sh 원본.mp4 이름 [시작초] [배속(2=반속 슬로모션)]
# 결과: public/stock/이름.mp4
set -e
SRC="$1"; NAME="$2"; START="${3:-0}"; SLOW="${4:-1}"
OUT="$(dirname "$0")/../public/stock/$NAME.mp4"
VF="scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30"
if [ "$SLOW" != "1" ]; then VF="setpts=${SLOW}*PTS,minterpolate=fps=30:mi_mode=blend,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080"; fi
ffmpeg -v error -y -ss "$START" -t 16 -i "$SRC" -map 0:v:0 -an -dn -sn -map_metadata -1 -write_tmcd 0 \
  -vf "$VF" -c:v libx264 -crf 21 -preset fast -pix_fmt yuv420p -movflags +faststart "$OUT"
echo "$NAME: $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")초, 트랙 $(ffprobe -v error -show_entries stream=index -of csv=p=0 "$OUT" | wc -l)개"
