import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get endpoint from request body or query params
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    // Delete the subscription
    const deletedSubscription = await prisma.pushSubscription.deleteMany({
      where: {
        userId: session.user.id,
        endpoint: endpoint
      }
    });

    if (deletedSubscription.count === 0) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    console.log('Push subscription deleted for user:', session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Subscription deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE_ALL(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete all subscriptions for the user
    const deletedSubscriptions = await prisma.pushSubscription.deleteMany({
      where: {
        userId: session.user.id
      }
    });

    console.log(`Deleted ${deletedSubscriptions.count} push subscriptions for user:`, session.user.id);

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedSubscriptions.count} subscriptions`
    });

  } catch (error) {
    console.error('Error deleting push subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscriptions' },
      { status: 500 }
    );
  }
}