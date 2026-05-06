import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Linking } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import axios from 'expo-constants';
import Constants from 'expo-constants';
import { useAuthStore, supabase } from '../../hooks/useAuth';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001';

const PAYMENT_OPTIONS = [
  { id: 'stripe', label: '💳 Card (Stripe)', color: '#635bff' },
  { id: 'paypal', label: '🅿️ PayPal', color: '#003087' },
  { id: 'mercadopago', label: '💙 MercadoPago', color: '#009ee3' },
  { id: 'wompi', label: '🇨🇴 Wompi', color: '#ff6b35' },
  { id: 'pse', label: '🏦 PSE', color: '#004481' },
];

export function BillingScreen() {
  const { user, accessToken } = useAuthStore();

  const { data: sub } = useQuery({
    queryKey: ['mobile-sub', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('subscriptions').select('*').eq('user_id', (user as any).id).single();
      return data;
    },
    enabled: !!(user as any)?.id,
  });

  const handleUpgrade = async (provider: string, planType: string) => {
    const endpoints: Record<string, string> = {
      stripe: '/api/payments/stripe/create-session',
      paypal: '/api/payments/paypal/create-order',
      mercadopago: '/api/payments/mercadopago/create-preference',
      wompi: '/api/payments/wompi/create-transaction',
      pse: '/api/payments/pse/create-transaction',
    };

    const res = await fetch(`${API_URL}${endpoints[provider]}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ plan_type: planType }),
    });
    const data = await res.json();
    const url = data?.data?.url;
    if (url) Linking.openURL(url);
  };

  const statusColor = { active: '#16a34a', trial: '#d97706', expired: '#dc2626', cancelled: '#64748b' };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Billing</Text>

        {/* Current plan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Plan</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.fieldLabel}>Plan</Text>
              <Text style={styles.fieldValue}>{sub?.plan_type?.replace('_', ' ') ?? '—'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.fieldLabel}>Status</Text>
              <Text style={[styles.fieldValue, { color: statusColor[(sub?.status as keyof typeof statusColor)] ?? '#64748b' }]}>
                {sub?.status ?? '—'}
              </Text>
            </View>
            {sub?.status === 'trial' && sub?.trial_ends_at && (
              <View style={styles.row}>
                <Text style={styles.fieldLabel}>Trial ends</Text>
                <Text style={styles.fieldValue}>{new Date(sub.trial_ends_at).toLocaleDateString()}</Text>
              </View>
            )}
            {sub?.status === 'active' && (
              <View style={styles.row}>
                <Text style={styles.fieldLabel}>Next billing</Text>
                <Text style={styles.fieldValue}>{new Date(sub.current_period_end).toLocaleDateString()}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Upgrade */}
        {sub?.status !== 'active' && (
          <>
            {[
              { id: 'monthly', name: 'Monthly Plan', price: '$9.99/mo', desc: 'Cancel anytime' },
              { id: 'annual', name: 'Annual Plan', price: '$79.99/yr', desc: 'Save 33%', badge: 'Best Value' },
            ].map((plan) => (
              <View key={plan.id} style={styles.section}>
                <View style={styles.planHeader}>
                  <Text style={styles.sectionTitle}>{plan.name}</Text>
                  {plan.badge && <View style={styles.badge}><Text style={styles.badgeText}>{plan.badge}</Text></View>}
                </View>
                <Text style={styles.planPrice}>{plan.price}</Text>
                <View style={styles.card}>
                  {PAYMENT_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.payBtn, { borderColor: opt.color + '40' }]}
                      onPress={() => handleUpgrade(opt.id, plan.id)}
                    >
                      <Text style={[styles.payBtnText, { color: opt.color }]}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, gap: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  section: { marginBottom: 16 },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  planPrice: { fontSize: 22, fontWeight: '800', color: '#2563eb', marginBottom: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, paddingLeft: 4 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  fieldLabel: { fontSize: 14, color: '#64748b' },
  fieldValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  payBtn: { borderWidth: 1.5, borderRadius: 12, padding: 14, alignItems: 'center' },
  payBtnText: { fontSize: 14, fontWeight: '700' },
  badge: { backgroundColor: '#dcfce7', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#16a34a' },
});
