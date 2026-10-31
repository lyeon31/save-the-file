#!/usr/bin/env python3
"""content txt → data/*.json 변환기 (한국어 ko · 영어 en · 인도네시아어 id).

원문 텍스트는 한 글자도 고치지 않는다. 줄 단위로 잘라 필드에 나눠 담기만 한다.
(¹ ² ① ② 같은 목록 기호만 떼어내고, 화면에서 다시 붙여서 보여준다.)

사용법:  python3 tools/build_data.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data"

SRC = {
    "intro": ROOT / "00_전체 소개" / "Save The File_소개.txt",
    "keyword_ko": ROOT / "01_KEYWORD HUNT" / "KEYWORD HUNT_한글.txt",
    "keyword_en": ROOT / "01_KEYWORD HUNT" / "KEYWORD HUNT_영어.txt",
    "item_ko": ROOT / "02_ITEM GET" / "ITEM GET_한글.txt",
    "item_en": ROOT / "02_ITEM GET" / "ITEM GET_영어.txt",
    "ydi_ko": ROOT / "03_YOU DID IT" / "YOU DID IT_한글.txt",
    "ydi_en": ROOT / "03_YOU DID IT" / "YOU DID IT_영어.txt",
    "keyword_id": ROOT / "01_KEYWORD HUNT" / "KEYWORD HUNT_인도네시아어.txt",
    "item_id": ROOT / "02_ITEM GET" / "item_get_인도네시아.txt",
    "ydi_id": ROOT / "03_YOU DID IT" / "YOU DID IT_인도네시아어.txt",
}
LANGS = ("ko", "en", "id")
INTRO_KEY = {"ko": "서문", "en": "Intro", "id": "Intro"}

SUP = "¹²³⁴⁵⁶⁷⁸⁹"
CIRCLED = "①②③④⑤⑥⑦⑧⑨"
SECTION_RE = re.compile(r"^=+\s*(.+?)\s*=+$")
ENTRY_RE = re.compile(r"^(\d{2})\.\s+(.*)$")


def read_lines(path):
    return path.read_text(encoding="utf-8").replace("\r\n", "\n").split("\n")


def sections(lines):
    """'===== 제목 =====' 기준으로 나눈다. {제목: [줄...]}"""
    out, cur = {}, None
    for ln in lines:
        m = SECTION_RE.match(ln.strip())
        if m:
            cur = m.group(1)
            out[cur] = []
        elif cur is not None:
            out[cur].append(ln)
    return out


def paragraph(lines):
    """앞뒤 빈 줄만 걷어내고 원문 줄 그대로 돌려준다."""
    lines = list(lines)
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    return lines


def entries(lines):
    """'01. ...' 로 시작하는 항목 덩어리들. [(번호, 머리줄, [본문줄...])]"""
    out = []
    for ln in lines:
        m = ENTRY_RE.match(ln)
        if m:
            out.append([int(m.group(1)), m.group(2), []])
        elif out and ln.strip():
            out[-1][2].append(ln)
    return out


def strip_marker(ln, markers):
    ln = ln.strip()
    if ln and ln[0] in markers:
        return ln[1:].strip()
    return ln


# ---------------------------------------------------------------- KEYWORD
KW_HEAD = {
    "의미": "meaning", "Meaning": "meaning", "Makna": "meaning",
    "속뜻": "hidden", "Hidden Meanings": "hidden", "Makna Tersembunyi": "hidden",
    "유의어": "synonyms",
    "같이 쓰는 기호": "symbols",
    "주의": "caution", "Warning": "caution", "Peringatan": "caution",
    "예시": "examples", "EX.": "examples",
}


def parse_keyword_entry(head, body):
    m = re.match(r"^(.*)\s\((.*)\)$", head)
    title, paren = m.group(1), m.group(2)
    d = {"title": title, "paren": paren, "category": "", "meaning": "",
         "list": [], "hidden": [], "synonyms": [], "symbols": [],
         "caution": "", "examples": []}
    cur = None
    for ln in body:
        s = ln.strip()
        if s.startswith("[") and s.endswith("]") and not d["category"]:
            d["category"] = s[1:-1]
            continue
        if s in KW_HEAD:
            cur = KW_HEAD[s]
            continue
        if cur == "meaning":
            if s[0] in SUP:
                d["list"].append(strip_marker(s, SUP))  # 머리말 없는 번호 목록
            else:
                d["meaning"] = (d["meaning"] + "\n" + s) if d["meaning"] else s
        elif cur in ("hidden", "synonyms", "symbols", "examples"):
            d[cur].append(strip_marker(s, SUP))
        elif cur == "caution":
            d["caution"] = (d["caution"] + "\n" + s) if d["caution"] else s
    return d


def build_keyword():
    out = {"id": "keyword"}
    langs = {}
    for lang in LANGS:
        sec = sections(read_lines(SRC[f"keyword_{lang}"]))
        intro_key = INTRO_KEY[lang]
        entry_key = next(k for k in sec if k.startswith(("항목", "Entries")))
        langs[lang] = {
            "intro": paragraph(sec[intro_key]),
            "items": {n: parse_keyword_entry(h, b) for n, h, b in entries(sec[entry_key])},
        }
    out["intro"] = {l: langs[l]["intro"] for l in langs}
    items = []
    for n in sorted(langs["ko"]["items"]):
        per = {l: langs[l]["items"][n] for l in LANGS}
        # 머리말 없는 번호 목록: 다른 언어판에서 같은 자리가 '속뜻'이면 속뜻으로, 아니면 그대로 둔다.
        for l, a in per.items():
            if a["list"] and not a["hidden"] and any(b["hidden"] for m, b in per.items() if m != l):
                a["hidden"], a["list"] = a["list"], []
        per["ko"]["roman"] = per["ko"].pop("paren")  # 넵 (Nep!) → 로마자 표기
        for l in ("en", "id"):
            per[l]["original"] = per[l].pop("paren")  # Yep (넵!) → 한글 원어
        items.append({"no": n, **per})
    out["items"] = items
    return out


# ---------------------------------------------------------------- ITEM
CAT = {"장비": "gear", "소모품": "consumable", "스킬": "skill", "상태 효과": "status", "서포트": "support",
       "Gear": "gear", "Consumable": "consumable", "Skill": "skill", "Status": "status", "Support": "support"}
SIDE_HEAD = ("부작용", "Side Effect", "Efek Samping")
COMBO_HEAD = ("같이 쓰는 아이템:", "같이 있음 좋은 친구:", "Combo:", "Kombo:")
CAT_ORDER = ["gear", "consumable", "skill", "status", "support"]


def parse_stat_token(tok):
    """스탯 한 덩어리를 막대 그래프용으로 읽는다. 원문은 raw에 그대로 둔다."""
    t = tok.strip()
    st = {"raw": t, "sign": "", "label": "", "value": None, "unit": "", "note": ""}
    m = re.match(r"^([+-])(\d+)\s+(.+)$", t)  # EN: +100 Attack
    if m:
        st.update(sign=m.group(1), value=int(m.group(2)), label=m.group(3))
        n = re.match(r"^(.*?)\s*(\(.*\))$", st["label"])
        if n:
            st.update(label=n.group(1), note=n.group(2))
        return st
    m = re.match(r"^([+-])(.+?)\s*(\d+)\s*(\(.*\))?$", t)  # KO: +공격력 100 / -요청 100 (전부 무효)
    if m:
        st.update(sign=m.group(1), label=m.group(2).strip(), value=int(m.group(3)), note=m.group(4) or "")
        return st
    m = re.match(r"^(.+?)\s*([+-])(\d+)(%)$", t)  # "네, 일단 해볼게요" 발동률 +80%
    if m:
        st.update(label=m.group(1), sign=m.group(2), value=int(m.group(3)), unit="%")
        return st
    m = re.match(r"^(.+?)\s*(\d+)(%)$", t)  # 다시 볼 확률 1% / Persentase memicu "..." +80%
    if m:
        st.update(label=m.group(1), value=int(m.group(2)), unit="%")
        return st
    m = re.match(r"^(\d+)(%)\s+(.+)$", t)  # 1% Revisit Rate
    if m:
        st.update(value=int(m.group(1)), unit="%", label=m.group(3))
        return st
    m = re.match(r"^([+-])(.+)$", t)  # +행복감 (맛에 비례)
    if m:
        st.update(sign=m.group(1), label=m.group(2))
    return st


def split_stats(line, lang):
    if lang == "ko":
        parts = []
        for chunk in re.split(r"\s{2,}", line.strip()):
            parts += chunk.split(" / ")
        return parts
    return [p for p in re.split(r",\s+(?=[+\-\d])", line.strip())]


def is_stat_line(s):
    return bool(re.match(r"^[+-]\S", s)) or bool(re.match(r'^.*"\s?.*[+-]\d+%$', s))


def parse_item_entry(head, body, lang):
    m = re.match(r"^(.*?)\s\[(.+?)\](?:\s·\s(.+))?$", head)
    d = {"name": m.group(1), "category": m.group(2), "tag": m.group(3) or "",
         "desc": "", "combo": "", "statsRaw": "", "stats": [], "side": [], "notes": []}
    cat = CAT[m.group(2)]
    in_side = False
    for ln in body:
        s = ln.strip()
        if s in SIDE_HEAD:
            in_side = True
            continue
        if s.startswith(COMBO_HEAD):
            d["combo"] = s
            continue
        if in_side and s[0] in CIRCLED:
            d["side"].append(strip_marker(s, CIRCLED))
            continue
        if s.startswith("*"):
            d["notes"].append(s)
            continue
        if not d["statsRaw"] and is_stat_line(s):
            d["statsRaw"] = s
            d["stats"] = [parse_stat_token(t) for t in split_stats(s, lang)]
            continue
        d["desc"] = (d["desc"] + "\n" + s) if d["desc"] else s
    return cat, d


def build_item():
    out = {"id": "item", "categories": {
        "order": CAT_ORDER,
        "ko": {"gear": "장비", "consumable": "소모품", "skill": "스킬", "status": "상태 효과", "support": "서포트"},
        "en": {"gear": "Gear", "consumable": "Consumable", "skill": "Skill", "status": "Status", "support": "Support"},
        "id": {"gear": "Gear", "consumable": "Consumable", "skill": "Skill", "status": "Status", "support": "Support"},
    }}
    langs = {}
    for lang in LANGS:
        sec = sections(read_lines(SRC[f"item_{lang}"]))
        intro_key = INTRO_KEY[lang]
        body = []
        for k, v in sec.items():
            if k != intro_key:
                body += v
        langs[lang] = {"intro": paragraph(sec[intro_key]),
                       "items": {n: parse_item_entry(h, b, lang) for n, h, b in entries(body)}}
    out["intro"] = {l: langs[l]["intro"] for l in langs}
    items = []
    for n in sorted(langs["ko"]["items"]):
        cats = {langs[l]["items"][n][0] for l in LANGS}
        assert len(cats) == 1, n
        items.append({"no": n, "cat": cats.pop(), **{l: langs[l]["items"][n][1] for l in LANGS}})
    # 같이 쓰는 아이템: 본문(설명·조합·부작용·메모)에 다른 아이템 이름이 나오면 연결한다.
    for it in items:
        rel = []
        for other in items:
            if other is it:
                continue
            for lang in LANGS:
                name = other[lang]["name"].strip('"')
                if len(name) < 3:
                    continue  # 'AI' 같은 짧은 이름은 오탐이 많아서 제외
                text = " ".join([it[lang]["desc"], it[lang]["combo"], *it[lang]["side"], *it[lang]["notes"]])
                if name in text and other["no"] not in rel:
                    rel.append(other["no"])
        it["related"] = rel
    out["items"] = items
    return out


# ---------------------------------------------------------------- YOU DID IT
def build_ydi():
    out = {"id": "youdidit"}
    langs = {}
    for lang in LANGS:
        sec = sections(read_lines(SRC[f"ydi_{lang}"]))
        intro_key = INTRO_KEY[lang]
        entry_key = next(k for k in sec if k.startswith(("업적", "Achievements", "Pencapaian")))
        items = {}
        for n, head, body in entries(sec[entry_key]):
            desc, reward = [], ""
            for ln in body:
                s = ln.strip()
                if s.startswith(("업적 보상:", "Reward:", "Hadiah:")):
                    reward = s.split(":", 1)[1].strip()
                else:
                    desc.append(s)
            items[n] = {"title": head, "desc": "\n".join(desc), "reward": reward}
        langs[lang] = {"intro": paragraph(sec[intro_key]), "items": items}
    out["intro"] = {l: langs[l]["intro"] for l in langs}
    out["items"] = [{"no": n, **{l: langs[l]["items"][n] for l in LANGS}}
                    for n in sorted(langs["ko"]["items"])]
    return out


# ---------------------------------------------------------------- INTRO
def build_intro():
    lines = read_lines(SRC["intro"])
    sec = sections(lines)
    ko = sec["책 소개 (한글)"]
    i5 = ko.index("[5줄]")
    ish = ko.index("[짧은 버전]")
    five = paragraph(ko[i5 + 1:ish])
    short = paragraph(ko[ish + 1:])

    def block_of(name, tag):
        """영어·인니어 섹션에서 '[5 lines]' / '[info]' 같은 블록의 줄들. 없으면 None (화면에서 한글로 대신 보여줌)"""
        out, cur = [], None
        for ln in sec.get(name, []):
            st = ln.strip()
            if st.startswith("[") and st.endswith("]"):
                cur = st
            elif st and cur and (cur == tag or (tag != "[info]" and cur != "[info]")):
                out.append(ln)
        return out or None

    def five_of(name):
        return block_of(name, "[5")


    books = []
    blines = paragraph(sec["세 권의 책"])
    for i, ln in enumerate(blines):
        m = re.match(r"^(\d{2})\.\s+(.+?)\s·\s(.+)$", ln)
        if m:
            books.append({"no": int(m.group(1)), "title": m.group(2), "subtitle": m.group(3),
                          "desc": blines[i + 1].strip(), "color": blines[i + 2].strip().replace("색: ", "")})
    ids = ["keyword", "item", "youdidit"]
    sub, local = {"en": {}, "id": {}}, {"en": {}, "id": {}}
    for lang in ("en", "id"):
        for key, bid in (("keyword", "keyword"), ("item", "item"), ("ydi", "youdidit")):
            # 첫째 줄: 책 제목, 둘째 줄: "Save The File ★1 · Freelancer Word Dictionary"
            ls = read_lines(SRC[f"{key}_{lang}"])
            local[lang][bid] = ls[0].strip()
            sub[lang][bid] = ls[1].split(" · ", 1)[1]
    meta = [ln.strip() for ln in blines if ln.strip().startswith(("※", "판형", "케이스"))]

    return {
        "title": lines[0].split(" · ")[0],
        "author": lines[1].strip(),
        "intro": {"ko": five, "en": five_of("Book Intro (English)"), "id": five_of("Book Intro (Indonesian)")},
        "short": {"ko": short, "en": None, "id": None},
        "books": [{"id": ids[b["no"] - 1], "no": b["no"], "title": b["title"],
                   "localTitle": {"ko": b["title"], "en": local["en"][ids[b["no"] - 1]], "id": local["id"][ids[b["no"] - 1]]},
                   "subtitle": {"ko": b["subtitle"], "en": sub["en"][ids[b["no"] - 1]], "id": sub["id"][ids[b["no"] - 1]]},
                   "desc": {"ko": b["desc"], "en": None, "id": None},
                   "color": b["color"]} for b in books],
        "meta": {"ko": meta, "en": block_of("Book Intro (English)", "[info]"), "id": block_of("Book Intro (Indonesian)", "[info]")},
    }


def main():
    OUT.mkdir(exist_ok=True)
    data = {"intro": build_intro(), "keyword": build_keyword(), "item": build_item(), "youdidit": build_ydi()}
    for name, obj in data.items():
        (OUT / f"{name}.json").write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for name in ("keyword", "item", "youdidit"):
        items = data[name]["items"]
        missing = [(it["no"], l) for it in items for l in LANGS if not it.get(l)]
        print(f"{name:9s} {len(items):2d}개  번호 {items[0]['no']}~{items[-1]['no']}  "
              f"{'OK' if len(items) == 28 and [i['no'] for i in items] == list(range(1, 29)) else '확인 필요'}"
              + (f"  누락:{missing}" if missing else ""))


if __name__ == "__main__":
    main()
