import { gsap } from "gsap";

let signal;

export function initHover(heroIntro) {
  const controller = new AbortController();
  signal = controller.signal;

  arrows();
  playButton();
  heroIntro.then(() => {
    if (controller.signal.aborted) return;
    tiltHeroCards();
  });
  shiftBankCards();

  return () => controller.abort();
}

const on = (el, type, fn) => el.addEventListener(type, fn, { signal });

function arrows() {
  document.querySelectorAll("[data-hero-cta], .link-arrow").forEach((link) => {
    const arrow = link.querySelector("[aria-hidden]");
    if (!arrow) return;

    on(link, "pointerenter", () =>
      gsap.to(arrow, {
        x: 16,
        duration: 0.5,
        ease: "power3.out",
        overwrite: "auto",
      }),
    );
    on(link, "pointerleave", () =>
      gsap.to(arrow, {
        x: 0,
        duration: 0.5,
        ease: "power3.out",
        overwrite: "auto",
      }),
    );
  });
}

function playButton() {
  const play = document.querySelector("[data-play]");
  if (!play) return;

  const spin = gsap.getTweensOf(play.querySelector("[data-play-text]"))[0];
  const icon = play.querySelector("[data-play-icon]");

  on(play, "pointerenter", () => {
    if (spin)
      gsap.to(spin, { timeScale: 5, duration: 0.6, ease: "power2.out" });
    gsap.to(icon, {
      scale: 1.35,
      duration: 0.5,
      ease: "back.out(3)",
      overwrite: "auto",
    });
  });

  on(play, "pointerleave", () => {
    if (spin)
      gsap.to(spin, { timeScale: 1, duration: 1.2, ease: "power2.out" });
    gsap.to(icon, {
      scale: 1,
      duration: 0.5,
      ease: "power3.out",
      overwrite: "auto",
    });
  });
}

function tiltHeroCards() {
  document.querySelectorAll("[data-hero-card]").forEach((card) => {
    gsap.set(card, { transformPerspective: 900 });
    const rx = gsap.quickTo(card, "rotationX", {
      duration: 0.6,
      ease: "power3.out",
    });
    const ry = gsap.quickTo(card, "rotationY", {
      duration: 0.6,
      ease: "power3.out",
    });
    const lift = gsap.quickTo(card, "y", { duration: 0.6, ease: "power3.out" });

    on(card, "pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      ry(px * 16);
      rx(-py * 16);
      lift(-18);
    });

    on(card, "pointerleave", () => {
      rx(0);
      ry(0);
      lift(0);
    });
  });
}

function shiftBankCards() {
  const area = document.querySelector("[data-feature-card]");
  if (!area) return;

  const cards = gsap.utils.toArray("[data-bank-card]", area).map((card, i) => ({
    depth: i === 0 ? 14 : 26,
    x: gsap.quickTo(card, "x", { duration: 0.8, ease: "power3.out" }),
    y: gsap.quickTo(card, "y", { duration: 0.8, ease: "power3.out" }),
  }));

  on(area, "pointermove", (e) => {
    const r = area.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    cards.forEach((c) => {
      c.x(px * c.depth * 2);
      c.y(py * c.depth * 2);
    });
  });

  on(area, "pointerleave", () => {
    cards.forEach((c) => {
      c.x(0);
      c.y(0);
    });
  });
}
