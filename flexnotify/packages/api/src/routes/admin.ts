import { Router, Response } from 'express';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';

export const adminRouter = Router();
adminRouter.use(requireAuth);
adminRouter.use(requireAdmin());

// GET /api/admin/metrics
adminRouter.get('/metrics', async (_req: AuthRequest, res: Response) => {
  try {
    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: trialUsers },
      { data: revenueData },
      { count: notifToday },
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'trial'),
      supabase.from('invoices').select('amount, issued_at').eq('status', 'paid'),
      supabase.from('notifications').select('id', { count: 'exact', head: true })
        .gte('sent_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
    ]);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const monthlyRevenue = revenueData?.filter(i =>
      new Date(i.issued_at) >= new Date(startOfMonth)
    ).reduce((sum, i) => sum + Number(i.amount), 0) ?? 0;

    const annualRevenue = revenueData?.reduce((sum, i) => sum + Number(i.amount), 0) ?? 0;

    // Estimate next month based on active subscriptions
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('amount, plan_type, current_period_end')
      .eq('status', 'active');

    const nextMonthEstimate = subs?.filter(s => {
      const end = new Date(s.current_period_end);
      return end > now;
    }).reduce((sum, s) => {
      if (s.plan_type === 'monthly') return sum + Number(s.amount);
      if (s.plan_type === 'annual') return sum + Number(s.amount) / 12;
      return sum;
    }, 0) ?? 0;

    return res.json({
      success: true,
      data: {
        total_users: totalUsers ?? 0,
        active_users: activeUsers ?? 0,
        trial_users: trialUsers ?? 0,
        monthly_revenue: monthlyRevenue,
        annual_revenue: annualRevenue,
        estimated_next_month: nextMonthEstimate,
        notifications_sent_today: notifToday ?? 0,
        churn_rate: totalUsers ? (((totalUsers - (activeUsers ?? 0)) / totalUsers) * 100).toFixed(2) : 0,
        conversion_rate: totalUsers ? (((activeUsers ?? 0) / totalUsers) * 100).toFixed(2) : 0,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch metrics' });
  }
});

// GET /api/admin/users
adminRouter.get('/users', async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;
  const search = req.query.search as string;

  let query = supabase
    .from('users')
    .select('*, subscriptions(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) query = query.ilike('email', `%${search}%`);

  const { data, count, error } = await query;
  if (error) return res.status(500).json({ success: false, error: error.message });

  return res.json({ success: true, data, total: count, page, limit });
});

// GET /api/admin/invoices
adminRouter.get('/invoices', async (req: AuthRequest, res: Response) => {
  const { month, year } = req.query;
  let query = supabase
    .from('invoices')
    .select('*, users(full_name, email)', { count: 'exact' })
    .order('issued_at', { ascending: false });

  if (month && year) {
    const start = new Date(Number(year), Number(month) - 1, 1).toISOString();
    const end = new Date(Number(year), Number(month), 0, 23, 59, 59).toISOString();
    query = query.gte('issued_at', start).lte('issued_at', end);
  }

  const { data, count, error } = await query;
  if (error) return res.status(500).json({ success: false, error: error.message });

  return res.json({ success: true, data, total: count });
});

// GET /api/admin/billing-cycles
adminRouter.get('/billing-cycles', async (_req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, users(full_name, email)')
    .eq('status', 'active')
    .order('current_period_end', { ascending: true });

  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true, data });
});

// GET /api/admin/export — SUPER ADMIN ONLY: full DB export
adminRouter.get('/export', requireAdmin(['admin_super']), async (_req: AuthRequest, res: Response) => {
  try {
    const [users, subscriptions, invoices, deliveries, notifications, preferences] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('subscriptions').select('*'),
      supabase.from('invoices').select('*'),
      supabase.from('deliveries').select('*').limit(10000),
      supabase.from('notifications').select('*').limit(10000),
      supabase.from('user_preferences').select('*'),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      counts: {
        users: users.data?.length,
        subscriptions: subscriptions.data?.length,
        invoices: invoices.data?.length,
        deliveries: deliveries.data?.length,
        notifications: notifications.data?.length,
      },
      data: {
        users: users.data,
        subscriptions: subscriptions.data,
        invoices: invoices.data,
        deliveries: deliveries.data,
        notifications: notifications.data,
        preferences: preferences.data,
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=flexnotify-export-${Date.now()}.json`);
    return res.json(exportData);
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Export failed' });
  }
});

// PATCH /api/admin/users/:id/role
adminRouter.patch('/users/:id/role', requireAdmin(['admin_super']), async (req: AuthRequest, res: Response) => {
  const { role } = req.body;
  const { id } = req.params;
  if (!['user', 'admin_owner', 'admin_super'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Invalid role' });
  }

  const { error } = await supabase.from('users').update({ role }).eq('id', id);
  if (error) return res.status(500).json({ success: false, error: error.message });
  return res.json({ success: true });
});

// DELETE /api/admin/users/:id
adminRouter.delete('/users/:id', requireAdmin(['admin_super']), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  await supabase.auth.admin.deleteUser(id);
  return res.json({ success: true });
});
