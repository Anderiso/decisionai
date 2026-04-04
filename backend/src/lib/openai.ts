const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export async function chatJson<T>(messages: ChatMessage[]): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    const err = new Error('Server is missing OPENAI_API_KEY');
    (err as Error & { statusCode?: number }).statusCode = 503;
    throw err;
  }

  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.35,
      response_format: { type: 'json_object' },
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    const err = new Error(`OpenAI error ${res.status}: ${raw.slice(0, 500)}`);
    (err as Error & { statusCode?: number }).statusCode = 502;
    throw err;
  }

  let parsed: { choices?: { message?: { content?: string } }[] };
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    const err = new Error('Invalid JSON from OpenAI');
    (err as Error & { statusCode?: number }).statusCode = 502;
    throw err;
  }

  const content = parsed.choices?.[0]?.message?.content;
  if (!content) {
    const err = new Error('Empty response from OpenAI');
    (err as Error & { statusCode?: number }).statusCode = 502;
    throw err;
  }

  try {
    return JSON.parse(content) as T;
  } catch {
    const err = new Error('Model did not return valid JSON');
    (err as Error & { statusCode?: number }).statusCode = 502;
    throw err;
  }
}
