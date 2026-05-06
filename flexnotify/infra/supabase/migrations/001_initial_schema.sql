-- ============================================================
-- FlexNotify — Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE platform_type AS ENUM ('amazon_flex', 'doordash', 'both');
CREATE TYPE theme_type AS ENUM ('warm', 'dark', 'light');
CREATE TYPE language_type AS ENUM ('es', 'en', 'pt');
CREATE TYPE plan_type AS ENUM ('free_trial', 'monthly', 'annual');
CREATE TYPE plan_status AS ENUM ('active', 'cancelled', 'expired', 'trial');
CREATE TYPE user_role AS ENUM ('user', 'admin_owner', 'admin_super');
CREATE TYPE delivery_status AS ENUM ('available', 'taken', 'expired');
CREATE TYPE notification_channel AS ENUM ('push', 'email', 'sms');
CREATE TYPE payment_provider AS ENUM ('stripe', 'paypal', 'mercadopago', 'wompi', 'pse');
CREATE TYPE invoice_status AS ENUM ('paid', 'pending', 'failed', 'refunded');

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role DEFAULT 'user',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER PREFERENCES
-- ============================================================
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  language language_type DEFAULT 'en',
  theme theme_type DEFAULT 'light',
  platforms platform_type DEFAULT 'both',
  min_price DECIMAL(10,2) DEFAULT 0,
  max_price DECIMAL(10,2) DEFAULT 999,
  zones TEXT[] DEFAULT '{}',
  work_hours_start TIME DEFAULT '08:00',
  work_hours_end TIME DEFAULT '20:00',
  notification_channels notification_channel[] DEFAULT '{push}',
  fcm_token TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_type plan_type NOT NULL DEFAULT 'free_trial',
  status plan_status DEFAULT 'trial',
  payment_provider payment_provider,
  provider_subscription_id TEXT,
  amount DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- DELIVERIES
-- ============================================================
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL CHECK (platform IN ('amazon_flex', 'doordash')),
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  pickup_location TEXT NOT NULL,
  delivery_zone TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  distance_km DECIMAL(8,2),
  estimated_duration_min INT,
  status delivery_status DEFAULT 'available',
  available_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, external_id)
);

-- Index for fast zone+price+platform queries
CREATE INDEX idx_deliveries_zone ON public.deliveries(delivery_zone, status);
CREATE INDEX idx_deliveries_platform ON public.deliveries(platform, status);
CREATE INDEX idx_deliveries_price ON public.deliveries(price, status);
CREATE INDEX idx_deliveries_status ON public.deliveries(status, updated_at);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  channel notification_channel NOT NULL DEFAULT 'push',
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  UNIQUE(user_id, delivery_id)
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, sent_at DESC);

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status invoice_status DEFAULT 'pending',
  provider payment_provider,
  provider_invoice_id TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  pdf_url TEXT
);

CREATE INDEX idx_invoices_user ON public.invoices(user_id, issued_at DESC);
CREATE INDEX idx_invoices_status ON public.invoices(status, issued_at DESC);

-- ============================================================
-- AUDIT LOG (for super admin export)
-- ============================================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_prefs_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_deliveries_updated_at BEFORE UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER: auto-create preferences on user insert
-- ============================================================
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_prefs AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION create_user_preferences();

-- ============================================================
-- TRIGGER: auto-create subscription (trial) on user insert
-- ============================================================
CREATE OR REPLACE FUNCTION create_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_type, status)
  VALUES (NEW.id, 'free_trial', 'trial')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_sub AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION create_user_subscription();

-- ============================================================
-- TRIGGER: auto-delete taken/expired deliveries
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_unavailable_deliveries()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('taken', 'expired') THEN
    -- Keep record but mark, realtime will propagate delete to clients
    PERFORM pg_notify('delivery_unavailable', NEW.id::TEXT);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_delivery_status AFTER UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION cleanup_unavailable_deliveries();

-- ============================================================
-- SCHEDULED: cleanup old taken/expired deliveries (every hour)
-- ============================================================
SELECT cron.schedule('cleanup-deliveries', '0 * * * *',
  $$DELETE FROM public.deliveries WHERE status IN ('taken','expired') AND updated_at < NOW() - INTERVAL '2 hours'$$
);

-- ============================================================
-- RLS POLICIES (see policies/ folder for full detail)
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Users can only see/edit their own data
CREATE POLICY "users_own" ON public.users FOR ALL USING (auth.uid() = id);
CREATE POLICY "prefs_own" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "subs_own" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifs_own" ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "invoices_own" ON public.invoices FOR SELECT USING (auth.uid() = user_id);

-- Deliveries are readable by all authenticated users with active subscription
CREATE POLICY "deliveries_read" ON public.deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.user_id = auth.uid()
      AND s.status IN ('active', 'trial')
    )
  );

-- Admin full access
CREATE POLICY "admin_all_users" ON public.users FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin_owner', 'admin_super')));
