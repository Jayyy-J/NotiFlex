import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

export const webhookRouter = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

// ── STRIPE WEBHOOK
webhookRouter.post('/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature']!;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    logger.error('Stripe webhook signature failed', { error: err.message });
    return res.status(400).json({ error: 'Webhook signature failed' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.CheckoutSession;
        const userId = session.metadata?.user_id;
        const planType = session.metadata?.plan_type;
        if (!userId) break;

        await supabase.from('subscriptions').update({
          status: 'active',
          plan_type: planType,
          payment_provider: 'stripe',
          provider_subscription_id: session.subscription as string,
          current_period_start: new Date().toISOString(),
          current_period_end: planType === 'monthly'
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          amount: (session.amount_total ?? 0) / 100,
          currency: session.currency?.toUpperCase() ?? 'USD',
        }).eq('user_id', userId);

        await supabase.from('invoices').insert({
          user_id: userId,
          subscription_id: (await supabase.from('subscriptions').select('id').eq('user_id', userId).single()).data?.id,
          amount: (session.amount_total ?? 0) / 100,
          currency: session.currency?.toUpperCase() ?? 'USD',
          status: 'paid',
          provider: 'stripe',
          provider_invoice_id: session.invoice as string,
          paid_at: new Date().toISOString(),
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await supabase.from('subscriptions')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
          .eq('provider_subscription_id', sub.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await supabase.from('subscriptions')
            .update({ status: 'expired' })
            .eq('provider_subscription_id', invoice.subscription);
        }
        break;
      }
    }

    return res.json({ received: true });
  } catch (err: any) {
    logger.error('Stripe webhook processing error', { error: err.message, event: event.type });
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ── MERCADO PAGO WEBHOOK
webhookRouter.post('/mercadopago', async (req: Request, res: Response) => {
  const { type, data } = req.body;
  if (type !== 'payment') return res.sendStatus(200);

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { 'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
    });
    const payment = await response.json();

    if (payment.status === 'approved') {
      const [userId, planType] = (payment.external_reference || '').split('_');
      if (userId) {
        await supabase.from('subscriptions').update({
          status: 'active',
          plan_type: planType,
          payment_provider: 'mercadopago',
          provider_subscription_id: data.id.toString(),
          amount: payment.transaction_amount,
          currency: payment.currency_id,
          current_period_start: new Date().toISOString(),
          current_period_end: planType === 'monthly'
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        }).eq('user_id', userId);
      }
    }

    return res.sendStatus(200);
  } catch (err: any) {
    logger.error('MercadoPago webhook error', { error: err.message });
    return res.sendStatus(500);
  }
});

// ── WOMPI / PSE WEBHOOK
webhookRouter.post('/wompi', async (req: Request, res: Response) => {
  const { data } = req.body;
  if (!data?.transaction) return res.sendStatus(200);

  const tx = data.transaction;
  if (tx.status === 'APPROVED') {
    const reference = tx.reference || '';
    const parts = reference.split('_');
    const userId = parts[1];
    const planType = parts[0] === 'PSE' ? parts[2] : parts[1];

    if (userId) {
      await supabase.from('subscriptions').update({
        status: 'active',
        payment_provider: reference.startsWith('PSE') ? 'pse' : 'wompi',
        provider_subscription_id: tx.id,
        amount: tx.amount_in_cents / 100,
        currency: tx.currency,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }).eq('user_id', userId);
    }
  }

  return res.sendStatus(200);
});

// ── PAYPAL WEBHOOK
webhookRouter.post('/paypal', async (req: Request, res: Response) => {
  const { event_type, resource } = req.body;

  if (event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const customId = resource?.custom_id || '';
    const [userId, planType] = customId.split('_');

    if (userId) {
      await supabase.from('subscriptions').update({
        status: 'active',
        plan_type: planType,
        payment_provider: 'paypal',
        provider_subscription_id: resource.id,
        amount: parseFloat(resource.amount?.value || '0'),
        currency: resource.amount?.currency_code || 'USD',
        current_period_start: new Date().toISOString(),
        current_period_end: planType === 'monthly'
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      }).eq('user_id', userId);
    }
  }

  return res.sendStatus(200);
});
