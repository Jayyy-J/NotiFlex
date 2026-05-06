import * as admin from 'firebase-admin';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const messaging = admin.messaging();

export const notificationService = {
  /**
   * Find all users whose preferences match this delivery
   * and send them a push notification
   */
  async sendToMatchingUsers(deliveryId: string): Promise<number> {
    // Get the delivery
    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .select('*')
      .eq('id', deliveryId)
      .eq('status', 'available')
      .single();

    if (deliveryError || !delivery) {
      logger.warn(`Delivery ${deliveryId} not found or not available`);
      return 0;
    }

    // Find matching users
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('user_id, fcm_token, platforms, min_price, max_price, zones, work_hours_start, work_hours_end, notification_channels')
      .not('fcm_token', 'is', null)
      .lte('min_price', delivery.price)
      .gte('max_price', delivery.price)
      .lte('work_hours_start', currentTime)
      .gte('work_hours_end', currentTime);

    if (!prefs?.length) return 0;

    // Filter by platform and zone
    const matched = prefs.filter(p => {
      const platformMatch = p.platforms === 'both' || p.platforms === delivery.platform;
      const zoneMatch = !p.zones?.length || p.zones.includes(delivery.delivery_zone);
      const pushEnabled = p.notification_channels?.includes('push');
      return platformMatch && zoneMatch && pushEnabled;
    });

    if (!matched.length) return 0;

    // Check active subscriptions
    const userIds = matched.map(p => p.user_id);
    const { data: activeSubs } = await supabase
      .from('subscriptions')
      .select('user_id')
      .in('user_id', userIds)
      .in('status', ['active', 'trial']);

    const activeUserIds = new Set(activeSubs?.map(s => s.user_id) ?? []);
    const eligible = matched.filter(p => activeUserIds.has(p.user_id));

    if (!eligible.length) return 0;

    // Send FCM notifications in batches of 500
    const tokens = eligible.map(p => p.fcm_token!).filter(Boolean);
    const platformEmoji = delivery.platform === 'amazon_flex' ? '📦' : '🍕';
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: `${platformEmoji} New ${delivery.platform === 'amazon_flex' ? 'Amazon Flex' : 'DoorDash'} block available!`,
        body: `$${delivery.price} • ${delivery.delivery_zone} • ~${delivery.estimated_duration_min ?? '?'} min`,
      },
      data: {
        delivery_id: delivery.id,
        platform: delivery.platform,
        price: delivery.price.toString(),
        zone: delivery.delivery_zone,
        type: 'new_delivery',
      },
      android: { priority: 'high', notification: { channelId: 'deliveries', sound: 'default' } },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    };

    let sent = 0;
    for (let i = 0; i < tokens.length; i += 500) {
      const batch = { ...message, tokens: tokens.slice(i, i + 500) };
      try {
        const response = await messaging.sendEachForMulticast(batch);
        sent += response.successCount;

        // Remove invalid tokens
        const failedIndices = response.responses
          .map((r, idx) => (!r.success ? idx : -1))
          .filter(idx => idx !== -1);

        if (failedIndices.length > 0) {
          const invalidTokens = failedIndices.map(idx => batch.tokens[idx]);
          await supabase
            .from('user_preferences')
            .update({ fcm_token: null })
            .in('fcm_token', invalidTokens);
        }
      } catch (err: any) {
        logger.error('FCM batch send error', { error: err.message });
      }
    }

    // Record notifications in DB
    const notificationRecords = eligible
      .slice(0, sent)
      .map(p => ({
        user_id: p.user_id,
        delivery_id: delivery.id,
        channel: 'push' as const,
      }));

    if (notificationRecords.length > 0) {
      await supabase.from('notifications').upsert(notificationRecords, {
        onConflict: 'user_id,delivery_id',
        ignoreDuplicates: true,
      });
    }

    logger.info(`Sent ${sent} notifications for delivery ${deliveryId}`);
    return sent;
  },
};
