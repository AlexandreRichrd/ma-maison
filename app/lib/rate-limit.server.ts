const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const attempts = new Map<string, number[]>();

/**
 * Fixed-window rate limiter, in-memory. Fine for a single-process,
 * low-traffic household app — no Redis needed. Not shared across
 * multiple server instances.
 */
export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const recent = (attempts.get(key) ?? []).filter((t) => t > windowStart);
  attempts.set(key, recent);
  return recent.length >= MAX_ATTEMPTS;
}

export function recordAttempt(key: string): void {
  const recent = attempts.get(key) ?? [];
  recent.push(Date.now());
  attempts.set(key, recent);
}
