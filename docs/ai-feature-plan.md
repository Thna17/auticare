# AutiCare AI Features — Implementation Plan

**Status:** proposal, for review. No code written yet.
**Date:** 28 October 2026
**Author:** AutiCare build team
**Reviewer:** please see [Decisions](#12-decisions) at the end — the open questions are settled.

---

## 1. What this document is

A plan for the AI layer of AutiCare, written before any code is touched, so the
scope, the safety boundary and the cost are agreed first.

It is deliberately not a technical tutorial. It answers:

1. What the AI does, and where in the product each piece appears.
2. What the codebase already has, so the plan does not re-build it.
3. What has to be added, in which order, and how we will know each step is done.
4. What the AI is **never** allowed to do, and how that is enforced in code rather
   than by hoping the model behaves.

**Context that shapes everything below.** AutiCare is educational, never
diagnostic. Families in Cambodia use it during the weeks between first noticing
something and being seen by a specialist. A parent may read an answer at 11pm,
alone, on a phone, in Khmer. Every design choice below prefers "shorter, safer,
cheaper" over "clever".

---

## 2. What already exists in the codebase

This is the single most important section for scoping. Most of the AI surface
described in the product documents is **already implemented**. The realistic job
is: connect a provider, fill the gaps, and make the safety work auditable.

| Area                                                                     | State                                                                        | Where                                                           |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Chat assistant (conversations, messages, history, delete)                | **Built**                                                                    | `apps/api/src/modules/ai/ai.service.ts`, `ai.routes.ts`         |
| Save response / helpful-not-helpful feedback                             | **Built**                                                                    | `ai.routes.ts` (`/messages/:id/save`, `/messages/:id/feedback`) |
| Daily message allowance per parent                                       | **Built** (`AI_MAX_DAILY_MESSAGES`, default 40)                              | `ai.service.ts#status`                                          |
| Provider adapter (any OpenAI-compatible endpoint)                        | **Built**                                                                    | `ai.client.ts` (`OpenAiCompatibleClient`)                       |
| Safety floor: crisis, medication, verdict softening, clinician referral  | **Built and unit-tested**                                                    | `ai.safety.ts`, `ai.safety.test.ts`                             |
| Non-diagnostic system prompt ("RULES")                                   | **Built**                                                                    | `ai.prompt.ts`                                                  |
| Data minimisation in the prompt (age in months + observation count only) | **Built**                                                                    | `ai.prompt.ts#ChildContext`                                     |
| Retrieval of reviewed reference material + citation numbers              | **Built**                                                                    | `ai.grounding.ts`, `modules/guidance/`                          |
| Related activity links from message topic                                | **Built** (keyword → category, deterministic)                                | `ai.service.ts#matchActivitiesForContent`                       |
| Per-message provenance (model, latency, tokens, sources)                 | **Built**                                                                    | `AiMessage` model in `schema.prisma`                            |
| Admin AI status endpoint                                                 | **Built** (`GET /admin/ai`)                                                  | `admin.routes.ts`, `admin-content.service.ts`                   |
| Behaviour observations (the input data)                                  | **Built**                                                                    | `modules/observations/`                                         |
| Deterministic pattern detection over observations                        | **Built, no LLM**                                                            | `modules/insights/`                                             |
| **LLM-written educational summaries**                                    | **Missing**                                                                  | —                                                               |
| **Personalised educational suggestions (opt-in)**                        | **Partial**: chat can opt into child context; no dedicated suggestion engine | —                                                               |
| **AI-generated report narratives**                                       | **Missing**                                                                  | —                                                               |
| **Prompt versioning / admin prompt management**                          | **Missing**                                                                  | —                                                               |
| **Cost & error dashboard (beyond a status line)**                        | **Missing**                                                                  | —                                                               |
| **Streaming responses**                                                  | **Missing** (single request/response)                                        | —                                                               |
| **Persisted safety classification per message**                          | **Missing** (classified, then discarded)                                     | —                                                               |
| **Provider configured at all**                                           | **No** — `.env` has no `AI_*` keys today                                     |

**Conclusion for reviewers:** the chat product is real and working behind a
feature flag of sorts (it reports "not configured" until keys are set). The plan
below is therefore mostly _quality, depth, and governance_ — not a new chatbot.

---

## 3. Provider: DeepSeek

### 3.1 Why the existing adapter already fits it

`ai.client.ts` speaks the OpenAI chat-completions protocol and reads
`AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`. DeepSeek exposes that same protocol at
`https://api.deepseek.com`. **Choosing DeepSeek is configuration, not a rewrite.**
No `DEEPSEEK_API_KEY` variable is introduced: one key name (`AI_API_KEY`) keeps
the vendor swappable and keeps error messages honest.

### 3.2 Verified against the live API (28 Oct 2026)

| Fact                               | Value                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| Base URL (OpenAI format)           | `https://api.deepseek.com`                                                     |
| Models available on this key       | `deepseek-flash` (DeepSeek-V4.1-Flash), `deepseek-v4-pro` (DeepSeek-V4-Pro)    |
| Context / max output               | 1M tokens / up to 384K                                                         |
| JSON output                        | Supported (both models)                                                        |
| Thinking mode                      | **Enabled by default**, effort `high`; returns `reasoning_content`             |
| Thinking in multi-turn             | Not needed back when no `tools` are sent; ignored if sent                      |
| `temperature` in thinking mode     | **Silently ignored**                                                           |
| Vision                             | `deepseek-flash` only                                                          |
| Concurrency limit                  | 2,500 (flash) / 500 (pro)                                                      |
| Price per 1M tokens, flash         | in $0.15 off-peak / $0.30 peak · out $0.60 / $1.20 · cached in $0.003 / $0.006 |
| Price per 1M tokens, pro           | in $0.66 / $1.32 · out $1.98 / $3.96                                           |
| Peak hours                         | 01:00–04:00 and 06:00–10:00 UTC, Mon–Fri                                       |
| Account balance at time of writing | **$1.81**                                                                      |

> The legacy model names `deepseek-chat` / `deepseek-reasoner` no longer appear in
> the account's model list. The plan uses the IDs the API actually returns.

### 3.3 Model choice

- **`deepseek-flash` for everything user-facing.** Chat answers, summaries,
  suggestions. At off-peak that is roughly **$0.0005 per chat turn** — about 53
  cents per 1,000 turns — before prompt caching.
- **`deepseek-v4-pro` is not used in this plan.** It is 4–6× the price for a
  task where the answer is short, constrained and grounded. Revisit only if
  evaluations show flash failing the safety suite.

### 3.4 Two provider behaviours the current adapter must handle

1. **Thinking mode is ON by default.** This is the single biggest integration
   risk. Left on, every chat answer pays for reasoning tokens (billed as output),
   ignores our `temperature: 0.3`, and can exceed the current 20 s client timeout.
   The plan sends `thinking: { type: 'disabled' }` for chat and summaries.
2. **Prompt caching is where the money is.** Cache-hit input is ~1/50th the
   price. The system prompt (rules) must stay byte-identical and first, with
   volatile content (child context, retrieved passages) after it. The current
   prompt builder already orders it this way; the plan keeps that invariant and
   documents it so a future edit does not casually break it.

### 3.5 Configuration (target `.env.example`)

```ini
AI_BASE_URL=https://api.deepseek.com
AI_API_KEY=                # server-side only; never exposed to the web app
AI_MODEL=deepseek-flash
AI_THINKING=disabled       # disabled | low | high  (new)
AI_TIMEOUT_MS=30000        # raise from 20000 for summary jobs
AI_MAX_DAILY_MESSAGES=40
AI_DAILY_BUDGET_USD=2      # hard stop for the whole platform (new)
```

**Key handling.** The key is a server-side secret. It goes in `.env` (already
git-ignored) and in the host's environment for deployment; never in the Angular
bundle, never in a conversation row, never in a log line — the existing client
already obeys this. Because the current key was shared in chat, it should be
**rotated** after the first working deploy.

---

## 4. The safety boundary (non-negotiable)

Everything below is enforced by code that can be reviewed line by line, because
"the model was told not to" is not a control.

**Layer 1 — Input classification (deterministic, before the model runs).**
`ai.safety.ts` classifies each parent message: `CRISIS` (self-harm / danger) and
`MEDICATION` (doses, drug names, supplements, in English and Khmer). Both are
answered by a fixed, pre-written reply. No token is spent, no model output is
possible.

**Layer 2 — System prompt rules.** `RULES` in `ai.prompt.ts` forbids naming a
diagnosis, estimating probability or severity, naming medication, predicting the
future, inventing sources, or standing in for a clinician.

**Layer 3 — Output post-filter.** `softenDiagnosisClaims()` rewrites the two
constructions a model reaches for when it slides into a verdict, and
`ensureReferral()` guarantees a health answer ends by pointing to a clinician.

**Layer 4 — New in this plan: make it visible and auditable.**
Persist the classification and any rewrite on the message, flag the conversation
in admin monitoring, and let an admin see flagged answers without ever seeing a
child's identity. Currently the classification is computed and thrown away, so
nobody can review what almost went wrong.

**Explicitly out of bounds, in every feature below:** diagnoses, severity or
risk percentages derived from text, medication advice, treatment protocols,
predictions about the child's future, and replacing a professional. The
questionnaire's risk percentage exists, is clearly labelled non-diagnostic, and
is **never** passed to the model as an input to reason about.

---

## 5. Privacy and data minimisation

The rule already coded into `ChildContext` stays: the model may receive an
approximate age in months and a _count_ of recent observations — never a name, a
birth date, an address, a photo, a school record, or a questionnaire result.

For every new feature the question is the same: **what is the least data that
still produces a useful, personal answer?** A summary needs observation
_categories and counts over a window_, not the parent's free-text notes where
identifying details usually live.

**One item needs an explicit decision (see Q3).** DeepSeek processes requests in
China. The payloads are already minimised and contain no direct identifiers, but
this is a cross-border transfer of data about a child's health that the parent's
consent screen must describe honestly. If that is unacceptable, the adapter
makes swapping to another OpenAI-compatible provider a two-line config change —
which is precisely why the abstraction exists.

---

## 6. Feature specifications

Each feature lists: what it does, where it appears, how it is generated, what is
stored, and its safety notes.

### F1. AI Parent Assistant (chat)

**Where:** `/ai` (sidebar "AI Assistant"), plus an "Ask AI" action on the
dashboard and on a child's page (pre-fills the child context).

**Does:** conversation list, message thread, save, feedback, related activities,
citation of reviewed material, visible daily allowance.

**Gaps to close in this plan:**

- Streaming, so a long answer appears progressively instead of a 5–10 s blank
  screen. Requires an SSE endpoint and an `EventSource`-style reader on the web;
  the stored message is written once, at completion, exactly as today.
- Suggested-opening questions should be _contextual_ (based on the child's age
  band and the parent's recent observation categories), not a static list.
- A visible, dismissible banner on every thread restating that this is
  educational guidance from a computer, not a diagnosis.
- Per-plan allowance: today it is one flat 40/day. Free vs Pro is an open
  product decision (Q5).

**Safety:** layers 1–4 above. **Cost:** ~$0.0005/turn; ~$0.53 per 1,000 turns.

---

### F2. AI Educational Summaries

**Where:** child detail page (replacing the deterministic text block), the
parent dashboard card, and the Reports page.

**Does:** reads a window of the family's own records — observation categories,
counts, times of day, the _trend_ the deterministic insights engine already
computed — and writes 4–6 sentences in plain language describing what the records
show, plus 2–3 concrete things to try this week. Ends with the clinician line.

**How it is built:**

- The **facts are computed in TypeScript first** (`modules/insights`), and passed
  to the model as a compact, already-verified structure. The model's only job is
  to phrase them. It is told it may not introduce a fact that is not in that
  structure.
- Generated on demand (button), cached per child per window per language, with
  model + prompt version stored for audit. Regenerated when new observations
  arrive; never served stale beyond the window.
- Khmer and English are generated **separately**, not translated, so the Khmer
  reads like something written in Khmer. Grapheme-safe rendering per project
  rules.

**Why this matters:** it is the one place where the AI adds something the parent
cannot get from a chart — a calm sentence about their own week — and it is
grounded entirely in data the parent entered, so it cannot invent a pattern.

**Safety:** no risk score, no severity, no diagnosis; the "possible areas of
support" wording is fixed in the prompt and covered by a test.
**Cost:** ~$0.0004 per summary. 10,000 summaries ≈ $4.

---

### F3. Personalised Educational Suggestions (opt-in)

**Where:** child detail page → "Things to try", and a "For you" block in chat
when the parent turns child context on.

**Does:** given the child's age band and the areas the parent is most often
recording (sensory, sleep, communication, transitions), proposes 3 short,
practical, low-cost strategies that a Cambodian family can do at home — the kind
of thing that works at bedtime, at the market, at a haircut.

**How it is built:** retrieval first. Candidates come from the reviewed
knowledge base (`modules/guidance`, `KnowledgeRepository`); the model ranks and
phrases them, and **may not invent an activity**. Every suggestion links to the
activity/article it came from. Deterministic fallback: if retrieval returns
nothing, the UI shows library activities by category and no AI text.

**Opt-in:** off by default. A clear toggle ("Use my child's records to personalise
suggestions"), reversible at any time, with the effect explained. Off means the
model receives no child context at all.

**Safety:** no claims of benefit ("this will reduce…"); phrasing limited to
"some families find…". **Cost:** ~$0.0005 per request; cached per child/day.

---

### F4. AI-Recommended Activities

**Where:** dashboard "Recommended activities", child page, and under AI answers.

**Does:** today this is a keyword→category lookup (deterministic, cheap,
predictable). This plan keeps that as the _retrieval_ step and adds an optional
ranking pass: given the child's learning goals and the categories the parent
records most, order the shortlist and write one sentence on why each fits.

**Why keep the deterministic part:** predictability is a feature here. The same
records should always produce the same three suggestions on the same day; only
the ordering sentence is generative. Two parents comparing screens should not
see the library reshuffle itself.

**Cost:** ~$0.0002 per request. Cacheable for 24 h.

---

### F5. AI-Generated Reports

**Where:** Reports page → "Educational summary" section, inside the printable /
PDF report.

**Does:** composes the report's narrative sections from the same verified facts
as F2, over a longer window (monthly), plus the progress comparison the insights
engine already computes. The report keeps a strict visual separation between
**what the parent recorded**, **what the computer suggests**, and **what a
professional said** — the existing report already makes this distinction; the AI
text must live only in the middle band, clearly labelled.

**Stored:** the generated text with its prompt version and the exact window, so a
report can be re-printed identically years later even after the prompt changes.
This is the one place we deliberately store generated text long-term.

**Safety:** no new claims beyond the facts passed in; the report's "not a medical
diagnosis" notice is part of the document, not the model's output.
**Cost:** ~$0.001 per report (longer output). Fine.

---

### F6. AI Safety Controls (product surface)

**Where:** everywhere AI text appears, plus Admin → AI.

**Does, for parents:**

- The fixed crisis and medication replies (already built).
- A visible "educational, not a diagnosis" line on every AI surface.
- Inline warning before sending when a message is classified as medication or
  crisis, so the parent understands why they got a fixed answer.
- The ability to report an answer they think is wrong, feeding admin review.

**Does, for admins** (`GET /admin/ai`, extended):

- Provider status, model, configured/not.
- Prompt versions and which one is live.
- Usage: messages, tokens, **estimated cost**, by day and by feature.
- Errors by category (credentials, quota, model, network) — already classified
  in the client, currently only logged.
- **Flagged responses** queue: crisis/medication hits and post-filter rewrites,
  with no child identity shown.
- A kill switch: turn AI off platform-wide without a deploy.

---

## 7. Data model additions

Additive migrations only, following project rules.

| Model                      | Purpose                                                                   | Key fields                                                                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AiCallLog`                | One row per provider call, for cost and error dashboards                  | `feature`, `model`, `tokensIn`, `tokensOut`, `cachedTokens`, `costUsd`, `latencyMs`, `outcome`, `errorKind`, `promptVersion`, `createdAt` (no child identity, no message text) |
| `AiPrompt`                 | Versioned system prompts, so a change is reviewable and reversible        | `key`, `version`, `body`, `isActive`, `createdBy`, `createdAt`                                                                                                                 |
| `AiSummary`                | Cached educational summary / report narrative with provenance             | `childId`, `kind`, `windowStart`, `windowEnd`, `language`, `content`, `model`, `promptVersion`, `factsHash`, `createdAt`                                                       |
| `AiMessage.classification` | Persist `OK` / `CRISIS` / `MEDICATION` and whether the text was rewritten | nullable enum + boolean                                                                                                                                                        |

`AiMessage` already stores `model`, `latencyMs`, `tokensIn`, `tokensOut`,
`sources` — the cost dashboard can aggregate from it for chat without touching
history.

---

## 8. Cost model and guardrails

| Feature                               | Est. tokens (in/out) | Est. cost per call |
| ------------------------------------- | -------------------- | ------------------ |
| Chat turn (grounded, 10-turn history) | ~2,500 / ~250        | $0.0005            |
| Educational summary                   | ~1,200 / ~400        | $0.0004            |
| Suggestions (3 items)                 | ~1,400 / ~250        | $0.0004            |
| Activity ranking                      | ~800 / ~120          | $0.0002            |
| Monthly report narrative              | ~2,500 / ~900        | $0.001             |

At these rates the current **$1.81 balance covers roughly 3,000 chat turns** —
ample for development and a demo, not for launch. Guardrails:

1. `AI_MAX_DAILY_MESSAGES` per parent (exists).
2. `AI_DAILY_BUDGET_USD` platform-wide hard stop (new): once today's estimated
   spend crosses it, the assistant degrades to a friendly "try again tomorrow"
   and the admin sees a banner. It never silently spends.
3. Aggressive caching: summaries and suggestions are cached per child/window/
   language; identical re-requests cost nothing.
4. Prompt caching: stable rules first, volatile data last (verified in the
   prompt builder).
5. Off-peak awareness: batch/nightly report generation is cheaper than 2× the
   peak rate, if we ever pre-generate.

---

## 9. Phased delivery

Each phase ships working, tested behaviour on its own. No phase depends on a
later one.

### Phase 0 — Provider live (config + guardrails)

Configure DeepSeek, disable thinking for chat, add `AiCallLog` + budget stop,
extend `GET /admin/ai` to show configured/model/today's spend, log the provider
failure category.
**Done when:** a real Khmer and a real English question each return a grounded
answer in the app; the admin page shows the model and today's spend; the safety
unit tests pass against real payload shapes; a missing key still shows "not
configured" rather than an error.

### Phase 1 — Chat depth

Streaming, contextual suggested questions, safety classification persisted and
shown in admin, and the outside-Cambodia disclosure on the consent screen and
under the thread (decision 3).
**Done when:** an answer streams token by token; a crisis message is answered by
the fixed reply with no provider call; the admin queue shows the flag; and a
parent can read, before their first message, where the question is processed.

### Phase 2 — Educational summaries (highest user value)

**Shipped 28 Oct 2026** — `AiSummary` table, `GET` and `POST
/api/v1/children/:childId/summary`, prompt `summary-v1`, and the card on the child
profile. The dashboard card waits for the dashboard rework, so it is not wired
twice.

Insights facts → prompt → cached `AiSummary` → child page + dashboard card.
**Done when:** both languages render, the Khmer is written (not translated),
the notice is present, regeneration happens only when the data changes, and ten
sample children produce no diagnostic phrasing (reviewed by hand against a
checklist).

### Phase 3 — Suggestions and activity ranking

Opt-in toggle, retrieval-grounded suggestions, deterministic fallback, ranking
sentences.
**Done when:** with the toggle off, no child data leaves the server; with it on,
every suggestion links to a real library item; a broken retrieval returns the
deterministic list and no AI text.

### Phase 4 — Reports + admin governance

Report narrative, prompt versioning UI, cost/error dashboard, kill switch.
**Done when:** a re-printed old report is byte-identical; an admin can disable
AI platform-wide without a deploy; the cost page reconciles with the provider's
own usage within a few percent.

---

## 10. Testing and evaluation

Beyond the existing unit tests (`ai.safety.test.ts`, `ai.client.test.ts`,
`ai.service.test.ts`, `public-chat.service.test.ts`):

- **A fixed evaluation set** of ~60 parent questions (30 Khmer, 30 English):
  routine, sleep, sensory, communication, school, plus adversarial ones that beg
  for a diagnosis or a medication dose. Run them against the live model and
  grade: no diagnosis, no severity, no medication, referral present, language
  correct, length within bounds. This becomes the gate for any prompt change.
- **Golden-file tests** for the deterministic layers, so a refactor cannot
  quietly weaken a regex.
- **Integration tests** for the new routes, including ownership checks (another
  parent's conversation/child must 404, never disclose).
- **A cost test** in CI for the prompt builder: assert the stable prefix is
  unchanged when only child context changes, so caching is not accidentally
  broken.

---

## 11. Non-goals

- No diagnosis, severity score, risk percentage, or "level of autism".
- No medication, supplement or dosage advice of any kind.
- No photo or video analysis (the flash model supports vision; we are not using it).
- No voice interface in this plan.
- No model fine-tuning.
- No autonomous agent that acts on the parent's behalf.
- No AI on school or hospital dashboards in this plan — child data reaches a
  school only through the parent's code and consent, and AI does not change that.

---

## 12. Decisions

Settled with the product owner on 28 October 2026. Recorded here so later work
cannot re-open them by accident.

| #   | Question                 | Decision                                                        |
| --- | ------------------------ | --------------------------------------------------------------- |
| 1   | Which model?             | **`deepseek-flash`.** Confirmed. `deepseek-v4-pro` is not used. |
| 2   | Streaming now?           | **Yes, in Phase 1.**                                            |
| 3   | Data processed in China? | **Accepted**, on condition that it is disclosed.                |
| 4   | AI-written summaries?    | **Facts computed by code, phrasing written by the model.**      |
| 5   | Free vs Pro allowance?   | **Unchanged: 40 per parent per day** for every plan.            |
| 6   | Who reviews prompts?     | **Two people, and the version is always recorded.**             |

**1. Model.** The answer length here is three to six sentences with a fixed
non-clinical brief; the extra 4–6× buys nothing measurable for that. Pro stays
available as a config value if an evaluation ever shows flash failing a safety
case.

**2. Streaming, in Phase 1.** Decided on engineering grounds: a 2–4 second blank
screen is the one gap a tired parent notices on a phone, and it changes nothing
about how answers are stored — the row is still written once, at completion.

**3. Cross-border processing is accepted, which makes disclosure mandatory.**
The consent screen, the privacy policy and the note under the AI thread must all
say plainly that a parent's question and the minimised child context are
processed outside Cambodia. This is now a release requirement, not a nicety. The
adapter remains provider-agnostic so the decision is reversible by config.

**4. Summaries: facts from code, phrasing from the model.** The insights engine
computes every claim; the model turns it into sentences and is forbidden from
introducing one. No summary is ever generated from raw free-text notes. This is
the version with the warmth and without the invented-pattern risk.

**5. Allowance stays 40/day for everyone.** The Free/Pro split is still an open
_product_ decision and the project has deliberately not fixed Free plan limits,
so engineering does not invent one. The per-parent counter already exists; when
the product decides, the split is one config value and one line in the
effective-plan lookup.

**6. Two-person prompt review.** Any change to `RULES` needs a second reviewer.
Until `AiPrompt` exists in Phase 4, the review is recorded in the commit that
changes the prompt text; after that, the version is stored with every answer, so
an old answer can always be traced to the rules that produced it.

---

## 13. Risks

| Risk                                            | Impact                                        | Mitigation                                                                          |
| ----------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------- |
| Thinking mode left on                           | 3–10× cost, slow answers, ignored temperature | Explicit `thinking: disabled`, asserted in a client test                            |
| Model drifts past the safety boundary           | Reputational and ethical harm                 | 4-layer design; post-filter; eval set as a release gate                             |
| Provider outage or quota                        | Assistant dead, parents confused              | Classified errors, clear "try later" copy, everything else in the app keeps working |
| Cost overrun                                    | Real money, silently                          | `AiCallLog` + platform daily budget stop                                            |
| Khmer output that reads like translated English | Feels foreign, loses trust                    | Generate in Khmer, never translate; native review before launch                     |
| Prompt cache broken by an innocent edit         | 5–50× input cost                              | Prompt-prefix test in CI                                                            |
| Summary leaks an invented pattern               | Undermines the whole product                  | Facts computed in code, model only phrases them; `factsHash` stored                 |
