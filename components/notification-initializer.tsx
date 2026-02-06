"use client";

import { useEffect } from "react";
import {
  startNotificationScheduler,
  stopNotificationScheduler,
} from "@/lib/notification-scheduler";
import { useSession } from "next-auth/react";

export function NotificationInitializer() {
  const { data: session } = useSession();

  useEffect(() => {
    // Only initialize notifications for authenticated users
    if (!session?.user?.id) {
      return;
    }

    // Start the notification scheduler on server
    startNotificationScheduler();

    // Cleanup on unmount
    return () => {
      stopNotificationScheduler();
    };
  }, [session?.user?.id]);

  return null; // This component doesn't render anything
}
