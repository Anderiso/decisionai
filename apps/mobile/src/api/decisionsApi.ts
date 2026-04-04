export type RefineResponse = {
  ok: boolean;
  message: string;
  question: string | null;
  option_a: string | null;
  option_b: string | null;
};

export type RecommendResponse = {
  recommended: 'a' | 'b';
  reason: string;
};

function apiBase(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL?.trim() ?? '';
  return raw.replace(/\/$/, '');
}

async function parseJson<T>(res: Response): Promise<T & { error?: string }> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T & { error?: string };
  } catch {
    throw new Error(res.ok ? 'Invalid JSON from server' : text.slice(0, 200) || `HTTP ${res.status}`);
  }
}

export async function refineBlurb(blurb: string): Promise<RefineResponse> {
  const base = apiBase();
  if (!base) {
    throw new Error('Missing EXPO_PUBLIC_API_URL. Point it at your backend (see README).');
  }

  const res = await fetch(`${base}/api/v1/decisions/refine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blurb }),
  });

  const data = await parseJson<RefineResponse & { error?: string }>(res);
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export async function recommendChoice(
  question: string,
  optionA: string,
  optionB: string,
  toneHint: 'friend' | 'advisor' | 'either',
): Promise<RecommendResponse> {
  const base = apiBase();
  if (!base) {
    throw new Error('Missing EXPO_PUBLIC_API_URL.');
  }

  const res = await fetch(`${base}/api/v1/decisions/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      option_a: optionA,
      option_b: optionB,
      tone_hint: toneHint,
    }),
  });

  const data = await parseJson<RecommendResponse & { error?: string }>(res);
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}
