import { Router, Response } from 'express';
import { requireAuth, requireActiveSubscription, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';
import { z } from 'zod';

export const deliveriesRouter = Router();

deliveriesRouter.use(requireAuth);
deliveriesRouter.use(requireActiveSubscription);

// GET /api/deliveries — filtered by user preferences
deliveriesRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', req.user!.id)
      .single();

    if (!prefs) return res.status(404).json({ success: false, error: 'Preferences not set' });

    let query = supabase
      .from('deliveries')
      .select('*')
      .eq('status', 'available')
      .gte('price', prefs.min_price)
      .lte('price', prefs.max_price)
      .order('available_at', { ascending: false });

    if (prefs.platforms !== 'both') {
      query = query.eq('platform', prefs.platforms);
    }

    if (prefs.zones && prefs.zones.length > 0) {
      query = query.in('delivery_zone', prefs.zones);
    }

    const { data, error } = await query.limit(50);
    if (error) throw error;

    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch deliveries' });
  }
});

// GET /api/deliveries/history
deliveriesRouter.get('/history', async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  const { data, count, error } = await supabase
    .from('notifications')
    .select('*, deliveries(*)', { count: 'exact' })
    .eq('user_id', req.user!.id)
    .order('sent_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return res.status(500).json({ success: false, error: error.message });

  return res.json({
    success: true,
    data,
    total: count,
    page,
    limit,
    has_more: (count ?? 0) > offset + limit,
  });
});

// POST /api/deliveries/:id/mark-read
deliveriesRouter.post('/:id/mark-read', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('delivery_id', id)
    .eq('user_id', req.user!.id);

  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true });
});

// Internal: POST /api/deliveries/ingest (called by scraper via API key)
deliveriesRouter.post('/ingest', async (req: Request, res: Response) => {
  const apiKey = (req as any).headers['x-api-key'];
  if (apiKey !== process.env.SCRAPER_API_KEY) {
    return (res as Response).status(403).json({ success: false, error: 'Forbidden' });
  }

  const DeliverySchema = z.object({
    platform: z.enum(['amazon_flex', 'doordash']),
    external_id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    pickup_location: z.string(),
    delivery_zone: z.string(),
    price: z.number(),
    currency: z.string().default('USD'),
    distance_km: z.number().optional(),
    estimated_duration_min: z.number().optional(),
    expires_at: z.string().optional(),
    raw_data: z.record(z.unknown()).default({}),
  });

  try {
    const body = DeliverySchema.parse(req.body);

    const { data, error } = await supabase
      .from('deliveries')
      .upsert({ ...body, status: 'available', available_at: new Date().toISOString() }, {
        onConflict: 'platform,external_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) throw error;

    return (res as Response).status(201).json({ success: true, data });
  } catch (err) {
    if (err instanceof z.ZodError) return (res as Response).status(400).json({ success: false, error: err.errors });
    return (res as Response).status(500).json({ success: false, error: 'Ingest failed' });
  }
});

// Internal: PATCH /api/deliveries/:id/status
deliveriesRouter.patch('/:id/status', async (req: Request, res: Response) => {
  const apiKey = (req as any).headers['x-api-key'];
  if (apiKey !== process.env.SCRAPER_API_KEY) {
    return (res as Response).status(403).json({ success: false, error: 'Forbidden' });
  }

  const { status } = req.body;
  if (!['available', 'taken', 'expired'].includes(status)) {
    return (res as Response).status(400).json({ success: false, error: 'Invalid status' });
  }

  const { error } = await supabase
    .from('deliveries')
    .update({ status })
    .eq('id', req.params.id);

  if (error) return (res as Response).status(500).json({ success: false, error: error.message });
  return (res as Response).json({ success: true });
});
