# People Memory

## Project overview
A private personal relationship manager (PRM) — your extended memory for every person you meet. Two implementations:
1. **Mobile App** (primary, production-ready): React Native + Expo — iOS & Android
2. **Web App**: Blazor WebAssembly — browser-based version

All data stored 100% on-device. Zero backend. Zero server. Complete privacy.

---

## Mobile App (`artifacts/people-mobile`)

### Stack
- **Framework**: React Native + Expo (SDK 54) + Expo Router
- **Language**: TypeScript
- **Fonts**: Inter (via @expo-google-fonts)
- **Storage**: AsyncStorage (on-device only)
- **Icons**: @expo/vector-icons (Feather)
- **Build**: EAS Build (configured in `eas.json`)

### Key screens
- `app/index.tsx` — PIN lock screen (4-digit, SHA-256 hashed, setup on first launch)
- `app/dashboard.tsx` — People list, search, tag filters, sort, one-time tutorial overlay
- `app/add.tsx` — Add person form with avatar picker
- `app/edit/[id].tsx` — Edit person form
- `app/profile/[id].tsx` — Full person profile view

### Key components
- `components/AvatarPicker.tsx` — Avatar selection: 12 preset emoji avatars + device photo picker (expo-image-picker)
- `components/Tutorial.tsx` — One-time 4-step onboarding overlay shown after first PIN setup
- `components/AvatarDisplay` — Renders avatar from photoUri encoding (preset:id or file URI)

### Context
- `context/AppContext.tsx` — Global state: people CRUD, PIN auth, tutorial seen flag, auto-lock (5 min)

### Avatar encoding
- `undefined` → initials from name
- `preset:a1` → preset emoji avatar (id a1–a12)
- `file:///...` → device photo URI

### App Store assets
- `assets/images/icon.png` — 1024×1024 AI-generated app icon
- `assets/images/adaptive-icon.png` — Android adaptive icon
- `assets/images/splash-icon.png` — Splash screen icon
- `assets/screenshots/` — 5 App Store screenshots
- `eas.json` — EAS build config (development / preview / production profiles)

### Data model (Person)
```typescript
{
  id, name, photoUri?, tags[], trustLevel(0-10),
  description, likes, dislikes, thingsToRemember, quickFacts,
  birthday?, firstMet?, lastMet?, nextMeeting?,
  customDates: { id, date, label }[],
  createdAt, updatedAt
}
```

### Tutorial flow
Shown once on first dashboard visit (tracked via `pm_tutorial_seen` in AsyncStorage):
1. Search bar — "Search your people"
2. Tag filter row — "Filter by tags"
3. Person list — "Tap a card to see full profile"
4. FAB button — "Tap + to add your first person"

### Publishing checklist
- [x] App icon (1024×1024)
- [x] Adaptive icon (Android)
- [x] Splash screen
- [x] App Store screenshots (5)
- [x] EAS build config (`eas.json`)
- [x] Image picker permissions in `app.json`
- [ ] Apple Developer account ($99/year)
- [ ] Google Play account ($25 one-time)
- [ ] Fill in real Apple credentials in `eas.json` submit config
- [ ] Run `eas build --platform all --profile production`
- [ ] Run `eas submit --platform all`

---

## Promotional Video
Created at `artifacts/mockup-sandbox/src/components/mockups/PeopleMemoryVideo.tsx`
Preview: `/__mockup/preview/PeopleMemoryVideo`
Concept: Cinematic Minimal — crowd → app → confident greeting. 30-45 seconds. Dark palette, Space Grotesk + Inter.

---

## Web App (`artifacts/people-memory`)
Blazor WebAssembly (.NET 8), browser localStorage, same feature set as mobile. Unity dark theme.

---

## Color palette
```
bg:         #1A1A1A
panel:      #242424
border:     #3E3E42
accent:     #007ACC  (electric blue)
text:       #D4D4D4
textBright: #FFFFFF
green:      #4EC94E  (trust high)
yellow:     #E5C07B  (trust mid)
red:        #F44747  (trust low)
```
