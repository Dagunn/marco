import { gsap } from "gsap";
import { countUp, splitWords } from "./utils.js";

export function initHero(context) {
  const hero = document.querySelector("[data-hero]");
  if (!hero) return Promise.resolve();

  const q = gsap.utils.selector(hero);
  const lines = q("[data-hero-line]");
  const [cobalt, ice] = q("[data-hero-card]");
  const playText = q("[data-play-text]");
  const stat = q("[data-hero-stats] [data-count]")[0];

  const split = splitWords(lines);
  gsap.set(lines, { autoAlpha: 1 });

  gsap.to(playText, { rotation: 360, duration: 18, ease: "none", repeat: -1 });

  const tl = gsap.timeline({
    defaults: { ease: "power3.out", duration: 1 },
    onComplete: () => {
      split.revert();

      const shineWord = hero.querySelector("[data-hero-shine]");
      if (shineWord) {
        shineWord.setAttribute("data-shine-ready", "");

        context.add(() => startShine(hero, shineWord));
      }
    },
  });

  tl.from(
    "[data-header-bar]",
    { yPercent: -100, autoAlpha: 0, duration: 0.9 },
    0,
  )
    .from(
      q("[data-hero-grid]"),
      { autoAlpha: 0, scale: 1.2, duration: 2, ease: "power2.out" },
      0,
    )

    .from(
      split.words,
      { yPercent: 110, duration: 1.1, stagger: 0.07, ease: "expo.out" },
      0.2,
    )

    .from(
      cobalt,
      {
        x: -120,
        y: 220,
        rotation: "-=28",
        scale: 0.8,
        autoAlpha: 0,
        duration: 1.5,
        ease: "expo.out",
      },
      0.55,
    )
    .from(
      ice,
      {
        x: 120,
        y: 260,
        rotation: "+=22",
        scale: 0.8,
        autoAlpha: 0,
        duration: 1.5,
        ease: "expo.out",
      },
      0.7,
    )

    .from(
      q("[data-hero] [data-star]"),
      {
        scale: 0,
        autoAlpha: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "back.out(3)",
      },
      1,
    )
    .from(q("[data-hero-stats]"), { y: 30, autoAlpha: 0 }, 1)
    .from(q("[data-hero-cta]"), { y: 30, autoAlpha: 0 }, 1.1)
    .from(q("[data-hero-intro]"), { y: 30, autoAlpha: 0 }, 1.2)
    .from(
      q("[data-play]"),
      { scale: 0.3, autoAlpha: 0, duration: 1.1, ease: "back.out(1.6)" },
      1.25,
    );

  if (stat) tl.add(countUp(stat, { duration: 1.4 }), 1.05);

  return tl.then();
}

function startShine(hero, el) {
  const band = document.querySelector("[data-band]");

  gsap.fromTo(
    el,
    { backgroundPosition: "100% 0%" },
    {
      backgroundPosition: "0% 0%",
      duration: 2.4,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,

      repeatDelay: 3.5,
      scrollTrigger: {
        trigger: hero,
        start: "top bottom",

        end: band
          ? () =>
              Math.max(
                1,
                band.parentElement.getBoundingClientRect().top +
                  window.scrollY -
                  window.innerHeight,
              )
          : "bottom top",
        toggleActions: "play pause resume pause",
      },
    },
  );
}
