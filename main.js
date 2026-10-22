/* =========================================================
   Sujjal Reddy Vanga — portfolio interactions (GSAP)
   ========================================================= */
(() => {
  gsap.registerPlugin(ScrollTrigger);

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  $(".year").textContent = new Date().getFullYear();

  /* ---------- text splitting ---------- */
  function splitChars(el) {
    const text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    el.textContent = "";
    text.split(" ").forEach((w, i, arr) => {
      const word = document.createElement("span");
      word.className = "word";
      word.setAttribute("aria-hidden", "true");
      [...w].forEach((c) => {
        const ch = document.createElement("span");
        ch.className = "char";
        ch.textContent = c;
        word.appendChild(ch);
      });
      el.appendChild(word);
      if (i < arr.length - 1) el.appendChild(document.createTextNode(" "));
    });
  }

  // splits text nodes into word spans, keeping inline tags like <em>
  function splitWords(el) {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) return frag.appendChild(document.createTextNode(part));
            const s = document.createElement("span");
            s.className = "w";
            s.textContent = part;
            frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    return $$(".w", el);
  }

  $$("[data-split]").forEach(splitChars);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.09 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id === "#top" ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.6 });
      else if (target === 0) window.scrollTo({ top: 0, behavior: "smooth" });
      else target.scrollIntoView({ behavior: "smooth" });
    })
  );

  /* ---------- live timecode (24fps) ---------- */
  const tc = $(".nav__tc");
  const t0 = performance.now();
  const pad = (n) => String(n).padStart(2, "0");
  gsap.ticker.add(() => {
    const f = Math.floor(((performance.now() - t0) / 1000) * 24);
    tc.textContent = [Math.floor(f / 86400), Math.floor(f / 1440) % 60, Math.floor(f / 24) % 60, f % 24].map(pad).join(":");
  });

  /* ---------- loader ---------- */
  function scramble(el, duration) {
    const final = el.textContent;
    const pool = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*/<>0123456789";
    const p = { v: 0 };
    return gsap.to(p, {
      v: 1,
      duration,
      ease: "none",
      onUpdate() {
        const n = Math.floor(p.v * final.length);
        el.textContent = [...final].map((ch, i) => (i < n || ch === " " ? ch : pool[(Math.random() * pool.length) | 0])).join("");
      },
    });
  }

  const countEl = $(".loader__count");
  const counter = { v: 0 };
  const renderCount = () => (countEl.textContent = String(Math.round(counter.v)).padStart(3, "0"));

  const pageLoaded = new Promise((r) => (document.readyState === "complete" ? r() : window.addEventListener("load", r, { once: true })));
  const ready = Promise.race([
    Promise.all([document.fonts ? document.fonts.ready : null, pageLoaded]),
    new Promise((r) => setTimeout(r, 5000)),
  ]);

  function unlockScroll() {
    document.body.classList.remove("is-loading");
    if (lenis) lenis.start();
    ScrollTrigger.refresh();
  }

  if (reduce) {
    gsap.set(".loader", { display: "none" });
    unlockScroll();
  } else {
    const loadTl = gsap.timeline();
    loadTl
      .add(scramble($(".loader__scramble"), 1.2), 0)
      .to(counter, { v: 84, duration: 1.7, ease: "power2.out", onUpdate: renderCount }, 0)
      .to(".loader__bar i", { scaleX: 0.84, duration: 1.7, ease: "power2.out" }, 0);

    ready.then(() =>
      loadTl.then(() => {
        gsap
          .timeline()
          .to(counter, { v: 100, duration: 0.5, ease: "power1.inOut", onUpdate: renderCount })
          .to(".loader__bar i", { scaleX: 1, duration: 0.5, ease: "power1.inOut" }, "<")
          .to(".loader__box", { y: -24, opacity: 0, duration: 0.5, ease: "power2.in" }, "+=0.15")
          .to(".loader", { clipPath: "inset(0% 0% 100% 0%)", duration: 1.1, ease: "expo.inOut" }, "-=0.1")
          .set(".loader", { display: "none" })
          .add(intro(), "-=0.75");
      })
    );
  }

  /* ---------- hero intro ---------- */
  function intro() {
    return gsap
      .timeline({ onStart: unlockScroll })
      .fromTo(".hero__portrait", { clipPath: "inset(50% 50% 50% 50%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut" }, 0)
      .from(".hero__portrait img", { scale: 1.6, duration: 2, ease: "expo.out" }, 0.25)
      .from(".hero__line .char", { yPercent: 115, duration: 1.2, ease: "expo.out", stagger: 0.04 }, 0.4)
      .fromTo(".float", { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "expo.inOut", stagger: 0.14 }, 0.7)
      .from(".float img", { scale: 1.5, duration: 1.6, ease: "expo.out", stagger: 0.14 }, 0.8)
      .from(".nav > *", { y: -30, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08 }, 1)
      .from(".vf", { opacity: 0, scale: 0.3, duration: 0.7, ease: "back.out(2)", stagger: 0.06 }, 1.1)
      .from(".hero__bottom", { borderTopColor: "rgba(239,232,220,0)", duration: 0.8 }, 1.2)
      .from(".hero__bottom > *", { y: 26, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.1 }, 1.2);
  }

  // bouncing arrow on the CTA
  gsap.to(".hero__cta .arrow", { y: 5, duration: 0.7, ease: "sine.inOut", repeat: -1, yoyo: true });

  /* ---------- hero: mouse parallax + scroll ---------- */
  if (finePointer && !reduce) {
    const floats = $$(".float").map((el) => ({
      d: parseFloat(el.dataset.depth),
      x: gsap.quickTo(el, "x", { duration: 1.2, ease: "power3" }),
      y: gsap.quickTo(el, "y", { duration: 1.2, ease: "power3" }),
    }));
    const px = gsap.quickTo(".hero__portrait img", "x", { duration: 1.4, ease: "power3" });
    const py = gsap.quickTo(".hero__portrait img", "y", { duration: 1.4, ease: "power3" });
    $(".hero").addEventListener("mousemove", (e) => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      floats.forEach((f) => {
        f.x(nx * 60 * f.d);
        f.y(ny * 50 * f.d);
      });
      px(nx * -18);
      py(ny * -12);
    });
  }

  gsap
    .timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } })
    .to(".hero__line--1", { xPercent: -40, ease: "none" }, 0)
    .to(".hero__line--3", { xPercent: 40, ease: "none" }, 0)
    .to(".hero__title", { yPercent: 60, opacity: 0.2, ease: "none" }, 0)
    .to(".hero__portrait", { scale: 1.18, yPercent: 8, ease: "none" }, 0)
    .to(".float--a", { yPercent: -140, ease: "none" }, 0)
    .to(".float--b", { yPercent: -70, ease: "none" }, 0)
    .to(".float--c", { yPercent: -180, ease: "none" }, 0);

  /* ---------- marquee (reacts to scroll velocity) ---------- */
  const mInner = $(".marquee__inner");
  mInner.innerHTML += mInner.innerHTML;
  const loop = gsap.to(mInner, { xPercent: -50, duration: 26, ease: "none", repeat: -1 });
  loop.totalTime(loop.duration() * 100); // lets it run backwards too
  ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate(self) {
      const dir = self.direction;
      const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 250, 6);
      gsap.to(loop, {
        timeScale: dir * boost,
        duration: 0.15,
        overwrite: true,
        onComplete: () => gsap.to(loop, { timeScale: dir, duration: 1.2, ease: "power2.out" }),
      });
    },
  });

  /* ---------- generic reveals ---------- */
  $$(".label-row").forEach((row) =>
    gsap.from(row.children, {
      y: 16,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
      stagger: 0.1,
      scrollTrigger: { trigger: row, start: "top 88%" },
    })
  );

  $$(".work__title, .exp__title, .contact__title").forEach((title) =>
    gsap.from($$(".reveal-line > span", title), {
      yPercent: 110,
      rotate: 3,
      duration: 1.2,
      ease: "expo.out",
      stagger: 0.1,
      scrollTrigger: { trigger: title, start: "top 85%" },
    })
  );

  // words light up as you scroll past
  $$("[data-words]").forEach((el) => {
    const words = splitWords(el);
    gsap.fromTo(
      words,
      { opacity: 0.12 },
      { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 50%", scrub: true } }
    );
  });

  /* ---------- about ---------- */
  gsap.fromTo(
    ".about__img",
    { clipPath: "inset(100% 0% 0% 0%)" },
    { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: ".about__img", start: "top 80%" } }
  );
  gsap.fromTo(
    ".about__img img",
    { yPercent: -16 },
    { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".about__img", start: "top bottom", end: "bottom top", scrub: true } }
  );
  $$(".count").forEach((el) => {
    const o = { v: 0 };
    gsap.to(o, {
      v: +el.dataset.to,
      duration: 1.6,
      ease: "power2.out",
      onUpdate: () => (el.textContent = String(Math.round(o.v)).padStart(2, "0")),
      scrollTrigger: { trigger: el, start: "top 90%" },
    });
  });
  gsap.from(".about__stats > div", {
    y: 40,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
    stagger: 0.12,
    scrollTrigger: { trigger: ".about__stats", start: "top 90%" },
  });

  /* ---------- selected work ---------- */
  const mm = gsap.matchMedia();

  mm.add("(min-width: 900px)", () => {
    const track = $(".work__track");
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    gsap.to(track, {
      x: () => -dist(),
      ease: "none",
      scrollTrigger: {
        trigger: ".work__pin",
        start: "top top",
        end: () => "+=" + dist(),
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => gsap.set(".work__progress i", { scaleX: self.progress }),
      },
    });

    gsap.from(".card", {
      y: 90,
      opacity: 0,
      duration: 1.2,
      ease: "expo.out",
      stagger: 0.08,
      scrollTrigger: { trigger: ".work", start: "top 55%" },
    });
  });

  mm.add("(max-width: 899px)", () => {
    $$(".card").forEach((card) =>
      gsap.from(card, { y: 60, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: card, start: "top 90%" } })
    );
  });

  /* ---------- craft ---------- */
  gsap.from(".craft__row", {
    y: 70,
    opacity: 0,
    duration: 1.1,
    ease: "expo.out",
    stagger: 0.12,
    scrollTrigger: { trigger: ".craft__list", start: "top 80%" },
  });

  if (finePointer) {
    const prev = $(".craft__preview");
    const imgs = $$("img", prev);
    const xTo = gsap.quickTo(prev, "x", { duration: 0.7, ease: "power3" });
    const yTo = gsap.quickTo(prev, "y", { duration: 0.7, ease: "power3" });
    const rTo = gsap.quickTo(prev, "rotation", { duration: 0.8, ease: "power3" });
    let lastX = 0;
    window.addEventListener("mousemove", (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
      rTo(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * 0.6));
      lastX = e.clientX;
    });
    $$(".craft__row").forEach((row) => {
      const i = +row.dataset.img;
      row.addEventListener("mouseenter", () => {
        imgs.forEach((im, j) => gsap.to(im, { opacity: j === i ? 1 : 0, duration: 0.4 }));
        gsap.fromTo(imgs[i], { scale: 1.3 }, { scale: 1, duration: 0.9, ease: "expo.out" });
        gsap.to(prev, { scale: 1, duration: 0.6, ease: "expo.out" });
      });
      row.addEventListener("mouseleave", () => gsap.to(prev, { scale: 0, duration: 0.45, ease: "power3.in" }));
    });
  } else {
    // touch: fill each discipline as it crosses the middle of the screen
    $$(".craft__row").forEach((row) =>
      ScrollTrigger.create({ trigger: row, start: "top 60%", end: "bottom 40%", toggleClass: "is-filled" })
    );
  }

  /* ---------- experience + resume ---------- */
  $$(".exp__col").forEach((col) =>
    gsap.from(col.querySelectorAll(".exp__heading, .exp__item, .edu__item"), {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: "expo.out",
      stagger: 0.1,
      scrollTrigger: { trigger: col, start: "top 82%" },
    })
  );
  gsap.from(".tools__label, .tools__list li", {
    y: 24,
    opacity: 0,
    scale: 0.9,
    duration: 0.7,
    ease: "back.out(2)",
    stagger: 0.07,
    scrollTrigger: { trigger: ".tools", start: "top 90%" },
  });

  const resume = $(".resume");
  gsap.fromTo(
    resume,
    { clipPath: "inset(0% 100% 0% 0%)" },
    {
      clipPath: "inset(0% 0% 0% 0%)",
      duration: 1.4,
      ease: "expo.inOut",
      scrollTrigger: { trigger: resume, start: "top 88%" },
      onComplete: () => gsap.set(resume, { clearProps: "clipPath" }),
    }
  );
  gsap.from(".resume__title > span", { yPercent: 100, duration: 1.2, ease: "expo.out", delay: 0.5, scrollTrigger: { trigger: resume, start: "top 88%" } });
  // arrow drops out the bottom and comes back in from the top
  const resumeArrow = $(".resume__icon span");
  resume.addEventListener("mouseenter", () =>
    gsap
      .timeline({ overwrite: true })
      .to(resumeArrow, { yPercent: 160, duration: 0.3, ease: "power2.in" })
      .fromTo(resumeArrow, { yPercent: -160 }, { yPercent: 0, duration: 0.5, ease: "expo.out" })
  );

  /* ---------- contact + footer ---------- */
  gsap.from(".contact__mail", {
    y: 40,
    opacity: 0,
    duration: 1,
    ease: "power3.out",
    scrollTrigger: { trigger: ".contact__mail", start: "top 92%" },
  });
  gsap.from(".contact__item", {
    y: 50,
    opacity: 0,
    duration: 1,
    ease: "expo.out",
    stagger: 0.08,
    scrollTrigger: { trigger: ".contact__grid", start: "top 92%" },
  });
  gsap.from(".footer__brand .char", {
    yPercent: 105,
    duration: 1.1,
    ease: "expo.out",
    stagger: 0.035,
    scrollTrigger: { trigger: ".footer", start: "top 92%" },
  });

  /* ---------- magnetic elements ---------- */
  if (finePointer) {
    $$("[data-magnetic]").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.35);
        yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener("mouseleave", () => {
        xTo(0);
        yTo(0);
      });
    });
  }

  /* ---------- custom cursor ---------- */
  const cursor = $(".cursor");
  const cursorLabel = $(".cursor__label");
  if (finePointer) {
    document.documentElement.classList.add("has-cursor");
    gsap.set(cursor, { scale: 0.18 });
    const cx = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
    const cy = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });
    window.addEventListener("mousemove", (e) => {
      cx(e.clientX);
      cy(e.clientY);
    });

    $$("a, button").forEach((el) => {
      el.addEventListener("mouseenter", () => gsap.to(cursor, { scale: 0.45, duration: 0.35, ease: "power3.out" }));
      el.addEventListener("mouseleave", () => gsap.to(cursor, { scale: 0.18, duration: 0.35, ease: "power3.out" }));
    });

    $$(".card").forEach((card) => {
      card.addEventListener("mouseenter", () => {
        cursorLabel.textContent = card.dataset.video ? "Play" : "Request";
        cursor.classList.add("is-play");
        gsap.to(cursor, { scale: 1, duration: 0.5, ease: "expo.out" });
        gsap.to(cursorLabel, { opacity: 1, duration: 0.3, delay: 0.1 });
        gsap.to($(".card__media img", card), { scale: 1.03, duration: 1, ease: "expo.out" });
      });
      card.addEventListener("mouseleave", () => {
        cursor.classList.remove("is-play");
        gsap.to(cursor, { scale: 0.18, duration: 0.4, ease: "power3.out" });
        gsap.to(cursorLabel, { opacity: 0, duration: 0.15 });
        gsap.to($(".card__media img", card), { scale: 1, duration: 1, ease: "expo.out" });
      });
    });
  }

  /* ---------- film lightbox ---------- */
  const lb = $(".lightbox");
  const frame = $(".lightbox__frame");

  function openFilm(id) {
    frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1" title="Film player" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    if (lenis) lenis.stop();
    gsap.set(lb, { visibility: "visible" });
    gsap.fromTo(lb, { clipPath: "inset(50% 0% 50% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "expo.inOut" });
    gsap.fromTo(frame, { scale: 0.88, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9, delay: 0.35, ease: "expo.out" });
    gsap.fromTo(".lightbox__close", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.5 });
  }

  function closeFilm() {
    gsap.to(lb, {
      clipPath: "inset(50% 0% 50% 0%)",
      duration: 0.7,
      ease: "expo.inOut",
      onComplete() {
        frame.innerHTML = "";
        gsap.set(lb, { visibility: "hidden" });
        if (lenis) lenis.start();
      },
    });
  }

  $$(".card").forEach((card) =>
    card.addEventListener("click", () => {
      if (card.dataset.video) openFilm(card.dataset.video);
      else window.location.href = `mailto:sujjalreddyv@gmail.com?subject=${encodeURIComponent("Screening request: " + card.dataset.mail)}`;
    })
  );
  $(".lightbox__close").addEventListener("click", closeFilm);
  lb.addEventListener("click", (e) => e.target === lb && closeFilm());
  window.addEventListener("keydown", (e) => e.key === "Escape" && lb.style.visibility === "visible" && closeFilm());

  // keyboard access for cards
  $$(".card").forEach((card) => {
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), card.click()));
  });
})();
