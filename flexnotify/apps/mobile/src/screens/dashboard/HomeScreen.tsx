import React, { useEffect, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, SafeAreaView, ActivityIndicator
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import axios from 'axios';
import Constants from 'expo-constants';
import { useAuthStore, supabase } from '../../hooks/useAuth';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001';

export function HomeScreen() {
  const { user, accessToken } = useAuthStore();
  const notificationListener = useRef<any>(null);

  // Register for push notifications
  useEffect(() => {
    registerForPushNotifications();
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });
    return () => Notifications.removeNotificationSubscription(notificationListener.current);
  }, []);

  const registerForPushNotifications = async () => {
    if (!Device.isDevice) return;
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    if (token && accessToken) {
      await axios.post(
        `${API_URL}/api/notifications/fcm-token`,
        { token },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    }
  };

  // Live deliveries
  const { data: deliveries = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['mobile-deliveries'],
    queryFn: async () => {
      const { data } = await supabase
        .from('deliveries')
        .select('*')
        .eq('status', 'available')
        .order('available_at', { ascending: false })
        .limit(30);
      return data ?? [];
    },
    refetchInterval: 15_000,
  });

  const sub = (user as any)?.subscriptions;
  const isTrialExpired = sub?.status === 'expired';

  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.85}>
      <View style={[styles.platformBadge, { backgroundColor: item.platform === 'amazon_flex' ? '#fff7ed' : '#fff1f2' }]}>
        <Text style={{ fontSize: 22 }}>{item.platform === 'amazon_flex' ? '📦' : '🍕'}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardSub}>{item.delivery_zone} • ~{item.estimated_duration_min ?? '?'} min</Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.price}>${item.price}</Text>
        <Text style={styles.timeAgo}>{formatTime(item.available_at)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isTrialExpired) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48 }}>⏰</Text>
          <Text style={styles.emptyTitle}>Trial Expired</Text>
          <Text style={styles.emptyText}>Upgrade to continue receiving block alerts.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Live Blocks</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Real-time monitoring</Text>
          </View>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{deliveries.length}</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" />
      ) : deliveries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48 }}>🔔</Text>
          <Text style={styles.emptyTitle}>No blocks right now</Text>
          <Text style={styles.emptyText}>We'll notify you the moment one appears.</Text>
        </View>
      ) : (
        <FlatList
          data={deliveries}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563eb" />}
        />
      )}
    </SafeAreaView>
  );
}

function formatTime(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  liveText: { fontSize: 12, color: '#22c55e', fontWeight: '600' },
  countBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  countText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  list: { padding: 16, gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, gap: 14 },
  platformBadge: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  cardSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  price: { fontSize: 18, fontWeight: '800', color: '#16a34a' },
  timeAgo: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center' },
});
