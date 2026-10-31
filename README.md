# Save The File ★1 — 아트북 소개 사이트

HTML · CSS · JavaScript만 사용합니다(빌드 도구 없음). 폴더째 GitHub Pages나 Netlify에 올리면 됩니다.

## 폴더

```
index.html  style.css  script.js
data/            keyword.json · item.json · youdidit.json · intro.json  (사이트가 읽는 글)
assets/PNG/      원본 PNG 1~6 (PNG/ 폴더에서 복사)
assets/webp/     WebP 변환본 (사이트는 WebP를 먼저 쓰고, 안 되는 브라우저만 PNG 사용)
assets/covers/   표지 PNG를 넣는 곳
tools/           build_data.py (txt → json), make-webp.sh (PNG → WebP)
00_~03_ 폴더     원본 txt / PDF (사이트에는 쓰이지 않음, 업로드 안 해도 됨)
```

## 내 컴퓨터에서 보기

`data/*.json`을 불러오기 때문에 index.html을 더블클릭하면 글이 안 뜹니다. 터미널에서:

```sh
cd "아트북페어 설명"
python3 -m http.server 8000
```

그다음 브라우저에서 http://localhost:8000 을 엽니다. 휴대폰으로 보려면 같은 와이파이에서 `http://내컴퓨터IP:8000`.

## 글을 고쳤을 때

txt(한글 · 영어 · 인도네시아어)를 고친 뒤 다시 변환합니다. 글은 원문 그대로 옮겨지고, 마지막에 책마다 항목 수를 알려줍니다.
제목 표시줄의 KO / EN / ID 버튼으로 언어를 바꿀 수 있습니다(고른 언어는 기기에 저장).

```sh
python3 tools/build_data.py
```

## 표지

`assets/covers/`의 정사각형 이미지가 Home 카트리지로 쓰입니다. 원본은 `PNG/`의 표지 파일에서 복사했습니다.

- 앞면: `keyword.png` · `item.png` · `youdidit.png` — 목록에 보이는 면
- 뒷면(칩): `keyword-back.png` · `item-back.png` · `youdidit-back.png` — 탭하면 뒤집혀서 보이고 아래로 꽂힘

같은 이름으로 덮어쓰면 바로 바뀝니다. 바꾼 뒤 `sh tools/make-webp.sh`로 WebP도 다시 만들어 주세요. 파일이 없으면 책 색 임시 상자가 대신 보입니다.

## WebP 만들기

```sh
brew install webp        # 처음 한 번 (cwebp 설치)
sh tools/make-webp.sh
```

- `assets/PNG/*.png` → `assets/webp/*.webp`, `assets/covers/*.png` → 같은 폴더에 `.webp`가 생깁니다.
- 원본 PNG는 지우지 않습니다. 투명 배경도 유지됩니다.
- 사이트는 `<picture>`로 WebP를 먼저 쓰고, 지원하지 않는 브라우저에서는 PNG를 씁니다. PNG를 바꿨다면 이 스크립트를 다시 실행하세요.
