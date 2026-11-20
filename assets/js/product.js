(() => {
  const data = window.CANDY_DATA;
  const store = window.CandyStore;
  const container = document.querySelector("[data-product-detail]");
  const id = new URLSearchParams(window.location.search).get("id");
  const set = store.getSet(id) || data.sets[0];
  let quantity = 1;
  let weight = 250;

  document.title = `${set.name} — Сладкий мешок`;
  document.querySelector("[data-product-breadcrumb]").textContent = set.name;

  const detail = document.createElement("div");
  detail.className = "product-detail";
  const media = document.createElement("div");
  media.className = "product-detail__media";
  media.append(store.createSetArt(set));

  const content = document.createElement("div");
  const badge = document.createElement("span");
  badge.className = "product-detail__badge";
  badge.textContent = set.badge;
  const title = document.createElement("h1");
  title.textContent = set.name;
  const description = document.createElement("p");
  description.className = "product-detail__description";
  description.textContent = set.description;
  const taste = document.createElement("p");
  taste.className = "product-detail__taste";
  taste.textContent = `Вкусы набора: ${set.candies.map((candyId) => store.getCandy(candyId).flavor.toLocaleLowerCase("ru")).join(" · ")}.`;

  const composition = document.createElement("section");
  composition.className = "composition";
  const compositionHeading = document.createElement("div");
  compositionHeading.className = "composition__heading";
  const compositionTitle = document.createElement("h2");
  compositionTitle.textContent = "Что внутри";
  const compositionNote = document.createElement("span");
  compositionNote.textContent = "4 вида · примерно поровну";
  compositionHeading.append(compositionTitle, compositionNote);
  const compositionList = document.createElement("div");
  compositionList.className = "composition__list";
  set.candies.forEach((candyId) => {
    const candy = store.getCandy(candyId);
    const item = document.createElement("button");
    item.className = "composition__item";
    item.type = "button";
    item.setAttribute("aria-label", `Подробнее о конфете «${candy.name}»`);
    const image = document.createElement("img");
    image.src = candy.image;
    image.alt = "";
    image.width = 54;
    image.height = 54;
    const text = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = candy.name;
    const flavor = document.createElement("small");
    flavor.textContent = candy.flavor;
    text.append(name, flavor);
    const share = document.createElement("b");
    share.textContent = "25%";
    item.append(image, text, share);
    item.addEventListener("click", () => window.CandyDetails.open(candy.id));
    compositionList.append(item);
  });
  const compositionHint = document.createElement("p");
  compositionHint.className = "composition__hint";
  compositionHint.textContent = "Нажми на конфету, чтобы увидеть её описание, состав и КБЖУ.";
  composition.append(compositionHeading, compositionList, compositionHint);

  const nutrition = document.createElement("section");
  nutrition.className = "set-nutrition";
  const nutritionTitle = document.createElement("h2");
  nutritionTitle.textContent = "КБЖУ набора на 100 г";
  const nutritionGrid = document.createElement("div");
  nutritionGrid.className = "nutrition-grid";
  const candies = set.candies.map(store.getCandy);
  const average = (key) => candies.reduce((sum, candy) => sum + candy.nutrition[key], 0) / candies.length;
  const nutritionValues = [
    [Math.round(average("calories")), "ккал"],
    [average("protein").toFixed(1), "белки, г"],
    [average("fat").toFixed(1), "жиры, г"],
    [average("carbs").toFixed(1), "углеводы, г"],
  ];
  nutritionValues.forEach(([value, label]) => {
    const item = document.createElement("div");
    const number = document.createElement("strong");
    number.textContent = String(value).replace(".", ",");
    const name = document.createElement("span");
    name.textContent = label;
    item.append(number, name);
    nutritionGrid.append(item);
  });
  const nutritionNote = document.createElement("p");
  nutritionNote.textContent = "Среднее расчётное значение для конфет, входящих в набор. Точный состав каждой конфеты доступен по нажатию выше.";
  nutrition.append(nutritionTitle, nutritionGrid, nutritionNote);

  const sizePicker = document.createElement("fieldset");
  sizePicker.className = "size-picker";
  const legend = document.createElement("legend");
  legend.textContent = "Выбери размер набора";
  const options = document.createElement("div");
  options.className = "size-picker__options";
  data.sizes.forEach((size, index) => {
    const label = document.createElement("label");
    label.className = "size-option";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "set-size";
    input.value = size.weight;
    input.checked = index === 0;
    const text = document.createElement("span");
    const small = document.createElement("small");
    text.textContent = `${size.weight} г`;
    small.textContent = store.formatPrice(store.getSetPrice(set, size.weight));
    text.append(small);
    label.append(input, text);
    options.append(label);
    input.addEventListener("change", () => {
      weight = size.weight;
      updatePrice();
    });
  });
  sizePicker.append(legend, options);

  const buy = document.createElement("div");
  buy.className = "product-detail__buy";
  const price = document.createElement("strong");
  price.className = "product-detail__price";
  const quantityPicker = document.createElement("div");
  quantityPicker.className = "quantity";
  const minus = document.createElement("button");
  minus.type = "button";
  minus.textContent = "−";
  minus.setAttribute("aria-label", "Уменьшить количество");
  const value = document.createElement("span");
  value.textContent = "1";
  const plus = document.createElement("button");
  plus.type = "button";
  plus.textContent = "+";
  plus.setAttribute("aria-label", "Увеличить количество");
  quantityPicker.append(minus, value, plus);
  const add = document.createElement("button");
  add.className = "button button--primary button--large";
  add.type = "button";
  add.textContent = "Добавить в корзину";
  buy.append(price, quantityPicker, add);

  const gift = document.createElement("div");
  gift.className = "product-gift";
  const giftMark = document.createElement("span");
  giftMark.textContent = "Подарок?";
  const giftText = document.createElement("p");
  giftText.textContent = "Напиши текст открытки в комментарии к заказу — добавим её бесплатно.";
  gift.append(giftMark, giftText);

  const information = document.createElement("div");
  information.className = "product-information";
  const delivery = document.createElement("details");
  const deliveryTitle = document.createElement("summary");
  deliveryTitle.textContent = "Доставка и самовывоз";
  const deliveryText = document.createElement("p");
  deliveryText.textContent = "Курьером по Москве — 350 ₽, бесплатно от 2 500 ₽. Самовывоз с Никольской, 10 доступен ежедневно с 10:00 до 21:00.";
  delivery.append(deliveryTitle, deliveryText);
  const storage = document.createElement("details");
  const storageTitle = document.createElement("summary");
  storageTitle.textContent = "Как хранить сладости";
  const storageText = document.createElement("p");
  storageText.textContent = "Храни в закрытой упаковке при температуре до +20 °C, вдали от солнца и резких запахов. Не допускай повышенной влажности.";
  storage.append(storageTitle, storageText);
  information.append(delivery, storage);

  content.append(badge, title, description, taste, composition, nutrition, sizePicker, buy, gift, information);
  detail.append(media, content);
  container.append(detail);

  function updatePrice() {
    price.textContent = store.formatPrice(store.getSetPrice(set, weight) * quantity);
    value.textContent = quantity;
    minus.disabled = quantity <= 1;
    plus.disabled = quantity >= 10;
  }

  minus.addEventListener("click", () => {
    quantity = Math.max(1, quantity - 1);
    updatePrice();
  });
  plus.addEventListener("click", () => {
    quantity = Math.min(10, quantity + 1);
    updatePrice();
  });
  add.addEventListener("click", () => store.addSet(set.id, weight, quantity));

  const related = data.sets.filter((item) => {
    return item.id !== set.id && item.tags.some((tag) => set.tags.includes(tag));
  }).slice(0, 4);
  data.sets.forEach((item) => {
    if (related.length < 4 && item.id !== set.id && !related.includes(item)) related.push(item);
  });
  store.renderProducts(document.querySelector("#related-grid"), related);
  updatePrice();
})();
