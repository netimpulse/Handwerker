/* Craftsman Pages – interactive custom elements for the composed page sections.
   All elements are self-initializing (connectedCallback), clean up after
   themselves (disconnectedCallback) and therefore survive Shopify theme
   editor section reloads without extra wiring. */

(() => {
  'use strict';

  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ------------------------------------------------------------------
     <cf-before-after> – before/after image comparison slider.
     Markup contract: contains input[type=range].cf-ba__range and a
     wrapper .cf-ba; position is exposed via the --cf-ba-pos CSS var.
     ------------------------------------------------------------------ */
  class CfBeforeAfter extends HTMLElement {
    connectedCallback() {
      this.range = this.querySelector('.cf-ba__range');
      if (!this.range) return;
      this.onInput = () => {
        this.style.setProperty('--cf-ba-pos', `${this.range.value}%`);
      };
      this.range.addEventListener('input', this.onInput);
      this.onInput();
    }

    disconnectedCallback() {
      if (this.range) this.range.removeEventListener('input', this.onInput);
    }
  }

  /* ------------------------------------------------------------------
     <cf-count-up> – animates a number from 0 to data-target when the
     element scrolls into view. Skipped for reduced-motion users.
     ------------------------------------------------------------------ */
  class CfCountUp extends HTMLElement {
    connectedCallback() {
      this.target = parseFloat(this.dataset.target || '0');
      this.duration = parseInt(this.dataset.duration || '1400', 10);
      this.valueEl = this.querySelector('[data-count-value]');
      if (!this.valueEl || REDUCED_MOTION.matches || !('IntersectionObserver' in window)) {
        this.renderValue(this.target);
        return;
      }
      this.renderValue(0);
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.animate();
            this.observer.disconnect();
            this.observer = null;
          }
        });
      }, { threshold: 0.4 });
      this.observer.observe(this);
    }

    disconnectedCallback() {
      if (this.observer) this.observer.disconnect();
      if (this.raf) cancelAnimationFrame(this.raf);
    }

    renderValue(value) {
      const decimals = this.target % 1 === 0 ? 0 : 1;
      this.valueEl.textContent = value.toLocaleString(document.documentElement.lang || 'en', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }

    animate() {
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / this.duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        this.renderValue(this.target * eased);
        if (progress < 1) this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    }
  }

  /* ------------------------------------------------------------------
     <cf-filter-grid> – category filter chips for project galleries.
     Buttons carry data-filter, items carry data-category.
     ------------------------------------------------------------------ */
  class CfFilterGrid extends HTMLElement {
    connectedCallback() {
      this.onClick = (event) => {
        const chip = event.target.closest('[data-filter]');
        if (!chip) return;
        const filter = chip.dataset.filter;
        this.querySelectorAll('[data-filter]').forEach((btn) => {
          btn.setAttribute('aria-pressed', btn === chip ? 'true' : 'false');
        });
        this.querySelectorAll('[data-category]').forEach((item) => {
          const match = filter === '*' || item.dataset.category === filter;
          item.hidden = !match;
        });
        const live = this.querySelector('[data-filter-live]');
        if (live) {
          const visible = this.querySelectorAll('[data-category]:not([hidden])').length;
          live.textContent = `${visible} ${live.dataset.label || ''}`.trim();
        }
      };
      this.addEventListener('click', this.onClick);
    }

    disconnectedCallback() {
      this.removeEventListener('click', this.onClick);
    }
  }

  /* ------------------------------------------------------------------
     <cf-zip-check> – local service-area check. The merchant maintains a
     comma/newline separated list of ZIP codes or prefixes in data-zips.
     A trailing * marks a prefix ("10*" matches 10115).
     ------------------------------------------------------------------ */
  class CfZipCheck extends HTMLElement {
    connectedCallback() {
      this.form = this.querySelector('form');
      this.input = this.querySelector('input');
      this.result = this.querySelector('[data-zip-result]');
      if (!this.form || !this.input || !this.result) return;
      this.zips = (this.dataset.zips || '')
        .split(/[\s,;]+/)
        .map((z) => z.trim())
        .filter(Boolean);
      this.onSubmit = (event) => {
        event.preventDefault();
        const value = this.input.value.trim();
        if (!value) return;
        const hit = this.zips.some((zip) => {
          if (zip.endsWith('*')) return value.startsWith(zip.slice(0, -1));
          return value === zip;
        });
        this.result.classList.toggle('cf-zip__result--ok', hit);
        this.result.classList.toggle('cf-zip__result--no', !hit);
        this.result.textContent = hit ? this.dataset.successText : this.dataset.failText;
      };
      this.form.addEventListener('submit', this.onSubmit);
    }

    disconnectedCallback() {
      if (this.form) this.form.removeEventListener('submit', this.onSubmit);
    }
  }

  /* ------------------------------------------------------------------
     <cf-availability> – compares the visitor's local time with the
     configured business hours and toggles an "open now" indicator.
     data-open / data-close: hours (0-23), data-days: comma separated
     weekday indexes (0 = Sunday).
     ------------------------------------------------------------------ */
  class CfAvailability extends HTMLElement {
    connectedCallback() {
      const now = new Date();
      const open = parseInt(this.dataset.open || '7', 10);
      const close = parseInt(this.dataset.close || '17', 10);
      const days = (this.dataset.days || '1,2,3,4,5').split(',').map((d) => parseInt(d, 10));
      const hour = now.getHours();
      const isOpen = days.includes(now.getDay()) && hour >= open && hour < close;
      const openEl = this.querySelector('[data-when-open]');
      const closedEl = this.querySelector('[data-when-closed]');
      if (openEl) openEl.hidden = !isOpen;
      if (closedEl) closedEl.hidden = isOpen;
    }
  }

  /* ------------------------------------------------------------------
     <cf-estimator> – instant price range estimator. Service <option>s
     carry data-min/data-max (per unit); the quantity input multiplies.
     Formatting uses Intl.NumberFormat with the store currency.
     ------------------------------------------------------------------ */
  class CfEstimator extends HTMLElement {
    connectedCallback() {
      this.select = this.querySelector('select');
      this.qty = this.querySelector('input[type="number"]');
      this.output = this.querySelector('[data-estimate]');
      this.wrap = this.querySelector('[data-estimate-wrap]');
      if (!this.select || !this.qty || !this.output) return;
      this.formatter = new Intl.NumberFormat(document.documentElement.lang || 'en', {
        style: 'currency',
        currency: this.dataset.currency || 'EUR',
        maximumFractionDigits: 0,
      });
      this.onChange = () => this.update();
      this.select.addEventListener('change', this.onChange);
      this.qty.addEventListener('input', this.onChange);
      this.update();
    }

    disconnectedCallback() {
      if (this.select) this.select.removeEventListener('change', this.onChange);
      if (this.qty) this.qty.removeEventListener('input', this.onChange);
    }

    update() {
      const option = this.select.selectedOptions[0];
      const qty = Math.max(parseFloat(this.qty.value) || 0, 0);
      if (!option || !option.dataset.min || qty <= 0) {
        if (this.wrap) this.wrap.hidden = true;
        return;
      }
      const min = parseFloat(option.dataset.min) * qty;
      const max = parseFloat(option.dataset.max || option.dataset.min) * qty;
      this.output.textContent = `${this.formatter.format(min)} – ${this.formatter.format(max)}`;
      if (this.wrap) this.wrap.hidden = false;
      const unitLabel = this.querySelector('[data-unit-label]');
      if (unitLabel) unitLabel.textContent = option.dataset.unit || '';
    }
  }

  /* ------------------------------------------------------------------
     <cf-legal-toc> – builds a table of contents from h2 headings found
     in the sibling content container (data-content-target selector).
     ------------------------------------------------------------------ */
  class CfLegalToc extends HTMLElement {
    connectedCallback() {
      const targetSel = this.dataset.contentTarget;
      const content = targetSel ? document.querySelector(targetSel) : null;
      const list = this.querySelector('ol');
      if (!content || !list) return;
      const headings = content.querySelectorAll('h2');
      if (!headings.length) {
        this.hidden = true;
        return;
      }
      headings.forEach((heading, index) => {
        if (!heading.id) heading.id = `legal-section-${index + 1}`;
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${heading.id}`;
        a.textContent = heading.textContent;
        li.appendChild(a);
        list.appendChild(li);
      });
    }
  }

  /* ------------------------------------------------------------------
     <cf-print-button> – triggers window.print (no inline handlers).
     ------------------------------------------------------------------ */
  class CfPrintButton extends HTMLElement {
    connectedCallback() {
      this.button = this.querySelector('button');
      if (!this.button) return;
      this.onClick = () => window.print();
      this.button.addEventListener('click', this.onClick);
    }

    disconnectedCallback() {
      if (this.button) this.button.removeEventListener('click', this.onClick);
    }
  }

  /* ------------------------------------------------------------------
     Scroll reveal for .cf-reveal elements (decorative only).
     ------------------------------------------------------------------ */
  class CfRevealGroup extends HTMLElement {
    connectedCallback() {
      const items = this.querySelectorAll('.cf-reveal');
      if (!items.length || REDUCED_MOTION.matches || !('IntersectionObserver' in window)) {
        items.forEach((el) => el.classList.add('cf-reveal--in'));
        return;
      }
      // Hidden-State erst jetzt aktivieren – ohne JS bleibt alles sichtbar.
      this.classList.add('cf-armed');
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('cf-reveal--in');
            this.observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
      items.forEach((el) => this.observer.observe(el));
    }

    disconnectedCallback() {
      if (this.observer) this.observer.disconnect();
    }
  }

  const defs = {
    'cf-before-after': CfBeforeAfter,
    'cf-count-up': CfCountUp,
    'cf-filter-grid': CfFilterGrid,
    'cf-zip-check': CfZipCheck,
    'cf-availability': CfAvailability,
    'cf-estimator': CfEstimator,
    'cf-legal-toc': CfLegalToc,
    'cf-print-button': CfPrintButton,
    'cf-reveal-group': CfRevealGroup,
  };

  Object.entries(defs).forEach(([name, ctor]) => {
    if (!customElements.get(name)) customElements.define(name, ctor);
  });
})();
