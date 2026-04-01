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
import { useColors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';

function photoUriToAvatarValue(uri?: string): AvatarValue {
  if (!uri) return { type: 'initials' };
  if (uri.startsWith('preset:')) return { type: 'preset', presetId: uri.slice(7) };
  return { type: 'photo', photoUri: uri };
}

function TagChip({ tag }: { tag: string }) {
  const C = useColors();
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
  const C = useColors();
  const color = level <= 3 ? C.red : level <= 6 ? C.yellow : C.green;
  const label = level <= 3 ? 'Low Trust' : level <= 6 ? 'Moderate Trust' : 'High Trust';
  return (
    <View style={tr.wrap}>
      <Text style={[tr.heading, { color: C.textMuted }]}>Trust Level</Text>
      <View style={tr.row}>
        <View style={[tr.barBg, { backgroundColor: C.border }]}>
          <View style={[tr.barFill, { width: `${level * 10}%` as any, backgroundColor: color }]} />
        </View>
        <Text style={[tr.label, { color }]}>{label}</Text>
      </View>
    </View>
  );
}
const tr = StyleSheet.create({
  wrap: { paddingHorizontal: 16, marginBottom: 20 },
  heading: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  barBg: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  label: { fontSize: 13, fontFamily: 'Inter_600SemiBold', minWidth: 80, textAlign: 'right' },
});

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  const C = useColors();
  return (
    <View style={sc.wrap}>
      <Text style={[sc.title, { color: C.textMuted }]}>{title}</Text>
      <View style={[sc.card, { backgroundColor: C.panel, borderColor: C.border }]}>{children}</View>
    </View>
  );
}
const sc = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginBottom: 12 },
  title: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
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
  const C = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPersonById, deletePerson, addInteraction, deleteInteraction } = useApp();
  const insets = useSafeAreaInsets();
  const person = getPersonById(id);

  const [logModalVisible, setLogModalVisible] = useState(false);
  const [logNote, setLogNote] = useState('');
  const [saving, setSaving] = useState(false);

  if (!person) {
    return (
      <View style={[s.root, { paddingTop: insets.top, backgroundColor: C.bg }]}>
        <Pressable style={[s.backBtn, { backgroundColor: C.panel, borderColor: C.border }]} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </Pressable>
        <View style={s.notFound}>
          <Text style={[s.notFoundText, { color: C.textMuted }]}>Person not found</Text>
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
    <View style={[s.root, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0), backgroundColor: C.bg }]}>
      <View style={[s.navbar, { borderBottomColor: C.border }]}>
        <Pressable style={[s.navIconBtn, { backgroundColor: C.panel, borderColor: C.border }]} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </Pressable>
        <View style={s.navActions}>
          <Pressable
            style={[s.navIconBtn, { backgroundColor: C.panel, borderColor: C.border }]}
            onPress={() => router.push({ pathname: '/edit/[id]', params: { id: person.id } })}
          >
            <Feather name="edit-2" size={18} color={C.accent} />
          </Pressable>
          <Pressable style={[s.navIconBtn, { backgroundColor: C.panel, borderColor: C.border }]} onPress={handleDelete}>
            <Feather name="trash-2" size={18} color={C.red} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        <View style={[s.hero, { backgroundColor: C.panel, borderBottomColor: C.border }]}>
          <View style={[s.avatarRing, { borderColor: C.accent + '44', backgroundColor: C.accent + '15' }]}>
            <AvatarDisplay
              value={photoUriToAvatarValue(person.photoUri)}
              name={person.name}
              size={88}
            />
          </View>
          <View style={s.heroInfo}>
            <Text style={[s.name, { color: C.textBright }]}>{person.name}</Text>
            {person.phone ? (
              <Pressable
                style={s.phoneRow}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Linking.openURL(`tel:${person.phone}`);
                }}
              >
                <Feather name="phone" size={13} color={C.green} />
                <Text style={[s.phoneText, { color: C.textBright }]}>{person.phone}</Text>
                <View style={[s.callBadge, { backgroundColor: C.green + '22', borderColor: C.green + '55' }]}>
                  <Text style={[s.callBadgeText, { color: C.green }]}>Call</Text>
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
            <Text style={[s.bodyText, { color: C.text }]}>{person.description}</Text>
          </SectionCard>
        ) : null}

        {(person.likes || person.dislikes) ? (
          <View style={s.splitRow}>
            {person.likes ? (
              <View style={[s.splitCard, { backgroundColor: C.panel, borderColor: C.border }]}>
                <Text style={[s.splitLabel, { color: C.textMuted }]}>Likes</Text>
                <Text style={[s.bodyText, { color: C.text }]}>{person.likes}</Text>
              </View>
            ) : null}
            {person.dislikes ? (
              <View style={[s.splitCard, { backgroundColor: C.panel, borderColor: C.border }]}>
                <Text style={[s.splitLabel, { color: C.textMuted }]}>Dislikes</Text>
                <Text style={[s.bodyText, { color: C.text }]}>{person.dislikes}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {person.thingsToRemember ? (
          <SectionCard title="Remember">
            <Text style={[s.bodyText, { color: C.text }]}>{person.thingsToRemember}</Text>
          </SectionCard>
        ) : null}

        {person.quickFacts ? (
          <SectionCard title="Quick Facts">
            <Text style={[s.bodyText, { color: C.text }]}>{person.quickFacts}</Text>
          </SectionCard>
        ) : null}

        {allDates.length > 0 ? (
          <SectionCard title="Timeline">
            {allDates.map((d, i) => (
              <View key={i} style={[tl.item, i > 0 && [tl.itemBorder, { borderTopColor: C.border }]]}>
                <View style={[tl.dot, { backgroundColor: C.accent }]} />
                <View style={tl.content}>
                  <Text style={[tl.dateLabel, { color: C.text }]}>{d.label}</Text>
                  <Text style={[tl.date, { color: C.textMuted }]}>
                    {formatDate(d.date)}{d.extra ? `  ·  ${d.extra}` : ''}
                  </Text>
                  {d.extra && (
                    <View style={tl.bellRow}>
                      <Feather name="bell" size={11} color={C.green} />
                      <Text style={[tl.bellText, { color: C.green }]}>Reminder set</Text>
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
            <Text style={[il.headerText, { color: C.textMuted }]}>INTERACTION LOG</Text>
            <Pressable
              style={[il.addBtn, { backgroundColor: C.accent + '20', borderColor: C.accent + '40' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setLogModalVisible(true);
              }}
            >
              <Feather name="plus" size={14} color={C.accent} />
              <Text style={[il.addBtnText, { color: C.accent }]}>Log</Text>
            </Pressable>
          </View>

          <View style={[il.card, { backgroundColor: C.panel, borderColor: C.border }]}>
            {interactions.length === 0 ? (
              <View style={il.empty}>
                <Feather name="message-circle" size={28} color={C.textDim} />
                <Text style={[il.emptyText, { color: C.textMuted }]}>No interactions logged yet</Text>
                <Text style={[il.emptySubText, { color: C.textDim }]}>Tap "Log" to record a conversation or meeting</Text>
              </View>
            ) : (
              interactions.map((item, i) => (
                <View key={item.id} style={[il.entry, i > 0 && [il.entryBorder, { borderTopColor: C.border }]]}>
                  <View style={[il.entryDot, { backgroundColor: C.accentGlow }]} />
                  <View style={il.entryContent}>
                    <Text style={[il.entryDate, { color: C.textMuted }]}>{formatInteractionDate(item.date)}</Text>
                    <Text style={[il.entryNote, { color: C.text }]}>{item.note}</Text>
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
          <Text style={[s.meta, { color: C.textDim }]}>Added {formatDate(person.createdAt)}</Text>
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
          <View style={[m.sheet, { backgroundColor: C.panel, borderColor: C.border }]}>
            <View style={[m.handle, { backgroundColor: C.border }]} />
            <Text style={[m.title, { color: C.textBright }]}>Log Interaction</Text>
            <Text style={[m.subtitle, { color: C.textMuted }]}>What happened with {person.name}?</Text>
            <TextInput
              style={[m.input, { backgroundColor: C.bg, borderColor: C.border, color: C.text }]}
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
            <Text style={[m.charCount, { color: C.textDim }]}>{logNote.length}/500</Text>
            <View style={m.actions}>
              <Pressable style={[m.cancelBtn, { backgroundColor: C.bg, borderColor: C.border }]} onPress={() => { setLogModalVisible(false); setLogNote(''); }}>
                <Text style={[m.cancelText, { color: C.textMuted }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[m.saveBtn, { backgroundColor: C.accent }, (!logNote.trim() || saving) && m.saveBtnDisabled]}
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
  itemBorder: { borderTopWidth: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  content: { flex: 1 },
  dateLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  date: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  bellRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  bellText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
});

const il = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  headerText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1,
  },
  addBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  empty: { alignItems: 'center', paddingVertical: 28, gap: 8 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  emptySubText: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 20 },
  entry: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  entryBorder: { borderTopWidth: 1 },
  entryDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  entryContent: { flex: 1 },
  entryDate: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  entryNote: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  deleteEntry: { padding: 4 },
});

const m = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderWidth: 1 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 16 },
  input: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 14, fontFamily: 'Inter_400Regular', minHeight: 100, marginBottom: 6 },
  charCount: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'right', marginBottom: 20 },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  cancelText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.4 },
  saveText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});

const s = StyleSheet.create({
  root: { flex: 1 },
  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  navIconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  navActions: { flexDirection: 'row', gap: 8 },
  hero: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 24, gap: 18 },
  avatarRing: {
    borderRadius: 999, padding: 3, borderWidth: 3,
    shadowColor: '#3A7EFF', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 10, elevation: 8,
  },
  heroInfo: { flex: 1, gap: 10 },
  name: { fontSize: 26, fontFamily: 'Inter_700Bold', lineHeight: 30 },
  tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6, marginTop: 2 },
  phoneText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  callBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1 },
  callBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  splitRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, gap: 10 },
  splitCard: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1, gap: 6 },
  splitLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 2, textTransform: 'uppercase' },
  bodyText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  meta: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontFamily: 'Inter_400Regular' },
});
