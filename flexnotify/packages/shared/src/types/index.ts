// ============================================================
// FlexNotify — Shared Types
// ============================================================

export type Platform = 'amazon_flex' | 'doordash' | 'both';
export type Theme = 'warm' | 'dark' | 'light';
export type Language = 'es' | 'en' | 'pt';
export type PlanType = 'free_trial' | 'monthly' | 'annual';
export type PlanStatus = 'active' | 'cancelled' | 'expired' | 'trial';
export type UserRole = 'user' | 'admin_owner' | 'admin_super';
export type DeliveryStatus = 'available' | 'taken' | 'expired';
export type NotificationChannel = 'push' | 'email' | 'sms';
export type PaymentProvider = 'stripe' | 'paypal' | 'mercadopago' | 'wompi' | 'pse';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  language: Language;
  theme: Theme;
  platforms: Platform;
  min_price: number;
  max_price: number;
  zones: string[];
  work_hours_start: string; // HH:mm
  work_hours_end: string;   // HH:mm
  notification_channels: NotificationChannel[];
  fcm_token?: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: PlanType;
  status: PlanStatus;
  payment_provider?: PaymentProvider;
  provider_subscription_id?: string;
  amount: number;
  currency: string;
  trial_ends_at?: string;
  current_period_start: string;
  current_period_end: string;
  cancelled_at?: string;
  created_at: string;
}

export interface Delivery {
  id: string;
  platform: 'amazon_flex' | 'doordash';
  external_id: string;
  title: string;
  description?: string;
  pickup_location: string;
  delivery_zone: string;
  price: number;
  currency: string;
  distance_km?: number;
  estimated_duration_min?: number;
  status: DeliveryStatus;
  available_at: string;
  expires_at?: string;
  raw_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  delivery_id: string;
  channel: NotificationChannel;
  sent_at: string;
  read_at?: string;
  delivery?: Delivery;
}

export interface Invoice {
  id: string;
  user_id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  provider: PaymentProvider;
  provider_invoice_id?: string;
  issued_at: string;
  paid_at?: string;
  pdf_url?: string;
  user?: User;
}

export interface AdminMetrics {
  total_users: number;
  active_users: number;
  trial_users: number;
  monthly_revenue: number;
  annual_revenue: number;
  estimated_next_month: number;
  deliveries_sent_today: number;
  notifications_sent_today: number;
  churn_rate: number;
  conversion_rate: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}
