/** Supabase / PostgREST errors are often plain objects, not `Error` instances. */
export function toErrorMessage(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  if (e && typeof e === 'object' && 'message' in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === 'string' && m.length > 0) return m;
  }
  if (e && typeof e === 'object' && 'details' in e) {
    const d = (e as { details?: unknown }).details;
    if (typeof d === 'string' && d.length > 0) return d;
  }
  try {
    return JSON.stringify(e);
  } catch {
    return 'Something went wrong';
  }
}
