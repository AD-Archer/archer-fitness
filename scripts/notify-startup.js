/* eslint-disable no-console */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file manually
function loadEnvFile() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const envPath = join(__dirname, '..', '.env');

    const envContent = readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
          process.env[key] = value;
        }
      }
    }
    console.log('Environment variables loaded from .env file');
  } catch (error) {
    console.log('Could not load .env file:', error.message);
  }
}

// Load environment variables
loadEnvFile();

// Send startup notification to admin via API
async function sendStartupNotification() {
  try {
    console.log('Sending startup notification to admin...');

    // Check if ADMIN_EMAIL is configured
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
      console.log('ADMIN_EMAIL not configured, skipping startup notification');
      console.log('Available env vars with EMAIL:', Object.keys(process.env).filter(key => key.includes('EMAIL')));
      return;
    }

    console.log('ADMIN_EMAIL found:', adminEmail);

    // Use the error reporting API to send startup notification
    const apiUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    console.log('Making request to:', `${apiUrl}/api/errors/report`);

    const response = await fetch(`${apiUrl}/api/errors/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'startup',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        appUrl: apiUrl
      })
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('API response:', result);

    if (result.success) {
      console.log('Startup notification sent successfully.');
      console.log('- Email sent');
    } else {
      console.log('Failed to send startup notification:', result.message);
    }
  } catch (error) {
    console.error('Error sending startup notification:', error.message);
  }
}

// Run the notification
sendStartupNotification();