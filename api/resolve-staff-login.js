export const config = { api: { bodyParser: { sizeLimit: '4kb' } } };

import { createClient } from '@supabase/supabase-js';
import { rateLimit, getIP } from './_ratelimit.js';
import { validateEmail } from './_validate.js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Único endpoint anónimo (pre-sesión) de este flujo — rate limit más
// estricto porque es la única superficie donde alguien podría intentar
// enumerar emails/hoteles.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  if (!await rateLimit(getIP(req), 15, 10 * 60_000)) {
    return res.status(429).json({ error: 'Demasiadas solicitudes' });
  }

  const email = validateEmail(req.body?.email);
  if (!email) return res.status(200).json({ syntheticEmail: null });

  try {
    const { data, error } = await supabase.rpc('resolve_staff_login_email', { p_email: email });
    if (error) return res.status(200).json({ syntheticEmail: null });
    return res.status(200).json({ syntheticEmail: data ?? null });
  } catch (e) {
    return res.status(200).json({ syntheticEmail: null });
  }
}
