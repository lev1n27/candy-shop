(() => {
  const data = window.CANDY_DATA;
  const store = window.CandyStore;
  const storageKey = "sweet-bag-mix-v1";
  const capacities = [12, 24, 36];
  const weights = data.sizes.map((size) => size.weight);
  const percentageStep = 5;
  const byId = new Map(data.candies.map((candy) => [candy.id, candy]));
  const find = (selector) => document.querySelector(selector);
  const findAll = (selector) => [...document.querySelectorAll(selector)];
  const grid = find("#candy-grid");
  const cells = find("[data-mix-cells]");
  const box = find("[data-mix-dropzone]");
  const tray = find("#mix-tray");
  const boxToggle = find("[data-box-toggle]");
  const addButton = find("[data-mix-add]");
  const resetButton = find("[data-mix-reset]");
  const randomButton = find("[data-mix-random]");
  const balanceButton = find("[data-mix-balance]");
  const search = find("[data-candy-search]");
  const empty = find("[data-candy-empty]");
  const selection = find("[data-candy-selection]");
  const controls = find("[data-candy-controls]");
  const selectedImage = find("[data-selected-image]");
  const selectedName = find("[data-selected-name]");
  const selectedFlavor = find("[data-selected-flavor]");
  const percentInput = find("[data-candy-percent]");
  const pieceCount = find("[data-candy-count]");
  const plus = find("[data-candy-plus]");
  const minus = find("[data-candy-minus]");
  const modes = findAll("[data-mix-mode]");
  const capacityButtons = findAll("[data-capacity]");
  const weightButtons = findAll("[data-weight]");
  const filterButtons = findAll("[data-mix-filter]");
  const state = loadState();
  let activeFilter = "all";
  let selectedId = null;
  let isOpen = true;

  function loadSelections(saved, limit, availableOnly = false) {
    const selections = {};
    for (const [id, value] of Object.entries(saved || {})) {
      const candy = byId.get(id);
      const quantity = Math.floor(Number(value));
      if (candy && (!availableOnly || candy.isAvailable) && quantity > 0 && quantity <= limit) {
        selections[id] = quantity;
      }
    }
    return sum(selections) <= limit ? selections : {};
  }

  function loadState() {
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(storageKey));
    } catch {
      saved = null;
    }
    const capacity = capacities.includes(saved?.capacity) ? saved.capacity : capacities[0];
    return {
      mode: saved?.mode === "percent" ? "percent" : "pieces",
      capacity,
      weight: weights.includes(saved?.weight) ? saved.weight : weights[0],
      package: saved?.package === "gift" ? "gift" : "craft",
      selections: loadSelections(saved?.selections, capacity),
      shares: loadSelections(saved?.shares, 100, true),
    };
  }

  function saveState() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      store.notify("Браузер не разрешил сохранить микс.");
    }
  }

  function sum(quantities) {
    return Object.values(quantities).reduce((total, quantity) => total + quantity, 0);
  }

  function currentMix() {
    return state.mode === "percent" ? state.shares : state.selections;
  }

  function limit() {
    return state.mode === "percent" ? 100 : state.capacity;
  }

  function step() {
    return state.mode === "percent" ? percentageStep : 1;
  }

  function formatAmount(value) {
    return state.mode === "percent" ? `${value}%` : `${value} шт.`;
  }

  function getTotals() {
    const isPercent = state.mode === "percent";
    let weight = 0;
    let price = state.package === "gift" ? 199 : 0;
    for (const [id, amount] of Object.entries(currentMix())) {
      const candy = byId.get(id);
      const grams = isPercent ? state.weight * amount / 100 : candy.weight * amount;
      weight += grams;
      price += grams * candy.price / candy.weight;
    }
    return { weight: Math.round(weight), price: Math.round(price) };
  }

  function createFlavor(candy) {
    const button = document.createElement("button");
    button.className = "builder-flavor";
    button.type = "button";
    button.dataset.candy = candy.id;
    button.draggable = candy.isAvailable;
    button.title = candy.name;
    button.setAttribute("aria-label", candy.name);
    button.classList.toggle("builder-flavor--unavailable", !candy.isAvailable);
    const image = document.createElement("img");
    image.src = candy.image;
    image.alt = "";
    image.width = 72;
    image.height = 72;
    image.loading = "lazy";
    image.draggable = false;
    const badge = document.createElement("span");
    badge.className = "builder-flavor__badge";
    button.append(image, badge);
    return button;
  }

  function renderCatalog() {
    const query = search.value.trim().toLocaleLowerCase("ru");
    const filtered = data.candies.filter((candy) => {
      const matchesCategory = activeFilter === "all" || candy.categories.includes(activeFilter);
      return matchesCategory && `${candy.name} ${candy.flavor}`.toLocaleLowerCase("ru").includes(query);
    });
    if (!filtered.some((candy) => candy.id === selectedId)) {
      selectedId = (filtered.find((candy) => candy.isAvailable) || filtered[0])?.id ?? null;
    }
    grid.replaceChildren(...filtered.map(createFlavor));
    grid.scrollTop = 0;
    grid.hidden = filtered.length === 0;
    empty.hidden = filtered.length > 0;
    const count = filtered.length;
    const last = count % 10;
    const plural = count % 100 >= 11 && count % 100 <= 14 || last === 0 || last >= 5
      ? "вкусов" : last === 1 ? "вкус" : "вкуса";
    find("[data-candy-results]").textContent = `${count} ${plural}`;
    renderSelection();
  }

  function renderSelection() {
    const mix = currentMix();
    const candy = byId.get(selectedId);
    const isPercent = state.mode === "percent";
    for (const button of grid.children) {
      const amount = mix[button.dataset.candy] || 0;
      button.setAttribute("aria-pressed", String(button.dataset.candy === selectedId));
      button.setAttribute("aria-label", amount ? `${byId.get(button.dataset.candy).name}, ${formatAmount(amount)}` : byId.get(button.dataset.candy).name);
      const badge = button.lastElementChild;
      badge.hidden = amount === 0;
      badge.textContent = isPercent ? formatAmount(amount) : amount;
    }
    selection.hidden = controls.hidden = !candy;
    if (!candy) return;

    if (selectedImage.getAttribute("src") !== candy.image) selectedImage.src = candy.image;
    selectedImage.alt = candy.name;
    selectedName.textContent = candy.name;
    selectedFlavor.textContent = candy.isAvailable ? candy.flavor : "Нет в наличии";
    const amount = mix[selectedId] || 0;
    const remaining = limit() - sum(mix);
    const addAmount = Math.min(step(), remaining) || step();
    plus.disabled = !candy.isAvailable || remaining === 0;
    plus.textContent = `Добавить +${addAmount}${isPercent ? "%" : ""}`;
    minus.disabled = amount === 0;
    minus.setAttribute("aria-label", `Убрать ${formatAmount(Math.min(step(), amount) || step())} — ${candy.name}`);
    pieceCount.textContent = amount;
    pieceCount.hidden = isPercent;
    percentInput.parentElement.hidden = !isPercent;
    percentInput.disabled = !candy.isAvailable;
    percentInput.max = amount + remaining;
    if (document.activeElement !== percentInput) percentInput.value = amount;
  }

  function setAmount(id, amount) {
    const candy = byId.get(id);
    if (!candy || !Number.isFinite(amount)) return;
    const mix = currentMix();
    const existing = mix[id] || 0;
    if (amount > existing && !candy.isAvailable) return;
    const max = limit() - sum(mix) + existing;
    const next = Math.min(max, Math.max(0, Math.round(amount)));
    if (next) mix[id] = next;
    else delete mix[id];
    refresh();
  }

  function changeCandy(id, delta) {
    setAmount(id, (currentMix()[id] || 0) + delta);
  }

  function createCell(id, amount, isPercent) {
    const candy = byId.get(id);
    const cell = document.createElement(candy ? "button" : "div");
    cell.className = "builder-cell";
    if (candy) {
      cell.type = "button";
      cell.dataset.cellCandy = candy.id;
      cell.title = `${candy.name} · убрать ${formatAmount(Math.min(step(), amount))}`;
      cell.setAttribute("aria-label", isPercent ? `${formatAmount(amount)}. ${cell.title}` : cell.title);
      const art = document.createElement("span");
      art.className = "builder-cell__art";
      if (isPercent && candy.boxImage) {
        art.classList.add("builder-cell__pile");
        art.style.backgroundImage = `url("${candy.boxImage}")`;
      } else {
        const image = document.createElement("img");
        image.src = candy.image;
        image.alt = "";
        image.draggable = false;
        art.append(image);
      }
      cell.append(art);
    } else {
      cell.classList.add("builder-cell--empty");
    }

    const label = document.createElement("span");
    label.className = isPercent ? "builder-cell__share" : "builder-cell__sign";
    label.textContent = isPercent ? `${amount}%${candy ? "" : " свободно"}` : candy ? "−" : "+";
    label.setAttribute("aria-hidden", candy || !isPercent ? "true" : "false");
    cell.append(label);
    return cell;
  }

  function renderCells() {
    const isPercent = state.mode === "percent";
    const focusedId = cells.contains(document.activeElement) ? document.activeElement.dataset.cellCandy : null;
    const focusedIndex = focusedId ? [...cells.children].indexOf(document.activeElement) : -1;
    const entries = Object.entries(currentMix());
    const total = sum(currentMix());
    const children = [];
    cells.style.removeProperty("grid-template-columns");
    if (isPercent) {
      for (const [id, amount] of entries) children.push(createCell(id, amount, true));
      if (total < 100) children.push(createCell(null, 100 - total, true));
      const columns = Math.min(4, Math.ceil(Math.sqrt(children.length)));
      cells.style.setProperty("--tray-columns", columns);
      cells.style.setProperty("--tray-rows", Math.ceil(children.length / columns));
      if (children.length === 2) {
        const firstShare = entries[0][1];
        cells.style.gridTemplateColumns = `minmax(74px, ${firstShare}fr) minmax(74px, ${100 - firstShare}fr)`;
      } else if (children.length % columns === 1) {
        children.at(-1).style.gridColumn = "1 / -1";
      }
    } else {
      for (const [id, amount] of entries) {
        for (let index = 0; index < amount; index += 1) children.push(createCell(id, 1, false));
      }
      for (let index = total; index < state.capacity; index += 1) children.push(createCell(null, 1, false));
      const columns = state.capacity === 12 ? 4 : 6;
      cells.style.setProperty("--tray-columns", columns);
      cells.style.setProperty("--tray-rows", state.capacity / columns);
    }
    cells.classList.toggle("builder-cells--percent", isPercent);
    cells.replaceChildren(...children);
    if (focusedId) {
      const replacement = children[focusedIndex]?.dataset.cellCandy === focusedId
        ? children[focusedIndex]
        : children.find((child) => child.dataset.cellCandy === focusedId) || plus;
      (replacement.disabled ? boxToggle : replacement).focus({ preventScroll: true });
    }
  }

  function renderSummary() {
    const isPercent = state.mode === "percent";
    const total = sum(currentMix());
    const remaining = limit() - total;
    const totals = getTotals();

    modes.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.mixMode === state.mode)));
    capacityButtons.forEach((button) => button.setAttribute("aria-pressed", String(Number(button.dataset.capacity) === state.capacity)));
    weightButtons.forEach((button) => button.setAttribute("aria-pressed", String(Number(button.dataset.weight) === state.weight)));
    find("[data-piece-sizes]").hidden = isPercent;
    find("[data-percent-sizes]").hidden = !isPercent;
    find(`input[name="package"][value="${state.package}"]`).checked = true;
    find("[data-box-hint]").textContent = isPercent
      ? "Задай долю вкуса вручную или добавляй по 5%. Нажми на секцию, чтобы уменьшить долю."
      : "Перетащи вкус в коробку или нажми «Добавить». Нажми на конфету, чтобы убрать её.";
    const progress = find("[data-mix-progress]");
    progress.max = limit();
    progress.value = total;
    find("[data-mix-progress-text]").textContent = isPercent ? formatAmount(total) : `${total} из ${state.capacity} шт.`;
    find("[data-mix-hint]").textContent = remaining ? `Осталось добавить ${formatAmount(remaining)}` : "Коробка заполнена.";
    find("[data-mix-weight]").textContent = `${isPercent ? "" : "≈ "}${totals.weight} г`;
    find("[data-mix-price]").textContent = store.formatPrice(totals.price);
    addButton.disabled = remaining !== 0;
    randomButton.disabled = remaining === 0;
    resetButton.disabled = total === 0;
    balanceButton.hidden = !isPercent;
    balanceButton.disabled = total !== 0;
    renderCells();
  }

  function refresh() {
    saveState();
    renderSelection();
    renderSummary();
  }

  function toggleBox(open) {
    isOpen = open;
    tray.inert = !open;
    box.classList.toggle("builder-box--closed", !open);
    boxToggle.setAttribute("aria-expanded", String(open));
    boxToggle.textContent = open ? "Закрыть коробку" : "Открыть коробку";
  }

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-candy]");
    if (!button) return;
    selectedId = button.dataset.candy;
    renderSelection();
  });

  find("[data-selected-details]").addEventListener("click", () => window.CandyDetails.open(selectedId));
  plus.addEventListener("click", () => {
    changeCandy(selectedId, step());
    if (!isOpen) toggleBox(true);
    if (plus.disabled && !minus.disabled) minus.focus({ preventScroll: true });
  });
  minus.addEventListener("click", () => {
    changeCandy(selectedId, -step());
    if (minus.disabled && !plus.disabled) plus.focus({ preventScroll: true });
  });
  percentInput.addEventListener("change", () => {
    const before = currentMix()[selectedId] || 0;
    setAmount(selectedId, percentInput.valueAsNumber);
    percentInput.value = currentMix()[selectedId] || 0;
    if (!isOpen && Number(percentInput.value) > before) toggleBox(true);
  });
  percentInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      percentInput.blur();
    }
  });

  grid.addEventListener("dragstart", (event) => {
    const button = event.target.closest('[data-candy][draggable="true"]');
    if (!button) return;
    event.dataTransfer.setData("text/plain", button.dataset.candy);
    event.dataTransfer.effectAllowed = "copy";
    if (!isOpen) toggleBox(true);
  });
  grid.addEventListener("dragend", () => box.classList.remove("builder-box--over"));
  box.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    box.classList.add("builder-box--over");
  });
  box.addEventListener("dragleave", (event) => {
    if (!box.contains(event.relatedTarget)) box.classList.remove("builder-box--over");
  });
  box.addEventListener("drop", (event) => {
    event.preventDefault();
    box.classList.remove("builder-box--over");
    changeCandy(event.dataTransfer.getData("text/plain"), step());
  });

  cells.addEventListener("click", (event) => {
    const cell = event.target.closest("[data-cell-candy]");
    if (cell) changeCandy(cell.dataset.cellCandy, -step());
  });
  boxToggle.addEventListener("click", () => toggleBox(!isOpen));

  for (const button of filterButtons) {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.mixFilter;
      filterButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      renderCatalog();
    });
  }
  search.addEventListener("input", renderCatalog);

  for (const button of modes) {
    button.addEventListener("click", () => {
      if (state.mode === button.dataset.mixMode) return;
      state.mode = button.dataset.mixMode;
      refresh();
    });
  }
  for (const button of capacityButtons) {
    button.addEventListener("click", () => {
      const capacity = Number(button.dataset.capacity);
      if (capacity < sum(state.selections)) {
        store.notify("Сначала убери лишние конфеты из коробки.");
        return;
      }
      state.capacity = capacity;
      refresh();
    });
  }
  for (const button of weightButtons) {
    button.addEventListener("click", () => {
      state.weight = Number(button.dataset.weight);
      refresh();
    });
  }
  for (const input of findAll('input[name="package"]')) {
    input.addEventListener("change", () => {
      state.package = input.value;
      refresh();
    });
  }

  const available = data.candies.filter((candy) => candy.isAvailable);
  randomButton.addEventListener("click", () => {
    const mix = currentMix();
    const remaining = limit() - sum(mix);
    if (!available.length || !remaining) return;
    const count = state.mode === "percent" ? Math.min(4, remaining) : remaining;
    const pool = [...available];
    for (let index = 0; index < count; index += 1) {
      const candy = randomItem(pool.length ? pool : available);
      if (state.mode === "percent") pool.splice(pool.indexOf(candy), 1);
      const amount = Math.floor(remaining / count) + (index < remaining % count ? 1 : 0);
      mix[candy.id] = (mix[candy.id] || 0) + amount;
    }
    toggleBox(true);
    refresh();
  });

  balanceButton.addEventListener("click", () => {
    const sour = randomItem(available.filter((candy) => candy.categories.includes("sour")));
    const sweet = randomItem(available.filter((candy) => candy.id !== sour?.id && candy.categories.includes("sweet")));
    if (!sour || !sweet) return;
    state.shares = { [sour.id]: 50, [sweet.id]: 50 };
    toggleBox(true);
    refresh();
  });

  function clearMix() {
    if (state.mode === "percent") state.shares = {};
    else state.selections = {};
    refresh();
  }

  resetButton.addEventListener("click", clearMix);
  addButton.addEventListener("click", () => {
    if (sum(currentMix()) !== limit()) return;
    const isPercent = state.mode === "percent";
    store.addMix({
      name: "Мой сладкий микс",
      mode: state.mode,
      ...(isPercent ? {} : { capacity: state.capacity }),
      package: state.package,
      items: { ...currentMix() },
      ...getTotals(),
    });
    clearMix();
  });

  renderCatalog();
  renderSummary();
})();
