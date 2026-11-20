(() => {
  const data = window.CANDY_DATA;
  const store = window.CandyStore;
  const dialog = document.createElement("dialog");
  dialog.className = "candy-dialog";
  dialog.setAttribute("aria-labelledby", "candy-dialog-title");
  dialog.innerHTML = `
    <button class="candy-dialog__close" type="button" aria-label="Закрыть описание" data-details-close>×</button>
    <div class="candy-dialog__layout" data-details-content></div>
  `;
  document.body.append(dialog);

  const content = dialog.querySelector("[data-details-content]");

  function formatNumber(value) {
    return new Intl.NumberFormat("ru-RU").format(value);
  }

  function renderNutrition(nutrition) {
    const items = [
      [nutrition.calories, "ккал"],
      [nutrition.protein, "белки, г"],
      [nutrition.fat, "жиры, г"],
      [nutrition.carbs, "углеводы, г"],
    ];
    return items.map(([value, label]) => {
      return `<div><strong>${formatNumber(value)}</strong><span>${label}</span></div>`;
    }).join("");
  }

  function renderProfile(profile) {
    const items = [
      ["Сладость", profile.sweetness],
      ["Кислотность", profile.sourness],
      ["Мягкость", profile.softness],
    ];
    return items.map(([label, value]) => `
      <div class="taste-meter">
        <span>${label}</span>
        <div class="taste-meter__dots" aria-label="${label}: ${value} из 5">
          ${Array.from({ length: 5 }, (_, index) => `<i class="${index < value ? "taste-meter__dot--filled" : ""}"></i>`).join("")}
        </div>
      </div>
    `).join("");
  }

  function open(candyId) {
    const candy = store.getCandy(candyId);
    if (!candy) return;
    const pairs = candy.pairs.map(store.getCandy).filter(Boolean);
    content.innerHTML = `
      <div class="candy-dialog__media candy-dialog__media--${candy.category}">
        <div class="candy-gallery" data-candy-gallery>
          <div class="candy-gallery__stage">
            <img data-gallery-main src="${candy.image}" alt="${candy.name}" width="560" height="560">
          </div>
          <div class="candy-gallery__thumbs" role="group" aria-label="Фотографии конфеты">
            <button class="candy-gallery__thumb is-active" type="button" data-gallery-image="${candy.image}" aria-label="Фото конфеты">
              <img src="${candy.image}" alt="" width="72" height="72">
            </button>
            ${candy.boxImage ? `<button class="candy-gallery__thumb" type="button" data-gallery-image="${candy.boxImage}" aria-label="Вид конфеты в коробке"><img src="${candy.boxImage}" alt="" width="72" height="72"></button>` : ""}
          </div>
        </div>
        <span>${candy.flavor}</span>
      </div>
      <div class="candy-dialog__body">
        <p class="eyebrow">Познакомимся поближе</p>
        <h2 id="candy-dialog-title">${candy.name}</h2>
        <p class="candy-dialog__description">${candy.description}</p>
        <div class="candy-dialog__facts"><span><b>${store.formatPrice(candy.price)}</b> за штуку</span><span><b>≈ ${candy.weight} г</b> вес конфеты</span></div>
        <section class="candy-dialog__section"><h3>Вкус в деталях</h3><div class="taste-meters">${renderProfile(candy.profile)}</div></section>
        <section class="candy-dialog__section"><h3>КБЖУ на 100 г</h3><div class="nutrition-grid">${renderNutrition(candy.nutrition)}</div><p class="candy-dialog__fineprint">Примерные значения. Вес и рецептура отдельных партий могут немного отличаться.</p></section>
        <details class="ingredients"><summary>Состав и аллергены</summary><p>${candy.ingredients}</p></details>
        <section class="candy-dialog__section"><h3>Хорошо сочетается</h3><div class="candy-pairs">${pairs.map((pair) => `<button type="button" data-candy-pair="${pair.id}"><img src="${pair.image}" alt="" width="42" height="42"><span>${pair.name}</span></button>`).join("")}</div></section>
      </div>
    `;
    if (!dialog.open) dialog.showModal();
    document.body.classList.add("dialog-open");
    dialog.scrollTop = 0;
  }

  dialog.querySelector("[data-details-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
    const galleryThumb = event.target.closest("[data-gallery-image]");
    if (galleryThumb) {
      const gallery = galleryThumb.closest("[data-candy-gallery]");
      gallery.querySelector("[data-gallery-main]").src = galleryThumb.dataset.galleryImage;
      gallery.querySelectorAll("[data-gallery-image]").forEach((button) => button.classList.toggle("is-active", button === galleryThumb));
      return;
    }
    const pair = event.target.closest("[data-candy-pair]");
    if (pair) open(pair.dataset.candyPair);
  });
  dialog.addEventListener("close", () => document.body.classList.remove("dialog-open"));

  window.CandyDetails = { open };
})();
