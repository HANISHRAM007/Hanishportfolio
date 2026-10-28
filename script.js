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
})();