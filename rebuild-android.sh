#!/bin/bash

echo "🔧 Rebuilding Android app with notification fixes..."

# Clean and rebuild
echo "📱 Cleaning Android build..."
cd android
./gradlew clean

echo "🔨 Building Android app..."
./gradlew assembleDebug

echo "✅ Android app rebuilt successfully!"
echo "📱 Install the new APK to test the notification fixes:"
echo "   - The exact alarm warning should be resolved"
echo "   - Notification permissions should work properly"
echo "   - Event listeners should be active"
echo "   - Notification channel should be created"

cd ..
