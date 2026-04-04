import { Hono } from 'hono';
import { chatJson } from '../lib/openai.js';

const MAX_BLURB = 6000;

export type RefineResult = {
  ok: boolean;
  message: string;
  question: string | null;
  option_a: string | null;
  option_b: string | null;
};

export type RecommendResult = {
  recommended: 'a' | 'b';
  reason: string;
};

const REFINE_SYSTEM = `You are a careful assistant for an app called Decisions AI. Users paste messy, unstructured thoughts (maybe from voice dictation). Your job:
1) If the text describes a real choice between two directions (even if vague), distill it into ONE clear decision question and EXACTLY two short option labels (option_a and option_b). Options should be parallel and concrete (e.g. "Go to the party" vs "Stay home tonight").
2) If the text is nonsense, empty, abusive, off-topic, not a decision, or cannot reasonably be framed as two alternatives, set ok to false and write a brief, kind message explaining this doesn't look like a decision the app can help with—no shame, invite them to try again with a real either/or.
3) Never invent harmful or illegal choices. If the content is unsafe, ok false with a gentle refusal.

Respond with JSON only, shape:
{"ok":boolean,"message":string,"question":string|null,"option_a":string|null,"option_b":string|null}
- When ok is true: message can be a one-line encouragement; question, option_a, option_b must be non-null non-empty strings.
- When ok is false: message is the user-facing text; question, option_a, option_b must be null.`;

const RECOMMEND_SYSTEM = `You help users pick between two options for the Decisions AI app. You receive a clear question and two options (A and B). Choose the one you recommend for this user based on typical wellbeing, clarity, and low regret—stay practical and kind. You must pick exactly "a" or "b".

Tone: follow the user's tone_hint if provided: "friend" = warm, casual, short; "advisor" = clear, direct, structured; "either" = balanced.

Respond JSON only: {"recommended":"a"|"b","reason":"1-3 short sentences"}`;

export const decisions = new Hono();

decisions.post('/refine', async (c) => {
  let body: { blurb?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const blurb = typeof body.blurb === 'string' ? body.blurb.trim() : '';
  if (!blurb) {
    return c.json({ error: 'blurb is required' }, 400);
  }
  if (blurb.length > MAX_BLURB) {
    return c.json({ error: `blurb too long (max ${MAX_BLURB} chars)` }, 400);
  }

  try {
    const result = await chatJson<RefineResult>([
      { role: 'system', content: REFINE_SYSTEM },
      { role: 'user', content: blurb },
    ]);

    if (typeof result.ok !== 'boolean' || typeof result.message !== 'string') {
      return c.json({ error: 'Malformed model output' }, 502);
    }

    if (result.ok) {
      if (
        !result.question?.trim() ||
        !result.option_a?.trim() ||
        !result.option_b?.trim()
      ) {
        return c.json({ error: 'Incomplete decision from model' }, 502);
      }
    } else {
      result.question = null;
      result.option_a = null;
      result.option_b = null;
    }

    return c.json(result);
  } catch (e) {
    const status = (e as Error & { statusCode?: number }).statusCode ?? 500;
    const message = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: message }, status as 500 | 502 | 503);
  }
});

decisions.post('/recommend', async (c) => {
  let body: {
    question?: unknown;
    option_a?: unknown;
    option_b?: unknown;
    tone_hint?: unknown;
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  const option_a = typeof body.option_a === 'string' ? body.option_a.trim() : '';
  const option_b = typeof body.option_b === 'string' ? body.option_b.trim() : '';
  const toneRaw = typeof body.tone_hint === 'string' ? body.tone_hint.trim().toLowerCase() : '';
  const tone_hint = ['friend', 'advisor', 'either'].includes(toneRaw) ? toneRaw : 'either';

  if (!question || !option_a || !option_b) {
    return c.json({ error: 'question, option_a, and option_b are required' }, 400);
  }

  const userPayload = JSON.stringify(
    { question, option_a, option_b, tone_hint },
    null,
    0,
  );

  try {
    const result = await chatJson<RecommendResult>([
      { role: 'system', content: RECOMMEND_SYSTEM },
      { role: 'user', content: userPayload },
    ]);

    if (result.recommended !== 'a' && result.recommended !== 'b') {
      return c.json({ error: 'Invalid recommendation from model' }, 502);
    }
    if (typeof result.reason !== 'string' || !result.reason.trim()) {
      return c.json({ error: 'Missing reason from model' }, 502);
    }

    return c.json(result);
  } catch (e) {
    const status = (e as Error & { statusCode?: number }).statusCode ?? 500;
    const message = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: message }, status as 500 | 502 | 503);
  }
});
