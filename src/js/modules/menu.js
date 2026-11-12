export function initMenu() {
  document.querySelectorAll("[data-menu-toggle]").forEach((button) => {
    const menu = button.closest("[data-menu]");
    if (!menu) return;

    const setOpen = (open) => {
      menu.toggleAttribute("data-open", open);
      button.setAttribute("aria-expanded", String(open));
    };
    const isOpen = () => menu.hasAttribute("data-open");

    button.addEventListener("click", () => setOpen(!isOpen()));

    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || !isOpen()) return;
      const focusInside = menu.contains(document.activeElement);
      setOpen(false);
      if (focusInside) button.focus();
    });

    document.addEventListener("click", (e) => {
      if (isOpen() && !menu.contains(e.target)) setOpen(false);
    });
  });
}
