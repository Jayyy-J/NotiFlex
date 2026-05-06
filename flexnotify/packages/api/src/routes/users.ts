import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';
import { z } from 'zod';

export const usersRouter = Router();
usersRouter.use(requireAuth);

// GET /api/users/me
usersRouter.get('/me', async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('users')
    .select('*, user_preferences(*), subscriptions(*)')
    .eq('id', req.user!.id)
    .single();

  if (error) return res.status(404).json({ success: false, error: error.message });
  return res.json({ success: true, data });
});

// PATCH /api/users/me
usersRouter.patch('/me', async (req: AuthRequest, res: Response) => {
  const Schema = z.object({
    full_name: z.string().min(2).optional(),
    phone: z.string().optional(),
    avatar_url: z.string().url().optional(),
  });

  try {
    const body = Schema.parse(req.body);
    const { data, error } = await supabase
      .from('users')
      .update(body)
      .eq('id', req.user!.id)
      .select()
      .single();

    if (error) return res.status(400).json({ success: false, error: error.message });
    return res.json({ success: true, data });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors });
    return res.status(500).json({ success: false, error: 'Update failed' });
  }
});

// GET /api/users/preferences
usersRouter.get('/preferences', async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', req.user!.id)
    .single();

  if (error) return res.status(404).json({ success: false, error: error.message });
  return res.json({ success: true, data });
});

// PATCH /api/users/preferences
usersRouter.patch('/preferences', async (req: AuthRequest, res: Response) => {
  const Schema = z.object({
    language: z.enum(['es', 'en', 'pt']).optional(),
    theme: z.enum(['warm', 'dark', 'light']).optional(),
    platforms: z.enum(['amazon_flex', 'doordash', 'both']).optional(),
    min_price: z.number().min(0).optional(),
    max_price: z.number().max(9999).optional(),
    zones: z.array(z.string()).optional(),
    work_hours_start: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    work_hours_end: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    notification_channels: z.array(z.enum(['push', 'email', 'sms'])).optional(),
    fcm_token: z.string().optional(),
  });

  try {
    const body = Schema.parse(req.body);
    const { data, error } = await supabase
      .from('user_preferences')
      .update(body)
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (error) return res.status(400).json({ success: false, error: error.message });
    return res.json({ success: true, data });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors });
    return res.status(500).json({ success: false, error: 'Update failed' });
  }
});

// DELETE /api/users/me — soft delete / cancel
usersRouter.delete('/me', async (req: AuthRequest, res: Response) => {
  await supabase.from('subscriptions')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('user_id', req.user!.id);

  return res.json({ success: true, message: 'Account scheduled for deletion' });
});
