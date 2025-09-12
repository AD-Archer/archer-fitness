import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PushSubscriptionData } from '@/lib/notifications-server';

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

    // Parse subscription data
    const subscriptionData: PushSubscriptionData = await request.json();

    if (!subscriptionData.endpoint || !subscriptionData.keys) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Save subscription to database
    const subscription = await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId: session.user.id,
          endpoint: subscriptionData.endpoint
        }
      },
      update: {
        keys: subscriptionData.keys,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        endpoint: subscriptionData.endpoint,
        keys: subscriptionData.keys
      }
    });

    console.log('Push subscription saved for user:', session.user.id);

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        endpoint: subscription.endpoint,
        createdAt: subscription.createdAt
      }
    });

  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        id: true,
        endpoint: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      subscriptions
    });

  } catch (error) {
    console.error('Error fetching push subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}