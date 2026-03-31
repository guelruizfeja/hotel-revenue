import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, getIP } from './_ratelimit.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Rate limit: 5 intentos por IP por minuto
  if (!rateLimit(getIP(req), 5, 60_000)) {
    return res.status(429).json({ error: 'Demasiadas solicitudes' });
  }

  // Verificar identidad del usuario mediante JWT
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !authUser) return res.status(401).json({ error: 'No autorizado' });

  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'Falta user_id' });

  // El user_id del body debe coincidir con el del token
  if (authUser.id !== user_id) return res.status(403).json({ error: 'No autorizado' });

  try {
    const { data: sub, error: dbErr } = await supabase
      .from('suscripciones')
      .select('stripe_subscription_id, estado')
      .eq('user_id', user_id)
      .maybeSingle();

    if (dbErr || !sub) return res.status(404).json({ error: 'Suscripción no encontrada' });
    if (sub.estado === 'cancelada' || sub.estado === 'cancelando') {
      return res.status(400).json({ error: 'La suscripción ya está cancelada o en proceso de cancelación' });
    }

    const updated = await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    const periodo_fin = new Date(updated.current_period_end * 1000).toISOString();

    await supabase
      .from('suscripciones')
      .update({ estado: 'cancelando', periodo_fin })
      .eq('user_id', user_id);

    res.status(200).json({ ok: true, periodo_fin });
  } catch (e) {
    console.error('cancel-subscription error');
    res.status(500).json({ error: 'Error interno' });
  }
}
