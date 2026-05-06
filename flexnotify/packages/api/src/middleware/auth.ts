import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, error: 'No token provided' });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ success: false, error: 'Invalid token' });

    const { data: profile } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', user.id)
      .single();

    if (!profile) return res.status(401).json({ success: false, error: 'User not found' });

    req.user = profile;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Authentication failed' });
  }
};

export const requireAdmin = (roles: string[] = ['admin_owner', 'admin_super']) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }
    next();
  };
};

export const requireActiveSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status, trial_ends_at')
    .eq('user_id', req.user.id)
    .single();

  if (!sub) return res.status(403).json({ success: false, error: 'No subscription found' });

  if (sub.status === 'trial' && sub.trial_ends_at) {
    const trialEnds = new Date(sub.trial_ends_at);
    if (trialEnds < new Date()) {
      await supabase.from('subscriptions').update({ status: 'expired' }).eq('user_id', req.user.id);
      return res.status(403).json({ success: false, error: 'Trial expired. Please upgrade.' });
    }
  } else if (!['active', 'trial'].includes(sub.status)) {
    return res.status(403).json({ success: false, error: 'Subscription inactive' });
  }

  next();
};
