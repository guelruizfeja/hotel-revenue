import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = { api: { bodyParser: false } };

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error('Webhook error:', e.message);
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }

  const { type, data } = event;

  if (type === 'checkout.session.completed') {
    const session = data.object;
    const user_id = session.metadata?.user_id;
    if (!user_id) {
      console.error('checkout.session.completed: metadata.user_id missing', session.id);
      return res.status(200).json({ received: true });
    }
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    const trial_end = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null;
    const periodo_fin = new Date(subscription.current_period_end * 1000).toISOString();

    await supabase.from('suscripciones').upsert({
      user_id,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      estado: subscription.status === 'trialing' ? 'trial' : 'activa',
      plan: 'basico',
      trial_end,
      periodo_fin,
    }, { onConflict: 'user_id' });
  }

  if (type === 'invoice.payment_succeeded') {
    const invoice = data.object;
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const user_id = subscription.metadata?.user_id;
    if (!user_id) {
      console.error('invoice.payment_succeeded: metadata.user_id missing', invoice.id);
      return res.status(200).json({ received: true });
    }
    const periodo_fin = new Date(subscription.current_period_end * 1000).toISOString();

    await supabase.from('suscripciones').update({
      estado: 'activa',
      periodo_fin,
    }).eq('stripe_subscription_id', invoice.subscription);
  }

  if (type === 'customer.subscription.updated') {
    const subscription = data.object;
    if (subscription.cancel_at_period_end) {
      const periodo_fin = new Date(subscription.current_period_end * 1000).toISOString();
      await supabase.from('suscripciones').update({
        estado: 'cancelando',
        periodo_fin,
      }).eq('stripe_subscription_id', subscription.id);
    } else if (subscription.status === 'active') {
      // Reactivación
      const periodo_fin = new Date(subscription.current_period_end * 1000).toISOString();
      await supabase.from('suscripciones').update({
        estado: 'activa',
        periodo_fin,
      }).eq('stripe_subscription_id', subscription.id);
    }
  }

  if (type === 'customer.subscription.deleted' || type === 'invoice.payment_failed') {
    const obj = data.object;
    const sub_id = obj.subscription || obj.id;

    await supabase.from('suscripciones').update({
      estado: 'cancelada',
    }).eq('stripe_subscription_id', sub_id);
  }

  res.status(200).json({ received: true });
}
