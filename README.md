# Great Jarvis — Multi Router v2

Telegram: `@greatjarvis_bot`

Поддержаны:

- Token Harbor — `https://tokenharbor.ai/v1`
- TeamoRouter — `https://api.teamorouter.com/v1`
- OrcaRouter — `https://api.orcarouter.ai/v1`

Бот сам получает `/v1/models`, показывает модели кнопками и хранит выбор каждого Telegram-пользователя в Cloudflare KV.

## 1. Cloudflare Secrets

В `Workers & Pages -> great-jarvis -> Settings -> Variables and Secrets` добавь:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
TOKENHARBOR_API_KEY
TEAMOROUTER_API_KEY
ORCAROUTER_API_KEY
```

Необязательно подключать все три API сразу. Бот показывает статус через `/providers`.

## 2. Cloudflare KV — нужен для запоминания выбора модели

В терминале проекта:

```bash
npm install
npx wrangler login
npx wrangler kv namespace create USER_PREFS
```

Wrangler вернёт ID. В `wrangler.toml` раскомментируй:

```toml
[[kv_namespaces]]
binding = "USER_PREFS"
id = "ТВОЙ_KV_ID"
```

Без KV бот сможет общаться через первый подключённый провайдер, но выбор модели кнопкой не будет сохраняться.

## 3. Deploy

```bash
npm run deploy
```

## 4. Webhook — с телефона одной ссылкой

После deploy открой:

```text
https://great-jarvis.black-sci-official.workers.dev/setup-webhook
```

Нужно увидеть:

```json
"ok": true
```

Проверка:

```text
https://great-jarvis.black-sci-official.workers.dev/webhook-info
```

## Telegram команды

```text
/start
/model
/provider
/current
/providers
/help
```

### `/model`

1. Показывает кнопки:
   - Token Harbor
   - TeamoRouter
   - OrcaRouter
2. После выбора сервиса загружает его `/v1/models`.
3. Показывает модели страницами по 8.
4. Выбранный provider + model сохраняется для этого Telegram user ID.

## Auto fallback

`AUTO_FALLBACK = "true"` включён по умолчанию.

Если выбранный API/модель дал ошибку, бот пытается следующий подключённый сервис.

При запасном маршруте внизу ответа появляется:

```text
↪️ Ответ через запасной маршрут: ...
```

Чтобы выключить fallback:

```toml
[vars]
AUTO_FALLBACK = "false"
```

## Проверка подключений

Открой:

```text
https://great-jarvis.black-sci-official.workers.dev/providers
```

или в Telegram:

```text
/providers
```

`true` / ✅ означает, что соответствующий secret существует в Worker.

## Важно

API-ключи никогда не добавляй в GitHub и не вставляй прямо в `wrangler.toml`. Используй Cloudflare Secrets.
