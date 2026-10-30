/* นวดารา — ส่วนที่ใช้ทุกหน้า: เสียง, คุกกี้, Google Analytics */
(function () {
  "use strict";
  var CFG = window.NAVA || {};
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  window.NavaStore = store;

  /* ---------- เสียง (สังเคราะห์ด้วย Web Audio ไม่ต้องใช้ไฟล์) ---------- */
  var ctx = null;
  var soundOn = store.get("nava.sound") === "on";
  function audio() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function noise(dur, freq, gain, when) {
    var a = audio(); if (!a) return;
    var t = a.currentTime + (when || 0);
    var len = Math.floor(a.sampleRate * dur);
    var buf = a.createBuffer(1, len, a.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    var src = a.createBufferSource(); src.buffer = buf;
    var f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 0.8;
    var g = a.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(a.destination); src.start(t);
  }
  function chime(when) {
    var a = audio(); if (!a) return;
    var t = a.currentTime + (when || 0);
    [880, 1320].forEach(function (hz, i) {
      var o = a.createOscillator(); o.type = "sine"; o.frequency.value = hz;
      var g = a.createGain(); g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.06 / (i + 1), t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
      o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 1.3);
    });
  }
  window.NavaSound = {
    shuffle: function () { if (!soundOn) return; for (var i = 0; i < 9; i++) noise(0.08, 2500 + Math.random() * 1500, 0.25, i * 0.11); },
    pick: function () { if (soundOn) noise(0.12, 1800, 0.3); },
    flip: function () { if (!soundOn) return; noise(0.22, 1200, 0.35); chime(0.35); }
  };
  function paintSound(btn) {
    btn.setAttribute("aria-pressed", soundOn ? "true" : "false");
    btn.setAttribute("aria-label", soundOn ? "ปิดเสียง" : "เปิดเสียง");
    btn.title = soundOn ? "ปิดเสียง" : "เปิดเสียง";
    btn.querySelector(".on").style.display = soundOn ? "" : "none";
    btn.querySelector(".off").style.display = soundOn ? "none" : "";
  }
  document.querySelectorAll("[data-sound-toggle]").forEach(function (btn) {
    paintSound(btn);
    btn.addEventListener("click", function () {
      soundOn = !soundOn; store.set("nava.sound", soundOn ? "on" : "off"); paintSound(btn);
      if (soundOn) { audio(); chime(0); }
    });
  });

  /* ---------- คุกกี้ + Google Analytics (โหลดหลังได้รับความยินยอมเท่านั้น) ---------- */
  function loadGA() {
    if (!CFG.gaId || window.__gaLoaded) return;
    window.__gaLoaded = true;
    var s = document.createElement("script");
    s.async = true; s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(CFG.gaId);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", CFG.gaId, { anonymize_ip: true });
  }
  window.navaTrack = function (name, params) {
    if (window.gtag && window.__gaLoaded) window.gtag("event", name, params || {});
  };
  var consent = store.get("nava.consent");
  if (consent === "yes") loadGA();
  if (CFG.gaId && !consent) {
    var box = document.createElement("div");
    box.className = "cookie"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "การใช้คุกกี้");
    box.innerHTML = '<p>เว็บนี้ใช้คุกกี้เพื่อวัดสถิติการใช้งานและปรับปรุงบริการ คำถามที่คุณพิมพ์จะไม่ถูกส่งออกจากเครื่องของคุณ <a href="' + CFG.base + 'privacy/">อ่านนโยบายความเป็นส่วนตัว</a></p>' +
      '<div class="row"><button class="btn ghost" data-c="no">ไม่ยินยอม</button><button class="btn" data-c="yes">ยินยอม</button></div>';
    document.body.appendChild(box);
    box.addEventListener("click", function (e) {
      var v = e.target.getAttribute && e.target.getAttribute("data-c");
      if (!v) return;
      store.set("nava.consent", v); box.remove();
      if (v === "yes") loadGA();
    });
  }
  if (CFG.adsEnabled) document.documentElement.classList.add("ads-on");
})();
