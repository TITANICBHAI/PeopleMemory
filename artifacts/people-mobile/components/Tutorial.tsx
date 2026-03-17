import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import C from '@/constants/colors';

const { width: W, height: H } = Dimensions.get('window');

interface Step {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  body: string;
  hintPosition: 'top' | 'middle' | 'bottom';
}

const STEPS: Step[] = [
  {
    icon: 'search',
    title: 'Search your people',
    body: 'Find anyone instantly by name, tags, notes, or anything you remember about them.',
    hintPosition: 'top',
  },
  {
    icon: 'tag',
    title: 'Filter by tags',
    body: 'Use "Friend", "Work", "Family" or create your own tags to organise your connections.',
    hintPosition: 'top',
  },
  {
    icon: 'user',
    title: 'Full person profile',
    body: 'Tap any card to open a detailed profile — trust level, notes, likes, dates and more.',
    hintPosition: 'middle',
  },
  {
    icon: 'plus-circle',
    title: 'Add someone now',
    body: 'Tap the + button to start building your memory. The more you add, the more you remember.',
    hintPosition: 'bottom',
  },
];

interface Props {
  onDone: () => void;
}

export default function Tutorial({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(40)).current;
  const overlayFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(overlayFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    animateIn();
  }, []);

  useEffect(() => {
    animateIn();
  }, [step]);

  const animateIn = () => {
    fadeAnim.setValue(0);
    cardAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(cardAnim, { toValue: 0, tension: 120, friction: 10, useNativeDriver: true }),
    ]).start();
  };

  const next = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < STEPS.length - 1) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
        setStep(s => s + 1);
      });
    } else {
      Animated.timing(overlayFade, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        onDone();
      });
    }
  };

  const skip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(overlayFade, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      onDone();
    });
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const cardTop =
    current.hintPosition === 'top'
      ? H * 0.18
      : current.hintPosition === 'middle'
      ? H * 0.38
      : H * 0.58;

  return (
    <Animated.View style={[s.overlay, { opacity: overlayFade, pointerEvents: 'box-none' }]}>
      {/* Dark overlay */}
      <View style={s.dark} />

      {/* Glowing spotlight based on position */}
      <View style={[
        s.spotlight,
        current.hintPosition === 'top' && s.spotTop,
        current.hintPosition === 'middle' && s.spotMid,
        current.hintPosition === 'bottom' && s.spotBot,
      ]} />

      {/* Skip button */}
      <Pressable style={s.skipBtn} onPress={skip}>
        <Text style={s.skipText}>Skip</Text>
      </Pressable>

      {/* Step card */}
      <Animated.View
        style={[
          s.card,
          {
            top: cardTop,
            opacity: fadeAnim,
            transform: [{ translateY: cardAnim }],
          },
        ]}
      >
        <View style={s.iconCircle}>
          <Feather name={current.icon} size={22} color={C.accent} />
        </View>
        <Text style={s.cardTitle}>{current.title}</Text>
        <Text style={s.cardBody}>{current.body}</Text>

        {/* Dots */}
        <View style={s.dots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[s.dot, i === step && s.dotActive]}
            />
          ))}
        </View>

        <Pressable style={s.nextBtn} onPress={next}>
          <Text style={s.nextText}>{isLast ? 'Get Started' : 'Next'}</Text>
          <Feather
            name={isLast ? 'check' : 'arrow-right'}
            size={16}
            color={C.textBright}
          />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const CARD_W = Math.min(W - 40, 340);

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  dark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000CC',
  },
  spotlight: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: C.accent + '99',
    backgroundColor: C.accent + '10',
    ...(Platform.select({
      ios: { shadowColor: C.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 16 },
      default: {},
    })),
  },
  spotTop: { top: 140 },
  spotMid: { top: 195 },
  spotBot: {
    left: undefined,
    right: 22,
    bottom: 28,
    width: 58,
    height: 58,
    borderRadius: 29,
    top: undefined,
  },
  skipBtn: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 80 : 56,
    right: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: C.textMuted,
  },
  card: {
    position: 'absolute',
    left: (W - CARD_W) / 2,
    width: CARD_W,
    backgroundColor: C.panel,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: C.accent + '44',
    alignItems: 'center',
    gap: 10,
    ...(Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 24 },
      default: { elevation: 16 },
    })),
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.accent + '22',
    borderWidth: 1,
    borderColor: C.accent + '44',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: C.textBright,
    textAlign: 'center',
  },
  cardBody: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.border,
  },
  dotActive: {
    width: 18,
    backgroundColor: C.accent,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.accent,
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
    marginTop: 4,
    width: '100%',
    justifyContent: 'center',
  },
  nextText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: C.textBright,
  },
});
