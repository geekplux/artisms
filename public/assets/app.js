/* Art-isms — rendering, i18n and image loading. Plain browser JavaScript, no build step. */
(function () {
  "use strict";

  /* Works still under copyright (museum images, non-free Wikipedia files) are replaced by a
     placeholder that links to the source. Set to true only if you have the right to show them. */
  const SHOW_RESTRICTED_IMAGES = false;
  /* Card frames are 300px tall with 14px padding; images are fitted inside with object-fit: contain. */
  const FRAME_H = 272;

  const D = window.ARTISMS;
  const MV = D.movements;
  const BY = Object.fromEntries(MV.map((m) => [m.id, m]));
  const GROUP = Object.fromEntries(D.groups.map((g) => [g.id, g]));
  const ERA = Object.fromEntries(D.eras.map((e) => [e.id, e]));
  const WORKS = MV.reduce((n, m) => n + m.works.length, 0);

  const UI = {
    en: {
      docTitle: "Art-isms: a visual atlas of 40 art styles",
      brand: "Art-isms", brandSub: "", navTimeline: "Timeline", navStyles: "Styles", navWhy: "Why styles change", navStudy: "How to look",
      star: "Star", starTitle: "Star Art-isms on GitHub",
      ariaSisters: "Sister atlases", sistersT: "Three atlases, one grid", sArtisms: "Art-isms", sArtismsD: "40 art styles across 45,000 years", sWorldlines: "Worldlines", sWorldlinesD: "26 countries and 8 regions across 15,000 years", sDialectica: "Dialectica", sDialecticaD: "72 schools and 204 thinkers across 8 traditions", sistersBy: "Made by <a href=\"https://geekplux.com/\">GeekPlux</a>. I built these atlases out of my own curiosity, mainly to learn from them myself.",
      navLabel: "Sections", langLabel: "Language", mastLabel: "Four works from the atlas", jumpLabel: "Jump to a style",
      meta: "A visual atlas of 40 art styles: a 45,000-year timeline, how each style grew from the last, and three real works for every style. In English and Chinese.",
      kicker: "A visual atlas of art styles", h1a: "ART-", h1b: "ISMS", h1Label: "Art-isms", skip: "Skip to content",
      dek: "How art styles <strong>began</strong>, what they <strong>look like</strong>, and how each one grew out of the last, with three real works for every style.",
      stats: (n, w) => `45,000 years · ${n} styles · ${w} works · 2 languages`,
      ctaTimeline: "See the timeline",
      howManyTitle: "How many art styles are there?",
      howMany1: "There is no official number. Lists of named movements run to several hundred, most of them offshoots, regional schools or short-lived groups, and historians disagree on where one ends and the next begins. This atlas maps 40 that changed how art is made.",
      howMany2: "Periods, movements, techniques and cultural traditions are different kinds of category. Broad labels such as “African”, “Indigenous” and “Islamic” cover many distinct peoples, places and histories, and are used here as entry points, not as single styles.",
      tlTitle: "45,000 years on one line",
      tlLede: "Each bar is a style’s conventional date range. Hover over a name to light up what it grew from and what it led to. Select it to jump to the style.",
      tlHint: "Scroll sideways to see the whole timeline →", tlHead: "Style",
      legRule: "Change of scale: older periods are compressed", legHatch: "Living tradition, still practised", legRel: "Related styles",
      filterEra: "Era", filterGroup: "Region", filterBtn: "Filter", reset: "Reset", contents: "Contents", jump: "Jump to a style…", empty: "No style matches these filters.",
      results: (n, total) => n === total ? `All ${total} styles` : `${n} of ${total} styles`, stylesUnit: "styles",
      traits: "Signature traits", from: "Grew out of", to: "Led to", noneFrom: "No direct predecessor in this atlas", noneTo: "Still unfolding, or no direct successor in this atlas",
      look: "Look for", source: "Image source", home: "Mondrian’s movement", article: "Wikipedia article, opens in a new tab", articleEn: "",
      loading: "Loading image…",
      restrictedTitle: "In copyright", restrictedBody: "This work is not reproduced here.", restrictedLink: "See it at the source ↗",
      failedTitle: "Image unavailable", failedBody: "It could not be loaded (offline, or blocked by this viewer).", failedLink: "Open the source ↗",
      whyTitle: "Why do styles change?", whyLede: "Three forces show up again and again across the timeline. Select a style to jump to it.",
      caveatTag: "But", caveat: "These are recurring patterns, not laws. Patrons, religion, politics, money and a few stubborn individuals shape styles just as much, and many changes have more than one cause.",
      namesTitle: "Named by their critics",
      studyTitle: "How to look at any style", studyLede: "Five steps that work in a museum, a book or this page.",
      footImgTitle: "About the images",
      footImg1: "Images are freely licensed files from Wikimedia Commons, resized and hosted with this site. Each card credits the author and licence and links to the file page. Works still under copyright are not reproduced; their cards link to the museum or article instead.",
      footImg2: "Check the source page before reusing any image.",
      footDataTitle: "About the dates",
      footData: "Dates are conventional ranges. Styles overlap, and historians draw the boundaries in different places. Hatched bars mark living traditions that are still practised.",
      footProjTitle: "The project",
      footProj: "A static site with no build step: HTML, CSS and plain JavaScript, with all content in one bilingual data file. A sibling of <a href=\"https://worldlines.geekplux.com/\">Worldlines</a> and <a href=\"https://dialectica.geekplux.com/\">Dialectica</a>. Corrections are welcome on <a href=\"https://github.com/geekplux/artisms\">GitHub</a>.",
      consentText: "This site uses Google Analytics to count visits. Allow it to set analytics cookies?", consentYes: "Accept", consentNo: "Decline", cookieSettings: "Cookie settings",
      close: "Close", bce: "BCE", now: "now"
    },
    zh: {
      docTitle: "艺术流派志：40个艺术流派的视觉图谱",
      brand: "艺术流派志", brandSub: "Art-isms", navTimeline: "时间线", navStyles: "流派", navWhy: "风格为何改变", navStudy: "如何观看",
      star: "星标", starTitle: "在 GitHub 上给艺术流派志加星标",
      ariaSisters: "姊妹图谱", sistersT: "三部图谱，一张网格", sArtisms: "艺术流派志", sArtismsD: "四万五千年里的40个艺术流派", sWorldlines: "世界线", sWorldlinesD: "一万五千年里的26个国家与8个地区", sDialectica: "思辨谱", sDialecticaD: "8个传统中的72个学派与204位思想家", sistersBy: "由 <a href=\"https://geekplux.com/\">GeekPlux</a> 制作。出于个人兴趣，我做了这几部图谱，主要是为了自己学习。",
      navLabel: "栏目", langLabel: "语言", mastLabel: "图谱中的四件作品", jumpLabel: "跳转到流派",
      meta: "收录40个艺术流派的图谱：一条四万五千年的时间线，每个流派如何从前一个流派中生长出来，并为每个流派配上三件真实作品。中英双语。",
      kicker: "艺术风格图谱", h1a: "艺术", h1b: "流派志", h1Label: "艺术流派志", skip: "跳到正文",
      dek: "艺术风格如何<strong>开始</strong>、长什么<strong>样子</strong>，又如何一脉相承、彼此反叛；每个流派配有三件真实作品。",
      stats: (n, w) => `45,000 年 · ${n} 个流派 · ${w} 件作品 · 2 种语言`,
      ctaTimeline: "查看时间线",
      howManyTitle: "艺术风格到底有多少种？",
      howMany1: "没有官方数字。有名可查的艺术流派多达数百个，其中大部分是分支、地方画派或昙花一现的团体；对于一种风格在哪里结束、下一种从哪里开始，学者也常有分歧。本图谱收录了40个改变艺术创作方式的流派。",
      howMany2: "时期、运动、技法与文化传统是不同类型的分类。“非洲”“原住民”“伊斯兰”等宽泛标签涵盖了许多不同的民族、地域与历史，本站把它们作为入门的切入点，而非单一风格。",
      tlTitle: "四万五千年，一条时间线",
      tlLede: "每根色条代表一个流派约定俗成的年代范围。鼠标悬停在名称上可点亮它的来源与去向，点击即可跳转到该流派。",
      tlHint: "左右滑动查看完整时间线 →", tlHead: "流派",
      legRule: "比例尺变化：较早的时代被压缩", legHatch: "延续至今的活传统", legRel: "相关流派",
      filterEra: "时代", filterGroup: "地区", filterBtn: "筛选", reset: "重置", contents: "目录", jump: "跳转到流派…", empty: "没有符合筛选条件的流派。",
      results: (n, total) => n === total ? `全部 ${total} 个流派` : `显示 ${n} / ${total} 个流派`, stylesUnit: "个流派",
      traits: "标志特征", from: "源自", to: "影响了", noneFrom: "本图谱中没有直接前身", noneTo: "仍在发展中，或本图谱中没有直接后继",
      look: "看点", source: "图片来源", home: "蒙德里安所属流派", article: "维基百科条目，在新标签页打开", articleEn: "英文维基百科条目，在新标签页打开",
      loading: "图片加载中…",
      restrictedTitle: "版权保护中", restrictedBody: "本站不复制此作品图片。", restrictedLink: "前往来源查看 ↗",
      failedTitle: "图片无法显示", failedBody: "图片未能加载（可能离线，或被当前浏览环境拦截）。", failedLink: "打开来源 ↗",
      whyTitle: "风格为何改变？", whyLede: "在整条时间线上，有三种力量反复出现。点击流派名称即可跳转。",
      caveatTag: "但是", caveat: "这些是反复出现的规律，而不是定律。赞助人、宗教、政治、金钱和少数固执的个人同样塑造着风格，很多变化也不止一个原因。",
      namesTitle: "被批评者命名",
      studyTitle: "如何观看任何一种风格", studyLede: "五个步骤，在博物馆、书本或本页都适用。",
      footImgTitle: "关于图片",
      footImg1: "图片均为维基共享资源上的自由许可文件，经缩放后由本站托管。每张卡片注明作者与许可，并链接到文件页。仍受版权保护的作品不在本站复制，卡片改为链接至博物馆或条目页面。",
      footImg2: "转载任何图片前，请先查看来源页的许可信息。",
      footDataTitle: "关于年代",
      footData: "年代均为约定俗成的范围。流派之间相互重叠，学者划定的边界也各不相同。斜纹色条表示至今仍在延续的活传统。",
      footProjTitle: "关于项目",
      footProj: "一个无需构建的静态网站：HTML、CSS 与原生 JavaScript，全部内容集中在一个中英双语数据文件中。它是 <a href=\"https://worldlines.geekplux.com/\">世界线</a> 与 <a href=\"https://dialectica.geekplux.com/\">思辨谱</a> 的姊妹项目。欢迎在 <a href=\"https://github.com/geekplux/artisms\">GitHub</a> 上提出修订。",
      consentText: "本站使用 Google Analytics 统计访问量。是否允许设置统计 Cookie？", consentYes: "接受", consentNo: "拒绝", cookieSettings: "Cookie 设置",
      close: "关闭", bce: "前", now: "今"
    }
  };

  /* ── State ─────────────────────────────────── */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  };
  /* Language: ?lang=en|zh (shareable links) wins, then the visitor's saved choice; otherwise English. */
  const LANGS = ["en", "zh"];
  const urlLang = new URLSearchParams(location.search).get("lang");
  let lang = LANGS.includes(urlLang) ? urlLang : store.get("art-isms-lang") || "en";
  if (!LANGS.includes(lang)) lang = "en";
  /* Update one query parameter without reloading or touching the hash. */
  function setParam(key, value) {
    try {
      const u = new URL(location.href);
      if (value == null) u.searchParams.delete(key); else u.searchParams.set(key, value);
      history.replaceState(null, "", u.pathname + u.search + u.hash);
    } catch (e) { /* sandboxed */ }
  }
  /* Keep the address true to the language on screen: Chinese is /?lang=zh, English is plain /.
     An explicit ?lang=en is left alone, so such a link keeps beating a saved Chinese preference. */
  if (lang === "zh" && urlLang !== "zh") setParam("lang", "zh");
  /* Analytics: a no-op off the production domain, where gtag is never defined. Never send free text. */
  const track = (name, params) => { if (typeof window.gtag === "function") window.gtag("event", name, params); };
  /* Sent after rendering, with the final title. No hash: it carries the style id, not a page. */
  const pageView = () => track("page_view", { page_title: document.title, page_location: location.origin + location.pathname + location.search });
  /* Filters: sets of selected era and region ids; empty means "all". Kept in ?era=…&region=… */
  const listParam = (key, valid) => (new URLSearchParams(location.search).get(key) || "").split(",").filter((v) => valid.includes(v));
  const fEras = new Set(listParam("era", D.eras.map((e) => e.id)));
  const fRegions = new Set(listParam("region", D.groups.map((g) => g.id)));

  const t = (k) => (UI[lang][k] ?? UI.en[k] ?? k);
  const p = (o) => (o ? (o[lang] ?? o.en) : "");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const num = (i) => String(i + 1).padStart(2, "0");

  /* ── Image sources ─────────────────────────── */
  /* Freely licensed works are hosted with the site (scripts/fetch-images.mjs):
     images/<movement>/<n>.webp, long edge ≤ 1200px, plus <n>-480.webp. */
  const wikiUrl = (title, site = "en") =>
    `https://${site === "zh" ? "zh.wikipedia.org/zh-cn" : "en.wikipedia.org/wiki"}/${encodeURIComponent(title.replace(/ /g, "_"))}`;
  /* A work's Wikipedia article: the Chinese one in the Chinese view when it exists, otherwise English. */
  function article(w) {
    if (lang === "zh" && w.zhwiki) return { href: wikiUrl(w.zhwiki, "zh"), english: false };
    return { href: wikiUrl(w.wiki), english: lang === "zh" };
  }
  /* The work's title as a link to its article, with a ↗ that appears on hover (always shown on touch). */
  function titleLink(w) {
    const a = article(w);
    return `<a class="wl" href="${esc(a.href)}" target="_blank" rel="noopener"${a.english ? ' hreflang="en"' : ""}>${esc(p(w.t))}` +
      `<span class="go" aria-hidden="true">&nbsp;↗${a.english ? "<small>EN</small>" : ""}</span><span class="vh"> (${esc(t(a.english ? "articleEn" : "article"))})</span></a>`;
  }
  const host = (url) => new URL(url).hostname.replace(/^www\./, "");

  /* Resolve a work to { src, srcset, w, h, page, credit, restricted }. */
  function resolveImage(mid, wi) {
    const w = BY[mid].works[wi];
    if (w.image) {
      /* ?v= is a content hash, so public/_headers can cache images for a year. */
      const base = `images/${mid}/${wi + 1}`, im = w.image, v = `?v=${im.v}`;
      return {
        src: `${base}.webp${v}`, srcset: `${base}-480.webp${v} ${Math.round(480 * im.w / Math.max(im.w, im.h))}w, ${base}.webp${v} ${im.w}w`,
        w: im.w, h: im.h, page: im.page, credit: `${im.author} · ${im.license}`
      };
    }
    if (w.img) return { src: w.img, page: w.src || w.img, credit: host(w.src || w.img), restricted: true };
    const page = w.src || article(w).href;
    return { page, credit: host(page), restricted: true };
  }
  /* Frames size themselves to the work's shape where the layout allows (viewer, single-column cards). */
  function arStyle(mid, wi) {
    const im = BY[mid].works[wi].image;
    return im && im.w ? ` style="--ar:${im.w}/${im.h}"` : "";
  }
  function setImg(img, r, sizes) {
    if (r.srcset) { img.srcset = r.srcset; img.sizes = sizes; img.width = r.w; img.height = r.h; }
    img.src = r.src;
  }

  /* Mondrian placeholder, seeded by the work's title so it stays stable */
  function rng(seed) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
  }
  function plateSvg(seed) {
    const r = rng(seed), cells = [], L = 2.2;
    (function split(x, y, w, h, d) {
      if (d >= 3 || (w < 22 && h < 22) || (d >= 2 && r() < 0.3)) { cells.push([x, y, w, h]); return; }
      const v = w / h > 1.2 ? true : h / w > 1.2 ? false : r() < 0.5, f = 0.3 + r() * 0.4;
      if (v) { split(x, y, w * f, h, d + 1); split(x + w * f, y, w * (1 - f), h, d + 1); }
      else { split(x, y, w, h * f, d + 1); split(x, y + h * f, w, h * (1 - f), d + 1); }
    })(0, 0, 160, 100, 0);
    const colors = ["#fffdf7", "#fffdf7", "#fffdf7", "#e9e4d8", "#d52b1e", "#1d4ed8", "#f3c623"];
    return `<svg viewBox="0 0 160 100" preserveAspectRatio="none" aria-hidden="true"><rect width="160" height="100" fill="#141414"/>${cells.map((c) =>
      `<rect x="${(c[0] + L / 2).toFixed(1)}" y="${(c[1] + L / 2).toFixed(1)}" width="${(c[2] - L).toFixed(1)}" height="${(c[3] - L).toFixed(1)}" fill="${colors[Math.floor(r() * colors.length)]}"/>`).join("")}</svg>`;
  }
  function showPlate(frame, w, kind, page) {
    frame.classList.add("plate", "ready");
    frame.innerHTML = `${plateSvg(w.t.en)}<div class="why"><b>${esc(t(kind + "Title"))}</b><span>${esc(t(kind + "Body"))}</span><a href="${esc(page)}" target="_blank" rel="noopener">${esc(t(kind + "Link"))}</a></div>`;
  }
  function loadInto(frame, mid, wi, sizes) {
    const w = BY[mid].works[wi], r = resolveImage(mid, wi);
    const credit = frame.closest(".card")?.querySelector(".credit .src");
    if (credit) { credit.textContent = r.credit; credit.href = r.page; }
    if (!r.src || (r.restricted && !SHOW_RESTRICTED_IMAGES)) { showPlate(frame, w, "restricted", r.page || article(w).href); return; }
    const img = frame.querySelector("img");
    img.onload = () => { img.classList.add("ok"); frame.classList.add("ready"); };
    img.onerror = () => showPlate(frame, w, "failed", r.page || article(w).href);
    /* Rendered width ≈ the narrower of the column and the frame height × aspect ratio. */
    setImg(img, r, sizes || (r.w ? `min(${Math.round(FRAME_H * r.w / r.h)}px, calc(100vw - 60px))` : ""));
  }

  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const [mid, wi] = e.target.dataset.work.split(":");
      loadInto(e.target, mid, +wi);
    });
  }, { rootMargin: "800px 0px" }) : null;

  /* ── Static copy ───────────────────────────── */
  function applyStatic() {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    document.title = t("docTitle");
    $('link[rel="canonical"]').href = lang === "zh" ? "https://artisms.geekplux.com/?lang=zh" : "https://artisms.geekplux.com/";
    $('meta[name="description"]').setAttribute("content", t("meta"));
    $(".brand small").hidden = !t("brandSub");
    $$("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    $$("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
    $$(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    const star = $("#gh-star"); star.title = t("starTitle"); star.setAttribute("aria-label", t("starTitle"));
    $$("a[data-sister]").forEach((a) => { a.href = `https://${a.dataset.sister}.geekplux.com/${lang === "zh" ? "?lang=zh" : ""}`; });
    $("#stats").textContent = UI[lang].stats(MV.length, WORKS);
  }

  /* ── Masthead composition ──────────────────── */
  const MAST = [["ukiyoe", 0, "c1 blue"], ["renaissance", 0, "c2"], [null, 0, "c3 red"], ["expressionism", 0, "c4 yellow"], ["postimpressionism", 0, "c5 blue"]];
  function renderMast() {
    $("#mast-art").innerHTML = MAST.map(([id, i, cls]) => {
      if (!id) return `<div class="cell ${cls}"></div>`;
      const w = BY[id].works[i];
      return `<div class="cell ${cls}"><img alt="" data-work="${id}:${i}"><button type="button" data-view="${id}:${i}" aria-label="${esc(p(w.t))}"></button><span class="tag">${esc(p(w.t))}</span></div>`;
    }).join("");
    $$("#mast-art img").forEach((img) => {
      const [mid, wi] = img.dataset.work.split(":");
      img.onload = () => img.classList.add("ok");
      img.onerror = () => img.remove();
      setImg(img, resolveImage(mid, +wi), "(max-width: 900px) 60vw, 25vw");
    });
  }

  /* ── Timeline ──────────────────────────────── */
  const SEG = [[-40000, -3500, 0.07], [-3500, 500, 0.13], [500, 1400, 0.12], [1400, 1800, 0.21], [1800, 1900, 0.2], [1900, 2026, 0.27]];
  function x(year) {
    let acc = 0;
    for (const [a, b, share] of SEG) {
      if (year <= b) return (acc + share * Math.max(0, (year - a) / (b - a))) * 100;
      acc += share;
    }
    return 100;
  }
  function fmtYear(y) {
    if (y >= 2026) return t("now");
    if (y < 0) { const n = Math.abs(y).toLocaleString("en-US"); return lang === "zh" ? `${t("bce")}${n}` : `${n} ${t("bce")}`; }
    return String(y);
  }
  function renderTimeline() {
    const ticks = [-40000, 0, 500, 1000, 1400, 1600, 1800, 1850, 1900, 1950, 2026];
    const edges = SEG.slice(1).map((s) => s[0]);
    let h = `<div class="tl-rules" aria-hidden="true">`;
    ticks.slice(1, -1).forEach((y) => { if (!edges.includes(y) && y !== 0) h += `<span class="g" style="left:${x(y)}%"></span>`; });
    edges.forEach((y) => { h += `<span class="r" style="left:${x(y)}%"></span>`; });
    h += `</div><div class="tl-row tl-axis"><div class="tl-name">${esc(t("tlHead"))}</div><div class="tl-track">`;
    ticks.forEach((y, i) => { h += `<span class="tick${i === 0 ? " l" : i === ticks.length - 1 ? " r" : ""}" style="left:${x(y)}%">${esc(fmtYear(y))}</span>`; });
    h += `</div></div>`;
    MV.forEach((m, i) => {
      const l = x(m.start), w = Math.max(0.5, x(m.end) - l), label = `${p(m.name)} · ${p(m.years)}`;
      h += `<div class="tl-row g-${m.group}" data-id="${m.id}">
        <button type="button" class="tl-name" data-go="${m.id}" title="${esc(label)}"><span class="n">${num(i)}</span><span class="sw"></span><span>${esc(p(m.name))}</span></button>
        <div class="tl-track"><button type="button" class="tl-bar${m.living ? " living" : ""}" data-go="${m.id}" style="left:${l}%;width:${w}%" title="${esc(label)}" aria-label="${esc(label)}"></button></div></div>`;
    });
    $("#tl").innerHTML = h;
    $("#legend").innerHTML = `<div class="regions" role="group" aria-label="${esc(t("filterGroup"))}">${D.groups.map(regionToggle).join("")}</div>` +
      `<span><i class="hatch"></i>${esc(t("legHatch"))}</span><span><i class="rule"></i>${esc(t("legRule"))}</span>`;
  }
  function highlight(id) {
    const rows = $$(".tl-row[data-id]");
    if (!id) { rows.forEach((r) => r.classList.remove("dim", "rel", "focus")); return; }
    const rel = new Set([...BY[id].from, ...BY[id].to]);
    rows.forEach((r) => {
      const rid = r.dataset.id;
      r.classList.toggle("focus", rid === id);
      r.classList.toggle("rel", rel.has(rid));
      r.classList.toggle("dim", rid !== id && !rel.has(rid));
    });
  }

  /* ── Filters + contents ────────────────────── */
  const inEra = (m) => !fEras.size || fEras.has(m.era);
  const inRegion = (m) => !fRegions.size || fRegions.has(m.group);
  const visible = (m) => inEra(m) && inRegion(m);
  const countOf = (pred) => MV.filter(pred).length;
  /* One component for region toggles: the filter bar and the timeline legend both use it. */
  function regionToggle(g) {
    return `<button type="button" class="rt g-${g.id}" data-region="${g.id}" aria-pressed="${fRegions.has(g.id)}">` +
      `<i aria-hidden="true"></i><span class="rt-n">${esc(p(g.name))}</span><span class="ct">${countOf((m) => m.group === g.id && inEra(m))}<span class="vh"> ${esc(t("stylesUnit"))}</span></span></button>`;
  }
  /* Eras read left to right like the timeline: name, date span, matching styles. */
  function renderFilters() {
    $("#f-era").innerHTML = D.eras.map((e) => {
      const n = countOf((m) => m.era === e.id && inRegion(m));
      return `<button type="button" class="seg${n ? "" : " none"}" data-era="${e.id}" aria-pressed="${fEras.has(e.id)}">` +
        `<span class="seg-n">${esc(p(e.name))}</span><span class="seg-s">${esc(p(e.span))}</span><span class="ct">${n}<span class="vh"> ${esc(t("stylesUnit"))}</span></span></button>`;
    }).join("");
    $("#f-group").innerHTML = D.groups.map(regionToggle).join("");
    const shown = countOf(visible), active = fEras.size + fRegions.size;
    $("#fb-count").textContent = UI[lang].results(shown, MV.length);
    $("#fb-active").textContent = active ? ` · ${active}` : "";
    $("#fb-reset").disabled = !active;
  }
  function renderToc() {
    $("#toc").innerHTML = MV.map((m, i) => `<li ${visible(m) ? "" : "hidden"}><a href="#${m.id}" data-toc="${m.id}"><span class="idx">${num(i)}</span><span><b>${esc(p(m.name))}</b><small>${esc(p(m.years))}</small></span></a></li>`).join("");
    $("#jump").innerHTML = `<option value="">${esc(t("jump"))}</option>` + MV.filter(visible).map((m) => `<option value="${m.id}">${num(MV.indexOf(m))} · ${esc(p(m.name))}</option>`).join("");
  }
  function applyFilters() {
    $$(".mv").forEach((s) => { s.hidden = !visible(BY[s.id]); });
    $$(".tl-row[data-id]").forEach((r) => r.classList.toggle("out", !visible(BY[r.dataset.id])));
    // Re-render the controls in place, keeping keyboard focus on the toggle that was used.
    const focused = document.activeElement?.closest("[data-era], [data-region]");
    const key = focused && (focused.dataset.era ? `[data-era="${focused.dataset.era}"]` : `[data-region="${focused.dataset.region}"]`);
    const inLegend = focused && focused.closest("#legend");
    renderFilters();
    $("#legend .regions").innerHTML = D.groups.map(regionToggle).join("");
    if (key) $((inLegend ? "#legend " : "#fbar ") + key)?.focus();
    renderToc();
    $("#movements .empty")?.remove();
    if (!MV.some(visible)) $("#movements").insertAdjacentHTML("beforeend", `<p class="empty">${esc(t("empty"))} <button type="button" class="lk" data-reset>${esc(t("reset"))}</button></p>`);
    setParam("era", fEras.size ? [...fEras].join(",") : null);
    setParam("region", fRegions.size ? [...fRegions].join(",") : null);
  }
  function resetFilters() { fEras.clear(); fRegions.clear(); applyFilters(); }
  const toggle = (set, id, type) => {
    if (set.has(id)) set.delete(id);
    else { set.add(id); track("select_content", { content_type: type, item_id: id }); }
    applyFilters();
  };

  /* ── Movement sections ─────────────────────── */
  const chip = (id) => `<button type="button" class="lk g-${BY[id].group}" data-go="${id}"><span class="sw"></span>${esc(p(BY[id].name))}</button>`;
  function renderMovements() {
    $("#movements").innerHTML = MV.map((m, i) => `
      <section class="mv g-${m.group}" id="${m.id}" ${visible(m) ? "" : "hidden"} aria-labelledby="h-${m.id}">
        <div class="mv-head">
          <p class="idx">${num(i)}</p>
          <div>
            <h2 id="h-${m.id}">${esc(p(m.name))}${lang === "zh" ? `<span class="alt" lang="en">${esc(m.name.en)}</span>` : ""}</h2>
            <div class="meta-row"><span class="yrs">${esc(p(m.years))}</span><span>${esc(p(m.region))}</span><span class="grp"><span class="sw"></span>${esc(p(GROUP[m.group].name))}</span>${m.home ? `<span class="home">${esc(t("home"))}</span>` : ""}</div>
            <p class="idea">${esc(p(m.idea))}</p>
          </div>
        </div>
        <div class="mv-body">
          <p class="summary">${esc(p(m.summary))}</p>
          <div class="facts">
            <div><h4>${esc(t("traits"))}</h4><ul class="traits">${p(m.traits).map((s) => `<li>${esc(s)}</li>`).join("")}</ul></div>
            <div><h4>${esc(t("from"))}</h4>${m.from.length ? `<div class="links">${m.from.map(chip).join("")}</div>` : `<p class="none">${esc(t("noneFrom"))}</p>`}</div>
            <div><h4>${esc(t("to"))}</h4>${m.to.length ? `<div class="links">${m.to.map(chip).join("")}</div>` : `<p class="none">${esc(t("noneTo"))}</p>`}</div>
          </div>
        </div>
        <div class="cards">${m.works.map((w, wi) => `
          <article class="card">
            <div class="frame" data-work="${m.id}:${wi}"${arStyle(m.id, wi)}><span class="spin">${esc(t("loading"))}</span><button type="button" data-view="${m.id}:${wi}" aria-label="${esc(p(w.t))}"><img alt="${esc(p(w.t))}" decoding="async"></button></div>
            <div class="card-copy">
              <h3>${titleLink(w)}</h3>
              <p class="by">${esc(p(w.a))} · <span class="mono">${esc(p(w.y))}</span></p>
              ${w.loc ? `<p class="where">${esc(p(w.loc))}</p>` : ""}
              <p class="look"><b>${esc(t("look"))}:</b> ${esc(p(w.look))}</p>
              ${w.n ? `<p class="note">${esc(p(w.n))}</p>` : ""}
              <p class="credit"><a class="src" href="#" target="_blank" rel="noopener">${esc(t("source"))}</a></p>
            </div>
          </article>`).join("")}</div>
      </section>`).join("");
    $$(".frame[data-work]").forEach((f) => { if (io) io.observe(f); else { const [mid, wi] = f.dataset.work.split(":"); loadInto(f, mid, +wi); } });
  }

  /* ── Why + study ───────────────────────────── */
  function renderWhy() {
    $("#engines").innerHTML = D.engines.map((e) => `
      <div class="eng ${e.color}"><h3>${esc(p(e.title))}</h3><p>${esc(p(e.body))}</p><div class="links">${e.ex.map((id) => `<button type="button" class="lk" data-go="${id}">${esc(p(BY[id].name))}</button>`).join("")}</div></div>`).join("") +
      `<p class="caveat"><b>${esc(t("caveatTag"))}</b>${esc(t("caveat"))}</p>` +
      `<div class="names">` + D.nicknames.map((n, i) => `<div>${i === 0 ? `<span class="kicker">${esc(t("namesTitle"))}</span>` : ""}<button type="button" class="lk" data-go="${n.id}">${esc(p(BY[n.id].name))}</button><span>${esc(p(n.text))}</span></div>`).join("") + `</div>`;
    $("#steps").innerHTML = D.howto.map((s, i) => `<li><span class="n">${num(i)} / ${num(D.howto.length - 1)}</span><b>${esc(p(s.t))}</b><p>${esc(p(s.d))}</p></li>`).join("");
  }

  /* ── Viewer ────────────────────────────────── */
  const viewer = $("#viewer");
  function openViewer(key) {
    const [mid, wi] = key.split(":");
    const m = BY[mid], w = m.works[+wi];
    $("#v-copy").innerHTML = `<button type="button" class="v-close" id="v-close" aria-label="${esc(t("close"))}">✕</button>
      <span class="kicker">${esc(p(m.name))}</span><h3 id="v-title">${titleLink(w)}</h3>
      <p class="by"><b>${esc(p(w.a))}</b> · <span class="mono">${esc(p(w.y))}</span></p>${w.loc ? `<p class="mono" style="font-size:12px;color:var(--muted)">${esc(p(w.loc))}</p>` : ""}
      <p><b>${esc(t("look"))}:</b> ${esc(p(w.look))}</p>${w.n ? `<p>${esc(p(w.n))}</p>` : ""}
      <p class="credit" style="display:flex;gap:12px;flex-wrap:wrap;font-size:13px"><a id="v-src" href="#" target="_blank" rel="noopener">${esc(t("source"))}</a></p>`;
    const box = $("#v-img");
    box.className = "v-img";
    box.innerHTML = `<div class="frame"${arStyle(mid, +wi)}><span class="spin">${esc(t("loading"))}</span><img alt="${esc(p(w.t))}"></div>`;
    loadInto($(".frame", box), mid, +wi, "min(1200px, 100vw)");
    $("#v-src").href = resolveImage(mid, +wi).page || article(w).href;
    if (typeof viewer.showModal === "function") viewer.showModal(); else viewer.setAttribute("open", "");
    document.documentElement.classList.add("modal-open");
  }
  viewer.addEventListener("close", () => document.documentElement.classList.remove("modal-open"));
  viewer.addEventListener("click", (e) => {
    if (e.target === viewer || e.target.closest("#v-close")) viewer.close ? viewer.close() : viewer.removeAttribute("open");
  });

  /* ── Events ────────────────────────────────── */
  function go(id) {
    if (!visible(BY[id])) resetFilters();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    try { history.replaceState(null, "", "#" + id); } catch (e) { /* sandboxed */ }
  }
  document.addEventListener("click", (e) => {
    const view = e.target.closest("[data-view]");
    if (view) { const fr = view.closest(".frame"); if (!fr || !fr.classList.contains("plate")) openViewer(view.dataset.view); return; }
    const g = e.target.closest("[data-go]");
    if (g) { e.preventDefault(); go(g.dataset.go); return; }
    const era = e.target.closest("[data-era]");
    if (era) { toggle(fEras, era.dataset.era, "era"); return; }
    const reg = e.target.closest("[data-region]");
    if (reg) { toggle(fRegions, reg.dataset.region, "region"); return; }
    if (e.target.closest("#fb-reset, [data-reset]")) { resetFilters(); return; }
    if (e.target.closest("#fb-toggle")) { setPanel($("#fbar").dataset.open !== "true"); return; }
    const sis = e.target.closest("a[data-sister]");
    if (sis) { track("select_content", { content_type: "sister", item_id: sis.dataset.sister }); return; }
    const lb = e.target.closest(".lang button");
    const consent = e.target.closest("[data-consent]");
    if (consent) { setConsent(consent.dataset.consent); return; }
    if (e.target.closest("#consent-open")) { $("#consent").hidden = false; $("#consent [data-consent]").focus(); return; }
    if (lb && lb.dataset.lang !== lang) {
      lang = lb.dataset.lang; store.set("art-isms-lang", lang); setParam("lang", lang === "zh" ? "zh" : null); renderAll();
      track("select_content", { content_type: "language", item_id: lang });
      pageView();
    }
  });
  /* Analytics consent (GA itself is set up in index.html, on the production domain only). */
  const CONSENT_KEY = "art-isms-consent";
  function setConsent(value) {
    store.set(CONSENT_KEY, value);
    if (typeof window.gtag === "function") window.gtag("consent", "update", { analytics_storage: value });
    // Withdrawing consent also removes GA cookies: on this host, where GA now sets them (host-only, see
    // index.html), and on the parent domain, to clean up legacy cookies set there before that change.
    if (value === "denied") {
      const parent = "." + location.hostname.split(".").slice(-2).join(".");
      document.cookie.split(";").map((c) => c.split("=")[0].trim()).filter((n) => /^_ga/.test(n)).forEach((n) => {
        for (const domain of ["", `; domain=${location.hostname}`, `; domain=${parent}`]) document.cookie = `${n}=; Max-Age=0; path=/${domain}`;
      });
    }
    $("#consent").hidden = true;
  }
  if (typeof window.gtag === "function") {
    $("#consent-open").hidden = false;
    if (!store.get(CONSENT_KEY)) $("#consent").hidden = false;
  }

  /* Phones: the bar is one row; the toggle opens the panel. Escape closes it. */
  function setPanel(open) {
    $("#fbar").dataset.open = String(open);
    $("#fb-toggle").setAttribute("aria-expanded", String(open));
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && $("#fbar").dataset.open === "true") { setPanel(false); $("#fb-toggle").focus(); }
  });
  /* Sticky offsets below the bar: its height changes with width and when the panel opens. */
  if ("ResizeObserver" in window) new ResizeObserver(([e]) => document.documentElement.style.setProperty("--fbar-h", `${Math.ceil(e.borderBoxSize?.[0]?.blockSize ?? e.target.offsetHeight)}px`)).observe($("#fbar"));
  $("#jump").addEventListener("change", (e) => { if (e.target.value) go(e.target.value); e.target.value = ""; });
  const tl = $("#tl");
  tl.addEventListener("mouseover", (e) => { const r = e.target.closest(".tl-row[data-id]"); if (r) highlight(r.dataset.id); });
  tl.addEventListener("mouseleave", () => highlight(null));
  tl.addEventListener("focusin", (e) => { const r = e.target.closest(".tl-row[data-id]"); if (r) highlight(r.dataset.id); });
  tl.addEventListener("focusout", () => highlight(null));

  if (io) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        $$("#toc a").forEach((a) => a.setAttribute("aria-current", String(a.dataset.toc === e.target.id)));
        const cur = $(`#toc a[data-toc="${e.target.id}"]`);
        const side = $(".side");
        if (cur && side && getComputedStyle(side).position === "sticky") {
          const top = cur.offsetTop - side.clientHeight / 2;
          side.scrollTo({ top, behavior: "auto" });
        }
      });
    }, { rootMargin: "-30% 0px -65% 0px" });
    renderAll.after = () => $$(".mv").forEach((s) => spy.observe(s));
  }

  function renderAll() {
    applyStatic();
    renderMast();
    renderTimeline();
    renderFilters();
    renderToc();
    renderMovements();
    applyFilters();
    renderWhy();
    if (renderAll.after) renderAll.after();
  }
  try { renderAll(); } finally { pageView(); }

  const start = (location.hash || "").slice(1);
  if (BY[start]) requestAnimationFrame(() => document.getElementById(start)?.scrollIntoView());
})();
