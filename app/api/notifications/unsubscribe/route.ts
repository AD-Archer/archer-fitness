import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from "@/lib/prisma";

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

    // Get parameters from request
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const deleteAll = searchParams.get('all') === 'true';

    if (deleteAll) {
      // Delete all subscriptions for the user
      const deletedSubscriptions = await prisma.pushSubscription.deleteMany({
        where: {
          userId: session.user.id
        }
      });

      return NextResponse.json({
        success: true,
        message: `Deleted ${deletedSubscriptions.count} subscriptions`
      });
    }

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    // Delete the specific subscription
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

    return NextResponse.json({
      success: true,
      message: 'Subscription deleted successfully'
    });

  } catch {
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    );
  }
}