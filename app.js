/* ═══════════════════ Webfront — motion & region layer ═══════════════════ */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FINE = window.matchMedia("(pointer: fine)").matches;

  /* ─────────────── Region & currency ─────────────── */
  var REGIONS = {
    IN: {
      flag: "🇮🇳",
      name: "India · INR",
      prices: { from: "₹2,499", starter: "₹2,499", growth: "₹4,999", pro: "₹9,999" },
      note: "No setup fees on annual plans · Cancel anytime · UPI autopay supported",
      pay: "UPI autopay, cards or bank transfer — whatever suits you. Annual plans skip the setup fee."
    },
    US: {
      flag: "🇺🇸",
      name: "United States · USD",
      prices: { from: "$149", starter: "$149", growth: "$299", pro: "$599" },
      note: "No setup fees on annual plans · Cancel anytime · All major cards accepted",
      pay: "Card or ACH bank transfer, billed monthly. Annual plans skip the setup fee."
    },
    CA: {
      flag: "🇨🇦",
      name: "Canada · CAD",
      prices: { from: "C$199", starter: "C$199", growth: "C$399", pro: "C$799" },
      note: "No setup fees on annual plans · Cancel anytime · All major cards accepted",
      pay: "Card or Interac e-Transfer, billed monthly. Annual plans skip the setup fee."
    }
  };

  var STORAGE_KEY = "webfront-region";

  function detectRegion() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (/Calcutta|Kolkata/i.test(tz)) return "IN";
      if (/Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Regina|St_Johns|Moncton/i.test(tz)) return "CA";
      if (/^America\//.test(tz)) return "US";
    } catch (e) {}
    return "IN";
  }

  function applyRegion(code) {
    var r = REGIONS[code];
    if (!r) { code = "IN"; r = REGIONS.IN; }

    document.querySelectorAll("[data-money]").forEach(function (el) {
      var key = el.getAttribute("data-money");
      if (r.prices[key]) el.textContent = r.prices[key];
    });
    document.querySelectorAll("[data-region-name]").forEach(function (el) {
      el.textContent = r.name;
    });
    document.querySelectorAll("[data-region-note]").forEach(function (el) {
      el.textContent = r.note;
    });
    document.querySelectorAll("[data-region-pay]").forEach(function (el) {
      el.textContent = r.pay;
    });
    var flag = document.getElementById("region-flag");
    if (flag) flag.textContent = r.flag;
    var sel = document.getElementById("region");
    if (sel) sel.value = code;
  }

  function initRegion() {
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    var code = (saved && REGIONS[saved]) ? saved : detectRegion();
    applyRegion(code);

    var sel = document.getElementById("region");
    if (sel) {
      sel.addEventListener("change", function () {
        applyRegion(sel.value);
        try { localStorage.setItem(STORAGE_KEY, sel.value); } catch (e) {}
      });
    }
  }

  /* ─────────────── Reveal on scroll ─────────────── */
  function initReveals() {
    var els = document.querySelectorAll(".reveal");
    if (REDUCED || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          // stagger siblings sharing a parent statement
          var sibs = el.parentElement ? el.parentElement.querySelectorAll(":scope > .reveal") : [el];
          var idx = Array.prototype.indexOf.call(sibs, el);
          el.style.transitionDelay = (idx > 0 ? Math.min(idx, 6) * 0.08 : 0) + "s";
          el.classList.add("is-in");
          io.unobserve(el);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ─────────────── Scroll-spy rail ─────────────── */
  function initScrollSpy() {
    var chapters = document.querySelectorAll(".chapter");
    var links = {};
    document.querySelectorAll(".rail a").forEach(function (a) {
      links[a.getAttribute("data-rail")] = a;
    });
    if (!("IntersectionObserver" in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.getAttribute("data-chapter");
          Object.keys(links).forEach(function (k) {
            links[k].classList.toggle("is-active", k === id);
          });
        }
      });
    }, { threshold: 0.01, rootMargin: "-45% 0px -45% 0px" });
    chapters.forEach(function (c) { io.observe(c); });
  }

  /* ─────────────── Scroll progress line ─────────────── */
  function initProgress() {
    var bar = document.getElementById("progress");
    if (!bar) return;
    var raf = null;
    function update() {
      raf = null;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? (window.scrollY / h) : 0;
      bar.style.width = (p * 100).toFixed(2) + "%";
    }
    window.addEventListener("scroll", function () {
      if (raf === null) raf = requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* ─────────────── Works hover frame ─────────────── */
  var TINTS = {
    rose:   ["rgba(255,120,140,0.10)", "rgba(255,120,140,0.03)"],
    amber:  ["rgba(255,176,90,0.10)",  "rgba(255,176,90,0.03)"],
    mint:   ["rgba(120,220,180,0.10)", "rgba(120,220,180,0.03)"],
    violet: ["rgba(170,140,255,0.10)", "rgba(170,140,255,0.03)"],
    blush:  ["rgba(255,150,190,0.10)", "rgba(255,150,190,0.03)"],
    gold:   ["rgba(230,200,120,0.10)", "rgba(230,200,120,0.03)"]
  };

  function initWorksFrame() {
    if (!FINE) return;
    var frame = document.getElementById("frame");
    var mock = document.getElementById("frameMock");
    var ghost = document.getElementById("frameGhost");
    var rows = document.querySelectorAll(".index__row");
    if (!frame || !rows.length) return;

    rows.forEach(function (row) {
      row.addEventListener("mouseenter", function () {
        var tint = TINTS[row.getAttribute("data-tint")] || TINTS.rose;
        mock.style.setProperty("--tint-a", tint[0]);
        mock.style.setProperty("--tint-b", tint[1]);
        var ghostText = document.createElement("span");
        ghostText.textContent = row.getAttribute("data-ghost") || "";
        ghost.textContent = ghostText.textContent;
        frame.classList.add("is-on");
      });
      row.addEventListener("mouseleave", function () {
        frame.classList.remove("is-on");
      });
    });
  }

  /* ─────────────── Particle canvas (hero) ─────────────── */
  function particleField(canvas, opts) {
    if (REDUCED || !canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    opts = opts || {};
    var COUNT = opts.count || 70;
    var LINK = opts.link !== false;
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    var parts = [];
    var mouse = { x: -9999, y: -9999 };
    var raf = null, visible = true;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * DPR);
      canvas.height = Math.round(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function seed() {
      parts = [];
      for (var i = 0; i < COUNT; i++) {
        parts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25
        });
      }
    }

    function step() {
      raf = null;
      if (!visible) return;
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        // mouse repulsion
        var dx = p.x - mouse.x, dy = p.y - mouse.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 12000 && d2 > 0.1) {
          var f = (12000 - d2) / 12000 * 0.6;
          var d = Math.sqrt(d2);
          p.vx += (dx / d) * f * 0.08;
          p.vy += (dy / d) * f * 0.08;
        }
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.99; p.vy *= 0.99;

        if (p.x < 0) p.x += w; else if (p.x > w) p.x -= w;
        if (p.y < 0) p.y += h; else if (p.y > h) p.y -= h;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.1, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(242,239,232,0.55)";
        ctx.fill();
      }

      if (LINK) {
        for (var a = 0; a < parts.length; a++) {
          for (var b = a + 1; b < parts.length; b++) {
            var lx = parts[a].x - parts[b].x;
            var ly = parts[a].y - parts[b].y;
            var ld2 = lx * lx + ly * ly;
            if (ld2 < 13000) {
              var alpha = (1 - ld2 / 13000) * 0.16;
              ctx.beginPath();
              ctx.moveTo(parts[a].x, parts[a].y);
              ctx.lineTo(parts[b].x, parts[b].y);
              ctx.strokeStyle = "rgba(242,239,232," + alpha.toFixed(3) + ")";
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }
      }
      raf = requestAnimationFrame(step);
    }

    function start() { if (raf === null) raf = requestAnimationFrame(step); }

    resize();
    seed();
    start();

    window.addEventListener("resize", function () { resize(); seed(); });
    canvas.addEventListener("mousemove", function (e) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    canvas.addEventListener("mouseleave", function () { mouse.x = -9999; mouse.y = -9999; });

    // pause when off-screen
    if ("IntersectionObserver" in window) {
      var vio = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start();
      }, { threshold: 0 });
      vio.observe(canvas);
    }
  }

  /* ─────────────── Loader ─────────────── */
  function runLoader(done) {
    var loader = document.getElementById("loader");
    if (REDUCED || !loader) {
      if (loader) loader.parentNode.removeChild(loader);
      document.body.classList.remove("loading");
      done();
      return;
    }

    document.body.classList.add("loading");

    // dotted arc draw
    var canvas = document.getElementById("loaderCanvas");
    var ctx = canvas ? canvas.getContext("2d") : null;
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var size = 180;
    if (ctx) {
      canvas.width = size * DPR; canvas.height = size * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    var angle = 0, arcRaf = null;
    function drawArc() {
      if (!ctx) return;
      ctx.clearRect(0, 0, size, size);
      var cx = size / 2, cy = size / 2, R = 70;
      ctx.setLineDash([2, 8]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(242,239,232,0.35)";
      ctx.beginPath();
      ctx.arc(cx, cy, R, angle, angle + Math.PI * 1.5);
      ctx.stroke();
      // accent tick
      ctx.setLineDash([]);
      ctx.strokeStyle = "#ff9e2c";
      ctx.beginPath();
      ctx.arc(cx, cy, R, angle, angle + 0.3);
      ctx.stroke();
      angle += 0.05;
      arcRaf = requestAnimationFrame(drawArc);
    }
    drawArc();

    // typing effect
    var typeEl = document.getElementById("loaderType");
    var msg = "architecting webfronts for main-street business.";
    var i = 0;
    function type() {
      if (!typeEl) return;
      if (i <= msg.length) {
        typeEl.textContent = msg.slice(0, i);
        i++;
        setTimeout(type, 26);
      } else {
        loader.classList.add("is-typed");
      }
    }
    setTimeout(type, 220);

    // finish
    setTimeout(function () {
      loader.classList.add("is-done");
      document.body.classList.remove("loading");
      done();
      setTimeout(function () {
        if (arcRaf) cancelAnimationFrame(arcRaf);
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      }, 900);
    }, 1800);
  }

  /* ─────────────── Boot ─────────────── */
  function boot() {
    initRegion();
    initReveals();
    initScrollSpy();
    initProgress();
    initWorksFrame();
    particleField(document.getElementById("heroCanvas"), { count: 70, link: true });
    particleField(document.getElementById("contactCanvas"), { count: 40, link: true });
  }

  document.addEventListener("DOMContentLoaded", function () {
    runLoader(boot);
  });
})();
