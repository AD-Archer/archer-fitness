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
      console.warn('SMTP not configured. Email notifications will not work.');
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
      console.log('Email sent successfully to:', to);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
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

  // Send nutrition reminder
  async sendNutritionReminder(email, mealType) {
    const subject = `🍎 Time to log your ${mealType}!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Nutrition Reminder</h2>
        <p>Hi there!</p>
        <p>Don't forget to log your ${mealType} to keep track of your nutrition!</p>
        <p><a href="${process.env.NEXTAUTH_URL}/nutrition" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Log Meal</a></p>
        <p style="color: #6b7280; font-size: 14px;">Good nutrition is key to your fitness goals! 🥗</p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  // Send streak reminder
  async sendStreakReminder(email, streakCount) {
    const subject = '🔥 Keep your fitness streak going!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Streak Reminder</h2>
        <p>Hi there!</p>
        <p>You're on a ${streakCount}-day fitness streak! Don't break it today! 🔥</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="font-size: 48px; margin-bottom: 10px;">${'🔥'.repeat(Math.min(streakCount, 10))}</div>
          <p style="font-size: 24px; font-weight: bold; color: #1f2937;">${streakCount} Days!</p>
        </div>
        <p><a href="${process.env.NEXTAUTH_URL}/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Dashboard</a></p>
        <p style="color: #6b7280; font-size: 14px;">Consistency is key! Keep it up! 💪</p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  // Send admin error notification
  async sendErrorNotification(error, context) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn('ADMIN_EMAIL not configured. Skipping admin error notification.');
      return false;
    }

    const subject = '🚨 Archer Fitness App Error Alert';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Application Error</h2>
        <p>An error occurred in the Archer Fitness application:</p>
        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #991b1b;">Error Details</h3>
          <p><strong>Message:</strong> ${error.message}</p>
          ${error.stack ? `<p><strong>Stack Trace:</strong></p><pre style="white-space: pre-wrap; font-size: 12px; color: #7f1d1d;">${error.stack}</pre>` : ''}
          ${context ? `<p><strong>Context:</strong> ${context}</p>` : ''}
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        </div>
        <p>Please check the application logs for more details.</p>
        <p style="color: #6b7280; font-size: 14px;">This is an automated notification from Archer Fitness.</p>
      </div>
    `;

    return this.sendEmail(adminEmail, subject, html);
  }

  // Send admin startup notification
  async sendStartupNotification() {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn('ADMIN_EMAIL not configured. Skipping admin startup notification.');
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
}

// Export singleton instance
export const emailNotificationManager = EmailNotificationManager.getInstance();