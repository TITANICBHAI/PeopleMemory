import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarDisplay, AvatarValue } from '@/components/AvatarPicker';
import { avatarColorForName, useColors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { calculateHealthScore } from '@/utils/health';

function photoUriToAvatarValue(uri?: string): AvatarValue {
  if (!uri) return { type: 'initials' };
  if (uri.startsWith('preset:')) return { type: 'preset', presetId: uri.slice(7) };
  return { type: 'photo', photoUri: uri };
}

function formatDate(s?: string) {
  if (!s) return null;
  try {
    return new Date(s).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  } catch { return s; }
}

function daysUntilLabel(dateStr: string): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff > 0) return `In ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

function InfoBlock({ label, text, color }: { label: string; text: string; color?: string }) {
  const C = useColors();
  return (
    <View style={ib.wrap}>
      <Text style={[ib.label, { color: C.textMuted }]}>{label}</Text>
      <Text style={[ib.text, { color: color ?? C.text }]}>{text}</Text>
    </View>
  );
}
const ib = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 5 },
  text: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21 },
});

export default function PrepScreen() {
  const C = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPersonById, addInteraction } = useApp();
  const insets = useSafeAreaInsets();
  const person = getPersonById(id);

  const [logVisible, setLogVisible] = useState(false);
  const [logNote, setLogNote] = useState('');
  const [saving, setSaving] = useState(false);

  if (!person) {
    return (
      <View style={[s.root, { paddingTop: insets.top, backgroundColor: C.bg }]}>
        <Text style={[{ color: C.textMuted, textAlign: 'center', marginTop: 40 }]}>Person not found</Text>
      </View>
    );
  }

  const health = calculateHealthScore(person);
  const nc = avatarColorForName(person.name);
  const initials = person.name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');

  const lastInteraction = person.interactions?.length
    ? [...person.interactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;

  const upcomingDates: { label: string; date: string }[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (person.nextMeeting) {
    upcomingDates.push({ label: 'Next Meeting', date: person.nextMeeting });
  }
  if (person.birthday) {
    const bd = new Date(person.birthday);
    const thisYear = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
    if (thisYear < now) thisYear.setFullYear(now.getFullYear() + 1);
    const diffs = Math.round((thisYear.getTime() - now.getTime()) / 86400000);
    if (diffs <= 60) {
      upcomingDates.push({ label: 'Birthday', date: thisYear.toISOString().slice(0, 10) });
    }
  }
  for (const cd of person.customDates ?? []) {
    const d = new Date(cd.date);
    if (d >= now) {
      upcomingDates.push({ label: cd.label, date: cd.date });
    }
  }
  upcomingDates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleSaveLog = async () => {
    if (!logNote.trim()) return;
    setSaving(true);
    await addInteraction(person.id, logNote);
    setSaving(false);
    setLogNote('');
    setLogVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0), backgroundColor: C.bg }]}>
      <View style={[s.navbar, { borderBottomColor: C.border }]}>
        <Pressable style={[s.iconBtn, { backgroundColor: C.panel, borderColor: C.border }]} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </Pressable>
        <Text style={[s.navTitle, { color: C.textMuted }]}>BEFORE YOU MEET</Text>
        <Pressable
          style={[s.iconBtn, { backgroundColor: C.panel, borderColor: C.border }]}
          onPress={() => router.push({ pathname: '/profile/[id]', params: { id: person.id } })}
        >
          <Feather name="user" size={18} color={C.accent} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}>

        {/* Hero */}
        <View style={[s.hero, { backgroundColor: C.panel, borderColor: C.border }]}>
          <View style={[s.avatarRing, { borderColor: health.color + '66', backgroundColor: health.color + '15' }]}>
            <AvatarDisplay
              value={photoUriToAvatarValue(person.photoUri)}
              name={person.name}
              size={72}
            />
          </View>
          <View style={s.heroInfo}>
            <Text style={[s.name, { color: C.textBright }]}>{person.name}</Text>
            {person.tags.length > 0 && (
              <Text style={[s.tags, { color: C.textMuted }]}>{person.tags.join(' · ')}</Text>
            )}
            <View style={[s.healthPill, { backgroundColor: health.color + '22', borderColor: health.color + '55' }]}>
              <View style={[s.healthDot, { backgroundColor: health.color }]} />
              <Text style={[s.healthLabel, { color: health.color }]}>{health.label} relationship · {health.reason}</Text>
            </View>
          </View>
        </View>

        {/* Last Interaction */}
        {lastInteraction ? (
          <View style={[s.section, { backgroundColor: C.panel, borderColor: C.accent + '44' }]}>
            <View style={s.sectionHeader}>
              <Feather name="message-circle" size={14} color={C.accent} />
              <Text style={[s.sectionTitle, { color: C.accent }]}>Last Interaction</Text>
            </View>
            <Text style={[s.sectionDate, { color: C.textMuted }]}>
              {new Date(lastInteraction.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
            <Text style={[s.sectionBody, { color: C.text }]}>{lastInteraction.note}</Text>
          </View>
        ) : (
          <View style={[s.section, { backgroundColor: C.panel, borderColor: C.border }]}>
            <Text style={[s.sectionBody, { color: C.textDim }]}>No interactions logged yet.</Text>
          </View>
        )}

        {/* Upcoming */}
        {upcomingDates.length > 0 && (
          <View style={[s.section, { backgroundColor: C.panel, borderColor: C.border }]}>
            <View style={s.sectionHeader}>
              <Feather name="calendar" size={14} color={C.accent} />
              <Text style={[s.sectionTitle, { color: C.textMuted }]}>Upcoming</Text>
            </View>
            {upcomingDates.map((ud, i) => (
              <View key={i} style={[s.dateRow, i > 0 && { borderTopColor: C.border, borderTopWidth: 1, marginTop: 10, paddingTop: 10 }]}>
                <Text style={[s.dateName, { color: C.textBright }]}>{ud.label}</Text>
                <Text style={[s.dateValue, { color: C.accent }]}>{daysUntilLabel(ud.date)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Likes & Dislikes */}
        {(person.likes || person.dislikes) ? (
          <View style={s.splitRow}>
            {person.likes ? (
              <View style={[s.splitCard, { backgroundColor: C.panel, borderColor: C.border }]}>
                <View style={s.sectionHeader}>
                  <Feather name="thumbs-up" size={13} color={C.green} />
                  <Text style={[s.sectionTitle, { color: C.green }]}>Likes</Text>
                </View>
                <Text style={[s.sectionBody, { color: C.text }]}>{person.likes}</Text>
              </View>
            ) : null}
            {person.dislikes ? (
              <View style={[s.splitCard, { backgroundColor: C.panel, borderColor: C.border }]}>
                <View style={s.sectionHeader}>
                  <Feather name="thumbs-down" size={13} color={C.red} />
                  <Text style={[s.sectionTitle, { color: C.red }]}>Dislikes</Text>
                </View>
                <Text style={[s.sectionBody, { color: C.text }]}>{person.dislikes}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Remember */}
        {person.thingsToRemember ? (
          <View style={[s.section, { backgroundColor: C.panel, borderColor: '#E5C07B44' }]}>
            <View style={s.sectionHeader}>
              <Feather name="alert-circle" size={14} color="#E5C07B" />
              <Text style={[s.sectionTitle, { color: '#E5C07B' }]}>Remember</Text>
            </View>
            <Text style={[s.sectionBody, { color: C.text }]}>{person.thingsToRemember}</Text>
          </View>
        ) : null}

        {/* Quick Facts */}
        {person.quickFacts ? (
          <View style={[s.section, { backgroundColor: C.panel, borderColor: C.border }]}>
            <View style={s.sectionHeader}>
              <Feather name="zap" size={14} color={C.accent} />
              <Text style={[s.sectionTitle, { color: C.textMuted }]}>Quick Facts</Text>
            </View>
            <Text style={[s.sectionBody, { color: C.text }]}>{person.quickFacts}</Text>
          </View>
        ) : null}

        {/* Description */}
        {person.description ? (
          <View style={[s.section, { backgroundColor: C.panel, borderColor: C.border }]}>
            <View style={s.sectionHeader}>
              <Feather name="info" size={14} color={C.textMuted} />
              <Text style={[s.sectionTitle, { color: C.textMuted }]}>About</Text>
            </View>
            <Text style={[s.sectionBody, { color: C.text }]}>{person.description}</Text>
          </View>
        ) : null}

        {/* Log CTA */}
        <Pressable
          style={[s.logBtn, { backgroundColor: C.accent }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setLogVisible(true);
          }}
        >
          <Feather name="plus-circle" size={18} color="#fff" />
          <Text style={s.logBtnText}>Log This Interaction</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={logVisible} transparent animationType="slide" onRequestClose={() => setLogVisible(false)}>
        <KeyboardAvoidingView style={m.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={m.backdrop} onPress={() => setLogVisible(false)} />
          <View style={[m.sheet, { backgroundColor: C.panel, borderColor: C.border }]}>
            <View style={[m.handle, { backgroundColor: C.border }]} />
            <Text style={[m.title, { color: C.textBright }]}>Log Interaction</Text>
            <Text style={[m.sub, { color: C.textMuted }]}>What happened with {person.name}?</Text>
            <TextInput
              style={[m.input, { backgroundColor: C.bg, borderColor: C.border, color: C.text }]}
              placeholder="e.g. Met for coffee, talked about their new project…"
              placeholderTextColor={C.textDim}
              value={logNote}
              onChangeText={setLogNote}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoFocus
              maxLength={500}
            />
            <Text style={[m.charCount, { color: C.textDim }]}>{logNote.length}/500</Text>
            <View style={m.actions}>
              <Pressable style={[m.cancelBtn, { backgroundColor: C.bg, borderColor: C.border }]} onPress={() => { setLogVisible(false); setLogNote(''); }}>
                <Text style={[m.cancelText, { color: C.textMuted }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[m.saveBtn, { backgroundColor: C.accent }, (!logNote.trim() || saving) && m.disabled]}
                onPress={handleSaveLog}
                disabled={!logNote.trim() || saving}
              >
                <Text style={m.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1,
  },
  navTitle: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 3 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  scroll: { padding: 16, gap: 12 },
  hero: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    borderRadius: 18, padding: 16, borderWidth: 1,
  },
  avatarRing: { borderRadius: 999, padding: 3, borderWidth: 2 },
  heroInfo: { flex: 1, gap: 6 },
  name: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  tags: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  healthPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, alignSelf: 'flex-start',
  },
  healthDot: { width: 6, height: 6, borderRadius: 3 },
  healthLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  section: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.5, textTransform: 'uppercase' },
  sectionDate: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  sectionBody: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  dateRow: {},
  dateName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  dateValue: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  splitRow: { flexDirection: 'row', gap: 10 },
  splitCard: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1, gap: 8 },
  logBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 14, paddingVertical: 16, marginTop: 8,
  },
  logBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});

const m = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderWidth: 1 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  sub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 16 },
  input: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 14, fontFamily: 'Inter_400Regular', minHeight: 100, marginBottom: 6 },
  charCount: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'right', marginBottom: 20 },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  cancelText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  disabled: { opacity: 0.4 },
  saveText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
