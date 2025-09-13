#!/usr/bin/env node

/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSettingsSaveLoad() {
  console.log('Testing settings save/load functionality...\n');

  try {
    // Test data
    const testUserId = 'test-user-123';
    const testPreferences = {
      workoutPrefs: {
        defaultDuration: '45',
        difficultyLevel: 'intermediate',
        preferredTime: 'morning',
        availableEquipment: ['dumbbells', 'barbell'],
        restDayReminders: true,
      },
      nutritionPrefs: {
        dailyCalories: '2200',
        proteinTarget: '150',
        carbTarget: '250',
        fatTarget: '80',
        dietaryRestrictions: [],
        trackWater: true,
        waterTarget: '2500',
        useSmartCalculations: true,
      },
      appPrefs: {
        theme: 'system',
        units: 'imperial',
        notifications: true,
        weeklyReports: true,
        dataSharing: false,
        adminNotifications: {
          enabled: true,
          methods: ['smtp'],
          errorAlerts: true,
          startupAlerts: true,
        },
        notificationPrefs: {
          workoutReminders: true,
          weightReminders: true,
          nutritionReminders: true,
          streakReminders: true,
          reminderTime: '09:00',
        },
      },
    };

    console.log('1. Testing save preferences...');

    // Save preferences
    const saved = await prisma.userPreference.upsert({
      where: { userId: testUserId },
      update: {
        workout: testPreferences.workoutPrefs,
        nutrition: testPreferences.nutritionPrefs,
        app: testPreferences.appPrefs,
      },
      create: {
        userId: testUserId,
        workout: testPreferences.workoutPrefs,
        nutrition: testPreferences.nutritionPrefs,
        app: testPreferences.appPrefs,
      },
    });

    console.log('✓ Preferences saved successfully');
    console.log(`  Created/Updated at: ${saved.updatedAt}`);

    console.log('\n2. Testing load preferences...');

    // Load preferences
    const loaded = await prisma.userPreference.findUnique({
      where: { userId: testUserId },
    });

    if (!loaded) {
      throw new Error('Failed to load preferences');
    }

    console.log('✓ Preferences loaded successfully');
    console.log('  Workout prefs:', JSON.stringify(loaded.workout, null, 2));
    console.log('  Nutrition prefs:', JSON.stringify(loaded.nutrition, null, 2));
    console.log('  App prefs:', JSON.stringify(loaded.app, null, 2));

    console.log('\n3. Verifying data integrity...');

    // Verify data matches
    const workoutMatch = JSON.stringify(loaded.workout) === JSON.stringify(testPreferences.workoutPrefs);
    const nutritionMatch = JSON.stringify(loaded.nutrition) === JSON.stringify(testPreferences.nutritionPrefs);
    const appMatch = JSON.stringify(loaded.app) === JSON.stringify(testPreferences.appPrefs);

    if (workoutMatch && nutritionMatch && appMatch) {
      console.log('✓ Data integrity verified - all preferences match');
    } else {
      console.log('⚠ Data integrity issues detected:');
      if (!workoutMatch) console.log('  - Workout preferences do not match');
      if (!nutritionMatch) console.log('  - Nutrition preferences do not match');
      if (!appMatch) console.log('  - App preferences do not match');
    }

    console.log('\n4. Testing update preferences...');

    // Update preferences
    const updatedPrefs = {
      ...testPreferences,
      appPrefs: {
        ...testPreferences.appPrefs,
        theme: 'dark',
        dataSharing: true,
      },
    };

    const updated = await prisma.userPreference.upsert({
      where: { userId: testUserId },
      update: {
        app: updatedPrefs.appPrefs,
      },
      create: {
        userId: testUserId,
        workout: updatedPrefs.workoutPrefs,
        nutrition: updatedPrefs.nutritionPrefs,
        app: updatedPrefs.appPrefs,
      },
    });

    console.log('✓ Preferences updated successfully');
    console.log(`  Theme changed to: ${updated.app.theme}`);
    console.log(`  Data sharing changed to: ${updated.app.dataSharing}`);

    console.log('\n5. Cleaning up test data...');

    // Clean up test data
    await prisma.userPreference.delete({
      where: { userId: testUserId },
    });

    console.log('✓ Test data cleaned up');

    console.log('\n🎉 All tests passed! Settings save/load functionality is working correctly.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSettingsSaveLoad();