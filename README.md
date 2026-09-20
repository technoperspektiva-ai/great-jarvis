# Great Jarvis v3 — Free Models

Telegram bot: `@greatjarvis_bot`

This build is focused on three free models and uses exact provider-specific model IDs.

## Models

### Qwen 3.8 27B Free
Primary:
- Provider: OrcaRouter
- Model: `qwen/qwen3.8-27b-free`

Fallback:
- Provider: Token Harbor
- Model: `qwen3.8-27b:free`

### DeepSeek V4 Pro Free
Primary:
- Provider: TeamoRouter
- Model: `deepseek-v4-pro-free`

Fallback:
- Provider: OrcaRouter
- Model: `deepseek/deepseek-v4-pro-free`

### MiMo V2.5 Free
- Provider: Token Harbor
- Model: `mimo-v2.5:free`

## Cloudflare Secrets

Add these in:
Cloudflare -> Workers & Pages -> great-jarvis -> Settings -> Variables and Secrets

Required for Telegram:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`

Provider keys:
- `TOKENHARBOR_API_KEY`
- `TEAMOROUTER_API_KEY`
- `ORCAROUTER_API_KEY`

You do NOT need `OPENAI_API_KEY`.

## Deploy

```bash
npm install
npx wrangler login
npm run deploy
```

The Durable Object used for per-user model selection is declared in `wrangler.toml` and is created during deploy. No separate KV namespace is required.

## Setup Telegram webhook

After deploy open:

https://great-jarvis.black-sci-official.workers.dev/setup-webhook

Expected:
`"ok": true`

Check:

https://great-jarvis.black-sci-official.workers.dev/webhook-info

## Test every route

Open:

https://great-jarvis.black-sci-official.workers.dev/test-routes

It sends a very small test to every configured free route and shows which exact provider/model succeeds or fails.

## Telegram

Commands:
- `/start`
- `/model`
- `/current`
- `/providers`
- `/testroutes`
- `/help`

`/model` has three buttons:
- Qwen 3.8 27B Free
- DeepSeek V4 Pro Free
- MiMo V2.5 Free

## Important Token Harbor free-model setting

Token Harbor free routes can require free-model opt-in/consent in the Token Harbor account. If `mimo-v2.5:free` or `qwen3.8-27b:free` returns a permission/consent error, enable free model access in the Token Harbor dashboard first.

The bot does not expose provider API keys in diagnostics.
