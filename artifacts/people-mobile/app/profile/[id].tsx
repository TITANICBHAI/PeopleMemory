import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
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

function formatInteractionDate(s: string) {
  try {
    const d = new Date(s);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: diffDays > 365 ? 'numeric' : undefined });
  } catch { return s; }
}

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPersonById, deletePerson, addInteraction, deleteInteraction } = useApp();
  const insets = useSafeAreaInsets();
  const person = getPersonById(id);

  const [logModalVisible, setLogModalVisible] = useState(false);
  const [logNote, setLogNote] = useState('');
  const [saving, setSaving] = useState(false);

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

  const handleSaveInteraction = async () => {
    if (!logNote.trim()) return;
    setSaving(true);
    await addInteraction(person.id, logNote);
    setSaving(false);
    setLogNote('');
    setLogModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDeleteInteraction = (interactionId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Delete entry?', 'This interaction log entry will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteInteraction(person.id, interactionId),
      },
    ]);
  };

  const allDates = [
    ...(person.birthday ? [{ date: person.birthday, label: 'Birthday', extra: undefined as string | undefined }] : []),
    ...(person.firstMet ? [{ date: person.firstMet, label: 'First met', extra: undefined }] : []),
    ...(person.lastMet ? [{ date: person.lastMet, label: 'Last met', extra: undefined }] : []),
    ...(person.nextMeeting ? [{ date: person.nextMeeting, label: 'Next meeting', extra: person.nextMeetingTime }] : []),
    ...person.customDates.map(d => ({ date: d.date, label: d.label, extra: undefined })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const interactions = person.interactions ?? [];

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
            {person.phone ? (
              <Pressable
                style={s.phoneRow}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Linking.openURL(`tel:${person.phone}`);
                }}
              >
                <Feather name="phone" size={13} color={C.green} />
                <Text style={s.phoneText}>{person.phone}</Text>
                <View style={s.callBadge}>
                  <Text style={s.callBadgeText}>Call</Text>
                </View>
              </Pressable>
            ) : null}
            {person.tags.length > 0 && (
              <View style={s.tagRow}>
                {person.tags.map(t => <TagChip key={t} tag={t} />)}
              </View>
            )}
          </View>
        </View>

        {person.trustLevel !== null && person.trustLevel !== undefined && (
          <TrustBar level={person.trustLevel} />
        )}

        {person.description ? (
          <SectionCard title="Description">
            <Text style={s.bodyText}>{person.description}</Text>
          </SectionCard>
        ) : null}

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

        {person.thingsToRemember ? (
          <SectionCard title="Remember">
            <Text style={s.bodyText}>{person.thingsToRemember}</Text>
          </SectionCard>
        ) : null}

        {person.quickFacts ? (
          <SectionCard title="Quick Facts">
            <Text style={s.bodyText}>{person.quickFacts}</Text>
          </SectionCard>
        ) : null}

        {allDates.length > 0 ? (
          <SectionCard title="Timeline">
            {allDates.map((d, i) => (
              <View key={i} style={[tl.item, i > 0 && tl.itemBorder]}>
                <View style={tl.dot} />
                <View style={tl.content}>
                  <Text style={tl.dateLabel}>{d.label}</Text>
                  <Text style={tl.date}>
                    {formatDate(d.date)}{d.extra ? `  ·  ${d.extra}` : ''}
                  </Text>
                  {d.extra && (
                    <View style={tl.bellRow}>
                      <Feather name="bell" size={11} color={C.green} />
                      <Text style={tl.bellText}>Reminder set</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </SectionCard>
        ) : null}

        {/* Interaction Log */}
        <View style={il.wrap}>
          <View style={il.header}>
            <Text style={il.headerText}>INTERACTION LOG</Text>
            <Pressable
              style={il.addBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setLogModalVisible(true);
              }}
            >
              <Feather name="plus" size={14} color={C.accent} />
              <Text style={il.addBtnText}>Log</Text>
            </Pressable>
          </View>

          <View style={il.card}>
            {interactions.length === 0 ? (
              <View style={il.empty}>
                <Feather name="message-circle" size={28} color={C.textDim} />
                <Text style={il.emptyText}>No interactions logged yet</Text>
                <Text style={il.emptySubText}>Tap "Log" to record a conversation or meeting</Text>
              </View>
            ) : (
              interactions.map((item, i) => (
                <View key={item.id} style={[il.entry, i > 0 && il.entryBorder]}>
                  <View style={il.entryDot} />
                  <View style={il.entryContent}>
                    <Text style={il.entryDate}>{formatInteractionDate(item.date)}</Text>
                    <Text style={il.entryNote}>{item.note}</Text>
                  </View>
                  <Pressable
                    style={il.deleteEntry}
                    onPress={() => handleDeleteInteraction(item.id)}
                    hitSlop={8}
                  >
                    <Feather name="x" size={14} color={C.textDim} />
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={{ marginHorizontal: 16, marginTop: 8 }}>
          <Text style={s.meta}>Added {formatDate(person.createdAt)}</Text>
        </View>
      </ScrollView>

      {/* Add Interaction Modal */}
      <Modal
        visible={logModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLogModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={m.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={m.backdrop} onPress={() => setLogModalVisible(false)} />
          <View style={m.sheet}>
            <View style={m.handle} />
            <Text style={m.title}>Log Interaction</Text>
            <Text style={m.subtitle}>What happened with {person.name}?</Text>
            <TextInput
              style={m.input}
              placeholder="e.g. Had coffee, talked about new job offer..."
              placeholderTextColor={C.textDim}
              value={logNote}
              onChangeText={setLogNote}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoFocus
              maxLength={500}
            />
            <Text style={m.charCount}>{logNote.length}/500</Text>
            <View style={m.actions}>
              <Pressable style={m.cancelBtn} onPress={() => { setLogModalVisible(false); setLogNote(''); }}>
                <Text style={m.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[m.saveBtn, (!logNote.trim() || saving) && m.saveBtnDisabled]}
                onPress={handleSaveInteraction}
                disabled={!logNote.trim() || saving}
              >
                <Text style={m.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  bellRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  bellText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.green },
});

const il = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  headerText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: C.textMuted, letterSpacing: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.accent + '20', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: C.accent + '40',
  },
  addBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: C.accent },
  card: {
    backgroundColor: C.panel, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
  },
  empty: { alignItems: 'center', paddingVertical: 28, gap: 8 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: C.textMuted },
  emptySubText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textDim, textAlign: 'center', paddingHorizontal: 20 },
  entry: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  entryBorder: { borderTopWidth: 1, borderTopColor: C.border },
  entryDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accentGlow, marginTop: 5 },
  entryContent: { flex: 1 },
  entryDate: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: C.textMuted, marginBottom: 4 },
  entryNote: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.text, lineHeight: 20 },
  deleteEntry: { padding: 4 },
});

const m = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: C.panel, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    borderWidth: 1, borderColor: C.border,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: C.textBright, marginBottom: 4 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textMuted, marginBottom: 16 },
  input: {
    backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    padding: 14, fontSize: 14, fontFamily: 'Inter_400Regular', color: C.text,
    minHeight: 100, marginBottom: 6,
  },
  charCount: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textDim, textAlign: 'right', marginBottom: 20 },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: C.bg, alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  cancelText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: C.textMuted },
  saveBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: C.accent, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
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
    width: 40, height: 40, borderRadius: 12, backgroundColor: C.panel,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: C.panel,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  navActions: { flexDirection: 'row', gap: 8 },
  deleteBtn: { borderColor: C.red + '44' },
  hero: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 24, gap: 18,
  },
  avatarRing: {
    borderRadius: 999, padding: 3,
    borderWidth: 3, borderColor: '#3A7EFF',
    shadowColor: '#3A7EFF', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 10, elevation: 8,
  },
  heroInfo: { flex: 1, gap: 10 },
  name: { fontSize: 26, fontFamily: 'Inter_700Bold', color: C.textBright, lineHeight: 30 },
  tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6, marginTop: 2 },
  phoneText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textBright },
  callBadge: { backgroundColor: C.green + '22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: C.green + '55' },
  callBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: C.green },
  splitRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, gap: 10 },
  splitCard: {
    flex: 1, backgroundColor: C.panel, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.border, gap: 6,
  },
  splitLabel: {
    fontSize: 10, fontFamily: 'Inter_600SemiBold', color: C.textMuted,
    letterSpacing: 2, textTransform: 'uppercase',
  },
  bodyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.text, lineHeight: 22 },
  meta: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textDim, textAlign: 'center' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: C.textMuted, fontFamily: 'Inter_400Regular' },
});
