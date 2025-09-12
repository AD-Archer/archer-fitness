/* eslint-disable no-console */
import { emailNotificationManager } from '../lib/email-notifications.js';

// Send startup notification to admin
async function sendStartupNotification() {
  try {
    console.log('Sending startup notification to admin...');
    const success = await emailNotificationManager.sendStartupNotification();
    if (success) {
      console.log('Startup notification sent successfully.');
    } else {
      console.log('Failed to send startup notification (likely due to missing config).');
    }
  } catch (error) {
    console.error('Error sending startup notification:', error);
  }
}

// Run the notification
sendStartupNotification();