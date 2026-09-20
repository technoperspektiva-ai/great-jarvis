const TG = "https://api.telegram.org";

const PROVIDERS = {
  teamo: {
    title: "TeamoRouter",
    base: "https://api.teamorouter.com/v1",
    keyEnv: "TEAMOROUTER_API_KEY"
  },
  orca: {
    title: "OrcaRouter",
    base: "https://api.orcarouter.ai/v1",
    keyEnv: "ORCAROUTER_API_KEY"
  },
  tokenharbor: {
    title: "Token Harbor",
    base: "https://tokenharbor.ai/v1",
    keyEnv: "TOKENHARBOR_API_KEY"
  },
  nara: {
    title: "NaraRouter",
    base: "https://router.bynara.id/v1",
    keyEnv: "NARAROUTER_API_KEY"
  }
};

const MODELS = {
  qwen: {
    title: "Qwen 3.8 27B Free",
    routes: [
      { provider: "orca", model: "qwen/qwen3.8-27b-free" }
    ]
  },
  deepseek_pro: {
    title: "DeepSeek V4 Pro Free",
    routes: [
      { provider: "teamo", model: "deepseek-v4-pro-free" },
      { provider: "orca", model: "deepseek/deepseek-v4-pro-free" }
    ]
  },
  deepseek_flash: {
    title: "DeepSeek V4 Flash Free",
    routes: [
      { provider: "teamo", model: "deepseek-v4-flash-free" },
      { provider: "orca", model: "deepseek/deepseek-v4-flash-free" },
      { provider: "tokenharbor", model: "deepseek-v4-flash:free" }
    ]
  },
  mimo: {
    title: "MiMo V2.5 Free",
    routes: [
      { provider: "tokenharbor", model: "mimo-v2.5:free" }
    ]
  },
  th_rudder: {
    title: "TH-Rudder",
    routes: [
      { provider: "tokenharbor", model: "th-rudder" }
    ]
  },
  nara_mistral_large: {
    title: "Mistral Large",
    routes: [
      { provider: "nara", model: "mistral-large" }
    ]
  },
  nara_mistral_medium: {
    title: "Mistral Medium 3.5",
    routes: [
      { provider: "nara", model: "mistral-medium-3-5" }
    ]
  },
  nara_tencent_hy3_free: {
    title: "Tencent HY3 Free",
    routes: [
      { provider: "nara", model: "tencent-hy3-free" }
    ]
  },
  nara_auto: {
    title: "Nara Auto",
    routes: [
      { provider: "nara", model: "auto/bynara" }
    ]
  },
  orca_free: {
    title: "Orca Auto Free",
    routes: [
      { provider: "orca", model: "orcarouter/free" }
    ]
  }
};

const DEFAULT_MODEL_KEY = "orca_free";

export class UserPrefs {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/get") {
      const model = await this.state.storage.get("model");
      return Response.json({ model: model || DEFAULT_MODEL_KEY });
    }

    if (request.method === "POST" && url.pathname === "/set") {
      const body = await request.json();
      if (!MODELS[body?.model]) {
        return Response.json({ ok: false, error: "invalid_model" }, { status: 400 });
      }
      await this.state.storage.put("model", body.model);
      return Response.json({ ok: true, model: body.model });
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
        version: "4.6.0",
        telegram: "@greatjarvis_bot",
        providers: providerStatus(env),
        models: Object.fromEntries(
          Object.entries(MODELS).map(([key, cfg]) => [
            key,
            { title: cfg.title, routes: cfg.routes }
          ])
        ),
        setup_webhook: `${url.origin}/setup-webhook`,
        test_routes: `${url.origin}/test-routes`
      });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return new Response("OK");
    }

    if (request.method === "GET" && url.pathname === "/telegram") {
      return json({
        ok: true,
        endpoint: "/telegram",
        message: "Telegram sends POST updates here.",
        setup: `${url.origin}/setup-webhook`
      });
    }

    if (request.method === "GET" && url.pathname === "/providers") {
      return json({ ok: true, providers: providerStatus(env) });
    }

    if (request.method === "GET" && url.pathname === "/setup-webhook") {
      return setupWebhook(url, env);
    }

    if (request.method === "GET" && url.pathname === "/webhook-info") {
      return webhookInfo(env);
    }

    if (request.method === "GET" && url.pathname === "/nara-models") {
      return naraModels(env);
    }

    if (request.method === "GET" && url.pathname === "/test-routes") {
      return testRoutes(env);
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
    next: data?.ok ? "Open @greatjarvis_bot and send /start" : "Check Telegram token"
  }, response.ok ? 200 : 500);
}

async function webhookInfo(env) {
  if (!env.TELEGRAM_BOT_TOKEN) {
    return json({ ok: false, error: "TELEGRAM_BOT_TOKEN is missing" }, 500);
  }

  const response = await fetch(`${TG}/bot${env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
  return json(await response.json(), response.ok ? 200 : 500);
}

async function naraModels(env) {
  const provider = PROVIDERS.nara;
  const key = env[provider.keyEnv];

  if (!key) {
    return json({
      ok: false,
      error: "NARAROUTER_API_KEY is missing",
      hint: "Add it in Cloudflare Variables and Secrets."
    }, 500);
  }

  try {
    const response = await fetch(`${provider.base}/models`, {
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return json({
        ok: false,
        status: response.status,
        error: data?.error?.message || data?.message || data
      }, response.status);
    }

    const models = Array.isArray(data?.data)
      ? data.data.map(item => ({
          id: typeof item === "string" ? item : item?.id,
          reasoning: typeof item === "object" ? item?.reasoning : undefined
        })).filter(x => x.id)
      : [];

    return json({
      ok: true,
      provider: "NaraRouter",
      count: models.length,
      models
    });
  } catch (e) {
    return json({
      ok: false,
      error: String(e?.message || e)
    }, 500);
  }
}

async function testRoutes(env) {
  const jobs = [];

  for (const [key, cfg] of Object.entries(MODELS)) {
    for (const route of cfg.routes) {
      const provider = PROVIDERS[route.provider];

      jobs.push((async () => {
        if (!env[provider.keyEnv]) {
          return {
            model: cfg.title,
            provider: provider.title,
            route_model: route.model,
            ok: false,
            skipped: true,
            error: `${provider.keyEnv} missing`
          };
        }

        const started = Date.now();

        try {
          const text = await callProvider(
            env,
            route.provider,
            route.model,
            "Reply with exactly: OK",
            16,
            7000
          );

          return {
            model: cfg.title,
            provider: provider.title,
            route_model: route.model,
            ok: true,
            ms: Date.now() - started,
            response: text.slice(0, 60)
          };
        } catch (e) {
          return {
            model: cfg.title,
            provider: provider.title,
            route_model: route.model,
            ok: false,
            ms: Date.now() - started,
            error: String(e?.message || e).slice(0, 320)
          };
        }
      })());
    }
  }

  const tests = await Promise.all(jobs);

  const modelStatus = {};
  for (const t of tests) {
    if (!(t.model in modelStatus)) modelStatus[t.model] = false;
    if (t.ok) modelStatus[t.model] = true;
  }

  return json({
    ok: Object.values(modelStatus).some(Boolean),
    model_status: modelStatus,
    note: "All routes were checked in parallel. Each route has a 7 second timeout.",
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
    const selected = await getUserModel(env, userId);
    await send(env, chatId,
      `Привет 👋\n\nЯ Great Jarvis.\n` +
      `Текущая модель: ${MODELS[selected].title}\n\n` +
      `Напиши сообщение.\n/model — выбрать модель\n/current — текущая модель\n/providers — подключённые API`
    );
    return;
  }

  if (text === "/model" || text === "/models") {
    await showModelMenu(env, chatId, userId);
    return;
  }

  if (text === "/current") {
    const selected = await getUserModel(env, userId);
    const statuses = await getModelStatuses(env);
    const state = statuses?.[selected]?.state;
    const status = state === "ok"
      ? "✅ отвечает сейчас"
      : state === "bad"
        ? "❌ подтверждённая ошибка"
        : "⚠️ временно не подтверждена";
    await send(env, chatId, `Текущая модель: ${MODELS[selected].title}\nСтатус: ${status}`);
    return;
  }

  if (text === "/providers") {
    const lines = ["API-сервисы:"];
    for (const p of Object.values(PROVIDERS)) {
      lines.push(`${env[p.keyEnv] ? "✅" : "❌"} ${p.title}`);
    }
    lines.push("", "Тест маршрутов: /testroutes");
    await send(env, chatId, lines.join("\n"));
    return;
  }

  if (text === "/testroutes") {
    await send(env, chatId,
      "Открой:\nhttps://great-jarvis.black-sci-official.workers.dev/test-routes"
    );
    return;
  }

  if (text === "/naramodels") {
    await send(env, chatId,
      "Модели NaraRouter для твоего ключа:\nhttps://great-jarvis.black-sci-official.workers.dev/nara-models"
    );
    return;
  }

  if (text === "/help") {
    await send(env, chatId,
      "/model — выбрать модель\n" +
      "/current — текущая модель\n" +
      "/providers — статус API\n" +
      "/testroutes — диагностика всех free-маршрутов\n" +
      "/naramodels — модели NaraRouter для твоего ключа\n" +
      "/help — помощь"
    );
    return;
  }

  try {
    await telegram(env, "sendChatAction", { chat_id: chatId, action: "typing" });

    const selected = await getUserModel(env, userId);
    const result = await askSelectedModel(env, selected, text);

    let routeSuffix = "";

    if (result.globalFallback) {
      routeSuffix =
        `\n\n⚠️ Выбранная модель сейчас недоступна.` +
        `\n✅ Ответил резерв: ${MODELS[result.modelKey].title} · ${PROVIDERS[result.provider].title}`;
    } else if (result.fallback) {
      routeSuffix = `\n\n↪️ Запасной маршрут: ${PROVIDERS[result.provider].title}`;
    }

    await sendLong(env, chatId, result.text + routeSuffix);
  } catch (e) {
    console.error("CHAT_ERROR", e);
    await send(env, chatId,
      `Не удалось получить ответ.\n\n${friendlyError(e)}\n\n` +
      "Проверь /providers и /testroutes."
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

  const key = data.slice("model:".length);

  if (!MODELS[key]) {
    await answerCallback(env, callbackId, "Неизвестная модель", true);
    return;
  }

  await setUserModel(env, userId, key);
  await answerCallback(env, callbackId, `Выбрано: ${MODELS[key].title}`);

  const statuses = await getModelStatuses(env);

  await edit(env, chatId, messageId,
    `✅ Выбрано: ${MODELS[key].title}\n\nЕсли модель станет недоступна, бот автоматически использует рабочий резерв.`,
    modelKeyboard(key, statuses)
  );
}

async function getModelStatuses(env) {
  const entries = Object.entries(MODELS);

  const results = await Promise.all(entries.map(async ([key, cfg]) => {
    const routeStates = await Promise.all(cfg.routes.map(async route => {
      const provider = PROVIDERS[route.provider];
      const apiKey = env[provider.keyEnv];

      if (!apiKey) {
        return { state: "bad", reason: `${provider.keyEnv} missing` };
      }

      try {
        const result = await probeRoute(env, route.provider, route.model);
        return result;
      } catch (e) {
        return { state: "unknown", reason: String(e?.message || e) };
      }
    }));

    if (routeStates.some(x => x.state === "ok")) {
      return [key, { state: "ok", routes: routeStates }];
    }

    if (routeStates.some(x => x.state === "unknown")) {
      return [key, { state: "unknown", routes: routeStates }];
    }

    return [key, { state: "bad", routes: routeStates }];
  }));

  return Object.fromEntries(results);
}

async function probeRoute(env, providerId, model) {
  const provider = PROVIDERS[providerId];
  const key = env[provider.keyEnv];

  if (!key) return { state: "bad", reason: `${provider.keyEnv} missing` };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("health_timeout"), 8000);

  try {
    const response = await fetch(`${provider.base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Reply only OK" }],
        max_tokens: 8
      })
    });

    let data = null;
    try {
      data = await response.json();
    } catch {}

    if (response.ok) {
      return { state: "ok", reason: "working" };
    }

    const msg = String(
      data?.error?.message ||
      data?.message ||
      data?.detail ||
      `HTTP ${response.status}`
    );

    if (response.status === 401 || response.status === 403) {
      return { state: "bad", reason: `${response.status}: ${msg}` };
    }

    if (response.status === 404 || /model.*not|unknown model|not active/i.test(msg)) {
      return { state: "bad", reason: `${response.status}: ${msg}` };
    }

    // Rate limits, overloaded providers and 5xx are temporary states.
    return { state: "unknown", reason: `${response.status}: ${msg}` };
  } catch (e) {
    if (e?.name === "AbortError" || String(e).includes("health_timeout")) {
      return { state: "unknown", reason: "health check timeout" };
    }
    return { state: "unknown", reason: String(e?.message || e) };
  } finally {
    clearTimeout(timer);
  }
}

async function showModelMenu(env, chatId, userId) {
  const current = await getUserModel(env, userId);
  const statuses = await getModelStatuses(env);

  await telegram(env, "sendMessage", {
    chat_id: chatId,
    text:
      "Выбери модель:\n\n" +
      "✅ — отвечает сейчас\n" +
      "⚠️ — сервис подключён, но проверка не подтвердилась (таймаут / лимит / временная ошибка)\n" +
      "❌ — подтверждённая ошибка ключа или модели\n\n" +
      "Статус не блокирует работу: Great Jarvis всё равно пробует выбранную модель и рабочие резервы.",
    reply_markup: modelKeyboard(current, statuses)
  });
}

function modelKeyboard(current, statuses = {}) {
  const icon = key => {
    const state = statuses?.[key]?.state;
    if (state === "ok") return "✅";
    if (state === "bad") return "❌";
    return "⚠️";
  };

  const selected = key => current === key ? "• " : "";

  return {
    inline_keyboard: [
      [{ text: `${icon("qwen")} ${selected("qwen")}Qwen 3.8 27B`, callback_data: "model:qwen" }],
      [{ text: `${icon("deepseek_pro")} ${selected("deepseek_pro")}DeepSeek V4 Pro`, callback_data: "model:deepseek_pro" }],
      [{ text: `${icon("deepseek_flash")} ${selected("deepseek_flash")}DeepSeek V4 Flash`, callback_data: "model:deepseek_flash" }],
      [{ text: `${icon("mimo")} ${selected("mimo")}MiMo V2.5`, callback_data: "model:mimo" }],
      [{ text: `${icon("th_rudder")} ${selected("th_rudder")}TH-Rudder`, callback_data: "model:th_rudder" }],
      [{ text: `${icon("nara_mistral_large")} ${selected("nara_mistral_large")}Mistral Large`, callback_data: "model:nara_mistral_large" }],
      [{ text: `${icon("nara_mistral_medium")} ${selected("nara_mistral_medium")}Mistral Medium 3.5`, callback_data: "model:nara_mistral_medium" }],
      [{ text: `${icon("nara_tencent_hy3_free")} ${selected("nara_tencent_hy3_free")}Tencent HY3 Free`, callback_data: "model:nara_tencent_hy3_free" }],
      [{ text: `${icon("nara_auto")} ${selected("nara_auto")}Nara Auto`, callback_data: "model:nara_auto" }],
      [{ text: `${icon("orca_free")} ${selected("orca_free")}Orca Auto Free`, callback_data: "model:orca_free" }]
    ]
  };
}

async function getUserModel(env, userId) {
  try {
    const id = env.USER_PREFS.idFromName(String(userId));
    const stub = env.USER_PREFS.get(id);
    const response = await stub.fetch("https://prefs/get");
    const data = await response.json();
    return MODELS[data?.model] ? data.model : DEFAULT_MODEL_KEY;
  } catch {
    return DEFAULT_MODEL_KEY;
  }
}

async function setUserModel(env, userId, key) {
  const id = env.USER_PREFS.idFromName(String(userId));
  const stub = env.USER_PREFS.get(id);
  const response = await stub.fetch("https://prefs/set", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model: key })
  });

  if (!response.ok) {
    throw new Error("Could not save model selection");
  }
}

async function askSelectedModel(env, key, userText) {
  const selectedKey = MODELS[key] ? key : DEFAULT_MODEL_KEY;
  const selectedConfig = MODELS[selectedKey];
  const errors = [];

  // 1. First try every route of the user's selected model.
  for (let i = 0; i < selectedConfig.routes.length; i++) {
    const route = selectedConfig.routes[i];
    const p = PROVIDERS[route.provider];

    if (!env[p.keyEnv]) {
      errors.push(`${p.title}: ${p.keyEnv} missing`);
      continue;
    }

    try {
      const text = await callProvider(env, route.provider, route.model, userText, 1800);
      return {
        text,
        provider: route.provider,
        model: route.model,
        modelKey: selectedKey,
        fallback: i > 0,
        globalFallback: false
      };
    } catch (e) {
      errors.push(`${p.title}/${route.model}: ${e.message}`);
    }
  }

  if (env.AUTO_FALLBACK === "false") {
    throw new Error(errors.join(" | ") || "Selected model unavailable");
  }

  // 2. If the selected model is completely unavailable, try every other model.
  for (const [fallbackKey, config] of Object.entries(MODELS)) {
    if (fallbackKey === selectedKey) continue;

    for (const route of config.routes) {
      const p = PROVIDERS[route.provider];
      if (!env[p.keyEnv]) continue;

      try {
        const text = await callProvider(env, route.provider, route.model, userText, 1800);
        return {
          text,
          provider: route.provider,
          model: route.model,
          modelKey: fallbackKey,
          fallback: true,
          globalFallback: true
        };
      } catch (e) {
        errors.push(`${p.title}/${route.model}: ${e.message}`);
      }
    }
  }

  throw new Error(errors.join(" | ") || "No working route");
}

async function callProvider(env, providerId, model, userText, maxTokens = 1800, timeoutMs = 25000) {
  const provider = PROVIDERS[providerId];
  const key = env[provider.keyEnv];

  if (!key) throw new Error(`${provider.keyEnv} missing`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("provider_timeout"), timeoutMs);

  let response;
  try {
    response = await fetch(`${provider.base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal,
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
  } catch (e) {
    if (e?.name === "AbortError" || String(e).includes("provider_timeout")) {
      throw new Error(`TIMEOUT after ${timeoutMs}ms`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`HTTP ${response.status}: provider returned non-JSON`);
  }

  if (!response.ok) {
    const msg =
      data?.error?.message ||
      data?.message ||
      data?.detail ||
      `HTTP ${response.status}`;

    throw new Error(`${response.status}: ${String(msg).slice(0, 240)}`);
  }

  const content = data?.choices?.[0]?.message?.content;

  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const text = content.map(x => x?.text || x?.content || "").join("").trim();
    if (text) return text;
  }

  throw new Error("Empty response");
}

function friendlyError(error) {
  const msg = String(error?.message || error);

  if (/401|invalid api key|格式不完整/i.test(msg)) {
    return "Один из API-ключей неверный или скопирован не полностью.";
  }
  if (/403|consent|verify your email|permission/i.test(msg)) {
    return "Провайдер требует подтверждение email или согласие на free-модели.";
  }
  if (/429|free route.*not active|quota|rate limit|limit/i.test(msg)) {
    return "Free-маршрут сейчас неактивен, закончилась квота или сработал rate limit.";
  }
  if (/missing/i.test(msg)) {
    return "Не хватает API-ключа нужного провайдера.";
  }

  return msg.slice(0, 500);
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
