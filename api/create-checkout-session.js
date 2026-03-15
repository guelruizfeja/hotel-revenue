import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { user_id, email } = req.body;
  if (!user_id || !email) return res.status(400).json({ error: 'Faltan datos' });

  try {
    // Crear o recuperar customer
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
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
