# People Memory

[![Deploy to GitHub Pages](https://github.com/TITANICBHAI/PeopleMemory/workflows/Deploy%20to%20GitHub%20Pages/badge.svg)](https://github.com/TITANICBHAI/PeopleMemory/actions/workflows/deploy-pages.yml)
[![Build Android Debug APK](https://github.com/TITANICBHAI/PeopleMemory/workflows/Build%20Android%20Debug%20APK/badge.svg)](https://github.com/TITANICBHAI/PeopleMemory/actions/workflows/build-android-debug.yml)
[![Build Android Release](https://github.com/TITANICBHAI/PeopleMemory/workflows/Build%20Android%20Release%20(Signed%20APK%20+%20AAB)/badge.svg)](https://github.com/TITANICBHAI/PeopleMemory/actions/workflows/build-android-release.yml)

**Your private extended memory for every person you meet.**

A 100% offline personal relationship manager (PRM) for Android and iOS. Track trust levels, notes, birthdays, meetings, and interactions — without a single byte leaving your device.

🌐 **Website:** https://peoplememory.pages.dev  
📱 **Download:** https://people-memory.en.uptodown.com/android  
🔒 **Zero cloud · Zero tracking · Zero account required**

---

## Features

- 🔐 PIN-protected local vault (SHA-256 hashed)
- 📊 Trust level tracking (0–10, red/yellow/green)
- 📝 Rich notes — likes, dislikes, quick facts, descriptions
- 📅 Dates & local reminders — birthdays, meetings, custom dates
- 🎙️ Voice interaction notes with timestamps
- 👥 Colour-coded groups (work, family, friends, networking)
- ❤️ Relationship health score (auto-calculated)
- 🃏 Meeting prep cards
- 📖 Activity journal

## Stack

- **Framework:** React Native + Expo SDK 54
- **Language:** TypeScript
- **Storage:** AsyncStorage (on-device only)
- **Navigation:** Expo Router
- **Build:** EAS Build

## Build

```bash
pnpm install
pnpm --filter @workspace/people-mobile run dev
```

## License

Open source. Built by [TBTechs](https://github.com/TITANICBHAI).
