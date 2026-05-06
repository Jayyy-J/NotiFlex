import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import axios from 'axios';
import Constants from 'expo-constants';
import { useAuthStore } from '../../hooks/useAuth';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001';

export function RegisterScreen({ navigation }: any) {
  const { login } = useAuthStore();
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!form.full_name || !form.email || !form.password) {
      return Alert.alert('Error', 'Please fill all fields');
    }
    if (form.password.length < 8) return Alert.alert('Error', 'Password must be at least 8 characters');

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/register`, form);
      await login(form.email, form.password);
    } catch (err: any) {
      Alert.alert('Registration failed', err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}><Text style={{ fontSize: 28 }}>🔔</Text></View>
          <Text style={styles.logoText}>FlexNotify</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>✨ 7-day free trial</Text></View>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>No credit card required</Text>

          {[
            { key: 'full_name', label: 'Full Name', placeholder: 'Your name', type: 'default' },
            { key: 'email', label: 'Email', placeholder: 'you@example.com', type: 'email-address' },
            { key: 'password', label: 'Password', placeholder: 'Min. 8 characters', type: 'default', secure: true },
          ].map(({ key, label, placeholder, type, secure }) => (
            <View key={key} style={styles.field}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                value={form[key as keyof typeof form]}
                onChangeText={(v) => setForm(f => ({ ...f, [key]: v }))}
                keyboardType={type as any}
                autoCapitalize={key === 'email' ? 'none' : 'words'}
                secureTextEntry={secure}
                placeholder={placeholder}
                placeholderTextColor="#94a3b8"
              />
            </View>
          ))}

          <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Start Free Trial</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Sign in</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  badge: { marginTop: 8, backgroundColor: '#dcfce7', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { color: '#16a34a', fontSize: 12, fontWeight: '600' },
  form: { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748b', marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14, padding: 14, fontSize: 15, color: '#0f172a', backgroundColor: '#f8fafc' },
  btn: { backgroundColor: '#2563eb', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  link: { alignItems: 'center', marginTop: 16 },
  linkText: { fontSize: 13, color: '#64748b' },
  linkBold: { color: '#2563eb', fontWeight: '600' },
});
