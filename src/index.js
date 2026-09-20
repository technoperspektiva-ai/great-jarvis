const TG = "https://api.telegram.org";

/*
  Exact free routes requested by the user.
  Each model has a primary provider and, where available, an alternate route.
*/
const MODELS = {
  qwen: {
    title: "Qwen 3.8 27B Free",
    short: "Qwen 3.8 27B",
    routes: [
      {
        provider: "orca",
        model: "qwen/qwen3.8-27b-free"
      },
      {
        provider: "tokenharbor",
        model: "qwen3.8-27b:free"
      }
    ]
  },
  deepseek: {
    title: "DeepSeek V4 Pro Free",
    short: "DeepSeek V4 Pro",
    routes: [
      {
        provider: "teamo",
        model: "deepseek-v4-pro-free"
      },
      {
        provider: "orca",
        model: "deepseek/deepseek-v4-pro-free"
      }
    ]
  },
  mimo: {
    title: "MiMo V2.5 Free",
    short: "MiMo V2.5",
    routes: [
      {
        provider: "tokenharbor",
        model: "mimo-v2.5:free"
      }
    ]
  }
};

const PROVIDERS = {
  tokenharbor: {
    title: "Token Harbor",
    base: "https://tokenharbor.ai/v1",
    keyEnv: "TOKENHARBOR_API_KEY"
  },
  teamo: {
    title: "TeamoRouter",
    base: "https://api.teamorouter.com/v1",
    keyEnv: "TEAMOROUTER_API_KEY"
  },
  orca: {
    title: "OrcaRouter",
    base: "https://api.orcarouter.ai/v1",
    keyEnv: "ORCAROUTER_API_KEY"
  }
};

const DEFAULT_MODEL_KEY = "qwen";

export class UserPrefs {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/get") {
      const selected = await this.state.storage.get("model");
      return Response.json({ model: selected || DEFAULT_MODEL_KEY });
    }

    if (request.method === "POST" && url.pathname === "/set") {
      const data = await request.json();
      if (!MODELS[data?.model]) {
        return Response.json({ ok: false, error: "invalid_model" }, { status: 400 });
      }
      await this.state.storage.put("model", data.model);
      return Response.json({ ok: true, model: data.model });
    }

    return new Response("Not found", { status: 404 });
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return json({
        ok: true,
        name: "great-jarvis",
        telegram: "@greatjarvis_bot",
        version: "3.0.0",
        storage: "durable-object",
        providers: providerStatus(env),
        models: Object.fromEntries(
          Object.entries(MODELS).map(([key, value]) => [
            key,
            {
              title: value.title,
              routes: value.routes.map(r => ({
                provider: r.provider,
                model: r.model
              }))
            }
          ])
        ),
        setup_webhook: `${url.origin}/setup-webhook`
      });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return new Response("OK");
    }

    if (request.method === "GET" && url.pathname === "/providers") {
      return json({ ok: true, providers: providerStatus(env) });
    }

    if (request.method === "GET" && url.pathname === "/test-routes") {
      return testRoutes(env);
    }

    if (request.method === "GET" && url.pathname === "/telegram") {
      return json({
        ok: true,
        endpoint: "/telegram",
        message: "Telegram sends POST requests here.",
        setup: `${url.origin}/setup-webhook`
      });
    }

    if (request.method === "GET" && url.pathname === "/setup-webhook") {
      return setupWebhook(url, env);
    }

    if (request.method === "GET" && url.pathname === "/webhook-info") {
      return webhookInfo(env);
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
  const result = {};
  for (const [id, p] of Object.entries(PROVIDERS)) {
    result[id] = {
      title: p.title,
      connected: Boolean(env[p.keyEnv]),
      secret: p.keyEnv
    };
  }
  return result;
}

async function setupWebhook(url, env) {
  if (!env.TELEGRAM_BOT_TOKEN) {
    return json({ ok: false, error: "TELEGRAM_BOT_TOKEN is missing" }, 500);
  }
  if (!env.TELEGRAM_WEBHOOK_SECRET) {
    return json({ ok: false, error: "TELEGRAM_WEBHOOK_SECRET is missing" }, 500);
  }

  const webhookUrl = `${url.origin}/telegram`;

  const response = await fetch(`${TG}/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: env.TELEGRAM_WEBHOOK_SECRET,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: true
    })
  });

  const data = await response.json();

  return json({
    ...data,
    webhook_url: webhookUrl,
    next: data?.ok ? "Open @greatjarvis_bot and send /start" : "Check TELEGRAM_BOT_TOKEN"
  }, response.ok ? 200 : 500);
}

async function webhookInfo(env) {
  if (!env.TELEGRAM_BOT_TOKEN) {
    return json({ ok: false, error: "TELEGRAM_BOT_TOKEN is missing" }, 500);
  }

  const response = await fetch(`${TG}/bot${env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
  return json(await response.json(), response.ok ? 200 : 500);
}

/*
  Browser diagnostics. It sends a tiny "Reply only OK" request to each desired route.
  It never returns the API key.
*/
async function testRoutes(env) {
  const tests = [];

  for (const [modelKey, config] of Object.entries(MODELS)) {
    for (const route of config.routes) {
      const provider = PROVIDERS[route.provider];

      if (!env[provider.keyEnv]) {
        tests.push({
          model: config.title,
          provider: provider.title,
          route_model: route.model,
          ok: false,
          skipped: true,
          error: `${provider.keyEnv} missing`
        });
        continue;
      }

      try {
        const started = Date.now();
        const text = await callProvider(env, route.provider, route.model, "Reply with exactly: OK", 20);
        tests.push({
          model: config.title,
          provider: provider.title,
          route_model: route.model,
          ok: true,
          ms: Date.now() - started,
          response: text.slice(0, 80)
        });
      } catch (e) {
        tests.push({
          model: config.title,
          provider: provider.title,
          route_model: route.model,
          ok: false,
          error: e.message.slice(0, 300)
        });
      }
    }
  }

  return json({
    ok: tests.some(x => x.ok),
    note: "At least one working route per desired model is enough. Free quotas and opt-ins can affect availability.",
    tests
  });
}

async function handleUpdate(update, env) {
  if (update.callback_query) {
    await handleCallback(update.callback_query, env);
    return;
  }

  const message = update.message;
  const chatId = message?.chat?.id;
  const userId = message?.from?.id;
  const text = message?.text?.trim();

  if (!chatId || !userId || !text) return;

  if (text === "/start") {
    const modelKey = await getUserModel(env, userId);
    await send(env, chatId,
      `Привет 👋\n\nЯ Great Jarvis.\n` +
      `Текущая модель: ${MODELS[modelKey].title}\n\n` +
      `Напиши любое сообщение.\n/model — выбрать модель\n/providers — проверить ключи\n/current — текущая модель`
    );
    return;
  }

  if (text === "/model" || text === "/models") {
    await showModelMenu(env, chatId, userId);
    return;
  }

  if (text === "/current") {
    const modelKey = await getUserModel(env, userId);
    await send(env, chatId, `Текущая модель: ${MODELS[modelKey].title}`);
    return;
  }

  if (text === "/providers") {
    const lines = ["API-сервисы:"];
    for (const [id, p] of Object.entries(PROVIDERS)) {
      lines.push(`${env[p.keyEnv] ? "✅" : "❌"} ${p.title}`);
    }
    lines.push("", "Диагностика маршрутов:", "/testroutes");
    await send(env, chatId, lines.join("\n"));
    return;
  }

  if (text === "/testroutes") {
    await send(env, chatId,
      "Открой в браузере:\nhttps://great-jarvis.black-sci-official.workers.dev/test-routes"
    );
    return;
  }

  if (text === "/help") {
    await send(env, chatId,
      "/model — Qwen / DeepSeek / MiMo\n" +
      "/current — текущая модель\n" +
      "/providers — подключённые API\n" +
      "/testroutes — диагностика free-маршрутов\n" +
      "/help — помощь"
    );
    return;
  }

  try {
    await telegram(env, "sendChatAction", { chat_id: chatId, action: "typing" });

    const selectedKey = await getUserModel(env, userId);
    const result = await askSelectedModel(env, selectedKey, text);

    const routeInfo = result.fallback
      ? `\n\n↪️ Запасной маршрут: ${PROVIDERS[result.provider].title}`
      : "";

    await sendLong(env, chatId, result.text + routeInfo);
  } catch (e) {
    console.error("CHAT_ERROR", e);
    await send(env, chatId,
      `Не удалось получить ответ.\n\n${friendlyError(e)}\n\n` +
      `Проверь /providers или открой /test-routes в Worker.`
    );
  }
}

async function handleCallback(callback, env) {
  const callbackId = callback.id;
  const chatId = callback.message?.chat?.id;
  const messageId = callback.message?.message_id;
  const userId = callback.from?.id;
  const data = callback.data || "";

  if (!callbackId || !chatId || !userId) return;

  if (!data.startsWith("model:")) {
    await answerCallback(env, callbackId, "Неизвестное действие");
    return;
  }

  const modelKey = data.slice("model:".length);

  if (!MODELS[modelKey]) {
    await answerCallback(env, callbackId, "Неизвестная модель", true);
    return;
  }

  await setUserModel(env, userId, modelKey);
  await answerCallback(env, callbackId, `Выбрано: ${MODELS[modelKey].short}`);

  await edit(env, chatId, messageId,
    `✅ Выбрано: ${MODELS[modelKey].title}\n\nТеперь просто напиши сообщение.`,
    modelKeyboard(modelKey)
  );
}

async function showModelMenu(env, chatId, userId) {
  const current = await getUserModel(env, userId);

  await telegram(env, "sendMessage", {
    chat_id: chatId,
    text:
      "Выбери бесплатную модель:\n\n" +
      "Qwen → OrcaRouter (резерв Token Harbor)\n" +
      "DeepSeek → TeamoRouter (резерв OrcaRouter)\n" +
      "MiMo → Token Harbor",
    reply_markup: modelKeyboard(current)
  });
}

function modelKeyboard(current) {
  return {
    inline_keyboard: [
      [{
        text: `${current === "qwen" ? "✅ " : ""}Qwen 3.8 27B Free`,
        callback_data: "model:qwen"
      }],
      [{
        text: `${current === "deepseek" ? "✅ " : ""}DeepSeek V4 Pro Free`,
        callback_data: "model:deepseek"
      }],
      [{
        text: `${current === "mimo" ? "✅ " : ""}MiMo V2.5 Free`,
        callback_data: "model:mimo"
      }]
    ]
  };
}

async function getUserModel(env, userId) {
  if (!env.USER_PREFS) return DEFAULT_MODEL_KEY;

  try {
    const id = env.USER_PREFS.idFromName(String(userId));
    const stub = env.USER_PREFS.get(id);
    const response = await stub.fetch("https://prefs/get");
    const data = await response.json();
    return MODELS[data?.model] ? data.model : DEFAULT_MODEL_KEY;
  } catch (e) {
    console.error("PREF_GET_ERROR", e);
    return DEFAULT_MODEL_KEY;
  }
}

async function setUserModel(env, userId, modelKey) {
  if (!env.USER_PREFS) throw new Error("Durable Object USER_PREFS is not bound");

  const id = env.USER_PREFS.idFromName(String(userId));
  const stub = env.USER_PREFS.get(id);
  const response = await stub.fetch("https://prefs/set", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model: modelKey })
  });

  if (!response.ok) throw new Error("Could not save model selection");
}

async function askSelectedModel(env, modelKey, userText) {
  const config = MODELS[modelKey] || MODELS[DEFAULT_MODEL_KEY];
  const errors = [];

  for (let i = 0; i < config.routes.length; i++) {
    const route = config.routes[i];
    const provider = PROVIDERS[route.provider];

    if (!env[provider.keyEnv]) {
      errors.push(`${provider.title}: ${provider.keyEnv} missing`);
      continue;
    }

    try {
      const text = await callProvider(env, route.provider, route.model, userText, 1800);
      return {
        text,
        provider: route.provider,
        model: route.model,
        fallback: i > 0
      };
    } catch (e) {
      console.error("ROUTE_ERROR", modelKey, route.provider, route.model, e);
      errors.push(`${provider.title}: ${e.message}`);

      if (env.AUTO_FALLBACK === "false") break;
    }
  }

  throw new Error(errors.join(" | ") || "No route is configured");
}

async function callProvider(env, providerId, model, userText, maxTokens = 1800) {
  const provider = PROVIDERS[providerId];
  const key = env[provider.keyEnv];

  if (!key) throw new Error(`${provider.keyEnv} missing`);

  const response = await fetch(`${provider.base}/chat/completions`, {
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
        {
          role: "user",
          content: userText
        }
      ],
      max_tokens: maxTokens
    })
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`HTTP ${response.status}: provider returned non-JSON`);
  }

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      data?.detail ||
      `HTTP ${response.status}`;

    throw new Error(`${response.status}: ${String(message).slice(0, 220)}`);
  }

  const content = data?.choices?.[0]?.message?.content;

  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const text = content
      .map(x => x?.text || x?.content || "")
      .join("")
      .trim();

    if (text) return text;
  }

  throw new Error("Empty response");
}

function friendlyError(error) {
  const message = String(error?.message || error);

  if (/401|unauthor|invalid.*key/i.test(message)) {
    return "Один из API-ключей неверный или неактивный.";
  }
  if (/429|quota|limit|rate/i.test(message)) {
    return "Бесплатная квота выбранного маршрута закончилась или сработал rate limit.";
  }
  if (/403|free.*enable|consent|opt/i.test(message)) {
    return "Для этого free-маршрута может требоваться включить бесплатные модели/согласие в кабинете провайдера.";
  }
  if (/missing/i.test(message)) {
    return "Не хватает API-ключа одного из нужных провайдеров.";
  }

  return message.slice(0, 450);
}

async function telegram(env, method, payload) {
  if (!env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN missing");
  }

  const response = await fetch(`${TG}/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok || !data?.ok) {
    throw new Error(data?.description || `Telegram HTTP ${response.status}`);
  }

  return data.result;
}

function send(env, chatId, text) {
  return telegram(env, "sendMessage", {
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
  return telegram(env, "editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    reply_markup
  });
}

function answerCallback(env, callback_query_id, text = "", show_alert = false) {
  return telegram(env, "answerCallbackQuery", {
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
