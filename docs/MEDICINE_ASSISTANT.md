# Medicine chat: local 1.6.0

This implements the instructor-requested AI feature locally. After the free OpenRouter Gemma endpoint returned repeated 429 errors, the user selected a direct Groq connection with `openai/gpt-oss-20b`. The earlier OpenRouter configuration is retained as an explicit alternative. The selected provider and key are configured locally; the latest live-check result is recorded below. No clinical validation, deployment or participant testing is claimed; live-request verification is recorded separately below.

## Implemented scope

Today, Medicine and Help link to the same optional assistant, with one explicit Back to Medicine action. It supports English text questions, consent, short conversation history, escaped formatted answers, streamed text, Stop response, confirmed New chat, correction/retry and persistent Read aloud. Comfort settings and A/B/C presentation are shared as before. It has no record-changing tools and never automatically includes medicine/contact/appointment data.

The intended model scope is general uses, side effects, questions for a pharmacist and general wellness information. It must not prescribe, diagnose, calculate whether a quantity is safe, change doses or recommend medicine/herbal/supplement replacements. Model instructions and a conservative output filter reduce some risks; neither guarantees safe or correct answers. There is no clinical review or live drug-label retrieval. Reading links are explicitly not answer-specific verified citations. Check information against the relevant package leaflet and pharmacist.

Possible overdose/serious-reaction wording and the visible urgent-help control show fixed guidance immediately without an LLM. The endpoint repeats the check before generation. This is an incomplete English keyword screen, not medical triage. A negative match does not mean safety. Suspected poisoning needs prompt professional help even without symptoms; contact local emergency services or a poison centre rather than waiting for chat. No emergency call is placed by Saha.

Sources used when designing these boundaries: [NHS poisoning guidance](https://www.nhs.uk/conditions/poisoning/) and [FDA supplement guidance](https://www.fda.gov/consumers/consumer-updates/fda-101-dietary-supplements). The latter advises against substituting supplements for prescribed medicines. These links do not validate generated responses.

## Current local Groq setup

1. Run `npm.cmd ci` with Node 22. The server uses pinned `ai@7.0.162` and `@ai-sdk/groq@4.0.76`; the OpenRouter provider remains installed for the optional earlier path.
2. In the project's ignored `.env.local`, preserve existing entries and set:

   ```dotenv
   SAHA_CHAT_PROVIDER=groq
   GROQ_MODEL=openai/gpt-oss-20b
   SAHA_CHAT_ENABLED=true
   GROQ_API_KEY=your_groq_key
   ```

   The provider/model/enabled settings are prepared. Save the actual key privately in that file, not in chat or frontend code. An empty key prevents a provider request. Other providers' keys do not authenticate Groq. Duplicate/empty entries or an unsaved editor buffer can prevent the server from reading the intended value.
3. Restart the local server after changes. Shell environment variables take precedence over `.env.local`; clear a testing override with `Remove-Item Env:SAHA_CHAT_ENABLED -ErrorAction SilentlyContinue`, then run `npm.cmd run dev`. Open http://localhost:5173/, choose Ask about medicines, enter a fictional question, agree to sending it and choose Send.
4. Successful replies identify GPT-OSS 20B via Groq. The key stays on the server, care records are not automatically included, and chats remain in page memory. Authentication/rate/service failures preserve the typed question and show a recovery message.

The selected model is listed on [Groq's Free Plan](https://console.groq.com/docs/rate-limits); your exact account limits apply to requests and tokens at the organization level. Use the Free Plan for the intended no-cost demo. This integration changes no billing settings. It supports the fixed GPT-OSS 20B default and an explicit `openai/gpt-oss-120b` override; unknown Groq model settings are rejected. No automatic retry, provider switch or model fallback is configured.

The Groq SDK is configured with low reasoning effort. GPT-OSS does not support `reasoning_format`, so that option is omitted. Reasoning can be returned separately to the server; only answer text reaches the UI; separate reasoning is never forwarded. Generation is bounded to 1,500 output tokens (including reasoning), the existing 25-second timeout and the existing response/context character caps. See [Groq reasoning guidance](https://console.groq.com/docs/reasoning). Other providers retain the earlier 750-token bound. This is not clinical validation.

## Earlier Gemma setup (explicit OpenRouter selection)

1. Run `npm.cmd ci` using Node 22. Server-only dependencies are pinned to `ai@7.0.162` and `@openrouter/ai-sdk-provider@3.1.0`. The frontend stays vanilla JavaScript.
2. Create an [OpenRouter API key](https://openrouter.ai/settings/keys). Review the selected provider's processing/retention terms and free-request limits. Do not send real patient information.
3. In this project's ignored `.env.local`, preserve other entries and set:

   ```dotenv
   SAHA_CHAT_PROVIDER=openrouter
   OPENROUTER_MODEL=google/gemma-4-31b-it:free
   SAHA_CHAT_ENABLED=true
   OPENROUTER_API_KEY=your_openrouter_key
   ```

   Provider, model and enabled settings are already prepared locally. Fill the key privately in your editor, not in chat, source or browser fields. A Vercel/Gateway token is not an OpenRouter key. An empty key leaves generation unavailable.
4. Restart the local server after environment changes. Existing shell variables take precedence over `.env.local`; clear a testing override with `Remove-Item Env:SAHA_CHAT_ENABLED -ErrorAction SilentlyContinue` before `npm.cmd run dev`. Open http://localhost:5173/ and choose Ask about medicines, enter a fictional question, agree to sending it and choose Send.
5. Check the actual response and recovery states. A response from Gemma is labeled Gemma 4 31B via OpenRouter. No stored medicines/contacts are automatically sent. Free limits, capacity and model availability can change; see the [OpenRouter listing](https://openrouter.ai/google/gemma-4-31b-it:free) and [request limits](https://openrouter.ai/collections/free-models/).

OpenRouter uses a fixed `:free` model ID, no `openrouter/free` random selection, no paid fallback and no automatic retries. The default is the exact Gemma ID chosen by the user. An environment model override must also end in `:free`; a paid model setting is rejected before requesting generation. OpenRouter reasoning is requested disabled/excluded to fit the bounded short-answer flow; that does not establish answer quality.

The earlier Gateway integration remains available only when explicitly selected with `SAHA_CHAT_PROVIDER=gateway`, an `AI_GATEWAY_MODEL`, Gateway authentication and the enable flag. It is not used by the Gemma configuration and is not a fallback.

## Endpoint and deployment preparation

`POST /api/medicine-chat` accepts JSON `{consent:true,stream:true,messages:[{role:"user",content:"..."}, ...]}` with alternating user/assistant turns ending in user. It rejects client system roles and does not pass client tools/model/settings to the SDK. It checks origin/fetch metadata, JSON type, 40 KB body, 2,000 characters per user question, 6,000 characters per assistant answer, nine messages per request and 9,000 characters total. The body bound accommodates UTF-8 text within the character limits. Full conversations require an explicit New chat confirmation; previous context is never silently dropped. Overlong generated replies are rejected rather than cut mid-answer. There are no CORS permissions. Non-browser clients can bypass origin checks; these are not authentication.

The chat requests `stream:true` and consumes newline-delimited JSON (`application/x-ndjson`). Events are `start` (provider/model), `delta` (screened answer text), optional `replace` (fixed boundary response), `done` (completed answer/kind/provider/model), or `error` (sanitized failure). Only SDK text deltas are considered; reasoning, raw provider payloads and tools never reach the browser. Complete sentences are buffered for the existing conservative output screen before release; an incomplete final sentence waits for successful completion. This delays some text and cannot guarantee medical safety. Normal validation/configuration errors still return JSON HTTP errors; a provider failure after streaming begins is an `error` event, even when the HTTP status is already 200. The client requires `done` before accepting a turn as complete. Older callers without `stream:true` retain the buffered JSON response.

`server.mjs` pipes the Web response into the Node response rather than buffering its body. Client disconnects propagate cancellation; the handler also aborts generation on cancellation/deadline. The chat keeps the composer/focus/caret stable during updates, follows new replies only when already near the bottom, and offers Latest reply when reading earlier messages. Enter sends; Shift+Enter inserts a newline. Stop, navigation away, broken streams and provider errors mark partial replies incomplete and exclude those turns from future model context. Incomplete text may already have been read, so it must not be treated as a checked answer. Cancellation remains best effort.

Generation is a single bounded SDK call with a 25-second abort and no automatic retries. Groq uses a 1,500-token output limit; OpenRouter/Gateway use 750. Incomplete/failed generations produce a visible error, preserving typed input. Browser cancellation discards late results; stopping transport is best effort and does not guarantee zero provider charges. Responses use no-store. Questions, responses, tokens and provider error bodies are not explicitly logged by Saha. Provider/gateway/platform logging is separate.

Best-effort in-process limits allow six generations per address and sixty per function instance per minute. Counts reset and are not distributed or a global spend cap. Before enabling public generation, configure an account/project budget and appropriate platform abuse controls. No database, account system or distributed limiter was added.

For a future authorized Vercel release, keep the existing NEURAAI/saha link and static build settings. Vercel discovers `api/medicine-chat.js` as a separate Node Web Standard function; it imports `lib/medicine-chat.mjs`, shared safety code and the production `ai` dependency. The local server adapts the same handler. `lib/chat-provider.mjs` resolves the server-owned provider, credentials, fixed model and reasoning settings. Both provider packages remain server-side. Use [Vercel Node runtime documentation](https://vercel.com/docs/functions/runtimes/node-js). Deployment/function execution has not been verified on Vercel for this candidate.

The exact ten static files are the previous eight plus `medicine-assistant.js` and `medicine-safety.js`. The separate `.vercelignore` upload allowlist is eighteen files: the former thirteen plus those two modules, the API handler and both library files. `.env*`, docs, exports, browser profiles, research data, dependencies and reports remain excluded. API/library source is not copied into `dist`; local static serving blocks direct access to it. Production installation keeps `npm ci --omit=dev` because the AI SDK is a runtime dependency. No environment variables are embedded in public files.

## Storage and study separation

Only explicit submitted conversation text leaves the browser when a provider is enabled. Chat content/consent are in memory; refresh, confirmed New chat and workspace replacement clear them. Returning within the same page can retain the conversation. Navigation away aborts the client request and ignores late answers. Saved records/preferences, care backups and study event payloads contain no chat text. The screen ID/navigation event may be saved. Chats are not backed up and do not sync.

AI/provider and hosting services may process or retain messages, IPs and other request metadata under their policies. Saha does not make a no-retention promise on their behalf. Use fictional questions and review this external processing with the instructor before recruitment. Usability testing, content accuracy, live provider behavior and clinical safety are separate evaluations.

## Verification

Unit tests inject a substitute generation function to check boundaries, disabled configuration, request validation, server-owned settings, redacted errors, unsafe output/incomplete-answer fallback and rate-window expiry. Browser tests use a clearly identified intercepted test response for chat rendering/privacy, and the real disabled local endpoint for missing-configuration recovery. They also check offline urgent guidance, cancellation/late answers, clear/Cancel, refresh, explicit parent navigation and largest dark layouts. These are developer checks, not real LLM output or participant feedback. Exact completed counts are recorded at handover.

### Recorded checks: 4 November 2026

- Syntax passed; all 36 unit/build checks passed on the final candidate.
- The broad packaged browser run passed 78 of 79 cases. Its sole failure was an obsolete assertion expecting exported build 1.4.0 while the app correctly exported 1.5.0. The assertion was updated. After the final textarea styling/reset changes and added keyboard case, all nine focused packaged checks passed, including that complete study-session/export journey. These runs overlap; no single 80-case all-pass run is claimed.
- Phone emulation at 320/390 px and desktop at 1280 px confirmed no horizontal content overflow, a visible single Back control, all four tabs, persistent reader and largest-text dark fields. The broader existing checks also exercised 360 px and CRUD/reminder/gesture behavior.
- Direct requests to the actual local endpoint returned 503 with an explicit unconfigured message for an ordinary question and 200/urgent for a possible extra dose. Raw library/API source, `.env.local` and an encoded library path returned 404. No provider request was made.
- A CLI dry run listed exactly seventeen source inputs, with no credentials, documents, research exports, dependencies or reports. The public static build remains exactly ten files. Git diff whitespace checks passed.
- Source preview: http://localhost:5173/; studio: http://localhost:5173/studio/; build `saha-phase1-1.5.0`. Screenshots and the model catalog/dry-run metadata are in ignored `playwright-report/assistant/`; the screenshot browser recorded no page errors. This is local work only, with no Git push or Vercel deployment for 1.5. No physical phone, human assistive-technology session, live model or clinical evaluation was conducted.

### Continued local preparation

The follow-up review found and fixed inconsistent answer/history limits: a returned answer could previously exceed the next request's 2,000-character message limit. Shared limits now distinguish 2,000-character questions and 6,000-character answers, preserve a 9,000-character conversation bound and allow bounded multibyte UTF-8 input. Full chats keep all earlier messages and the new draft while asking for an explicit clear/new start. Oversized answers are rejected instead of silently truncated.

On the final source, syntax and all 38 unit/build checks passed. A complete packaged Chrome run then passed all 81 cases in 5.2 minutes, including the previously corrected study export assertion and new follow-up/history regression. This supersedes the earlier incomplete all-suite result above. The local development server was restarted with the updated handler, and direct requests confirmed accepted longer history reaches the disabled-provider response (503), excessive history is rejected (400), and possible extra-dose guidance remains available (200). No model request was made.

The user explicitly chose to keep this version local. No commit, push, deployment or AI-account configuration was performed. The source preview remains http://localhost:5173/ with studio at http://localhost:5173/studio/; production remains unchanged. Browser checks use desktop Chrome emulation and substitute responses, not physical-phone testing or clinical/model evaluation.

### Local Gemma integration checks

The OpenRouter provider package declares AI SDK 7 / Node 22 compatibility and its installed types/source were inspected. An integration test runs the real AI SDK and OpenRouter provider against an injected network transport: it checks the OpenRouter endpoint, server-held authorization header, exact Gemma model ID, system instructions, output limit, disabled/excluded reasoning, no client tools or model fallback, and final-text-only rendering. Separate cases verify missing credentials/paid model settings block generation and that upstream authentication, account, capacity and rate errors are redacted and not automatically retried. These network substitutes are not real Gemma responses.

### Gemma local handover: 4 November 2026

- Current local build: `saha-phase1-1.5.1`, source http://localhost:5173/, studio http://localhost:5173/studio/.
- The user saved an OpenRouter key privately; configuration and the running server were reloaded. Account metadata returned HTTP 200 and showed fifty of fifty daily free requests remaining. No key value was printed.
- Two bounded live fictional requests were attempted: one directly through Saha's local endpoint and one through the actual participant chat UI. Both returned upstream HTTP 429 (`provider_rate_limit`), so no completed Gemma answer was obtained. This is a live service/rate limitation, not a successful model-response or medical-quality check. The UI retained the typed question and reported the limitation with no page errors. No alternate or paid model was used.
- Syntax and all 41 unit/build/provider tests passed. All 29 targeted packaged Chrome browser checks passed, covering the assistant, provider-limit recovery, privacy, largest dark settings at 320/360/390 px and desktop widths, B/C equivalence, direct routes, CRUD/save/back and refresh. SDK/provider tests used a substitute network transport; no simulated answer was presented as a real Gemma result.
- The key is absent from all ten static output files, `.env.local` remains ignored, and the source upload allowlist excludes secrets and private data. Local screenshots/results are in ignored `playwright-report/assistant/`. No Git commit/push or Vercel deployment was performed for this work.
- Next live verification is a short fictional question once the free Gemma endpoint accepts requests; a provider timeout/rate error must remain visible and must not be recorded as an unassisted successful experiment. Real devices, human assistive technology and clinical content evaluation remain separate work.

### Groq local handover: 4 November 2026

- Build `saha-phase1-1.5.2` selects Groq directly with `openai/gpt-oss-20b`. The user saved the Groq key privately and the local server was restarted to load it. Existing provider keys were preserved; no credential was printed.
- A real participant browser journey at http://localhost:5173/ submitted a fictional request for three questions to ask a pharmacist. Groq returned HTTP 200 with `kind: ai`, provider `groq` and the requested model. Observed response time was 739 ms for this one request, not a latency benchmark or reliability guarantee.
- The actual answer and GPT-OSS 20B via Groq label appeared in the chat. No page errors were recorded, and the submitted chat text was absent from saved care state. The model used markdown emphasis despite the plain-text instruction; the interface displayed it as escaped text, with no HTML execution. There is no clinical-quality claim from this technical smoke test.
- Syntax and all 44 unit/build/provider checks passed. All 29 targeted packaged browser checks passed, including chat consent/privacy, error recovery, keyboard access, follow-up limits, combined largest dark settings, B/C equivalence, participant/studio direct loading, exclusion checks, and medicine/appointment add/edit/save/back flows at phone and desktop widths.
- Provider tests execute the actual Groq SDK against substitute transports to verify model/settings/auth headers, no automatic fallback/retries, final-text-only rendering and redacted authentication/rate errors. These are separate from the single real browser response.
- The application remains local. No commit, push, Vercel deployment or billing change was made. The older OpenRouter Gemma 429 result remains historical and does not describe the now-selected Groq connection. Free-plan account/token limits and provider privacy terms still apply.

At viewport heights of 620 px or less, including keyboard-sized windows, chat uses one central scroll area containing the conversation and composer so controls remain reachable. The global header and four tabs stay visible. On taller windows only the transcript scrolls and the composer stays visible. Mobile checks use desktop Chrome emulation; an actual phone keyboard and human screen-reader use still need separate verification.


### Local 1.6 streaming chat handover: 4 November 2026

- Local source: http://localhost:5173/ and http://localhost:5173/studio/; build `saha-phase1-1.6.0`. Choose Ask about medicines to open Ask Saha. The source server was restarted to load the streaming backend and existing private Groq configuration. No environment credential value was printed or changed.
- The interface now uses user/assistant bubbles, three optional question starters, escaped emphasis/lists, an independently scrolling conversation, a persistent composer on taller windows, Enter/Shift+Enter controls, Stop, and confirmed New chat. Updates preserve the composer DOM, caret and focus. New text follows only when near the bottom; Latest reply returns to the newest text. Short windows use a single central scroll area with focus spacing; the global header and all tabs remain visible. B/C chat markup and presentation are identical; A retains its conventional font size.
- Two real fictional browser requests returned HTTP 200, NDJSON streaming and completed GPT-OSS 20B replies through Groq. The first delivered nine browser read chunks and seven text-delta events; the final-layout check delivered eight chunks and seven deltas. In both, first text arrived before `done`. Observed complete-journey times were 1,425 ms and 2,038 ms; these single-request observations are not a performance benchmark. Neither browser recorded page errors or found chat text in saved care state.
- Unit tests verify delivery of a sentence through an HTTP pipe before an intentionally paused provider finishes, reasoning exclusion, split unsafe-output screening, incomplete/error streams, cancellation and escaped rendering. The real Groq SDK is separately exercised against a substitute SSE transport to confirm upstream `stream:true`, model/settings and answer-only forwarding.
- Syntax, all 50 unit/build/provider/stream tests and Git whitespace checks passed. A complete packaged Chrome run passed all 88 then-existing cases in 5.4 minutes. Subsequent chat layout refinements and two additional regressions were covered by targeted runs; the 31-case assistant/comfort run passed. The final 20-case assistant/direct-route/exclusion run passed after the scroll-spacing correction. These runs overlap and should not be added as independent samples.
- Phone emulation covers 320/360/390 px and desktop 1280 px, combined largest text/dark/contrast/spacing, streaming while typing, interruption/late responses, error recovery, privacy, keyboard input, explicit return and refresh. A separate 320 x 480 short-window check uses actual wheel scrolling and verifies controls inside the viewport. An initial final-check failure found 1.25 px of textarea clipping at this height; scroll spacing was corrected and rechecked. No physical-phone keyboard or human assistive-technology testing is claimed.
- Public output remains ten allowlisted frontend files. A private comparison against all three configured credential values found none in that output; no private document/data paths were present. Reports/screenshots remain under ignored `playwright-report/assistant/`; current screenshots include `chat-empty-phone.png`, `chat-live-phone.png`, `chat-live-desktop.png` and `chat-live-largest-dark-320.png`. These screenshots show the actual local Groq response; controlled browser regressions use explicit substitutes.
- No Git commit/push, Vercel deployment, database, account system or billing change was made. Clinical content accuracy, provider reliability, accessibility with real users and study approval remain separate work.
