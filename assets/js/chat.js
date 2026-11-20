(() => {
  const storageKey = "sweet-bag-chat-v1";
  const launch = document.createElement("button");
  launch.className = "chat-launch";
  launch.type = "button";
  launch.setAttribute("aria-label", "Чат с консультантом");
  launch.setAttribute("aria-expanded", "false");
  launch.setAttribute("aria-controls", "consultant-chat");
  launch.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15a3 3 0 0 1-3 3H9l-5 3v-6a3 3 0 0 1-1-2.3V7a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3z"/></svg><span>Чат с консультантом</span><i aria-hidden="true"></i>`;

  const panel = document.createElement("section");
  panel.className = "chat-panel";
  panel.id = "consultant-chat";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-labelledby", "chat-title");
  panel.hidden = true;
  panel.innerHTML = `
    <div class="chat-panel__header">
      <div><span class="chat-panel__avatar" aria-hidden="true">С</span><div><h2 id="chat-title">Сладкий консультант</h2><p><i></i> Автоматический помощник · онлайн</p></div></div>
      <button type="button" aria-label="Закрыть чат" data-chat-close>×</button>
    </div>
    <div class="chat-panel__messages" data-chat-messages aria-live="polite"></div>
    <div class="chat-panel__quick">
      <button type="button" data-chat-question="Как собрать микс?">Как собрать микс?</button>
      <button type="button" data-chat-question="Сколько стоит доставка?">Доставка</button>
      <button type="button" data-chat-question="Что выбрать в подарок?">В подарок</button>
    </div>
    <form class="chat-panel__form">
      <label class="sr-only" for="chat-input">Ваше сообщение</label>
      <input id="chat-input" type="text" maxlength="300" placeholder="Напишите сообщение…" autocomplete="off" required>
      <button type="submit" aria-label="Отправить сообщение"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 9-18 9 4-9zM7 12h14"/></svg></button>
    </form>
  `;
  document.body.append(launch, panel);

  const messagesElement = panel.querySelector("[data-chat-messages]");
  const form = panel.querySelector(".chat-panel__form");
  const input = panel.querySelector("#chat-input");
  let messages = loadMessages();

  function loadMessages() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(saved) && saved.length) return saved.slice(-30);
    } catch (error) {
      return [];
    }
    return [{ from: "agent", text: "Здравствуйте! Я помогу выбрать набор, собрать микс или разобраться с доставкой. Что вас интересует?" }];
  }

  function saveMessages() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages.slice(-30)));
    } catch (error) {
      return;
    }
  }

  function addMessageElement(message) {
    const element = document.createElement("div");
    element.className = `chat-message chat-message--${message.from}`;
    const text = document.createElement("p");
    text.textContent = message.text;
    element.append(text);
    messagesElement.append(element);
    messagesElement.scrollTop = messagesElement.scrollHeight;
  }

  function getResponse(question) {
    const text = question.toLocaleLowerCase("ru");
    if (text.includes("достав")) return "По Москве доставка стоит 350 ₽, а от 2 500 ₽ — бесплатно. Также можно забрать заказ самовывозом из лавки на Никольской, 10.";
    if (text.includes("микс") || text.includes("собра")) return "Выберите «Поштучно» для бокса на 12, 24 или 36 конфет или «По процентам» для бокса на 250, 500 или 750 г. Добавляйте любимые вкусы кнопкой «Добавить» и положите заполненный бокс в корзину.";
    if (text.includes("подар")) return "Для подарка советую набор «Ягодная вечеринка» или нежный микс без кислого. В конструкторе можно выбрать подарочный бокс за 199 ₽.";
    if (text.includes("кисл")) return "Для яркой кислоты выберите «Кислый удар» или добавьте в микс Тентакли, Червевидных Олегов и Синяки.";
    if (text.includes("цен") || text.includes("стоим") || text.includes("сколько")) return "Готовые наборы по 250 г стоят от 490 ₽. В своём миксе цена складывается из выбранных конфет — она сразу отображается в конструкторе.";
    if (text.includes("состав") || text.includes("халял") || text.includes("веган")) return "Состав и вкус каждого вида указаны в карточке. Если у вас аллергия или особые требования, перед покупкой лучше уточнить состав у оператора по телефону +7 (495) 000-24-24.";
    return "Могу подсказать по вкусам, цене, подарочной упаковке и доставке. А если хотите всё выбрать сами, откройте раздел «Собрать микс» в верхнем меню.";
  }

  function sendMessage(text) {
    const question = text.trim();
    if (!question) return;
    const userMessage = { from: "user", text: question };
    messages.push(userMessage);
    addMessageElement(userMessage);
    input.value = "";
    const typing = document.createElement("div");
    typing.className = "chat-message chat-message--agent chat-message--typing";
    typing.textContent = "Консультант печатает…";
    messagesElement.append(typing);
    messagesElement.scrollTop = messagesElement.scrollHeight;
    window.setTimeout(() => {
      typing.remove();
      const answer = { from: "agent", text: getResponse(question) };
      messages.push(answer);
      addMessageElement(answer);
      saveMessages();
    }, 650);
    saveMessages();
  }

  function setOpen(open) {
    panel.hidden = !open;
    launch.setAttribute("aria-expanded", String(open));
    launch.classList.toggle("chat-launch--open", open);
    if (open) input.focus();
  }

  launch.addEventListener("click", () => setOpen(panel.hidden));
  panel.querySelector("[data-chat-close]").addEventListener("click", () => {
    setOpen(false);
    launch.focus();
  });
  panel.querySelectorAll("[data-chat-question]").forEach((button) => {
    button.addEventListener("click", () => sendMessage(button.dataset.chatQuestion));
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage(input.value);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) setOpen(false);
  });

  messages.forEach(addMessageElement);
})();
