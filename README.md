# Great Jarvis v5.7

Telegram: `@greatjarvis_bot`

Multi-provider free/fallback build.

## Providers

Existing:
- TeamoRouter
- OrcaRouter
- Token Harbor
- NaraRouter

Added in v5:
- Groq
- OpenRouter
- NVIDIA NIM
- Cloudflare Workers AI (native binding, no external key)

## Cloudflare Secrets

Keep/add:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET

TEAMOROUTER_API_KEY
ORCAROUTER_API_KEY
TOKENHARBOR_API_KEY
NARAROUTER_API_KEY

GROQ_API_KEY
OPENROUTER_API_KEY
NVIDIA_API_KEY
```

No OpenAI API key is required.

Cloudflare Workers AI uses:

```toml
[ai]
binding = "AI"
```

## New v5 routes

Groq:
- `qwen/qwen3.8-27b`
- `openai/gpt-oss-120b`
- `openai/gpt-oss-20b`

OpenRouter:
- `openrouter/free`

Cloudflare Workers AI:
- `@cf/zai-org/glm-4.7-flash`
- `@cf/google/gemma-4-26b-a4b-it`
- `@cf/openai/gpt-oss-120b`
- `@cf/nvidia/nemotron-3-120b-a12b`

NVIDIA NIM:
- `z-ai/glm-5-3`
- `z-ai/glm-5-3-flash`
- `openai/gpt-oss-120b`
- `openai/gpt-oss-20b`

All previous routes are retained.

## Model menu

`/model` automatically builds buttons from the model registry, so newly added model entries cannot be forgotten.

Status:
- ✅ confirmed working
- ⚠️ timeout/rate-limit/temporary state
- ❌ confirmed auth/model error

A bad provider never blocks the bot. It tries:
1. selected model
2. alternative routes for that model
3. other configured models

## Deploy

```bash
npm install
npx wrangler login
npm run deploy
```

## Webhook

```text
https://great-jarvis.black-sci-official.workers.dev/setup-webhook
```

## Diagnostics

All routes:

```text
https://great-jarvis.black-sci-official.workers.dev/test-routes
```

Provider model lists:

```text
https://great-jarvis.black-sci-official.workers.dev/provider-models?provider=groq
https://great-jarvis.black-sci-official.workers.dev/provider-models?provider=openrouter
https://great-jarvis.black-sci-official.workers.dev/provider-models?provider=nvidia
```

Telegram commands:
- `/start`
- `/model`
- `/current`
- `/providers`
- `/testroutes`
- `/help`


## v5.1

### Password access

Add Cloudflare Secret:

```text
BOT_ACCESS_PASSWORD
```

Set its value to:

```text
anastasia
```

On first `/start` the bot asks for the password.
Successful login is remembered per Telegram user in the Durable Object.
Use `/logout` to close access again.

### Photo support

The bot now accepts Telegram photos.

- Send a photo by itself.
- Or send a photo with a caption/question.
- Great Jarvis downloads the Telegram image and sends it to a vision-capable route.
- Vision fallback currently tries OpenRouter first and NVIDIA NIM second.


## v5.2 vision fix

Photo analysis now uses a specific free multimodal model first:

`inclusionai/ling-3.0-flash-vl:free`

Fallback:

`openrouter/free`

This avoids relying on the generic free router as the primary vision path.

Technical labels such as:

`User Safety: safe`

and

`Vision: ...`

are removed from normal Telegram replies.


## v5.3 voice support

Telegram voice messages and audio files are now supported.

Flow:

1. Telegram voice/audio is downloaded by the Worker.
2. Groq Speech-to-Text transcribes it using:
   `whisper-large-v3-turbo`
3. The transcription is passed to the currently selected Jarvis model.
4. The bot returns the normal assistant answer.

Required secret:
`GROQ_API_KEY`

Supported Telegram voice `.ogg` files work directly with Groq Whisper.


## v5.4 sticker generation

Added live Telegram sticker generation.

How it works:
- `/sticker кот в очках`
- or `стикер: ёжик в короне`

The Worker uses Cloudflare Workers AI image generation with `@cf/black-forest-labs/flux-1-schnell`,
asks for a clean sticker-style image, and uploads it to Telegram using `sendSticker`.

No new external API key is required if the existing Cloudflare AI binding is already configured.

Also includes the v5.3.1 voice fix:
- Telegram `.oga` voice files are normalized to `.ogg` before Groq transcription.


## v5.4.1 sticker fix

Fixed Cloudflare Workers AI sticker generation by removing unsupported image parameters (`width`, `height`, `num_steps`) from the `@cf/black-forest-labs/flux-1-schnell` call.


## v5.5 normal image generation

Great Jarvis now detects explicit image-generation requests before they reach text models.

Supported examples:

```text
/image рыжий кот-космонавт на Луне
/photo красивый закат над Киевом
сгенерируй фото старого автомобиля под дождём
создай картинку милого медведя
нарисуй арт футуристического города
згенеруй зображення їжака на морі
```

These requests go directly to Cloudflare Workers AI image generation and the generated image is sent back as a Telegram photo.

Sticker generation remains separate through `/sticker`.

No new API key is required; the existing Cloudflare `AI` binding is used.


## v5.6 clean routing + real vision

Routing priority is now explicitly:

1. sticker generation
2. normal image generation
3. voice/audio transcription
4. uploaded-photo vision
5. normal text chat

Uploaded photos now use Cloudflare Workers AI Qwen 3.8 27B as the primary vision route:

`@cf/qwen/qwen3.8-27b`

OpenRouter Ling 3.0 Flash VL remains a fallback.

The bot also strips technical strings such as:
- `User Safety: safe`
- `Response Safety: safe`

New command:
`/visiontest`

No new API secret is required beyond the existing Cloudflare Workers AI `AI` binding.


## v5.7 Telegram-account chat memory

Conversation memory is now tied to the Telegram `user_id`.

That means:
- the same Telegram account keeps its memory across Worker restarts;
- the same account keeps its memory when using Telegram from another phone/PC;
- `/logout` only closes access and does NOT delete chat history;
- `/reset` deletes the saved conversation history.

The last 24 user/assistant messages are stored in the user's Durable Object and are
included in future text-model requests.

Photo analysis results and voice-message transcriptions are also added to memory.
