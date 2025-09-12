import { useEffect, useState } from 'react';
import { notificationManager, PushSubscriptionData } from '@/lib/notifications-client';
import { toast } from 'sonner';

export function useNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize notification support and status
  useEffect(() => {
    const initNotifications = async () => {
      try {
        const supported = notificationManager.isSupported();
        setIsSupported(supported);

        if (supported) {
          const currentPermission = notificationManager.getPermissionStatus();
          setPermission(currentPermission);

          // Check if already subscribed
          const subscription = await notificationManager.getCurrentSubscription();
          setIsSubscribed(!!subscription);

          // Register service worker if not already done
          if (currentPermission === 'granted') {
            await notificationManager.registerServiceWorker();
          }
        }
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initNotifications();
  }, []);

  // Request notification permission
  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Notifications are not supported in this browser');
      return false;
    }

    try {
      setIsLoading(true);
      const newPermission = await notificationManager.requestPermission();
      setPermission(newPermission);

      if (newPermission === 'granted') {
        try {
          // Register service worker and subscribe
          await notificationManager.registerServiceWorker();
          const subscriptionData = await notificationManager.subscribeToPush();

          if (subscriptionData) {
            try {
              // Save subscription to server (don't fail if this doesn't work)
              const response = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscriptionData),
              });

              if (response.ok) {
                setIsSubscribed(true);
                toast.success('Notifications enabled successfully!');
                return true;
              } else {
                console.warn('Failed to save subscription to server, but local notifications will work');
                // Still mark as subscribed for local notifications
                setIsSubscribed(true);
                toast.success('Notifications enabled! (Server sync may not be available)');
                return true;
              }
            } catch (serverError) {
              console.warn('Server communication failed, but local notifications will work:', serverError);
              // Still mark as subscribed for local notifications
              setIsSubscribed(true);
              toast.success('Notifications enabled! (Server sync may not be available)');
              return true;
            }
          } else {
            throw new Error('Failed to create push subscription');
          }
        } catch (subscriptionError) {
          console.error('Subscription failed:', subscriptionError);
          // Check if VAPID keys are configured
          const errorMessage = subscriptionError instanceof Error ? subscriptionError.message : String(subscriptionError);
          if (errorMessage.includes('VAPID') || errorMessage.includes('applicationServerKey')) {
            toast.error('Notifications not configured. Please set up VAPID keys.');
          } else {
            toast.error('Failed to set up push notifications. Local notifications only.');
          }
          // Still allow basic notifications
          setIsSubscribed(true);
          return true;
        }
      } else {
        toast.error('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      toast.error('Failed to enable notifications. You can still use the app normally.');
      return false;
    } finally {
      setIsLoading(false);
    }

    return false;
  };

  // Disable notifications
  const disableNotifications = async (): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Unsubscribe from push notifications
      await notificationManager.unsubscribeFromPush();

      // Remove subscription from server
      const subscription = await notificationManager.getCurrentSubscription();
      if (subscription) {
        const response = await fetch(`/api/notifications/unsubscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          console.warn('Failed to remove subscription from server');
        }
      }

      setIsSubscribed(false);
      toast.success('Notifications disabled');
      return true;
    } catch (error) {
      console.error('Failed to disable notifications:', error);
      toast.error('Failed to disable notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle notifications on/off
  const toggleNotifications = async (enabled: boolean): Promise<boolean> => {
    if (enabled) {
      return await requestPermission();
    } else {
      return await disableNotifications();
    }
  };

  // Send test notification
  const sendTestNotification = async () => {
    if (!isSupported || permission !== 'granted') {
      toast.error('Notifications are not enabled');
      return;
    }

    try {
      await notificationManager.sendTestNotification();
      toast.success('Test notification sent!');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast.error('Failed to send test notification. Check browser permissions.');
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    requestPermission,
    disableNotifications,
    toggleNotifications,
    sendTestNotification,
  };
}