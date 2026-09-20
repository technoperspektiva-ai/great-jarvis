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
  },
  groq: {
    title: "Groq",
    base: "https://api.groq.com/openai/v1",
    keyEnv: "GROQ_API_KEY"
  },
  openrouter: {
    title: "OpenRouter",
    base: "https://openrouter.ai/api/v1",
    keyEnv: "OPENROUTER_API_KEY"
  },
  nvidia: {
    title: "NVIDIA NIM",
    base: "https://integrate.api.nvidia.com/v1",
    keyEnv: "NVIDIA_API_KEY"
  },
  cloudflare: {
    title: "Cloudflare Workers AI",
    native: true
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
  },
groq_qwen: {
    title: "Qwen 3.8 27B · Groq",
    routes: [
      { provider: "groq", model: "qwen/qwen3.8-27b" },
      { provider: "orca", model: "qwen/qwen3.8-27b-free" }
    ]
  },
  groq_gptoss120: {
    title: "GPT-OSS 120B · Groq",
    routes: [
      { provider: "groq", model: "openai/gpt-oss-120b" },
      { provider: "nvidia", model: "openai/gpt-oss-120b" },
      { provider: "cloudflare", model: "@cf/openai/gpt-oss-120b" }
    ]
  },
  groq_gptoss20: {
    title: "GPT-OSS 20B · Groq",
    routes: [
      { provider: "groq", model: "openai/gpt-oss-20b" },
      { provider: "nvidia", model: "openai/gpt-oss-20b" }
    ]
  },
  openrouter_free: {
    title: "OpenRouter Free",
    routes: [
      { provider: "openrouter", model: "openrouter/free" }
    ]
  },
  cf_glm47: {
    title: "GLM 4.7 Flash · Cloudflare",
    routes: [
      { provider: "cloudflare", model: "@cf/zai-org/glm-4.7-flash" }
    ]
  },
  cf_gemma4: {
    title: "Gemma 4 26B · Cloudflare",
    routes: [
      { provider: "cloudflare", model: "@cf/google/gemma-4-26b-a4b-it" }
    ]
  },
  cf_gptoss120: {
    title: "GPT-OSS 120B · Cloudflare",
    routes: [
      { provider: "cloudflare", model: "@cf/openai/gpt-oss-120b" },
      { provider: "groq", model: "openai/gpt-oss-120b" },
      { provider: "nvidia", model: "openai/gpt-oss-120b" }
    ]
  },
  cf_nemotron3: {
    title: "Nemotron 3 120B · Cloudflare",
    routes: [
      { provider: "cloudflare", model: "@cf/nvidia/nemotron-3-120b-a12b" }
    ]
  },
  nvidia_glm53: {
    title: "GLM 5.3 · NVIDIA",
    routes: [
      { provider: "nvidia", model: "z-ai/glm-5-3" }
    ]
  },
  nvidia_glm53_flash: {
    title: "GLM 5.3 Flash · NVIDIA",
    routes: [
      { provider: "nvidia", model: "z-ai/glm-5-3-flash" }
    ]
  },
  nvidia_gptoss120: {
    title: "GPT-OSS 120B · NVIDIA",
    routes: [
      { provider: "nvidia", model: "openai/gpt-oss-120b" },
      { provider: "groq", model: "openai/gpt-oss-120b" },
      { provider: "cloudflare", model: "@cf/openai/gpt-oss-120b" }
    ]
  },
  nvidia_gptoss20: {
    title: "GPT-OSS 20B · NVIDIA",
    routes: [
      { provider: "nvidia", model: "openai/gpt-oss-20b" },
      { provider: "groq", model: "openai/gpt-oss-20b" }
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
      const authenticated = Boolean(await this.state.storage.get("authenticated"));
      return Response.json({
        model: model || DEFAULT_MODEL_KEY,
        authenticated
      });
    }

    if (request.method === "POST" && url.pathname === "/set") {
      const body = await request.json();
      if (!MODELS[body?.model]) {
        return Response.json({ ok: false, error: "invalid_model" }, { status: 400 });
      }
      await this.state.storage.put("model", body.model);
      return Response.json({ ok: true, model: body.model });
    }

    if (request.method === "POST" && url.pathname === "/auth") {
      const body = await request.json();
      await this.state.storage.put("authenticated", Boolean(body?.authenticated));
      return Response.json({ ok: true, authenticated: Boolean(body?.authenticated) });
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
        version: "5.1.0",
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

    if (request.method === "GET" && url.pathname === "/provider-models") {
      return providerModels(url, env);
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

function providerConnected(env, provider) {
  if (provider.native) return Boolean(env.AI);
  return Boolean(provider.keyEnv && env[provider.keyEnv]);
}

function providerSecretName(provider) {
  return provider.native ? "Cloudflare AI binding" : provider.keyEnv;
}

function providerStatus(env) {
  const result = {};
  for (const [id, p] of Object.entries(PROVIDERS)) {
    result[id] = {
      title: p.title,
      connected: providerConnected(env, p),
      secret: providerSecretName(p)
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

async function providerModels(url, env) {
  const id = url.searchParams.get("provider");
  if (!id || !PROVIDERS[id]) {
    return json({
      ok: false,
      error: "Use ?provider=groq|openrouter|nvidia|teamo|orca|tokenharbor|nara"
    }, 400);
  }

  const provider = PROVIDERS[id];

  if (provider.native) {
    return json({
      ok: true,
      provider: provider.title,
      native: true,
      models: Object.values(MODELS)
        .flatMap(x => x.routes)
        .filter(r => r.provider === id)
        .map(r => r.model)
    });
  }

  if (!providerConnected(env, provider)) {
    return json({ ok: false, error: `${provider.keyEnv} missing` }, 500);
  }

  try {
    const response = await fetch(`${provider.base}/models`, {
      headers: { Authorization: `Bearer ${env[provider.keyEnv]}` }
    });
    const data = await response.json();
    return json(data, response.ok ? 200 : response.status);
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, 500);
  }
}

async function testRoutes(env) {
  const jobs = [];

  for (const [key, cfg] of Object.entries(MODELS)) {
    for (const route of cfg.routes) {
      const provider = PROVIDERS[route.provider];

      jobs.push((async () => {
        if (!providerConnected(env, provider)) {
          return {
            model: cfg.title,
            provider: provider.title,
            route_model: route.model,
            ok: false,
            skipped: true,
            error: `${providerSecretName(provider)} missing`
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
  const text = message?.text?.trim() || message?.caption?.trim() || "";
  const photos = Array.isArray(message?.photo) ? message.photo : [];

  if (!chatId || !userId) return;

  // Access gate
  const authenticated = await isAuthenticated(env, userId);

  if (!authenticated) {
    if (text === "/start" || !text) {
      await send(env, chatId,
        "🔐 Great Jarvis закрыт паролем.\n\nВведи пароль одним сообщением."
      );
      return;
    }

    if (!env.BOT_ACCESS_PASSWORD) {
      await send(env, chatId,
        "❌ В Cloudflare не задан BOT_ACCESS_PASSWORD."
      );
      return;
    }

    if (text === env.BOT_ACCESS_PASSWORD) {
      await setAuthenticated(env, userId, true);
      await send(env, chatId,
        "✅ Доступ открыт.\n\nТеперь можешь писать сообщения, отправлять фото и использовать /model."
      );
      return;
    }

    await send(env, chatId, "❌ Неверный пароль.");
    return;
  }

  if (text === "/logout") {
    await setAuthenticated(env, userId, false);
    await send(env, chatId, "🔒 Доступ закрыт. Для входа снова введи пароль.");
    return;
  }

  if (text === "/start") {
    const selected = await getUserModel(env, userId);
    await send(env, chatId,
      `Привет 👋\n\nЯ Great Jarvis.\n` +
      `Текущая модель: ${MODELS[selected].title}\n\n` +
      `Можно писать текст или отправлять фото.\n/model — выбрать модель\n/current — текущая модель\n/logout — выйти`
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
      lines.push(`${providerConnected(env, p) ? "✅" : "❌"} ${p.title}`);
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

  if (text === "/help") {
    await send(env, chatId,
      "/model — выбрать модель\n" +
      "/current — текущая модель\n" +
      "/providers — статус API\n" +
      "/testroutes — диагностика маршрутов\n" +
      "/logout — выйти\n" +
      "/help — помощь\n\n" +
      "Также можно отправить фото с подписью или без неё."
    );
    return;
  }

  try {
    await telegram(env, "sendChatAction", { chat_id: chatId, action: "typing" });

    // Photo flow
    if (photos.length) {
      const best = photos[photos.length - 1];
      const imageDataUrl = await telegramPhotoToDataUrl(env, best.file_id);
      const prompt = text || "Опиши это изображение и ответь на языке пользователя.";

      const vision = await askVisionWithFallback(env, imageDataUrl, prompt);
      await sendLong(env, chatId,
        vision.text +
        `\n\n👁️ Vision: ${vision.providerTitle} · ${vision.model}`
      );
      return;
    }

    // Text flow
    if (!text) return;

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

  if (!(await isAuthenticated(env, userId))) {
    await answerCallback(env, callbackId, "Сначала введи пароль.", true);
    return;
  }

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
        return { state: "bad", reason: `${providerSecretName(provider)} missing` };
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

  if (!providerConnected(env, provider)) {
    return { state: "bad", reason: `${providerSecretName(provider)} missing` };
  }

  try {
    await callProvider(env, providerId, model, "Reply only OK", 8, 8000);
    return { state: "ok", reason: "working" };
  } catch (e) {
    const msg = String(e?.message || e);

    if (/401|403|invalid api key|unauthor|forbidden/i.test(msg)) {
      return { state: "bad", reason: msg };
    }
    if (/404|unknown model|model.*not|not active/i.test(msg)) {
      return { state: "bad", reason: msg };
    }
    return { state: "unknown", reason: msg };
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
      "Статус не блокирует работу: Great Jarvis пробует выбранную модель, её резервы и затем другие рабочие модели.",
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

  return {
    inline_keyboard: Object.entries(MODELS).map(([key, cfg]) => [{
      text: `${icon(key)} ${current === key ? "• " : ""}${cfg.title}`,
      callback_data: `model:${key}`
    }])
  };
}

async function isAuthenticated(env, userId) {
  try {
    const id = env.USER_PREFS.idFromName(String(userId));
    const stub = env.USER_PREFS.get(id);
    const response = await stub.fetch("https://prefs/get");
    const data = await response.json();
    return Boolean(data?.authenticated);
  } catch {
    return false;
  }
}

async function setAuthenticated(env, userId, authenticated) {
  const id = env.USER_PREFS.idFromName(String(userId));
  const stub = env.USER_PREFS.get(id);
  const response = await stub.fetch("https://prefs/auth", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ authenticated })
  });
  if (!response.ok) throw new Error("Could not save auth state");
}

async function telegramPhotoToDataUrl(env, fileId) {
  const fileInfo = await telegram(env, "getFile", { file_id: fileId });
  const filePath = fileInfo?.file_path;
  if (!filePath) throw new Error("Telegram file_path missing");

  const response = await fetch(
    `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${filePath}`
  );
  if (!response.ok) throw new Error(`Telegram photo download HTTP ${response.status}`);

  const bytes = new Uint8Array(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") || "image/jpeg";
  const base64 = bytesToBase64(bytes);

  return `data:${contentType};base64,${base64}`;
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function askVisionWithFallback(env, imageDataUrl, prompt) {
  const routes = [
    {
      provider: "openrouter",
      model: "openrouter/free",
      title: "OpenRouter"
    },
    {
      provider: "nvidia",
      model: "nvidia/nemotron-nano-12b-v2-vl",
      title: "NVIDIA NIM"
    }
  ];

  const errors = [];

  for (const route of routes) {
    const provider = PROVIDERS[route.provider];
    if (!providerConnected(env, provider)) continue;

    try {
      const text = await callVisionProvider(
        env,
        route.provider,
        route.model,
        imageDataUrl,
        prompt
      );

      return {
        text,
        provider: route.provider,
        providerTitle: route.title,
        model: route.model
      };
    } catch (e) {
      errors.push(`${route.title}: ${String(e?.message || e)}`);
    }
  }

  throw new Error(errors.join(" | ") || "No vision route available");
}

async function callVisionProvider(env, providerId, model, imageDataUrl, prompt) {
  const provider = PROVIDERS[providerId];
  if (!providerConnected(env, provider)) {
    throw new Error(`${providerSecretName(provider)} missing`);
  }

  if (provider.native) {
    throw new Error("Native Workers AI vision route is not configured in this build");
  }

  const response = await fetch(`${provider.base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env[provider.keyEnv]}`,
      "Content-Type": "application/json",
      ...(providerId === "openrouter"
        ? {
            "HTTP-Referer": "https://great-jarvis.black-sci-official.workers.dev",
            "X-Title": "Great Jarvis"
          }
        : {})
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageDataUrl } }
          ]
        }
      ],
      max_tokens: 1200
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
      data?.message ||
      `HTTP ${response.status}`
    );
  }

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim()) return content.trim();

  throw new Error("Empty vision response");
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

    if (!providerConnected(env, p)) {
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
      if (!providerConnected(env, p)) continue;

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

  if (!providerConnected(env, provider)) {
    throw new Error(`${providerSecretName(provider)} missing`);
  }

  const systemPrompt =
    env.SYSTEM_PROMPT || "Ты Great Jarvis — полезный Telegram-ассистент.";

  if (provider.native) {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`TIMEOUT after ${timeoutMs}ms`)), timeoutMs)
    );

    const run = env.AI.run(model, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText }
      ],
      max_tokens: maxTokens
    });

    const data = await Promise.race([run, timeout]);

    const text =
      data?.response ||
      data?.result?.response ||
      data?.choices?.[0]?.message?.content ||
      data?.output_text;

    if (typeof text === "string" && text.trim()) return text.trim();

    throw new Error("Empty Workers AI response");
  }

  const key = env[provider.keyEnv];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("provider_timeout"), timeoutMs);

  let response;
  try {
    response = await fetch(`${provider.base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(providerId === "openrouter"
          ? {
              "HTTP-Referer": "https://great-jarvis.black-sci-official.workers.dev",
              "X-Title": "Great Jarvis"
            }
          : {})
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText }
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
    throw new Error(`${response.status}: ${String(msg).slice(0, 260)}`);
  }

  const content = data?.choices?.[0]?.message?.content;

  if (typeof content === "string" && content.trim()) return content.trim();

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
