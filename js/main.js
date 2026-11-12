/* ==========================================================================
   REGULAR GEARS — APP LOGIC
   Reads STORE, CATEGORIES and PRODUCTS from js/products.js.
   You normally never need to edit this file to update products.
   ========================================================================== */
(() => {
  "use strict";

  document.documentElement.classList.add("js");

  /* ---------- Helpers ---------------------------------------------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  const escapeHTML = (str = "") =>
    String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const money = (n) => {
    const v = Number(n);
    return STORE.currency + (Number.isInteger(v) ? v : v.toFixed(2));
  };
  // A product without a price (price: null in products.js) shows "Ask for price"
  const hasPrice = (p) => typeof p.price === "number" && Number.isFinite(p.price) && p.price > 0;
  const priceLabel = (p) => (hasPrice(p) ? money(p.price) : "Ask for price");

  const categoryName = (id) => (CATEGORIES.find((c) => c.id === id) || {}).name || id;
  const productById = (id) => PRODUCTS.find((p) => p.id === id);
  const icon = (name) => `<svg aria-hidden="true"><use href="#${name}"/></svg>`;

  const telegramUrl = (text) =>
    `https://t.me/${encodeURIComponent(STORE.telegram)}` + (text ? `?text=${encodeURIComponent(text)}` : "");
  const messengerUrl = (text) =>
    `https://m.me/${encodeURIComponent(STORE.facebook)}` + (text ? `?text=${encodeURIComponent(text)}` : "");

  const isTypingTarget = (el) =>
    el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(() => legacyCopy(text));
    }
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (_) { /* ignore */ }
    ta.remove();
  }

  let toastTimer;
  function toast(message) {
    const el = $("#toast");
    $("span", el).textContent = message;
    el.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-show"), 3200);
  }

  let lockCount = 0;
  const lockScroll = (on) => {
    lockCount = Math.max(0, lockCount + (on ? 1 : -1));
    document.body.classList.toggle("is-locked", lockCount > 0);
  };

  /* ---------- Store info & contact links --------------------------------- */
  function initStoreInfo() {
    const greeting = "Hi Regular Gears! 👋 I have a question about your products.";

    $$("[data-link]").forEach((a) => {
      const withGreeting = a.hasAttribute("data-greeting");
      a.href = a.dataset.link === "facebook"
        ? messengerUrl(withGreeting ? greeting : "")
        : telegramUrl(withGreeting ? greeting : "");
    });
    $$("[data-handle]").forEach((el) => {
      el.textContent = el.dataset.handle === "facebook" ? (STORE.facebookLabel || `m.me/${STORE.facebook}`) : `@${STORE.telegram}`;
    });
    $$("[data-store]").forEach((el) => {
      const v = STORE[el.dataset.store];
      if (v) el.textContent = v;
    });
    $$("[data-social]").forEach((a) => {
      const url = STORE.socials[a.dataset.social];
      if (url) a.href = url;
      else a.remove();
    });
    $("#year").textContent = new Date().getFullYear();
  }

  /* ---------- Navigation -------------------------------------------------- */
  function initNav() {
    const nav = $("#nav");
    const toggle = $(".menu-toggle");
    const menu = $("#mobile-menu");
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle("is-scrolled", y > 10);
      if (!nav.classList.contains("is-open")) {
        const goingDown = y > lastY && y > 420;
        nav.classList.toggle("is-hidden", goingDown);
      }
      lastY = y;
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
    onScroll();

    // Reveal nav when keyboard users tab into it
    nav.addEventListener("focusin", () => nav.classList.remove("is-hidden"));

    const setMenu = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.hidden = !open;
      nav.classList.toggle("is-open", open);
      lockScroll(open);
    };
    toggle.addEventListener("click", () => setMenu(menu.hidden));
    $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !menu.hidden) { setMenu(false); toggle.focus(); }
    });
    window.matchMedia("(min-width: 901px)").addEventListener("change", (e) => {
      if (e.matches && !menu.hidden) setMenu(false);
    });

    // Scroll-spy: highlight the link of the section in view
    const links = $$(".nav__links a");
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === `#${entry.target.id}`));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["top", "categories", "shop", "why", "about", "contact"].forEach((id) => {
      const s = document.getElementById(id);
      if (s) spy.observe(s);
    });
  }

  /* ---------- Hero: interactive keyboard ---------------------------------- */
  // [legend, event.code, width in quarter-units (4 = 1u), variant]
  const KB_LAYOUT = [
    [["Esc", "Escape", 4, "accent"], ...Array.from({ length: 12 }, (_, i) => [`F${i + 1}`, `F${i + 1}`]),
      ["Prt", "PrintScreen", 4, "mod"], ["Del", "Delete", 4, "mod"], ["", "Knob", 4, "knob"]],
    [["`", "Backquote"], ..."1234567890".split("").map((d) => [d, `Digit${d}`]), ["-", "Minus"], ["=", "Equal"],
      ["Back", "Backspace", 8, "mod"], ["Home", "Home", 4, "mod"]],
    [["Tab", "Tab", 6, "mod"], ..."QWERTYUIOP".split("").map((k) => [k, `Key${k}`]), ["[", "BracketLeft"],
      ["]", "BracketRight"], ["\\", "Backslash", 6, "mod"], ["PgUp", "PageUp", 4, "mod"]],
    [["Caps", "CapsLock", 7, "mod"], ..."ASDFGHJKL".split("").map((k) => [k, `Key${k}`]), [";", "Semicolon"],
      ["'", "Quote"], ["Enter", "Enter", 9, "accent"], ["PgDn", "PageDown", 4, "mod"]],
    [["Shift", "ShiftLeft", 9, "mod"], ..."ZXCVBNM".split("").map((k) => [k, `Key${k}`]), [",", "Comma"],
      [".", "Period"], ["/", "Slash"], ["Shift", "ShiftRight", 7, "mod"], ["↑", "ArrowUp"], ["End", "End", 4, "mod"]],
    [["Ctrl", "ControlLeft", 5, "mod"], ["Win", "MetaLeft", 5, "mod"], ["Alt", "AltLeft", 5, "mod"],
      ["", "Space", 25, "accent"], ["Alt", "AltRight", 4, "mod"], ["Fn", "Fn", 4, "mod"], ["Ctrl", "ControlRight", 4, "mod"],
      ["←", "ArrowLeft"], ["↓", "ArrowDown"], ["→", "ArrowRight"]],
  ];

  function initHeroKeyboard() {
    const kb = $("#hero-kb");
    const typedEl = $("#typed");
    if (!kb) return;
    const placeholder = typedEl.textContent;
    const keyByCode = new Map();
    let knobEl = null;

    const frag = document.createDocumentFragment();
    KB_LAYOUT.forEach((row, r) => {
      row.forEach(([legend, code, w = 4, variant]) => {
        const key = document.createElement("div");
        key.className = `kb__key${r === 0 ? " kb__key--row0" : ""}${variant && variant !== "knob" ? ` kb__key--${variant}` : ""}`;
        key.style.setProperty("--w", w);
        if (variant === "knob") {
          knobEl = document.createElement("div");
          knobEl.className = "kb__knob";
          key.appendChild(knobEl);
        } else {
          const cap = document.createElement("div");
          cap.className = "kb__cap";
          cap.textContent = legend;
          cap.dataset.code = code;
          key.appendChild(cap);
          keyByCode.set(code, key);
        }
        frag.appendChild(key);
      });
    });
    kb.appendChild(frag);

    // Modifier keys get a slightly lighter tone
    const style = document.createElement("style");
    style.textContent = ".kb__key--mod .kb__cap{--top:#38383e;--side:#222226;--legend:#9a9aa0}";
    document.head.appendChild(style);

    let buffer = "";
    const MAX = 26;
    const renderTyped = () => {
      if (!buffer) {
        typedEl.textContent = placeholder;
        typedEl.classList.add("is-placeholder");
      } else {
        typedEl.textContent = buffer.slice(-MAX);
        typedEl.classList.remove("is-placeholder");
      }
    };
    renderTyped();

    const press = (code, char) => {
      const key = keyByCode.get(code);
      if (key) {
        key.classList.add("is-down", "is-lit");
        clearTimeout(key._t);
        key._t = setTimeout(() => key.classList.remove("is-lit"), 260);
      }
      if (code === "Backspace") buffer = buffer.slice(0, -1);
      else if (code === "Enter" || code === "Escape") buffer = "";
      else if (char && char.length === 1) buffer = (buffer + char).slice(-60);
      renderTyped();
    };
    const release = (code) => {
      const key = keyByCode.get(code);
      if (key) key.classList.remove("is-down");
    };

    // Only react while the hero is on screen
    let heroVisible = true;
    let heroMostlyVisible = true;
    new IntersectionObserver(([e]) => {
      heroVisible = e.isIntersecting;
      heroMostlyVisible = e.intersectionRatio > 0.35;
    }, { threshold: [0, 0.35, 1] }).observe(kb);

    document.addEventListener("keydown", (e) => {
      if (!heroVisible || e.ctrlKey || e.metaKey || isTypingTarget(e.target) || overlayOpen()) return;
      // Stop Space from scrolling the page while someone is playing with the keyboard
      if (e.code === "Space" && heroMostlyVisible && (e.target === document.body || e.target === document.documentElement)) {
        e.preventDefault();
      }
      press(e.code, e.key);
    });
    document.addEventListener("keyup", (e) => release(e.code));
    window.addEventListener("blur", () => keyByCode.forEach((k) => k.classList.remove("is-down")));

    // Click / tap keys directly
    kb.addEventListener("pointerdown", (e) => {
      const cap = e.target.closest(".kb__cap");
      if (!cap) return;
      const code = cap.dataset.code;
      let char = "";
      if (code === "Space") char = " ";
      else if (/^(Key|Digit)/.test(code)) char = cap.textContent.toLowerCase();
      else if (cap.textContent.length === 1 && !/[←↑→↓]/.test(cap.textContent)) char = cap.textContent;
      press(code, char);
      const up = () => { release(code); window.removeEventListener("pointerup", up); };
      window.addEventListener("pointerup", up);
    });

    // Knob turns as the page scrolls
    if (knobEl && !reduceMotion) {
      window.addEventListener("scroll", () => {
        knobEl.style.transform = `rotate(${(window.scrollY * 0.4) % 360}deg)`;
      }, { passive: true });
    }

    // Gentle 3D parallax following the cursor
    if (finePointer && !reduceMotion) {
      const hero = $(".hero");
      const baseRx = () => parseFloat(getComputedStyle(kb).getPropertyValue("--rx")) || 34;
      let rx0 = baseRx();
      hero.addEventListener("pointermove", (e) => {
        const r = hero.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        kb.style.transform = `rotateX(${rx0 - y * 8}deg) rotateY(${x * 10}deg)`;
      });
      hero.addEventListener("pointerleave", () => { kb.style.transform = ""; });
      window.addEventListener("resize", () => { kb.style.transform = ""; rx0 = baseRx(); });
    }
  }

  /* ---------- Categories -------------------------------------------------- */
  function initCategories() {
    const grid = $("#cat-grid");
    grid.innerHTML = CATEGORIES.map((c, i) => {
      const count = PRODUCTS.filter((p) => p.category === c.id).length;
      return `
        <button class="cat spot reveal${i === 0 ? " cat--hero" : ""}" type="button" data-category="${escapeHTML(c.id)}"
                aria-label="Shop ${escapeHTML(c.name)} (${count} products)">
          <span class="cat__top">
            <span>
              <span class="cat__count">${count ? `${String(count).padStart(2, "0")} product${count === 1 ? "" : "s"}` : "On request · ask us"}</span>
              <span class="cat__name" style="display:block">${escapeHTML(c.name)}</span>
              <span class="cat__blurb" style="display:block">${escapeHTML(c.blurb)}</span>
            </span>
            <span class="cat__arrow">${icon("i-arrow-ne")}</span>
          </span>
          <img class="cat__img" src="${escapeHTML(c.image)}" alt="" loading="lazy" />
        </button>`;
    }).join("");

    grid.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-category]");
      if (!btn) return;
      shop.setCategory(btn.dataset.category);
      shop.scrollIntoView();
    });
  }

  /* ---------- Shop: shelves per category, filter, search, sort ----------- */
  const searchText = (p) =>
    [p.name, p.tagline, p.description, categoryName(p.category), p.category, ...(p.specs || [])].join(" ").toLowerCase();

  const matches = (p, query) => {
    const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return true;
    const hay = searchText(p);
    return tokens.every((t) => hay.includes(t));
  };

  const shop = (() => {
    const state = { category: "all", query: "", sort: "featured" };
    const wall = $("#shelves");
    const chips = $("#chips");
    const input = $("#shop-search");
    const sortEl = $("#sort");
    const countEl = $("#result-count");
    const empty = $("#empty");
    const narrow = window.matchMedia("(max-width: 600px)");
    const perRow = () => (narrow.matches ? 2 : 4);

    function renderChips() {
      const all = [{ id: "all", name: "All" }, ...CATEGORIES];
      chips.innerHTML = all.map((c) => {
        const n = c.id === "all" ? PRODUCTS.length : PRODUCTS.filter((p) => p.category === c.id).length;
        const sel = state.category === c.id;
        return `<button class="chip" type="button" role="tab" aria-selected="${sel}" data-chip="${escapeHTML(c.id)}">${escapeHTML(c.name)}<span>${n}</span></button>`;
      }).join("");
    }

    function sorted(list) {
      const out = [...list];
      switch (state.sort) {
        // products without a price always go last
        case "price-asc": return out.sort((a, b) => (hasPrice(a) ? a.price : Infinity) - (hasPrice(b) ? b.price : Infinity));
        case "price-desc": return out.sort((a, b) => (hasPrice(b) ? b.price : -Infinity) - (hasPrice(a) ? a.price : -Infinity));
        case "name": return out.sort((a, b) => a.name.localeCompare(b.name));
        default: // featured first, in-stock before sold-out, otherwise file order
          return out.sort((a, b) => (b.inStock - a.inStock) || (b.featured - a.featured));
      }
    }

    // The product standing on the shelf
    function slotHTML(p, i) {
      const out = !p.inStock;
      return `
        <div class="shelf__slot${out ? " is-out" : ""}" id="product-${escapeHTML(p.id)}" style="--i:${i}">
          <button class="shelf__product" type="button" data-open="${escapeHTML(p.id)}"
                  aria-label="${escapeHTML(p.name)}, ${priceLabel(p)}${out ? ", sold out" : ""}. View and order">
            <img src="${escapeHTML(p.image)}" alt="" loading="lazy" draggable="false" />
          </button>
        </div>`;
    }

    // The price tag clipped to the shelf edge underneath it
    function tagHTML(p) {
      const out = !p.inStock;
      const sale = p.badge && /sale/i.test(p.badge);
      const badge = out ? "" : p.badge ? `<span class="tag__badge${sale ? " is-sale" : ""}">${escapeHTML(p.badge)}</span>` : "";
      return `
        <button class="tag${out ? " is-out" : ""}" type="button" data-open="${escapeHTML(p.id)}" tabindex="-1" aria-hidden="true">
          ${badge}
          <span class="tag__name">${escapeHTML(p.name)}</span>
          <span class="tag__price">${out ? "Sold out" : priceLabel(p)}${!out && hasPrice(p) && p.oldPrice ? ` <s>${money(p.oldPrice)}</s>` : ""}</span>
        </button>`;
    }

    function shelfHTML(cat, items, index, span) {
      const per = perRow();
      const rows = [];
      for (let i = 0; i < items.length; i += per) rows.push(items.slice(i, i + per));
      const cols = Math.min(items.length, per);
      let n = 0;
      return `
        <section class="shelf" data-cat="${escapeHTML(cat.id)}" style="--span:${span};--s:${index}" aria-labelledby="shelf-${escapeHTML(cat.id)}">
          <header class="shelf__head">
            <h3 id="shelf-${escapeHTML(cat.id)}">${escapeHTML(cat.name)}</h3>
            <span class="shelf__count">${String(items.length).padStart(2, "0")}</span>
            ${cat.blurb ? `<p>${escapeHTML(cat.blurb)}</p>` : ""}
          </header>
          ${rows.map((row) => `
            <div class="shelf__row" style="--cols:${cols}">
              <div class="shelf__items">${row.map((p) => slotHTML(p, n++)).join("")}</div>
              <div class="shelf__board" aria-hidden="true"><span></span></div>
              <div class="shelf__tags">${row.map(tagHTML).join("")}</div>
            </div>`).join("")}
        </section>`;
    }

    function render() {
      const list = sorted(PRODUCTS.filter((p) =>
        (state.category === "all" || p.category === state.category) && matches(p, state.query)));

      // One shelf per category (in CATEGORIES order); unknown categories go on a "More gear" shelf
      const known = new Set(CATEGORIES.map((c) => c.id));
      const groups = CATEGORIES.map((c) => [c, list.filter((p) => p.category === c.id)]);
      groups.push([{ id: "other", name: "More gear", blurb: "" }, list.filter((p) => !known.has(p.category))]);
      const visible = groups.filter(([, items]) => items.length);
      // Each shelf takes as many wall columns as it has products (max 4). If a shelf would leave a gap
      // at the end of a row, the shelf before it stretches to fill the row; its products stay centred.
      const COLS = 4;
      const spans = visible.map(([, items]) => Math.min(items.length, COLS));
      let used = 0;
      spans.forEach((span, i) => {
        if (used + span > COLS) { spans[i - 1] += COLS - used; used = 0; }
        used = (used + span) % COLS;
      });
      if (used) spans[spans.length - 1] += COLS - used;
      wall.innerHTML = visible.map(([c, items], i) => shelfHTML(c, items, i, spans[i])).join("");

      empty.hidden = list.length > 0;
      wall.hidden = list.length === 0;

      const scope = state.category === "all" ? "" : ` in ${categoryName(state.category)}`;
      countEl.textContent = state.query
        ? `${list.length} result${list.length === 1 ? "" : "s"} for “${state.query}”${scope}`
        : `${list.length} product${list.length === 1 ? "" : "s"}${scope}`;

      if (!list.length) {
        const cat = state.category === "all" ? "" : categoryName(state.category);
        $("#empty-title").textContent = state.query
          ? `No gear matches “${state.query}”${cat ? ` in ${cat}` : ""}.`
          : `No ${cat.toLowerCase()} in stock right now.`;
        const wanted = state.query || cat;
        $("[data-request]").href = telegramUrl(`Hi Regular Gears! Do you have or can you source: ${wanted}?`);
      }
    }

    function setCategory(id) {
      state.category = CATEGORIES.some((c) => c.id === id) ? id : "all";
      renderChips();
      render();
    }
    function setQuery(q) {
      state.query = q.trim();
      if (input.value !== q) input.value = q;
      render();
    }
    function scrollIntoView() {
      $("#shop").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    }

    // Events
    chips.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-chip]");
      if (chip) setCategory(chip.dataset.chip);
    });
    chips.addEventListener("keydown", (e) => {
      if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
      const all = $$(".chip", chips);
      const idx = all.indexOf(document.activeElement);
      const next = all[(idx + (e.key === "ArrowRight" ? 1 : -1) + all.length) % all.length];
      next.focus();
      next.click();
    });
    let debounce;
    input.addEventListener("input", () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => setQuery(input.value), 120);
    });
    sortEl.addEventListener("change", () => { state.sort = sortEl.value; render(); });

    // Styled sort menu drawn over the native <select>, which stays in sync (and still works without JS)
    (() => {
      const wrap = sortEl.closest(".sort");
      const opts = [...sortEl.options];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sort__btn";
      btn.setAttribute("aria-haspopup", "listbox");
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-controls", "sort-menu");
      btn.innerHTML = '<svg class="sort__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h13M3 12h9M3 18h5M18 8v12m0 0-3-3m3 3 3-3"/></svg>'
        + '<span class="sort__value"></span>'
        + '<svg class="sort__caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>';
      const menu = document.createElement("ul");
      menu.className = "sort__menu";
      menu.id = "sort-menu";
      menu.setAttribute("role", "listbox");
      menu.setAttribute("aria-label", "Sort products");
      menu.tabIndex = -1;
      menu.innerHTML = opts.map((o, i) =>
        `<li class="sort__option" role="option" id="sort-opt-${i}" data-value="${escapeHTML(o.value)}">${escapeHTML(o.text)}</li>`).join("");
      const items = $$(".sort__option", menu);
      wrap.append(btn, menu);
      wrap.classList.add("is-enhanced");
      sortEl.tabIndex = -1;
      sortEl.setAttribute("aria-hidden", "true");

      let active = 0;
      const sync = () => {
        const label = sortEl.options[sortEl.selectedIndex].text;
        $(".sort__value", btn).textContent = label;
        btn.setAttribute("aria-label", `Sort products: ${label}`);
        items.forEach((li) => li.setAttribute("aria-selected", String(li.dataset.value === sortEl.value)));
      };
      const setActive = (i) => {
        active = (i + items.length) % items.length;
        items.forEach((li, j) => li.classList.toggle("is-active", j === active));
        menu.setAttribute("aria-activedescendant", items[active].id);
      };
      const isOpen = () => btn.getAttribute("aria-expanded") === "true";
      const open = () => {
        btn.setAttribute("aria-expanded", "true");
        menu.classList.add("is-open");
        setActive(Math.max(0, sortEl.selectedIndex));
        menu.focus({ preventScroll: true });
      };
      const close = (refocus = true) => {
        if (!isOpen()) return;
        btn.setAttribute("aria-expanded", "false");
        menu.classList.remove("is-open");
        if (refocus) btn.focus({ preventScroll: true });
      };
      const choose = (i) => {
        const v = items[i].dataset.value;
        if (sortEl.value !== v) {
          sortEl.value = v;
          sortEl.dispatchEvent(new Event("change"));
        }
        close();
      };

      btn.addEventListener("click", () => (isOpen() ? close() : open()));
      btn.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); open(); }
      });
      menu.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown") { e.preventDefault(); setActive(active + 1); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setActive(active - 1); }
        else if (e.key === "Home") { e.preventDefault(); setActive(0); }
        else if (e.key === "End") { e.preventDefault(); setActive(items.length - 1); }
        else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(active); }
        else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); }
        else if (e.key === "Tab") close(false);
      });
      items.forEach((li, i) => {
        li.addEventListener("click", () => choose(i));
        li.addEventListener("mousemove", () => { if (active !== i) setActive(i); });
      });
      document.addEventListener("pointerdown", (e) => { if (isOpen() && !wrap.contains(e.target)) close(false); });
      sortEl.addEventListener("change", sync);
      sync();
    })();
    $("#clear-filters").addEventListener("click", () => {
      state.category = "all";
      renderChips();
      setQuery("");
      input.focus();
    });
    wall.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-open]");
      if (!btn) return;
      const id = btn.dataset.open;
      order.open(id, $(`#product-${CSS.escape(id)} .shelf__product`) || btn);
    });
    // Hovering a price tag lifts its product, and the other way round
    const setHover = (id, on) => {
      $$(`[data-open="${CSS.escape(id)}"]`, wall).forEach((el) => el.closest(".shelf__slot, .tag").classList.toggle("is-hover", on));
    };
    wall.addEventListener("pointerover", (e) => { const t = e.target.closest("[data-open]"); if (t) setHover(t.dataset.open, true); });
    wall.addEventListener("pointerout", (e) => { const t = e.target.closest("[data-open]"); if (t) setHover(t.dataset.open, false); });
    narrow.addEventListener("change", render);
    $$("[data-filter]").forEach((a) => a.addEventListener("click", () => setCategory(a.dataset.filter)));

    renderChips();
    render();
    return { setCategory, setQuery, scrollIntoView, state };
  })();

  /* ---------- Search palette (/, Ctrl/⌘ + K) ------------------------------ */
  const palette = (() => {
    const root = $("#palette");
    const input = $("#palette-input");
    const list = $("#palette-results");
    let results = [];
    let active = 0;
    let returnFocus = null;

    const highlight = (text, q) => {
      const safe = escapeHTML(text);
      const tokens = q.trim().split(/\s+/).filter(Boolean).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      if (!tokens.length) return safe;
      return safe.replace(new RegExp(`(${tokens.map(escapeHTML).join("|")})`, "gi"), "<mark>$1</mark>");
    };

    function render() {
      const q = input.value;
      results = PRODUCTS.filter((p) => matches(p, q)).slice(0, 8);
      active = 0;
      if (!results.length) {
        list.innerHTML = `<li class="palette__empty">No gear found for “${escapeHTML(q)}”.<br/>Message us and we'll try to source it.</li>`;
        return;
      }
      list.innerHTML = results.map((p, i) => `
        <li class="palette__item" role="option" id="pal-${i}" aria-selected="${i === active}" data-index="${i}">
          <img src="${escapeHTML(p.image)}" alt="" />
          <span><strong>${highlight(p.name, q)}</strong><small>${escapeHTML(categoryName(p.category))} · ${escapeHTML(p.tagline)}</small></span>
          <span class="palette__price">${p.inStock ? priceLabel(p) : "Sold out"}</span>
        </li>`).join("") + (q.trim()
        ? `<li class="palette__item" role="option" id="pal-${results.length}" aria-selected="false" data-index="${results.length}" data-all>
             <span style="grid-column:1/3;padding-left:8px">See all results for “${escapeHTML(q.trim())}” in the shop</span>
             <span>${icon("i-arrow").replace("<svg", '<svg width="18" height="18"')}</span>
           </li>`
        : "");
      input.setAttribute("aria-activedescendant", "pal-0");
    }

    function setActive(i) {
      const items = $$(".palette__item", list);
      if (!items.length) return;
      active = (i + items.length) % items.length;
      items.forEach((el, n) => el.setAttribute("aria-selected", String(n === active)));
      items[active].scrollIntoView({ block: "nearest" });
      input.setAttribute("aria-activedescendant", `pal-${active}`);
    }

    function choose(i) {
      const item = $$(".palette__item", list)[i];
      if (!item) return;
      const q = input.value;
      close(false);
      if (item.hasAttribute("data-all")) {
        shop.setCategory("all");
        shop.setQuery(q);
        shop.scrollIntoView();
      } else {
        order.open(results[i].id, $(".search-trigger"));
      }
    }

    function open() {
      if (!root.hidden) return;
      returnFocus = document.activeElement;
      root.hidden = false;
      lockScroll(true);
      input.value = "";
      render();
      requestAnimationFrame(() => input.focus());
    }
    function close(restoreFocus = true) {
      if (root.hidden) return;
      root.hidden = true;
      lockScroll(false);
      if (restoreFocus && returnFocus) returnFocus.focus();
    }

    input.addEventListener("input", render);
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(active + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive(active - 1); }
      else if (e.key === "Enter") { e.preventDefault(); choose(active); }
      else if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "Tab") { e.preventDefault(); } // keep focus inside
    });
    list.addEventListener("click", (e) => {
      const item = e.target.closest(".palette__item");
      if (item) choose(Number(item.dataset.index));
    });
    list.addEventListener("pointermove", (e) => {
      const item = e.target.closest(".palette__item");
      if (item && Number(item.dataset.index) !== active) setActive(Number(item.dataset.index));
    });
    $$("[data-close-search]").forEach((el) => el.addEventListener("click", () => close()));
    $$("[data-open-search]").forEach((el) => el.addEventListener("click", open));

    document.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === "k") { e.preventDefault(); root.hidden ? open() : close(); return; }
      if (e.key === "/" && !isTypingTarget(e.target) && !overlayOpen()) { e.preventDefault(); open(); }
    });

    return { open, close, isOpen: () => !root.hidden };
  })();

  /* ---------- Order dialog (product flies in from its shelf) ------------- */
  const order = (() => {
    const dlg = $("#order");
    const tg = $("#order-tg");
    const fb = $("#order-fb");
    const qtyEl = $("#order-qty");
    const img = $("#order-img");
    let product = null;
    let qty = 1;
    let opener = null;
    let shelfImg = null; // the image left on the shelf while its product is "picked up"
    let busy = false;

    const message = () => {
      if (!product.inStock) {
        const was = hasPrice(product) ? ` (${money(product.price)})` : "";
        return `Hi Regular Gears! 👋\nIs the ${product.name}${was} coming back in stock? Please let me know.`;
      }
      return [
        "Hi Regular Gears! 👋 I'd like to order:",
        "",
        hasPrice(product)
          ? `• ${product.name} × ${qty} — ${money(product.price * qty)}`
          : `• ${product.name} × ${qty} (what's the price?)`,
        "",
        "Name:",
        "Phone:",
        "Delivery address:",
      ].join("\n");
    };

    function update() {
      qtyEl.textContent = qty;
      $("#order-total").textContent = hasPrice(product) ? money(product.price * qty) : "Ask us";
      const msg = message();
      tg.href = telegramUrl(msg);
      fb.href = messengerUrl(msg);
    }

    // ----- shared-element flight between the shelf and the dialog -----
    const onScreen = (el) => {
      if (!el || reduceMotion) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
    };
    // The box object-fit actually draws into (border box minus padding)
    const contentBox = (el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      const pl = parseFloat(s.paddingLeft), pr = parseFloat(s.paddingRight);
      const pt = parseFloat(s.paddingTop), pb = parseFloat(s.paddingBottom);
      return { left: r.left + pl, top: r.top + pt, width: r.width - pl - pr, height: r.height - pt - pb, pos: s.objectPosition };
    };
    function fly(fromEl, toEl, duration) {
      const a = contentBox(fromEl);
      const b = contentBox(toEl);
      const clone = document.createElement("img");
      clone.src = fromEl.currentSrc || fromEl.src;
      clone.alt = "";
      clone.className = "fly";
      dlg.appendChild(clone); // the dialog is in the top layer, so the clone has to live inside it
      const frame = (r) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, objectPosition: r.pos });
      const anim = clone.animate([frame(a), frame(b)], {
        duration,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)", // fast out, soft landing, no overshoot
        fill: "forwards",
      });
      return anim.finished.then(() => clone.remove(), () => clone.remove());
    }

    function open(id, from) {
      product = productById(id);
      if (!product || dlg.open) return;
      opener = from || document.activeElement;
      qty = 1;
      img.src = product.image;
      img.alt = product.name;
      $("#order-cat").textContent = categoryName(product.category) + (product.inStock ? "" : " · Sold out");
      $("#order-name").textContent = product.name;
      $("#order-desc").textContent = product.description;
      $("#order-specs").innerHTML = (product.specs || []).map((s) => `<li>${escapeHTML(s)}</li>`).join("");
      $(".qty", dlg).style.display = product.inStock ? "" : "none";
      // the label is the text node after the icon, inside the button's .btn__text
      $(".btn__text", tg).lastChild.textContent = product.inStock ? "Order on Telegram" : "Ask about restock";
      $(".btn__text", fb).lastChild.textContent = product.inStock ? "Order on Messenger" : "Ask on Messenger";
      update();

      const source = $(`#product-${CSS.escape(id)} img`);
      shelfImg = onScreen(source) ? source : null;
      dlg.classList.toggle("is-flying", !!shelfImg);
      dlg.showModal();
      lockScroll(true);
      $(".order__close", dlg).focus();

      if (shelfImg) {
        img.style.visibility = "hidden";
        shelfImg.style.visibility = "hidden"; // leaves an empty spot on the shelf
        fly(shelfImg, img, 560).then(() => { img.style.visibility = ""; });
      }
    }

    async function close() {
      if (!dlg.open || busy) return;
      if (shelfImg && document.contains(shelfImg)) {
        busy = true;
        dlg.classList.add("is-closing");
        img.style.visibility = "hidden";
        await fly(img, shelfImg, 480); // back to the same spot on the shelf
        busy = false;
      }
      dlg.close();
    }

    dlg.addEventListener("close", () => {
      dlg.classList.remove("is-closing", "is-flying");
      img.style.visibility = "";
      if (shelfImg) shelfImg.style.visibility = "";
      shelfImg = null;
      lockScroll(false);
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    });
    dlg.addEventListener("cancel", (e) => { e.preventDefault(); close(); }); // Esc animates back too
    dlg.addEventListener("click", (e) => {
      if (e.target !== dlg) return;
      const r = dlg.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) close();
    });
    $("[data-close-order]", dlg).addEventListener("click", close);
    $$("[data-qty]", dlg).forEach((b) => b.addEventListener("click", () => {
      qty = Math.min(20, Math.max(1, qty + Number(b.dataset.qty)));
      update();
    }));
    [tg, fb].forEach((a) => a.addEventListener("click", () => {
      copyText(message());
      toast(a === tg ? "Order copied. Opening Telegram…" : "Order copied. Opening Messenger…");
    }));

    return { open, close, isOpen: () => dlg.open };
  })();

  const overlayOpen = () => palette.isOpen() || order.isOpen() || !$("#mobile-menu").hidden;

  /* ---------- Scroll reveal & cursor spotlight ---------------------------- */
  function initReveal() {
    const items = $$(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-in"));
      return;
    }
    // Stagger siblings that reveal together
    const groups = new Map();
    items.forEach((el) => {
      const g = groups.get(el.parentElement) || [];
      g.push(el);
      groups.set(el.parentElement, g);
    });
    groups.forEach((g) => g.forEach((el, i) => el.style.setProperty("--d", `${Math.min(i * 0.07, 0.35)}s`)));

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach((el) => io.observe(el));
  }

  function initSpotlight() {
    if (!finePointer) return;
    document.addEventListener("pointermove", (e) => {
      const el = e.target.closest && e.target.closest(".spot");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    }, { passive: true });
  }

  /* ---------- Marquee: seamless infinite loop ---------------------------- */
  // Builds two identical groups, each at least as wide as the screen, then slides the track by
  // exactly one group. When the animation restarts, group 2 is where group 1 started: no seam.
  function initMarquee() {
    const track = $(".marquee__track");
    if (!track) return;
    const SPEED = 45; // px per second, the same on every screen size
    const items = [...track.children].map((el) => el.cloneNode(true));

    const build = () => {
      track.classList.remove("is-looping");
      track.textContent = "";
      const group = document.createElement("div");
      group.className = "marquee__group";
      track.appendChild(group);
      const minWidth = window.innerWidth + 200;
      // Repeat the item set until one group is wider than the viewport (cap avoids runaway loops)
      for (let i = 0; i < 20 && (i === 0 || group.scrollWidth < minWidth); i++) {
        items.forEach((el) => group.appendChild(el.cloneNode(true)));
      }
      // Whole-pixel group width, so the -50% jump lands exactly on a pixel (no sub-pixel shimmer)
      const groupWidth = Math.ceil(group.getBoundingClientRect().width);
      group.style.width = `${groupWidth}px`;
      track.appendChild(group.cloneNode(true));
      track.style.setProperty("--marquee-dur", `${(groupWidth / SPEED).toFixed(2)}s`);
      void track.offsetWidth; // restart the animation cleanly with the new width
      track.classList.add("is-looping");
    };

    let lastWidth = window.innerWidth;
    let t;
    window.addEventListener("resize", () => {
      if (window.innerWidth === lastWidth) return; // ignore mobile URL-bar height changes
      lastWidth = window.innerWidth;
      clearTimeout(t);
      t = setTimeout(build, 200);
    });
    // Measure after web fonts load, since the font changes how wide the text is
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(build);
    build();
  }

  /* ---------- Hero background: Topography terrain ------------------------ */
  // Crimson contour lines, dimmed behind the headline (see .hero__topo in CSS).
  // - No hover/lift (the keyboard is the hero's interactive piece); clicks still send light pulses.
  // - Pauses itself while the hero is off-screen (built into topography.js).
  // - Phones, low-power devices, data-saver and reduced-motion get a single still frame.
  function initTopography() {
    const host = $(".hero__topo");
    if (!host || !window.Topography) return;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const lowPower =
      (navigator.hardwareConcurrency || 8) <= 4 ||
      (navigator.deviceMemory || 8) <= 4 ||
      !!(navigator.connection && navigator.connection.saveData);
    const still = reduceMotion || coarse || lowPower;
    try {
      const topo = Topography.create(host, {
        color: "#dc143c",
        lineCount: 22,
        lineWidth: 1.1,
        brightness: 0.55,
        glow: 0.45,
        speed: still ? 0 : 0.12,
        morph: still ? 0 : 0.12,
        intro: !still,
        mouseInteraction: !still,
        hover: false,
        clickEffect: "pulse",
        parallax: 0,
        dpr: Math.min(window.devicePixelRatio || 1, 1.5),
      });
      if (topo.ok) $(".hero").classList.add("has-topo");
    } catch (err) {
      // No WebGL2 or a driver problem: keep the dot-grid fallback
      console.info("Topography background unavailable:", err && err.message);
    }
  }

  /* ---------- Boot -------------------------------------------------------- */
  initStoreInfo();
  initTopography();
  initNav();
  initHeroKeyboard();
  initMarquee();
  initCategories();
  initReveal();
  initSpotlight();
})();
