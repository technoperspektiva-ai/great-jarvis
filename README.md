# Great Jarvis v6.4

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


## v5.8 vision MIME fix

Telegram can return uploaded photos as:

`application/octet-stream`

even when the file is actually JPEG/PNG/WEBP.

Vision providers reject that MIME type.

Great Jarvis now detects the real image MIME from:
1. Telegram file extension
2. file signature / magic bytes

Supported detection:
- JPEG
- PNG
- WEBP
- GIF

Unknown Telegram photo payloads fall back to `image/jpeg`.


## v5.9 reliable photo vision

Fixes a second MIME bug in the Cloudflare Qwen vision call.

Previously the Worker detected `image/jpeg` correctly, but then stripped the
`data:image/jpeg;base64,` prefix before passing the image to Workers AI.
That caused the model to see the payload as `application/octet-stream`.

Now:
- Qwen receives the full `data:image/...;base64,...` value;
- Cloudflare vision has a 20 second timeout;
- OpenRouter fallback has an 18 second timeout;
- the bot immediately shows Telegram typing activity while processing a photo;
- failures return to the user instead of hanging indefinitely.


## v6.0 — natural human chat style

Great Jarvis now behaves more like a real Telegram conversation.

Changes:
- more natural, confident conversational tone;
- avoids repetitive assistant phrases such as "Конечно!" at the start of every reply;
- simple questions tend to get short answers;
- complex questions can still get detailed answers;
- AI replies may arrive as one message, two messages, or several natural paragraph bubbles;
- message count varies instead of splitting every response the same way;
- short replies normally stay as a single message;
- photo and voice answers use the same conversational delivery style.

The splitting is deterministic per response text, so it feels varied without relying on unstable randomness.


## v6.1 — assistant tools

Added:

- YouTube search links:
  `/youtube lo-fi hip hop`
  or natural requests like "знайди відео про..."

- Google Maps search links:
  `/maps кафе поруч`
  or natural requests like "знайди кафе..."

- Saved finds / notes:
  `/save рецепт пасти https://example.com`
  `/saved`

- Real Telegram reminders using Durable Object Alarms:
  `нагадай через 30 хвилин перевірити духовку`
  `напомни через 2 часа позвонить`
  `/reminders`

Notes and reminders are stored per Telegram user ID in the same Durable Object used for chat memory.

No D1 is required.

Important:
- YouTube and Google Maps currently open precise search URLs.
- For ranked video results, ratings, place opening hours, reviews, etc. add a dedicated search/Places API later.
- Reminder alarms send directly through Telegram using the saved bot token.


## v6.2 — real YouTube Data API v3 search

Jarvis now uses the YouTube Data API instead of returning only a generic search link.

Cloudflare secret required:

```bash
npx wrangler secret put YOUTUBE_API_KEY
```

Then paste your YouTube Data API v3 key.

Supported:
- `/youtube qwen tutorial`
- `/yt best iphone camera test`
- `знайди відео про Cloudflare Workers`
- `порадь музику для вечора`
- `найди песню Depeche Mode Enjoy the Silence`

Jarvis returns up to 5 concrete videos:
- title
- channel
- direct `youtu.be` URL

If the API is unavailable or the quota is exhausted, Jarvis falls back to a normal YouTube search URL.


## v6.3 — YouTube natural-language routing fix

Fixed cases where natural requests such as:
- "скинь відео з ютуба"
- "знайди мені щось цікаве на YouTube"
- "порадь музику"
- "дай трек"
- "покажи відео про Minecraft"

were accidentally sent to the normal text model.

YouTube/media intent is now intercepted BEFORE normal LLM chat.

Added:
`/youtube-status`

It reports whether `YOUTUBE_API_KEY` is present in Cloudflare Secrets.


## v6.4 — create sticker from photo

Great Jarvis can now create a sticker based on an uploaded photo.

How to use:
- send a photo with caption `зроби стікер`
- or `сделай стикер`
- or `зроби стікер з цього фото`
- or `/photosticker`

Flow:
1. Jarvis analyzes the uploaded photo with vision.
2. Extracts the main visible subject.
3. Generates a clean Telegram sticker illustration from that subject.
4. Sends it back as a Telegram sticker.

This is a generated sticker based on the contents of the photo, not a raw file conversion.
