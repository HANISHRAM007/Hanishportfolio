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

  /* Side scroll rail (visible in the Particle theme on wide screens) */
  const rail = document.createElement('nav');
  rail.className = 'scroll-rail';
  rail.setAttribute('aria-label', 'Section progress');
  sections.forEach(s => {
    const title = $('.section-title', s);
    const label = (title && title.dataset.label) || (s.id === 'home' ? 'Intro' : s.id);
    const tick = document.createElement('a');
    tick.href = '#' + s.id;
    tick.className = 'rail-tick';
    tick.dataset.target = s.id;
    tick.setAttribute('aria-label', label);
    tick.innerHTML = '<span>' + label + '</span>';
    rail.appendChild(tick);
  });
  document.body.appendChild(rail);
  const ticks = $$('.rail-tick', rail);

  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id));
          ticks.forEach(t => t.classList.toggle('active', t.dataset.target === entry.target.id));
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
      el.style.transitionDelay = (i % 3) * 40 + 'ms'; // subtle, non-blocking stagger
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
  const submitBtn = $('#submitBtn', form) || $('button[type="submit"]', form);
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

  /* ---------- Contact form submit (FormSubmit AJAX -> Inbox) ---------- */
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const allValid = Object.keys(rules).map(validateField).every(Boolean);
    if (!allValid) {
      status.className = 'form-status error';
      status.textContent = 'Please fix the highlighted fields.';
      return;
    }

    // Bot honeypot check
    if (form.elements['_honey'] && form.elements['_honey'].value) {
      status.className = 'form-status success';
      status.textContent = '✓ Thank you! Your message has been sent.';
      form.reset();
      return;
    }

    const { name, email, subject, message } = form.elements;
    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : 'Send Message';

    // Show sending state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
    }
    status.className = 'form-status';
    status.textContent = 'Sending message to inbox...';

    try {
      const userEmail = email.value.trim();
      const userName = name.value.trim();
      const userSubject = subject.value.trim();
      const userMessage = message.value.trim();

      const response = await fetch('https://formsubmit.co/ajax/hanishrambalaji@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          _replyto: userEmail,
          subject: userSubject,
          message: userMessage,
          _subject: `New Portfolio Message from ${userName} (${userEmail}): ${userSubject}`,
          _captcha: 'false',
          _template: 'table'
        })
      });

      const data = await response.json().catch(() => ({}));

      // Check for one-time activation requirement from FormSubmit
      if (data && data.message && (data.message.includes('needs Activation') || data.message.includes('Activate Form'))) {
        status.className = 'form-status warning';
        status.innerHTML = '📬 <strong>One-time activation required:</strong> FormSubmit has sent a confirmation email to <strong>hanishrambalaji@gmail.com</strong>. Please check your Gmail (including Spam/Promotions) and click <strong>"Activate Form"</strong> once. Future messages will arrive immediately!';
        return;
      }

      // Check for file:// protocol restriction from FormSubmit
      if (data && data.message && (data.message.includes('HTML files') || data.message.includes('web server'))) {
        status.className = 'form-status warning';
        const mailtoUrl = 'mailto:hanishrambalaji@gmail.com?subject=' +
          encodeURIComponent(userSubject) + '&body=' + encodeURIComponent(userMessage + '\n\n— ' + userName + ' (' + userEmail + ')');
        status.innerHTML = '⚠️ <strong>Local testing note:</strong> FormSubmit requires running via a web server (e.g. VS Code Live Server <code>http://localhost:...</code>) or deployed URL (GitHub Pages) rather than opening directly as <code>file:///</code>. <a href="' + mailtoUrl + '" style="text-decoration:underline;color:inherit;font-weight:600;">Click to send via email client</a>.';
        return;
      }

      if (response.ok && (data.success === 'true' || data.success === true || response.status === 200)) {
        status.className = 'form-status success';
        status.textContent = '✓ Thank you! Your message has been sent to my inbox.';
        form.reset();
        $$('.field', form).forEach(field => field.classList.remove('invalid'));
      } else {
        throw new Error(data.message || 'Submission failed');
      }
    } catch (err) {
      console.error('Contact form AJAX error, falling back:', err);
      try {
        const replyHidden = form.querySelector('#replyToHidden') || form.elements['_replyto'];
        const subjHidden = form.querySelector('#subjectHidden') || form.elements['_subject'];
        if (replyHidden) replyHidden.value = email.value.trim();
        if (subjHidden) subjHidden.value = `Portfolio Contact from ${name.value.trim()} (${email.value.trim()}): ${subject.value.trim()}`;
        form.submit();
      } catch (nativeErr) {
        status.className = 'form-status error';
        const mailtoUrl = 'mailto:hanishrambalaji@gmail.com?subject=' +
          encodeURIComponent(subject.value) + '&body=' + encodeURIComponent(message.value + '\n\n— ' + name.value + ' (' + email.value + ')');
        status.innerHTML = 'Unable to send automatically. <a href="' + mailtoUrl + '" style="text-decoration:underline;color:inherit;font-weight:600;">Click here to send via email client</a>.';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
    }
  });

  /* ---------- Theme dock (Particle / Ember / Cosmic Purple) ---------- */
  const THEME_STORAGE_KEY = 'portfolio-theme-mode';
  const THEMES = { particle: '#060608', ember: '#101010', purple: '#0c0817' };
  const themeMeta = $('meta[name="theme-color"]');
  const dockButtons = $$('[data-theme-choice]');

  function applyTheme(name, persist) {
    if (!THEMES[name]) name = 'particle';
    document.body.classList.toggle('theme-purple', name === 'purple');
    document.body.classList.toggle('theme-particle', name === 'particle');
    document.body.dataset.theme = name;
    dockButtons.forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.themeChoice === name)));
    if (themeMeta) themeMeta.setAttribute('content', THEMES[name]);
    if (persist) {
      try { localStorage.setItem(THEME_STORAGE_KEY, name); } catch (e) { /* storage blocked */ }
    }
    window.dispatchEvent(new CustomEvent('themechange', { detail: name }));
  }

  let savedTheme = 'particle';
  try { savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'particle'; } catch (e) { /* storage blocked */ }
  applyTheme(savedTheme, false);
  dockButtons.forEach(btn => btn.addEventListener('click', () => applyTheme(btn.dataset.themeChoice, true)));

})();
