import { jwtVerify, createRemoteJWKSet } from 'jose';

// Este proyecto de Supabase firma los JWT con claves asimétricas (ES256),
// no con el secreto compartido HS256 legacy. La verificación se hace contra
// el JWKS público del proyecto; `createRemoteJWKSet` cachea las claves en
// memoria (por instancia de función serverless), así que no supone una
// llamada de red en cada petición, solo cuando cambia el `kid` o expira caché.
const jwksUrl = () => new URL(`${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`);
let jwks = null;
function getJwks() {
  if (!jwks) jwks = createRemoteJWKSet(jwksUrl());
  return jwks;
}

/**
 * Verifica la firma y expiración de un JWT de Supabase contra su JWKS.
 * Devuelve el email del payload si es válido, o null.
 */
export async function verifySupabaseJwt(token) {
  if (typeof token !== 'string' || !process.env.SUPABASE_URL) return null;
  try {
    const { payload } = await jwtVerify(token, getJwks());
    return payload.email ?? null;
  } catch {
    return null;
  }
}

/**
 * Igual que verifySupabaseJwt, pero devuelve { sub, email } (sub = auth.uid()
 * de quien llama). Necesario cuando el endpoint debe saber QUIÉN llama, no
 * solo que el token es válido.
 */
export async function verifySupabaseJwtPayload(token) {
  if (typeof token !== 'string' || !process.env.SUPABASE_URL) return null;
  try {
    const { payload } = await jwtVerify(token, getJwks());
    if (!payload.sub) return null;
    return { sub: payload.sub, email: payload.email ?? null };
  } catch {
    return null;
  }
}
