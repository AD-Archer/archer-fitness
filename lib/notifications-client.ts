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

export class NotificationManager {
  private static instance: NotificationManager;
  private swRegistration: ServiceWorkerRegistration | null = null;

  private constructor() {}

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  // Check if notifications are supported
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Notifications are not supported in this browser');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) {
      return 'denied';
    }
    return Notification.permission;
  }

  // Register service worker
  async registerServiceWorker(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Service workers are not supported');
    }

    try {
      this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
    } catch (error) {
      throw error;
    }
  }

  // Subscribe to push notifications
  async subscribeToPush(): Promise<PushSubscriptionData | null> {
    if (!this.swRegistration) {
      throw new Error('Service worker not registered');
    }

    try {
      // Get VAPID public key from environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey || vapidPublicKey === 'BDefaultPublicKeyForDevelopment') {
        throw new Error('VAPID keys not configured. Please generate and set NEXT_PUBLIC_VAPID_PUBLIC_KEY in your environment variables.');
      }

      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey) as BufferSource
      });

      return {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPush(): Promise<void> {
    if (!this.swRegistration) {
      return;
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
    } catch (error) {
      throw error;
    }
  }

  // Get current subscription
  async getCurrentSubscription(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      return null;
    }

    try {
      return await this.swRegistration.pushManager.getSubscription();
    } catch {
      return null;
    }
  }

  // Send test notification (for development)
  async sendTestNotification(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Notifications are not supported in this browser');
    }

    // Check permission first
    const currentPermission = this.getPermissionStatus();
    if (currentPermission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    if (!this.swRegistration) {
      throw new Error('Service worker not registered');
    }

    // Use service worker to show notification instead of creating directly
    const notificationPayload = {
      title: 'Test Notification',
      body: 'This is a test push notification from Archer Fitness!',
      icon: '/logo.webp',
      badge: '/logo.webp',
      url: '/',
      type: 'general'
    };

    // Send message to service worker to show notification
    await this.swRegistration.active?.postMessage({
      type: 'SHOW_NOTIFICATION',
      payload: notificationPayload
    });
  }

  // Schedule a local notification (for immediate notifications)
  scheduleLocalNotification(payload: NotificationPayload, delay: number = 0): void {
    if (this.getPermissionStatus() !== 'granted') {
      return;
    }

    setTimeout(() => {
      const notification = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/logo.webp',
        badge: '/logo.webp',
        tag: `fitness-${payload.type || 'general'}`,
        requireInteraction: true
      });

      notification.onclick = () => {
        if (payload.url) {
          window.open(payload.url, '_blank');
        } else {
          window.focus();
        }
        notification.close();
      };
    }, delay);
  }

  // Utility function to convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Export singleton instance
export const notificationManager = NotificationManager.getInstance();

// Utility functions for different types of notifications
export const NotificationTemplates = {
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