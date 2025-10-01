import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailNotificationManager } from '@/lib/email-notifications';

export async function POST(request: NextRequest) {
  try {
    const { type, email, data, userId, userPrefs } = await request.json();

    if (!type || !email) {
      return NextResponse.json({ error: 'Type and email are required' }, { status: 400 });
    }

    // Use provided userPrefs or fetch from database
    let preferences = userPrefs;
    if (!preferences && userId) {
      try {
        const userPrefsData = await prisma.userPreference.findUnique({
          where: { userId },
          select: { app: true }
        });

        if (userPrefsData?.app && typeof userPrefsData.app === 'object') {
          const appPrefs = userPrefsData.app as any;
          preferences = appPrefs.notificationPrefs || {};
        }
      } catch {
        // If we can't check preferences, err on the side of caution and don't send
        preferences = { emailNotifications: false };
      }
    }

    // Check if email notifications are enabled
    const emailEnabled = preferences?.emailNotifications ?? true;

    // Check specific notification type preferences
    let shouldSend = emailEnabled;
    if (preferences) {
      switch (type) {
        case 'weigh-in':
          shouldSend = shouldSend && (preferences.weighInNotifications ?? true);
          break;
        case 'meal':
          shouldSend = shouldSend && (preferences.mealNotifications ?? true);
          break;
        case 'sleep':
          shouldSend = shouldSend && (preferences.sleepNotifications ?? true);
          break;
        case 'exercise':
          shouldSend = shouldSend && (preferences.exerciseNotifications ?? true);
          break;
        // Add other types as needed
      }
    }

    let success = false;
    if (shouldSend) {
      switch (type) {
        case 'workout':
          if (data?.workoutName && data?.scheduledTime) {
            success = await emailNotificationManager.sendWorkoutReminder(
              email,
              data.workoutName,
              data.scheduledTime
            );
          }
          break;

        case 'weight':
          success = await emailNotificationManager.sendWeightReminder(email);
          break;

        case 'weigh-in':
          success = await emailNotificationManager.sendWeighInReminder(email);
          break;

        case 'meal':
          if (data?.mealType) {
            success = await emailNotificationManager.sendMealReminder(
              email,
              data.mealType
            );
          } else {
            success = await emailNotificationManager.sendMealReminder(email);
          }
          break;

        case 'sleep':
          success = await emailNotificationManager.sendSleepReminder(email);
          break;

        case 'exercise':
          if (data?.workoutName) {
            success = await emailNotificationManager.sendExerciseReminder(
              email,
              data.workoutName
            );
          }
          break;
      }
    }

    return NextResponse.json({
      success,
      message: success ? 'Email notification sent' : shouldSend ? 'Failed to send email notification' : 'Notifications disabled by user preference'
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}