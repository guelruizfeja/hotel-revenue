export const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;

/** Valida y devuelve el email limpio, o null si inválido */
export function validateEmail(val) {
  if (typeof val !== 'string') return null;
  const v = val.trim();
  if (v.length > 254) return null;
  return EMAIL_RE.test(v) ? v : null;
}

/** Recorta y limita una cadena. Devuelve null si no es string o está vacía */
export function cleanString(val, maxLen) {
  if (val == null || typeof val !== 'string') return null;
  const v = val.trim().slice(0, maxLen);
  return v.length > 0 ? v : null;
}

/** Valida formato UUID v4 */
export function validateUUID(val) {
  if (typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
}

/** Convierte a número y verifica que esté en rango [min, max]. Devuelve null si inválido */
export function validateNum(val, min = 0, max = 1e9) {
  const n = Number(val);
  if (!isFinite(n)) return null;
  if (n < min || n > max) return null;
  return n;
}

/** Escapa caracteres HTML peligrosos */
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
