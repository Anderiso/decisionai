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

### “Make a decision” (shipped in this repo)

A first vertical slice: the user enters **unstructured** text (typed or dictation). The **backend** calls OpenAI twice—first to normalize into a **single question + two options** (or a **safe refusal** if it is not a real either/or), then to output a **recommended A or B** with a short reason. The app shows the framed question while the second call runs, then the suggestion. This is the base for richer compare/regret tooling later.

---

## Go-to-market (context)

Early growth is expected to lean on **UGC** and short-form ads (e.g. **TikTok**): simple, relatable hooks—“three apartments,” “couldn’t decide what to reply”—with the app as the resolution. That only works if the **free MVP is genuinely useful** enough that people **come back**. Technical work should support **fast iteration**, **reliable AI calls**, and **clear analytics hooks** later—not premature complexity.

---

## Repository layout

Monorepo-style layout so mobile, API, and shared types can evolve together.

```
decisionai/
├── README.md                 # This file — project + structure reference
├── package.json              # Root scripts: `npm run dev` → API + Expo together
├── apps/
│   └── mobile/               # Expo + React Native (iOS + Android)
├── backend/                  # Hono HTTP API — AI proxy, future auth/data routes
├── supabase/
│   └── migrations/           # SQL migrations (e.g. profiles)
└── packages/
    └── shared/               # Optional: shared types / schemas
```

### Run API + Expo from the repo root

1. One-time: `npm install` at the repo root, plus `npm install` inside `backend/` and `apps/mobile/` (if you have not already).
2. From **`decisionai/`**: **`npm run dev`** — starts the **backend** in the background (logs prefixed with `[backend]`) and **Expo** in the **foreground** with a real terminal, so the **QR code**, **Metro on port 8081**, and shortcuts like **`r` to reload** work like a normal `expo start`. The API stays on **port 3000**; Metro uses **8081** by default (two different ports; both are expected).
3. Stop both with **Ctrl+C** once.

### `apps/mobile/`

- **Stack:** **Expo + React Native**, **Supabase** client for auth and `profiles`, **React Navigation** (stack).
- **Features today:** sign-in, onboarding that writes `profiles`, home, profile screen, **Make a decision** (messy blurb → server refines to two options → server recommends A or B; tone follows profile `guidance_style` when set).
- **Environment:** copy `apps/mobile/.env.example` to `.env`. Set `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and **`EXPO_PUBLIC_API_URL`** to your running API base URL (e.g. `http://localhost:3000` for simulator; on a **physical device** use your machine’s LAN IP, not `localhost`).
- **If requests stay “pending” or you see “Network request failed”:** (1) Confirm the API is running (`GET /health` in a browser). (2) **Expo in the browser on the same PC** → use `EXPO_PUBLIC_API_URL=http://localhost:3000` (not the LAN IP). (3) **Phone on Wi‑Fi** → use `http://<PC-LAN-IPv4>:3000`; PC and phone on the same network; allow **Node.js** (or TCP port **3000**) through **Windows Defender Firewall** for Private networks. (4) **Android device** → `usesCleartextTraffic` is enabled in `app.json` for HTTP dev. (5) After changing `.env`, restart Expo (`npx expo start -c` if needed).

### `backend/`

- **Stack:** **Node (ESM) + Hono + TypeScript**. OpenAI is called with `fetch` to the Chat Completions API; **no OpenAI SDK required**.
- **Role:** Keeps **`OPENAI_API_KEY` on the server only** — never in the mobile bundle.
- **Run locally:**
  1. `cd backend && npm install`
  2. Copy `backend/.env.example` to `.env` and set `OPENAI_API_KEY` (optional: `OPENAI_MODEL`, default `gpt-4o-mini`; `PORT`, default `3000`).
  3. `npm run dev` (watch) or `npm run build && npm start`.
- The server listens on **`0.0.0.0`** so other devices on your LAN can connect (not only `localhost`).
- **CORS:** enabled for local dev; tighten origins before production.
- **API (v1):**
  - `GET /health` — liveness.
  - `POST /api/v1/decisions/refine` — body `{ "blurb": string }` → JSON `{ ok, message, question?, option_a?, option_b? }` (structured via model `json_object` mode).
  - `POST /api/v1/decisions/recommend` — body `{ "question", "option_a", "option_b", "tone_hint"?: "friend"|"advisor"|"either" }` → `{ recommended: "a"|"b", reason }`.

### Supabase

- **Auth + `profiles`:** run `supabase/migrations/001_profiles.sql` in the Supabase SQL editor (or your migration workflow) so onboarding and profile screens work.

### `packages/shared/`

- **Role:** Optional shared TypeScript types / validation for mobile + API when you want a single source of truth.

---

## What to add next (engineering checklist)

1. **Production hardening** — auth on AI routes if needed, rate limits, structured logging, CORS allowlist.
2. **Richer decision engine** — criteria, compare mode, persistence of sessions.
3. **Observability** — error reporting and privacy-conscious analytics.

---

## Conventions

- **Default branch:** `main` (or team standard).
- **Documentation:** This README is the **canonical map** of what the repo is for and where things live; update it when folders or stack choices change.

---

## License

TBD (add a `LICENSE` file when the legal entity and distribution model are clear).
