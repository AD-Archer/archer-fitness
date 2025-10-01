import { notificationManager } from '@/lib/notifications-client';
import { prisma } from '@/lib/prisma';

export interface ScheduledNotification {
  id: string;
  type: 'workout' | 'weight' | 'streak' | 'weigh-in' | 'meal' | 'sleep' | 'exercise';
  title: string;
  body: string;
  scheduledTime: Date;
  userId: string; // Add user ID to support per-user preferences
  userEmail?: string; // Add user email for email notifications
  userPrefs?: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    weighInFrequency?: 1 | 2 | 3;
    mealFrequency?: 1 | 3;
    weighInNotifications?: boolean;
    mealNotifications?: boolean;
    sleepNotifications?: boolean;
    exerciseNotifications?: boolean;
    workoutTime?: string;
  };
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
      // Get user preferences if not provided
      let userPrefs = notification.userPrefs;
      if (!userPrefs && notification.userId) {
        try {
          const userPrefsData = await this.getUserNotificationPrefs(notification.userId);
          userPrefs = userPrefsData;
        } catch {
          // Use defaults if can't fetch
          userPrefs = {
            emailNotifications: true,
            pushNotifications: true,
            weighInFrequency: 1,
            mealFrequency: 3,
            weighInNotifications: true,
            mealNotifications: true,
            sleepNotifications: true,
            exerciseNotifications: true,
            workoutTime: "18:00"
          };
        }
      }

      // Check user preferences for notification types
      const emailEnabled = userPrefs?.emailNotifications ?? true;
      const pushEnabled = userPrefs?.pushNotifications ?? true;

      // Try push notification first (if supported, enabled, and user has push notifications enabled)
      if (pushEnabled && notificationManager.isSupported() && notificationManager.getPermissionStatus() === 'granted') {
        const payload = {
          title: notification.title,
          body: notification.body,
          type: notification.type,
          url: this.getNotificationUrl(notification),
          actions: this.getNotificationActions(notification)
        };

        notificationManager.scheduleLocalNotification(payload);
      }

      // Also try email notification if email is available and enabled
      if (emailEnabled && notification.userEmail) {
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
              userPrefs: userPrefs, // Pass full preferences
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
      case 'exercise':
        return '/track';
      case 'weight':
      case 'weigh-in':
      case 'sleep':
        return '/progress';
      case 'meal':
        return '/dashboard';
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
      case 'exercise':
        return [
          { action: 'track', title: 'Start Workout' },
          { action: 'dismiss', title: 'Later' }
        ];
      case 'weight':
      case 'weigh-in':
        return [
          { action: 'log', title: 'Log Weight' },
          { action: 'dismiss', title: 'Later' }
        ];
      case 'meal':
        return [
          { action: 'log', title: 'Log Meal' },
          { action: 'dismiss', title: 'Later' }
        ];
      case 'sleep':
        return [
          { action: 'log', title: 'Log Sleep' },
          { action: 'dismiss', title: 'Later' }
        ];
      case 'streak':
        return [
          { action: 'view', title: 'View Progress' },
          { action: 'dismiss', title: 'Later' }
        ];
      default:
        return [{ action: 'dismiss', title: 'Dismiss' }];
    }
  }

  // Get user notification preferences from database
  private async getUserNotificationPrefs(userId: string): Promise<ScheduledNotification['userPrefs']> {
    try {
      const userPrefs = await prisma.userPreference.findUnique({
        where: { userId },
        select: { app: true }
      });

      if (userPrefs?.app && typeof userPrefs.app === 'object') {
        const appPrefs = userPrefs.app as any;
        const notificationPrefs = appPrefs.notificationPrefs || {};

        return {
          emailNotifications: notificationPrefs.emailNotifications ?? true,
          pushNotifications: notificationPrefs.pushNotifications ?? true,
          weighInFrequency: notificationPrefs.weighInFrequency ?? 1,
          mealFrequency: notificationPrefs.mealFrequency ?? 3,
          weighInNotifications: notificationPrefs.weighInNotifications ?? true,
          mealNotifications: notificationPrefs.mealNotifications ?? true,
          sleepNotifications: notificationPrefs.sleepNotifications ?? true,
          exerciseNotifications: notificationPrefs.exerciseNotifications ?? true,
          workoutTime: notificationPrefs.workoutTime ?? "18:00"
        };
      }
    } catch {
      // Return defaults on error
    }

    return {
      emailNotifications: true,
      pushNotifications: true,
      weighInFrequency: 1,
      mealFrequency: 3,
      weighInNotifications: true,
      mealNotifications: true,
      sleepNotifications: true,
      exerciseNotifications: true,
      workoutTime: "18:00"
    };
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
  recurring: boolean = false,
  userPrefs?: { emailNotifications: boolean; pushNotifications: boolean; workoutTime?: string }
): string => {
  const scheduledDate = new Date(scheduledTime);

  // If user has a preferred workout time and this is a recurring reminder, use their preferred time
  if (recurring && userPrefs?.workoutTime) {
    const [hours, minutes] = userPrefs.workoutTime.split(':').map(Number);
    scheduledDate.setHours(hours, minutes, 0, 0);
  }

  return notificationScheduler.scheduleNotification({
    userId,
    userEmail,
    userPrefs,
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
  recurring: boolean = true,
  userPrefs?: { emailNotifications: boolean; pushNotifications: boolean }
): string => {
  const scheduledDate = new Date();
  scheduledDate.setHours(9, 0, 0, 0); // 9 AM tomorrow
  if (scheduledDate <= new Date()) {
    scheduledDate.setDate(scheduledDate.getDate() + 1);
  }

  return notificationScheduler.scheduleNotification({
    userId,
    userEmail,
    userPrefs,
    type: 'weight',
    title: '⚖️ Weight Check-in',
    body: 'Time to log your weight and track your progress!',
    scheduledTime: scheduledDate,
    recurring: recurring ? { frequency: 'daily', interval: 1 } : undefined
  });
};

export const scheduleStreakReminder = (
  userId: string,
  userEmail: string,
  streakCount: number,
  userPrefs?: { emailNotifications: boolean; pushNotifications: boolean }
): string => {
  const scheduledDate = new Date();
  scheduledDate.setHours(8, 0, 0, 0); // 8 AM today
  if (scheduledDate <= new Date()) {
    scheduledDate.setDate(scheduledDate.getDate() + 1);
  }

  return notificationScheduler.scheduleNotification({
    userId,
    userEmail,
    userPrefs,
    type: 'streak',
    title: '🔥 Keep Your Streak Going!',
    body: `You're on a ${streakCount}-day streak! Don't break it today.`,
    scheduledTime: scheduledDate,
    recurring: { frequency: 'daily', interval: 1 },
    data: { streakCount }
  });
};

export const scheduleWeighInReminder = async (
  userId: string,
  userEmail: string,
  frequency?: 1 | 2 | 3,
  userPrefs?: { emailNotifications: boolean; pushNotifications: boolean }
): Promise<string[]> => {
  const notifications: string[] = [];

  // Always send at 9 AM, 1 PM, and 6 PM as requested
  const weighInTimes = [9, 13, 18]; // 9 AM, 1 PM, 6 PM

  weighInTimes.forEach((hour, index) => {
    const scheduledDate = new Date();
    scheduledDate.setHours(hour, 0, 0, 0);
    if (scheduledDate <= new Date()) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    const id = notificationScheduler.scheduleNotification({
      userId,
      userEmail,
      userPrefs,
      type: 'weigh-in',
      title: '⚖️ Weigh-in Time!',
      body: 'Time to log your weight and track your progress!',
      scheduledTime: scheduledDate,
      recurring: { frequency: 'daily', interval: 1 },
      data: { frequency: 3, index }
    });
    notifications.push(id);
  });

  return notifications;
};

export const scheduleMealReminder = async (
  userId: string,
  userEmail: string,
  frequency?: 1 | 3,
  userPrefs?: { emailNotifications: boolean; pushNotifications: boolean }
): Promise<string[]> => {
  const notifications: string[] = [];

  // Always send at 9 AM, 1 PM, and 6 PM as requested
  const mealTimes = [
    { time: 9, name: 'breakfast' },
    { time: 13, name: 'lunch' },
    { time: 18, name: 'dinner' }
  ];

  mealTimes.forEach((meal, index) => {
    const scheduledDate = new Date();
    scheduledDate.setHours(meal.time, 0, 0, 0);
    if (scheduledDate <= new Date()) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    const id = notificationScheduler.scheduleNotification({
      userId,
      userEmail,
      userPrefs,
      type: 'meal',
      title: '🍽️ Meal Time!',
      body: `Time to log your ${meal.name}!`,
      scheduledTime: scheduledDate,
      recurring: { frequency: 'daily', interval: 1 },
      data: { frequency: 3, mealType: meal.name, index }
    });
    notifications.push(id);
  });

  return notifications;
};

export const scheduleSleepReminder = (
  userId: string,
  userEmail: string,
  userPrefs?: { emailNotifications: boolean; pushNotifications: boolean }
): string => {
  const scheduledDate = new Date();
  scheduledDate.setHours(8, 0, 0, 0); // 8 AM - morning reminder
  if (scheduledDate <= new Date()) {
    scheduledDate.setDate(scheduledDate.getDate() + 1);
  }

  return notificationScheduler.scheduleNotification({
    userId,
    userEmail,
    userPrefs,
    type: 'sleep',
    title: '😴 Sleep Check-in',
    body: 'How did you sleep last night? Log your sleep data!',
    scheduledTime: scheduledDate,
    recurring: { frequency: 'daily', interval: 1 },
    data: {}
  });
};

export const scheduleExerciseReminder = (
  userId: string,
  userEmail: string,
  workoutName: string,
  scheduledTime: string,
  userPrefs?: { emailNotifications: boolean; pushNotifications: boolean }
): string => {
  const scheduledDate = new Date(scheduledTime);

  return notificationScheduler.scheduleNotification({
    userId,
    userEmail,
    userPrefs,
    type: 'exercise',
    title: '💪 Exercise Time!',
    body: `Ready for your ${workoutName} workout?`,
    scheduledTime: scheduledDate,
    // No recurring - only triggers once for scheduled workouts
    data: { workoutName, scheduledTime }
  });
};