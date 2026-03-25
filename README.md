# Decisions AI

**Decisions AI** is a mobile-only **decision co-pilot** for people who overthink. It helps users make **bounded everyday decisions quickly**—whether to go on a date, which apartment to pick, what to text back—by reducing **decision fatigue** and **rumination**.

The product bet: **consumer AI adoption is real**, but durable consumer AI products tend to be **narrow and purpose-built**, not generic chat. Decisions AI is that focused surface: fast structure, clear tradeoffs, and language that feels safe and usable—not another open-ended assistant.

---

## Product direction (MVP and beyond)

These are **directional pillars**, not a locked spec. The MVP should stay small enough to ship, measure retention, and iterate.

| Pillar | Intent |
|--------|--------|
| **Structured compare mode** | Side-by-side (or short-list) comparison with explicit criteria, weights users care about, and a clear “why this vs that” narrative—so rumination has a container. |
| **Regret minimizer** | Frame choices around “what you’d regret *not* doing” or “what failure mode you’re optimizing against,” tuned for anxiety-driven loops. |
| **Friend vs advisor mode** | Tone presets: warm peer-like support vs more direct, analytical coaching—same engine, different voice. |
| **Safe preferences** | User-controlled boundaries (topics to avoid, intensity, relationship context) so outputs stay appropriate and trustworthy. |

### Structured compare mode (MVP centerpiece)

**Compare mode** is the structured answer to “I keep spinning on the same options.” The user names **2–5 options** (apartments, dates, replies) and **what matters to them** (price, commute, vibe, risk). The app:

1. **Normalizes** those criteria into a small, editable list (so thinking stays bounded).
2. **Scores or ranks** transparently—either rule-like (user weights) or AI-assisted with explicit reasoning per cell, depending on MVP complexity.
3. **Summarizes** in a short narrative: “If you care most about X, lean A; if Y matters more, lean B,” so the output feels like **clarity**, not a black-box verdict.

That directly targets **rumination**: fewer open loops, explicit tradeoffs, and a single artifact to return to instead of re-asking the same question in a generic chat.

Under the hood, v1 is intentionally **simple**: a **text-model wrapper** with strong prompting, light structure (JSON where useful), and guardrails—not a bespoke model.

---

## Go-to-market (context)

Early growth is expected to lean on **UGC** and short-form ads (e.g. **TikTok**): simple, relatable hooks—“three apartments,” “couldn’t decide what to reply”—with the app as the resolution. That only works if the **free MVP is genuinely useful** enough that people **come back**. Technical work should support **fast iteration**, **reliable AI calls**, and **clear analytics hooks** later—not premature complexity.

---

## Repository layout

Monorepo-style layout so mobile, API, and shared types can evolve together.

```
decisionai/
├── README.md                 # This file — project + structure reference
├── apps/
│   └── mobile/               # iOS + Android client (see stack note below)
├── backend/                  # HTTP API: auth integration, user data, AI proxy routes
└── packages/
    └── shared/               # Optional: shared types, validation schemas (mobile + API)
```

### `apps/mobile/`

- **Role:** The only client surface (mobile-first, effectively mobile-only).
- **Planned stack (recommended):** **Expo + React Native** — one codebase for iOS and Android, strong ecosystem, straightforward OTA updates for JS changes.
- **What belongs here:** screens, navigation, local UI state, API client, push tokens when you add them, and client-side feature flags if needed.

### `backend/`

- **Role:** Server that the app talks to. Keeps **API keys and model calls off the device**.
- **Responsibilities to plan for:**
  - **Authentication** — typically a managed provider (e.g. **Supabase Auth**, **Clerk**, **Auth0**, or native Sign in with Apple / Google via a bridge). Pick one aligned with your speed and compliance needs; document the choice here when decided.
  - **User data** — profiles, preferences (including “safe preferences”), saved decisions/sessions if you persist them.
  - **AI routes** — thin endpoints that call **OpenAI** (or another provider), apply server-side prompts, rate limits, and logging. Avoid exposing raw provider keys in the app.

### `packages/shared/`

- **Role:** Optional but useful once both apps exist: **TypeScript types**, **Zod** (or similar) schemas for API payloads, and enums (e.g. mode: `friend` | `advisor`). Keeps mobile and backend in sync.

---

## What to add next (engineering checklist)

When you scaffold code (not required for this bare repo), in rough order:

1. **Mobile app** in `apps/mobile/` (Expo init or equivalent).
2. **Backend** in `backend/` (e.g. Node + Fastify/Hono, or Edge functions—team choice).
3. **Auth + DB** — one provider + one database; migrate schema as features land.
4. **AI layer** — env-based API keys, structured outputs where helpful, timeouts and retries.
5. **Observability** — error reporting and basic product analytics (privacy-conscious).

---

## Conventions

- **Default branch:** `main` (or team standard).
- **Documentation:** This README is the **canonical map** of what the repo is for and where things live; update it when folders or stack choices change.

---

## License

TBD (add a `LICENSE` file when the legal entity and distribution model are clear).
