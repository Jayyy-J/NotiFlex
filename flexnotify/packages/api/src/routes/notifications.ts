import { Router, Response, Request } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';
import { notificationService } from '../services/notifications';

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

// GET /api/notifications
notificationsRouter.get('/', async (req: AuthRequest, res: Response) => {
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
  return res.json({ success: true, data, total: count, page, limit });
});

// POST /api/notifications/fcm-token
notificationsRouter.post('/fcm-token', async (req: AuthRequest, res: Response) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, error: 'token required' });

  const { error } = await supabase
    .from('user_preferences')
    .update({ fcm_token: token })
    .eq('user_id', req.user!.id);

  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true });
});

// POST /api/notifications/send-matching (internal — called by n8n)
notificationsRouter.post('/send-matching', async (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.N8N_API_KEY) {
    return (res as Response).status(403).json({ success: false, error: 'Forbidden' });
  }

  const { delivery_id } = req.body;
  if (!delivery_id) return (res as Response).status(400).json({ success: false, error: 'delivery_id required' });

  try {
    const sent = await notificationService.sendToMatchingUsers(delivery_id);
    return (res as Response).json({ success: true, data: { sent_count: sent } });
  } catch (err: any) {
    return (res as Response).status(500).json({ success: false, error: err.message });
  }
});
