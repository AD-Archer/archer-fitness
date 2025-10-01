import nodemailer from 'nodemailer';

// Email notification manager
export class EmailNotificationManager {
  static instance;
  transporter = null;

  constructor() {}

  static getInstance() {
    if (!EmailNotificationManager.instance) {
      EmailNotificationManager.instance = new EmailNotificationManager();
    }
    return EmailNotificationManager.instance;
  }

  // Initialize email transporter
  initializeTransporter() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      return false;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    return true;
  }

  // Send email notification
  async sendEmail(to, subject, html, text) {
    if (!this.transporter) {
      if (!this.initializeTransporter()) {
        return false;
      }
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        html,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch {
      return false;
    }
  }

  // Send workout reminder email
  async sendWorkoutReminder(email, workoutName, scheduledTime) {
    const subject = `🏋️ Time for your ${workoutName} workout!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Workout Reminder</h2>
        <p>Hi there!</p>
        <p>It's time for your scheduled workout:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0; color: #1f2937;">${workoutName}</h3>
          <p style="margin: 10px 0 0 0; color: #6b7280;">Scheduled for: ${scheduledTime}</p>
        </div>
        <p><a href="${process.env.NEXTAUTH_URL}/track" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Start Workout</a></p>
        <p style="color: #6b7280; font-size: 14px;">Keep up the great work! 💪</p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  // Send weight tracking reminder
  async sendWeightReminder(email) {
    const subject = '⚖️ Time to log your weight!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Weight Tracking Reminder</h2>
        <p>Hi there!</p>
        <p>Don't forget to log your weight today to track your progress!</p>
        <p><a href="${process.env.NEXTAUTH_URL}/progress" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Log Weight</a></p>
        <p style="color: #6b7280; font-size: 14px;">Consistent tracking leads to better results! 📊</p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  // Send weigh-in reminder
  async sendWeighInReminder(email) {
    const subject = '⚖️ Time to weigh in!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Weigh-in Reminder</h2>
        <p>Hi there!</p>
        <p>It's time to log your weight and track your progress!</p>
        <p><a href="${process.env.NEXTAUTH_URL}/progress" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Log Weight</a></p>
        <p style="color: #6b7280; font-size: 14px;">Consistent tracking leads to better results! 📊</p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  // Send meal reminder
  async sendMealReminder(email, mealType = null) {
    const subject = mealType ? `🍽️ Time to log your ${mealType}!` : '🍽️ Meal Time!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Meal Reminder</h2>
        <p>Hi there!</p>
        <p>${mealType ? `Don't forget to log your ${mealType}!` : 'Time to log your meal!'}</p>
        <p><a href="${process.env.NEXTAUTH_URL}/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Log Meal</a></p>
        <p style="color: #6b7280; font-size: 14px;">Good nutrition is key to your fitness goals! 🥗</p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  // Send sleep reminder
  async sendSleepReminder(email) {
    const subject = '😴 Sleep Check-in';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Sleep Check-in</h2>
        <p>Hi there!</p>
        <p>How did you sleep last night? Log your sleep data to track your recovery!</p>
        <p><a href="${process.env.NEXTAUTH_URL}/progress" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Log Sleep</a></p>
        <p style="color: #6b7280; font-size: 14px;">Quality sleep is essential for fitness progress! 🌙</p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  // Send exercise reminder
  async sendExerciseReminder(email, workoutName) {
    const subject = `💪 Time for your ${workoutName} workout!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Exercise Reminder</h2>
        <p>Hi there!</p>
        <p>Ready for your ${workoutName} workout? Let's get moving!</p>
        <p><a href="${process.env.NEXTAUTH_URL}/track" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Start Workout</a></p>
        <p style="color: #6b7280; font-size: 14px;">Keep up the great work! 💪</p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  // Send admin error notification
  async sendErrorNotification(error, context, additionalData = {}) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return false;
    }

    const subject = '🚨 Archer Fitness App Error Alert';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Application Error</h2>
        <p>An error occurred in the Archer Fitness application:</p>
        
        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #991b1b;">Error Details</h3>
          
          <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
            <p style="margin: 5px 0;"><strong>Message:</strong> ${error.message}</p>
            ${error.stack ? `<p style="margin: 5px 0;"><strong>Stack Trace:</strong></p><pre style="white-space: pre-wrap; font-size: 12px; color: #7f1d1d; background: #f9f9f9; padding: 10px; border-radius: 4px; margin: 10px 0;">${error.stack}</pre>` : ''}
            ${context ? `<p style="margin: 5px 0;"><strong>Context:</strong> ${context}</p>` : ''}
            ${additionalData.digest ? `<p style="margin: 5px 0;"><strong>Error Digest:</strong> ${additionalData.digest}</p>` : ''}
          </div>
          
          <h4 style="margin: 20px 0 10px 0; color: #991b1b;">Environment Information</h4>
          <div style="background: white; padding: 15px; border-radius: 6px;">
            ${additionalData.timestamp ? `<p style="margin: 5px 0;"><strong>Time:</strong> ${additionalData.timestamp}</p>` : ''}
            ${additionalData.environment ? `<p style="margin: 5px 0;"><strong>Environment:</strong> ${additionalData.environment}</p>` : ''}
            ${additionalData.appUrl ? `<p style="margin: 5px 0;"><strong>App URL:</strong> ${additionalData.appUrl}</p>` : ''}
            ${additionalData.url ? `<p style="margin: 5px 0;"><strong>Page URL:</strong> ${additionalData.url}</p>` : ''}
            ${additionalData.userAgent ? `<p style="margin: 5px 0;"><strong>User Agent:</strong> ${additionalData.userAgent}</p>` : ''}
            ${additionalData.userId ? `<p style="margin: 5px 0;"><strong>User ID:</strong> ${additionalData.userId}</p>` : ''}
          </div>
        </div>
        
        <p>Please check the application logs for more details and investigate this error.</p>
        <p style="color: #6b7280; font-size: 14px;">This is an automated notification from Archer Fitness.</p>
      </div>
    `;

    return this.sendEmail(adminEmail, subject, html);
  }

  // Send admin startup notification
  async sendStartupNotification() {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return false;
    }

    const subject = '🚀 Archer Fitness App Started';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Application Started</h2>
        <p>The Archer Fitness application has been started or restarted successfully.</p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #166534;">Startup Details</h3>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
          <p><strong>URL:</strong> ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}</p>
        </div>
        <p>The application is now ready to serve users.</p>
        <p style="color: #6b7280; font-size: 14px;">This is an automated notification from Archer Fitness.</p>
      </div>
    `;

    return this.sendEmail(adminEmail, subject, html);
  }

  // Send test admin notification
  async sendTestNotification(message = 'This is a test admin notification from Archer Fitness') {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return false;
    }

    const subject = '🧪 Test Admin Notification - Archer Fitness';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Test Notification</h2>
        <p>This is a test notification to verify that admin email notifications are working correctly.</p>
        <div style="background: #faf5ff; border: 1px solid #d8b4fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #6b21a8;">Test Message</h3>
          <p>${message}</p>
          <p><strong>Test Time:</strong> ${new Date().toISOString()}</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
        </div>
        <p>If you received this email, admin notifications are working correctly! 🎉</p>
        <p style="color: #6b7280; font-size: 14px;">This is a test notification from Archer Fitness.</p>
      </div>
    `;

    return this.sendEmail(adminEmail, subject, html);
  }
}

// Export singleton instance
export const emailNotificationManager = EmailNotificationManager.getInstance();