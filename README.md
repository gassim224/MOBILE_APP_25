# Bonecole - Votre école au bout du doigt

**An offline-first educational mobile application for Senegalese students**

[![React Native](https://img.shields.io/badge/React%20Native-0.74-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-51-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

---

## 📚 User Documentation

**Looking for the user guide?** Check out our comprehensive documentation:

### 🇫🇷 [Guide Utilisateur (Français)](./GUIDE_UTILISATEUR.md)

This guide covers:
- Getting started with login and authentication
- Understanding Online vs Offline modes
- Downloading courses and books
- Using video, audio, and PDF players
- Managing storage and downloads
- Tracking progress and synchronization
- Testing notifications with Developer Tools

---

## 🚀 Running Locally

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the development server**

   ```bash
   npx expo start
   ```

3. **Run on your platform**

   In the output, you'll find options to open the app in:
   - [Development build](https://docs.expo.dev/develop/development-builds/introduction/)
   - [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
   - [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
   - [Expo Go](https://expo.dev/go) (for quick testing)

### Test Credentials

Use these credentials to test the app:
- **Student ID**: `eleve1`
- **PIN**: `1234`

---

## 🏗️ Technical Overview

### Architecture

**Bonecole** is built with an **offline-first architecture** designed to work seamlessly in low-connectivity environments. The app prioritizes local data storage and deferred synchronization to ensure students can learn anytime, anywhere.

### Tech Stack

| Technology | Purpose |
|-----------|---------|
| **React Native** | Cross-platform mobile framework |
| **Expo SDK 51** | Development platform and build tools |
| **TypeScript** | Type-safe development |
| **Expo Router** | File-based navigation system |
| **AsyncStorage** | Local data persistence |
| **React Native NetInfo** | Network connectivity detection |
| **Expo AV** | Video and audio playback |
| **React Native PDF** | In-app PDF rendering |
| **Expo Notifications** | Push notifications system |

### Key Features

#### 🔌 Offline-First Design
- **Connection Simulator**: Toggle between online/offline modes for testing
- **Smart Download Management**: Download courses and books when connected to school kiosk
- **Local Storage**: All downloaded content stored locally for offline access
- **Automatic Sync**: Progress syncs when reconnected to kiosk

#### 📱 Custom Media Players
- **Video Player**: Full-screen video playback with progress tracking
- **Audio Player**: Native audio playback with seek controls
- **PDF Reader**: Built-in PDF viewer with zoom, scroll, and page memory
- **Auto-save Progress**: All media progress saved every 3 seconds

#### 🎓 Grade-Based Content Filtering
- Courses automatically filtered by student's grade level (10th, 11th, 12th)
- Only relevant content displayed for each student
- Personalized learning experience

#### 📊 Progress Tracking
- **Lesson Completion**: Automatically marked complete at 95% progress
- **Course Progress**: Visual progress bars for each course
- **Continue Learning**: Quick access to recent activities with progress indicators
- **Statistics Dashboard**: Track courses followed, lessons completed, study time, and books read

#### 💾 Smart Storage Management
- **Storage Bar**: Visual indicator of device storage usage
- **Low Storage Warnings**: Alerts when storage exceeds 80%
- **Granular Deletion**: Delete entire courses or individual lessons
- **File Size Display**: See storage impact before downloading

#### 🔔 Intelligent Notifications
Six types of contextual notifications:
1. **Inactivity Reminder**: "We missed you!" after 48 hours
2. **Course Completion**: "Congratulations!" when finishing a course
3. **Lesson Continuation**: Reminder to finish incomplete lessons
4. **New Content Alert**: Notification of newly available content
5. **Session Planning**: Reminder to schedule next study session
6. **Low Storage Alert**: Warning when storage is nearly full

#### 🧪 Developer Tools
- Built-in notification testing (5-second delay for all types)
- Connection simulator for testing online/offline behaviors
- Comprehensive logging system for debugging

### Project Structure

```
bonecole/
├── app/                          # Expo Router pages
│   ├── (tabs)/                  # Tab navigation screens
│   │   ├── index.tsx            # Home screen (Cours)
│   │   ├── bibliotheque.tsx     # Library screen
│   │   ├── downloads.tsx        # Downloads management
│   │   └── profile.tsx          # User profile & settings
│   ├── (modals)/                # Modal screens
│   │   ├── video-player.tsx     # Full-screen video player
│   │   ├── audio-player.tsx     # Full-screen audio player
│   │   └── pdf-reader.tsx       # PDF reader
│   ├── login.tsx                # Authentication screen
│   ├── course-detail.tsx        # Course details & download
│   └── all-courses.tsx          # All courses list
├── assets/                       # Images, fonts, icons
├── components/                   # Reusable UI components
├── constants/                    # App constants and configuration
│   ├── AppConstants.ts          # App-wide constants
│   ├── Colors.ts                # Theme colors
│   └── SampleData.ts            # Mock data for testing
├── contexts/                     # React contexts
│   └── ConnectionSimulatorContext.tsx  # Connection state management
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript type definitions
│   └── index.ts                 # Shared types and interfaces
├── utils/                        # Utility functions
│   ├── Logger.ts                # Logging utility
│   ├── notificationService.ts   # Push notifications
│   └── storageUtils.ts          # Storage calculations
├── GUIDE_UTILISATEUR.md         # French user documentation
└── README.md                    # This file
```

### File-Based Routing

Bonecole uses **Expo Router** for navigation:

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/(tabs)/index.tsx` | Home screen with discovery |
| `/bibliotheque` | `app/(tabs)/bibliotheque.tsx` | Library of books |
| `/downloads` | `app/(tabs)/downloads.tsx` | Downloaded content |
| `/profile` | `app/(tabs)/profile.tsx` | User profile |
| `/login` | `app/login.tsx` | Authentication |
| `/course-detail` | `app/course-detail.tsx` | Course details |
| `/all-courses` | `app/all-courses.tsx` | All courses list |

### Data Flow

```
┌─────────────┐
│   Student   │
│  Logs In    │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Grade Detection    │ ◄── Auto-filters content by grade
└──────┬──────────────┘
       │
       ▼
┌──────────────────────┐
│  Online Mode         │
│  (Discovery Only)    │
│  - Browse courses    │
│  - Download content  │
│  - No playback       │ ◄── Saves bandwidth
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Offline Mode        │
│  (Learning)          │
│  - Play media        │
│  - Track progress    │
│  - Auto-save state   │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Sync on Reconnect   │ ◄── Progress syncs when online
└──────────────────────┘
```

### State Management

- **AsyncStorage**: Persistent local storage for user data, progress, and downloads
- **React Context**: `ConnectionSimulatorContext` for connection state
- **Component State**: Local state for UI interactions and temporary data

### Network Strategy

**Online Detection:**
- Uses `@react-native-community/netinfo` to detect connection
- Checks for kiosk WiFi by SSID keywords: `['ecole', 'school', 'kiosk']`
- Debounced network listeners (300ms) to prevent excessive checks

**Bandwidth Optimization:**
- Playback disabled when online (forces download-first workflow)
- Download queue system (simulated with delays)
- Local caching of all downloaded media

### Progress Persistence

All media players implement **auto-save progress**:
- Progress saved to AsyncStorage every 3 seconds
- Uses unique keys: `@media_progress_{itemId}`
- Automatically resume from last position
- Marks complete at 95% threshold

### Simulated Backend

Since this is a prototype, backend operations are simulated:
- **Login**: Mock authentication with test credentials
- **Downloads**: 2-3 second delay to simulate network transfer
- **Sync**: Visual animation with 2-second delay
- **Storage**: Calculated from mock file sizes (MB)

---

## 🎨 Design System

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| **Academic Blue** | `#1E3A5F` | Primary brand color, headers |
| **Sunshine Yellow** | `#FFD700` | CTAs, highlights, success |
| **Teal** | `#17A2B8` | Progress, info states |
| **Success Green** | `#4CAF50` | Completed states, online status |
| **Warning Orange** | `#FF9800` | Pending states, warnings |
| **Danger Red** | `#DC3545` | Delete actions, errors |
| **Gray Scale** | `#F8F9FA` to `#2C2C2C` | Backgrounds, text |

### Typography

- **Headers**: Bold, 700 weight
- **Body**: Regular, 400 weight
- **Emojis**: Used for visual identity (📐, 🇫🇷, 📕, etc.)

---

## 🧪 Development Commands

### Code Quality

```bash
# Lint the codebase
npm run lint

# Type-check with TypeScript
npx tsc

# Run both checks
npm run lint && npx tsc
```

### Testing

```bash
# Test specific features
npx expo start

# Use the app's Developer Tools in Profile screen to test:
# - Notifications (all 6 types)
# - Connection simulator
# - Progress tracking
# - Storage management
```

---

## 📦 Build & Deployment

### Development Build

```bash
# iOS
eas build --profile development --platform ios

# Android
eas build --profile development --platform android
```

### Production Build

```bash
# iOS
eas build --profile production --platform ios

# Android
eas build --profile production --platform android
```

### Submit to Stores

```bash
# Submit to App Store
eas submit --platform ios

# Submit to Google Play
eas submit --platform android
```

Refer to [Expo EAS Build documentation](https://docs.expo.dev/build/introduction/) for detailed instructions.

---

## 🛠️ Configuration

### App Configuration

Key configuration files:
- **`app.json`**: Expo app configuration
- **`tsconfig.json`**: TypeScript configuration
- **`.gitignore`**: Git ignore patterns

### Environment Variables

For production, configure:
- Backend API URL (when implemented)
- Kiosk WiFi SSID patterns
- Notification tokens
- Analytics keys

---

## 🚧 Known Limitations

### Current Prototype Limitations

1. **Mock Backend**: All backend operations are simulated
2. **Static Statistics**: Profile statistics are placeholder values
3. **Simulated Downloads**: No actual file downloads, uses mock data
4. **No Real Sync**: Sync is visual only, no server communication
5. **Local-Only Storage**: No cloud backup of progress

### Future Enhancements

- [ ] Real backend API integration
- [ ] Cloud synchronization with server
- [ ] Actual file downloads and storage
- [ ] Real-time statistics tracking
- [ ] Multi-device sync
- [ ] Admin dashboard for teachers
- [ ] Analytics and insights
- [ ] Gamification (badges, leaderboards)
- [ ] Peer collaboration features
- [ ] Offline maps for school locations

---

## 📖 Documentation

- **[User Guide (French)](./GUIDE_UTILISATEUR.md)**: Complete user manual in French
- **[CLAUDE.md](./CLAUDE.md)**: Project development instructions
- **[Expo Documentation](https://docs.expo.dev/)**: Official Expo docs
- **[React Native Documentation](https://reactnative.dev/docs/getting-started)**: React Native docs

---

## 🤝 Contributing

This is an educational prototype. For contributions:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is created for educational purposes.

---

## 🙏 Acknowledgments

- **Expo Team**: For the excellent development platform
- **React Native Community**: For the robust ecosystem
- **Senegalese Educators**: For inspiring this project
- **Fastshot AI**: For AI-powered development assistance

---

## 📧 Contact & Support

For questions, support, or feedback:

- **Issues**: Open an issue on GitHub
- **Documentation**: See [GUIDE_UTILISATEUR.md](./GUIDE_UTILISATEUR.md)
- **Expo Community**: [Discord](https://chat.expo.dev)

---

## 🌟 About Bonecole

**Bonecole** aims to democratize access to quality education in Senegal by providing an offline-first mobile learning platform. Students can download educational content from school kiosks and study anytime, anywhere—even without internet connectivity.

**Mission**: Empowering Senegalese students with accessible, high-quality education.

**Vision**: Every student deserves access to quality learning resources, regardless of connectivity.

---

**Built with ❤️ using [Fastshot AI](https://fastshot.ai) and [Expo](https://expo.dev)**

**© 2024 Bonecole - Votre école au bout du doigt**
