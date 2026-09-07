/**
 * Progressive enhancement only.
 *
 * Every behaviour here is additive: with this file removed the site still
 * renders, navigates, and submits (NFR-05). Nothing below creates content,
 * and nothing below is required to read the page.
 *
 * Budget: 20 KB uncompressed, enforced by tools/build.mjs (NFR-03).
 */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) {
    return (r || document).querySelector(s);
  };
  var $$ = function (s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };

  /* ── Header: solid once the hero has scrolled by ───────────────────── */
  (function () {
    var header = $('.header');
    var hero = $('.hero');
    if (!header || !hero) return;
    var io = new IntersectionObserver(
      function (entries) {
        header.classList.toggle('is-solid', !entries[0].isIntersecting);
      },
      { rootMargin: '-' + (header.offsetHeight + 8) + 'px 0px 0px 0px' },
    );
    io.observe(hero);
  })();

  /* ── Mobile navigation drawer ──────────────────────────────────────── */
  (function () {
    var toggle = $('.nav__toggle');
    var drawer = $('#nav-drawer');
    if (!toggle || !drawer) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      drawer.hidden = !open;
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        var first = drawer.querySelector('a');
        if (first) first.focus();
      }
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
    setOpen(false);
  })();

  /* ── Scroll reveal ─────────────────────────────────────────────────── */
  (function () {
    var items = $$('.reveal');
    if (!items.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) {
        el.classList.add('is-in');
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );
    // Anything already on screen at first paint is shown immediately and never
    // animated. Fading in the content a visitor is already looking at delays
    // the largest contentful paint for no benefit (NFR-01).
    var pending = [];
    items.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-in');
      else pending.push(el);
    });
    pending.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 3, 2) * 70 + 'ms';
      io.observe(el);
    });

    // Fail open. An IntersectionObserver callback can simply never run — a
    // background tab, a prerender, a headless capture — and a reveal effect
    // must never be the reason a visitor cannot read the page. After a short
    // grace period everything is shown regardless of whether it was observed.
    function revealAll() {
      items.forEach(function (el) {
        el.style.transitionDelay = '';
        el.classList.add('is-in');
      });
      io.disconnect();
    }
    setTimeout(revealAll, 2500);
    window.addEventListener('beforeprint', revealAll);
  })();

  /* ── Lightbox ──────────────────────────────────────────────────────────
     Enhances gallery links that already point at the full-size image, so
     with JS off a click still shows the photograph (FR-04, NFR-05). */
  (function () {
    var links = $$('.gallery__item');
    var dialog = $('#lightbox');
    if (!links.length || !dialog || !dialog.showModal) return;

    var stageImg = $('.lightbox__stage img', dialog);
    var counter = $('.lightbox__count', dialog);
    var index = 0;

    function show(i) {
      index = (i + links.length) % links.length;
      var link = links[index];
      stageImg.src = link.getAttribute('href');
      stageImg.alt = link.getAttribute('data-alt') || '';
      counter.textContent = index + 1 + ' / ' + links.length;
    }

    links.forEach(function (link, i) {
      link.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        show(i);
        dialog.showModal();
      });
    });

    $('.lightbox__nav--prev', dialog).addEventListener('click', function () {
      show(index - 1);
    });
    $('.lightbox__nav--next', dialog).addEventListener('click', function () {
      show(index + 1);
    });
    $('.lightbox__close', dialog).addEventListener('click', function () {
      dialog.close();
    });

    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        show(index - 1);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        show(index + 1);
      }
    });
    dialog.addEventListener('close', function () {
      var link = links[index];
      if (link) link.focus();
    });
    // Click on the backdrop (i.e. outside the image) closes.
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog || e.target.classList.contains('lightbox__stage')) dialog.close();
    });
  })();

  /* ── Enquiry form ──────────────────────────────────────────────────────
     Adds inline validation and an async submit. The <form> works without
     any of this: it has a real action, real method, and real required
     attributes (FR-07). */
  (function () {
    var form = $('#enquiry');
    if (!form) return;

    var status = $('.form__status', form);
    var loadedAt = Date.now();

    function fieldOf(input) {
      return input.closest('.field');
    }

    function validate(input) {
      var wrap = fieldOf(input);
      if (!wrap) return true;
      var err = $('.field__error', wrap);
      var ok = input.checkValidity();
      wrap.classList.toggle('is-invalid', !ok);
      if (err) err.textContent = ok ? '' : input.validationMessage;
      input.setAttribute('aria-invalid', String(!ok));
      return ok;
    }

    $$('input, textarea, select', form).forEach(function (input) {
      if (input.type === 'hidden' || input.closest('.hp')) return;
      input.addEventListener('blur', function () {
        validate(input);
      });
      input.addEventListener('input', function () {
        if (fieldOf(input) && fieldOf(input).classList.contains('is-invalid')) validate(input);
      });
    });

    form.addEventListener('submit', function (e) {
      var fields = $$('input, textarea, select', form).filter(function (i) {
        return i.type !== 'hidden' && !i.closest('.hp');
      });
      var valid = fields.map(validate).every(Boolean);
      if (!valid) {
        e.preventDefault();
        var bad = $('.field.is-invalid input, .field.is-invalid textarea', form);
        if (bad) bad.focus();
        return;
      }

      // Spam heuristics: a filled honeypot, or a submission faster than any
      // human could type one, is dropped silently (ADR-0003).
      if (form.elements.company && form.elements.company.value !== '') {
        e.preventDefault();
        return;
      }
      if (Date.now() - loadedAt < 3000) {
        e.preventDefault();
        return;
      }

      if (!form.dataset.async) return; // no endpoint: let the browser submit

      e.preventDefault();
      var btn = $('button[type=submit]', form);
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Sending…';
      }

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          form.reset();
          status.hidden = false;
          status.textContent =
            'Thank you — your enquiry is with me. I reply to everything personally, usually ' +
            'within two working days.';
          status.focus();
        })
        .catch(function () {
          status.hidden = false;
          status.textContent =
            'Something went wrong sending that. Please email me directly and I will pick it up.';
        })
        .finally(function () {
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Send enquiry';
          }
        });
    });
  })();

  /* ── Current-year stamp ────────────────────────────────────────────── */
  $$('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
