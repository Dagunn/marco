import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";

export function splitWords(target) {
  return SplitText.create(target, {
    type: "words",
    mask: "words",
    aria: "none",
  });
}

function parseCount(text) {
  const match = text.match(/^(\D*?)(\d(?:[\d\s.,]*\d)?)(.*)$/s);
  if (!match) return null;

  const [, prefix, raw, suffix] = match;
  const decimal = raw.match(/[.,](\d{1,2})$/);
  const intPart = decimal ? raw.slice(0, -decimal[0].length) : raw;

  const group = intPart.match(/[\s.,]/)?.[0] ?? "";
  const digits = intPart.replace(/\D/g, "");
  const places = decimal ? decimal[1].length : 0;
  const value = Number(digits + (decimal ? "." + decimal[1] : ""));

  const format = (n) => {
    const [int, frac] = n.toFixed(places).split(".");
    const grouped = group ? int.replace(/\B(?=(\d{3})+(?!\d))/g, group) : int;
    return frac ? grouped + decimal[0][0] + frac : grouped;
  };

  return { prefix, suffix, value, format };
}

export function countUp(el, vars = {}) {
  el.dataset.countValue ??= el.textContent.trim();
  const text = el.dataset.countValue;
  const parsed = parseCount(text);
  if (!parsed) return gsap.timeline();

  const { prefix, suffix, value, format } = parsed;
  const counter = { value: 0 };
  el.textContent = prefix + format(0) + suffix;

  return gsap.to(counter, {
    value,
    duration: 1.6,
    ease: "power2.out",
    ...vars,
    onUpdate: () => (el.textContent = prefix + format(counter.value) + suffix),
    onComplete: () => (el.textContent = text),
  });
}

export function restoreCounts() {
  document.querySelectorAll("[data-count-value]").forEach((el) => {
    el.textContent = el.dataset.countValue;
  });
}
