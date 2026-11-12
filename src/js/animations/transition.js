import { gsap } from "gsap";

export function initTransition() {
  const hero = document.querySelector("[data-hero]");
  const band = document.querySelector("[data-band]");
  if (!hero || !band) return;

  const q = gsap.utils.selector(hero);
  const heroBg = q("[data-hero-bg]");
  const stage = q("[data-hero-stage]");
  const stageInner = q("[data-hero-stage-inner]");
  const dives = q("[data-hero-dive]");

  const lines = q("[data-hero-line]");
  const frontLines = lines.slice(0, 2);
  const backLine = lines.slice(2);
  const bandSheet = band.querySelector("[data-band-sheet]");
  const bandText = band.querySelector("[data-band-text]");
  const bandAngle = gsap.getProperty(band, "rotation");
  const edgeAngle = gsap.getProperty(heroBg[0], "rotation");

  const tl = gsap.timeline({
    defaults: { ease: "sine.inOut" },
    scrollTrigger: {
      trigger: band.parentElement,
      start: "top bottom",
      end: "top 15%",
      scrub: 1.4,
    },
  });

  const swing = (targets, angle) => {
    if (!targets.length) return;
    tl.fromTo(targets, { rotation: 0 }, { rotation: angle, duration: 1 }, 0);
  };

  swing(heroBg, edgeAngle);
  swing(stage, edgeAngle);
  swing(stageInner, -edgeAngle);
  swing([band], bandAngle);

  if (bandSheet && bandText) {
    tl.fromTo(
      bandSheet,
      { xPercent: -100 },
      { xPercent: 0, duration: 1 },
      0,
    ).fromTo(bandText, { xPercent: 100 }, { xPercent: 0, duration: 1 }, 0);
  }

  gsap
    .timeline({
      defaults: { ease: "none", duration: 1 },
      scrollTrigger: {
        trigger: band.parentElement,
        start: "top bottom",
        end: "top top",
        scrub: true,
      },
    })
    .to(frontLines, { yPercent: -70 }, 0)
    .to(backLine, { yPercent: -20 }, 0)
    .to(q("[data-star]"), { rotation: "+=120" }, 0)
    .to(q("[data-play]"), { yPercent: -60 }, 0);

  const cardsTl = gsap.timeline({
    scrollTrigger: {
      trigger: band.parentElement,
      start: "top bottom",
      end: "top top",
      scrub: 1.2,
    },
  });

  const drops = [190, 125];
  dives.forEach((card, i) => {
    const side = i === 0 ? -1 : 1;
    const base = gsap.getProperty(card, "rotation");
    cardsTl
      .to(
        card,
        {
          yPercent: -6,
          rotation: base + side * 4,
          duration: 0.1,
          ease: "sine.inOut",
        },
        0,
      )
      .to(
        card,
        {
          yPercent: drops[i] ?? 150,
          xPercent: -side * 14,
          rotation: base - side * 18,
          scale: 0.82,
          duration: 0.85,
          ease: "sine.inOut",
        },
        0.1,
      );
  });
}
