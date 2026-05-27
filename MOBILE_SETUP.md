# Prism Guard Mobile Teammate Setup Guide

Use this guide after pulling the branch that already contains the Expo/EAS and Firebase setup.

This project uses an Expo development build. Do not use Expo Go for normal mobile testing, because Android remote push notifications do not work in Expo Go on the current SDK.

## What You Need

Install these on your computer:

- Node.js LTS
- npm
- Git
- An Expo account
- Access to the Prism Guard Expo/EAS project

For Android emulator testing, also install:

- Android Studio
- Android SDK
- An Android emulator from Android Studio Device Manager

For physical iPhone testing, you also need:

- Access to the team's Apple Developer setup through EAS
- A registered iPhone if EAS asks for device registration

## First-Time Setup

From the mobile app folder:

```powershell
cd prism-guard-mobile
npm install
```

Log in to Expo:

```powershell
npx eas-cli login
```

Confirm you are logged in:

```powershell
npx eas-cli whoami
```

If EAS says you do not have access to the project, ask the project owner to add your Expo account to the Prism Guard Expo project.

## Firebase Config Note

Do not commit `google-services.json` or Firebase private key files. The project owner manages Firebase configuration in EAS, and the build receives the Android Firebase config during EAS Build.

For normal teammate setup, you do not need to create a Firebase project or generate Firebase keys.

## Environment File

Create or update this file:

```txt
prism-guard-mobile/.env
```

Set the API URL:

```txt
EXPO_PUBLIC_API_URL=http://YOUR_API_HOST:3000
```

Use the right host for your run target:

```txt
Physical Android phone: use your computer's LAN IP, for example http://192.168.1.50:3000
Physical iPhone: use your computer's LAN IP, for example http://192.168.1.50:3000
Android emulator: use http://10.0.2.2:3000
```

After changing `.env`, restart Metro.

## Start The Development Server

Run this whenever you want to work on the app:

```powershell
cd prism-guard-mobile
npx expo start --dev-client
```

Keep this terminal open while using the app.

## Android Physical Phone

Use this when testing Android push notifications.

1. Build the Android development app:

```powershell
cd prism-guard-mobile
npx eas-cli build --profile development --platform android
```

2. Wait for EAS to finish.
3. Install the build on your Android phone using the QR code or install link shown by EAS.
4. Make sure your `.env` uses your computer's LAN IP:

```txt
EXPO_PUBLIC_API_URL=http://192.168.1.50:3000
```

5. Start Metro:

```powershell
npx expo start --dev-client
```

6. Open the installed Prism Guard app on your phone.
7. Connect it to the Metro server.
8. Log in and allow notifications when prompted.

Expected result:

- The app opens from the installed Prism Guard development build, not Expo Go.
- No Expo Go push notification warning appears.
- No Firebase initialization error appears.
- Login registers the device for push notifications.

## iPhone Physical Phone

Use this only if you need to test on a real iPhone.

1. Build the iOS development app:

```powershell
cd prism-guard-mobile
npx eas-cli build --profile development --platform ios
```

2. Follow any EAS prompts for Apple credentials or device registration.
3. Install the build on your iPhone using the EAS install link.
4. Make sure your `.env` uses your computer's LAN IP:

```txt
EXPO_PUBLIC_API_URL=http://192.168.1.50:3000
```

5. Start Metro:

```powershell
npx expo start --dev-client
```

6. Open the installed Prism Guard app on your iPhone.
7. Connect it to the Metro server.
8. Log in and allow notifications when prompted.

Notes:

- Windows users can create iOS builds through EAS, but iOS device setup may still require Apple Developer account access.
- Use a physical iPhone for iOS push notification testing.

## Android Emulator

Use this when you do not need a physical Android phone.

1. Open Android Studio.
2. Open Device Manager.
3. Create an Android emulator if one does not exist.
4. Start the emulator.
5. Set `.env` to use the Android emulator host alias:

```txt
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

6. Build the Android development app if you do not already have a compatible build:

```powershell
cd prism-guard-mobile
npx eas-cli build --profile development --platform android
```

7. Install the EAS build on the emulator.
8. Start Metro:

```powershell
npx expo start --dev-client
```

9. Open the installed Prism Guard app in the emulator.

## Daily Workflow After The App Is Installed

Most days, you only need:

```powershell
cd prism-guard-mobile
npm install
npx expo start --dev-client
```

Then open the installed Prism Guard development app on your phone or emulator.

You only need a new EAS build when native setup changes, such as:

- dependencies with native code changed
- `app.json` changed
- push notification setup changed
- the installed development build is missing a newly added native module

For normal JavaScript, screen, style, and API changes, restart/reload Metro instead of rebuilding.

## Common Errors

### `npm error could not determine executable to run` with `npx eas login`

Use this command instead:

```powershell
npx eas-cli login
```

### Expo Go push notification warning

You opened the app in Expo Go. Install and open the Prism Guard development build instead.

### App cannot reach the API on a physical phone

Use your computer's LAN IP in `.env`, not `localhost`:

```txt
EXPO_PUBLIC_API_URL=http://192.168.1.50:3000
```

Make sure the phone and computer are on the same Wi-Fi network.

### App cannot reach the API on Android emulator

Use:

```txt
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

### EAS project access error

Check your account:

```powershell
npx eas-cli whoami
```

Then ask the project owner to add that Expo account to the Prism Guard project.
