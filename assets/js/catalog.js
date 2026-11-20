(() => {
  const data = window.CANDY_DATA;
  const store = window.CandyStore;
  const grid = document.querySelector("#catalog-grid");
  const count = document.querySelector("[data-catalog-count]");
  const empty = document.querySelector("[data-catalog-empty]");
  const sort = document.querySelector("[data-catalog-sort]");
  const buttons = [...document.querySelectorAll("[data-catalog-filter]")];
  const allowedFilters = buttons.map((button) => button.dataset.catalogFilter);
  const queryFilter = new URLSearchParams(window.location.search).get("filter");
  let activeFilter = allowedFilters.includes(queryFilter) ? queryFilter : "all";

  function render() {
    const filtered = data.sets.filter((set) => {
      return activeFilter === "all" || set.tags.includes(activeFilter);
    });
    if (sort.value === "cheap") filtered.sort((a, b) => a.price - b.price);
    if (sort.value === "expensive") filtered.sort((a, b) => b.price - a.price);
    if (sort.value === "name") filtered.sort((a, b) => a.name.localeCompare(b.name, "ru"));

    store.renderProducts(grid, filtered);
    count.textContent = `Показано наборов: ${filtered.length}`;
    empty.hidden = filtered.length > 0;
    grid.hidden = filtered.length === 0;
    buttons.forEach((button) => {
      const active = button.dataset.catalogFilter === activeFilter;
      button.classList.toggle("filter-chip--active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.catalogFilter;
      const url = new URL(window.location.href);
      if (activeFilter === "all") url.searchParams.delete("filter");
      else url.searchParams.set("filter", activeFilter);
      history.replaceState(null, "", url);
      render();
    });
  });

  sort.addEventListener("change", render);
  render();
})();
