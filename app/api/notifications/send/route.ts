import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailNotificationManager } from '@/lib/email-notifications';

export async function POST(request: NextRequest) {
  try {
    const { type, email, data, userId } = await request.json();

    if (!type || !email) {
      return NextResponse.json({ error: 'Type and email are required' }, { status: 400 });
    }

    // Check if user has opted out of data sharing
    let canSendNotification = true;

    if (userId) {
      try {
        const userPrefs = await prisma.userPreference.findUnique({
          where: { userId },
          select: { app: true }
        });

        if (userPrefs?.app && typeof userPrefs.app === 'object') {
          const appPrefs = userPrefs.app as any;
          // If user has explicitly opted out of data sharing, don't send notification
          if (appPrefs.dataSharing === false) {
            canSendNotification = false;
          }
        }
      } catch {
        // If we can't check preferences, err on the side of caution and don't send
        canSendNotification = false;
      }
    }

    let success = false;
    if (canSendNotification) {
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

        case 'nutrition':
          if (data?.mealType) {
            success = await emailNotificationManager.sendNutritionReminder(
              email,
              data.mealType
            );
          }
          break;

        case 'streak':
          if (data?.streakCount) {
            success = await emailNotificationManager.sendStreakReminder(
              email,
              data.streakCount
            );
          }
          break;

        default:
          return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
      }
    }

    return NextResponse.json({
      success,
      message: success ? 'Email notification sent' : canSendNotification ? 'Failed to send email notification' : 'Notifications disabled by user preference'
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}