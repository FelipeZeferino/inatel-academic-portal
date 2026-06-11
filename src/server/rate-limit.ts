type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();
let lastSweep = Date.now();

/** Remove periodicamente entradas expiradas para evitar crescimento ilimitado do Map. */
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, entry] of buckets) {
    if (now > entry.resetAt) buckets.delete(key);
  }
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterMs: number };

/**
 * Registra uma requisicao para `key` e indica se ela esta dentro do limite.
 *
 * @param key       identificador do consumidor (ex.: `ia:${userId}`)
 * @param limit     numero maximo de requisicoes permitidas por janela
 * @param windowMs  duracao da janela em milissegundos
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const entry = buckets.get(key);

  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (entry.count >= limit) {
    return { ok: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { ok: true };
}
