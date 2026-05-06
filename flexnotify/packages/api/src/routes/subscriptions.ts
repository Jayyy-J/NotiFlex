import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';

export const subscriptionsRouter = Router();
subscriptionsRouter.use(requireAuth);

// GET /api/subscriptions/me
subscriptionsRouter.get('/me', async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', req.user!.id)
    .single();

  if (error) return res.status(404).json({ success: false, error: error.message });
  return res.json({ success: true, data });
});

// POST /api/subscriptions/cancel
subscriptionsRouter.post('/cancel', async (req: AuthRequest, res: Response) => {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', req.user!.id)
    .single();

  if (!sub) return res.status(404).json({ success: false, error: 'No subscription found' });

  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('user_id', req.user!.id);

  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, message: 'Subscription cancelled. Access continues until period end.' });
});

// GET /api/subscriptions/invoices
subscriptionsRouter.get('/invoices', async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('issued_at', { ascending: false });

  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data });
});

// GET /api/subscriptions/plans
subscriptionsRouter.get('/plans', async (_req, res: Response) => {
  return res.json({
    success: true,
    data: [
      {
        id: 'free_trial',
        name: 'Free Trial',
        price: 0,
        currency: 'USD',
        interval: null,
        duration_days: 7,
        features: ['All platforms', 'Push notifications', 'Zone filtering', 'Price range filter'],
      },
      {
        id: 'monthly',
        name: 'Monthly',
        price: 9.99,
        currency: 'USD',
        interval: 'month',
        features: ['Everything in Trial', 'Priority notifications', 'Unlimited history', 'Email support'],
      },
      {
        id: 'annual',
        name: 'Annual',
        price: 79.99,
        currency: 'USD',
        interval: 'year',
        savings: '33%',
        features: ['Everything in Monthly', 'Best value', 'Priority support', 'Advanced analytics'],
      },
    ],
  });
});
