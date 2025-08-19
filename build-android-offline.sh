#!/bin/bash

# Android Offline Build Script
# This script builds the Android app with offline functionality

set -e

echo "🚀 Building Android app with offline functionality..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Check if Capacitor is installed
if ! command -v npx cap &> /dev/null; then
    print_error "Capacitor CLI not found. Installing Capacitor..."
    npm install @capacitor/cli
fi

print_status "Checking dependencies..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing npm dependencies..."
    npm install
fi

# Check if Android SDK is available
if [ -z "$ANDROID_HOME" ]; then
    print_warning "ANDROID_HOME environment variable is not set."
    print_warning "Please set ANDROID_HOME to your Android SDK path."
    print_warning "Example: export ANDROID_HOME=/path/to/android/sdk"
fi

print_status "Building Next.js app..."

# Build the Next.js app
npm run build

if [ $? -ne 0 ]; then
    print_error "Next.js build failed!"
    exit 1
fi

print_success "Next.js build completed!"

print_status "Syncing with Capacitor..."

# Sync with Capacitor
npx cap sync android

if [ $? -ne 0 ]; then
    print_error "Capacitor sync failed!"
    exit 1
fi

print_success "Capacitor sync completed!"

print_status "Checking Android project..."

# Check if Android project exists
if [ ! -d "android" ]; then
    print_error "Android project not found. Please run 'npx cap add android' first."
    exit 1
fi

print_status "Building Android APK..."

# Build Android APK
cd android

# Check if gradlew exists
if [ ! -f "gradlew" ]; then
    print_error "gradlew not found in android directory."
    exit 1
fi

# Make gradlew executable
chmod +x gradlew

# Build debug APK
./gradlew assembleDebug

if [ $? -ne 0 ]; then
    print_error "Android build failed!"
    exit 1
fi

print_success "Android APK built successfully!"

# Check if APK was created
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    print_success "APK created: $APK_PATH (Size: $APK_SIZE)"
else
    print_error "APK not found at expected location: $APK_PATH"
    exit 1
fi

cd ..

print_status "Build Summary:"
echo "✅ Next.js app built"
echo "✅ Capacitor sync completed"
echo "✅ Android APK built"
echo "📱 APK location: android/$APK_PATH"
echo "📱 APK size: $APK_SIZE"

print_status "Next steps:"
echo "1. Install the APK on your Android device:"
echo "   adb install android/$APK_PATH"
echo ""
echo "2. Or open in Android Studio:"
echo "   npm run open:android"
echo ""
echo "3. Test offline functionality:"
echo "   - Enable airplane mode"
echo "   - Test adding sales/orders"
echo "   - Disable airplane mode"
echo "   - Verify sync works"

print_success "🎉 Android offline build completed successfully!"


