'use client';

import { useEffect } from 'react';
import { notificationScheduler } from '@/lib/notification-scheduler';
import { useSession } from 'next-auth/react';

export function NotificationInitializer() {
  const { data: session } = useSession();

  useEffect(() => {
    // Only initialize notifications for authenticated users
    if (!session?.user?.id) {
      return;
    }

    // Start the notification scheduler
    notificationScheduler.start();

    // Cleanup on unmount
    return () => {
      notificationScheduler.stop();
    };
  }, [session?.user?.id]);

  return null; // This component doesn't render anything
}