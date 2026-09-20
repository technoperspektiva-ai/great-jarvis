# Great Jarvis v4

Updated free-model routing.

## Exact routes

- Qwen 3.8 27B
  - OrcaRouter: `qwen/qwen3.8-27b-free`

- DeepSeek V4 Pro
  - TeamoRouter: `deepseek-v4-pro-free`
  - OrcaRouter fallback: `deepseek/deepseek-v4-pro-free`

- DeepSeek V4 Flash
  - TeamoRouter: `deepseek-v4-flash-free`
  - OrcaRouter fallback: `deepseek/deepseek-v4-flash-free`
  - Token Harbor fallback: `deepseek-v4-flash:free`

- MiMo V2.5
  - Token Harbor: `mimo-v2.5:free`

- Orca Auto Free
  - OrcaRouter: `orcarouter/free`

## Cloudflare Secrets

Required:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`

Provider API keys:
- `TEAMOROUTER_API_KEY`
- `ORCAROUTER_API_KEY`
- `TOKENHARBOR_API_KEY`

No OpenAI API key is needed.

## Deploy

```bash
npm install
npx wrangler login
npm run deploy
```

Durable Object storage is declared in `wrangler.toml`.

## Setup webhook

Open:

https://great-jarvis.black-sci-official.workers.dev/setup-webhook

## Diagnostics

Open:

https://great-jarvis.black-sci-official.workers.dev/test-routes

A model is usable if at least one of its routes returns `ok: true`.

## Telegram

- `/start`
- `/model`
- `/current`
- `/providers`
- `/testroutes`
- `/help`
