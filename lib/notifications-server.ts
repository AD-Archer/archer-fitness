import webpush from 'web-push';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  url?: string;
  type?: 'workout' | 'weight' | 'nutrition' | 'streak' | 'general';
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// VAPID keys for push notifications (in production, these should be environment variables)
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BDefaultPublicKeyForDevelopment',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'DefaultPrivateKeyForDevelopment'
};

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL || 'admin@archer-fitness.com'}`,
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Server-side function to send push notifications
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: NotificationPayload
): Promise<void> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/logo.webp',
        image: payload.image,
        url: payload.url || '/',
        type: payload.type || 'general',
        actions: payload.actions || []
      })
    );

    console.log('Push notification sent successfully');
  } catch (error) {
    console.error('Failed to send push notification:', error);
    throw error;
  }
}

// Utility functions for different types of notifications
export const ServerNotificationTemplates = {
  workoutReminder: (workoutName: string, scheduledTime: string): NotificationPayload => ({
    title: '🏋️ Workout Time!',
    body: `It's time for your ${workoutName} workout scheduled for ${scheduledTime}`,
    url: '/track',
    type: 'workout',
    actions: [
      { action: 'start', title: 'Start Workout' },
      { action: 'snooze', title: 'Remind Later' }
    ]
  }),

  weightReminder: (): NotificationPayload => ({
    title: '⚖️ Weight Check-in',
    body: 'Time to log your weight and track your progress!',
    url: '/progress',
    type: 'weight'
  }),

  nutritionReminder: (mealType: string): NotificationPayload => ({
    title: '🍎 Nutrition Time',
    body: `Don't forget to log your ${mealType} meal!`,
    url: '/nutrition',
    type: 'nutrition'
  }),

  streakReminder: (streakCount: number): NotificationPayload => ({
    title: '🔥 Keep Your Streak Going!',
    body: `You're on a ${streakCount}-day streak! Don't break it today.`,
    url: '/dashboard',
    type: 'general'
  })
};