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
      const response = await fetch('https://formsubmit.co/ajax/hanishrambalaji@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: name.value.trim(),
          email: email.value.trim(),
          subject: subject.value.trim(),
          message: message.value.trim(),
          _subject: `Portfolio Contact: ${subject.value.trim()} (from ${name.value.trim()})`,
          _captcha: 'false',
          _template: 'table'
        })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        status.className = 'form-status success';
        status.textContent = '✓ Thank you! Your message has been sent to my inbox.';
        form.reset();
        $$('.field', form).forEach(field => field.classList.remove('invalid'));
      } else {
        throw new Error(data.message || 'Submission failed');
      }
    } catch (err) {
      console.error('Contact form submission error:', err);
      status.className = 'form-status error';
      const mailtoUrl = 'mailto:hanishrambalaji@gmail.com?subject=' +
        encodeURIComponent(subject.value) + '&body=' + encodeURIComponent(message.value + '\n\n— ' + name.value + ' (' + email.value + ')');
      status.innerHTML = 'Unable to send automatically. <a href="' + mailtoUrl + '" style="text-decoration:underline;color:inherit;font-weight:600;">Click here to send via email client</a>.';
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
    }
  });

  /* ---------- Theme toggle (Ember <-> Cosmic Purple) ---------- */
  const THEME_STORAGE_KEY = 'portfolio-theme-mode';
  const themeToggleBtns = $$('#themeToggleBtn, #navThemeToggle, .theme-toggle-btn');

  function updateThemeUI(isPurple) {
    document.body.classList.toggle('theme-purple', isPurple);
    themeToggleBtns.forEach(btn => {
      btn.setAttribute('aria-pressed', String(isPurple));
      const icon = $('i', btn);
      if (icon) {
        icon.className = isPurple ? 'fa-solid fa-fire-flame-curved' : 'fa-solid fa-wand-magic-sparkles';
      }
      btn.setAttribute('title', isPurple ? 'Switch to Ember theme' : 'Switch to Cosmic Purple theme');
    });
  }

  function toggleTheme() {
    const isPurple = !document.body.classList.contains('theme-purple');
    updateThemeUI(isPurple);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isPurple ? 'purple' : 'ember');
    } catch (e) { /* ignore storage restrictions */ }
  }

  // Restore saved theme preference (default is current Ember theme)
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'purple') {
      updateThemeUI(true);
    } else {
      updateThemeUI(false);
    }
  } catch (e) {
    updateThemeUI(false);
  }

  themeToggleBtns.forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });

})();
