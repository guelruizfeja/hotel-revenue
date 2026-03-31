import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, getIP } from './_ratelimit.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Rate limit: 10 intentos por IP por minuto
  if (!rateLimit(getIP(req), 10, 60_000)) {
    return res.status(429).json({ error: 'Demasiadas solicitudes' });
  }

  // Verificar identidad del usuario mediante JWT
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !authUser) return res.status(401).json({ error: 'No autorizado' });

  const { user_id, email } = req.body;
  if (!user_id || !email) return res.status(400).json({ error: 'Faltan datos' });

  // El user_id del body debe coincidir con el del token
  if (authUser.id !== user_id) return res.status(403).json({ error: 'No autorizado' });

  try {
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customer = customers.data[0];
    if (!customer) {
      customer = await stripe.customers.create({ email, metadata: { user_id } });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      subscription_data: {
        trial_period_days: 30,
        metadata: { user_id },
      },
      success_url: `${process.env.NEXT_PUBLIC_URL || 'https://fastrevenue.app'}/home?pago=ok`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || 'https://fastrevenue.app'}/home?pago=cancelado`,
      metadata: { user_id },
    });

    res.status(200).json({ url: session.url });
  } catch (e) {
    console.error('create-checkout-session error');
    res.status(500).json({ error: 'Error interno' });
  }
}
