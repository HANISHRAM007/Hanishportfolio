/* =====================================================
   Particle effects – Hanish Ram B
   1. Interactive 3D "systems" network (drag to rotate, hover a service)
   2. Ambient pixel dust behind the page (Particle theme only)
   Plain canvas 2D, no libraries. Pauses when off-screen / tab hidden,
   and respects prefers-reduced-motion.
   ===================================================== */
(function () {
  'use strict';

  const TAU = Math.PI * 2;
  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  function parseColor(str) {
    if (!str) return null;
    str = str.trim();
    let m = str.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (m) {
      let h = m[1];
      if (h.length === 3) h = h.split('').map(c => c + c).join('');
      const n = parseInt(h, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    m = str.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
    return m ? [+m[1], +m[2], +m[3]] : null;
  }
  function readColor(name, fallback) {
    return parseColor(getComputedStyle(document.body).getPropertyValue(name)) || parseColor(fallback);
  }
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  function gauss() {
    let u = 0, v = 0;
    while (!u) u = Math.random();
    while (!v) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
  }

  /* =================================================================
     1. Systems network
     ================================================================= */
  function initNetwork(stage) {
    if (!stage) return;
    const canvas = stage.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const layer = stage.querySelector('.sys-labels');
    const infoText = document.getElementById('systemsInfoText');
    const defaultInfo = infoText ? infoText.textContent : '';

    const deg = d => (d * Math.PI) / 180;
    const at = (angle, r, y) => ({ x: Math.cos(deg(angle)) * r, y, z: Math.sin(deg(angle)) * r });

    const NODES = [
      { name: '.NET Core API', p: { x: 0, y: 0.05, z: 0 }, s: 0.2, info: '.NET Core REST APIs with Dapper: the hub every app and integration talks to.' },
      { name: 'Flutter App', p: at(95, 0.55, 0.95), s: 0.13, info: 'Dhrishti: the patient-facing Flutter app for records, visits and treatment history.' },
      { name: 'SQL Server', p: at(160, 1.35, 0.25), s: 0.15, info: 'SQL Server / PostgreSQL behind Dapper, with queries tuned for high-traffic endpoints.' },
      { name: 'EMR', p: at(20, 1.35, 0.3), s: 0.13, info: 'Hospital EMR integration, so clinical records stay in sync with the app.' },
      { name: 'API Gateway', p: at(-35, 1.35, -0.25), s: 0.12, info: 'API Gateway in front of serverless Lambda APIs (v1/v2 proxy integrations).' },
      { name: 'Lambda', p: at(-90, 1.3, -0.45), s: 0.14, info: '.NET and Python Lambda functions: serverless compute that scales with load.' },
      { name: 'DynamoDB', p: at(-150, 1.35, -0.15), s: 0.12, info: 'DynamoDB for the serverless CRUD API, chosen over RDS for scale.' },
      { name: 'Cognito', p: at(65, 1.35, 0.15), s: 0.11, info: 'Cognito user and identity pools securing NimbusSync photo backups.' },
      { name: 'S3', p: at(-70, 0.75, -0.85), s: 0.12, info: 'S3 storage for automatic, deduplicated photo backup (NimbusSync).' },
      { name: 'EC2 · VPC', p: at(125, 1.25, -0.35), s: 0.12, info: 'EC2 in a custom VPC: public app tier, private database tier (CloudBase).' }
    ];
    const EDGES = [[0, 1], [0, 2], [0, 3], [0, 4], [4, 5], [5, 6], [5, 8], [1, 7], [7, 8], [1, 8], [0, 9], [9, 2]];

    // Edge curves: quadratic béziers lifted upward and pushed slightly outward
    const curves = EDGES.map(([a, b]) => {
      const A = NODES[a].p, B = NODES[b].p;
      const len = Math.hypot(B.x - A.x, B.y - A.y, B.z - A.z);
      const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, mz = (A.z + B.z) / 2;
      const ml = Math.hypot(mx, mz) || 1;
      return {
        A, B, len,
        C: { x: mx + (mx / ml) * 0.15 * len, y: my + 0.35 * len, z: mz + (mz / ml) * 0.15 * len },
        speed: 0.1 + Math.random() * 0.12,
        off: Math.random(),
        dir: Math.random() < 0.5 ? 1 : -1
      };
    });
    const bez = (c, t, k) => {
      const u = 1 - t;
      return u * u * c.A[k] + 2 * u * t * c.C[k] + t * t * c.B[k];
    };

    // Particle buffers
    let N = 0, px, py, pz, kind, ref, tt, ph, sz;
    let quality = 0;

    function build(q) {
      const list = [];
      NODES.forEach((n, i) => {
        const count = Math.round(q * (120 + 900 * n.s));
        for (let k = 0; k < count; k++) {
          const r = n.s * 0.55;
          list.push([n.p.x + gauss() * r, n.p.y + gauss() * r, n.p.z + gauss() * r, 0, i, 0]);
        }
      });
      curves.forEach((c, e) => {
        const count = Math.round(q * (110 + 210 * c.len));
        for (let k = 0; k < count; k++) {
          const t = Math.random();
          const j = 0.012 + 0.016 * Math.sin(t * Math.PI); // thicker mid-arc
          list.push([bez(c, t, 'x') + gauss() * j, bez(c, t, 'y') + gauss() * j, bez(c, t, 'z') + gauss() * j, 1, e, t]);
        }
      });
      // Large decorative orbit ring
      const ringCount = Math.round(q * 1100);
      for (let k = 0; k < ringCount; k++) {
        const t = Math.random();
        const a = t * TAU;
        list.push([Math.cos(a) * 1.65 + gauss() * 0.03, -0.12 + Math.sin(a * 2) * 0.12 + gauss() * 0.03, Math.sin(a) * 1.65 + gauss() * 0.03, 2, -1, t]);
      }

      N = list.length;
      px = new Float32Array(N); py = new Float32Array(N); pz = new Float32Array(N);
      kind = new Uint8Array(N); ref = new Int16Array(N); tt = new Float32Array(N);
      ph = new Float32Array(N); sz = new Float32Array(N);
      list.forEach((p, i) => {
        px[i] = p[0]; py[i] = p[1]; pz[i] = p[2]; kind[i] = p[3]; ref[i] = p[4]; tt[i] = p[5];
        ph[i] = Math.random() * TAU;
        sz[i] = Math.random() < 0.08 ? 2 : Math.random() < 0.5 ? 1.4 : 1;
      });
      buckets = Array.from({ length: 10 }, () => new Float32Array(N * 3));
    }

    // Draw buckets: [base color x 5 alpha levels] + [accent color x 5 alpha levels]
    const LEVELS = [0.12, 0.26, 0.44, 0.66, 0.92];
    let buckets = [];
    const counts = new Int32Array(10);
    let styles = [];
    function refreshColors() {
      const base = readColor('--particle', '#d6d6de');
      const accent = readColor('--accent', '#7b78ff');
      styles = LEVELS.map(a => rgba(base, a)).concat(LEVELS.map(a => rgba(accent, Math.min(1, a + 0.08))));
    }

    // Labels
    const labels = NODES.map((n, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sys-label';
      b.textContent = n.name;
      b.setAttribute('aria-describedby', 'systemsInfoText');
      b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { labelHover = true; setActive(i); } });
      b.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { labelHover = false; setActive(-1); } });
      b.addEventListener('focus', () => setActive(i));
      b.addEventListener('blur', () => setActive(-1));
      b.addEventListener('click', () => setActive(active === i && document.activeElement !== b ? -1 : i));
      layer.appendChild(b);
      return b;
    });

    // State
    let w = 0, h = 0, dpr = 1, cx = 0, cy = 0, scale = 1;
    let yaw = 0.6, pitch = 0.42, vyaw = 0, vpitch = 0, time = 0;
    let active = -1, labelHover = false, linked = new Set();
    let dragging = false, lastX = 0, lastY = 0;
    let visible = false, raf = 0, last = 0;
    const proj = NODES.map(() => ({ x: 0, y: 0, d: 0, r: 0 }));
    const pulseA = new Float32Array(curves.length), pulseB = new Float32Array(curves.length);
    const edgeHot = new Uint8Array(curves.length);

    function setActive(i) {
      if (i === active) return;
      active = i;
      linked = new Set();
      edgeHot.fill(0);
      if (i >= 0) {
        linked.add(i);
        EDGES.forEach(([a, b], e) => { if (a === i || b === i) { edgeHot[e] = 1; linked.add(a); linked.add(b); } });
      }
      labels.forEach((l, k) => {
        l.classList.toggle('is-active', k === i);
        l.classList.toggle('is-dim', i >= 0 && !linked.has(k));
      });
      if (infoText) {
        infoText.innerHTML = '';
        if (i >= 0) {
          const strong = document.createElement('strong');
          strong.textContent = NODES[i].name + ': ';
          infoText.append(strong, NODES[i].info.replace(/^[^:]+:\s*/, ''));
        } else {
          infoText.textContent = defaultInfo;
        }
      }
      kick();
    }

    function resize() {
      const r = stage.getBoundingClientRect();
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const wide = w > 900;
      cx = wide ? w * 0.6 : w * 0.5;
      cy = h * (wide ? 0.46 : 0.5);
      scale = Math.min(wide ? w * 0.6 : w, h * 1.3) * (wide ? 0.36 : 0.27);
      const q = w < 560 ? 0.45 : w < 960 ? 0.7 : 1;
      if (q !== quality) { quality = q; build(q); }
      kick();
    }

    function frame(now) {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      const still = reduceMQ.matches;

      if (!still) time += dt;
      if (!dragging) {
        yaw += vyaw + (still ? 0 : dt * 0.09);
        pitch = clamp(pitch + vpitch, 0.08, 0.95);
        vyaw *= 0.93; vpitch *= 0.9;
      }
      const cY = Math.cos(yaw), sY = Math.sin(yaw), cP = Math.cos(pitch), sP = Math.sin(pitch);
      const CAM = 5.2;

      // Pulses travelling along each edge
      for (let e = 0; e < curves.length; e++) {
        const c = curves[e];
        let p = (c.off + time * c.speed * (edgeHot[e] ? 2.2 : 1)) % 1;
        if (c.dir < 0) p = 1 - p;
        pulseA[e] = p;
        pulseB[e] = (p + 0.5) % 1;
      }
      const ringP = [(time * 0.035) % 1, (time * 0.035 + 0.33) % 1, (time * 0.035 + 0.66) % 1];

      counts.fill(0);
      const hasActive = active >= 0;
      const wob = still ? 0 : 0.006;

      for (let i = 0; i < N; i++) {
        let x = px[i], y = py[i], z = pz[i];
        if (wob) { x += Math.sin(time * 0.8 + ph[i]) * wob; y += Math.cos(time * 0.7 + ph[i] * 1.3) * wob; }
        const x1 = x * cY - z * sY;
        const z1 = x * sY + z * cY;
        const y1 = y * cP - z1 * sP;
        const z2 = y * sP + z1 * cP;
        const persp = CAM / (CAM - z2);
        const sx = cx + x1 * scale * persp;
        const sy = cy - y1 * scale * persp;
        if (sx < -4 || sy < -4 || sx > w + 4 || sy > h + 4) continue;

        let alpha = 0.22 + 0.78 * clamp((z2 + 1.8) / 3.6, 0, 1);
        let hot = 0;
        const k = kind[i], r = ref[i];
        if (k === 1) {
          const t = tt[i];
          const d = Math.min(Math.abs(t - pulseA[r]), Math.abs(t - pulseB[r]));
          if (d < 0.05) hot = 1 - d / 0.05;
          if (hasActive) { if (edgeHot[r]) alpha = Math.min(1, alpha * 1.25); else alpha *= 0.28; }
        } else if (k === 0) {
          if (i % 11 === 0) hot = 0.5;
          if (hasActive) {
            if (r === active) { alpha = Math.min(1, alpha * 1.3); if (i % 3 === 0) hot = 0.6; }
            else if (!linked.has(r)) alpha *= 0.35;
          }
        } else {
          const t = tt[i];
          for (let q = 0; q < 3; q++) {
            let d = Math.abs(t - ringP[q]); if (d > 0.5) d = 1 - d;
            if (d < 0.025) hot = Math.max(hot, 1 - d / 0.025);
          }
          alpha *= hasActive ? 0.35 : 0.7;
        }

        const isHot = hot > 0.35;
        const level = Math.min(4, (alpha * 5) | 0);
        const b = (isHot ? 5 : 0) + level;
        const s = sz[i] * persp * (isHot ? 1.6 : 1);
        const o = counts[b] * 3;
        const buf = buckets[b];
        buf[o] = sx; buf[o + 1] = sy; buf[o + 2] = s;
        counts[b]++;
      }

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      for (let b = 0; b < 10; b++) {
        if (b === 5) ctx.globalCompositeOperation = 'lighter';
        const n = counts[b];
        if (!n) continue;
        ctx.fillStyle = styles[b];
        const buf = buckets[b];
        for (let j = 0; j < n * 3; j += 3) ctx.fillRect(buf[j], buf[j + 1], buf[j + 2], buf[j + 2]);
      }
      ctx.globalCompositeOperation = 'source-over';

      // Project node centres and place labels
      NODES.forEach((n, i) => {
        const { x, y, z } = n.p;
        const x1 = x * cY - z * sY, z1 = x * sY + z * cY;
        const y1 = y * cP - z1 * sP, z2 = y * sP + z1 * cP;
        const persp = CAM / (CAM - z2);
        const P = proj[i];
        P.x = cx + x1 * scale * persp;
        P.y = cy - y1 * scale * persp;
        P.r = n.s * scale * persp;
        P.d = clamp((z2 + 1.8) / 3.6, 0, 1);
        const l = labels[i];
        l.style.transform = `translate3d(${P.x.toFixed(1)}px, ${(P.y - P.r * 0.9 - 8).toFixed(1)}px, 0) translate(-50%, -100%)`;
        l.style.zIndex = String(Math.round(P.d * 100));
        l.style.setProperty('--depth', (0.45 + 0.55 * P.d).toFixed(2));
      });

      const moving = !still || dragging || Math.abs(vyaw) > 1e-4 || Math.abs(vpitch) > 1e-4;
      if (moving) kick();
    }

    function kick() {
      if (raf || !visible || document.hidden || !N) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    // Drag to rotate (horizontal drags on touch; vertical still scrolls the page)
    stage.addEventListener('pointerdown', e => {
      if (e.target.closest('.sys-label')) return;
      dragging = true;
      lastX = e.clientX; lastY = e.clientY;
      vyaw = vpitch = 0;
      stage.classList.add('is-dragging');
      try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      kick();
    });
    stage.addEventListener('pointermove', e => {
      if (dragging) {
        const dx = e.clientX - lastX, dy = e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY;
        vyaw = dx * 0.006; vpitch = dy * 0.004;
        yaw += vyaw;
        pitch = clamp(pitch + vpitch, 0.08, 0.95);
        kick();
        return;
      }
      if (e.pointerType !== 'mouse' || labelHover) return;
      const r = stage.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      let best = -1, bestD = Infinity;
      proj.forEach((P, i) => {
        const d = Math.hypot(P.x - mx, P.y - my);
        if (d < Math.max(26, P.r * 1.1) && d < bestD) { best = i; bestD = d; }
      });
      setActive(best);
    });
    const endDrag = () => { dragging = false; stage.classList.remove('is-dragging'); kick(); };
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
    stage.addEventListener('pointerleave', e => { if (!dragging && e.pointerType === 'mouse' && !labelHover) setActive(-1); });

    // Keyboard: arrow keys rotate when a label is focused
    layer.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { vyaw = -0.05; kick(); }
      if (e.key === 'ArrowRight') { vyaw = 0.05; kick(); }
    });

    refreshColors();
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
    else window.addEventListener('resize', resize);
    resize();

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        if (visible) kick();
      }, { rootMargin: '100px' }).observe(stage);
    } else {
      visible = true; kick();
    }
    document.addEventListener('visibilitychange', kick);
    window.addEventListener('themechange', () => { refreshColors(); kick(); });
    reduceMQ.addEventListener && reduceMQ.addEventListener('change', kick);
  }

  /* =================================================================
     2. Ambient pixel dust (Particle theme)
     ================================================================= */
  function initAmbient(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dots = [], raf = 0, last = 0, t = 0;
    let mx = -1e4, my = -1e4, base = [220, 220, 228], accent = [123, 120, 255];
    const isOn = () => document.body.classList.contains('theme-particle');

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(240, (w * h) / 6500));
      dots = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -(0.04 + Math.random() * 0.16),
        s: Math.random() < 0.85 ? 1.5 : 2.5,
        a: 0.12 + Math.random() * 0.45,
        ph: Math.random() * TAU,
        hot: Math.random() < 0.14,
        ox: 0, oy: 0
      }));
      draw(performance.now());
    }

    function draw(now) {
      raf = 0;
      if (!isOn()) { ctx.clearRect(0, 0, w, h); return; }
      const still = reduceMQ.matches;
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      if (!still) t += dt;
      const k = dt * 60;
      const scroll = window.scrollY;
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        if (!still) {
          d.x += d.vx * k; d.y += d.vy * k;
          if (d.y < -4) d.y = h + 4;
          if (d.x < -4) d.x = w + 4; else if (d.x > w + 4) d.x = -4;
          // gentle push away from the cursor
          const dx = d.x + d.ox - mx, dy = d.y + d.oy - my;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < 12000) {
            const dist = Math.sqrt(dist2) || 1;
            const f = (1 - dist / 110) * 2.2;
            d.ox += (dx / dist) * f; d.oy += (dy / dist) * f;
          }
          d.ox *= 0.94; d.oy *= 0.94;
        }
        const yy = ((d.y + d.oy - scroll * 0.06 * d.s) % h + h) % h;
        const alpha = d.a * (still ? 1 : 0.6 + 0.4 * Math.sin(t * 1.4 + d.ph));
        ctx.fillStyle = rgba(d.hot ? accent : base, alpha);
        ctx.fillRect(d.x + d.ox, yy, d.s, d.s);
      }
      if (!still && !document.hidden) raf = requestAnimationFrame(draw);
    }

    function start() {
      base = readColor('--particle', '#dcdce4');
      accent = readColor('--accent', '#7b78ff');
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(draw); }
    }

    window.addEventListener('resize', () => { clearTimeout(resize.tid); resize.tid = setTimeout(resize, 150); });
    window.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { mx = e.clientX; my = e.clientY; } }, { passive: true });
    window.addEventListener('scroll', () => { if (reduceMQ.matches && isOn()) start(); }, { passive: true });
    window.addEventListener('themechange', start);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
    resize();
    start();
  }

  initNetwork(document.getElementById('systemsStage'));
  initAmbient(document.getElementById('ambientField'));
})();
