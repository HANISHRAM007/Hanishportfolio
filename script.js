/* =====================================================
   Portfolio interactions – Hanish Ram B
   ===================================================== */
(function () {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Footer year ---------- */
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Mobile navigation ---------- */
  const navToggle = $('#navToggle');
  const navMenu = $('#navMenu');

  function setMenu(open) {
    navMenu.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
  }
  navToggle.addEventListener('click', () => setMenu(!navMenu.classList.contains('open')));
  $$('.nav-link').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Navbar shadow + back-to-top ---------- */
  const navbar = $('#navbar');
  const backToTop = $('#backToTop');
  function onScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
    backToTop.classList.toggle('show', window.scrollY > 500);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Active nav link highlighting ---------- */
  const sections = $$('main section[id]');
  const links = $$('.nav-link');
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => spy.observe(s));

    /* ---------- Scroll reveal ---------- */
    const revealer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    $$('.reveal').forEach((el, i) => {
      el.style.transitionDelay = (i % 4) * 80 + 'ms'; // small stagger
      revealer.observe(el);
    });
  } else {
    $$('.reveal').forEach(el => el.classList.add('visible'));
  }

  /* ---------- Subtle pointer magnification for the glass header ---------- */
  const navBar = $('#navbar');
  const navInner = $('.nav-inner', navBar);
  if (navInner && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const navItems = $$('.logo, .nav-link', navInner);
    navInner.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || window.matchMedia('(max-width: 960px)').matches) return;
      const bounds = navInner.getBoundingClientRect();
      navInner.style.setProperty('--nav-pointer-x', `${event.clientX - bounds.left}px`);
      navInner.style.setProperty('--nav-pointer-y', `${event.clientY - bounds.top}px`);
      navItems.forEach(item => {
        const center = item.getBoundingClientRect().left + item.offsetWidth / 2;
        const distance = Math.abs(event.clientX - center);
        const influence = Math.exp(-Math.pow(distance / 74, 2) * .5);
        item.style.setProperty('--nav-scale', (1 + influence * .16).toFixed(3));
        item.style.setProperty('--nav-lift', `${influence * -4}px`);
      });
    });
    navInner.addEventListener('pointerleave', () => {
      navInner.style.removeProperty('--nav-pointer-x');
      navInner.style.removeProperty('--nav-pointer-y');
      navItems.forEach(item => {
        item.style.setProperty('--nav-scale', '1');
        item.style.setProperty('--nav-lift', '0px');
      });
    });
  }

  /* ---------- Profile image fallback ---------- */
  const img = $('#profileImg');
  const frame = $('.photo-frame');
  function checkImage() {
    if (!img.complete || img.naturalWidth === 0) frame.classList.add('no-image');
  }
  img.addEventListener('error', () => frame.classList.add('no-image'));
  checkImage();

  /* ---------- Placeholder links (no fake URLs) ---------- */
  $$('.placeholder-link').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      alert('This link is a placeholder. Open index.html and replace "[Add GitHub URL]" with your repository link.');
    });
  });

  /* ---------- Contact form validation ---------- */
  const form = $('#contactForm');
  const status = $('#formStatus');
  const rules = {
    name:    v => v.trim().length >= 2 || 'Please enter your name.',
    email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Please enter a valid email address.',
    subject: v => v.trim().length >= 3 || 'Please enter a subject.',
    message: v => v.trim().length >= 10 || 'Message should be at least 10 characters.'
  };

  function validateField(name) {
    const input = form.elements[name];
    const result = rules[name](input.value);
    const wrap = input.closest('.field');
    const err = $('#' + name + 'Error');
    if (result === true) {
      wrap.classList.remove('invalid');
      input.removeAttribute('aria-invalid');
      err.textContent = '';
      return true;
    }
    wrap.classList.add('invalid');
    input.setAttribute('aria-invalid', 'true');
    err.textContent = result;
    return false;
  }

  Object.keys(rules).forEach(name => {
    form.elements[name].addEventListener('blur', () => validateField(name));
    form.elements[name].addEventListener('input', () => {
      if (form.elements[name].closest('.field').classList.contains('invalid')) validateField(name);
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const allValid = Object.keys(rules).map(validateField).every(Boolean);
    if (!allValid) {
      status.textContent = 'Please fix the highlighted fields.';
      return;
    }
    /* No backend yet: open the visitor's email app with the message pre-filled.
       To send for real, replace this block with a fetch() to Formspree / Netlify Forms. */
    const { name, email, subject, message } = form.elements;
    const body = `${message.value}\n\n— ${name.value} (${email.value})`;
    window.location.href = 'mailto:hanishrambalaji@gmail.com?subject=' +
      encodeURIComponent(subject.value) + '&body=' + encodeURIComponent(body);
    status.textContent = 'Opening your email app…';
    form.reset();
  });

  /* ---------- Theme from uploaded image ---------- */
  const themeImageInput = $('#themeImageInput');
  const themeImageBtn = $('#themeImageBtn');
  const THEME_STORAGE_KEY = 'portfolio-image-theme';

  function clampChannel(v) { return Math.max(0, Math.min(255, Math.round(v))); }

  function mix(hex, withHex, amount) {
    const a = hexToRgb(hex), b = hexToRgb(withHex);
    return rgbToHex(
      clampChannel(a.r + (b.r - a.r) * amount),
      clampChannel(a.g + (b.g - a.g) * amount),
      clampChannel(a.b + (b.b - a.b) * amount)
    );
  }

  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => clampChannel(v).toString(16).padStart(2, '0')).join('');
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0; const l = (max + min) / 2;
    const d = max - min;
    if (d !== 0) {
      s = d / (1 - Math.abs(2 * l - 1));
      switch (max) {
        case r: h = 60 * (((g - b) / d) % 6); break;
        case g: h = 60 * ((b - r) / d + 2); break;
        default: h = 60 * ((r - g) / d + 4);
      }
    }
    if (h < 0) h += 360;
    return { h, s, l };
  }

  function relativeLuminance(r, g, b) {
    const srgb = [r, g, b].map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  }

  /* Extracts a small palette by quantizing sampled pixels into coarse color buckets. */
  function extractPalette(img) {
    const canvas = document.createElement('canvas');
    const size = 64;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);

    const buckets = new Map();
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], alpha = data[i + 3];
      if (alpha < 128) continue;
      const key = [r >> 4, g >> 4, b >> 4].join(',');
      const bucket = buckets.get(key) || { r: 0, g: 0, b: 0, count: 0 };
      bucket.r += r; bucket.g += g; bucket.b += b; bucket.count += 1;
      buckets.set(key, bucket);
    }

    const colors = Array.from(buckets.values())
      .map(b => ({ r: b.r / b.count, g: b.g / b.count, b: b.b / b.count, count: b.count }))
      .sort((a, b) => b.count - a.count);

    if (!colors.length) return null;

    const withHsl = colors.map(c => ({ ...c, hsl: rgbToHsl(c.r, c.g, c.b) }));

    const darkest = [...withHsl].sort((a, b) => a.hsl.l - b.hsl.l)[0];
    const vivid = [...withHsl]
      .filter(c => c.hsl.s > 0.25 && c.hsl.l > 0.2 && c.hsl.l < 0.85)
      .sort((a, b) => (b.hsl.s - b.count * 0.00001) - (a.hsl.s - a.count * 0.00001));

    const accentSource = vivid[0] || withHsl[0];
    const accent2Source = vivid.find(c => Math.abs(c.hsl.h - accentSource.hsl.h) > 40) || vivid[1] || accentSource;

    const bg = rgbToHex(darkest.r, darkest.g, darkest.b);
    const bgLum = relativeLuminance(darkest.r, darkest.g, darkest.b);
    const isDarkBg = bgLum < 0.45;

    return {
      bg,
      shadowDark: mix(bg, '#000000', isDarkBg ? 0.35 : 0.12),
      shadowLight: mix(bg, '#ffffff', isDarkBg ? 0.08 : 0.5),
      text: isDarkBg ? mix(bg, '#ffffff', 0.92) : mix(bg, '#000000', 0.85),
      muted: isDarkBg ? mix(bg, '#ffffff', 0.5) : mix(bg, '#000000', 0.45),
      accent: rgbToHex(accentSource.r, accentSource.g, accentSource.b),
      accent2: rgbToHex(accent2Source.r, accent2Source.g, accent2Source.b)
    };
  }

  function applyTheme(palette) {
    const root = document.documentElement.style;
    root.setProperty('--bg', palette.bg);
    root.setProperty('--shadow-dark', palette.shadowDark);
    root.setProperty('--shadow-light', palette.shadowLight);
    root.setProperty('--text', palette.text);
    root.setProperty('--muted', palette.muted);
    root.setProperty('--accent', palette.accent);
    root.setProperty('--accent-2', palette.accent2);
  }

  function storedThemeOnLoad() {
    try {
      const saved = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) || 'null');
      if (saved) applyTheme(saved);
    } catch (err) { /* ignore corrupt/unavailable storage */ }
  }
  storedThemeOnLoad();

  if (themeImageBtn && themeImageInput) {
    themeImageBtn.addEventListener('click', () => themeImageInput.click());
    themeImageInput.addEventListener('change', () => {
      const file = themeImageInput.files && themeImageInput.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const palette = extractPalette(img);
        URL.revokeObjectURL(url);
        if (!palette) return;
        applyTheme(palette);
        try { localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(palette)); } catch (err) { /* storage may be unavailable */ }
      };
      img.onerror = () => URL.revokeObjectURL(url);
      img.src = url;
    });
  }
})();
