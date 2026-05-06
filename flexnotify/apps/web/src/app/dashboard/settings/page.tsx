'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuthStore } from '../../../lib/hooks/useAuth';
import { supabase } from '../../../lib/supabase/client';
import { Settings, Bell, Map, DollarSign, Clock, Globe, Palette } from 'lucide-react';
import { clsx } from 'clsx';

export default function SettingsPage() {
  const { user, accessToken } = useAuthStore();
  const qc = useQueryClient();

  const { data: prefs, isLoading } = useQuery({
    queryKey: ['preferences', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      language: 'en',
      theme: 'light',
      platforms: 'both',
      min_price: 0,
      max_price: 999,
      zones: '',
      work_hours_start: '08:00',
      work_hours_end: '20:00',
    },
  });

  useEffect(() => {
    if (prefs) {
      reset({
        ...prefs,
        zones: prefs.zones?.join(', ') || '',
      });
    }
  }, [prefs, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        zones: data.zones ? data.zones.split(',').map((z: string) => z.trim()).filter(Boolean) : [],
        min_price: parseFloat(data.min_price),
        max_price: parseFloat(data.max_price),
      };
      return axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/preferences`,
        payload,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    },
    onSuccess: () => {
      toast.success('Settings saved!');
      qc.invalidateQueries({ queryKey: ['preferences'] });
    },
    onError: () => toast.error('Failed to save settings'),
  });

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-8">
        {/* Appearance */}
        <section className="card">
          <div className="flex items-center gap-2 mb-5">
            <Palette className="w-4 h-4 text-brand-600" />
            <h2 className="font-semibold">Appearance</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Language</label>
              <select {...register('language')} className="input">
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="pt">Português</option>
              </select>
            </div>
            <div>
              <label className="label">Theme</label>
              <select {...register('theme')} className="input">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="warm">Warm</option>
              </select>
            </div>
          </div>
        </section>

        {/* Platforms */}
        <section className="card">
          <div className="flex items-center gap-2 mb-5">
            <Bell className="w-4 h-4 text-brand-600" />
            <h2 className="font-semibold">Notification Platforms</h2>
          </div>
          <div>
            <label className="label">Platforms to monitor</label>
            <select {...register('platforms')} className="input">
              <option value="both">Amazon Flex + DoorDash</option>
              <option value="amazon_flex">Amazon Flex only</option>
              <option value="doordash">DoorDash only</option>
            </select>
          </div>
        </section>

        {/* Price range */}
        <section className="card">
          <div className="flex items-center gap-2 mb-5">
            <DollarSign className="w-4 h-4 text-brand-600" />
            <h2 className="font-semibold">Price Range</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Minimum ($)</label>
              <input {...register('min_price')} type="number" step="0.01" min="0" className="input" />
            </div>
            <div>
              <label className="label">Maximum ($)</label>
              <input {...register('max_price')} type="number" step="0.01" min="0" className="input" />
            </div>
          </div>
        </section>

        {/* Zones */}
        <section className="card">
          <div className="flex items-center gap-2 mb-5">
            <Map className="w-4 h-4 text-brand-600" />
            <h2 className="font-semibold">Delivery Zones</h2>
          </div>
          <div>
            <label className="label">Zones (comma-separated)</label>
            <input {...register('zones')} className="input" placeholder="e.g. Downtown Seattle, Capitol Hill, Bellevue" />
            <p className="text-xs text-[rgb(var(--muted))] mt-1">Leave empty to receive alerts for all zones.</p>
          </div>
        </section>

        {/* Work hours */}
        <section className="card">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="w-4 h-4 text-brand-600" />
            <h2 className="font-semibold">Work Hours</h2>
          </div>
          <p className="text-sm text-[rgb(var(--muted))] mb-4">Only receive notifications during these hours.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start time</label>
              <input {...register('work_hours_start')} type="time" className="input" />
            </div>
            <div>
              <label className="label">End time</label>
              <input {...register('work_hours_end')} type="time" className="input" />
            </div>
          </div>
        </section>

        <button type="submit" disabled={mutation.isPending} className="btn-primary px-8 py-3">
          {mutation.isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
