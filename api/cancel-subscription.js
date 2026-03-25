import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'Falta user_id' });

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
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
