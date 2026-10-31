#!/bin/sh
# assets/PNG/*.png  → assets/webp/*.webp
# assets/covers/*.png → assets/covers/*.webp
# 원본 PNG는 지우지 않는다. 투명 배경은 그대로 유지된다.
#
# 준비:  brew install webp      (cwebp 명령이 생김)
# 실행:  sh tools/make-webp.sh

cd "$(dirname "$0")/.." || exit 1
mkdir -p assets/webp

convert() {  # $1 = png, $2 = webp, $3 = 최대 가로폭(px)
  w=$(sips -g pixelWidth "$1" 2>/dev/null | awk '/pixelWidth/{print $2}')
  if [ -n "$w" ] && [ "$w" -gt "$3" ]; then
    cwebp -quiet -q 82 -alpha_q 90 -resize "$3" 0 "$1" -o "$2"
  else
    cwebp -quiet -q 82 -alpha_q 90 "$1" -o "$2"
  fi
  printf '%-28s %7s → %7s\n' "$1" "$(du -h "$1" | cut -f1)" "$(du -h "$2" | cut -f1)"
}

# 휴대폰 화면(최대 3배 해상도)에 충분한 크기로 줄여서 변환
convert assets/PNG/1.png assets/webp/1.webp 1600
convert assets/PNG/2.png assets/webp/2.webp 748
convert assets/PNG/3.png assets/webp/3.webp 1036
convert assets/PNG/4.png assets/webp/4.webp 730
convert assets/PNG/5.png assets/webp/5.webp 800
convert assets/PNG/6.png assets/webp/6.webp 292
convert assets/PNG/badge.png assets/webp/badge.webp 685

for f in assets/covers/*.png; do
  [ -e "$f" ] || continue
  convert "$f" "${f%.png}.webp" 900
done
