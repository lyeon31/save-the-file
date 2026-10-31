/* =========================================================
   Save The File ★1 — script.js
   프레임워크 없이: 해시 라우터(#/home …) + data/*.json 렌더링
   언어: ko(한국어) · en(English) · id(Bahasa Indonesia)
   ========================================================= */
(function () {
  "use strict";

  const BOOKS = ["keyword", "item", "youdidit"];
  const ROUTES = ["home", ...BOOKS];
  const LANGS = ["ko", "en", "id"];
  const LOADING_MS = 800;
  const TOAST_MS = 2000;
  const TITLE_MIN = 3;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // 화면 고정 문구 (책 본문은 전부 data/*.json 에서 옴)
  const UI = {
    ko: {
      cartHint: "옆으로 넘겨서 고르고, 탭하면 실행돼요",
      cartGo: "실행하기",
      introMissing: "",
      entries: "28개 항목",
      navLabel: "메뉴",
      close: "닫기",
      // YOU DID IT!
      progress: "달성률",
      achieve: "나도 달성!",
      achieved: "달성 완료",
      undo: "달성 취소",
      locked: "잠김",
      unlocked: "업적 달성",
      reward: "업적 보상",
      titleCard: "당신의 칭호",
      titleLocked: (n) => `업적을 ${n}개 더 달성하면 칭호 카드가 열려요`,
      titlePick: "칭호 고르기",
      nameLabel: "내 이름",
      namePh: "이름을 입력하세요",
      share: "이미지로 저장 · 공유",
      making: "이미지 만드는 중…",
      saved: "이미지를 저장했어요",
      // ITEM GET!
      stats: "스탯",
      side: "부작용",
      related: "같이 쓰는 아이템",
      over: "OVER!!",
      // KEYWORD HUNT
      searchLabel: "단어 검색",
      searchPh: "단어 검색 (한글 · EN · ID)",
      noResult: "찾는 단어가 없어요",
      meaning: "의미",
      reveal: "속뜻 보기",
      conceal: "속뜻 접기",
      hidden: "속뜻",
      synonyms: "유의어",
      symbols: "같이 쓰는 기호",
      caution: "주의",
      examples: "예시",
      prev: "이전 단어",
      next: "다음 단어",
      swipeHint: "좌우로 밀면 이전 · 다음 단어",
    },
    en: {
      cartHint: "Swipe to choose, tap to play",
      cartGo: "Play",
      introMissing: "English intro coming soon — showing the Korean text for now.",
      entries: "28 entries",
      navLabel: "Menu",
      close: "Close",
      progress: "Progress",
      achieve: "I did it too!",
      achieved: "Unlocked",
      undo: "Undo",
      locked: "Locked",
      unlocked: "Achievement unlocked",
      reward: "Reward",
      titleCard: "YOUR TITLE",
      titleLocked: (n) => `Unlock ${n} more to get your title card`,
      titlePick: "Choose a title",
      nameLabel: "Your name",
      namePh: "Type your name",
      share: "Save · Share image",
      making: "Making image…",
      saved: "Image saved",
      stats: "Stats",
      side: "Side Effect",
      related: "Combo",
      over: "OVER!!",
      searchLabel: "Search words",
      searchPh: "Search (KO · EN · ID)",
      noResult: "No words found",
      meaning: "Meaning",
      reveal: "Show hidden meaning",
      conceal: "Hide",
      hidden: "Hidden Meanings",
      synonyms: "Similar words",
      symbols: "Used with",
      caution: "Warning",
      examples: "EX.",
      prev: "Previous word",
      next: "Next word",
      swipeHint: "Swipe left / right for more words",
    },
    id: {
      cartHint: "Geser untuk memilih, ketuk untuk main",
      cartGo: "Main",
      introMissing: "Intro bahasa Indonesia belum tersedia — sementara ditampilkan teks Korea.",
      entries: "28 entri",
      navLabel: "Menu",
      close: "Tutup",
      progress: "Progres",
      achieve: "Aku juga berhasil!",
      achieved: "Terbuka",
      undo: "Batalkan",
      locked: "Terkunci",
      unlocked: "Pencapaian terbuka",
      reward: "Hadiah",
      titleCard: "GELARMU",
      titleLocked: (n) => `Raih ${n} pencapaian lagi untuk membuka kartu gelar`,
      titlePick: "Pilih gelar",
      nameLabel: "Namamu",
      namePh: "Tulis namamu",
      share: "Simpan · Bagikan gambar",
      making: "Membuat gambar…",
      saved: "Gambar tersimpan",
      stats: "Stat",
      side: "Efek Samping",
      related: "Kombo",
      over: "OVER!!",
      searchLabel: "Cari kata",
      searchPh: "Cari kata (KO · EN · ID)",
      noResult: "Kata tidak ditemukan",
      meaning: "Makna",
      reveal: "Lihat makna tersembunyi",
      conceal: "Tutup",
      hidden: "Makna Tersembunyi",
      synonyms: "Sinonim",
      symbols: "Tanda pendamping",
      caution: "Peringatan",
      examples: "EX.",
      prev: "Kata sebelumnya",
      next: "Kata berikutnya",
      swipeHint: "Geser kiri / kanan untuk kata lain",
    },
  };

  // localStorage는 사생활 보호 모드 등에서 막힐 수 있어서 항상 try/catch
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 저장 못 해도 동작은 계속 */ } },
    json(k, fallback) { try { return JSON.parse(this.get(k)) ?? fallback; } catch (e) { return fallback; } },
  };

  const state = {
    lang: initialLang(),
    route: null,
    data: {},
    busy: false,
    // 책 화면 상태 (언어를 바꿔도 유지)
    itemCat: "gear",
    query: "",
    achieved: new Set(store.json("stf-ydi", []).filter(Number.isInteger)),
    name: store.get("stf-name") || "",
    title: Number(store.get("stf-title")) || null,
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const t = (key) => UI[state.lang][key];
  const L = () => state.lang;
  const pad2 = (n) => String(n).padStart(2, "0");

  function initialLang() {
    const saved = store.get("stf-lang");
    if (LANGS.includes(saved)) return saved;
    const nav = (navigator.language || "ko").toLowerCase();
    if (nav.startsWith("ko")) return "ko";
    if (nav.startsWith("id") || nav.startsWith("in") || nav.startsWith("ms")) return "id";
    return "en";
  }

  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      node.append(c instanceof Node ? c : document.createTextNode(c));
    }
    return node;
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const fill = (node, ...kids) => node.replaceChildren(...kids.flat().filter((k) => k != null && k !== false));

  async function loadJSON(name) {
    if (!state.data[name]) {
      state.data[name] = fetch(`data/${name}.json`).then((r) => {
        if (!r.ok) throw new Error(`${name}.json ${r.status}`);
        return r.json();
      });
    }
    return state.data[name];
  }

  // WebP를 지원하면 webp, 아니면 png
  const webpOK = (() => {
    try { return document.createElement("canvas").toDataURL("image/webp").startsWith("data:image/webp"); }
    catch (e) { return false; }
  })();
  const imgSrc = (n) => (webpOK ? `assets/webp/${n}.webp` : `assets/PNG/${n}.png`);
  function setPicture(img, n) { img.src = imgSrc(n); }

  // 원문 줄 → <p> (빈 줄은 문단 간격)
  const paras = (lines) => lines.map((s) => (s ? el("p", { text: s }) : el("div", { class: "para-gap" })));
  // 줄바꿈이 들어 있는 원문 → <p> 여러 개
  const textParas = (s) => s.split("\n").map((x) => el("p", { text: x }));
  const SUP = "¹²³⁴⁵⁶⁷⁸⁹";
  const CIRCLED = "①②③④⑤⑥⑦⑧⑨";
  const markList = (items, marks, cls) =>
    el("ol", { class: `mark-list ${cls || ""}` },
      items.map((s, i) => el("li", {}, el("span", { class: "mark", "aria-hidden": "true", text: marks[i] || "•" }), el("span", { text: s }))));

  // 자물쇠 아이콘: 고리 + 몸통 + 열쇠 구멍
  function lockIcon() {
    const span = el("span", { class: "lock", "aria-hidden": "true" });
    span.innerHTML =
      '<svg viewBox="0 0 24 24"><path d="M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>' +
      '<rect x="4" y="10.5" width="16" height="11.5" rx="2.5" fill="currentColor"/>' +
      '<circle cx="12" cy="15.3" r="1.9" fill="#fff"/><rect x="11.05" y="15.8" width="1.9" height="3.6" rx=".95" fill="#fff"/></svg>';
    return span;
  }

  /* ---------------------------------------------------------
     언어
     --------------------------------------------------------- */
  function applyLang() {
    document.documentElement.lang = state.lang;
    $$("[data-t]").forEach((n) => { n.textContent = t(n.dataset.t); });
    $$("#langGroup .lang-btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang)));
    $(".tabbar").setAttribute("aria-label", t("navLabel"));
    $("#sheetClose").setAttribute("aria-label", t("close"));
  }

  $("#langGroup").addEventListener("click", (e) => {
    const b = e.target.closest(".lang-btn");
    if (!b || b.dataset.lang === state.lang) return;
    state.lang = b.dataset.lang;
    store.set("stf-lang", state.lang);
    applyLang();
    renderHome();
    if (BOOKS.includes(state.route)) {
      const keep = $("#viewport").scrollTop;
      renderBook(state.route).then(() => { $("#viewport").scrollTop = keep; });
    }
    if (sheet.current) sheet.current.render();
  });

  /* ---------------------------------------------------------
     HOME
     --------------------------------------------------------- */
  async function renderHome() {
    const intro = await loadJSON("intro");
    const own = intro.intro[L()];
    const note = $("#introNote");
    note.hidden = !!own;
    note.textContent = t("introMissing");
    const box = $("#introLines");
    box.lang = own ? L() : "ko";
    box.replaceChildren(...(own || intro.intro.ko).map((s) => el("p", { text: s })));

    $("#metaAuthor").textContent = intro.author;
    const meta = intro.meta[L()] || intro.meta.ko;
    $("#metaList").lang = intro.meta[L()] ? L() : "ko";
    $("#metaList").replaceChildren(...meta.map((s) => el("li", { text: s })));

    renderCarts(intro.books);
  }

  function renderCarts(books) {
    const track = $("#cartTrack");
    const keep = track.scrollLeft;
    track.replaceChildren(
      ...books.map((b) =>
        el("button", {
          class: "cart",
          type: "button",
          "data-id": b.id,
          "aria-label": `${b.title} — ${b.subtitle[L()]}. ${t("cartGo")}`,
          onclick: (e) => playCart(b.id, e.currentTarget),
        },
          el("span", { class: "cart-flip" },
            el("span", { class: "cart-face cart-front" },
              el("span", { class: "cart-ph", "aria-hidden": "true" },
                el("b", { text: `No.${pad2(b.no)}` }),
                el("strong", { text: b.title }),
                el("small", { text: b.subtitle[L()], lang: L() })
              ),
              coverImg(b.id)
            ),
            el("span", { class: "cart-face cart-back", "aria-hidden": "true" }, coverImg(`${b.id}-back`))
          ),
          el("span", { class: "cart-name", text: b.title }),
          el("span", { class: "cart-sub", text: t("entries") })
        )
      )
    );
    track.scrollLeft = keep;

    $("#cartDots").replaceChildren(
      ...books.map((b, i) =>
        el("button", { class: "cart-dot", type: "button", "aria-label": b.title, onclick: () => scrollToCart(i) }))
    );
    updateDots();
  }

  // 표지: assets/covers/{id}.png(앞면), {id}-back.png(뒷면 칩). WebP가 있으면 WebP를 먼저 쓴다.
  // 파일이 없으면 이미지를 지우고 책 색 임시 상자가 그대로 보인다.
  function coverImg(name) {
    const img = el("img", {
      alt: "",
      loading: "lazy",
      decoding: "async",
      width: "875",
      height: "875",
      src: webpOK ? `assets/covers/${name}.webp` : `assets/covers/${name}.png`,
    });
    img.addEventListener("error", () => {
      if (img.src.endsWith(".webp")) img.src = `assets/covers/${name}.png`;  // WebP가 없으면 PNG로
      else img.remove();
    });
    return img;
  }

  function scrollToCart(i) {
    const track = $("#cartTrack");
    const cart = track.children[i];
    if (!cart) return;
    const left = cart.offsetLeft - (track.clientWidth - cart.offsetWidth) / 2;
    track.scrollTo({ left, behavior: reduceMotion.matches ? "auto" : "smooth" });
  }

  function currentCartIndex() {
    const track = $("#cartTrack");
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0, dist = Infinity;
    Array.from(track.children).forEach((c, i) => {
      const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
      if (d < dist) { dist = d; best = i; }
    });
    return best;
  }

  function updateDots() {
    const idx = currentCartIndex();
    $$("#cartDots .cart-dot").forEach((d, i) => d.setAttribute("aria-current", i === idx ? "true" : "false"));
  }

  let dotRaf = 0;
  $("#cartTrack").addEventListener("scroll", () => {
    cancelAnimationFrame(dotRaf);
    dotRaf = requestAnimationFrame(updateDots);
  }, { passive: true });

  async function playCart(id, node) {
    if (state.busy) return;
    state.busy = true;
    if (!reduceMotion.matches) {
      node.classList.add("flipped");     // 뒤집혀서 칩 면
      await wait(380);
      node.classList.add("inserting");   // 아래로 꽂힘
      await wait(300);
    }
    await showLoading(id);
    node.classList.remove("flipped", "inserting");
    state.busy = false;
    location.hash = `#/${id}`;
  }

  /* ---------------------------------------------------------
     LOADING 화면 (0.8초)
     --------------------------------------------------------- */
  async function showLoading(bookId) {
    const box = $("#loading");
    const char = $("#loadingChar");
    if (!char.getAttribute("src")) setPicture(char, "5");
    const lb = $(".loading-box");
    lb.style.setProperty("--bc", `var(--c-${bookId})`);
    lb.style.setProperty("--bc-d", `var(--c-${bookId}-d)`);
    // 진행 칸은 화면이 다시 보일 때마다(display 복귀) 처음부터 한 칸씩 채워진다
    box.hidden = false;
    // 책 데이터는 로딩 화면 동안 미리 받아둔다
    await Promise.all([wait(LOADING_MS), loadJSON(bookId).catch(() => null)]);
    box.hidden = true;
  }

  /* ---------------------------------------------------------
     바텀 시트
     --------------------------------------------------------- */
  const sheet = {
    layer: $("#sheetLayer"),
    box: $("#sheet"),
    body: $("#sheetBody"),
    current: null,     // { book, render, nav? }
    returnFocus: null,

    open(book, render, nav) {
      const wasOpen = !!this.current;
      this.current = { book, render, nav };
      this.box.dataset.book = book;
      render();
      this.body.scrollTop = 0;
      if (!wasOpen) {
        this.returnFocus = document.activeElement;
        this.layer.hidden = false;
        this.box.style.transform = "";
        this.layer.classList.remove("closing");
        this.box.focus({ preventScroll: true });
      }
    },

    async close() {
      if (!this.current) return;
      this.current = null;
      if (!reduceMotion.matches) {
        this.layer.classList.add("closing");
        await wait(200);
      }
      this.layer.hidden = true;
      this.layer.classList.remove("closing");
      this.box.style.transform = "";
      if (this.returnFocus && document.contains(this.returnFocus)) this.returnFocus.focus({ preventScroll: true });
    },

    // 시트 안에서 다른 항목으로 넘어갈 때 (좌우 스와이프, 같이 쓰는 아이템)
    swap(render, dir) {
      this.current.render = render;
      render();
      this.body.scrollTop = 0;
      if (dir && !reduceMotion.matches) {
        this.body.classList.remove("slide-l", "slide-r");
        void this.body.offsetWidth;
        this.body.classList.add(dir > 0 ? "slide-l" : "slide-r");
      }
    },
  };

  $("#sheetBackdrop").addEventListener("click", () => sheet.close());
  $("#sheetClose").addEventListener("click", () => sheet.close());
  document.addEventListener("keydown", (e) => {
    if (!sheet.current) return;
    if (e.key === "Escape") sheet.close();
    if (sheet.current && sheet.current.nav && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      sheet.current.nav(e.key === "ArrowRight" ? 1 : -1);
    }
  });

  // 끌어내려서 닫기 + (단어 사전) 좌우로 밀어서 이전/다음
  (function sheetGestures() {
    let sx = 0, sy = 0, dy = 0, mode = null, fromGrab = false, t0 = 0;
    const box = sheet.box;

    box.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return;
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
      dy = 0;
      mode = null;
      t0 = Date.now();
      fromGrab = !!e.target.closest(".sheet-grab");
    }, { passive: true });

    box.addEventListener("touchmove", (e) => {
      if (e.touches.length !== 1) return;
      const mx = e.touches[0].clientX - sx;
      const my = e.touches[0].clientY - sy;
      if (!mode) {
        if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
        if (Math.abs(my) > Math.abs(mx)) {
          mode = my > 0 && (fromGrab || sheet.body.scrollTop <= 0) ? "drag" : "scroll";
        } else {
          mode = "swipe";
        }
      }
      if (mode === "drag") {
        e.preventDefault();
        dy = Math.max(0, my);
        box.style.transition = "none";
        box.style.transform = `translateY(${dy}px)`;
      }
    }, { passive: false });

    box.addEventListener("touchend", (e) => {
      const touch = e.changedTouches[0];
      if (mode === "drag") {
        box.style.transition = "";
        const fast = dy > 40 && Date.now() - t0 < 250;
        if (dy > 110 || fast) sheet.close();
        else box.style.transform = "";
      } else if (mode === "swipe" && sheet.current && sheet.current.nav) {
        const mx = touch.clientX - sx;
        if (Math.abs(mx) > 60 && !e.target.closest("input, textarea")) sheet.current.nav(mx < 0 ? 1 : -1);
      }
      mode = null;
    });
  })();

  /* ---------------------------------------------------------
     업적 토스트
     --------------------------------------------------------- */
  let toastTimer = 0;
  function showToast(text) {
    const box = $("#toast");
    const icon = $("#toastIcon");
    if (!icon.getAttribute("src")) setPicture(icon, "badge");
    $("#toastText").textContent = text;
    clearTimeout(toastTimer);
    box.hidden = true;
    void box.offsetWidth;
    box.hidden = false;
    toastTimer = setTimeout(() => { box.hidden = true; }, TOAST_MS);
  }

  /* ---------------------------------------------------------
     책 화면 공통 머리 (책 이름 + 서문 전체)
     --------------------------------------------------------- */
  async function renderBook(id) {
    const view = $(`#view-${id}`);
    const [intro, book] = await Promise.all([loadJSON("intro"), loadJSON(id)]);
    const meta = intro.books.find((b) => b.id === id);
    const lang = L();
    const local = meta.localTitle[lang];

    const head = el("header", { class: "book-head" },
      el("div", { class: "book-head-bar" },
        el("p", { class: "sys-line", text: `No.${pad2(meta.no)} · ${t("entries")}` }),
        el("h1", { text: meta.title }),
        local && local !== meta.title ? el("p", { class: "book-head-local", text: local, lang }) : null,
        el("p", { class: "book-head-sub", text: meta.subtitle[lang], lang })
      ),
      el("div", { class: "book-intro", lang }, paras(book.intro[lang]))
    );

    const body = { keyword: keywordView, item: itemView, youdidit: ydiView }[id](book);
    view.replaceChildren(head, body);
  }

  /* =========================================================
     YOU DID IT! — 내가 달성하는 업적 목록
     ========================================================= */
  function saveAchieved() {
    store.set("stf-ydi", JSON.stringify([...state.achieved].sort((a, b) => a - b)));
  }

  function ydiView(book) {
    const lang = L();
    const total = book.items.length;
    const done = state.achieved.size;
    const wrap = el("div", { class: "ydi", lang });

    // 달성률 막대
    wrap.append(
      el("section", { class: "panel ydi-progress", "aria-label": t("progress") },
        el("header", { class: "panel-bar" },
          el("span", { text: `ACHIEVEMENT · ${t("progress")}` }),
          el("span", { class: "panel-dots", "aria-hidden": "true" }, el("i"), el("i"))
        ),
        el("div", { class: "panel-body" },
          el("p", { class: "ydi-count" }, el("b", { text: String(done) }), ` / ${total}`),
          el("div", {
            class: "ydi-cells",
            role: "progressbar",
            "aria-valuemin": "0",
            "aria-valuemax": String(total),
            "aria-valuenow": String(done),
            "aria-label": t("progress"),
          }, book.items.map((it) => el("i", { class: state.achieved.has(it.no) ? "on" : "" })))
        )
      )
    );

    // 칭호 카드 (3개 이상)
    wrap.append(done >= TITLE_MIN ? titleCard(book) :
      el("p", { class: "ydi-title-lock" },
        lockIcon(),
        t("titleLocked")(TITLE_MIN - done)));

    // 업적 목록
    wrap.append(
      el("ol", { class: "ydi-list" },
        book.items.map((it) => {
          const d = it[lang];
          const on = state.achieved.has(it.no);
          return el("li", { class: `ydi-item${on ? " on" : ""}`, id: `ydi-${it.no}` },
            el("div", { class: "ydi-row" },
              el("span", { class: "ydi-badge", "aria-hidden": "true" },
                on ? el("img", { class: "ydi-badge-img", src: imgSrc("badge"), alt: "", width: "685", height: "419", decoding: "async" }) : lockIcon()),
              el("div", { class: "ydi-head" },
                el("span", { class: "ydi-no", text: `No.${pad2(it.no)}${on ? "" : " · " + t("locked")}` }),
                el("h3", { class: "ydi-name", text: d.title })
              )
            ),
            on ? el("div", { class: "ydi-detail" },
              textParas(d.desc),
              el("p", { class: "ydi-reward" }, el("b", { text: t("reward") }), el("span", { text: d.reward }))
            ) : null,
            el("button", {
              class: on ? "ydi-undo" : "pill ydi-btn",
              type: "button",
              "aria-pressed": String(on),
              text: on ? `↺ ${t("undo")}` : `★ ${t("achieve")}`,
              onclick: () => toggleAchieve(it, !on),
            })
          );
        })
      )
    );
    return wrap;
  }

  async function toggleAchieve(it, on) {
    if (on) state.achieved.add(it.no); else state.achieved.delete(it.no);
    saveAchieved();
    if (on) {
      state.title = it.no;  // 방금 달성한 업적을 칭호 후보로
      store.set("stf-title", String(it.no));
      showToast(`${t("unlocked")}: ${it[L()].title}`);
    } else if (state.title === it.no) {
      state.title = null;
    }
    const keep = $("#viewport").scrollTop;
    await renderBook("youdidit");
    $("#viewport").scrollTop = keep;
    const btn = $(`#ydi-${it.no} button`);
    if (btn) btn.focus({ preventScroll: true });
  }

  function titleCard(book) {
    const lang = L();
    const owned = book.items.filter((it) => state.achieved.has(it.no));
    if (!owned.some((it) => it.no === state.title)) state.title = owned[owned.length - 1].no;
    const pick = () => book.items.find((it) => it.no === state.title)[lang].title;

    const titleText = el("p", { class: "tc-title", text: `[${pick()}]` });
    const nameText = el("p", { class: "tc-name", text: state.name || "???" });

    const star = (cls) => el("img", { class: `tc-star ${cls}`, src: imgSrc(6), alt: "", loading: "lazy", decoding: "async" });
    const select = el("select", {
      id: "titleSelect",
      onchange: (e) => {
        state.title = Number(e.target.value);
        store.set("stf-title", String(state.title));
        titleText.textContent = `[${pick()}]`;
      },
    }, owned.map((it) => el("option", { value: String(it.no), selected: it.no === state.title, text: it[lang].title })));

    const input = el("input", {
      id: "nameInput",
      type: "text",
      maxlength: "20",
      autocomplete: "nickname",
      enterkeyhint: "done",
      placeholder: t("namePh"),
      value: state.name,
      oninput: (e) => {
        state.name = e.target.value;
        store.set("stf-name", state.name);
        nameText.textContent = state.name || "???";
      },
    });

    const shareBtn = el("button", { class: "pill tc-share", type: "button", text: `⤓ ${t("share")}` });
    shareBtn.addEventListener("click", async () => {
      shareBtn.disabled = true;
      shareBtn.textContent = t("making");
      try { await shareTitleImage(pick(), state.name); }
      catch (e) { if (e && e.name !== "AbortError") console.error(e); }
      shareBtn.disabled = false;
      shareBtn.textContent = `⤓ ${t("share")}`;
    });

    return el("section", { class: "tc-wrap", "aria-label": t("titleCard") },
      el("div", { class: "tc-card" },
        star("tl"), star("tr"), star("bl"), star("br"),
        el("img", { class: "tc-logo", src: imgSrc(2), alt: "Save The File ★1", loading: "lazy", decoding: "async" }),
        el("p", { class: "tc-label", text: t("titleCard") }),
        titleText,
        nameText,
        el("p", { class: "tc-foot", text: "YOU DID IT! · Save The File ★1" })
      ),
      el("div", { class: "tc-form" },
        el("label", { for: "titleSelect", text: t("titlePick") }),
        el("div", { class: "select-wrap" }, select),
        el("label", { for: "nameInput", text: t("nameLabel") }),
        input,
        shareBtn
      )
    );
  }

  // 칭호 카드 → 휴대폰 화면에 꽉 차는 세로 이미지(1080×1920)
  function loadImage(src) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = src;
    });
  }

  function wrapLines(ctx, text, maxW) {
    // 단어 단위로 자르고, 한 단어가 너무 길면 글자 단위로 자른다
    const words = text.split(/(\s+)/);
    const lines = [];
    let line = "";
    for (const w of words) {
      const test = line + w;
      if (ctx.measureText(test).width <= maxW || !line.trim()) {
        if (ctx.measureText(test).width > maxW) {
          for (const ch of w) {
            if (ctx.measureText(line + ch).width > maxW && line) { lines.push(line); line = ch; }
            else line += ch;
          }
        } else line = test;
      } else {
        lines.push(line.trim());
        line = w.trimStart();
      }
    }
    if (line.trim()) lines.push(line.trim());
    return lines;
  }

  async function shareTitleImage(title, name) {
    const W = 1080, H = 1920;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    const css = getComputedStyle(document.documentElement);
    const c = (v) => css.getPropertyValue(v).trim();
    const PIXEL = '"Galmuri11", "DotGothic16", monospace';

    await Promise.all([
      document.fonts.load(`700 80px Galmuri11`, title + name),
      document.fonts.load(`400 40px Galmuri11`, "가A"),
      document.fonts.load(`400 40px DotGothic16`, "A"),
    ]).catch(() => null);
    const [logo, starImg, stripe, char] = await Promise.all(
      ["assets/PNG/2.png", "assets/PNG/6.png", "assets/PNG/1.png", "assets/PNG/5.png"].map(loadImage));

    // 배경
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#dff3fc");
    bg.addColorStop(1, "#ffe1ef");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 프로그램 창
    const x = 70, y = 170, w = W - 140, h = H - 340, r = 36;
    const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
    ctx.fillStyle = "rgba(27,39,102,.18)";
    rr(x + 16, y + 16, w, h, r); ctx.fill();
    ctx.fillStyle = "#fff";
    rr(x, y, w, h, r); ctx.fill();
    // 제목 표시줄
    ctx.save();
    rr(x, y, w, h, r); ctx.clip();
    const tb = ctx.createLinearGradient(0, y, 0, y + 120);
    tb.addColorStop(0, "#ffd0e6"); tb.addColorStop(.48, c("--c-youdidit"));
    tb.addColorStop(.52, c("--c-youdidit-d")); tb.addColorStop(1, c("--c-youdidit"));
    ctx.fillStyle = tb;
    ctx.fillRect(x, y, w, 120);
    ctx.drawImage(stripe, x, y + 120, w, 26);
    ctx.restore();
    ctx.lineWidth = 8;
    ctx.strokeStyle = c("--navy");
    rr(x, y, w, h, r); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + 120); ctx.lineTo(x + w, y + 120); ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.font = `400 54px "DotGothic16", ${PIXEL}`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.lineWidth = 8;
    ctx.strokeStyle = c("--navy");
    ctx.strokeText("YOU DID IT!", x + 44, y + 62);
    ctx.fillText("YOU DID IT!", x + 44, y + 62);
    // 장식 버튼
    [["#7fd3ff", w - 170], ["#ff9cc9", w - 90]].forEach(([col, dx]) => {
      ctx.beginPath(); ctx.arc(x + dx, y + 60, 28, 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
    });

    // 로고
    const lw = 560, lh = lw * logo.height / logo.width;
    ctx.drawImage(logo, (W - lw) / 2, y + 200, lw, lh);

    // 별 장식 (네 모서리)
    const s = 190;
    [[x - 50, y + 90, -12], [x + w - s + 50, y + 90, 14], [x - 40, y + h - s + 40, 10], [x + w - s + 40, y + h - s + 40, -8]]
      .forEach(([sx, sy, deg]) => {
        ctx.save();
        ctx.translate(sx + s / 2, sy + s / 2);
        ctx.rotate(deg * Math.PI / 180);
        ctx.drawImage(starImg, -s / 2, -s / 2, s, s * starImg.height / starImg.width);
        ctx.restore();
      });

    // 칭호
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    let cy = y + 200 + lh + 120;
    ctx.fillStyle = c("--c-youdidit-d");
    ctx.font = `400 46px ${PIXEL}`;
    ctx.fillText(t("titleCard"), W / 2, cy);

    let size = 92, lines;
    do {
      ctx.font = `700 ${size}px ${PIXEL}`;
      lines = wrapLines(ctx, `[${title}]`, w - 160);
      size -= 6;
    } while (lines.length > 4 && size > 50);
    size += 6;
    cy += 50;
    ctx.fillStyle = c("--navy");
    lines.forEach((ln) => { cy += size * 1.25; ctx.fillText(ln, W / 2, cy); });

    // 이름
    let nsize = 120;
    const nm = name || "???";
    do { ctx.font = `700 ${nsize}px ${PIXEL}`; nsize -= 8; } while (ctx.measureText(nm).width > w - 180 && nsize > 48);
    cy += nsize + 100;
    ctx.fillStyle = c("--pink");
    ctx.fillText(nm, W / 2, cy);
    const nw = Math.min(ctx.measureText(nm).width + 60, w - 120);
    ctx.fillStyle = c("--c-keyword");
    ctx.fillRect((W - nw) / 2, cy + 28, nw, 14);

    // 캐릭터 + 아래 문구
    const cw = 230;
    ctx.drawImage(char, (W - cw) / 2, y + h - cw - 70, cw, cw * char.height / char.width);
    ctx.fillStyle = c("--navy-2");
    ctx.font = `400 38px "DotGothic16", ${PIXEL}`;
    ctx.fillText("Save The File ★1", W / 2, H - 90);

    const blob = await new Promise((res) => cv.toBlob(res, "image/png"));
    const file = new File([blob], "save-the-file-title.png", { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "Save The File ★1", text: `[${title}] ${name}`.trim() });
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = el("a", { href: url, download: file.name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    showToast(`⤓ ${t("saved")}`);
  }

  /* =========================================================
     ITEM GET! — 인벤토리
     ========================================================= */
  function itemView(book) {
    const lang = L();
    const cats = book.categories;
    const wrap = el("div", { class: "inv", lang });

    const tabs = el("div", { class: "inv-tabs", role: "tablist", "aria-label": "Category" },
      cats.order.map((c) => {
        const n = book.items.filter((it) => it.cat === c).length;
        return el("button", {
          class: "inv-tab",
          type: "button",
          role: "tab",
          "aria-selected": String(c === state.itemCat),
          onclick: (e) => {
            state.itemCat = c;
            renderBook("item").then(() => {
              const sel = $(".inv-tab[aria-selected='true']");
              if (sel) sel.scrollIntoView({ inline: "center", block: "nearest" });
            });
          },
        }, el("span", { text: cats[lang][c] }), el("small", { text: String(n) }));
      }));

    const list = book.items.filter((it) => it.cat === state.itemCat);
    const slots = list.map((it) =>
      el("button", {
        class: "slot",
        type: "button",
        onclick: () => openItem(book, it.no),
        "aria-label": `No.${pad2(it.no)} ${it[lang].name}`,
      },
        el("span", { class: "slot-no", text: pad2(it.no) }),
        el("span", { class: "slot-name", text: it[lang].name })
      ));
    // 빈 가방 칸으로 줄을 채움
    const blanks = Math.max(6, Math.ceil(list.length / 3) * 3) - list.length;
    for (let i = 0; i < blanks; i++) slots.push(el("span", { class: "slot slot-empty", "aria-hidden": "true" }));

    wrap.append(
      el("div", { class: "inv-sticky" }, tabs),
      el("div", { class: "panel inv-bag" },
        el("header", { class: "panel-bar" },
          el("span", { text: `INVENTORY · ${cats[lang][state.itemCat]}` }),
          el("span", { text: `${list.length}/${book.items.length}` })
        ),
        el("div", { class: "inv-grid", role: "tabpanel" }, slots)
      )
    );
    return wrap;
  }

  function openItem(book, no) {
    const render = () => renderItemSheet(book, no);
    if (sheet.current && sheet.current.book === "item") sheet.swap(render, 1);
    else sheet.open("item", render);
  }

  function renderItemSheet(book, no) {
    const lang = L();
    const it = book.items.find((x) => x.no === no);
    const d = it[lang];
    const body = sheet.body;
    body.lang = lang;

    const stats = d.stats.length ? el("section", { class: "sh-sec" },
      el("h3", { class: "sh-label", text: t("stats") }),
      el("ul", { class: "stats" }, d.stats.map(statRow))
    ) : null;

    fill(body,
      el("header", { class: "sh-head" },
        el("p", { class: "sh-no" },
          el("span", { text: `No.${pad2(it.no)}` }),
          el("span", { class: "chip", text: d.category }),
          d.tag ? el("span", { class: "chip chip-soft", text: d.tag }) : null),
        el("h2", { class: "sh-title", id: "sheetTitle", text: d.name })
      ),
      el("div", { class: "sh-text" }, textParas(d.desc)),
      stats,
      d.side.length ? el("section", { class: "side-box" },
        el("h3", { class: "side-label", text: t("side") }),
        markList(d.side, CIRCLED)
      ) : null,
      d.notes.length ? el("div", { class: "sh-notes" }, d.notes.map((n) => el("p", { text: n }))) : null,
      d.combo || it.related.length ? el("section", { class: "sh-sec" },
        el("h3", { class: "sh-label", text: t("related") }),
        d.combo ? el("p", { class: "combo-text", text: d.combo }) : null,
        it.related.length ? el("div", { class: "rel-list" },
          it.related.map((rn) => {
            const r = book.items.find((x) => x.no === rn);
            return el("button", {
              class: "rel-chip",
              type: "button",
              onclick: () => sheet.swap(() => renderItemSheet(book, rn), 1),
            }, el("span", { class: "rel-no", text: pad2(rn) }), el("span", { text: r[lang].name }), el("span", { "aria-hidden": "true", text: "▶" }));
          })
        ) : null
      ) : null
    );
  }

  // 스탯: 10점 = 1칸, + 채운 칸, - 빗금 칸, 100 넘으면 시트 밖으로
  function statRow(s) {
    const kind = s.sign === "-" ? "minus" : s.sign === "+" ? "plus" : "neutral";
    const val = s.value == null ? "" : `${s.sign}${s.value}${s.unit}`;
    const cells = [];
    if (s.value == null) {
      for (let i = 0; i < 3; i++) cells.push(el("i", { class: "cell cell-q", text: "?" }));
    } else {
      const amount = s.value / 10;
      const full = Math.floor(amount);
      const part = amount - full;
      for (let i = 0; i < full; i++) cells.push(el("i", { class: `cell ${kind}` }));
      if (part > 0) cells.push(el("i", { class: `cell ${kind} part`, style: `--p:${Math.round(part * 100)}%` }));
      for (let i = cells.length; i < 10; i++) cells.push(el("i", { class: "cell empty" }));
    }
    const over = s.value != null && s.value > 100;
    return el("li", { class: `stat${over ? " over" : ""}`, "aria-label": s.raw },
      el("div", { class: "stat-top" },
        el("span", { class: "stat-label" }, s.label, s.note ? el("small", { text: ` ${s.note}` }) : null),
        el("b", { class: `stat-val ${kind}`, text: val })
      ),
      el("div", { class: "stat-bar", "aria-hidden": "true" }, cells),
      over ? el("span", { class: "stat-over", "aria-hidden": "true", text: t("over") }) : null
    );
  }

  /* =========================================================
     KEYWORD HUNT — 속뜻을 직접 여는 사전
     ========================================================= */
  function keywordMatches(it, q) {
    if (!q) return true;
    const hay = LANGS.map((l) => {
      const d = it[l];
      return [d.title, d.roman, d.original, d.category, d.meaning, ...d.synonyms].join(" ");
    }).join(" ").toLowerCase();
    return q.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
  }

  function keywordView(book) {
    const lang = L();
    const wrap = el("div", { class: "kw", lang });
    const list = el("ul", { class: "kw-list" });
    const empty = el("p", { class: "kw-empty", text: t("noResult"), hidden: true });
    const count = el("span", { class: "kw-count" });

    const draw = () => {
      const shown = book.items.filter((it) => keywordMatches(it, state.query));
      count.textContent = `${shown.length} / ${book.items.length}`;
      empty.hidden = shown.length > 0;
      list.replaceChildren(...shown.map((it) => {
        const d = it[lang];
        return el("li", {},
          el("button", {
            class: "bubble",
            type: "button",
            onclick: () => openKeyword(book, it.no),
          },
            el("span", { class: "bubble-no", text: `No.${pad2(it.no)}` }),
            el("span", { class: "bubble-title", text: d.title }),
            el("span", { class: "bubble-sub", lang: lang === "ko" ? "en" : "ko", text: lang === "ko" ? d.roman : d.original }),
            el("span", { class: "bubble-cat", text: d.category })
          )
        );
      }));
    };

    const input = el("input", {
      id: "kwSearch",
      type: "search",
      inputmode: "search",
      enterkeyhint: "search",
      autocomplete: "off",
      placeholder: t("searchPh"),
      value: state.query,
      oninput: (e) => { state.query = e.target.value; draw(); },
      onkeydown: (e) => { if (e.key === "Enter") e.target.blur(); },
    });

    wrap.append(
      el("div", { class: "kw-sticky" },
        el("label", { class: "kw-search" },
          el("span", { class: "sr-only", text: t("searchLabel") }),
          el("span", { class: "kw-search-icon", "aria-hidden": "true" }),
          input
        ),
        count
      ),
      list,
      empty
    );
    draw();
    return wrap;
  }

  function openKeyword(book, no) {
    const order = () => book.items.filter((it) => keywordMatches(it, state.query)).map((it) => it.no);
    let cur = no;
    let revealed = false;
    const render = () => renderKeywordSheet(book, cur, revealed, order(), {
      toggle: () => { revealed = !revealed; render(); },
    });
    const nav = (dir) => {
      const ids = order();
      const i = ids.indexOf(cur);
      const nextNo = ids[i + dir];
      if (nextNo == null) return;
      cur = nextNo;
      revealed = false;
      sheet.swap(render, dir);
    };
    sheet.open("keyword", render, nav);
    sheet.current.nav = nav;
  }

  function renderKeywordSheet(book, no, revealed, ids, actions) {
    const lang = L();
    const it = book.items.find((x) => x.no === no);
    const d = it[lang];
    const idx = ids.indexOf(no);
    const body = sheet.body;
    body.lang = lang;

    const sec = (label, content) => el("section", { class: "sh-sec" }, el("h3", { class: "sh-label", text: label }), content);
    const plain = (arr) => el("div", { class: "sh-text" }, arr.map((s) => el("p", { text: s })));

    const extra = [];
    if (d.hidden.length) extra.push(sec(t("hidden"), markList(d.hidden, SUP, "hidden-list")));
    if (d.synonyms.length) extra.push(sec(t("synonyms"), plain(d.synonyms)));
    if (d.symbols.length) extra.push(sec(t("symbols"), plain(d.symbols)));
    if (d.caution) extra.push(sec(t("caution"), el("div", { class: "caution-box" }, textParas(d.caution))));
    if (d.examples.length) extra.push(sec(t("examples"), el("div", { class: "examples" }, d.examples.map((s) => el("p", { class: "ex", text: s })))));

    const navBtn = (dir, label, glyph) => el("button", {
      class: "kw-nav",
      type: "button",
      "aria-label": label,
      disabled: ids[idx + dir] == null,
      onclick: () => sheet.current.nav(dir),
    }, glyph);

    fill(body,
      el("header", { class: "sh-head" },
        el("p", { class: "sh-no" },
          el("span", { text: `No.${pad2(it.no)}` }),
          el("span", { class: "chip", text: d.category })),
        el("h2", { class: "sh-title", id: "sheetTitle", text: d.title }),
        el("p", { class: "sh-sub", lang: lang === "ko" ? "en" : "ko", text: lang === "ko" ? d.roman : d.original })
      ),
      sec(t("meaning"), el("div", { class: "sh-text" },
        textParas(d.meaning),
        d.list.length ? markList(d.list, SUP) : null)),
      extra.length ? el("button", {
        class: "pill reveal-btn",
        type: "button",
        "aria-expanded": String(revealed),
        "aria-controls": "kwExtra",
        text: revealed ? `▲ ${t("conceal")}` : `▼ ${t("reveal")}`,
        onclick: actions.toggle,
      }) : null,
      el("div", { class: "kw-extra", id: "kwExtra", hidden: !revealed }, extra),
      el("nav", { class: "kw-pager" },
        navBtn(-1, t("prev"), "◀"),
        el("span", { class: "kw-pos" }, el("b", { text: `${idx + 1} / ${ids.length}` }), el("small", { text: t("swipeHint") })),
        navBtn(1, t("next"), "▶")
      )
    );
  }

  /* ---------------------------------------------------------
     라우터
     --------------------------------------------------------- */
  function routeFromHash() {
    const r = location.hash.replace(/^#\/?/, "");
    return ROUTES.includes(r) ? r : "home";
  }

  async function go() {
    const route = routeFromHash();
    if (route === state.route) return;
    state.route = route;
    sheet.close();

    $$(".view").forEach((v) => {
      const on = v.dataset.view === route;
      v.hidden = !on;
      v.classList.toggle("enter", on && !reduceMotion.matches);
    });
    $$(".tab").forEach((a) => {
      if (a.dataset.tab === route) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    $("#viewport").scrollTop = 0;

    if (BOOKS.includes(route)) {
      try { await renderBook(route); }
      catch (e) { console.error(e); }
    }
    if (route === "home") updateDots();
  }

  window.addEventListener("hashchange", () => { if (unlocked) go(); });

  /* ---------------------------------------------------------
     QR 전용 잠금
     QR 주소(?k=열쇠)로 들어오면 열쇠를 이 기기에만 저장하고 주소창에서 지운다.
     → 주소를 복사·공유해도 열쇠 없는 기본 주소만 나가서, 받은 사람은 잠금 화면을 본다.
     코드에는 열쇠가 아니라 열쇠의 SHA-256 값만 있다. (열쇠는 qr/key.txt, 저장소에 안 올라감)
     --------------------------------------------------------- */
  const KEY_HASH = "e9dd03a63903c89be8e9a16e4535b4cd0dabf463297f87071a4a956bc655d35c";
  let unlocked = false;

  async function sha256(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
  }

  async function checkPass() {
    if (!window.crypto || !crypto.subtle) return false;  // https(또는 localhost)에서만 동작
    const url = new URL(location.href);
    const fromQR = url.searchParams.get("k");
    if (fromQR) {
      url.searchParams.delete("k");
      history.replaceState(null, "", url.pathname + url.search + url.hash);
      if ((await sha256(fromQR)) === KEY_HASH) {
        store.set("stf-pass", fromQR);
        return true;
      }
    }
    const saved = store.get("stf-pass");
    return !!saved && (await sha256(saved)) === KEY_HASH;
  }

  /* ---------------------------------------------------------
     시작
     --------------------------------------------------------- */
  function start() {
    unlocked = true;
    document.documentElement.classList.add("unlocked");
    applyLang();
    renderHome().catch((e) => {
      console.error(e);
      $("#introLines").textContent = "data/intro.json 을 불러오지 못했어요. 로컬에서는 웹 서버로 열어주세요 (README 참고).";
    });
    go();
  }

  function showGate() {
    const gate = $("#gate");
    $("#gateChar").src = imgSrc(5);
    $("#gateLogo").src = imgSrc(2);
    gate.hidden = false;
  }

  checkPass().then((ok) => (ok ? start() : showGate()), () => showGate());

  // 첫 화면이 다 뜬 뒤, 로딩 캐릭터와 토스트 배지를 조용히 미리 받아둔다 (느린 와이파이 대비)
  window.addEventListener("load", () => {
    if (!unlocked) return;
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
    idle(() => { setPicture($("#loadingChar"), "5"); setPicture($("#toastIcon"), "badge"); });
  });
})();
