/* eslint-disable no-console */
import { emailNotificationManager } from '../lib/email-notifications.js';

// Send startup notification to admin
async function sendStartupNotification() {
  try {
    console.log('Sending startup notification to admin...');

    // Check if ADMIN_EMAIL is configured
    const adminEmail = process.env.ADMIN_EMAIL;
    const shouldSendStartupNotification = !!adminEmail;

    if (!adminEmail) {
      console.log('ADMIN_EMAIL not configured, skipping startup notification');
      return;
    }

    let emailSuccess = false;

    if (shouldSendStartupNotification) {
      // Send email to the configured admin email
      emailSuccess = await emailNotificationManager.sendStartupNotification();
    } else {
      console.log('Startup notifications disabled (no admin email configured).');
    }

    if (emailSuccess) {
      console.log('Startup notification sent successfully.');
      console.log('- Email sent');
    } else {
      console.log('Failed to send startup notification (likely due to missing config or disabled notifications).');
    }
  } catch (error) {
    console.error('Error sending startup notification:', error.message);
  }
}

// Run the notification
sendStartupNotification();