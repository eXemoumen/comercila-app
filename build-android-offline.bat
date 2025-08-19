@echo off
setlocal enabledelayedexpansion

REM Android Offline Build Script for Windows
REM This script builds the Android app with offline functionality

echo 🚀 Building Android app with offline functionality...

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] package.json not found. Please run this script from the project root.
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js first.
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed. Please install npm first.
    exit /b 1
)

echo [INFO] Checking dependencies...

REM Install dependencies if needed
if not exist "node_modules" (
    echo [INFO] Installing npm dependencies...
    npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed!
        exit /b 1
    )
)

REM Check if Android SDK is available
if "%ANDROID_HOME%"=="" (
    echo [WARNING] ANDROID_HOME environment variable is not set.
    echo [WARNING] Please set ANDROID_HOME to your Android SDK path.
    echo [WARNING] Example: set ANDROID_HOME=C:\path\to\android\sdk
)

echo [INFO] Building Next.js app...

REM Build the Next.js app
npm run build
if errorlevel 1 (
    echo [ERROR] Next.js build failed!
    exit /b 1
)

echo [SUCCESS] Next.js build completed!

echo [INFO] Syncing with Capacitor...

REM Sync with Capacitor
npx cap sync android
if errorlevel 1 (
    echo [ERROR] Capacitor sync failed!
    exit /b 1
)

echo [SUCCESS] Capacitor sync completed!

echo [INFO] Checking Android project...

REM Check if Android project exists
if not exist "android" (
    echo [ERROR] Android project not found. Please run 'npx cap add android' first.
    exit /b 1
)

echo [INFO] Building Android APK...

REM Build Android APK
cd android

REM Check if gradlew exists
if not exist "gradlew.bat" (
    echo [ERROR] gradlew.bat not found in android directory.
    exit /b 1
)

REM Build debug APK
gradlew.bat assembleDebug
if errorlevel 1 (
    echo [ERROR] Android build failed!
    exit /b 1
)

echo [SUCCESS] Android APK built successfully!

REM Check if APK was created
set APK_PATH=app\build\outputs\apk\debug\app-debug.apk
if exist "%APK_PATH%" (
    for %%A in ("%APK_PATH%") do set APK_SIZE=%%~zA
    echo [SUCCESS] APK created: %APK_PATH% (Size: %APK_SIZE% bytes)
) else (
    echo [ERROR] APK not found at expected location: %APK_PATH%
    exit /b 1
)

cd ..

echo [INFO] Build Summary:
echo ✅ Next.js app built
echo ✅ Capacitor sync completed
echo ✅ Android APK built
echo 📱 APK location: android\%APK_PATH%
echo 📱 APK size: %APK_SIZE% bytes

echo [INFO] Next steps:
echo 1. Install the APK on your Android device:
echo    adb install android\%APK_PATH%
echo.
echo 2. Or open in Android Studio:
echo    npm run open:android
echo.
echo 3. Test offline functionality:
echo    - Enable airplane mode
echo    - Test adding sales/orders
echo    - Disable airplane mode
echo    - Verify sync works

echo [SUCCESS] 🎉 Android offline build completed successfully!


