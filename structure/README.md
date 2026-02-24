# Q-Ai Mobile App

Mobile application for Q-Ai Academic Sanctuary - built with React Native.

## Features

- 🔐 Authentication (Login/Signup)
- 📚 Knowledge Vaults Management
- 📄 Document Upload & Processing
- 💬 AI-Powered Chat with RAG
- 🎤 Voice Mode (Premium)
- 🧠 Learning Persona Quiz
- ⚙️ Settings & Preferences

## Prerequisites

- Node.js (>=18.0.0)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Installation

1. Install dependencies:
```bash
npm install
```

2. For iOS, install pods:
```bash
cd ios && pod install && cd ..
```

3. Start Metro bundler:
```bash
npm start
```

4. Run on Android:
```bash
npm run android
```

5. Run on iOS:
```bash
npm run ios
```

## Project Structure

```
Mobile/
├── src/
│   ├── screens/          # Screen components
│   ├── components/       # Reusable components
│   ├── services/        # API and business logic
│   ├── navigation/      # Navigation setup
│   ├── utils/           # Utility functions
│   ├── constants/       # App constants
│   └── styles/          # Global styles
├── android/             # Android native code
├── ios/                 # iOS native code
└── package.json
```

## Configuration

Update `src/config/api.js` with your backend API URL.

## Backend Connection

The mobile app connects to the same backend API as the web application. Ensure the backend server is running on port 3000 (or update the API base URL in config).

