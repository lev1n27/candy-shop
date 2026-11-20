(() => {
  const data = window.CANDY_DATA;
  const store = window.CandyStore;
  const itemsContainer = document.querySelector("[data-cart-items]");
  const content = document.querySelector("[data-cart-content]");
  const empty = document.querySelector("[data-cart-empty]");
  const success = document.querySelector("[data-order-success]");
  const checkoutForm = document.querySelector("#checkout-form");
  const addressField = document.querySelector("[data-address-field]");
  const addressInput = addressField.querySelector("input");
  let promoApplied = false;
  let orderCompleted = false;

  function getUnitPrice(item) {
    if (item.type === "mix") return item.price;
    const set = store.getSet(item.setId);
    return set ? store.getSetPrice(set, item.weight) : 0;
  }

  function createMixArt(item) {
    const art = document.createElement("div");
    art.className = "cart-item__mix-art";
    Object.keys(item.items).slice(0, 4).forEach((candyId) => {
      const candy = store.getCandy(candyId);
      if (!candy) return;
      const image = document.createElement("img");
      image.src = item.mode === "percent" ? candy.boxImage || candy.image : candy.image;
      image.alt = "";
      image.width = 60;
      image.height = 60;
      art.append(image);
    });
    return art;
  }

  function createCartItem(item) {
    const article = document.createElement("article");
    article.className = "cart-item";
    const art = document.createElement("div");
    art.className = "cart-item__art";
    const body = document.createElement("div");
    const meta = document.createElement("p");
    meta.className = "cart-item__meta";
    const title = document.createElement("h2");
    const composition = document.createElement("p");
    composition.className = "cart-item__composition";

    if (item.type === "mix") {
      art.append(createMixArt(item));
      const isPercent = item.mode === "percent";
      const size = isPercent ? `${item.weight} г` : `${item.capacity} шт.`;
      const packing = item.package === "gift" ? "подарочный бокс" : "крафт-пакет";
      title.textContent = `${item.name}, ${size}`;
      meta.textContent = `${isPercent ? "Микс по процентам" : `${item.weight} г`} · ${packing}`;
      composition.textContent = Object.entries(item.items).map(([candyId, amount]) => {
        const unit = isPercent ? "%" : " шт.";
        return `${store.getCandy(candyId)?.name || candyId} — ${amount}${unit}`;
      }).join(", ");
    } else {
      const set = store.getSet(item.setId);
      if (!set) return null;
      art.append(store.createSetArt(set));
      title.textContent = set.name;
      meta.textContent = `${item.weight} г · готовый набор`;
      composition.textContent = set.candies.map((candyId) => store.getCandy(candyId).name).join(", ");
    }

    const controls = document.createElement("div");
    controls.className = "cart-item__controls";
    const quantity = document.createElement("div");
    quantity.className = "quantity";
    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    minus.dataset.cartMinus = item.key;
    minus.setAttribute("aria-label", "Уменьшить количество");
    const value = document.createElement("b");
    value.textContent = item.quantity;
    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.dataset.cartPlus = item.key;
    plus.setAttribute("aria-label", "Увеличить количество");
    plus.disabled = item.quantity >= 20;
    quantity.append(minus, value, plus);
    const remove = document.createElement("button");
    remove.className = "cart-item__remove";
    remove.type = "button";
    remove.dataset.cartRemove = item.key;
    remove.textContent = "Удалить";
    controls.append(quantity, remove);
    body.append(meta, title, composition, controls);
    const price = document.createElement("strong");
    price.className = "cart-item__price";
    price.textContent = store.formatPrice(getUnitPrice(item) * item.quantity);
    article.append(art, body, price);
    return article;
  }

  function getTotals() {
    const cart = store.readCart();
    const subtotal = cart.reduce((sum, item) => sum + getUnitPrice(item) * item.quantity, 0);
    const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
    const method = checkoutForm.elements.delivery.value;
    const delivery = method === "pickup" || subtotal === 0 || subtotal - discount >= 2500 ? 0 : 350;
    return { subtotal, discount, delivery, total: subtotal - discount + delivery };
  }

  function renderTotals() {
    const totals = getTotals();
    document.querySelector("[data-cart-subtotal]").textContent = store.formatPrice(totals.subtotal);
    document.querySelector("[data-discount-row]").hidden = !promoApplied;
    document.querySelector("[data-cart-discount]").textContent = `−${store.formatPrice(totals.discount)}`;
    document.querySelector("[data-cart-delivery]").textContent = totals.delivery ? store.formatPrice(totals.delivery) : "Бесплатно";
    document.querySelector("[data-cart-total]").textContent = store.formatPrice(totals.total);
    document.querySelector("[data-checkout-total]").textContent = `· ${store.formatPrice(totals.total)}`;
    const hint = document.querySelector("[data-delivery-hint]");
    if (checkoutForm.elements.delivery.value === "pickup") {
      hint.textContent = "Самовывоз из лавки на Никольской — бесплатно.";
    } else if (totals.delivery) {
      hint.textContent = `До бесплатной доставки осталось ${store.formatPrice(2500 - totals.subtotal + totals.discount)}.`;
    } else {
      hint.textContent = "Доставка бесплатная — от 2 500 ₽.";
    }
  }

  function render() {
    const cart = store.readCart();
    if (orderCompleted) {
      content.hidden = true;
      empty.hidden = true;
      success.hidden = false;
      return;
    }
    empty.hidden = cart.length > 0;
    content.hidden = cart.length === 0;
    success.hidden = true;
    if (!cart.length) {
      promoApplied = false;
      return;
    }
    itemsContainer.replaceChildren();
    cart.forEach((item) => {
      const card = createCartItem(item);
      if (card) itemsContainer.append(card);
    });
    renderTotals();
  }

  itemsContainer.addEventListener("click", (event) => {
    const minus = event.target.closest("[data-cart-minus]");
    const plus = event.target.closest("[data-cart-plus]");
    const remove = event.target.closest("[data-cart-remove]");
    if (minus) {
      const item = store.readCart().find((entry) => entry.key === minus.dataset.cartMinus);
      if (item) store.updateQuantity(item.key, item.quantity - 1);
    }
    if (plus) {
      const item = store.readCart().find((entry) => entry.key === plus.dataset.cartPlus);
      if (item) store.updateQuantity(item.key, item.quantity + 1);
    }
    if (remove) store.removeItem(remove.dataset.cartRemove);
  });

  document.querySelector("[data-cart-clear]").addEventListener("click", () => {
    if (window.confirm("Удалить все сладости из корзины?")) store.clearCart();
  });

  document.querySelector("[data-promo-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = event.currentTarget.querySelector("input");
    const message = event.currentTarget.querySelector("[data-promo-message]");
    promoApplied = input.value.trim().toLocaleUpperCase("ru") === "СЛАДКО";
    message.textContent = promoApplied ? "Промокод применён: скидка 10%." : "Такой промокод не найден. Попробуй СЛАДКО.";
    renderTotals();
  });

  checkoutForm.elements.delivery.forEach((radio) => {
    radio.addEventListener("change", () => {
      const isCourier = checkoutForm.elements.delivery.value === "courier";
      addressField.hidden = !isCourier;
      addressInput.required = isCourier;
      addressInput.disabled = !isCourier;
      renderTotals();
    });
  });

  checkoutForm.querySelectorAll("input, textarea").forEach((field) => {
    field.addEventListener("input", () => {
      field.removeAttribute("aria-invalid");
      field.setCustomValidity("");
    });
  });

  const phoneInput = checkoutForm.elements.phone;
  phoneInput.addEventListener("input", () => {
    let digits = phoneInput.value.replace(/\D/g, "");
    if (!digits) return;
    if (digits[0] === "8") digits = `7${digits.slice(1)}`;
    if (digits[0] !== "7") digits = `7${digits}`;
    digits = digits.slice(0, 11);
    let formatted = "+7";
    if (digits.length > 1) formatted += ` (${digits.slice(1, 4)}`;
    if (digits.length >= 4) formatted += ")";
    if (digits.length > 4) formatted += ` ${digits.slice(4, 7)}`;
    if (digits.length > 7) formatted += `-${digits.slice(7, 9)}`;
    if (digits.length > 9) formatted += `-${digits.slice(9, 11)}`;
    phoneInput.value = formatted;
  });

  checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const digits = phoneInput.value.replace(/\D/g, "");
    phoneInput.setCustomValidity(digits.length === 11 ? "" : "Введите полный номер телефона.");
    checkoutForm.querySelectorAll("input, textarea").forEach((field) => {
      field.setAttribute("aria-invalid", String(!field.checkValidity()));
    });
    if (!checkoutForm.checkValidity()) {
      checkoutForm.reportValidity();
      return;
    }

    const name = checkoutForm.elements.name.value.trim();
    const orderNumber = `СМ-${String(Date.now()).slice(-6)}`;
    document.querySelector("[data-order-success-text]").textContent = `${name}, заказ ${orderNumber} оформлен. Мы позвоним на ${phoneInput.value}, чтобы подтвердить детали.`;
    orderCompleted = true;
    store.clearCart();
    checkoutForm.reset();
    success.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  window.addEventListener("sweetcartchange", render);
  window.addEventListener("storage", (event) => {
    if (event.key === store.storageKey) render();
  });
  render();
})();
