/* /js/core.js - drop into /js/core.js
   Site core: menu toggle, nav dropdowns, faq, simple slider, safe swiper loader,
   affiliate lazy-loader, auto-load page-specific JS.
   Load it with: <script defer src="/js/core.js"></script>
*/

(function () {
  "use strict";

  /* ---------- UTILITIES ---------- */
  function safeQuery(selector) {
    try {
      return document.querySelector(selector);
    } catch (e) {
      return null;
    }
  }
  function safeQueryAll(selector) {
    try {
      return Array.from(document.querySelectorAll(selector));
    } catch (e) {
      return [];
    }
  }

  /* ---------- MENU TOGGLE (mobile) ---------- */
  function initMenuToggle() {
    const btn = safeQuery("#menuToggle");
    if (!btn) return;
    const target = safeQuery("#subButtons");
    btn.addEventListener("click", function () {
      if (target) target.classList.toggle("show");
      btn.classList.toggle("open");
    });
  }

  /* ---------- NAV DROPDOWN (mobile accordion behavior) ---------- */
  function initNavDropdowns() {
    const dropdownParents = safeQueryAll(".navMenu > li");
    if (!dropdownParents.length) return;
    dropdownParents.forEach((item) => {
      const link = item.querySelector("a");
      const submenu = item.querySelector(".dropdown_menu");
      if (submenu && link) {
        link.addEventListener("click", function (e) {
          if (window.innerWidth <= 1188) {
            e.preventDefault();
            item.classList.toggle("active");
            // close others
            dropdownParents.forEach((other) => {
              if (other !== item) other.classList.remove("active");
            });
          }
        });
      }
    });
  }

  /* ---------- FAQ TOGGLE ---------- */
  function initFaqs() {
    const faqItems = safeQueryAll(".faq-item");
    if (!faqItems.length) return;
    faqItems.forEach((item) => {
      const question = item.querySelector(".faq-question");
      if (!question) return;
      question.addEventListener("click", () => {
        faqItems.forEach((i) => {
          if (i !== item) {
            i.classList.remove("active");
            const q = i.querySelector(".faq-question");
            if (q) q.setAttribute("aria-expanded", "false");
          }
        });
        const isActive = item.classList.contains("active");
        item.classList.toggle("active");
        question.setAttribute("aria-expanded", String(!isActive));
      });
    });
  }

  /* ---------- SIMPLE SLIDER for .tes-slide (used on multiple pages) ---------- */
  function initTesSlider() {
    const slides = safeQueryAll(".tes-slide");
    if (!slides.length) return;
    const dotsContainer = safeQuery(".tes-dots");
    if (!dotsContainer) return;

    let currentIndex = 0;
    let timer;

    // create dots
    slides.forEach((_, index) => {
      const dot = document.createElement("span");
      dot.setAttribute("role", "button");
      dot.addEventListener("click", () => showSlide(index));
      dotsContainer.appendChild(dot);
    });
    const dots = Array.from(dotsContainer.querySelectorAll("span"));

    function showSlide(index) {
      slides.forEach((slide, i) => {
        slide.classList.toggle("active", i === index);
        if (dots[i]) dots[i].classList.toggle("active", i === index);
      });
      currentIndex = index;
    }
    function nextSlide() {
      showSlide((currentIndex + 1) % slides.length);
    }
    function autoSlide() {
      timer = setInterval(nextSlide, 5000);
    }
    // next/prev controls if present
    const nextBtn = safeQuery(".tes-next");
    const prevBtn = safeQuery(".tes-prev");
    if (nextBtn) nextBtn.addEventListener("click", nextSlide);
    if (prevBtn)
      prevBtn.addEventListener("click", () =>
        showSlide((currentIndex - 1 + slides.length) % slides.length)
      );

    autoSlide();
    showSlide(currentIndex);
  }

  /* ---------- SWIPER: load lib once and initialize any swiper elements ---------- */
  let _swiperLoading = false;
  let _swiperLoaded = false;

  function loadSwiperOnceAndInit() {
    // find any swiper containers on the page
    const hasFlight = !!safeQuery(".flight-swiper");
    const hasCategories = !!safeQuery(".categories-swiper");
    const hasAny =
      hasFlight || hasCategories || !!safeQuery(".swiper-container");
    if (!hasAny) return;

    if (_swiperLoaded) {
      // library already loaded earlier - call init
      initSwipers();
      return;
    }
    if (_swiperLoading) return; // already in-progress

    _swiperLoading = true;
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js";
    s.async = true;
    s.onload = function () {
      _swiperLoaded = true;
      _swiperLoading = false;
      initSwipers();
    };
    s.onerror = function () {
      _swiperLoading = false;
      console.warn("Failed to load Swiper library.");
    };
    document.body.appendChild(s);
  }

  function initSwipers() {
    if (typeof Swiper === "undefined") return;
    try {
      if (document.querySelector(".flight-swiper")) {
        new Swiper(".flight-swiper", {
          slidesPerView: 1.2,
          spaceBetween: 20,
          loop: false,
          navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          },
          breakpoints: {
            640: { slidesPerView: 1.5 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          },
        });
      }
    } catch (e) {
      console.warn("flight-swiper init error:", e);
    }

    try {
      if (document.querySelector(".categories-swiper")) {
        new Swiper(".categories-swiper", {
          slidesPerView: 3,
          spaceBetween: 10,
          loop: true,
          autoplay: { delay: 3000, disableOnInteraction: false },
          pagination: {
            el: ".categories-swiper .categories-pagination",
            clickable: true,
          },
          navigation: {
            nextEl: ".categories-swiper .categories-next",
            prevEl: ".categories-swiper .categories-prev",
          },
          breakpoints: {
            1024: { slidesPerView: 3 },
            768: { slidesPerView: 2 },
            0: { slidesPerView: 1 },
          },
        });
      }
    } catch (e) {
      console.warn("categories-swiper init error:", e);
    }
  }

  function initAffiliatePlaceholders() {
    const placeholders = Array.from(
      document.querySelectorAll(".affiliate-placeholder[data-affiliate-url]")
    );
    if (!placeholders.length) return;

    const loaded = new Set();

    function loadScriptOnce(url, id, cb) {
      if (!url) {
        if (cb) cb(new Error("no-url"));
        return;
      }
      if (id && document.getElementById(id)) {
        if (cb) cb();
        return;
      }
      if (loaded.has(url)) {
        if (cb) cb();
        return;
      }
      const s = document.createElement("script");
      s.src = url;
      s.async = true;
      if (id) s.id = id;
      s.onload = function () {
        loaded.add(url);
        if (cb) cb();
      };
      s.onerror = function () {
        console.warn("Affiliate script failed to load:", url);
        if (cb) cb(new Error("load-error"));
      };
      document.body.appendChild(s);
    }

    function initFor(el) {
      if (!el || el.dataset.loaded) return;
      const url = el.dataset.affiliateUrl;
      const id = "aff-" + (url || "").replace(/[^a-z0-9]/gi, "").slice(0, 30);
      loadScriptOnce(url, id, function (err) {
        if (err) {
          el.dataset.loaded = "error";
          return;
        }
        // common vendor init attempts:
        try {
          if (window.egWidgets && typeof window.egWidgets.init === "function")
            window.egWidgets.init();
        } catch (e) {}
        try {
          if (window.EGWidgets && typeof window.EGWidgets.init === "function")
            window.EGWidgets.init();
        } catch (e) {}
        // generic fallback event dispatch
        try {
          document.dispatchEvent(new Event("affiliate-script-loaded"));
        } catch (e) {}
        el.dataset.loaded = "1";
      });
    }

    // IntersectionObserver to trigger load early
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              initFor(entry.target);
              obs.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "800px" }
      ); // bigger margin to load earlier
      placeholders.forEach((p) => io.observe(p));
    }

    // fallback: load on first user interaction or after short timeout
    let activated = false;
    function activateAll() {
      if (activated) return;
      activated = true;
      placeholders.forEach(initFor);
      window.removeEventListener("scroll", activateAll);
      window.removeEventListener("mousemove", activateAll);
      window.removeEventListener("touchstart", activateAll);
    }
    window.addEventListener("scroll", activateAll, {
      passive: true,
      once: true,
    });
    window.addEventListener("mousemove", activateAll, { once: true });
    window.addEventListener("touchstart", activateAll, { once: true });
    setTimeout(activateAll, 2500); // fallback auto-load after 2.5s
  }

  /* ---------- IMAGE LAZY LOADER (data-src / data-srcset) ---------- */
  function swapDataSrc(img) {
    if (!img) return;
    if (img.dataset.src) img.src = img.dataset.src;
    if (img.dataset.srcset) img.srcset = img.dataset.srcset;
    img.removeAttribute("data-src");
    img.removeAttribute("data-srcset");
  }
  function initLazyImages() {
    const imgs = safeQueryAll("img[data-src], img[data-srcset]");
    if (!imgs.length) return;
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              swapDataSrc(e.target);
              obs.unobserve(e.target);
            }
          });
        },
        { rootMargin: "200px" }
      );
      imgs.forEach((i) => io.observe(i));
    } else {
      setTimeout(() => imgs.forEach(swapDataSrc), 500);
    }
  }

  /* ---------- AUTO-LOAD PAGE SCRIPT: body data-page="blogs" => /js/page-blogs.js ---------- */
  function loadPageScript() {
    const body = document.body;
    if (!body) return;
    const page = body.dataset.page;
    if (!page) return;
    const src = "/js/page-" + page + ".js";
    // create script tag (deferred)
    const s = document.createElement("script");
    s.src = src;
    s.defer = true;
    s.onerror = function () {
      /* silent if missing */
    };
    document.body.appendChild(s);
  }

  /* ---------- HERO SLIDER (simple auto-rotate) ---------- */
  function initHeroSlider() {
    const slides = document.querySelectorAll(".slide");
    if (!slides.length) return;

    let current = 0;
    const delay = 10000; // 10 seconds

    setInterval(() => {
      slides[current].classList.remove("active");
      current = (current + 1) % slides.length;
      slides[current].classList.add("active");
    }, delay);
  }

  /* ---------- NEWSLETTER POPUP ---------- */
  function initNewsletterPopup() {
    const popup = document.getElementById("newsletterPopup");
    if (!popup) return;

    const closeBtn = popup.querySelector(".popup-close");
    const form = document.getElementById("newsletterForm");

    let popupShown = false;

    // Don’t show if user has already dismissed
    if (localStorage.getItem("hideNewsletterPopup") === "1") {
      return;
    }

    function showPopup() {
      if (popupShown) return;
      popup.classList.add("show");
      popup.setAttribute("aria-hidden", "false");
      popupShown = true;
    }

    // Show popup after 30s (instead of 5min for better engagement)
    const timer = setTimeout(showPopup, 30000);

    // Exit intent (desktop only)
    document.addEventListener("mouseleave", (e) => {
      if (e.clientY <= 50) {
        showPopup();
        clearTimeout(timer);
      }
    });

    function closePopup() {
      popup.classList.remove("show");
      popup.setAttribute("aria-hidden", "true");
      localStorage.setItem("hideNewsletterPopup", "1");
    }

    closeBtn.addEventListener("click", closePopup);

    popup.addEventListener("click", (e) => {
      if (e.target === popup) closePopup();
    });

    form.addEventListener("submit", () => {
      localStorage.setItem("hideNewsletterPopup", "1");
      setTimeout(closePopup, 1500);
    });
  }

  // travel ads like
  document.addEventListener("DOMContentLoaded", function () {
    const phrases = [
      "Which Destination Should I Visit This Month?",
      "Where Should You Travel Next?",
      "What is the Best Place to Visit This Week?",
      "Plan Your Dream Vacation Now!",
    ];

    const heading = document.getElementById("travel-ad-heading");
    if (!heading) return;

    let phraseIndex = 0;
    const animationDuration = 4000; // match CSS animation duration

    function showNextPhrase() {
      // Update text
      heading.textContent = phrases[phraseIndex];

      // Reset animation
      heading.style.animation = "none";
      // Trigger reflow to restart animation
      void heading.offsetWidth;
      heading.style.animation = `fadeUpPhrase ${
        animationDuration / 1000
      }s ease forwards`;

      // Move to next phrase
      phraseIndex = (phraseIndex + 1) % phrases.length;
      setTimeout(showNextPhrase, animationDuration);
    }

    showNextPhrase();
  });

  /* ---------- DOM READY ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    initMenuToggle();
    initNavDropdowns();
    initFaqs();
    initTesSlider();
    initAffiliatePlaceholders();
    initLazyImages();
    loadPageScript();
    // Swiper: only load if any swiper is present
    loadSwiperOnceAndInit();
    initHeroSlider();
    initNewsletterPopup();
  });
})();
