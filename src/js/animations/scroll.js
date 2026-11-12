import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { countUp, splitWords } from "./utils.js";

export function initScroll() {
  revealTitles();
  revealBlocks();
  revealMetrics();
  revealFeature();
  moveTickers();
  spinStars();
}

function revealTitles() {
  gsap.utils.toArray("main .title, footer .title").forEach((title) => {
    const split = splitWords(title);

    gsap.from(split.words, {
      yPercent: 110,
      duration: 1,
      stagger: 0.06,
      ease: "expo.out",
      scrollTrigger: { trigger: title, start: "top 85%", once: true },
      onComplete: () => split.revert(),
    });
  });
}

function revealBlocks() {
  const items = gsap.utils.toArray("[data-reveal]");
  if (!items.length) return;

  gsap.set(items, { y: 40, autoAlpha: 0 });

  ScrollTrigger.batch(items, {
    start: "clamp(top bottom-=40)",
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        y: 0,
        autoAlpha: 1,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
      }),
  });
}

function revealMetrics() {
  const list = document.querySelector(".metrics");
  if (!list) return;

  const metrics = gsap.utils.toArray("[data-metric]", list);
  const tl = gsap.timeline({
    scrollTrigger: { trigger: list, start: "top 80%", once: true },
  });

  tl.from(metrics, {
    autoAlpha: 0,
    scale: 0.8,
    rotation: (i) => [-6, 5, -4][i] ?? 0,
    duration: 1,
    stagger: 0.15,
    ease: "back.out(1.4)",
  });

  metrics.forEach((metric, i) => {
    const value = metric.querySelector("[data-count]");
    if (value) tl.add(countUp(value), i * 0.15 + 0.1);
  });
}

export function initParallax() {
  const list = document.querySelector(".metrics");
  if (!list) return;

  const offsets = [110, 200, 160];

  gsap.utils.toArray("[data-metric]", list).forEach((metric, i) => {
    gsap.fromTo(
      metric,
      { y: offsets[i] ?? 60 },
      {
        y: 0,
        ease: "none",
        scrollTrigger: {
          trigger: list,
          start: "top bottom",
          end: "top 20%",
          scrub: 0.6,
        },
      },
    );
  });
}

function revealFeature() {
  const card = document.querySelector("[data-feature-card]");
  if (!card) return;

  const [back, front] = gsap.utils.toArray("[data-bank-card]", card);

  gsap
    .timeline({
      scrollTrigger: { trigger: card, start: "top 80%", once: true },
    })
    .from(card, { y: 120, autoAlpha: 0, duration: 1.2, ease: "power3.out" })
    .from(
      back,
      {
        yPercent: 40,
        rotation: "-=18",
        autoAlpha: 0,
        duration: 1.2,
        ease: "expo.out",
      },
      0.3,
    )
    .from(
      front,
      {
        yPercent: 50,
        rotation: "+=16",
        autoAlpha: 0,
        duration: 1.2,
        ease: "expo.out",
      },
      0.45,
    )
    .from(
      gsap.utils.toArray("[data-dot]", card),
      {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 0.6,
        stagger: 0.08,
        ease: "power2.out",
      },
      0.8,
    );
}

function moveTickers() {
  const tracks = [];

  gsap.utils.toArray("[data-ticker]").forEach((ticker, i) => {
    const track = ticker.querySelector("[data-ticker-track]");
    if (!track) return;
    tracks.push(track);
    const range = () => {
      const margin = 60;
      const width = window.innerWidth;
      const phrase = track.firstElementChild?.offsetWidth ?? 0;
      const want = width < 1024 ? Math.max(width * 0.7, phrase) : width * 0.7;
      const visibleLeft = -ticker.offsetLeft;
      const visibleRight = width - ticker.offsetLeft;
      const roomRight = Math.max(0, visibleLeft - margin - track.offsetLeft);
      const roomLeft = Math.min(
        0,
        visibleRight + margin - (track.offsetLeft + track.offsetWidth),
      );

      let max = Math.min(roomRight, want / 2);
      const min = Math.max(roomLeft, max - want);
      max = Math.min(roomRight, min + want);
      return { max, min };
    };

    const toLeft = i % 2 === 0;

    gsap.fromTo(
      track,
      { x: () => (toLeft ? range().max : range().min) },
      {
        x: () => (toLeft ? range().min : range().max),
        ease: "none",
        scrollTrigger: {
          trigger: ticker,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.2,
          invalidateOnRefresh: true,
        },
      },
    );
  });

  if (!tracks.length) return;
  const skew = gsap.quickTo(tracks, "skewX", {
    duration: 0.9,
    ease: "power2.out",
  });
  const clamp = gsap.utils.clamp(-8, 8);
  const straighten = gsap.delayedCall(0.25, () => skew(0)).pause();

  ScrollTrigger.create({
    onUpdate: (self) => {
      skew(clamp(self.getVelocity() / -300));
      straighten.restart(true);
    },
  });
}

function spinStars() {
  gsap.utils
    .toArray("main section:not([data-hero]) [data-star]")
    .forEach((star) => {
      gsap.to(star, {
        rotation: "+=180",
        ease: "none",
        scrollTrigger: {
          trigger: star.closest("section"),
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    });
}
