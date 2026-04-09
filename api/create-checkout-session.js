export const config = { api: { bodyParser: { sizeLimit: '16kb' } } };

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, getIP } from './_ratelimit.js';
import { validateEmail } from './_validate.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  if (!await rateLimit(getIP(req), 10, 60_000)) {
    return res.status(429).json({ error: 'Demasiadas solicitudes' });
  }

  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !authUser) return res.status(401).json({ error: 'No autorizado' });

  // Usar siempre el ID y email del token — nunca del body
  const userId = authUser.id;
  const cleanEmail = validateEmail(authUser.email);
  if (!cleanEmail) return res.status(400).json({ error: 'Email de usuario inválido' });

  try {
    const customers = await stripe.customers.list({ email: cleanEmail, limit: 1 });
    let customer = customers.data[0];
    if (!customer) {
      customer = await stripe.customers.create({ email: cleanEmail, metadata: { user_id: userId } });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      subscription_data: {
        trial_period_days: 30,
        metadata: { user_id: userId },
      },
      success_url: `${process.env.NEXT_PUBLIC_URL || 'https://fastrevenue.app'}/home?pago=ok`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || 'https://fastrevenue.app'}/home?pago=cancelado`,
      metadata: { user_id: userId },
    });

    res.status(200).json({ url: session.url });
  } catch (e) {
    console.error('create-checkout-session error');
    res.status(500).json({ error: 'Error interno' });
  }
}
