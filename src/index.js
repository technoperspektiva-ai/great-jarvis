const TG = "https://api.telegram.org";

const PROVIDERS = {
  tokenharbor: {
    title: "Token Harbor",
    base: "https://tokenharbor.ai/v1",
    keyEnv: "TOKENHARBOR_API_KEY",
    fallbackModels: ["th-orchestra", "tokenharbor/qwen3-max"]
  },
  teamo: {
    title: "TeamoRouter",
    base: "https://api.teamorouter.com/v1",
    keyEnv: "TEAMOROUTER_API_KEY",
    fallbackModels: [
      "deepseek-flash-free",
      "deepseek-v4-flash-free",
      "gpt-5.6-luna",
      "gpt-5.6-sol",
      "gpt-6-astra"
    ]
  },
  orca: {
    title: "OrcaRouter",
    base: "https://api.orcarouter.ai/v1",
    keyEnv: "ORCAROUTER_API_KEY",
    fallbackModels: [
      "orcarouter/free",
      "orcarouter/auto",
      "deepseek/deepseek-v4-flash-free",
      "openai/gpt-6-astra"
    ]
  }
};

const DEFAULTS = {
  tokenharbor: "th-orchestra",
  teamo: "deepseek-flash-free",
  orca: "orcarouter/free"
};

const MODELS_PER_PAGE = 8;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return json({
        ok: true,
        name: "great-jarvis",
        telegram: "@greatjarvis_bot",
        providers: providerStatus(env),
        kv: !!env.USER_PREFS,
        setup_webhook: `${url.origin}/setup-webhook`
      });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return new Response("OK");
    }

    if (request.method === "GET" && url.pathname === "/telegram") {
      return json({
        ok: true,
        message: "Telegram webhook endpoint is ready for POST requests.",
        setup: `${url.origin}/setup-webhook`
      });
    }

    if (request.method === "GET" && url.pathname === "/setup-webhook") {
      return setupWebhook(url, env);
    }

    if (request.method === "GET" && url.pathname === "/webhook-info") {
      return webhookInfo(env);
    }

    if (request.method === "GET" && url.pathname === "/providers") {
      return json({ ok: true, providers: providerStatus(env) });
    }

    if (request.method === "POST" && url.pathname === "/telegram") {
      if (env.TELEGRAM_WEBHOOK_SECRET) {
        const got = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
        if (got !== env.TELEGRAM_WEBHOOK_SECRET) {
          return new Response("Unauthorized", { status: 401 });
        }
      }

      let update;
      try {
        update = await request.json();
      } catch {
        return new Response("Bad JSON", { status: 400 });
      }

      ctx.waitUntil(handleUpdate(update, env));
      return new Response("OK");
    }

    return new Response("Not found", { status: 404 });
  }
};

function providerStatus(env) {
  const out = {};
  for (const [id, p] of Object.entries(PROVIDERS)) {
    out[id] = { title: p.title, connected: !!env[p.keyEnv] };
  }
  return out;
}

async function setupWebhook(url, env) {
  if (!env.TELEGRAM_BOT_TOKEN) {
    return json({ ok: false, error: "TELEGRAM_BOT_TOKEN is missing" }, 500);
  }
  if (!env.TELEGRAM_WEBHOOK_SECRET) {
    return json({ ok: false, error: "TELEGRAM_WEBHOOK_SECRET is missing" }, 500);
  }

  const webhookUrl = `${url.origin}/telegram`;
  const r = await fetch(`${TG}/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: env.TELEGRAM_WEBHOOK_SECRET,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: true
    })
  });

  const data = await r.json();
  return json({
    ...data,
    webhook_url: webhookUrl,
    next: data?.ok ? "Open @greatjarvis_bot and send /start" : "Check Telegram token"
  }, r.ok ? 200 : 500);
}

async function webhookInfo(env) {
  if (!env.TELEGRAM_BOT_TOKEN) {
    return json({ ok: false, error: "TELEGRAM_BOT_TOKEN is missing" }, 500);
  }
  const r = await fetch(`${TG}/bot${env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
  return json(await r.json(), r.ok ? 200 : 500);
}

async function handleUpdate(update, env) {
  if (update.callback_query) {
    await handleCallback(update.callback_query, env);
    return;
  }

  const m = update.message;
  const chatId = m?.chat?.id;
  const userId = m?.from?.id;
  const text = m?.text?.trim();

  if (!chatId || !userId || !text) return;

  if (text === "/start") {
    const sel = await getSelection(env, userId);
    await send(env, chatId,
      `Привет 👋\n\nЯ Great Jarvis.\n` +
      `Провайдер: ${PROVIDERS[sel.provider]?.title || sel.provider}\n` +
      `Модель: ${sel.model}\n\n` +
      `Просто напиши сообщение.\n/model — выбрать провайдера и модель\n/current — текущий выбор`
    );
    return;
  }

  if (text === "/model" || text === "/provider") {
    await showProviderMenu(env, chatId);
    return;
  }

  if (text === "/current") {
    const sel = await getSelection(env, userId);
    await send(env, chatId,
      `Провайдер: ${PROVIDERS[sel.provider]?.title || sel.provider}\nМодель: ${sel.model}\nАвто-fallback: ${env.AUTO_FALLBACK === "false" ? "выкл." : "вкл."}`
    );
    return;
  }

  if (text === "/help") {
    await send(env, chatId,
      "/model — выбрать сервис и модель\n" +
      "/current — текущий выбор\n" +
      "/providers — статус подключённых API\n" +
      "/help — помощь\n\n" +
      "Остальной текст отправляется выбранной модели."
    );
    return;
  }

  if (text === "/providers") {
    const lines = ["Подключённые сервисы:"];
    for (const [id, p] of Object.entries(PROVIDERS)) {
      lines.push(`${env[p.keyEnv] ? "✅" : "❌"} ${p.title}`);
    }
    await send(env, chatId, lines.join("\n"));
    return;
  }

  try {
    await tg(env, "sendChatAction", { chat_id: chatId, action: "typing" });

    const selection = await getSelection(env, userId);
    const result = await askWithFallback(env, selection, text);

    let suffix = "";
    if (result.provider !== selection.provider || result.model !== selection.model) {
      suffix = `\n\n↪️ Ответ через запасной маршрут: ${PROVIDERS[result.provider].title} · ${result.model}`;
    }

    await sendLong(env, chatId, result.text + suffix);
  } catch (e) {
    console.error("ALL_PROVIDERS_FAILED", e);
    await send(env, chatId,
      "Не удалось получить ответ ни от одного подключённого маршрута. " +
      "Проверь API-ключи, лимиты/баланс и /providers."
    );
  }
}

async function handleCallback(cb, env) {
  const id = cb.id;
  const chatId = cb.message?.chat?.id;
  const messageId = cb.message?.message_id;
  const userId = cb.from?.id;
  const data = cb.data || "";

  if (!id || !chatId || !userId) return;

  try {
    if (data === "providers") {
      await answerCb(env, id);
      await editProviderMenu(env, chatId, messageId);
      return;
    }

    if (data.startsWith("p:")) {
      const provider = data.slice(2);
      if (!PROVIDERS[provider]) {
        await answerCb(env, id, "Неизвестный сервис", true);
        return;
      }
      if (!env[PROVIDERS[provider].keyEnv]) {
        await answerCb(env, id, `Добавь ${PROVIDERS[provider].keyEnv} в Cloudflare Secrets`, true);
        return;
      }
      await answerCb(env, id);
      await showModels(env, chatId, messageId, userId, provider, 0);
      return;
    }

    if (data.startsWith("mp:")) {
      const [, provider, pageRaw] = data.split(":");
      const page = Math.max(0, Number(pageRaw) || 0);
      await answerCb(env, id);
      await showModels(env, chatId, messageId, userId, provider, page);
      return;
    }

    if (data.startsWith("m:")) {
      const [, provider, indexRaw] = data.split(":");
      const index = Number(indexRaw);

      if (!PROVIDERS[provider] || !Number.isInteger(index)) {
        await answerCb(env, id, "Неверный выбор", true);
        return;
      }

      const models = await getModels(env, provider);
      const model = models[index];
      if (!model) {
        await answerCb(env, id, "Список моделей обновился. Открой /model ещё раз.", true);
        return;
      }

      await saveSelection(env, userId, { provider, model });
      await answerCb(env, id, `Выбрано: ${model}`);

      await edit(env, chatId, messageId,
        `✅ Выбрано\n\nПровайдер: ${PROVIDERS[provider].title}\nМодель: ${model}`,
        { inline_keyboard: [[{ text: "← Сменить", callback_data: "providers" }]] }
      );
      return;
    }

    await answerCb(env, id, "Неизвестное действие");
  } catch (e) {
    console.error("CALLBACK_ERROR", e);
    await answerCb(env, id, "Ошибка. Попробуй /model ещё раз.", true);
  }
}

async function showProviderMenu(env, chatId) {
  const rows = [];
  for (const [id, p] of Object.entries(PROVIDERS)) {
    rows.push([{
      text: `${env[p.keyEnv] ? "✅" : "⚠️"} ${p.title}`,
      callback_data: `p:${id}`
    }]);
  }
  await tg(env, "sendMessage", {
    chat_id: chatId,
    text: "Выбери API-сервис:",
    reply_markup: { inline_keyboard: rows }
  });
}

async function editProviderMenu(env, chatId, messageId) {
  const rows = [];
  for (const [id, p] of Object.entries(PROVIDERS)) {
    rows.push([{
      text: `${env[p.keyEnv] ? "✅" : "⚠️"} ${p.title}`,
      callback_data: `p:${id}`
    }]);
  }
  await edit(env, chatId, messageId, "Выбери API-сервис:", { inline_keyboard: rows });
}

async function showModels(env, chatId, messageId, userId, provider, page) {
  const models = await getModels(env, provider);
  const pages = Math.max(1, Math.ceil(models.length / MODELS_PER_PAGE));
  const safePage = Math.min(Math.max(0, page), pages - 1);
  const start = safePage * MODELS_PER_PAGE;
  const visible = models.slice(start, start + MODELS_PER_PAGE);
  const current = await getSelection(env, userId);

  const rows = visible.map((model, i) => [{
    text: `${current.provider === provider && current.model === model ? "✅ " : ""}${prettyModel(model)}`,
    callback_data: `m:${provider}:${start + i}`
  }]);

  const nav = [];
  if (safePage > 0) nav.push({ text: "⬅️", callback_data: `mp:${provider}:${safePage - 1}` });
  nav.push({ text: `${safePage + 1}/${pages}`, callback_data: `mp:${provider}:${safePage}` });
  if (safePage < pages - 1) nav.push({ text: "➡️", callback_data: `mp:${provider}:${safePage + 1}` });
  rows.push(nav);
  rows.push([{ text: "← Провайдеры", callback_data: "providers" }]);

  await edit(env, chatId, messageId,
    `${PROVIDERS[provider].title}\nВыбери модель (${models.length}):`,
    { inline_keyboard: rows }
  );
}

function prettyModel(id) {
  if (id.length <= 42) return id;
  return id.slice(0, 39) + "…";
}

async function getModels(env, providerId) {
  const p = PROVIDERS[providerId];
  if (!p) return [];
  const key = env[p.keyEnv];
  if (!key) return p.fallbackModels;

  const cacheKey = `catalog:${providerId}`;
  if (env.USER_PREFS) {
    const cached = await env.USER_PREFS.get(cacheKey, "json");
    if (Array.isArray(cached) && cached.length) return cached;
  }

  try {
    const r = await fetch(`${p.base}/models`, {
      headers: { Authorization: `Bearer ${key}` }
    });
    const data = await r.json();

    if (!r.ok) throw new Error(`models HTTP ${r.status}`);

    let models = Array.isArray(data?.data)
      ? data.data.map(x => typeof x === "string" ? x : x?.id).filter(Boolean)
      : [];

    // Prefer conversational models; remove obvious non-chat model IDs.
    models = models.filter(id => {
      const s = String(id).toLowerCase();
      return !/(embedding|image|tts|speech|audio|video|moderation|rerank)/.test(s);
    });

    models = [...new Set([...p.fallbackModels, ...models])];
    models.sort((a, b) => modelPriority(providerId, a) - modelPriority(providerId, b) || a.localeCompare(b));

    if (env.USER_PREFS && models.length) {
      await env.USER_PREFS.put(cacheKey, JSON.stringify(models), { expirationTtl: 600 });
    }
    return models.length ? models : p.fallbackModels;
  } catch (e) {
    console.error("MODEL_LIST_ERROR", providerId, e);
    return p.fallbackModels;
  }
}

function modelPriority(provider, id) {
  const s = id.toLowerCase();
  if (provider === "orca" && s === "orcarouter/free") return -100;
  if (provider === "orca" && s === "orcarouter/auto") return -90;
  if (provider === "tokenharbor" && s === "th-orchestra") return -100;
  if (s.includes("free")) return -80;
  if (s.includes("gpt-6-astra")) return -70;
  if (s.includes("gpt-5.6")) return -60;
  if (s.includes("gemini")) return -40;
  if (s.includes("claude")) return -30;
  return 0;
}

async function getSelection(env, userId) {
  const first = firstConnectedProvider(env) || "tokenharbor";
  const fallback = { provider: first, model: DEFAULTS[first] };

  if (!env.USER_PREFS) return fallback;

  const saved = await env.USER_PREFS.get(`selection:${userId}`, "json");
  if (!saved?.provider || !saved?.model || !PROVIDERS[saved.provider]) return fallback;
  if (!env[PROVIDERS[saved.provider].keyEnv]) return fallback;
  return saved;
}

async function saveSelection(env, userId, selection) {
  if (!env.USER_PREFS) {
    throw new Error("USER_PREFS KV is not configured");
  }
  await env.USER_PREFS.put(`selection:${userId}`, JSON.stringify(selection));
}

function firstConnectedProvider(env) {
  return Object.keys(PROVIDERS).find(id => !!env[PROVIDERS[id].keyEnv]);
}

async function askWithFallback(env, preferred, userText) {
  const order = [preferred.provider, ...Object.keys(PROVIDERS).filter(x => x !== preferred.provider)];
  const errors = [];

  for (const provider of order) {
    const p = PROVIDERS[provider];
    if (!env[p.keyEnv]) continue;

    const models = provider === preferred.provider
      ? [preferred.model]
      : [DEFAULTS[provider], ...p.fallbackModels.filter(x => x !== DEFAULTS[provider])];

    for (const model of [...new Set(models)]) {
      try {
        const text = await askProvider(env, provider, model, userText);
        return { provider, model, text };
      } catch (e) {
        errors.push(`${provider}/${model}: ${e.message}`);
        console.error("ROUTE_FAILED", provider, model, e);
        if (env.AUTO_FALLBACK === "false") throw e;
      }
    }
  }

  throw new Error(errors.join(" | ") || "No connected providers");
}

async function askProvider(env, providerId, model, userText) {
  const p = PROVIDERS[providerId];
  const key = env[p.keyEnv];
  if (!key) throw new Error(`${p.keyEnv} missing`);

  const r = await fetch(`${p.base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: env.SYSTEM_PROMPT || "Ты Great Jarvis — полезный Telegram-ассистент."
        },
        { role: "user", content: userText }
      ],
      max_tokens: 1800
    })
  });

  let data;
  try {
    data = await r.json();
  } catch {
    throw new Error(`HTTP ${r.status}: invalid JSON`);
  }

  if (!r.ok) {
    throw new Error(data?.error?.message || data?.message || `HTTP ${r.status}`);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim()) return content.trim();

  if (Array.isArray(content)) {
    const text = content.map(x => x?.text || x?.content || "").join("").trim();
    if (text) return text;
  }

  throw new Error("Empty model response");
}

async function tg(env, method, payload) {
  if (!env.TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN missing");

  const r = await fetch(`${TG}/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await r.json();
  if (!r.ok || !data.ok) {
    throw new Error(data?.description || `Telegram ${r.status}`);
  }
  return data.result;
}

function send(env, chatId, text) {
  return tg(env, "sendMessage", {
    chat_id: chatId,
    text,
    disable_web_page_preview: true
  });
}

async function sendLong(env, chatId, text) {
  for (let i = 0; i < text.length; i += 3900) {
    await send(env, chatId, text.slice(i, i + 3900));
  }
}

function edit(env, chatId, messageId, text, reply_markup) {
  return tg(env, "editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    reply_markup
  });
}

function answerCb(env, callback_query_id, text = "", show_alert = false) {
  return tg(env, "answerCallbackQuery", {
    callback_query_id,
    text,
    show_alert
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
