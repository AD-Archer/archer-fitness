#!/usr/bin/env node
/* eslint-disable no-console */

// Script to generate VAPID keys for push notifications
// Run with: node scripts/generate-vapid-keys.js

import webpush from 'web-push';

function generateVAPIDKeys() {
  // Generate VAPID keys using web-push library (correct format for both client and server)
  const vapidKeys = webpush.generateVAPIDKeys();

  console.log('VAPID Keys Generated Successfully!');
  console.log('=====================================');
  console.log('');
  console.log('Public Key (NEXT_PUBLIC_VAPID_PUBLIC_KEY):');
  console.log(vapidKeys.publicKey);
  console.log('');
  console.log('Private Key (VAPID_PRIVATE_KEY):');
  console.log(vapidKeys.privateKey);
  console.log('');
  console.log('Add these to your .env.local file (development) or .env file (production/Docker):');
  console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
  console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
  console.log('');
  console.log('⚠️  IMPORTANT: Keep the private key secure and never commit it to version control!');
  console.log('📝 NOTE: These keys work for both browser Push API and server-side web-push library');
}

generateVAPIDKeys();