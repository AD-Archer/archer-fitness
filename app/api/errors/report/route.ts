import { NextRequest, NextResponse } from 'next/server';

import { emailNotificationManager } from '@/lib/email-notifications';
import { logger } from '@/lib/logger';

// Configure web-push with VAPID keys
let webpushConfigured = false;
const configureWebPush = async () => {
  if (webpushConfigured) return;

  try {
    const webpush = (await import('web-push')).default;

    if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      webpush.setVapidDetails(
        `mailto:${process.env.VAPID_EMAIL || process.env.ADMIN_EMAIL || 'admin@example.com'}`,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
      webpushConfigured = true;
      logger.info('Web-push configured successfully');
    } else {
      logger.warn('VAPID keys not found, push notifications will not work');
    }
  } catch (error) {
    logger.error('Failed to configure web-push:', error);
  }
};

export async function POST(request: NextRequest) {
  try {
    const { error, context, userAgent, url, userId, timestamp } = await request.json();

    if (!error) {
      return NextResponse.json({ error: 'Error data is required' }, { status: 400 });
    }

    // Configure web-push if not already configured
    await configureWebPush();

    // Always send admin notifications for errors to the configured ADMIN_EMAIL
    const adminEmail = process.env.ADMIN_EMAIL;
    const isProduction = process.env.NODE_ENV === 'production';

    if (!adminEmail) {
      logger.warn('ADMIN_EMAIL not configured, skipping admin error notification');
      return NextResponse.json({
        success: false,
        message: 'Admin email not configured'
      });
    }

    if (!isProduction) {
      logger.info('Skipping admin error notification - not in production environment');
      return NextResponse.json({
        success: true,
        message: 'Error logged (development mode - no email sent)',
        environment: 'development'
      });
    }

    // Send comprehensive admin error notification with all available data
    const emailSuccess = await emailNotificationManager.sendErrorNotification(
      new Error(error.message || 'Client-side error'),
      context || 'Client-side error',
      {
        stack: error.stack,
        digest: error.digest,
        userAgent,
        url,
        userId,
        timestamp: timestamp || new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        appUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000'
      }
    );

    return NextResponse.json({
      success: emailSuccess,
      methods: {
        email: emailSuccess
      },
      message: emailSuccess
        ? 'Error reported to admin'
        : 'Failed to report error'
    });
  } catch (error) {
    logger.error('Error in error reporting API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}