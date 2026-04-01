import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'del'],
];

const PRIVACY_SECTIONS = [
  {
    title: 'What We Collect',
    body: 'People Memory stores all data you enter — names, notes, trust levels, dates, and avatars — exclusively on your device. No data is ever sent to any server, cloud, or third party.',
  },
  {
    title: 'Data Storage',
    body: 'All information lives in your device\'s private local storage. It is never synced, backed up, or transmitted over the internet by this app.',
  },
  {
    title: 'Notifications',
    body: 'If you set a meeting reminder, a local notification is scheduled entirely on your device. No notification data is sent to any external server.',
  },
  {
    title: 'Photos & Camera',
    body: 'Photo access is requested only when you choose to set a profile picture. We do not access your library beyond what you explicitly select.',
  },
  {
    title: 'Third-Party Services',
    body: 'People Memory does not use any analytics, advertising, or tracking services.',
  },
  {
    title: 'Data Deletion',
    body: 'You can delete any person\'s data at any time from within the app. Uninstalling the app permanently removes all data from your device.',
  },
  {
    title: 'Contact',
    body: 'Privacy questions: privacy@peoplememory.app',
  },
];

function PrivacyAcceptScreen({ onAccept }: { onAccept: () => void }) {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = ({ nativeEvent }: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
    if (isBottom) setScrolledToBottom(true);
  };

  return (
    <View style={[pv.root, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0), backgroundColor: C.bg }]}>
      <View style={pv.header}>
        <View style={[pv.logoWrap, { backgroundColor: C.panel, borderColor: C.accent + '55' }]}>
          <Feather name="shield" size={22} color={C.accent} />
        </View>
        <Text style={[pv.title, { color: C.textBright }]}>Privacy Policy</Text>
        <Text style={[pv.subtitle, { color: C.textMuted }]}>Please read before you continue</Text>
      </View>

      <ScrollView
        style={pv.scroll}
        contentContainerStyle={pv.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={[pv.highlight, { backgroundColor: C.accent + '18', borderColor: C.accent + '44' }]}>
          <Feather name="lock" size={14} color={C.accent} />
          <Text style={[pv.highlightText, { color: C.textBright }]}>
            Your data stays on your device. Nothing is ever sent to any server.
          </Text>
        </View>

        {PRIVACY_SECTIONS.map((sec, i) => (
          <View key={i} style={pv.section}>
            <Text style={[pv.sectionTitle, { color: C.textBright }]}>{sec.title}</Text>
            <Text style={[pv.sectionBody, { color: C.text }]}>{sec.body}</Text>
          </View>
        ))}

        <View style={[pv.lastUpdated, { borderTopColor: C.border }]}>
          <Text style={[pv.lastUpdatedText, { color: C.textDim }]}>Last updated: March 2026 · Version 1.0</Text>
        </View>
      </ScrollView>

      <View style={[pv.footer, { paddingBottom: insets.bottom + 16, borderTopColor: C.border }]}>
        {!scrolledToBottom && (
          <Text style={[pv.scrollHint, { color: C.textDim }]}>↓ Scroll to read the full policy</Text>
        )}
        <Pressable
          style={[pv.acceptBtn, !scrolledToBottom ? { backgroundColor: C.border } : { backgroundColor: C.accent }]}
          onPress={() => {
            if (!scrolledToBottom) return;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onAccept();
          }}
        >
          <Feather name="check" size={18} color={C.textBright} />
          <Text style={[pv.acceptBtnText, { color: C.textBright }]}>I Accept & Continue</Text>
        </Pressable>
        <Text style={[pv.footerNote, { color: C.textDim }]}>
          By continuing, you agree to this privacy policy.
        </Text>
      </View>
    </View>
  );
}

const pv = StyleSheet.create({
  root: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 24, paddingBottom: 16, paddingHorizontal: 24, gap: 6 },
  logoWrap: { width: 52, height: 52, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 16 },
  highlight: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 20,
  },
  highlightText: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium', lineHeight: 22 },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  sectionBody: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  lastUpdated: { paddingTop: 12, borderTopWidth: 1, marginTop: 8 },
  lastUpdatedText: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  footer: { padding: 20, gap: 10, borderTopWidth: 1 },
  scrollHint: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  acceptBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 16,
  },
  acceptBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  footerNote: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});

export default function PinScreen() {
  const C = useColors();
  const { pinHash, isUnlocked, isLoading, hasAcceptedPrivacy, setupPin, verifyPin, acceptPrivacy } = useApp();
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'set' | 'confirm' | 'verify'>('verify');
  const [error, setError] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const dotScale = useRef([...Array(6)].map(() => new Animated.Value(1))).current;

  const isSetup = !pinHash;
  const maxLen = 4;

  useEffect(() => {
    if (!isLoading && isUnlocked) {
      router.replace('/dashboard');
    }
  }, [isUnlocked, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      setStep(isSetup ? 'set' : 'verify');
    }
  }, [isSetup, isLoading]);

  const shake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const animateDot = (i: number) => {
    Animated.sequence([
      Animated.timing(dotScale[i], { toValue: 1.4, duration: 80, useNativeDriver: true }),
      Animated.timing(dotScale[i], { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const handleKey = async (key: string) => {
    if (key === '') return;
    setError('');

    if (key === 'del') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const cur = step === 'confirm' ? confirmPin : pin;
      if (step === 'confirm') setConfirmPin(cur.slice(0, -1));
      else setPin(cur.slice(0, -1));
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const cur = step === 'confirm' ? confirmPin : pin;
    if (cur.length >= maxLen) return;

    const next = cur + key;
    animateDot(next.length - 1);

    if (step === 'confirm') {
      setConfirmPin(next);
      if (next.length >= 4) {
        setTimeout(async () => {
          if (next === pin) {
            await setupPin(next);
          } else {
            setError('PINs do not match. Try again.');
            setConfirmPin('');
            setPin('');
            setStep('set');
            shake();
          }
        }, 150);
      }
    } else if (step === 'set') {
      setPin(next);
      if (next.length >= 4) {
        setTimeout(() => {
          setStep('confirm');
          setConfirmPin('');
        }, 200);
      }
    } else {
      setPin(next);
      if (next.length >= 4) {
        setTimeout(async () => {
          const ok = await verifyPin(next);
          if (!ok) {
            setError('Incorrect PIN');
            setPin('');
            shake();
          }
        }, 150);
      }
    }
  };

  const currentLen = step === 'confirm' ? confirmPin.length : pin.length;
  const title = step === 'set' ? 'Set Your PIN' : step === 'confirm' ? 'Confirm PIN' : 'Enter PIN';
  const subtitle =
    step === 'set'
      ? 'Choose a 4-digit PIN to protect your data'
      : step === 'confirm'
      ? 'Enter the same PIN again'
      : 'Your data is locked';

  if (isLoading) return <View style={{ flex: 1, backgroundColor: C.bg }} />;

  if (isSetup && !hasAcceptedPrivacy) {
    return <PrivacyAcceptScreen onAccept={acceptPrivacy} />;
  }

  return (
    <View style={[s.root, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0), paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0), backgroundColor: C.bg }]}>
      <View style={s.top}>
        <View style={[s.iconWrap, { backgroundColor: C.panel, borderColor: C.border }]}>
          <Feather name="lock" size={28} color={C.accent} />
        </View>
        <Text style={[s.title, { color: C.textBright }]}>{title}</Text>
        <Text style={[s.subtitle, { color: C.textMuted }]}>{subtitle}</Text>
      </View>

      <Animated.View style={[s.dots, { transform: [{ translateX: shakeAnim }] }]}>
        {[...Array(maxLen)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              s.dot,
              i < currentLen ? [s.dotFilled, { backgroundColor: C.accent }] : [s.dotEmpty, { backgroundColor: C.border }],
              { transform: [{ scale: i < currentLen ? dotScale[i] : 1 }] },
            ]}
          />
        ))}
      </Animated.View>

      {error ? <Text style={[s.error, { color: C.red }]}>{error}</Text> : <View style={{ height: 22 }} />}

      <View style={s.pad}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={s.row}>
            {row.map((k, ki) => (
              <Pressable
                key={ki}
                style={({ pressed }) => [
                  s.key,
                  { backgroundColor: C.panel, borderColor: C.border },
                  k === '' && s.keyInvisible,
                  pressed && k !== '' && { backgroundColor: C.panelHigh, borderColor: C.accent },
                ]}
                onPress={() => handleKey(k)}
                disabled={k === ''}
              >
                {k === 'del' ? (
                  <Feather name="delete" size={22} color={C.text} />
                ) : (
                  <Text style={[s.keyText, { color: C.textBright }]}>{k}</Text>
                )}
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 0 },
  top: { alignItems: 'center', gap: 8, marginBottom: 36 },
  iconWrap: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 1 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', maxWidth: 240 },
  dots: { flexDirection: 'row', gap: 14, marginBottom: 8 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  error: { fontSize: 13, fontFamily: 'Inter_500Medium', height: 22, textAlign: 'center' },
  pad: { gap: 12, marginTop: 28, width: 280 },
  row: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  key: { width: 82, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  keyInvisible: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyText: { fontSize: 22, fontFamily: 'Inter_400Regular' },
});
