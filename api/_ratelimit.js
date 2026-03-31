// Simple in-memory rate limiter (per serverless instance)
const store = new Map();

/**
 * @param {string} key  — typically IP address
 * @param {number} limit — max requests allowed in the window
 * @param {number} windowMs — window duration in ms
 * @returns {boolean} true if request is allowed
 */
export function rateLimit(key, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  let entry = store.get(key);
  if (!entry || now > entry.reset) {
    entry = { count: 0, reset: now + windowMs };
  }
  entry.count++;
  store.set(key, entry);
  return entry.count <= limit;
}

export function getIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}
