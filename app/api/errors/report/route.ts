import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { emailNotificationManager } from '@/lib/email-notifications';

export async function POST(request: NextRequest) {
  try {
    const { error, context, userId } = await request.json();

    if (!error) {
      return NextResponse.json({ error: 'Error data is required' }, { status: 400 });
    }

    // Check if user has opted out of data sharing
    let canSendAdminNotification = true;

    if (userId) {
      // If we have a userId, check their data sharing preference
      try {
        const userPrefs = await prisma.userPreference.findUnique({
          where: { userId },
          select: { app: true }
        });

        if (userPrefs?.app && typeof userPrefs.app === 'object') {
          const appPrefs = userPrefs.app as any;
          // If user has explicitly opted out of data sharing, don't send admin notification
          if (appPrefs.dataSharing === false) {
            canSendAdminNotification = false;
          }
        }
      } catch {
        // If we can't check preferences, err on the side of caution and don't send
        canSendAdminNotification = false;
      }
    }

    // Send admin notification only if user hasn't opted out
    let success = false;
    if (canSendAdminNotification) {
      success = await emailNotificationManager.sendErrorNotification(
        new Error(error.message || 'Client-side error'),
        context || 'Client-side error'
      );
    }

    return NextResponse.json({
      success,
      message: success ? 'Error reported to admin' : canSendAdminNotification ? 'Failed to report error' : 'Error reporting disabled by user preference'
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}