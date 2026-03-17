import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import C from '@/constants/colors';

const SECTIONS = [
  {
    title: 'What We Collect',
    body: 'People Memory stores all data you enter — names, notes, trust levels, dates, and avatars — exclusively on your device using local storage. No data is ever sent to any server, cloud, or third party.',
  },
  {
    title: 'How We Use Your Data',
    body: 'Your data is used solely to provide the app\'s features: displaying profiles, showing timelines, and scheduling meeting reminders. Nothing else.',
  },
  {
    title: 'Data Storage',
    body: 'All information is stored locally in your device\'s private app storage using AsyncStorage. It is never synced, backed up, or transmitted over the internet by this app.',
  },
  {
    title: 'Notifications',
    body: 'If you set a meeting reminder, a local notification is scheduled on your device. No notification data is sent to any external server. You can disable notifications at any time in your device settings.',
  },
  {
    title: 'Photos & Camera',
    body: 'Photo access is requested only when you choose to set a profile picture. Photos are stored locally within the app. We do not access your photo library beyond what you explicitly select.',
  },
  {
    title: 'Third-Party Services',
    body: 'People Memory does not use any analytics, advertising, or tracking services. We do not integrate with any third-party data platforms.',
  },
  {
    title: 'Data Deletion',
    body: 'You can delete any person\'s data at any time from within the app. Uninstalling the app permanently removes all stored data from your device.',
  },
  {
    title: 'Children\'s Privacy',
    body: 'This app is not directed at children under 13 and does not knowingly collect data from children.',
  },
  {
    title: 'Changes to This Policy',
    body: 'If this privacy policy changes, the updated version will be available within the app. Continued use of the app after changes constitutes acceptance of the new policy.',
  },
  {
    title: 'Contact',
    body: 'For any privacy-related questions, contact us at: privacy@peoplememory.app',
  },
];

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.root, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) }]}>
      <View style={s.navbar}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </Pressable>
        <Text style={s.title}>PRIVACY POLICY</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}
      >
        <Text style={s.lastUpdated}>Last updated: March 2026</Text>
        <Text style={s.intro}>
          People Memory is designed with privacy as a core principle. Your data belongs to you and stays on your device.
        </Text>

        {SECTIONS.map((sec, i) => (
          <View key={i} style={s.section}>
            <Text style={s.sectionTitle}>{sec.title}</Text>
            <Text style={s.sectionBody}>{sec.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.panel, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  title: { fontSize: 12, fontFamily: 'Inter_700Bold', color: C.textMuted, letterSpacing: 3 },
  lastUpdated: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textDim, marginBottom: 12 },
  intro: { fontSize: 15, fontFamily: 'Inter_500Medium', color: C.textBright, lineHeight: 24, marginBottom: 24, padding: 16, backgroundColor: C.panel, borderRadius: 12, borderWidth: 1, borderColor: C.accent + '44' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: C.textBright, marginBottom: 6 },
  sectionBody: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.text, lineHeight: 22 },
});
