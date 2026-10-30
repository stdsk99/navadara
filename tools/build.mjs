// สร้างหน้าเว็บทั้งหมดของนวดาราจากข้อมูลใน data/
// ใช้: node tools/build.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const site = read("data/site.json");
const cards = read("data/major.json");
const B = site.base;
const VERSION = Date.now().toString(36);

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const write = (rel, content) => {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
};
const deckImg = (id) => `${B}decks/${site.deck.folder}/${id}.${site.deck.ext}`;
const roman = (n) => {
  if (n === 0) return "0";
  const map = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let r = "";
  for (const [v, s] of map) while (n >= v) { r += s; n -= v; }
  return r;
};
const CAT = [["general", "ทั่วไป"], ["love", "ความรัก"], ["career", "การงาน"], ["finance", "การเงิน"], ["health", "สุขภาพ"]];

/* ---------------- ภาพไพ่ชั่วคราว (SVG) ---------------- */
const STAR = (cx, cy, r) => {
  const pts = [];
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI / 8) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.38 : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(" ")}"/>`;
};
const frame = `<rect width="300" height="450" rx="18" fill="#0f1528"/><rect x="12" y="12" width="276" height="426" rx="10" fill="none" stroke="#c9a96e" stroke-width="1.5"/><rect x="19" y="19" width="262" height="412" rx="7" fill="none" stroke="#c9a96e" stroke-width=".6" opacity=".7"/>`;
function backSvg() {
  const ring = Array.from({ length: 9 }, (_, i) => {
    const a = (2 * Math.PI / 9) * i - Math.PI / 2;
    return STAR(150 + 78 * Math.cos(a), 225 + 78 * Math.sin(a), 7);
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450">${frame}<g fill="none" stroke="#c9a96e" stroke-width="1"><circle cx="150" cy="225" r="104" opacity=".55"/><circle cx="150" cy="225" r="52" opacity=".55"/><line x1="150" y1="40" x2="150" y2="110" opacity=".4"/><line x1="150" y1="340" x2="150" y2="410" opacity=".4"/></g><g fill="#c9a96e">${STAR(150, 225, 34)}${ring}</g></svg>`;
}
function faceSvg(c) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450">${frame}<text x="150" y="62" text-anchor="middle" fill="#c9a96e" font-family="Georgia,serif" font-size="22" letter-spacing="3">${roman(c.num)}</text><g fill="none" stroke="#c9a96e" stroke-width="1" opacity=".6"><circle cx="150" cy="210" r="70"/><circle cx="150" cy="210" r="88" stroke-dasharray="2 5"/></g><g fill="#c9a96e">${STAR(150, 210, 30)}</g><text x="150" y="350" text-anchor="middle" fill="#ece6da" font-family="Georgia,serif" font-size="21">${esc(c.name)}</text><text x="150" y="384" text-anchor="middle" fill="#c9a96e" font-family="'Noto Sans Thai','IBM Plex Sans Thai',sans-serif" font-size="17">${esc(c.name_th)}</text></svg>`;
}
write("decks/placeholder/back.svg", backSvg());
for (const c of cards) write(`decks/placeholder/${c.id}.svg`, faceSvg(c));

/* ---------------- แม่แบบหน้า ---------------- */
const logo = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="#c9a96e"><polygon points="12,1 13.8,8.6 20.5,4.9 15.6,10.8 23,12 15.6,13.2 20.5,19.1 13.8,15.4 12,23 10.2,15.4 3.5,19.1 8.4,13.2 1,12 8.4,10.8 3.5,4.9 10.2,8.6"/></svg>`;
const soundBtn = `<button class="icon-btn" type="button" data-sound-toggle aria-pressed="false" aria-label="เปิดเสียง"><svg class="on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" style="display:none"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg><svg class="off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg></button>`;

function page({ rel, title, desc, body, active = "", scripts = [], image = deckImg("back") }) {
  const url = site.siteUrl + B + rel.replace(/index\.html$/, "");
  const fullTitle = title ? `${title} | ${site.name}` : `${site.name} — ${site.tagline}`;
  const cfg = { base: B, deck: site.deck, gaId: site.gaId, adsEnabled: site.adsEnabled };
  const nav = (href, label, key, cls = "") => `<a href="${B}${href}"${active === key ? ' aria-current="page"' : ""}${cls ? ` class="${cls}"` : ""}>${label}</a>`;
  return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${site.siteUrl}${image}">
<meta property="og:locale" content="th_TH">
<meta name="theme-color" content="#0d1222">
<link rel="icon" href="${B}assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500&family=Noto+Serif+Thai:wght@500&display=swap">
<link rel="stylesheet" href="${B}assets/css/style.css?v=${VERSION}">
<style>:root{--back:url("${deckImg("back")}")}</style>
<script>window.NAVA=${JSON.stringify(cfg)};</script>
</head>
<body>
<a class="sr-only" href="#main">ข้ามไปเนื้อหา</a>
<header class="site-header"><div class="wrap">
<a class="brand" href="${B}">${logo}<span>${esc(site.name)}</span></a>
<nav class="nav" aria-label="เมนูหลัก">${nav("", "เปิดไพ่", "home")}${nav("cards/", "ความหมายไพ่", "cards")}${soundBtn}</nav>
</div></header>
<main id="main" class="wrap">
${body}
</main>
<footer class="site-footer"><div class="wrap">
<span>© ${new Date().getFullYear()} ${esc(site.name)} · คำทำนายเพื่อความบันเทิง</span>
<nav aria-label="ลิงก์ท้ายเว็บ">${nav("cards/", "ความหมายไพ่", "")}${nav("disclaimer/", "ข้อจำกัดความรับผิดชอบ", "")}${nav("privacy/", "นโยบายความเป็นส่วนตัว", "")}</nav>
</div></footer>
<script src="${B}assets/js/site.js?v=${VERSION}"></script>
${scripts.map((s) => `<script src="${B}${s}?v=${VERSION}"></script>`).join("\n")}
</body>
</html>
`;
}

/* ---------------- หน้าแรก ---------------- */
write("index.html", page({
  rel: "index.html", active: "home",
  desc: "นวดารา เว็บเปิดไพ่ทาโร่ออนไลน์ฟรี ดูไพ่ประจำวัน เลือกหมวดความรัก การงาน การเงิน สุขภาพ พร้อมคำทำนายภาษาไทยทั้งไพ่ตั้งและไพ่กลับหัว",
  scripts: ["assets/js/app.js"],
  body: `<section class="hero">
<h1>${esc(site.name)}</h1>
<p>ตั้งจิตให้สงบ นึกถึงสิ่งที่อยากรู้ แล้วเลือกไพ่ที่ดึงดูดใจคุณ</p>
</section>
<section class="panel" id="reader" aria-label="เปิดไพ่">
<div id="step-setup">
<label class="field" style="margin-top:0">รูปแบบการเปิดไพ่</label>
<div class="spread-list" id="spreads"></div>
<label class="field">หมวดคำถาม</label>
<div class="chips" id="cats"></div>
<label class="field" for="question">คำถามของคุณ (ไม่บังคับ)</label>
<textarea id="question" maxlength="200" placeholder="เช่น ช่วงนี้ควรโฟกัสเรื่องอะไร"></textarea>
<p class="muted small" style="margin-top:6px">คำถามเก็บไว้ในเครื่องของคุณเท่านั้น ไม่ถูกส่งไปที่ใด</p>
<div class="actions"><button class="btn" id="btn-shuffle" type="button" disabled>สับไพ่</button></div>
<p class="today-note muted" id="today-note"></p>
</div>
<div id="step-table" hidden>
<div class="stage" id="stage"></div>
<p class="stage-msg" id="stage-msg" aria-live="polite"></p>
</div>
<div id="step-result" hidden><div id="result"></div></div>
</section>
<div class="ad-slot" data-slot="home-bottom"></div>
<section class="prose">
<h2>ไพ่ทาโร่บอกอะไรเรา</h2>
<p>ไพ่ทาโร่เป็นเครื่องมือช่วยสะท้อนความคิดและมองสถานการณ์จากมุมใหม่ ไพ่แต่ละใบมีภาพและสัญลักษณ์ที่ชวนให้เราทบทวนสิ่งที่กำลังเผชิญ ไพ่ที่ออกมาแบบกลับหัวมักหมายถึงพลังของไพ่ใบนั้นที่ติดขัด ล่าช้า หรือหันเข้าหาตัวเอง</p>
<p>ตอนนี้${esc(site.name)}มีไพ่ Major Arcana ครบ 22 ใบ และกำลังทยอยเพิ่ม Minor Arcana อีก 56 ใบ รวมถึงรูปแบบการเปิดไพ่แบบ 3 ใบ ความรัก และ Celtic Cross <a href="${B}cards/">อ่านความหมายไพ่ทุกใบ</a></p>
</section>`
}));

/* ---------------- คลังความหมายไพ่ ---------------- */
write("cards/index.html", page({
  rel: "cards/index.html", active: "cards", title: "ความหมายไพ่ทาโร่ทุกใบ",
  desc: "ความหมายไพ่ทาโร่ Major Arcana 22 ใบ ทั้งไพ่ตั้งและไพ่กลับหัว ในด้านความรัก การงาน การเงิน และสุขภาพ อ่านง่ายเป็นภาษาไทย",
  body: `<h1 style="margin-top:40px">ความหมายไพ่ทาโร่</h1>
<p class="muted">Major Arcana 22 ใบ คือไพ่ชุดหลักที่สะท้อนเหตุการณ์สำคัญและบทเรียนใหญ่ของชีวิต แตะที่ไพ่เพื่ออ่านความหมายทุกด้าน</p>
<div class="grid-cards">
${cards.map((c) => `<a href="${B}cards/${c.slug}/"><img src="${deckImg(c.id)}" alt="ไพ่ ${esc(c.name_th)}" loading="lazy" width="300" height="450">${esc(c.name_th)}<small>${roman(c.num)} · ${esc(c.name)}</small></a>`).join("\n")}
</div>
<div class="ad-slot" data-slot="cards-bottom"></div>`
}));

/* ---------------- หน้าความหมายรายใบ ---------------- */
const orient = (o, label) => `<h2>${label}</h2>
<div class="kw" style="justify-content:flex-start">${o.kw.map((k) => `<span>${esc(k)}</span>`).join("")}</div>
<p>${esc(o.base)}</p>
<h3>สถานการณ์ปัจจุบัน</h3><p>${esc(o.pos.present)}</p>
${CAT.map(([k, l]) => `<h3>${k === "general" ? "ภาพรวมทั่วไป" : l}</h3><p>${esc(o.cat[k])}</p>`).join("\n")}`;

cards.forEach((c, i) => {
  const prev = cards[i - 1], next = cards[i + 1];
  const desc = `ความหมายไพ่ ${c.name_th} (${c.name}) ไพ่ตั้ง: ${c.up.kw.join(" ")} · ไพ่กลับหัว: ${c.rev.kw.join(" ")} พร้อมคำทำนายด้านความรัก การงาน การเงิน สุขภาพ`;
  write(`cards/${c.slug}/index.html`, page({
    rel: `cards/${c.slug}/index.html`, active: "cards", image: deckImg(c.id),
    title: `ความหมายไพ่ ${c.name_th} (${c.name})`, desc,
    body: `<p class="crumbs"><a href="${B}">หน้าแรก</a> / <a href="${B}cards/">ความหมายไพ่</a> / ${esc(c.name_th)}</p>
<div class="card-hero">
<img src="${deckImg(c.id)}" alt="ไพ่ ${esc(c.name_th)} (${esc(c.name)})" width="300" height="450">
<div>
<div class="sub">Major Arcana · ${roman(c.num)}</div>
<h1>${esc(c.name_th)}</h1>
<p class="muted">${esc(c.name)}</p>
<p>${esc(c.up.base)}</p>
<p class="small muted">คำสำคัญไพ่ตั้ง: ${c.up.kw.map(esc).join(", ")}<br>คำสำคัญไพ่กลับหัว: ${c.rev.kw.map(esc).join(", ")}</p>
</div>
</div>
<article class="prose">
${orient(c.up, "ไพ่ตั้ง")}
<div class="ad-slot" data-slot="card-middle"></div>
${orient(c.rev, "ไพ่กลับหัว")}
<p class="disclaimer-inline">คำทำนายเพื่อความบันเทิงและการสะท้อนความคิด ไม่ใช่คำแนะนำทางการแพทย์ กฎหมาย หรือการเงิน <a href="${B}disclaimer/">อ่านเพิ่มเติม</a></p>
</article>
<div class="cta-box">
<p style="margin-bottom:14px">อยากรู้ว่าวันนี้ไพ่ใบไหนจะมาหาคุณ</p>
<a class="btn" href="${B}">เปิดไพ่เลย</a>
</div>
<nav class="prevnext" aria-label="ไพ่ใบก่อนหน้าและถัดไป">
<span>${prev ? `<a href="${B}cards/${prev.slug}/">← ${esc(prev.name_th)}</a>` : ""}</span>
<span>${next ? `<a href="${B}cards/${next.slug}/">${esc(next.name_th)} →</a>` : ""}</span>
</nav>`
  }));
});

/* ---------------- หน้านโยบาย ---------------- */
const updated = "30 ตุลาคม 2569";
write("disclaimer/index.html", page({
  rel: "disclaimer/index.html", title: "ข้อจำกัดความรับผิดชอบ",
  desc: `ข้อจำกัดความรับผิดชอบของ${site.name} คำทำนายไพ่ทาโร่เพื่อความบันเทิง ไม่ใช่คำแนะนำทางการแพทย์ กฎหมาย หรือการเงิน`,
  body: `<article class="prose">
<h1 style="margin-top:40px">ข้อจำกัดความรับผิดชอบ</h1>
<p class="muted small">ปรับปรุงล่าสุด ${updated}</p>
<p>${esc(site.name)}ให้บริการเปิดไพ่ทาโร่และคำทำนายเพื่อความบันเทิง และเพื่อเป็นแนวทางในการทบทวนความคิดของตนเองเท่านั้น</p>
<h2>ไม่ใช่คำแนะนำจากผู้เชี่ยวชาญ</h2>
<p>คำทำนายบนเว็บไซต์นี้ไม่ใช่คำแนะนำทางการแพทย์ สุขภาพจิต กฎหมาย การเงิน หรือการลงทุน และไม่สามารถใช้แทนคำปรึกษาจากแพทย์ นักจิตวิทยา ทนายความ หรือที่ปรึกษาทางการเงินที่มีคุณวุฒิ หากคุณมีปัญหาสุขภาพ ความเครียดรุนแรง หรือต้องตัดสินใจเรื่องสำคัญ โปรดปรึกษาผู้เชี่ยวชาญโดยตรง</p>
<h2>การตัดสินใจเป็นของคุณ</h2>
<p>ผลการเปิดไพ่เกิดจากการสุ่มโดยระบบ คุณเป็นผู้รับผิดชอบต่อการตัดสินใจและการกระทำของตนเองทั้งหมด ผู้ให้บริการไม่รับผิดชอบต่อความเสียหายใดๆ ที่เกิดจากการนำคำทำนายไปใช้</p>
<h2>ลิงก์ภายนอก</h2>
<p>เว็บไซต์อาจมีลิงก์ไปยังร้านค้าหรือเว็บไซต์ภายนอก ซึ่งบางลิงก์อาจเป็นลิงก์พันธมิตร (affiliate) ที่เราได้รับค่าคอมมิชชันเมื่อมีการซื้อสินค้า โดยไม่มีค่าใช้จ่ายเพิ่มเติมสำหรับคุณ เราไม่รับผิดชอบต่อเนื้อหาหรือบริการของเว็บไซต์ภายนอก</p>
</article>`
}));

write("privacy/index.html", page({
  rel: "privacy/index.html", title: "นโยบายความเป็นส่วนตัว",
  desc: `นโยบายความเป็นส่วนตัวของ${site.name} การใช้คุกกี้ การเก็บข้อมูล และสิทธิของผู้ใช้ตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล`,
  body: `<article class="prose">
<h1 style="margin-top:40px">นโยบายความเป็นส่วนตัว</h1>
<p class="muted small">ปรับปรุงล่าสุด ${updated}</p>
<p>${esc(site.name)}ให้ความสำคัญกับความเป็นส่วนตัวของคุณ นโยบายนี้อธิบายว่าเราเก็บข้อมูลอะไร ใช้อย่างไร และคุณมีสิทธิอะไรบ้าง ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562</p>
<h2>ข้อมูลที่อยู่ในเครื่องของคุณเท่านั้น</h2>
<p>คำถามที่คุณพิมพ์ ผลไพ่ประจำวัน และการตั้งค่าเสียง ถูกเก็บไว้ในเบราว์เซอร์ของคุณ (localStorage) และไม่ถูกส่งมายังเรา คุณลบข้อมูลเหล่านี้ได้ทุกเมื่อด้วยการล้างข้อมูลเว็บไซต์ในเบราว์เซอร์</p>
<h2>คุกกี้และสถิติการใช้งาน</h2>
<p>เมื่อคุณกดยินยอม เราใช้ Google Analytics เพื่อเก็บสถิติการใช้งานแบบไม่ระบุตัวตน เช่น จำนวนผู้เข้าชม หน้าที่เปิด รูปแบบการเปิดไพ่และหมวดที่เลือก ข้อมูลนี้ช่วยให้เราปรับปรุงเว็บไซต์ เราไม่ส่งคำถามที่คุณพิมพ์ไปยัง Google Analytics หากคุณไม่ยินยอม ระบบจะไม่โหลด Google Analytics</p>
<h2>โฆษณา</h2>
<p>ในอนาคตเว็บไซต์อาจแสดงโฆษณาจากผู้ให้บริการภายนอก เช่น Google AdSense ซึ่งอาจใช้คุกกี้เพื่อแสดงโฆษณาที่เกี่ยวข้อง เราจะปรับปรุงนโยบายนี้และขอความยินยอมก่อนเริ่มใช้งาน</p>
<h2>สิทธิของคุณ</h2>
<p>คุณมีสิทธิถอนความยินยอมได้ทุกเมื่อ โดยล้างข้อมูลเว็บไซต์ในเบราว์เซอร์ แล้วระบบจะถามความยินยอมใหม่ คุณยังมีสิทธิขอเข้าถึง แก้ไข หรือลบข้อมูลส่วนบุคคลตามที่กฎหมายกำหนด</p>
<h2>ติดต่อเรา</h2>
<p>หากมีคำถามเกี่ยวกับนโยบายนี้ ติดต่อได้ที่ <span class="muted">[อีเมลติดต่อ — รอระบุ]</span></p>
</article>`
}));

write("404.html", page({
  rel: "404.html", title: "ไม่พบหน้านี้", desc: "ไม่พบหน้าที่คุณต้องการ",
  body: `<section class="hero"><h1>ไม่พบหน้านี้</h1><p>ไพ่ใบนี้อาจถูกสับหายไปในสำรับ</p><div class="actions"><a class="btn" href="${B}">กลับไปเปิดไพ่</a></div></section>`
}));

/* ---------------- favicon, sitemap, robots ---------------- */
write("assets/img/favicon.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#0d1222"/><polygon fill="#c9a96e" points="12,2.5 13.5,8.9 19.1,5.8 15,10.7 21.2,12 15,13.3 19.1,18.2 13.5,15.1 12,21.5 10.5,15.1 4.9,18.2 9,13.3 2.8,12 9,10.7 4.9,5.8 10.5,8.9"/></svg>`);
const urls = ["", "cards/", ...cards.map((c) => `cards/${c.slug}/`), "disclaimer/", "privacy/"];
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `<url><loc>${site.siteUrl}${B}${u}</loc></url>`).join("\n")}
</urlset>
`);
write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${site.siteUrl}${B}sitemap.xml\n`);
write(".nojekyll", "");
console.log(`built ${urls.length} pages, ${cards.length} cards`);
