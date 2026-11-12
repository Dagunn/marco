import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { initHero } from "./hero.js";
import { initTransition } from "./transition.js";
import { initScroll, initParallax } from "./scroll.js";
import { initHover } from "./hover.js";
import { restoreCounts } from "./utils.js";

const MOTION = "(prefers-reduced-motion: no-preference)";
const DESKTOP = "(min-width: 1024px)";
const POINTER = "(hover: hover) and (pointer: fine)";

export function initAnimations() {
  const root = document.documentElement;
  gsap.registerPlugin(ScrollTrigger, SplitText);

  const mm = gsap.matchMedia();
  let heroIntro = Promise.resolve();
  mm.add("(prefers-reduced-motion: reduce)", () => {
    root.classList.remove("is-animated");
  });

  mm.add(MOTION, (context) => {
    heroIntro = initHero(context);
    initTransition();
    initScroll();

    return restoreCounts;
  });

  mm.add(`${MOTION} and ${DESKTOP}`, () => {
    initParallax();
  });

  mm.add(`${MOTION} and ${POINTER}`, () => {
    return initHover(heroIntro);
  });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
