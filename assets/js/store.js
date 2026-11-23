(() => {
  const data = window.CANDY_DATA;
  const storageKey = "sweet-bag-cart-v1";
  let memoryCart = [];
  let noticeTimer;

  function formatPrice(value) {
    return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
  }

  function getCandy(id) {
    return data.candies.find((candy) => candy.id === id);
  }

  function getSet(id) {
    return data.sets.find((set) => set.id === id);
  }

  function getSetPrice(set, weight) {
    const size = data.sizes.find((item) => item.weight === Number(weight)) || data.sizes[0];
    return Math.round((set.price * size.multiplier) / 10) * 10;
  }

  function readCart() {
    try {
      const cart = JSON.parse(localStorage.getItem(storageKey) || "[]");
      memoryCart = Array.isArray(cart) ? cart : [];
    } catch (error) {
      return memoryCart;
    }
    return memoryCart;
  }

  function writeCart(cart) {
    memoryCart = cart;
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch (error) {
      notify("Браузер не разрешил сохранить корзину.");
    }
    window.dispatchEvent(new CustomEvent("sweetcartchange", { detail: cart }));
    updateCartCount();
  }

  function addSet(setId, weight = 250, quantity = 1) {
    const set = getSet(setId);
    if (!set) return;
    const cart = readCart();
    const key = `set:${setId}:${weight}`;
    const existing = cart.find((item) => item.key === key);
    if (existing) existing.quantity += quantity;
    else cart.push({ key, type: "set", setId, weight: Number(weight), quantity });
    writeCart(cart);
    notify(`«${set.name}» добавлен в корзину.`);
  }

  function addMix(mix) {
    const cart = readCart();
    const key = `mix:${Date.now()}:${Math.random().toString(16).slice(2)}`;
    cart.push({ key, type: "mix", quantity: 1, ...mix });
    writeCart(cart);
    notify("Ваш микс добавлен в корзину.");
  }

  function updateQuantity(key, quantity) {
    const cart = readCart();
    const item = cart.find((entry) => entry.key === key);
    if (!item) return;
    if (quantity <= 0) writeCart(cart.filter((entry) => entry.key !== key));
    else {
      item.quantity = Math.min(quantity, 20);
      writeCart(cart);
    }
  }

  function removeItem(key) {
    writeCart(readCart().filter((item) => item.key !== key));
  }

  function clearCart() {
    writeCart([]);
  }

  function updateCartCount() {
    const count = readCart().reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll("[data-cart-count]").forEach((element) => {
      element.textContent = count;
      element.hidden = count === 0;
    });
  }

  function notify(message) {
    let notice = document.querySelector(".toast");
    if (!notice) {
      notice = document.createElement("div");
      notice.className = "toast";
      notice.setAttribute("role", "status");
      document.body.append(notice);
    }
    window.clearTimeout(noticeTimer);
    notice.textContent = message;
    notice.hidden = false;
    noticeTimer = window.setTimeout(() => {
      notice.hidden = true;
    }, 3200);
  }

  function createSetArt(set) {
    const art = document.createElement("div");
    art.className = `set-art set-art--${set.tone}`;
    const tray = document.createElement("div");
    tray.className = "set-art__tray";
    set.candies.forEach((candyId, index) => {
      const candy = getCandy(candyId);
      if (!candy) return;
      const image = document.createElement("img");
      image.src = candy.image;
      image.alt = "";
      image.width = 180;
      image.height = 180;
      image.loading = "lazy";
      image.className = `set-art__candy set-art__candy--${index + 1}`;
      tray.append(image);
    });
    art.append(tray);
    return art;
  }

  function createProductCard(set) {
    const card = document.createElement("article");
    const productUrl = `product.html?id=${set.id}`;
    card.className = "product-card";
    card.dataset.tags = set.tags.join(" ");
    card.addEventListener("click", (event) => {
      if (!event.target.closest("a, button")) window.location.href = productUrl;
    });

    const mediaLink = document.createElement("a");
    mediaLink.className = "product-card__media";
    mediaLink.href = productUrl;
    mediaLink.setAttribute("aria-label", `Подробнее о наборе «${set.name}»`);
    mediaLink.append(createSetArt(set));
    const badge = document.createElement("span");
    badge.className = "product-card__badge";
    badge.textContent = set.badge;
    mediaLink.append(badge);

    const body = document.createElement("div");
    body.className = "product-card__body";
    const meta = document.createElement("p");
    meta.className = "product-card__meta";
    meta.textContent = `${set.weight} г · 4 вида`;
    const title = document.createElement("h3");
    title.className = "product-card__title";
    const titleLink = document.createElement("a");
    titleLink.href = productUrl;
    titleLink.textContent = set.name;
    title.append(titleLink);
    const description = document.createElement("p");
    description.className = "product-card__description";
    description.textContent = set.description;
    const more = document.createElement("a");
    more.className = "product-card__more";
    more.href = productUrl;
    more.textContent = "Состав, вкусы и КБЖУ →";

    const bottom = document.createElement("div");
    bottom.className = "product-card__bottom";
    const priceWrap = document.createElement("div");
    priceWrap.className = "product-card__price-wrap";
    const price = document.createElement("strong");
    price.className = "product-card__price";
    price.textContent = formatPrice(set.price);
    priceWrap.append(price);
    if (set.oldPrice) {
      const oldPrice = document.createElement("s");
      oldPrice.className = "product-card__old-price";
      oldPrice.textContent = formatPrice(set.oldPrice);
      priceWrap.append(oldPrice);
    }
    const add = document.createElement("button");
    add.className = "button button--small button--primary";
    add.type = "button";
    add.dataset.addSet = set.id;
    add.textContent = "В корзину";
    bottom.append(priceWrap, add);
    body.append(meta, title, description, more, bottom);
    card.append(mediaLink, body);
    return card;
  }

  function renderProducts(container, sets) {
    container.replaceChildren();
    sets.forEach((set) => container.append(createProductCard(set)));
  }

  const menuButton = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-menu]");
  if (menuButton && menu) {
    const menuLabel = menuButton.querySelector(".sr-only");
    const setMenuOpen = (open, restoreFocus = false) => {
      menu.classList.toggle("site-nav--open", open);
      menuButton.setAttribute("aria-expanded", String(open));
      menuLabel.textContent = open ? "Закрыть меню" : "Открыть меню";
      document.body.classList.toggle("menu-open", open);
      if (restoreFocus) menuButton.focus();
    };
    menuButton.addEventListener("click", () => {
      setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true");
    });
    menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenuOpen(false)));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
        setMenuOpen(false, true);
      }
    });
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add-set]");
    if (!button) return;
    addSet(button.dataset.addSet, Number(button.dataset.weight || 250));
  });

  window.addEventListener("storage", (event) => {
    if (event.key === storageKey) updateCartCount();
  });

  window.CandyStore = {
    storageKey,
    formatPrice,
    getCandy,
    getSet,
    getSetPrice,
    readCart,
    writeCart,
    addSet,
    addMix,
    updateQuantity,
    removeItem,
    clearCart,
    createSetArt,
    renderProducts,
    notify,
  };

  updateCartCount();
  document.querySelectorAll("[data-products]").forEach((container) => {
    const limit = Number(container.dataset.limit) || data.sets.length;
    renderProducts(container, data.sets.slice(0, limit));
  });
})();
