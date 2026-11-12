import { gsap } from "gsap";

export function initSlider() {
  const card = document.querySelector("[data-feature-card]");
  if (!card) return;

  const slides = [...card.querySelectorAll("[data-slide]")];
  const art = card.querySelector("[data-feature-art]");
  const bankCards = [...card.querySelectorAll("[data-bank-card]")];
  const list = card.querySelector("[data-slides]");
  const dotsBox = card.querySelector("[data-dots]");
  if (!slides.length) return;

  let current = 0;
  let tl = null;

  function updateCards(slide) {
    if (!art) return;
    const { cardName, cardExp, cardTheme } = slide.dataset;

    if (cardName)
      art
        .querySelectorAll("[data-card-name]")
        .forEach((el) => (el.textContent = cardName));
    if (cardExp)
      art
        .querySelectorAll("[data-card-exp]")
        .forEach((el) => (el.textContent = cardExp));
    if (cardTheme) art.dataset.theme = cardTheme;
  }

  slides[0].classList.add("is-active");
  list?.setAttribute("data-ready", "");
  updateCards(slides[0]);

  if (slides.length < 2) return;

  const label = dotsBox?.dataset.dotLabel || "Slide";
  const dots = slides.map((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "dot";
    dot.setAttribute("aria-label", `${label} ${i + 1}`);
    dot.setAttribute("data-dot", "");
    dot.addEventListener("click", () => show(i));
    dotsBox?.append(dot);
    return dot;
  });

  function markDots(index) {
    dots.forEach((dot, i) => {
      dot.classList.toggle("dot-active", i === index);
      if (i === index) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
  }

  markDots(0);

  function show(index) {
    if (index === current || index < 0 || index >= slides.length) return;

    const prev = slides[current];
    const next = slides[index];
    const dir = index > current ? 1 : -1;
    current = index;

    markDots(index);

    tl?.progress(1);

    const swap = () => {
      prev.classList.remove("is-active");
      next.classList.add("is-active");
      updateCards(next);
    };

    const animate = matchMedia(
      "(prefers-reduced-motion: no-preference)",
    ).matches;
    if (!animate) return swap();

    tl = gsap
      .timeline()
      .to(prev, {
        x: -60 * dir,
        autoAlpha: 0,
        duration: 0.45,
        ease: "power2.in",
      })
      .to(
        bankCards,
        {
          yPercent: 25,
          autoAlpha: 0,
          duration: 0.45,
          stagger: 0.06,
          ease: "power2.in",
        },
        0,
      )
      .add(() => {
        swap();
        gsap.set(prev, { clearProps: "transform,opacity,visibility" });
      })
      .fromTo(
        next,
        { x: 60 * dir, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.7, ease: "power3.out" },
      )
      .fromTo(
        bankCards,
        { yPercent: -25, autoAlpha: 0 },
        {
          yPercent: 0,
          autoAlpha: 1,
          duration: 0.9,
          stagger: 0.08,
          ease: "expo.out",
        },
        "<",
      );
  }

  let startX = null;

  card.addEventListener("pointerdown", (e) => (startX = e.clientX));
  window.addEventListener("pointerup", (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (dx < -50) show(current + 1);
    if (dx > 50) show(current - 1);
  });

  card.addEventListener("dragstart", (e) => e.preventDefault());
}
