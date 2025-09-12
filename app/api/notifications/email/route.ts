import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emailNotificationManager } from '@/lib/email-notifications';

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized or no email found' },
        { status: 401 }
      );
    }

    // Parse notification data
    const { type, workoutName, scheduledTime, mealType, streakCount } = await request.json();

    let success = false;

    switch (type) {
      case 'workout':
        if (workoutName && scheduledTime) {
          success = await emailNotificationManager.sendWorkoutReminder(
            session.user.email,
            workoutName,
            scheduledTime
          );
        }
        break;

      case 'weight':
        success = await emailNotificationManager.sendWeightReminder(session.user.email);
        break;

      case 'nutrition':
        if (mealType) {
          success = await emailNotificationManager.sendNutritionReminder(
            session.user.email,
            mealType
          );
        }
        break;

      case 'streak':
        if (streakCount) {
          success = await emailNotificationManager.sendStreakReminder(
            session.user.email,
            streakCount
          );
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Email notification sent successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send email notification. Check SMTP configuration.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error sending email notification:', error);
    return NextResponse.json(
      { error: 'Failed to send email notification' },
      { status: 500 }
    );
  }
}