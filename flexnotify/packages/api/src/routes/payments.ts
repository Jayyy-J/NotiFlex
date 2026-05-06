import { Router, Response, Request } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';
import Stripe from 'stripe';

export const paymentsRouter = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

// Plan pricing config
const PLANS = {
  monthly: { amount: 999, currency: 'usd', interval: 'month' as const },   // $9.99/mo
  annual: { amount: 7999, currency: 'usd', interval: 'year' as const },     // $79.99/yr
};

// ── STRIPE ──────────────────────────────────────────────────
// POST /api/payments/stripe/create-session
paymentsRouter.post('/stripe/create-session', requireAuth, async (req: AuthRequest, res: Response) => {
  const { plan_type } = req.body;
  if (!['monthly', 'annual'].includes(plan_type)) {
    return res.status(400).json({ success: false, error: 'Invalid plan_type' });
  }

  const plan = PLANS[plan_type as keyof typeof PLANS];

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: req.user!.email,
      metadata: { user_id: req.user!.id, plan_type },
      line_items: [{
        price_data: {
          currency: plan.currency,
          product_data: { name: `FlexNotify ${plan_type === 'monthly' ? 'Monthly' : 'Annual'} Plan` },
          unit_amount: plan.amount,
          recurring: { interval: plan.interval },
        },
        quantity: 1,
      }],
      success_url: `${process.env.APP_URL}/dashboard/billing?success=1`,
      cancel_url: `${process.env.APP_URL}/dashboard/billing?cancelled=1`,
    });

    return res.json({ success: true, data: { url: session.url, session_id: session.id } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/payments/stripe/portal
paymentsRouter.post('/stripe/portal', requireAuth, async (req: AuthRequest, res: Response) => {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('provider_subscription_id')
    .eq('user_id', req.user!.id)
    .single();

  if (!sub?.provider_subscription_id) {
    return res.status(404).json({ success: false, error: 'No Stripe subscription found' });
  }

  try {
    // Get customer from subscription
    const subscription = await stripe.subscriptions.retrieve(sub.provider_subscription_id);
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.customer as string,
      return_url: `${process.env.APP_URL}/dashboard/billing`,
    });
    return res.json({ success: true, data: { url: session.url } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── MERCADO PAGO ─────────────────────────────────────────────
// POST /api/payments/mercadopago/create-preference
paymentsRouter.post('/mercadopago/create-preference', requireAuth, async (req: AuthRequest, res: Response) => {
  const { plan_type } = req.body;

  try {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{
          title: `FlexNotify ${plan_type} Plan`,
          quantity: 1,
          unit_price: plan_type === 'monthly' ? 9.99 : 79.99,
          currency_id: 'USD',
        }],
        payer: { email: req.user!.email },
        external_reference: `${req.user!.id}_${plan_type}`,
        back_urls: {
          success: `${process.env.APP_URL}/dashboard/billing?success=1`,
          failure: `${process.env.APP_URL}/dashboard/billing?failed=1`,
          pending: `${process.env.APP_URL}/dashboard/billing?pending=1`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.API_URL}/api/webhooks/mercadopago`,
      }),
    });

    const data = await response.json();
    return res.json({ success: true, data: { url: data.init_point, id: data.id } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── WOMPI (Colombia) ─────────────────────────────────────────
// POST /api/payments/wompi/create-transaction
paymentsRouter.post('/wompi/create-transaction', requireAuth, async (req: AuthRequest, res: Response) => {
  const { plan_type } = req.body;
  const amount = plan_type === 'monthly' ? 999 : 7999; // USD cents

  try {
    const response = await fetch('https://sandbox.wompi.co/v1/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount_in_cents: amount * 100,
        currency: 'COP',
        customer_email: req.user!.email,
        reference: `FLEX_${req.user!.id}_${Date.now()}`,
        payment_method: { type: 'CARD' },
        redirect_url: `${process.env.APP_URL}/dashboard/billing`,
      }),
    });

    const data = await response.json();
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── PSE (Colombia bank transfer) ──────────────────────────────
// GET /api/payments/pse/banks
paymentsRouter.get('/pse/banks', async (_req: Request, res: Response) => {
  try {
    const response = await fetch(
      `https://sandbox.wompi.co/v1/pse/financial_institutions`,
      { headers: { 'Authorization': `Bearer ${process.env.WOMPI_PUBLIC_KEY}` } }
    );
    const data = await response.json();
    return res.json({ success: true, data: data.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/payments/pse/create-transaction
paymentsRouter.post('/pse/create-transaction', requireAuth, async (req: AuthRequest, res: Response) => {
  const { plan_type, financial_institution_code, user_type, user_legal_id, user_legal_id_type } = req.body;

  try {
    const amount = plan_type === 'monthly' ? 9990000 : 79990000; // COP cents

    const response = await fetch('https://sandbox.wompi.co/v1/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount_in_cents: amount,
        currency: 'COP',
        customer_email: req.user!.email,
        reference: `PSE_${req.user!.id}_${Date.now()}`,
        payment_method: {
          type: 'PSE',
          user_type,
          user_legal_id_type,
          user_legal_id,
          financial_institution_code,
          payment_description: `FlexNotify ${plan_type}`,
        },
        redirect_url: `${process.env.APP_URL}/dashboard/billing`,
      }),
    });

    const data = await response.json();
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ── PAYPAL ───────────────────────────────────────────────────
// POST /api/payments/paypal/create-order
paymentsRouter.post('/paypal/create-order', requireAuth, async (req: AuthRequest, res: Response) => {
  const { plan_type } = req.body;
  const amount = plan_type === 'monthly' ? '9.99' : '79.99';

  try {
    // Get PayPal access token
    const authRes = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    const { access_token } = await authRes.json();

    const orderRes = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'USD', value: amount },
          custom_id: `${req.user!.id}_${plan_type}`,
        }],
        application_context: {
          return_url: `${process.env.APP_URL}/dashboard/billing?success=1`,
          cancel_url: `${process.env.APP_URL}/dashboard/billing?cancelled=1`,
        },
      }),
    });

    const order = await orderRes.json();
    const approveLink = order.links.find((l: any) => l.rel === 'approve');
    return res.json({ success: true, data: { order_id: order.id, url: approveLink?.href } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
