import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarDisplay, AvatarValue } from '@/components/AvatarPicker';
import C from '@/constants/colors';
import { useApp } from '@/context/AppContext';

function photoUriToAvatarValue(uri?: string): AvatarValue {
  if (!uri) return { type: 'initials' };
  if (uri.startsWith('preset:')) return { type: 'preset', presetId: uri.slice(7) };
  return { type: 'photo', photoUri: uri };
}

function TagChip({ tag }: { tag: string }) {
  const key = tag.toLowerCase() as keyof typeof C.tag;
  const colors = C.tag[key] ?? C.tag.custom;
  return (
    <View style={[tg.wrap, { backgroundColor: colors.bg }]}>
      <Text style={tg.diamond}>◆</Text>
      <Text style={[tg.text, { color: colors.text }]}>{tag}</Text>
    </View>
  );
}
const tg = StyleSheet.create({
  wrap: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 5 },
  diamond: { fontSize: 8, color: '#4A9EFF' },
  text: { fontSize: 12, fontFamily: 'Inter_500Medium', letterSpacing: 0.3 },
});

function TrustBar({ level }: { level: number }) {
  const color = level <= 3 ? C.red : level <= 6 ? C.yellow : C.green;
  const label = level <= 3 ? 'Low Trust' : level <= 6 ? 'Moderate Trust' : 'High Trust';
  return (
    <View style={tr.wrap}>
      <Text style={tr.heading}>Trust Level</Text>
      <View style={tr.row}>
        <View style={tr.barBg}>
          <View style={[tr.barFill, { width: `${level * 10}%` as any, backgroundColor: color }]} />
        </View>
        <Text style={[tr.label, { color }]}>{label}</Text>
      </View>
    </View>
  );
}
const tr = StyleSheet.create({
  wrap: { paddingHorizontal: 16, marginBottom: 20 },
  heading: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: C.textMuted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  barBg: { flex: 1, height: 8, backgroundColor: C.border, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  label: { fontSize: 13, fontFamily: 'Inter_600SemiBold', minWidth: 80, textAlign: 'right' },
});

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sc.wrap}>
      <Text style={sc.title}>{title}</Text>
      <View style={sc.card}>{children}</View>
    </View>
  );
}
const sc = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginBottom: 12 },
  title: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: C.textMuted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  card: {
    backgroundColor: C.panel,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
});

function formatDate(s?: string) {
  if (!s) return null;
  try {
    return new Date(s).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return s; }
}

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPersonById, deletePerson } = useApp();
  const insets = useSafeAreaInsets();
  const person = getPersonById(id);

  if (!person) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </Pressable>
        <View style={s.notFound}>
          <Text style={s.notFoundText}>Person not found</Text>
        </View>
      </View>
    );
  }

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      `Delete ${person.name}?`,
      'All data for this person will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePerson(person.id);
            router.replace('/dashboard');
          },
        },
      ]
    );
  };

  const allDates = [
    ...(person.birthday ? [{ date: person.birthday, label: 'Birthday' }] : []),
    ...(person.firstMet ? [{ date: person.firstMet, label: 'First met' }] : []),
    ...(person.lastMet ? [{ date: person.lastMet, label: 'Last met' }] : []),
    ...(person.nextMeeting ? [{ date: person.nextMeeting, label: 'Next meeting' }] : []),
    ...person.customDates.map(d => ({ date: d.date, label: d.label })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <View style={[s.root, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) }]}>
      <View style={s.navbar}>
        <Pressable style={s.navIconBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </Pressable>
        <View style={s.navActions}>
          <Pressable
            style={s.navIconBtn}
            onPress={() => router.push({ pathname: '/edit/[id]', params: { id: person.id } })}
          >
            <Feather name="edit-2" size={18} color={C.accent} />
          </Pressable>
          <Pressable style={[s.navIconBtn, s.deleteBtn]} onPress={handleDelete}>
            <Feather name="trash-2" size={18} color={C.red} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* Hero: Avatar left, Name + Tags right */}
        <View style={s.hero}>
          <View style={s.avatarRing}>
            <AvatarDisplay
              value={photoUriToAvatarValue(person.photoUri)}
              name={person.name}
              size={88}
            />
          </View>
          <View style={s.heroInfo}>
            <Text style={s.name}>{person.name}</Text>
            {person.tags.length > 0 && (
              <View style={s.tagRow}>
                {person.tags.map(t => <TagChip key={t} tag={t} />)}
              </View>
            )}
          </View>
        </View>

        {/* Trust Level */}
        {person.trustLevel !== null && person.trustLevel !== undefined && (
          <TrustBar level={person.trustLevel} />
        )}

        {/* Description */}
        {person.description ? (
          <SectionCard title="Description">
            <Text style={s.bodyText}>{person.description}</Text>
          </SectionCard>
        ) : null}

        {/* Likes & Dislikes side by side */}
        {(person.likes || person.dislikes) ? (
          <View style={s.splitRow}>
            {person.likes ? (
              <View style={s.splitCard}>
                <Text style={s.splitLabel}>Likes</Text>
                <Text style={s.bodyText}>{person.likes}</Text>
              </View>
            ) : null}
            {person.dislikes ? (
              <View style={s.splitCard}>
                <Text style={s.splitLabel}>Dislikes</Text>
                <Text style={s.bodyText}>{person.dislikes}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Remember */}
        {person.thingsToRemember ? (
          <SectionCard title="Remember">
            <Text style={s.bodyText}>{person.thingsToRemember}</Text>
          </SectionCard>
        ) : null}

        {/* Quick Facts */}
        {person.quickFacts ? (
          <SectionCard title="Quick Facts">
            <Text style={s.bodyText}>{person.quickFacts}</Text>
          </SectionCard>
        ) : null}

        {/* Timeline */}
        {allDates.length > 0 ? (
          <SectionCard title="Timeline">
            {allDates.map((d, i) => (
              <View key={i} style={[tl.item, i > 0 && tl.itemBorder]}>
                <View style={tl.dot} />
                <View style={tl.content}>
                  <Text style={tl.dateLabel}>{d.label}</Text>
                  <Text style={tl.date}>{formatDate(d.date)}</Text>
                </View>
              </View>
            ))}
          </SectionCard>
        ) : null}

        <View style={{ marginHorizontal: 16, marginTop: 8 }}>
          <Text style={s.meta}>Added {formatDate(person.createdAt)}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const tl = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  itemBorder: { borderTopWidth: 1, borderTopColor: C.border },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent },
  content: { flex: 1 },
  dateLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: C.text },
  date: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted, marginTop: 2 },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  navIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.panel,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.panel,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  navActions: { flexDirection: 'row', gap: 8 },
  deleteBtn: { borderColor: C.red + '44' },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 18,
  },
  avatarRing: {
    borderRadius: 999,
    padding: 3,
    borderWidth: 3,
    borderColor: '#3A7EFF',
    shadowColor: '#3A7EFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  heroInfo: { flex: 1, gap: 10 },
  name: { fontSize: 26, fontFamily: 'Inter_700Bold', color: C.textBright, lineHeight: 30 },
  tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },

  splitRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  splitCard: {
    flex: 1,
    backgroundColor: C.panel,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    gap: 6,
  },
  splitLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: C.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  bodyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.text, lineHeight: 22 },
  meta: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textDim, textAlign: 'center' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: C.textMuted, fontFamily: 'Inter_400Regular' },
});
