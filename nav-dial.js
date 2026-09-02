document.querySelectorAll(".site-nav").forEach((navigation) => {
  const links = [...navigation.querySelectorAll("a")];
  const activeLink = navigation.querySelector(".is-active") || links[0];
  const activeIndex = Math.max(links.indexOf(activeLink), 0);
  const header = navigation.closest(".site-header");
  const dial = document.createElement("span");

  dial.className = "mode-dial";
  dial.setAttribute("aria-hidden", "true");
  navigation.append(dial);

  const moveDial = (link) => {
    const navigationBounds = navigation.getBoundingClientRect();
    const linkBounds = link.getBoundingClientRect();
    const position = linkBounds.left - navigationBounds.left + linkBounds.width / 2;

    dial.style.setProperty("--dial-position", `${position}px`);
  };

  const resetDial = () => moveDial(activeLink);

  links.forEach((link) => {
    link.addEventListener("mouseenter", () => moveDial(link));
    link.addEventListener("focus", () => moveDial(link));
  });

  navigation.addEventListener("mouseleave", resetDial);
  window.addEventListener("resize", resetDial);
  header.style.setProperty("--dial-rotation", `${(activeIndex - 1) * 72}deg`);
  window.setTimeout(() => {
    header.style.setProperty("--dial-rotation", `${activeIndex * 72}deg`);
  }, 120);
  resetDial();
});
