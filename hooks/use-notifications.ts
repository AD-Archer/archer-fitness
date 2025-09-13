import { useEffect, useState } from 'react';
import { notificationManager } from '@/lib/notifications-client';
import { toast } from 'sonner';
import { logger } from "@/lib/logger"

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
          // Register service worker regardless of permission status
          try {
            await notificationManager.registerServiceWorker();
          } catch (swError) {
            logger.warn('Failed to register service worker:', swError);
          }

          const currentPermission = notificationManager.getPermissionStatus();
          setPermission(currentPermission);

          // Check if already subscribed
          const subscription = await notificationManager.getCurrentSubscription();
          setIsSubscribed(!!subscription);
        }
      } catch (error) {
        logger.error('Failed to initialize notifications:', error);
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
          // Service worker should already be registered from init
          // Just subscribe to push notifications
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
                logger.warn('Failed to save subscription to server, but local notifications will work');
                // Still mark as subscribed for local notifications
                setIsSubscribed(true);
                toast.success('Notifications enabled! (Server sync may not be available)');
                return true;
              }
            } catch (serverError) {
              logger.warn('Server communication failed, but local notifications will work:', serverError);
              // Still mark as subscribed for local notifications
              setIsSubscribed(true);
              toast.success('Notifications enabled! (Server sync may not be available)');
              return true;
            }
          } else {
            throw new Error('Failed to create push subscription');
          }
        } catch (subscriptionError) {
          logger.error('Subscription failed:', subscriptionError);
          // Check if VAPID keys are configured
          const errorMessage = subscriptionError instanceof Error ? subscriptionError.message : String(subscriptionError);
          if (errorMessage.includes('VAPID') || errorMessage.includes('applicationServerKey')) {
            toast.error('Notifications not configured. Please check VAPID keys in environment variables.');
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
      logger.error('Failed to enable notifications:', error);
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
          logger.warn('Failed to remove subscription from server');
        }
      }

      setIsSubscribed(false);
      toast.success('Notifications disabled');
      return true;
    } catch (error) {
      logger.error('Failed to disable notifications:', error);
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
    if (!isSupported) {
      toast.error('Notifications are not supported in this browser');
      return;
    }

    if (permission !== 'granted') {
      toast.error('Please enable notifications first by toggling the switch above');
      return;
    }

    try {
      // Ensure service worker is registered before sending test
      if (!isSubscribed) {
        await notificationManager.registerServiceWorker();
        const subscriptionData = await notificationManager.subscribeToPush();
        if (subscriptionData) {
          setIsSubscribed(true);
        }
      }

      await notificationManager.sendTestNotification();
      toast.success('Test notification sent!');
    } catch (error) {
      logger.error('Failed to send test notification:', error);
      toast.error('Failed to send test notification. Please try enabling notifications first.');
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