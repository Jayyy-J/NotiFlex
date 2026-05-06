import React from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore, supabase } from '../../hooks/useAuth';

export function NotificationsScreen() {
  const { user } = useAuthStore();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['mobile-notifications', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*, deliveries(*)')
        .eq('user_id', user!.id)
        .order('sent_at', { ascending: false })
        .limit(50);
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const renderItem = ({ item }: any) => {
    const d = item.deliveries;
    if (!d) return null;
    return (
      <View style={[styles.card, item.read_at ? styles.cardRead : styles.cardUnread]}>
        <View style={[styles.icon, { backgroundColor: d.platform === 'amazon_flex' ? '#fff7ed' : '#fff1f2' }]}>
          <Text style={{ fontSize: 20 }}>{d.platform === 'amazon_flex' ? '📦' : '🍕'}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>{d.title}</Text>
          <Text style={styles.sub}>${d.price} • {d.delivery_zone}</Text>
          <Text style={styles.time}>{new Date(item.sent_at).toLocaleString()}</Text>
        </View>
        {!item.read_at && <View style={styles.dot} />}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Text style={styles.count}>{notifications.filter((n: any) => !n.read_at).length} unread</Text>
      </View>

      {notifications.length === 0 && !isLoading ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48 }}>🔔</Text>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyText}>Alerts will appear here as blocks come in.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  count: { fontSize: 13, color: '#2563eb', fontWeight: '600' },
  list: { padding: 16, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, padding: 14, gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  cardRead: { opacity: 0.6 },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: '#2563eb' },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  sub: { fontSize: 12, color: '#16a34a', fontWeight: '600', marginTop: 2 },
  time: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563eb' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center' },
});
