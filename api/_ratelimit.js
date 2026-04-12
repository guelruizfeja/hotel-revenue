// Rate limiter con doble capa:
// - Upstash Redis si UPSTASH_REDIS_REST_URL está configurado (distribuido, funciona en serverless)
// - Fallback in-memory si no hay Redis (desarrollo local)

// ── Fallback in-memory ──────────────────────────────────────────────────────
const store = new Map();

function rateLimitMemory(key, limit, windowMs) {
  const now = Date.now();
  let entry = store.get(key);
  if (!entry || now > entry.reset) {
    entry = { count: 0, reset: now + windowMs };
  }
  entry.count++;
  store.set(key, entry);
  // Limpieza de entradas expiradas para evitar memory leak
  if (store.size > 5000) {
    for (const [k, v] of store) {
      if (now > v.reset) store.delete(k);
    }
  }
  return entry.count <= limit;
}

// ── Upstash Redis ───────────────────────────────────────────────────────────
async function rateLimitRedis(key, limit, windowMs) {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const redisKey = `rl:${key}`;
  const windowSec = Math.ceil(windowMs / 1000);

  // INCR + EXPIRE atómico via pipeline
  const body = JSON.stringify([
    ['INCR', redisKey],
    ['EXPIRE', redisKey, windowSec, 'NX'],
  ]);

  const r = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body,
    signal: AbortSignal.timeout(3000),
  });

  if (!r.ok) {
    // Si Redis falla, permitir la request (fail open) para no bloquear usuarios legítimos
    console.error('Redis rate limit error:', r.status);
    return true;
  }

  const [[, count]] = await r.json();
  return count <= limit;
}

// ── Exportaciones ────────────────────────────────────────────────────────────
export async function rateLimit(key, limit = 20, windowMs = 60_000) {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return rateLimitRedis(key, limit, windowMs);
  }
  return rateLimitMemory(key, limit, windowMs);
}

export function getIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}
