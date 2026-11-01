/* นวดารา — ระบบเปิดไพ่ */
(function () {
  "use strict";
  var CFG = window.NAVA;
  var store = window.NavaStore;
  var sound = window.NavaSound;
  var CATS = [
    { id: "general", label: "ทั่วไป" }, { id: "love", label: "ความรัก" }, { id: "career", label: "การงาน" },
    { id: "finance", label: "การเงิน" }, { id: "health", label: "สุขภาพ" }
  ];
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s) { return document.querySelector(s); };
  var state = { cards: [], spreads: [], spread: null, cat: "general", question: "", deck: [], picks: [] };

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, reduced ? Math.min(ms, 60) : ms); }); }
  function rand(n) { var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }
  function shuffled(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rand(i + 1); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function today() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function catLabel(id) { for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i].label; return ""; }
  function cardById(id) { for (var i = 0; i < state.cards.length; i++) if (state.cards[i].id === id) return state.cards[i]; }
  function spreadById(id) { for (var i = 0; i < state.spreads.length; i++) if (state.spreads[i].id === id) return state.spreads[i]; }

  /* ---------- setup ---------- */
  function renderSetup() {
    var sl = $("#spreads"); sl.innerHTML = "";
    state.spreads.forEach(function (sp) {
      var b = el("button", "spread-opt"); b.type = "button";
      b.appendChild(el("b", null, sp.name));
      b.appendChild(el("span", sp.enabled ? null : "soon", sp.enabled ? sp.desc : sp.desc + " · เร็วๆ นี้"));
      b.disabled = !sp.enabled;
      b.setAttribute("aria-pressed", state.spread === sp ? "true" : "false");
      b.addEventListener("click", function () { state.spread = sp; if (sp.id === "love") state.cat = "love"; renderSetup(); });
      sl.appendChild(b);
    });
    var cl = $("#cats"); cl.innerHTML = "";
    CATS.forEach(function (c) {
      var b = el("button", "chip", c.label); b.type = "button";
      b.setAttribute("aria-pressed", state.cat === c.id ? "true" : "false");
      b.addEventListener("click", function () { state.cat = c.id; renderSetup(); });
      cl.appendChild(b);
    });
    renderHistory();
    var saved = null;
    try { saved = JSON.parse(store.get("nava.daily") || "null"); } catch (e) {}
    var note = $("#today-note"); note.innerHTML = "";
    if (saved && saved.date === today() && cardById(saved.id)) {
      var c = cardById(saved.id);
      note.appendChild(document.createTextNode("ไพ่ประจำวันของคุณวันนี้คือ " + c.name_th + (saved.rev ? " (กลับหัว)" : "") + " · "));
      var a = el("a", null, "ดูคำทำนายอีกครั้ง"); a.href = "#";
      a.addEventListener("click", function (e) {
        e.preventDefault();
        state.cat = saved.cat || "general"; state.question = saved.q || "";
        state.spread = spreadById("daily");
        state.picks = [{ card: c, rev: !!saved.rev }];
        show("result"); renderResult();
      });
      note.appendChild(a);
    }
  }

  function show(step) {
    ["setup", "table", "result"].forEach(function (s) { $("#step-" + s).hidden = s !== step; });
  }

  /* ---------- shuffle + fan ---------- */
  async function startReading() {
    state.question = $("#question").value.trim();
    state.picks = [];
    state.deck = shuffled(state.cards).map(function (c) { return { card: c, rev: rand(2) === 1 }; });
    show("table");
    var stage = $("#stage"); stage.innerHTML = "";
    var msg = $("#stage-msg");
    var stack = el("div", "deck-stack shuffling");
    for (var i = 0; i < 6; i++) {
      var sc = el("div", "stack-card");
      sc.style.setProperty("--dx", (i % 2 ? -1 : 1) * (20 + i * 8) + "px");
      sc.style.setProperty("--rot", (i % 2 ? -1 : 1) * (3 + i) + "deg");
      stack.appendChild(sc);
    }
    stage.appendChild(stack);
    msg.textContent = state.question ? "กำลังสับไพ่ ตั้งจิตถึงคำถามของคุณ…" : "กำลังสับไพ่ ตั้งจิตให้สงบ…";
    sound.shuffle();
    window.navaTrack("shuffle", { spread: state.spread.id, category: state.cat });
    await wait(1900);
    stack.remove();
    renderFan(stage);
    var need = state.spread.positions.length;
    msg.textContent = need === 1 ? "แตะเลือกไพ่ 1 ใบ ที่ดึงดูดใจคุณ" : "แตะเลือกไพ่ " + need + " ใบ ตามลำดับ: " + state.spread.positions.map(function (p) { return p.label; }).join(" → ");
  }

  function renderFan(stage) {
    var fan = el("div", "fan");
    // แสดงไพ่บนโต๊ะไม่เกิน 22 ใบเพื่อให้แตะง่าย (สุ่มมาจากสำรับที่สับแล้ว ทุกใบมีโอกาสเท่ากัน)
    var shown = state.deck.slice(0, 22);
    var n = shown.length;
    var small = stage.clientWidth < 600;
    // มือถือ: กางเป็นพัด 2 แถว ให้ช่องแตะกว้างพอ / คอม: พัดแถวเดียว
    var rows = small ? 2 : 1;
    var perRow = Math.ceil(n / rows);
    var spreadDeg = small ? 56 : 100;
    var cardH = small ? 84 : 120;
    var radius = small ? 240 : 360;
    shown.forEach(function (d, i) {
      var b = el("button", "fan-card"); b.type = "button";
      b.style.backgroundImage = "url('" + CFG.back + "')";
      b.setAttribute("aria-label", "ไพ่ใบที่ " + (i + 1));
      var row = Math.floor(i / perRow), k = i % perRow;
      var count = Math.min(perRow, n - row * perRow);
      var ang = -spreadDeg / 2 + k * (spreadDeg / (count - 1));
      b.style.top = (small ? 18 + row * 140 : 40) + "px";
      b.style.height = cardH + "px"; b.style.width = (cardH / 1.5) + "px"; b.style.marginLeft = (-cardH / 3) + "px";
      b.style.transformOrigin = "50% " + (radius + cardH / 2) + "px";
      b.dataset.ang = ang;
      b.style.transform = "rotate(0deg)";
      b.addEventListener("click", function () { pick(fan, b, d); });
      fan.appendChild(b);
    });
    stage.appendChild(fan);
    requestAnimationFrame(function () {
      fan.classList.add("open");
      Array.prototype.forEach.call(fan.children, function (b) { b.style.transform = "rotate(" + b.dataset.ang + "deg)"; });
    });
  }

  async function pick(fan, btn, d) {
    if (btn.disabled) return;
    var need = state.spread.positions.length;
    if (state.picks.length >= need) return;
    btn.disabled = true; sound.pick();
    btn.classList.add("chosen");
    btn.style.transform = "rotate(" + btn.dataset.ang + "deg) translateY(-26px)";
    state.picks.push(d);
    if (state.picks.length < need) {
      $("#stage-msg").textContent = "เลือกแล้ว " + state.picks.length + " / " + need + " ใบ · ต่อไป: " + state.spread.positions[state.picks.length].label;
      return;
    }
    fan.style.pointerEvents = "none";
    fan.classList.add("picked");
    await wait(450);
    fan.remove();
    var stage = $("#stage");
    $("#stage-msg").textContent = "";
    var row = el("div", "spread-row n" + need);
    if (need > 3) stage.classList.add("grow");
    var flips = state.picks.map(function (p, i) {
      var cell = el("div", "spread-cell");
      var f = flipCard(p, "");
      cell.appendChild(f);
      if (need > 1) cell.appendChild(el("div", "cell-label", (need > 3 ? (i + 1) + ". " : "") + state.spread.positions[i].label));
      row.appendChild(cell);
      return f;
    });
    stage.appendChild(row);
    await wait(350);
    for (var i = 0; i < flips.length; i++) {
      flips[i].classList.add("flipped"); sound.flip();
      await wait(need > 5 ? 420 : need > 1 ? 650 : 1100);
    }
    await wait(400);
    stage.classList.remove("grow");
    saveDaily();
    saveHistory();
    window.navaTrack("reading_done", { spread: state.spread.id, category: state.cat });
    show("result"); renderResult();
    $("#step-result").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }

  function flipCard(d, extra) {
    var w = el("div", "flip" + (d.rev ? " reversed" : "") + (extra ? " " + extra : ""));
    var inner = el("div", "flip-inner");
    var back = el("div", "face back"); var bi = el("img"); bi.src = CFG.back; bi.alt = ""; back.appendChild(bi);
    var front = el("div", "face front"); var fi = el("img"); fi.src = d.card.img;
    fi.alt = d.card.name_th + " (" + d.card.name + ")" + (d.rev ? " กลับหัว" : ""); front.appendChild(fi);
    inner.appendChild(back); inner.appendChild(front); w.appendChild(inner);
    return w;
  }

  function saveDaily() {
    if (state.spread.id !== "daily") return;
    var d = state.picks[0];
    store.set("nava.daily", JSON.stringify({ date: today(), id: d.card.id, rev: d.rev, cat: state.cat, q: state.question }));
  }

  /* ---------- result ---------- */
  function renderResult() {
    var box = $("#result"); box.innerHTML = "";
    var multi = state.picks.length > 1;
    var top = el("div", "result-top");
    top.appendChild(el("div", "pos", state.spread.name + " · ด้าน" + catLabel(state.cat)));
    if (state.question) top.appendChild(el("p", "question-echo", "“" + state.question + "”"));
    if (multi) {
      var row = el("div", "spread-row n" + state.picks.length + " static");
      state.picks.forEach(function (p, i) {
        var a = el("a", "spread-cell"); a.href = "#pos-" + i;
        a.appendChild(flipCard(p, "flipped"));
        a.appendChild(el("div", "cell-label", (state.picks.length > 3 ? (i + 1) + ". " : "") + state.spread.positions[i].label));
        a.appendChild(el("div", "cell-name", p.card.name_th + (p.rev ? " (กลับหัว)" : "")));
        row.appendChild(a);
      });
      top.appendChild(row);
    }
    box.appendChild(top);
    if (multi) box.appendChild(renderSummary());

    state.picks.forEach(function (d, i) {
      var pos = state.spread.positions[i];
      var o = d.rev ? d.card.rev : d.card.up;
      var sec = el("article", "result"); sec.id = "pos-" + i;
      var head = el("div", "result-head");
      if (!multi) head.appendChild(flipCard(d, "flipped"));
      head.appendChild(el("div", "pos", (multi ? "ใบที่ " + (i + 1) + " · " : "") + pos.label));
      if (multi) { var mini = flipCard(d, "flipped mini"); head.insertBefore(mini, head.firstChild); }
      head.appendChild(el("h2", null, d.card.name_th));
      var sub = el("div", "muted"); sub.textContent = d.card.name + " · ";
      sub.appendChild(el("span", "badge", d.rev ? "ไพ่กลับหัว" : "ไพ่ตั้ง"));
      head.appendChild(sub);
      var kw = el("div", "kw"); o.kw.forEach(function (k) { kw.appendChild(el("span", null, k)); }); head.appendChild(kw);
      sec.appendChild(head);

      var rb = el("div", "read-block");
      var posText = o.pos[pos.type] || o.pos.present;
      rb.appendChild(el("h3", null, multi ? "ในตำแหน่ง" + pos.label : "คำทำนายของวันนี้")); rb.appendChild(el("p", null, posText));
      rb.appendChild(el("h3", null, "ด้าน" + catLabel(state.cat))); rb.appendChild(el("p", null, o.cat[state.cat]));
      if (!multi) { rb.appendChild(el("h3", null, "ภาพรวมของไพ่")); rb.appendChild(el("p", null, o.base)); }
      var more = el("p"); var a = el("a", null, "อ่านความหมายไพ่ " + d.card.name_th + " ทุกด้าน →");
      a.href = CFG.base + "cards/" + d.card.slug + "/"; more.appendChild(a); rb.appendChild(more);
      sec.appendChild(rb);
      box.appendChild(sec);
    });
    if (state.cat === "health" || state.cat === "finance") {
      box.appendChild(el("p", "disclaimer-inline", "คำทำนายนี้เพื่อความบันเทิงและการสะท้อนความคิดเท่านั้น ไม่ใช่คำแนะนำทาง" + (state.cat === "health" ? "การแพทย์ หากมีอาการผิดปกติควรปรึกษาแพทย์" : "การเงินหรือการลงทุน")));
    }

    // แชร์
    var share = el("div", "share-box");
    var shareBtn = el("button", "btn", "สร้างภาพผลไพ่เพื่อแชร์"); shareBtn.type = "button";
    share.appendChild(shareBtn);
    if (state.question) {
      var lab = el("label", "small muted check");
      var cb = el("input"); cb.type = "checkbox"; cb.id = "share-q";
      lab.appendChild(cb); lab.appendChild(document.createTextNode(" ใส่คำถามของฉันในภาพ"));
      share.appendChild(lab);
    }
    var preview = el("div", "share-preview"); share.appendChild(preview);
    shareBtn.addEventListener("click", function () { makeShare(preview, shareBtn); });
    box.appendChild(share);

    var act = el("div", "actions");
    var again = el("button", "btn ghost", "เปิดไพ่ใหม่"); again.type = "button";
    again.addEventListener("click", function () { renderSetup(); show("setup"); $("#reader").scrollIntoView({ behavior: reduced ? "auto" : "smooth" }); });
    var lib = el("a", "btn ghost", "ดูความหมายไพ่ทั้งหมด"); lib.href = CFG.base + "cards/";
    act.appendChild(again); act.appendChild(lib); box.appendChild(act);
  }

  /* ---------- บทสรุปภาพรวม ---------- */
  var SUIT_TEXT = {
    wands: ["ไม้เท้า", "เรื่องนี้ขับเคลื่อนด้วยไฟและการลงมือทำ ความกระตือรือร้นและความกล้าเป็นกุญแจสำคัญ"],
    cups: ["ถ้วย", "เรื่องนี้เกี่ยวข้องกับความรู้สึกและความสัมพันธ์เป็นหลัก ฟังหัวใจตัวเองและคนรอบข้างให้ดี"],
    swords: ["ดาบ", "เรื่องนี้เต็มไปด้วยความคิด การตัดสินใจ และอาจมีความขัดแย้ง ใช้เหตุผลและสื่อสารให้ชัด"],
    pentacles: ["เหรียญ", "เรื่องนี้ผูกกับเงิน งาน และความมั่นคงในชีวิตจริง ค่อยๆ วางแผนอย่างเป็นรูปธรรม"]
  };
  var RANK_TEXT = {
    1: "ไพ่หนึ่ง (Ace) ออกซ้ำ เป็นสัญญาณของการเริ่มต้นใหม่ที่ชัดเจน",
    2: "ไพ่สองออกซ้ำ เรื่องนี้เกี่ยวกับการเลือกและการหาสมดุลระหว่างสองสิ่ง",
    3: "ไพ่สามออกซ้ำ การร่วมมือและการเติบโตจะพาไปข้างหน้า",
    4: "ไพ่สี่ออกซ้ำ ถึงเวลาสร้างความมั่นคงและพักตั้งหลัก",
    5: "ไพ่ห้าออกซ้ำ ช่วงนี้มีความท้าทายหรือความไม่ลงตัวที่ต้องผ่านไปให้ได้",
    6: "ไพ่หกออกซ้ำ เป็นช่วงของการปรับตัว การให้และการเยียวยา",
    7: "ไพ่เจ็ดออกซ้ำ ต้องใช้ความอดทนและประเมินสถานการณ์ให้ดี",
    8: "ไพ่แปดออกซ้ำ จะมีความเคลื่อนไหวและการเปลี่ยนแปลงเกิดขึ้น",
    9: "ไพ่เก้าออกซ้ำ เรื่องนี้ใกล้ถึงจุดสิ้นสุดของวงจรแล้ว",
    10: "ไพ่สิบออกซ้ำ วงจรหนึ่งกำลังจบเพื่อเริ่มบทใหม่",
    11: "ไพ่เด็กถือ (Page) ออกซ้ำ จะมีข่าวสารหรือการเรียนรู้สิ่งใหม่",
    12: "ไพ่อัศวินออกซ้ำ เรื่องจะเคลื่อนไหวเร็ว มีคนหรือเหตุการณ์ที่ผลักดันให้ขยับ",
    13: "ไพ่ราชินีออกซ้ำ ผู้หญิงหรือพลังแห่งความเข้าใจมีบทบาทสำคัญ",
    14: "ไพ่ราชาออกซ้ำ ผู้มีอำนาจหรือการตัดสินใจที่เด็ดขาดมีบทบาทสำคัญ"
  };
  function renderSummary() {
    var picks = state.picks, n = picks.length, out = [];
    var major = picks.filter(function (p) { return p.card.arcana === "major"; }).length;
    var rev = picks.filter(function (p) { return p.rev; }).length;
    if (major === 0) out.push("ไม่มีไพ่ Major เลย เรื่องนี้เป็นเรื่องในชีวิตประจำวันที่คุณควบคุมได้ด้วยการกระทำของตัวเอง");
    else if (major >= Math.ceil(n / 2)) out.push("ไพ่ Major ออกมา " + major + " จาก " + n + " ใบ เรื่องนี้เป็นจุดเปลี่ยนสำคัญของชีวิต มีพลังที่ใหญ่กว่าตัวคุณเข้ามาเกี่ยวข้อง");
    else out.push("มีไพ่ Major " + major + " ใบ เรื่องนี้มีทั้งส่วนที่เป็นบทเรียนสำคัญและส่วนที่คุณจัดการได้เอง");
    var cnt = {};
    picks.forEach(function (p) { if (p.card.suit) cnt[p.card.suit] = (cnt[p.card.suit] || 0) + 1; });
    var top = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; });
    if (top.length && cnt[top[0]] >= 2 && (top.length === 1 || cnt[top[0]] > cnt[top[1]])) out.push("ชุด" + SUIT_TEXT[top[0]][0] + "ออกมากที่สุด (" + cnt[top[0]] + " ใบ) " + SUIT_TEXT[top[0]][1]);
    if (rev === 0) out.push("ไม่มีไพ่กลับหัวเลย พลังของเรื่องนี้ไหลลื่น เป็นจังหวะที่ดีในการลงมือ");
    else if (rev >= Math.ceil(n / 2)) out.push("ไพ่กลับหัว " + rev + " ใบ พลังหลายส่วนยังติดขัดหรือหันเข้าหาตัวเอง ควรทบทวนและแก้ที่ใจก่อนขยับ");
    var ranks = {};
    picks.forEach(function (p) { if (p.card.arcana === "minor") ranks[p.card.num] = (ranks[p.card.num] || 0) + 1; });
    Object.keys(ranks).forEach(function (k) { if (ranks[k] >= 2) out.push(RANK_TEXT[k]); });
    var last = picks[n - 1], lastPos = state.spread.positions[n - 1];
    out.push("ไพ่ใบสุดท้ายในตำแหน่ง" + lastPos.label + "คือ " + last.card.name_th + (last.rev
      ? " แบบกลับหัว เป็นสัญญาณให้ระวังและปรับแก้ตามคำแนะนำ เพื่อให้ผลลัพธ์ออกมาดีขึ้น"
      : " แบบตั้ง แนวโน้มโดยรวมเป็นไปในทางที่ดี ถ้าคุณเดินตามสิ่งที่ไพ่ชี้ทาง"));
    var box = el("section", "summary");
    box.appendChild(el("h3", null, "บทสรุปภาพรวม"));
    out.forEach(function (t) { box.appendChild(el("p", null, t)); });
    return box;
  }

  /* ---------- ประวัติการเปิดไพ่ (เก็บในเครื่องผู้ใช้) ---------- */
  function loadHistory() { try { return JSON.parse(store.get("nava.history") || "[]"); } catch (e) { return []; } }
  function saveHistory() {
    var h = loadHistory();
    h.unshift({ t: Date.now(), s: state.spread.id, c: state.cat, q: state.question, p: state.picks.map(function (p) { return [p.card.id, p.rev ? 1 : 0]; }) });
    store.set("nava.history", JSON.stringify(h.slice(0, 30)));
  }
  function renderHistory() {
    var wrap = $("#history"); if (!wrap) return;
    wrap.innerHTML = "";
    var h = loadHistory().filter(function (x) { return spreadById(x.s) && x.p.every(function (q) { return cardById(q[0]); }); });
    if (!h.length) return;
    var det = el("details", "history");
    det.appendChild(el("summary", null, "ประวัติการเปิดไพ่ของคุณ (" + h.length + ")"));
    var ul = el("ul");
    h.forEach(function (x) {
      var li = el("li"); var a = el("a"); a.href = "#";
      var d = new Date(x.t);
      a.appendChild(el("span", "h-date", d.toLocaleDateString("th-TH", { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })));
      a.appendChild(el("b", null, spreadById(x.s).name + " · " + catLabel(x.c)));
      a.appendChild(el("span", "h-cards", x.p.map(function (q) { return cardById(q[0]).name_th + (q[1] ? " (กลับหัว)" : ""); }).join(" · ")));
      a.addEventListener("click", function (e) {
        e.preventDefault();
        state.spread = spreadById(x.s); state.cat = x.c; state.question = x.q || "";
        state.picks = x.p.map(function (q) { return { card: cardById(q[0]), rev: !!q[1] }; });
        show("result"); renderResult();
        $("#step-result").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      });
      li.appendChild(a); ul.appendChild(li);
    });
    det.appendChild(ul);
    var clr = el("button", "btn ghost small-btn", "ล้างประวัติ"); clr.type = "button";
    clr.addEventListener("click", function () { if (window.confirm("ลบประวัติการเปิดไพ่ทั้งหมดในเครื่องนี้?")) { store.set("nava.history", "[]"); renderHistory(); } });
    det.appendChild(clr);
    wrap.appendChild(det);
  }

  /* ---------- ภาพสำหรับแชร์ (สร้างในเครื่อง ไม่ส่งข้อมูลออก) ---------- */
  function loadImg(src) {
    return new Promise(function (res) { var i = new Image(); i.onload = function () { res(i); }; i.onerror = function () { res(null); }; i.src = src; });
  }
  function wrapText(ctx, text, x, y, maxW, lineH, maxLines) {
    // ภาษาไทยไม่มีเว้นวรรคระหว่างคำ ตัดคำด้วย Intl.Segmenter ถ้ามี ไม่มีก็ตัดทีละตัวอักษร
    var parts = window.Intl && Intl.Segmenter
      ? Array.from(new Intl.Segmenter("th", { granularity: "word" }).segment(text), function (x) { return x.segment; })
      : text.split("");
    var line = "", lines = [];
    for (var i = 0; i < parts.length; i++) {
      var t = line + parts[i];
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = parts[i].replace(/^\s+/, ""); } else line = t;
    }
    if (line) lines.push(line);
    if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1) + "…"; }
    lines.forEach(function (l, k) { ctx.fillText(l, x, y + k * lineH); });
    return lines.length;
  }
  async function makeShare(preview, btn) {
    btn.disabled = true; btn.textContent = "กำลังสร้างภาพ…";
    var W = 1080, H = 1350, gold = "#c9a96e", ink = "#ece6da", muted = "#a9a49a";
    var cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    var ctx = cv.getContext("2d");
    var g = ctx.createRadialGradient(W / 2, 0, 50, W / 2, 0, 900);
    g.addColorStop(0, "#1c2440"); g.addColorStop(1, "#0d1222");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = gold; ctx.lineWidth = 2; ctx.strokeRect(36, 36, W - 72, H - 72);
    ctx.globalAlpha = .5; ctx.strokeRect(48, 48, W - 96, H - 96); ctx.globalAlpha = 1;
    var sans = "'IBM Plex Sans Thai','Noto Sans Thai',sans-serif", serif = "'Noto Serif Thai',Georgia,serif";
    ctx.textAlign = "center"; ctx.fillStyle = gold; ctx.font = "500 46px " + serif;
    ctx.fillText("✦ " + CFG.name + " ✦", W / 2, 130);
    ctx.fillStyle = muted; ctx.font = "30px " + sans;
    ctx.fillText(state.spread.name + " · ด้าน" + catLabel(state.cat), W / 2, 180);
    var y = 215;
    var withQ = state.question && document.getElementById("share-q") && document.getElementById("share-q").checked;
    if (withQ) { ctx.fillStyle = ink; ctx.font = "italic 30px " + sans; y += 10 + 40 * wrapText(ctx, "“" + state.question + "”", W / 2, y + 20, W - 220, 40, 2); }
    var n = state.picks.length;
    var imgs = await Promise.all(state.picks.map(function (p) { return loadImg(p.card.img); }));
    if (n > 3) { drawGrid(ctx, imgs, y + 30, W, H, gold, ink, muted, sans, serif); return finishShare(cv, preview, btn, muted, sans, W, H); }
    var cw = n === 1 ? 380 : 260, ch = cw * 1.5, gap = 40;
    var total = n * cw + (n - 1) * gap, x0 = (W - total) / 2, cy = y + 40;
    state.picks.forEach(function (p, i) {
      var x = x0 + i * (cw + gap), im = imgs[i];
      ctx.save();
      if (p.rev) { ctx.translate(x + cw / 2, cy + ch / 2); ctx.rotate(Math.PI); ctx.translate(-(x + cw / 2), -(cy + ch / 2)); }
      if (im) ctx.drawImage(im, x, cy, cw, ch); else { ctx.fillStyle = "#141a2e"; ctx.fillRect(x, cy, cw, ch); }
      ctx.restore();
      ctx.strokeStyle = gold; ctx.lineWidth = 2; ctx.strokeRect(x, cy, cw, ch);
      var ty = cy + ch + 50;
      if (n > 1) { ctx.fillStyle = gold; ctx.font = "26px " + sans; ctx.fillText(state.spread.positions[i].label, x + cw / 2, ty); ty += 44; }
      ctx.fillStyle = ink; ctx.font = "500 " + (n === 1 ? 52 : 34) + "px " + serif;
      ctx.fillText(p.card.name_th, x + cw / 2, ty);
      ctx.fillStyle = muted; ctx.font = (n === 1 ? 30 : 24) + "px " + sans;
      ctx.fillText(p.rev ? "ไพ่กลับหัว" : "ไพ่ตั้ง", x + cw / 2, ty + (n === 1 ? 48 : 36));
      if (n > 1) {
        var po = p.rev ? p.card.rev : p.card.up;
        ctx.fillStyle = ink; ctx.font = "24px " + sans;
        wrapText(ctx, po.pos[state.spread.positions[i].type] || po.pos.present, x + cw / 2, ty + 90, cw + 20, 34, 6);
      }
    });
    var by = cy + ch + (n === 1 ? 190 : 420);
    if (n === 1) {
      var o = state.picks[0].rev ? state.picks[0].card.rev : state.picks[0].card.up;
      ctx.fillStyle = gold; ctx.font = "30px " + sans; ctx.fillText(o.kw.slice(0, 3).join(" · "), W / 2, by);
      ctx.fillStyle = ink; ctx.font = "30px " + sans; wrapText(ctx, o.pos.present, W / 2, by + 60, W - 240, 44, 3);
    } else {
      ctx.fillStyle = gold; ctx.font = "28px " + sans;
      wrapText(ctx, state.picks.map(function (p) { return (p.rev ? p.card.rev : p.card.up).kw[0]; }).join("  →  "), W / 2, by, W - 200, 40, 2);
    }
    return finishShare(cv, preview, btn, muted, sans, W, H);
  }
  function drawGrid(ctx, imgs, y0, W, H, gold, ink, muted, sans, serif) {
    var n = state.picks.length, cols = n === 5 ? 3 : 5, rows = Math.ceil(n / cols);
    var cw = n === 5 ? 230 : 168, ch = cw * 1.5, gapX = n === 5 ? 50 : 24, rowH = ch + (n === 5 ? 110 : 96);
    // จัดตารางให้อยู่กลางพื้นที่ระหว่างหัวภาพกับท้ายภาพ
    var avail = H - 150 - y0, used = rows * rowH;
    if (avail > used) y0 += (avail - used) / 2 - 20;
    function fitText(t, maxW, size, font) {
      ctx.font = size + "px " + font;
      while (ctx.measureText(t).width > maxW && size > 14) { size -= 1; ctx.font = size + "px " + font; }
    }
    state.picks.forEach(function (p, i) {
      var r = Math.floor(i / cols), k = i % cols, inRow = Math.min(cols, n - r * cols);
      var x0 = (W - (inRow * cw + (inRow - 1) * gapX)) / 2, x = x0 + k * (cw + gapX), cy = y0 + 20 + r * rowH, im = imgs[i];
      ctx.save();
      if (p.rev) { ctx.translate(x + cw / 2, cy + ch / 2); ctx.rotate(Math.PI); ctx.translate(-(x + cw / 2), -(cy + ch / 2)); }
      if (im) ctx.drawImage(im, x, cy, cw, ch); else { ctx.fillStyle = "#141a2e"; ctx.fillRect(x, cy, cw, ch); }
      ctx.restore();
      ctx.strokeStyle = gold; ctx.lineWidth = 2; ctx.strokeRect(x, cy, cw, ch);
      ctx.fillStyle = gold; fitText((i + 1) + ". " + state.spread.positions[i].label, cw + gapX - 6, n === 5 ? 24 : 20, sans);
      ctx.fillText((i + 1) + ". " + state.spread.positions[i].label, x + cw / 2, cy + ch + 34);
      ctx.fillStyle = ink; ctx.font = "500 " + (n === 5 ? 28 : 22) + "px " + serif;
      ctx.fillText(p.card.name_th + (p.rev ? " ↺" : ""), x + cw / 2, cy + ch + (n === 5 ? 72 : 64));
    });
  }
  async function finishShare(cv, preview, btn, muted, sans, W, H) {
    var ctx = cv.getContext("2d");
    ctx.textAlign = "center"; ctx.fillStyle = muted; ctx.font = "26px " + sans;
    ctx.fillText("เปิดไพ่ฟรีที่ " + (CFG.siteUrl + CFG.base).replace(/^https?:\/\//, "").replace(/\/$/, ""), W / 2, H - 90);

    var blob = await new Promise(function (r) { try { cv.toBlob(r, "image/png"); } catch (e) { r(null); } });
    btn.disabled = false; btn.textContent = "สร้างภาพผลไพ่อีกครั้ง";
    preview.innerHTML = "";
    if (!blob) { preview.appendChild(el("p", "small muted", "เบราว์เซอร์นี้สร้างภาพไม่ได้ ลองแคปหน้าจอแทนนะ")); return; }
    var url = URL.createObjectURL(blob);
    var im = el("img"); im.src = url; im.alt = "ภาพผลไพ่สำหรับแชร์"; preview.appendChild(im);
    var row = el("div", "actions");
    var file = new File([blob], "navadara-tarot.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      var sb = el("button", "btn", "แชร์"); sb.type = "button";
      sb.addEventListener("click", function () {
        navigator.share({ files: [file], title: CFG.name, text: "ไพ่ของฉันจาก" + CFG.name }).catch(function () {});
        window.navaTrack("share", { method: "native" });
      });
      row.appendChild(sb);
    }
    var dl = el("a", "btn ghost", "บันทึกภาพ"); dl.href = url; dl.download = "navadara-tarot.png";
    dl.addEventListener("click", function () { window.navaTrack("share", { method: "download" }); });
    row.appendChild(dl);
    preview.appendChild(row);
  }

  /* ---------- boot ---------- */
  Promise.all([
    fetch(CFG.base + "data/cards.json?v=" + CFG.v).then(function (r) { return r.json(); }),
    fetch(CFG.base + "data/spreads.json?v=" + CFG.v).then(function (r) { return r.json(); })
  ]).then(function (res) {
    state.cards = res[0]; state.spreads = res[1];
    state.spread = state.spreads.filter(function (s) { return s.enabled; })[0];
    renderSetup();
    $("#btn-shuffle").disabled = false;
    $("#btn-shuffle").addEventListener("click", startReading);
  }).catch(function () {
    $("#today-note").textContent = "โหลดข้อมูลไพ่ไม่สำเร็จ กรุณารีเฟรชหน้าอีกครั้ง";
  });
})();
