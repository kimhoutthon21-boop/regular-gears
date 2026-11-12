/*!
 * Curved Loop text marquee — ported to plain JavaScript for Regular Gears.
 * Original: React Bits "Curved Loop" by David Haz — https://reactbits.dev/text-animations/curved-loop
 * Source:   https://github.com/DavidHDev/react-bits (src/content/TextAnimations/CurvedLoop)
 * License:  MIT + Commons Clause (c) 2026 David Haz
 *
 * The geometry, edge mask, outline mask, scroll boost and drag/fling maths are the original
 * code. Only the React wrapper was replaced by CurvedLoop.create(container, options), and
 * `marqueeText` may also be an array: each item is followed by the separator, so several
 * phrases can share one loop ("GASKET MOUNT ✦ OLED DISPLAY ✦ ...").
 *
 * Regular Gears additions for shape "line": the strip is only as tall as the text, and
 * `fixedPx: true` makes fontSize/letterSpacing real CSS pixels on every screen (the original
 * scales them with the page width). `strokeWidth` overrides the outline thickness.
 *
 * Usage:
 *   CurvedLoop.create(element, { marqueeText: ["One", "Two"], shape: "line", outline: true,
 *                                separator: "✦", separatorColor: "#dc143c" });
 */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const VIEW_WIDTH = 1440;
  const VIEW_HEIGHT = 120;
  const MAX_FLING = 4000;
  const WAVE_LENGTH = 960;
  const TAU = Math.PI * 2;
  const NBSP = " ";
  let uid = 0;

  const wrapOffset = (value, length) => (length > 0 ? (((value % length) + length) % length) - length : value);

  const edgeMask = (amount, span) => {
    const size = Math.min(Math.max(amount, 0), 1) * 50 * span;
    if (size <= 0) return "";
    const start = 50 - span * 50;
    const steps = 10;
    const left = [];
    const right = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const alpha = (t * t * t * (t * (t * 6 - 15) + 10)).toFixed(3);
      left.push(`rgba(0, 0, 0, ${alpha}) ${(start + t * size).toFixed(2)}%`);
      right.unshift(`rgba(0, 0, 0, ${alpha}) ${(100 - start - t * size).toFixed(2)}%`);
    }
    return `linear-gradient(to right, ${[...left, ...right].join(", ")})`;
  };

  const wavePath = (amplitude, baseline) => {
    const from = -100;
    const to = VIEW_WIDTH + 100;
    const k = TAU / WAVE_LENGTH;
    const y = (x) => baseline + amplitude * Math.cos(k * (x - VIEW_WIDTH / 2));
    const slope = (x) => -amplitude * k * Math.sin(k * (x - VIEW_WIDTH / 2));
    const count = Math.ceil((to - from) / (WAVE_LENGTH / 8));
    const step = (to - from) / count;
    const f = (n) => n.toFixed(2);
    let d = `M${f(from)},${f(y(from))}`;
    for (let i = 0; i < count; i++) {
      const x0 = from + i * step;
      const x1 = x0 + step;
      d += ` C${f(x0 + step / 3)},${f(y(x0) + (slope(x0) * step) / 3)} ${f(x1 - step / 3)},${f(y(x1) - (slope(x1) * step) / 3)} ${f(x1)},${f(y(x1))}`;
    }
    return d;
  };

  // line / wave / arc (the original's "circle" shape is not needed here)
  const pathFor = (shape, curveAmount, fontSize, viewHeight) => {
    const baseline = viewHeight / 2 + fontSize * 0.36;
    if (shape === "line") return `M-100,${baseline} L${VIEW_WIDTH + 100},${baseline}`;
    if (shape === "wave") return wavePath(curveAmount * 0.25, baseline);
    return `M-100,40 Q500,${40 + curveAmount} 1540,40`;
  };

  const el = (name, attrs = {}, parent) => {
    const node = document.createElementNS(NS, name);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  };

  function create(container, opts = {}) {
    const o = Object.assign(
      {
        marqueeText: "", speed: 2, curveAmount: 400, direction: "left", interactive: true,
        pauseOnHover: false, color: "currentColor", edgeFade: 0, shape: "arc", fontSize: 96,
        fontWeight: 700, letterSpacing: 0, outline: false, separator: "", separatorColor: "",
        scrollBoost: 0, fixedPx: false, strokeWidth: 0,
      },
      opts
    );
    const items = (Array.isArray(o.marqueeText) ? o.marqueeText : [o.marqueeText])
      .map((s) => String(s).replace(/\s+/g, NBSP).toUpperCase());
    const mark = String(o.separator || "").trim();
    // one "unit" of the loop: every item, each followed by the separator
    const segments = items.flatMap((s) => (mark ? [[s + NBSP, false], [mark, true], [NBSP, false]] : [[s + NBSP, false]]));
    const unitText = segments.map((s) => s[0]).join("");
    const accent = Boolean(mark && o.separatorColor);
    const pathId = `curve-loop-${++uid}`;
    const maskId = `${pathId}-outline`;

    // ---- DOM ------------------------------------------------------------------
    container.classList.add("curved-loop-jacket");
    container.style.visibility = "hidden";
    const mask = edgeMask(o.edgeFade, 1);
    container.style.maskImage = mask;
    container.style.webkitMaskImage = mask;
    if (o.interactive) { container.style.cursor = "grab"; container.style.touchAction = "pan-y"; }

    // Regular Gears tweak: on a straight line the strip is only as tall as the text needs
    const viewHeight = o.shape === "line" ? Math.round(o.fontSize * 1.6) : VIEW_HEIGHT;
    const svg = el("svg", { class: "curved-loop-svg", viewBox: `0 0 ${VIEW_WIDTH} ${viewHeight}`, "aria-hidden": "true" });
    svg.style.aspectRatio = `${VIEW_WIDTH} / ${viewHeight}`;
    svg.style.fontSize = `${o.fontSize}px`;
    svg.style.fontWeight = o.fontWeight;
    svg.style.letterSpacing = `${o.letterSpacing}px`;
    container.appendChild(svg);

    const measure = el("text", { "xml:space": "preserve" }, svg);
    measure.style.visibility = "hidden";
    measure.textContent = unitText;
    const defs = el("defs", {}, svg);
    const path = el("path", { id: pathId, d: pathFor(o.shape, o.curveAmount, o.fontSize, viewHeight), fill: "none", stroke: "transparent" }, defs);

    let textPaths = [];
    let spacing = 0;
    let viewW = VIEW_WIDTH;
    const fixed = o.fixedPx && o.shape === "line";

    // Fill a <textPath> with `copies` units; markAttrs styles the separator tspans
    const fillPath = (tp, copies, markAttrs) => {
      tp.textContent = "";
      if (!markAttrs) { tp.textContent = unitText.repeat(copies); return; }
      for (let i = 0; i < copies; i++) {
        for (const [str, isMark] of segments) {
          if (isMark) el("tspan", markAttrs, tp).textContent = str;
          else tp.appendChild(document.createTextNode(str));
        }
      }
    };
    const layer = (parent, attrs, copies, markAttrs) => {
      const text = el("text", Object.assign({ "xml:space": "preserve" }, attrs), parent);
      const tp = el("textPath", { href: `#${pathId}`, "xml:space": "preserve" }, text);
      fillPath(tp, copies, markAttrs);
      return text;
    };

    const build = () => {
      if (fixed) {
        // 1 SVG unit = 1 CSS pixel: the viewBox is as wide as the strip itself
        viewW = Math.max(1, Math.round(container.clientWidth));
        svg.setAttribute("viewBox", `0 0 ${viewW} ${viewHeight}`);
        svg.style.aspectRatio = `${viewW} / ${viewHeight}`;
        const b = viewHeight / 2 + o.fontSize * 0.36;
        path.setAttribute("d", `M-100,${b} L${viewW + 100},${b}`);
      }
      spacing = measure.getComputedTextLength();
      if (!(spacing > 0)) return;
      svg.querySelectorAll("[data-layer]").forEach((n) => n.remove());
      const copies = Math.ceil((path.getTotalLength() || 1800) / spacing) + 2;
      if (o.outline) {
        // hollow letters: a stroke, masked by the solid text so only the outer edge shows
        const m = el("mask", { id: maskId, maskUnits: "userSpaceOnUse", x: -VIEW_WIDTH, y: -VIEW_WIDTH, width: VIEW_WIDTH * 3, height: VIEW_WIDTH * 3, "data-layer": "" }, defs);
        el("rect", { x: -VIEW_WIDTH, y: -VIEW_WIDTH, width: VIEW_WIDTH * 3, height: VIEW_WIDTH * 3, fill: "#fff" }, m);
        layer(m, { fill: "#000" }, copies);
        layer(svg, { fill: "none", stroke: o.color, "stroke-width": o.strokeWidth || o.fontSize * 0.05, "stroke-linejoin": "round", mask: `url(#${maskId})`, "data-layer": "" }, copies, accent ? { stroke: "none" } : null);
        if (accent) layer(svg, { fill: "none", "data-layer": "" }, copies, { fill: o.separatorColor });
      } else {
        layer(svg, { fill: o.color, "data-layer": "" }, copies, accent ? { fill: o.separatorColor } : null);
      }
      textPaths = [...svg.querySelectorAll("textPath")];
      offset = wrapOffset(offset, spacing);
      applyOffset();
      container.style.visibility = "visible";
      start();
    };

    // ---- motion ---------------------------------------------------------------
    let offset = 0;
    let velocity = 0;
    let direction = o.direction;
    let hover = false;
    let frame = 0;
    let last = 0;
    let visible = true;
    const scroll = { distance: 0, level: 0 };
    const drag = { active: false, x: 0, time: 0, scale: 1, velocity: 0 };
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const applyOffset = () => {
      const value = `${offset}px`;
      for (const node of textPaths) node.setAttribute("startOffset", value);
    };

    const tick = (now) => {
      frame = 0;
      if (!visible) return;
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      const rate = dt > 0 ? scroll.distance / dt : 0;
      scroll.distance = 0;
      scroll.level += (rate - scroll.level) * (1 - Math.exp(-dt * (rate > scroll.level ? 10 : 2.4)));
      if (!drag.active) {
        const sign = direction === "right" ? 1 : -1;
        const halted = reduceMotion || (o.pauseOnHover && hover);
        const target = halted ? 0 : sign * o.speed * 60;
        const extra = halted ? 0 : sign * scroll.level * o.scrollBoost * 0.3;
        velocity += (target - velocity) * (1 - Math.exp(-dt * 3));
        const step = (velocity + extra) * dt;
        if (Math.abs(step) > 0.0001) {
          offset = wrapOffset(offset + step, spacing);
          applyOffset();
        }
      }
      frame = requestAnimationFrame(tick);
    };
    const start = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };

    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) { scroll.level = 0; start(); }
    }).observe(container);

    if (o.scrollBoost) {
      let lastY = window.scrollY;
      window.addEventListener("scroll", () => {
        scroll.distance += Math.abs(window.scrollY - lastY);
        lastY = window.scrollY;
      }, { passive: true });
    }

    // ---- drag / fling ---------------------------------------------------------
    if (o.interactive) {
      const endDrag = () => {
        if (!drag.active) return;
        drag.active = false;
        container.style.cursor = "grab";
        const fling = performance.now() - drag.time > 100 ? 0 : Math.max(-MAX_FLING, Math.min(MAX_FLING, drag.velocity));
        velocity = fling;
        if (Math.abs(fling) > 60) direction = fling > 0 ? "right" : "left";
      };
      container.addEventListener("pointerdown", (e) => {
        if (!spacing) return;
        const width = svg.getBoundingClientRect().width || VIEW_WIDTH;
        Object.assign(drag, { active: true, x: e.clientX, time: performance.now(), scale: viewW / width, velocity: 0 });
        velocity = 0;
        container.style.cursor = "grabbing";
        container.setPointerCapture?.(e.pointerId);
      });
      container.addEventListener("pointermove", (e) => {
        if (!drag.active) return;
        const now = performance.now();
        const delta = (e.clientX - drag.x) * drag.scale;
        const dt = Math.max(now - drag.time, 1) / 1000;
        drag.x = e.clientX;
        drag.time = now;
        drag.velocity = drag.velocity * 0.5 + (delta / dt) * 0.5;
        offset = wrapOffset(offset + delta, spacing);
        applyOffset();
      });
      ["pointerup", "pointercancel", "lostpointercapture"].forEach((t) => container.addEventListener(t, endDrag));
      container.addEventListener("pointerenter", () => { hover = true; });
      container.addEventListener("pointerleave", () => { hover = false; endDrag(); });
    }

    // measure once fonts are in (Archivo changes the text width)
    build();
    document.fonts?.ready.then(build);
    if (fixed) {
      let lastW = container.clientWidth;
      let t;
      window.addEventListener("resize", () => {
        if (container.clientWidth === lastW) return;
        lastW = container.clientWidth;
        clearTimeout(t);
        t = setTimeout(build, 150);
      });
    }
  }

  window.CurvedLoop = { create };
})();
