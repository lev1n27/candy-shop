(() => {
  const data = window.CANDY_DATA;
  const store = window.CandyStore;
  const storageKey = "sweet-bag-mix-v1";
  const grid = document.querySelector("#candy-grid");
  const cells = document.querySelector("[data-mix-cells]");
  const dropzone = document.querySelector("[data-mix-dropzone]");
  const addButton = document.querySelector("[data-mix-add]");
  const filterButtons = [...document.querySelectorAll("[data-mix-filter]")];
  const capacityButtons = [...document.querySelectorAll("[data-capacity]")];
  const search = document.querySelector("[data-candy-search]");
  const empty = document.querySelector("[data-candy-empty]");
  let activeFilter = "all";
  let searchQuery = "";
  let state = loadState();

  function loadState() {
    const fallback = { capacity: 12, package: "craft", selections: {} };
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (!saved || ![12, 24, 36].includes(saved.capacity)) return fallback;
      const selections = {};
      data.candies.forEach((candy) => {
        const quantity = Math.max(0, Math.floor(Number(saved.selections?.[candy.id]) || 0));
        if (quantity) selections[candy.id] = quantity;
      });
      const total = Object.values(selections).reduce((sum, quantity) => sum + quantity, 0);
      if (total > saved.capacity) return fallback;
      return {
        capacity: saved.capacity,
        package: saved.package === "gift" ? "gift" : "craft",
        selections,
      };
    } catch (error) {
      return fallback;
    }
  }

  function saveState() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      store.notify("Браузер не разрешил сохранить микс.");
    }
  }

  function getTotal() {
    return Object.values(state.selections).reduce((sum, quantity) => sum + quantity, 0);
  }

  function getWeight() {
    return data.candies.reduce((sum, candy) => {
      return sum + candy.weight * (state.selections[candy.id] || 0);
    }, 0);
  }

  function getPrice() {
    const candiesPrice = data.candies.reduce((sum, candy) => {
      return sum + candy.price * (state.selections[candy.id] || 0);
    }, 0);
    return candiesPrice + (state.package === "gift" ? 199 : 0);
  }

  function createCandyCard(candy) {
    const card = document.createElement("article");
    card.className = "candy-card";
    card.dataset.candyCard = candy.id;
    card.classList.toggle("candy-card--unavailable", !candy.isAvailable);
    const imageBox = document.createElement("button");
    imageBox.className = "candy-card__image";
    imageBox.type = "button";
    imageBox.draggable = candy.isAvailable;
    imageBox.dataset.candyDrag = candy.id;
    imageBox.setAttribute("aria-label", `Описание, состав и КБЖУ: ${candy.name}. Можно перетащить в коробку.`);
    const image = document.createElement("img");
    image.src = candy.image;
    image.alt = candy.name;
    image.width = 180;
    image.height = 180;
    image.loading = "lazy";
    image.draggable = false;
    const count = document.createElement("span");
    count.className = "candy-card__count";
    count.dataset.candyBadge = candy.id;
    imageBox.append(image, count);
    if (!candy.isAvailable) {
      const unavailable = document.createElement("span");
      unavailable.className = "candy-card__unavailable";
      unavailable.textContent = "Нет в наличии";
      imageBox.append(unavailable);
    }

    const body = document.createElement("div");
    body.className = "candy-card__body";
    const title = document.createElement("h3");
    title.textContent = candy.name;
    const flavor = document.createElement("p");
    flavor.className = "candy-card__flavor";
    flavor.textContent = candy.flavor;
    const details = document.createElement("button");
    details.className = "candy-card__details";
    details.type = "button";
    details.textContent = "Вкус, состав и КБЖУ →";
    details.setAttribute("aria-label", `Подробнее о конфете «${candy.name}»`);
    const bottom = document.createElement("div");
    bottom.className = "candy-card__bottom";
    const price = document.createElement("strong");
    price.className = "candy-card__price";
    price.textContent = `${store.formatPrice(candy.price)} `;
    const unit = document.createElement("small");
    unit.textContent = "/ шт.";
    price.append(unit);

    const quantity = document.createElement("div");
    quantity.className = "quantity";
    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    minus.dataset.candyMinus = candy.id;
    minus.setAttribute("aria-label", `Убрать одну конфету «${candy.name}»`);
    const value = document.createElement("span");
    value.dataset.candyQuantity = candy.id;
    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.dataset.candyPlus = candy.id;
    plus.setAttribute("aria-label", `Добавить одну конфету «${candy.name}»`);
    quantity.append(minus, value, plus);
    bottom.append(price, quantity);
    body.append(title, flavor, details, bottom);
    card.append(imageBox, body);
    return card;
  }

  function renderCandyCards() {
    const filtered = data.candies.filter((candy) => {
      const matchesCategory = activeFilter === "all" || candy.categories.includes(activeFilter);
      const query = searchQuery.trim().toLocaleLowerCase("ru");
      const matchesSearch = !query || `${candy.name} ${candy.flavor}`.toLocaleLowerCase("ru").includes(query);
      return matchesCategory && matchesSearch;
    });
    grid.replaceChildren();
    filtered.forEach((candy) => grid.append(createCandyCard(candy)));
    empty.hidden = filtered.length > 0;
    document.querySelector("[data-candy-results]").textContent = `${filtered.length} ${filtered.length === 1 ? "вкус" : filtered.length < 5 ? "вкуса" : "вкусов"}`;
    updateCandyControls();
  }

  function updateCandyControls() {
    const total = getTotal();
    data.candies.forEach((candy) => {
      const quantity = state.selections[candy.id] || 0;
      const card = grid.querySelector(`[data-candy-card="${candy.id}"]`);
      if (!card) return;
      card.classList.toggle("candy-card--selected", quantity > 0);
      card.querySelector(`[data-candy-quantity="${candy.id}"]`).textContent = quantity;
      const badge = card.querySelector(`[data-candy-badge="${candy.id}"]`);
      badge.textContent = quantity;
      badge.hidden = quantity === 0;
      card.querySelector(`[data-candy-minus="${candy.id}"]`).disabled = quantity === 0;
      card.querySelector(`[data-candy-plus="${candy.id}"]`).disabled = total >= state.capacity || !candy.isAvailable;
    });
  }

  function changeCandy(candyId, delta) {
    const candy = store.getCandy(candyId);
    if (!candy) return;
    if (delta > 0 && !candy.isAvailable) {
      store.notify("Этого вкуса сейчас нет в наличии. Выбери другой.");
      return;
    }
    const current = state.selections[candyId] || 0;
    const total = getTotal();
    if (delta > 0 && total >= state.capacity) {
      store.notify("Бокс заполнен. Убери конфету или выбери бокс больше.");
      return;
    }
    const next = Math.max(0, current + delta);
    if (next) state.selections[candyId] = next;
    else delete state.selections[candyId];
    saveState();
    updateCandyControls();
    renderSummary();
  }

  function renderCells() {
    cells.replaceChildren();
    cells.className = `mix-cells mix-cells--${state.capacity}`;
    data.candies.forEach((candy) => {
      const quantity = state.selections[candy.id] || 0;
      for (let index = 0; index < quantity; index += 1) {
        const cell = document.createElement("button");
        cell.className = "mix-cell mix-cell--filled";
        cell.type = "button";
        cell.dataset.cellCandy = candy.id;
        cell.title = `Убрать одну порцию «${candy.name}»`;
        cell.setAttribute("aria-label", cell.title);
        const image = document.createElement("img");
        image.src = candy.boxImage || candy.image;
        image.alt = "";
        image.width = 90;
        image.height = 90;
        cell.append(image);
        cells.append(cell);
      }
    });
    for (let index = getTotal(); index < state.capacity; index += 1) {
      const cell = document.createElement("div");
      cell.className = "mix-cell";
      const plus = document.createElement("span");
      plus.textContent = "+";
      cell.append(plus);
      cells.append(cell);
    }
  }

  function renderSummary() {
    const total = getTotal();
    const remaining = state.capacity - total;
    document.querySelector("[data-mix-count]").textContent = total;
    document.querySelector("[data-mix-capacity]").textContent = state.capacity;
    document.querySelector("[data-mix-progress]").style.width = `${Math.min(100, total / state.capacity * 100)}%`;
    document.querySelector("[data-mix-weight]").textContent = `${getWeight()} г`;
    document.querySelector("[data-mix-price]").textContent = store.formatPrice(getPrice());
    const hint = document.querySelector("[data-mix-hint]");
    hint.textContent = remaining > 0
      ? `Добавь ещё ${remaining} ${remaining === 1 ? "конфету" : remaining < 5 ? "конфеты" : "конфет"}, чтобы заполнить бокс.`
      : "Бокс заполнен — можно добавлять в корзину!";
    hint.classList.toggle("mix-summary__hint--ready", remaining === 0);
    addButton.disabled = remaining !== 0;
    capacityButtons.forEach((button) => {
      const active = Number(button.dataset.capacity) === state.capacity;
      button.classList.toggle("capacity-picker__button--active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll('input[name="package"]').forEach((input) => {
      input.checked = input.value === state.package;
    });
    renderCells();
  }

  grid.addEventListener("click", (event) => {
    const plus = event.target.closest("[data-candy-plus]");
    const minus = event.target.closest("[data-candy-minus]");
    if (plus) {
      changeCandy(plus.dataset.candyPlus, 1);
      return;
    }
    if (minus) {
      changeCandy(minus.dataset.candyMinus, -1);
      return;
    }
    const card = event.target.closest("[data-candy-card]");
    if (card) window.CandyDetails.open(card.dataset.candyCard);
  });

  grid.addEventListener("dragstart", (event) => {
    const handle = event.target.closest("[data-candy-drag]");
    if (!handle) return;
    event.dataTransfer.setData("text/plain", handle.dataset.candyDrag);
    event.dataTransfer.effectAllowed = "copy";
    dropzone.classList.add("open-box--ready");
  });

  grid.addEventListener("dragend", () => dropzone.classList.remove("open-box--ready"));
  dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    dropzone.classList.add("open-box--over");
  });
  dropzone.addEventListener("dragleave", (event) => {
    if (!dropzone.contains(event.relatedTarget)) dropzone.classList.remove("open-box--over");
  });
  dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropzone.classList.remove("open-box--ready", "open-box--over");
    changeCandy(event.dataTransfer.getData("text/plain"), 1);
  });

  cells.addEventListener("click", (event) => {
    const cell = event.target.closest("[data-cell-candy]");
    if (cell) changeCandy(cell.dataset.cellCandy, -1);
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.mixFilter;
      filterButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("filter-chip--active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      renderCandyCards();
    });
  });

  search.addEventListener("input", () => {
    searchQuery = search.value;
    renderCandyCards();
  });

  capacityButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const capacity = Number(button.dataset.capacity);
      if (capacity < getTotal()) {
        store.notify("В миксе больше конфет, чем ячеек в этом боксе. Сначала убери лишние.");
        return;
      }
      state.capacity = capacity;
      saveState();
      updateCandyControls();
      renderSummary();
    });
  });

  document.querySelectorAll('input[name="package"]').forEach((input) => {
    input.addEventListener("change", () => {
      state.package = input.value;
      saveState();
      renderSummary();
    });
  });

  document.querySelector("[data-mix-random]").addEventListener("click", () => {
    const available = data.candies.filter((candy) => candy.isAvailable);
    let remaining = state.capacity - getTotal();
    while (remaining > 0) {
      const candy = available[Math.floor(Math.random() * available.length)];
      state.selections[candy.id] = (state.selections[candy.id] || 0) + 1;
      remaining -= 1;
    }
    saveState();
    updateCandyControls();
    renderSummary();
  });

  document.querySelector("[data-mix-reset]").addEventListener("click", () => {
    state.selections = {};
    saveState();
    updateCandyControls();
    renderSummary();
  });

  addButton.addEventListener("click", () => {
    if (getTotal() !== state.capacity) return;
    store.addMix({
      name: "Мой сладкий микс",
      capacity: state.capacity,
      package: state.package,
      items: { ...state.selections },
      price: getPrice(),
      weight: getWeight(),
    });
    state.selections = {};
    saveState();
    updateCandyControls();
    renderSummary();
  });

  renderCandyCards();
  renderSummary();
})();
