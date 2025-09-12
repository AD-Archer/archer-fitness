import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendPushNotification } from '@/lib/notifications-server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's push subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: session.user.id
      }
    });

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No push subscriptions found. Please enable notifications first.' },
        { status: 400 }
      );
    }

    // Send test notification to all user's subscriptions
    const testPayload = {
      title: '🧪 Test Notification',
      body: 'This is a test notification from Archer Fitness!',
      type: 'general' as const,
      url: '/settings'
    };

    const sendPromises = subscriptions.map(subscription =>
      sendPushNotification({
        endpoint: subscription.endpoint,
        keys: subscription.keys as { p256dh: string; auth: string }
      }, testPayload)
    );

    await Promise.all(sendPromises);

    console.log(`Test notification sent to ${subscriptions.length} subscription(s) for user:`, session.user.id);

    return NextResponse.json({
      success: true,
      message: `Test notification sent to ${subscriptions.length} device(s)`
    });

  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { error: 'Failed to send test notification' },
      { status: 500 }
    );
  }
}