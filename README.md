# Great Jarvis v4.6

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

- TH-Rudder
  - Token Harbor: `th-rudder`

- Mistral Large
  - NaraRouter: `mistral-large`

- Mistral Medium 3.5
  - NaraRouter: `mistral-medium-3-5`

- Tencent HY3 Free
  - NaraRouter: `tencent-hy3-free`

- Nara Auto
  - NaraRouter: `auto/bynara`

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
- `NARAROUTER_API_KEY`

No OpenAI API key is needed.

NaraRouter base URL:
`https://router.bynara.id/v1`

NaraRouter keys normally start with:
`sk-nry-`

To see the exact models enabled for your Nara account:
`https://great-jarvis.black-sci-official.workers.dev/nara-models`

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


## v4.4 diagnostics fix

`/test-routes` now checks all routes in parallel instead of sequentially.
Each provider route gets a 7-second timeout, so one slow API can no longer block
the whole diagnostics page.


## v4.5 resilient routing

- `/model` shows live status:
  - ✅ available
  - ❌ unavailable
- A broken provider does not stop the bot.
- The selected model is tried first.
- If all routes for the selected model fail, Great Jarvis automatically tries
  other configured models until one succeeds.
- `/current` also shows the live availability status.


## v4.6 health status fix

The model menu no longer treats a slow provider as dead.

Statuses:
- ✅ confirmed working
- ⚠️ connected but health check timed out / rate limited / temporary provider error
- ❌ confirmed auth or model error

Health probes run in parallel with an 8-second timeout.
The status is informational only and never blocks normal chat routing.
