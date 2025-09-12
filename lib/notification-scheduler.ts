import { notificationManager } from '@/lib/notifications-client';

export interface ScheduledNotification {
  id: string;
  type: 'workout' | 'weight' | 'nutrition' | 'streak';
  title: string;
  body: string;
  scheduledTime: Date;
  userId: string; // Add user ID to support per-user preferences
  userEmail?: string; // Add user email for email notifications
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number; // every X days/weeks/months
  };
  data?: any;
}

export class NotificationScheduler {
  private static instance: NotificationScheduler;
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();
  private intervalId: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler();
    }
    return NotificationScheduler.instance;
  }

  // Start the notification scheduler
  start(): void {
    if (this.intervalId) {
      return; // Already running
    }

    // Check for due notifications every minute
    this.intervalId = setInterval(() => {
      this.checkDueNotifications();
    }, 60000);
  }

  // Stop the notification scheduler
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Schedule a notification
  scheduleNotification(notification: Omit<ScheduledNotification, 'id'>): string {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const scheduledNotification: ScheduledNotification = {
      id,
      ...notification
    };

    this.scheduledNotifications.set(id, scheduledNotification);

    // If it's due immediately or very soon, schedule it
    const timeUntilDue = notification.scheduledTime.getTime() - Date.now();
    if (timeUntilDue <= 0) {
      this.sendNotification(scheduledNotification);
    } else if (timeUntilDue <= 60000) { // Within next minute
      setTimeout(() => {
        this.sendNotification(scheduledNotification);
      }, timeUntilDue);
    }

    return id;
  }

  // Cancel a scheduled notification
  cancelNotification(id: string): boolean {
    const removed = this.scheduledNotifications.delete(id);
    return removed;
  }

  // Get all scheduled notifications
  getScheduledNotifications(): ScheduledNotification[] {
    return Array.from(this.scheduledNotifications.values());
  }

  // Check for due notifications
  private checkDueNotifications(): void {
    const now = new Date();
    const dueNotifications: ScheduledNotification[] = [];

    for (const [, notification] of this.scheduledNotifications) {
      if (notification.scheduledTime <= now) {
        dueNotifications.push(notification);
      }
    }

    // Send due notifications
    dueNotifications.forEach(notification => {
      this.sendNotification(notification);

      // Handle recurring notifications
      if (notification.recurring) {
        this.rescheduleRecurring(notification);
      } else {
        // Remove one-time notifications
        this.scheduledNotifications.delete(notification.id);
      }
    });
  }

  // Send a notification
  private async sendNotification(notification: ScheduledNotification): Promise<void> {
    try {
      // Try push notification first (if supported and user has push notifications enabled)
      if (notificationManager.isSupported() && notificationManager.getPermissionStatus() === 'granted') {
        const payload = {
          title: notification.title,
          body: notification.body,
          type: notification.type,
          url: this.getNotificationUrl(notification),
          actions: this.getNotificationActions(notification)
        };

        notificationManager.scheduleLocalNotification(payload);
      }

      // Also try email notification if email is available
      if (notification.userEmail) {
        try {
          const response = await fetch('/api/notifications/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: notification.type,
              email: notification.userEmail,
              data: notification.data,
              userId: notification.userId, // Include userId for preference checking
            }),
          });

          if (response.ok) {
            await response.json();
          } else {
            // Email notification failed
          }
        } catch {
          // Error sending email notification
        }
      }
    } catch {
      // Failed to send notification
    }
  }

  // Reschedule recurring notifications
  private rescheduleRecurring(notification: ScheduledNotification): void {
    if (!notification.recurring) return;

    const { frequency, interval } = notification.recurring;
    const nextTime = new Date(notification.scheduledTime);

    switch (frequency) {
      case 'daily':
        nextTime.setDate(nextTime.getDate() + interval);
        break;
      case 'weekly':
        nextTime.setDate(nextTime.getDate() + (interval * 7));
        break;
      case 'monthly':
        nextTime.setMonth(nextTime.getMonth() + interval);
        break;
    }

    // Update the scheduled time
    notification.scheduledTime = nextTime;
  }

  // Get URL for notification based on type
  private getNotificationUrl(notification: ScheduledNotification): string {
    switch (notification.type) {
      case 'workout':
        return '/track';
      case 'weight':
        return '/progress';
      case 'nutrition':
        return '/nutrition';
      case 'streak':
        return '/dashboard';
      default:
        return '/';
    }
  }

  // Get actions for notification based on type
  private getNotificationActions(notification: ScheduledNotification): any[] {
    switch (notification.type) {
      case 'workout':
        return [
          { action: 'start', title: 'Start Workout' },
          { action: 'snooze', title: 'Remind Later' }
        ];
      case 'weight':
        return [
          { action: 'log', title: 'Log Weight' },
          { action: 'dismiss', title: 'Later' }
        ];
      case 'nutrition':
        return [
          { action: 'log', title: 'Log Meal' },
          { action: 'dismiss', title: 'Later' }
        ];
      default:
        return [];
    }
  }
}

// Export singleton instance
export const notificationScheduler = NotificationScheduler.getInstance();

// Convenience functions for common notifications
export const scheduleWorkoutReminder = (
  userId: string,
  userEmail: string,
  workoutName: string,
  scheduledTime: string,
  recurring: boolean = false
): string => {
  const scheduledDate = new Date(scheduledTime);

  return notificationScheduler.scheduleNotification({
    userId,
    userEmail,
    type: 'workout',
    title: '🏋️ Workout Time!',
    body: `It's time for your ${workoutName} workout`,
    scheduledTime: scheduledDate,
    recurring: recurring ? { frequency: 'daily', interval: 1 } : undefined,
    data: { workoutName, scheduledTime }
  });
};

export const scheduleWeightReminder = (
  userId: string,
  userEmail: string,
  recurring: boolean = true
): string => {
  const scheduledDate = new Date();
  scheduledDate.setHours(9, 0, 0, 0); // 9 AM tomorrow
  if (scheduledDate <= new Date()) {
    scheduledDate.setDate(scheduledDate.getDate() + 1);
  }

  return notificationScheduler.scheduleNotification({
    userId,
    userEmail,
    type: 'weight',
    title: '⚖️ Weight Check-in',
    body: 'Time to log your weight and track your progress!',
    scheduledTime: scheduledDate,
    recurring: recurring ? { frequency: 'daily', interval: 1 } : undefined
  });
};

export const scheduleNutritionReminder = (
  userId: string,
  userEmail: string,
  mealType: string,
  scheduledTime: string,
  recurring: boolean = true
): string => {
  const scheduledDate = new Date(scheduledTime);

  return notificationScheduler.scheduleNotification({
    userId,
    userEmail,
    type: 'nutrition',
    title: '🍎 Nutrition Time',
    body: `Don't forget to log your ${mealType} meal!`,
    scheduledTime: scheduledDate,
    recurring: recurring ? { frequency: 'daily', interval: 1 } : undefined,
    data: { mealType, scheduledTime }
  });
};

export const scheduleStreakReminder = (
  userId: string,
  userEmail: string,
  streakCount: number
): string => {
  const scheduledDate = new Date();
  scheduledDate.setHours(8, 0, 0, 0); // 8 AM today
  if (scheduledDate <= new Date()) {
    scheduledDate.setDate(scheduledDate.getDate() + 1);
  }

  return notificationScheduler.scheduleNotification({
    userId,
    userEmail,
    type: 'streak',
    title: '🔥 Keep Your Streak Going!',
    body: `You're on a ${streakCount}-day streak! Don't break it today.`,
    scheduledTime: scheduledDate,
    recurring: { frequency: 'daily', interval: 1 },
    data: { streakCount }
  });
};