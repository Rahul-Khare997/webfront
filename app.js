/* WebWala — motion & physics layer */
(() => {
  "use strict";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ───────── region & currency ───────── */
  const REGIONS = {
    IN: {
      flag: "🇮🇳", name: "India · INR",
      prices: { from: "₹2,499", starter: "₹2,499", growth: "₹4,999", pro: "₹9,999" },
      note: "No setup fees on annual plans · Cancel anytime · UPI autopay supported",
      pay: "UPI autopay, cards or bank transfer — whatever suits you. Annual plans skip the setup fee.",
    },
    US: {
      flag: "🇺🇸", name: "United States · USD",
      prices: { from: "$149", starter: "$149", growth: "$299", pro: "$599" },
      note: "No setup fees on annual plans · Cancel anytime · All major cards accepted",
      pay: "Card or ACH bank transfer, billed monthly. Annual plans skip the setup fee.",
    },
    CA: {
      flag: "🇨🇦", name: "Canada · CAD",
      prices: { from: "C$199", starter: "C$199", growth: "C$399", pro: "C$799" },
      note: "No setup fees on annual plans · Cancel anytime · All major cards accepted",
      pay: "Card or Interac e-Transfer, billed monthly. Annual plans skip the setup fee.",
    },
  };

  const detectRegion = () => {
    const saved = localStorage.getItem("webfront-region");
    if (saved && REGIONS[saved]) return saved;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (/Calcutta|Kolkata/.test(tz)) return "IN";
    if (/Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Regina|St_Johns|Moncton/.test(tz)) return "CA";
    if (/^America\//.test(tz)) return "US";
    return "IN";
  };

  const regionSelect = document.getElementById("region");
  const regionFlag = document.getElementById("region-flag");

  const applyRegion = (code) => {
    const r = REGIONS[code];
    if (!r) return;
    document.querySelectorAll("[data-money]").forEach((el) => {
      const key = el.dataset.money;
      if (r.prices[key]) el.textContent = r.prices[key];
    });
    document.querySelectorAll("[data-region-name]").forEach((el) => { el.textContent = r.name; });
    document.querySelectorAll("[data-region-note]").forEach((el) => { el.textContent = r.note; });
    document.querySelectorAll("[data-region-pay]").forEach((el) => { el.textContent = r.pay; });
    if (regionFlag) regionFlag.textContent = r.flag;
    if (regionSelect) regionSelect.value = code;
    localStorage.setItem("webfront-region", code);
  };

  applyRegion(detectRegion());
  if (regionSelect) regionSelect.addEventListener("change", () => applyRegion(regionSelect.value));

  /* ───────── custom cursor (lerped follow) ───────── */
  if (finePointer && !reduceMotion) {
    const ring = document.querySelector(".cursor");
    const dot = document.querySelector(".cursor-dot");
    let mx = -100, my = -100, rx = -100, ry = -100;
    addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; });
    const loop = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.querySelectorAll("a, button, .tilt").forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("cursor--hover"));
      el.addEventListener("mouseleave", () => ring.classList.remove("cursor--hover"));
    });
  }

  /* ───────── scroll progress + nav state ───────── */
  const progress = document.querySelector(".scroll-progress");
  const nav = document.getElementById("nav");
  addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${(scrollY / max) * 100}%`;
    nav.classList.toggle("nav--scrolled", scrollY > 40);
  }, { passive: true });

  /* ───────── reveal on scroll ───────── */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("reveal--visible");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ───────── animated counters ───────── */
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      counterIO.unobserve(el);
      const target = +el.dataset.count;
      const dur = 1400;
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(target * eased).toLocaleString("en-IN");
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll("[data-count]").forEach((el) => counterIO.observe(el));

  /* ───────── magnetic buttons ───────── */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".btn--magnetic").forEach((btn) => {
      const strength = 22;
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        const y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        btn.style.transform = `translate(${x * strength}px, ${y * strength * 0.6}px)`;
      });
      btn.addEventListener("mouseleave", () => { btn.style.transform = ""; });
    });
  }

  /* ───────── 3D tilt cards ───────── */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".tilt").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg)`;
        card.style.transition = "transform 80ms linear";
      });
      card.addEventListener("mouseleave", () => {
        card.style.transition = "transform 600ms cubic-bezier(0.16, 1, 0.3, 1)";
        card.style.transform = "perspective(900px) rotateY(0) rotateX(0)";
      });
    });
  }

  /* ───────── hero particle field (mouse-reactive physics) ───────── */
  const heroCanvas = document.getElementById("hero-canvas");
  if (heroCanvas && !reduceMotion) {
    const ctx = heroCanvas.getContext("2d");
    let W, H, particles = [];
    const mouse = { x: -9999, y: -9999 };
    const DPR = Math.min(devicePixelRatio || 1, 2);

    const resize = () => {
      W = heroCanvas.offsetWidth; H = heroCanvas.offsetHeight;
      heroCanvas.width = W * DPR; heroCanvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const count = Math.min(Math.floor((W * H) / 16000), 110);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6,
      }));
    };
    resize();
    addEventListener("resize", resize);
    heroCanvas.parentElement.addEventListener("mousemove", (e) => {
      const r = heroCanvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    heroCanvas.parentElement.addEventListener("mouseleave", () => { mouse.x = mouse.y = -9999; });

    const LINK = 110;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        // mouse repulsion physics
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 140 * 140) {
          const d = Math.sqrt(d2) || 1;
          const f = (140 - d) / 140 * 0.6;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }
        p.vx *= 0.98; p.vy *= 0.98;               // drag
        p.vx += (Math.random() - 0.5) * 0.012;     // drift
        p.vy += (Math.random() - 0.5) * 0.012;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        p.x = Math.max(0, Math.min(W, p.x));
        p.y = Math.max(0, Math.min(H, p.y));
      }
      // links
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            const alpha = (1 - Math.sqrt(d2) / LINK) * 0.22;
            ctx.strokeStyle = `rgba(255, 158, 44, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      // dots
      for (const p of particles) {
        ctx.fillStyle = "rgba(255, 190, 120, 0.7)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(draw);
    };
    draw();
  }

  /* ───────── CTA canvas: floating physics orbs ───────── */
  const ctaCanvas = document.getElementById("cta-canvas");
  if (ctaCanvas && !reduceMotion) {
    const ctx = ctaCanvas.getContext("2d");
    let W, H, orbs = [];
    const DPR = Math.min(devicePixelRatio || 1, 2);
    const COLORS = ["255, 158, 44", "255, 92, 57", "126, 240, 192"];

    const resize = () => {
      W = ctaCanvas.offsetWidth; H = ctaCanvas.offsetHeight;
      ctaCanvas.width = W * DPR; ctaCanvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      orbs = Array.from({ length: 14 }, (_, i) => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 26 + 10,
        c: COLORS[i % COLORS.length],
      }));
    };
    resize();
    addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const o of orbs) {
        o.x += o.vx; o.y += o.vy;
        // soft elastic bounce
        if (o.x < -o.r) o.x = W + o.r;
        if (o.x > W + o.r) o.x = -o.r;
        if (o.y < o.r || o.y > H - o.r) o.vy *= -1;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, `rgba(${o.c}, 0.16)`);
        g.addColorStop(1, `rgba(${o.c}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(draw);
    };
    draw();
  }
})();
