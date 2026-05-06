import React, { useState, useEffect } from 'react';
import {
  View, Text, Switch, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, TextInput, Alert, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import Constants from 'expo-constants';
import { useAuthStore, supabase } from '../../hooks/useAuth';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001';

export function SettingsScreen() {
  const { user, logout, accessToken } = useAuthStore();
  const [prefs, setPrefs] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      supabase.from('user_preferences').select('*').eq('user_id', user.id).single()
        .then(({ data }) => setPrefs(data));
    }
  }, [user?.id]);

  const save = async () => {
    setSaving(true);
    try {
      await axios.patch(
        `${API_URL}/api/users/preferences`,
        { ...prefs, zones: typeof prefs.zones === 'string' ? prefs.zones.split(',').map((z: string) => z.trim()) : prefs.zones },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      Alert.alert('Saved', 'Your preferences have been updated.');
    } catch {
      Alert.alert('Error', 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (!prefs) return <ActivityIndicator style={{ flex: 1 }} color="#2563eb" />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Settings</Text>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user as any)?.full_name?.[0]?.toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.name}>{(user as any)?.full_name}</Text>
              <Text style={styles.email}>{(user as any)?.email}</Text>
            </View>
          </View>
        </View>

        {/* Platforms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platforms</Text>
          <View style={styles.card}>
            {(['both', 'amazon_flex', 'doordash'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.optionRow, prefs.platforms === p && styles.optionSelected]}
                onPress={() => setPrefs({ ...prefs, platforms: p })}
              >
                <Text style={styles.optionText}>
                  {p === 'both' ? '📦🍕 Amazon Flex + DoorDash' : p === 'amazon_flex' ? '📦 Amazon Flex only' : '🍕 DoorDash only'}
                </Text>
                {prefs.platforms === p && <Text style={{ color: '#2563eb' }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price range */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Range ($)</Text>
          <View style={[styles.card, { flexDirection: 'row', gap: 12 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Min</Text>
              <TextInput
                style={styles.input}
                value={String(prefs.min_price ?? '')}
                onChangeText={(v) => setPrefs({ ...prefs, min_price: parseFloat(v) || 0 })}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Max</Text>
              <TextInput
                style={styles.input}
                value={String(prefs.max_price ?? '')}
                onChangeText={(v) => setPrefs({ ...prefs, max_price: parseFloat(v) || 999 })}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        {/* Zones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Zones</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Comma-separated zones (leave empty for all)</Text>
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={Array.isArray(prefs.zones) ? prefs.zones.join(', ') : prefs.zones}
              onChangeText={(v) => setPrefs({ ...prefs, zones: v })}
              placeholder="e.g. Downtown, Midtown, Airport"
              placeholderTextColor="#94a3b8"
              multiline
            />
          </View>
        </View>

        {/* Language */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>
          <View style={styles.card}>
            {([['en', '🇺🇸 English'], ['es', '🇪🇸 Español'], ['pt', '🇧🇷 Português']] as const).map(([code, label]) => (
              <TouchableOpacity
                key={code}
                style={[styles.optionRow, prefs.language === code && styles.optionSelected]}
                onPress={() => setPrefs({ ...prefs, language: code })}
              >
                <Text style={styles.optionText}>{label}</Text>
                {prefs.language === code && <Text style={{ color: '#2563eb' }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Settings</Text>}
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, gap: 8 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, paddingLeft: 4 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  avatarText: { fontSize: 20, fontWeight: '700', color: '#1d4ed8' },
  name: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  email: { fontSize: 13, color: '#64748b', marginTop: 2 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderRadius: 12 },
  optionSelected: { backgroundColor: '#eff6ff' },
  optionText: { fontSize: 14, color: '#0f172a' },
  label: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#0f172a', marginTop: 4 },
  saveBtn: { backgroundColor: '#2563eb', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  logoutBtn: { borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#fee2e2', marginTop: 4, marginBottom: 32 },
  logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
});
