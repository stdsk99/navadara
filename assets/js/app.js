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

  function img(id) { return CFG.base + "decks/" + CFG.deck.folder + "/" + id + "." + CFG.deck.ext; }
  function backImg() { return img("back"); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, reduced ? Math.min(ms, 60) : ms); }); }
  function rand(n) { var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }
  function shuffled(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rand(i + 1); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function today() { var d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function catLabel(id) { for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i].label; return ""; }
  function cardById(id) { for (var i = 0; i < state.cards.length; i++) if (state.cards[i].id === id) return state.cards[i]; }

  /* ---------- setup ---------- */
  function renderSetup() {
    var sl = $("#spreads"); sl.innerHTML = "";
    state.spreads.forEach(function (sp) {
      var b = el("button", "spread-opt"); b.type = "button";
      b.appendChild(el("b", null, sp.name));
      b.appendChild(el("span", sp.enabled ? null : "soon", sp.enabled ? sp.desc : sp.desc + " · เร็วๆ นี้"));
      b.disabled = !sp.enabled;
      b.setAttribute("aria-pressed", state.spread === sp ? "true" : "false");
      b.addEventListener("click", function () { state.spread = sp; renderSetup(); });
      sl.appendChild(b);
    });
    var cl = $("#cats"); cl.innerHTML = "";
    CATS.forEach(function (c) {
      var b = el("button", "chip", c.label); b.type = "button";
      b.setAttribute("aria-pressed", state.cat === c.id ? "true" : "false");
      b.addEventListener("click", function () { state.cat = c.id; renderSetup(); });
      cl.appendChild(b);
    });
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
        state.spread = state.spreads[0];
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
    msg.textContent = need === 1 ? "แตะเลือกไพ่ 1 ใบ ที่ดึงดูดใจคุณ" : "แตะเลือกไพ่ " + need + " ใบ";
  }

  function renderFan(stage) {
    var fan = el("div", "fan");
    var n = state.deck.length;
    var small = stage.clientWidth < 600;
    // มือถือ: กางเป็นพัด 2 แถว ให้ช่องแตะกว้างพอ / คอม: พัดแถวเดียว
    var rows = small ? 2 : 1;
    var perRow = Math.ceil(n / rows);
    var spreadDeg = small ? 56 : 100;
    var cardH = small ? 84 : 120;
    var radius = small ? 240 : 360;
    state.deck.forEach(function (d, i) {
      var b = el("button", "fan-card"); b.type = "button";
      b.style.backgroundImage = "url('" + backImg() + "')";
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
    btn.disabled = true; sound.pick();
    btn.style.transform = "rotate(" + btn.dataset.ang + "deg) translateY(-26px)";
    state.picks.push(d);
    if (state.picks.length < need) {
      $("#stage-msg").textContent = "เลือกแล้ว " + state.picks.length + " / " + need + " ใบ";
      return;
    }
    fan.style.pointerEvents = "none";
    btn.classList.add("chosen"); fan.classList.add("picked");
    await wait(450);
    fan.remove();
    if (need === 1) {
      var stage = $("#stage");
      var flip = flipCard(d, "");
      stage.appendChild(flip);
      $("#stage-msg").textContent = "";
      await wait(350);
      flip.classList.add("flipped"); sound.flip();
      await wait(1100);
    }
    saveDaily();
    window.navaTrack("reading_done", { spread: state.spread.id, category: state.cat });
    show("result"); renderResult();
    $("#step-result").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }

  function flipCard(d, extra) {
    var w = el("div", "flip" + (d.rev ? " reversed" : "") + (extra ? " " + extra : ""));
    var inner = el("div", "flip-inner");
    var back = el("div", "face back"); var bi = el("img"); bi.src = backImg(); bi.alt = ""; back.appendChild(bi);
    var front = el("div", "face front"); var fi = el("img"); fi.src = img(d.card.id);
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
    state.picks.forEach(function (d, i) {
      var pos = state.spread.positions[i];
      var o = d.rev ? d.card.rev : d.card.up;
      var sec = el("article", "result");
      var head = el("div", "result-head");
      var flip = flipCard(d, "flipped");
      head.appendChild(flip);
      head.appendChild(el("div", "pos", pos.label));
      head.appendChild(el("h2", null, d.card.name_th));
      var sub = el("div", "muted"); sub.textContent = d.card.name + " · ";
      sub.appendChild(el("span", "badge", d.rev ? "ไพ่กลับหัว" : "ไพ่ตั้ง"));
      head.appendChild(sub);
      var kw = el("div", "kw"); o.kw.forEach(function (k) { kw.appendChild(el("span", null, k)); }); head.appendChild(kw);
      if (state.question && i === 0) head.appendChild(el("p", "question-echo", "“" + state.question + "”"));
      sec.appendChild(head);

      var rb = el("div", "read-block");
      var posText = o.pos[pos.type] || o.pos.present;
      rb.appendChild(el("h3", null, pos.label)); rb.appendChild(el("p", null, posText));
      rb.appendChild(el("h3", null, "ด้าน" + catLabel(state.cat))); rb.appendChild(el("p", null, o.cat[state.cat]));
      rb.appendChild(el("h3", null, "ภาพรวมของไพ่")); rb.appendChild(el("p", null, o.base));
      var more = el("p"); var a = el("a", null, "อ่านความหมายไพ่ " + d.card.name_th + " ทุกด้าน →");
      a.href = CFG.base + "cards/" + d.card.slug + "/"; more.appendChild(a); rb.appendChild(more);
      if (state.cat === "health" || state.cat === "finance") {
        rb.appendChild(el("p", "disclaimer-inline", "คำทำนายนี้เพื่อความบันเทิงและการสะท้อนความคิดเท่านั้น ไม่ใช่คำแนะนำทาง" + (state.cat === "health" ? "การแพทย์ หากมีอาการผิดปกติควรปรึกษาแพทย์" : "การเงินหรือการลงทุน")));
      }
      sec.appendChild(rb);
      box.appendChild(sec);
    });
    var act = el("div", "actions");
    var again = el("button", "btn", "เปิดไพ่ใหม่"); again.type = "button";
    again.addEventListener("click", function () { renderSetup(); show("setup"); $("#reader").scrollIntoView({ behavior: reduced ? "auto" : "smooth" }); });
    var lib = el("a", "btn ghost", "ดูความหมายไพ่ทั้งหมด"); lib.href = CFG.base + "cards/";
    act.appendChild(again); act.appendChild(lib); box.appendChild(act);
  }

  /* ---------- boot ---------- */
  Promise.all([
    fetch(CFG.base + "data/major.json").then(function (r) { return r.json(); }),
    fetch(CFG.base + "data/spreads.json").then(function (r) { return r.json(); })
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
