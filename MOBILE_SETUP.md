# Mobile App Setup Guide

This guide will help you build and run your Next.js app as a mobile application using Capacitor.

## Prerequisites

### For Android Development:

1. **Android Studio** - Download from [developer.android.com](https://developer.android.com/studio)
2. **Android SDK** - Install through Android Studio
3. **Java Development Kit (JDK)** - Version 11 or higher

### For iOS Development (macOS only):

1. **Xcode** - Download from the Mac App Store
2. **CocoaPods** - Install via Terminal: `sudo gem install cocoapods`

## Quick Start

### 1. Build the Web App

```bash
npm run build:mobile
```

### 2. Open in Android Studio

```bash
npm run open:android
```

### 3. Open in Xcode (macOS only)

```bash
npm run open:ios
```

## Available Scripts

- `npm run build:mobile` - Build the web app and sync with Capacitor
- `image.png` - Build and run on Android device/emulator
- `npm run ios` - Build and run on iOS device/simulator (macOS only)
- `npm run open:android` - Open Android project in Android Studio
- `npm run open:ios` - Open iOS project in Xcode

## Development Workflow

### 1. Make Changes

Edit your Next.js code as usual in the `src/` directory.

### 2. Build and Sync

```bash
npm run build:mobile
```

### 3. Test on Device

- **Android**: `npm run android`
- **iOS**: `npm run ios`

## Platform-Specific Setup

### Android Setup

1. **Install Android Studio**

   - Download and install Android Studio
   - Install Android SDK (API level 33 or higher)
   - Set up Android Virtual Device (AVD) for testing

2. **Configure Environment Variables**

   ```bash
   # Add to your PATH
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

3. **Run on Android**
   ```bash
   npm run build:mobile
   npm run android
   ```

### iOS Setup (macOS only)

1. **Install Xcode**

   - Download from Mac App Store
   - Install Command Line Tools: `xcode-select --install`

2. **Install CocoaPods**

   ```bash
   sudo gem install cocoapods
   ```

3. **Run on iOS**
   ```bash
   npm run build:mobile
   npm run ios
   ```

## Building for Production

### Android APK

1. Open Android Studio
2. Open the `android/` folder
3. Go to Build → Build Bundle(s) / APK(s) → Build APK(s)
4. Find the APK in `android/app/build/outputs/apk/debug/`

### Android AAB (Google Play Store)

1. Open Android Studio
2. Open the `android/` folder
3. Go to Build → Build Bundle(s) / APK(s) → Build Bundle(s)
4. Find the AAB in `android/app/build/outputs/bundle/release/`

### iOS App Store

1. Open Xcode
2. Open the `ios/` folder
3. Select your target device
4. Go to Product → Archive
5. Follow the App Store submission process

## Configuration

### Capacitor Config (`capacitor.config.ts`)

```typescript
import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.example.app",
  appName: "topfresh",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#9F7AEA",
      showSpinner: true,
      spinnerColor: "#ffffff",
    },
  },
};

export default config;
```

### Next.js Config (`next.config.ts`)

The app is configured for static export to work with Capacitor:

```typescript
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // ... other config
};
```

## Troubleshooting

### Common Issues

1. **Build fails with "command not found"**

   - Make sure Android Studio and Xcode are properly installed
   - Check that environment variables are set correctly

2. **App doesn't load in mobile**

   - Run `npm run build:mobile` to rebuild and sync
   - Check the Capacitor console for errors

3. **iOS build fails**

   - Make sure you're on macOS
   - Install CocoaPods: `sudo gem install cocoapods`
   - Run `cd ios && pod install`

4. **Android build fails**
   - Make sure Android Studio is installed
   - Check that ANDROID_HOME is set correctly
   - Update Android SDK tools

### Debugging

1. **View logs**

   ```bash
   # Android
   adb logcat

   # iOS
   xcrun simctl spawn booted log stream
   ```

2. **Remote debugging**
   - Android: Use Chrome DevTools
   - iOS: Use Safari Web Inspector

## Mobile-Specific Features

The app includes mobile-specific optimizations:

- **Touch-friendly UI**: Minimum 44px touch targets
- **Mobile navigation**: Swipe gestures and back button handling
- **Responsive design**: Optimized for mobile screens
- **Safe area support**: Works with notched devices
- **Mobile-specific CSS**: Enhanced mobile experience

## File Structure

```
├── src/
│   ├── app/                 # Next.js app directory
│   ├── components/          # React components
│   ├── utils/              # Utilities including mobile config
│   └── ...
├── android/                # Android project (generated)
├── ios/                    # iOS project (generated)
├── out/                    # Static build output
├── capacitor.config.ts     # Capacitor configuration
└── next.config.ts         # Next.js configuration
```

## Next Steps

1. **Customize the app icon** - Replace icons in `android/app/src/main/res/` and `ios/App/App/Assets.xcassets/`
2. **Add native plugins** - Install Capacitor plugins for camera, geolocation, etc.
3. **Configure app signing** - Set up signing certificates for app store distribution
4. **Add push notifications** - Implement push notifications using Capacitor plugins

## Support

For more information:

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Android Development](https://developer.android.com/)
- [iOS Development](https://developer.apple.com/ios/)
