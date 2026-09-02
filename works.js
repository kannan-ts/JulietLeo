const workBrowser = document.querySelector(".work-browser");
const workToggle = document.querySelector(".work-toggle");

if (workBrowser && workToggle) {
  const filterButtons = [...workToggle.querySelectorAll("button")];
  const cards = [...workBrowser.querySelectorAll(".work-card")];

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.workFilter;
      workBrowser.dataset.activeFilter = filter;
      filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      cards.forEach((card) => card.classList.toggle("is-hidden", card.dataset.workType !== "both" && card.dataset.workType !== filter));
    });
  });
}
