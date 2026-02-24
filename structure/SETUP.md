# Mobile App Setup Guide

## Prerequisites

1. **Node.js** (>=18.0.0) - [Download](https://nodejs.org/)
2. **React Native CLI** - Install globally:
   ```bash
   npm install -g react-native-cli
   ```
3. **For Android:**
   - Android Studio
   - Android SDK
   - Java Development Kit (JDK)
4. **For iOS (macOS only):**
   - Xcode
   - CocoaPods: `sudo gem install cocoapods`

## Installation Steps

### 1. Install Dependencies

```bash
cd Mobile
npm install
```

### 2. iOS Setup (macOS only)

```bash
cd ios
pod install
cd ..
```

### 3. Configure API URL

**Important:** For mobile apps, you cannot use `localhost`. You need to use your computer's IP address.

1. Find your computer's IP address:
   - **Windows:** Open Command Prompt and run `ipconfig`. Look for "IPv4 Address"
   - **Mac/Linux:** Open Terminal and run `ifconfig` or `ip addr`. Look for your network interface IP

2. Update `src/constants/config.js`:
   ```javascript
   BASE_URL: __DEV__ 
     ? 'http://YOUR_IP_ADDRESS:3000/api'  // Replace YOUR_IP_ADDRESS
     : 'https://api.q-ai.com/api',
   ```

   Example:
   ```javascript
   BASE_URL: __DEV__ 
     ? 'http://192.168.1.100:3000/api'
     : 'https://api.q-ai.com/api',
   ```

3. **Make sure your backend server is running** on port 3000

4. **Ensure your phone/emulator is on the same network** as your development machine

### 4. Start Metro Bundler

```bash
npm start
```

Keep this terminal open. Metro is the JavaScript bundler for React Native.

### 5. Run the App

**For Android:**
```bash
npm run android
```

**For iOS (macOS only):**
```bash
npm run ios
```

## Troubleshooting

### Issue: Cannot connect to backend API

**Solution:**
1. Make sure backend server is running: `cd ../backend && npm start`
2. Verify API URL in `src/constants/config.js` uses your IP address, not localhost
3. Check that your phone/emulator is on the same WiFi network
4. Test the API URL in a browser: `http://YOUR_IP:3000/health`

### Issue: Metro bundler won't start

**Solution:**
```bash
# Clear Metro cache
npm start -- --reset-cache
```

### Issue: iOS build fails

**Solution:**
```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Issue: Android build fails

**Solution:**
1. Make sure Android Studio is installed
2. Open Android Studio and install required SDKs
3. Check that `ANDROID_HOME` environment variable is set

## Development Tips

1. **Shake your device** (or press `Cmd+D` on iOS / `Cmd+M` on Android) to open developer menu
2. **Enable Hot Reload** in developer menu for faster development
3. **Check logs:**
   - iOS: `npx react-native log-ios`
   - Android: `npx react-native log-android`

## Building for Production

### Android

```bash
cd android
./gradlew assembleRelease
```

### iOS

1. Open `ios/Q-Ai.xcworkspace` in Xcode
2. Select your target device/simulator
3. Product > Archive

## Environment Variables

For different environments, you can use `react-native-config`:

1. Install: `npm install react-native-config`
2. Create `.env` file:
   ```
   API_BASE_URL=http://192.168.1.100:3000/api
   ```
3. Update `src/constants/config.js` to use `Config.API_BASE_URL`

