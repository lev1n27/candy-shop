(() => {
  const mobileHeaderOrder = document.createElement("style");
  mobileHeaderOrder.textContent = `
    @media (max-width: 860px) {
      .site-header__row > .cart-link {
        order: 1;
        margin-left: auto;
      }

      .site-header__row > .menu-toggle {
        order: 2;
        margin-left: 0;
      }
    }
  `;
  document.head.append(mobileHeaderOrder);

  const backToTop = document.createElement("a");
  backToTop.className = "back-to-top";
  backToTop.href = "#page-top";
  backToTop.textContent = "Наверх";
  backToTop.hidden = true;
  document.body.append(backToTop);

  const flow = document.querySelector("[data-screen-flow]");
  const screens = flow ? [...flow.querySelectorAll(".page-screen")] : [];
  const screenNav = document.createElement("nav");
  screenNav.className = "screen-nav";
  screenNav.setAttribute("aria-label", "Разделы страницы");
  const links = screens.map((screen, index) => {
    const link = document.createElement("a");
    link.href = index === 0 ? "#page-top" : `#${screen.id}`;
    const label = document.getElementById(screen.getAttribute("aria-labelledby")).textContent;
    link.title = label;
    link.setAttribute("aria-label", label);
    screenNav.append(link);
    return link;
  });
  if (flow) flow.after(screenNav);

  let frame = 0;
  let current = -1;

  function updateScrollControls() {
    frame = 0;
    backToTop.hidden = window.scrollY < Math.min(window.innerHeight * 0.4, 240);
    if (!flow) return;

    const marker = window.innerHeight * 0.45;
    screenNav.hidden = flow.getBoundingClientRect().bottom < marker;
    const visible = screens.findIndex((screen) => screen.getBoundingClientRect().bottom > marker);
    if (visible < 0 || current === visible) return;
    links[current]?.removeAttribute("aria-current");
    links[visible].setAttribute("aria-current", "location");
    current = visible;
  }

  function scheduleUpdate() {
    if (!frame) frame = window.requestAnimationFrame(updateScrollControls);
  }

  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
  updateScrollControls();
})();
