import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../lib/supabase';

export const authRouter = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
  phone: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const body = RegisterSchema.parse(req.body);

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
    });

    if (authError) return res.status(400).json({ success: false, error: authError.message });

    // Create profile
    const { error: profileError } = await supabase.from('users').insert({
      id: authData.user.id,
      email: body.email,
      full_name: body.full_name,
      phone: body.phone,
    });

    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json({ success: false, error: profileError.message });
    }

    return res.status(201).json({ success: true, message: 'Account created. Please check your email.' });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors });
    return res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const body = LoginSchema.parse(req.body);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (error) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const { data: profile } = await supabase
      .from('users')
      .select('*, subscriptions(*), user_preferences(*)')
      .eq('id', data.user.id)
      .single();

    return res.json({
      success: true,
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: profile,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: err.errors });
    return res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// POST /api/auth/refresh
authRouter.post('/refresh', async (req: Request, res: Response) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ success: false, error: 'refresh_token required' });

  const { data, error } = await supabase.auth.refreshSession({ refresh_token });
  if (error) return res.status(401).json({ success: false, error: 'Invalid refresh token' });

  return res.json({ success: true, data: { access_token: data.session?.access_token } });
});

// POST /api/auth/logout
authRouter.post('/logout', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) await supabase.auth.admin.signOut(token);
  return res.json({ success: true });
});

// POST /api/auth/forgot-password
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, error: 'email required' });

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.APP_URL}/auth/reset-password`,
  });

  if (error) return res.status(400).json({ success: false, error: error.message });
  return res.json({ success: true, message: 'Password reset email sent' });
});
