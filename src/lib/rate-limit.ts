// In-memory rate limiter — resets on cold start (sufficient for serverless + free tier)
const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 24 * 60 * 60 * 1000; // 24h
const MAX_PER_WINDOW = 3;

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_PER_WINDOW - 1 };
  }

  if (entry.count >= MAX_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_PER_WINDOW - entry.count };
}
