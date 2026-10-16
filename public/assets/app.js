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
      brand: "Art-isms", brandSub: "艺术流派志", navTimeline: "Timeline", navStyles: "Styles", navWhy: "Why styles change", navStudy: "How to look",
      kicker: "A visual atlas of art styles", title: "Art-isms", titleSub: "45,000 years of looking",
      dek: "How art styles <strong>began</strong>, what they <strong>look like</strong>, and how each one grew out of the last, with three real works for every style.",
      stats: (n, w) => `<span><b>45,000</b>years</span><span><b>${n}</b>styles</span><span><b>${w}</b>works</span><span><b>2</b>languages</span>`,
      ctaTimeline: "See the timeline", ctaStyles: "Browse the styles",
      howManyTitle: "How many art styles are there?",
      howMany1: "There is no official number. Lists of named movements run to several hundred, most of them offshoots, regional schools or short-lived groups, and historians disagree on where one ends and the next begins. This atlas maps 40 that changed how art is made.",
      howMany2: "Periods, movements, techniques and cultural traditions are different kinds of category. Broad labels such as “African”, “Indigenous” and “Islamic” cover many distinct peoples, places and histories, and are used here as entry points, not as single styles.",
      tlTitle: "45,000 years on one line",
      tlLede: "Each bar is a style’s conventional date range. Hover over a name to light up what it grew from and what it led to. Select it to jump to the style.",
      tlHint: "Scroll sideways to see the whole timeline →", tlHead: "Style",
      legRule: "Change of scale: older periods are compressed", legHatch: "Living tradition, still practised", legRel: "Related styles",
      filterEra: "Era", filterGroup: "Region", contents: "Contents", all: "All", jump: "Jump to a style…", empty: "No style matches these filters.",
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
      footProj: "A static site with no build step: HTML, CSS and plain JavaScript, with all content in one bilingual data file. Corrections are welcome on <a href=\"https://github.com/geekplux/art-isms\">GitHub</a>.",
      close: "Close", bce: "BCE", now: "now"
    },
    zh: {
      brand: "艺术流派志", brandSub: "Art-isms", navTimeline: "时间线", navStyles: "流派", navWhy: "风格为何改变", navStudy: "如何观看",
      kicker: "艺术风格图谱", title: "艺术流派志", titleSub: "四万五千年的观看",
      dek: "艺术风格如何<strong>开始</strong>、长什么<strong>样子</strong>，又如何一脉相承、彼此反叛；每个流派配有三件真实作品。",
      stats: (n, w) => `<span><b>45,000</b>年</span><span><b>${n}</b>个流派</span><span><b>${w}</b>件作品</span><span><b>2</b>种语言</span>`,
      ctaTimeline: "查看时间线", ctaStyles: "浏览流派",
      howManyTitle: "艺术风格到底有多少种？",
      howMany1: "没有官方数字。有名可查的艺术流派多达数百个，其中大部分是分支、地方画派或昙花一现的团体；对于一种风格在哪里结束、下一种从哪里开始，学者也常有分歧。本图谱收录了40个改变艺术创作方式的流派。",
      howMany2: "时期、运动、技法与文化传统是不同类型的分类。“非洲”“原住民”“伊斯兰”等宽泛标签涵盖了许多不同的民族、地域与历史，本站把它们作为入门的切入点，而非单一风格。",
      tlTitle: "四万五千年，一条时间线",
      tlLede: "每根色条代表一个流派约定俗成的年代范围。鼠标悬停在名称上可点亮它的来源与去向，点击即可跳转到该流派。",
      tlHint: "左右滑动查看完整时间线 →", tlHead: "流派",
      legRule: "比例尺变化：较早的时代被压缩", legHatch: "延续至今的活传统", legRel: "相关流派",
      filterEra: "时代", filterGroup: "地区", contents: "目录", all: "全部", jump: "跳转到流派…", empty: "没有符合筛选条件的流派。",
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
      footProj: "一个无需构建的静态网站：HTML、CSS 与原生 JavaScript，全部内容集中在一个中英双语数据文件中。欢迎在 <a href=\"https://github.com/geekplux/art-isms\">GitHub</a> 上提出修订。",
      close: "关闭", bce: "前", now: "今"
    }
  };

  /* ── State ─────────────────────────────────── */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  };
  const browserZh = (navigator.language || "").toLowerCase().startsWith("zh");
  let lang = store.get("art-isms-lang") || (browserZh ? "zh" : "en");
  if (lang !== "en" && lang !== "zh") lang = "en";
  let fEra = "all";
  let fGroup = "all";

  const t = (k) => (UI[lang][k] ?? UI.en[k] ?? k);
  const p = (o) => (o ? (o[lang] ?? o.en) : "");
  const other = (o) => (o ? o[lang === "en" ? "zh" : "en"] : "");
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
    document.title = lang === "zh" ? "艺术流派志 · Art-isms" : "Art-isms";
    $$("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    $$(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    $("#stats").innerHTML = UI[lang].stats(MV.length, WORKS);
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
    $("#legend").innerHTML = D.groups.map((g) => `<span class="g-${g.id}"><i></i>${esc(p(g.name))}</span>`).join("") +
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
  const visible = (m) => (fEra === "all" || m.era === fEra) && (fGroup === "all" || m.group === fGroup);
  function renderFilters() {
    $("#f-era").innerHTML = `<button type="button" class="chip" data-era="all" aria-pressed="${fEra === "all"}">${esc(t("all"))}</button>` +
      D.eras.map((e) => `<button type="button" class="chip" data-era="${e.id}" aria-pressed="${fEra === e.id}" title="${esc(p(e.span))}">${esc(p(e.name))}</button>`).join("");
    $("#f-group").innerHTML = `<button type="button" class="chip" data-group="all" aria-pressed="${fGroup === "all"}">${esc(t("all"))}</button>` +
      D.groups.map((g) => `<button type="button" class="chip g-${g.id}" data-group="${g.id}" aria-pressed="${fGroup === g.id}"><span class="sw"></span>${esc(p(g.name))}</button>`).join("");
  }
  function renderToc() {
    $("#toc").innerHTML = MV.map((m, i) => `<li ${visible(m) ? "" : "hidden"}><a href="#${m.id}" data-toc="${m.id}"><span class="idx">${num(i)}</span><span><b>${esc(p(m.name))}</b><small>${esc(p(m.years))}</small></span></a></li>`).join("");
    $("#jump").innerHTML = `<option value="">${esc(t("jump"))}</option>` + MV.filter(visible).map((m) => `<option value="${m.id}">${num(MV.indexOf(m))} · ${esc(p(m.name))}</option>`).join("");
  }
  function applyFilters() {
    $$(".mv").forEach((s) => { s.hidden = !visible(BY[s.id]); });
    renderToc();
    const any = MV.some(visible);
    $("#movements .empty")?.remove();
    if (!any) $("#movements").insertAdjacentHTML("beforeend", `<p class="empty">${esc(t("empty"))}</p>`);
    $$("#f-era .chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.era === fEra)));
    $$("#f-group .chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.group === fGroup)));
  }

  /* ── Movement sections ─────────────────────── */
  const chip = (id) => `<button type="button" class="lk g-${BY[id].group}" data-go="${id}"><span class="sw"></span>${esc(p(BY[id].name))}</button>`;
  function renderMovements() {
    $("#movements").innerHTML = MV.map((m, i) => `
      <section class="mv g-${m.group}" id="${m.id}" ${visible(m) ? "" : "hidden"} aria-labelledby="h-${m.id}">
        <div class="mv-head">
          <p class="idx">${num(i)}</p>
          <div>
            <h2 id="h-${m.id}">${esc(p(m.name))}<span class="alt" lang="${lang === "en" ? "zh-CN" : "en"}">${esc(other(m.name))}</span></h2>
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
            <div class="frame" data-work="${m.id}:${wi}"><span class="spin">${esc(t("loading"))}</span><button type="button" data-view="${m.id}:${wi}" aria-label="${esc(p(w.t))}"><img alt="${esc(p(w.t))}" decoding="async"></button></div>
            <div class="card-copy">
              <h3>${titleLink(w)}</h3>
              <p class="by">${esc(p(w.a))} · <span class="mono">${esc(w.y)}</span></p>
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
    $("#steps").innerHTML = D.howto.map((s, i) => `<li><span class="idx">${num(i)}</span><b>${esc(p(s.t))}</b><span>${esc(p(s.d))}</span></li>`).join("");
  }

  /* ── Viewer ────────────────────────────────── */
  const viewer = $("#viewer");
  function openViewer(key) {
    const [mid, wi] = key.split(":");
    const m = BY[mid], w = m.works[+wi];
    $("#v-copy").innerHTML = `<button type="button" class="v-close" id="v-close" aria-label="${esc(t("close"))}">✕</button>
      <span class="kicker">${esc(p(m.name))}</span><h3 id="v-title">${titleLink(w)}</h3>
      <p class="by"><b>${esc(p(w.a))}</b> · <span class="mono">${esc(w.y)}</span></p>${w.loc ? `<p class="mono" style="font-size:12px;color:var(--muted)">${esc(p(w.loc))}</p>` : ""}
      <p><b>${esc(t("look"))}:</b> ${esc(p(w.look))}</p>${w.n ? `<p>${esc(p(w.n))}</p>` : ""}
      <p class="credit" style="display:flex;gap:12px;flex-wrap:wrap;font-size:13px"><a id="v-src" href="#" target="_blank" rel="noopener">${esc(t("source"))}</a></p>`;
    const box = $("#v-img");
    box.className = "v-img";
    box.innerHTML = `<div class="frame" style="height:min(70dvh,720px);width:100%;border:0"><span class="spin">${esc(t("loading"))}</span><img alt="${esc(p(w.t))}"></div>`;
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
    if (!visible(BY[id])) { fEra = "all"; fGroup = "all"; applyFilters(); }
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
    if (era) { fEra = era.dataset.era; applyFilters(); return; }
    const grp = e.target.closest("[data-group]");
    if (grp) { fGroup = grp.dataset.group; applyFilters(); return; }
    const lb = e.target.closest(".lang button");
    if (lb && lb.dataset.lang !== lang) { lang = lb.dataset.lang; store.set("art-isms-lang", lang); renderAll(); }
  });
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
    renderWhy();
    if (renderAll.after) renderAll.after();
  }
  renderAll();

  const start = (location.hash || "").slice(1);
  if (BY[start]) requestAnimationFrame(() => document.getElementById(start)?.scrollIntoView());
})();
