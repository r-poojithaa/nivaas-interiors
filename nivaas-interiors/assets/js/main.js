(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     Header state + mobile navigation
     --------------------------------------------------------- */
  const header = $("#header");
  const nav = $("#nav");
  const navToggle = $("#navToggle");

  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 40);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const closeNav = () => {
    if (!nav || !navToggle) return;
    nav.classList.remove("is-open");
    header.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
  };

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      header.classList.toggle("nav-open", open);
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    $$("a", nav).forEach((link) => link.addEventListener("click", closeNav));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        closeNav();
        navToggle.focus();
      }
    });

    document.addEventListener("click", (e) => {
      if (!nav.classList.contains("is-open")) return;
      if (nav.contains(e.target) || navToggle.contains(e.target)) return;
      closeNav();
    });
  }

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeNav();
  });

  /* ---------------------------------------------------------
     Reveal on scroll
     --------------------------------------------------------- */
  const revealItems = $$(".reveal");
  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealItems.forEach((el) => revealObserver.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add("in"));
  }

  /* ---------------------------------------------------------
     Animated counters
     --------------------------------------------------------- */
  const counters = $$("[data-count]");
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const runCounter = (el) => {
    if (el.dataset.counted === "true") return;
    el.dataset.counted = "true";

    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    if (!Number.isFinite(target)) return;

    if (prefersReducedMotion) {
      el.textContent = target + suffix;
      return;
    }

    const duration = 1700;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const value = Math.round(target * easeOutCubic(progress));
      el.textContent = value + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (counters.length) {
    if ("IntersectionObserver" in window) {
      const counterObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            runCounter(entry.target);
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach((el) => counterObserver.observe(el));
    } else {
      counters.forEach(runCounter);
    }
  }

  /* ---------------------------------------------------------
     Project gallery filter
     --------------------------------------------------------- */
  const gallery = $("#gallery");
  const filterBtns = $$(".filter-btn");
  const galleryItems = $$(".gallery-item");

  if (gallery && filterBtns.length && galleryItems.length) {
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.dataset.filter || "all";

        filterBtns.forEach((b) => {
          const active = b === btn;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-selected", String(active));
        });

        gallery.classList.toggle("is-filtered", filter !== "all");

        galleryItems.forEach((item) => {
          const show = filter === "all" || item.dataset.cat === filter;
          item.classList.toggle("is-hidden", !show);
          if (show) item.classList.add("in");
        });
      });
    });
  }

  /* ---------------------------------------------------------
     Testimonial slider
     --------------------------------------------------------- */
  const slider = $("#quoteSlider");
  const track = $("#quoteTrack");
  const prevBtn = $("#quotePrev");
  const nextBtn = $("#quoteNext");
  const dotsWrap = $("#quoteDots");

  if (slider && track && prevBtn && nextBtn && dotsWrap) {
    const slides = $$(".quote", track);
    const total = slides.length;
    let index = 0;
    let autoplayId = null;

    const dots = slides.map((slide, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "quote-dot";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `Show testimonial ${i + 1} of ${total}`);
      dot.addEventListener("click", () => {
        goTo(i);
        restart();
      });
      dotsWrap.appendChild(dot);
      return dot;
    });

    const update = () => {
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((dot, i) => {
        const active = i === index;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-selected", String(active));
      });
      slides.forEach((slide, i) => {
        slide.setAttribute("aria-hidden", String(i !== index));
      });
    };

    const goTo = (next) => {
      index = (next + total) % total;
      update();
    };

    const stop = () => {
      if (autoplayId) {
        clearInterval(autoplayId);
        autoplayId = null;
      }
    };

    const play = () => {
      stop();
      if (prefersReducedMotion || total < 2) return;
      autoplayId = setInterval(() => goTo(index + 1), 6500);
    };

    const restart = () => {
      stop();
      play();
    };

    prevBtn.addEventListener("click", () => {
      goTo(index - 1);
      restart();
    });
    nextBtn.addEventListener("click", () => {
      goTo(index + 1);
      restart();
    });

    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", play);
    slider.addEventListener("focusin", stop);
    slider.addEventListener("focusout", (e) => {
      if (!slider.contains(e.relatedTarget)) play();
    });

    slider.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        goTo(index - 1);
        restart();
      } else if (e.key === "ArrowRight") {
        goTo(index + 1);
        restart();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else play();
    });

    let touchStartX = 0;
    slider.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].clientX;
      },
      { passive: true }
    );
    slider.addEventListener(
      "touchend",
      (e) => {
        const delta = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(delta) < 45) return;
        goTo(delta < 0 ? index + 1 : index - 1);
        restart();
      },
      { passive: true }
    );

    update();
    play();
  }

  /* ---------------------------------------------------------
     Contact form
     --------------------------------------------------------- */
  const form = $("#contactForm");
  const status = $("#formStatus");

  if (form && status) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    const fields = {
      name: $("#name", form),
      email: $("#email", form),
      message: $("#message", form),
    };

    const setError = (field, message) => {
      if (!field) return;
      const wrap = field.closest(".field");
      const errorEl = $(`[data-error-for="${field.id}"]`, form);
      if (wrap) wrap.classList.toggle("has-error", Boolean(message));
      if (errorEl) errorEl.textContent = message || "";
    };

    const validate = () => {
      let valid = true;
      const name = fields.name.value.trim();
      const email = fields.email.value.trim();
      const message = fields.message.value.trim();

      if (name.length < 2) {
        setError(fields.name, "Please enter your name.");
        valid = false;
      } else {
        setError(fields.name, "");
      }

      if (!emailPattern.test(email)) {
        setError(fields.email, "Please enter a valid email address.");
        valid = false;
      } else {
        setError(fields.email, "");
      }

      if (message.length < 10) {
        setError(fields.message, "Tell us a little more (at least 10 characters).");
        valid = false;
      } else {
        setError(fields.message, "");
      }

      return valid;
    };

    Object.values(fields).forEach((field) => {
      if (!field) return;
      field.addEventListener("input", () => {
        if (field.closest(".field")?.classList.contains("has-error")) {
          setError(field, "");
        }
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      status.hidden = true;

      if (!validate()) {
        const firstError = $(".field.has-error input, .field.has-error textarea", form);
        if (firstError) firstError.focus();
        return;
      }

      const submitBtn = $('button[type="submit"]', form);
      const originalLabel = submitBtn ? submitBtn.textContent : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending…";
      }

      const name = fields.name.value.trim().split(" ")[0];

      window.setTimeout(() => {
        status.hidden = false;
        status.textContent = `Thank you, ${name}! Your enquiry has been received. This is a demo form — in a live site it would email the studio.`;
        form.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        }
      }, 750);
    });
  }

  /* ---------------------------------------------------------
     Footer year
     --------------------------------------------------------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
