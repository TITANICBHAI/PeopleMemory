import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
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

import { PRESET_AVATARS } from '@/components/AvatarPicker';
import Tutorial from '@/components/Tutorial';
import { useColors, avatarColorForName } from '@/constants/colors';
import { Person, useApp } from '@/context/AppContext';

// ─── helpers ────────────────────────────────────────────────────────────────

function trustColor(n: number | null, C: { textDim: string; red: string; yellow: string; green: string }) {
  if (n === null || n === undefined) return C.textDim;
  return n <= 3 ? C.red : n <= 6 ? C.yellow : C.green;
}

function formatDate(s?: string) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return s; }
}

function notesCount(p: Person) {
  return [p.description, p.likes, p.dislikes, p.thingsToRemember, p.quickFacts]
    .filter(Boolean).length + p.customDates.length;
}

function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function daysLabel(days: number): string {
  if (days === 0) return 'Today!';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

// ─── micro-components ────────────────────────────────────────────────────────

function TrustBadge({ level }: { level: number | null }) {
  const C = useColors();
  if (level === null || level === undefined) {
    return (
      <View style={[tb.wrap, { borderColor: C.border }]}>
        <Text style={[tb.num, { color: C.textDim }]}>—</Text>
      </View>
    );
  }
  const color = trustColor(level, C);
  return (
    <View style={[tb.wrap, { borderColor: color + '55' }]}>
      <View style={[tb.dot, { backgroundColor: color }]} />
      <Text style={[tb.num, { color }]}>{level}</Text>
    </View>
  );
}
const tb = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  num: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});

function TagChip({ tag, small }: { tag: string; small?: boolean }) {
  const C = useColors();
  const key = tag.toLowerCase() as keyof typeof C.tag;
  const colors = C.tag[key] ?? C.tag.custom;
  return (
    <View style={[chip.wrap, { backgroundColor: colors.bg }, small && chip.small]}>
      <Text style={[chip.text, { color: colors.text }, small && chip.smallText]}>{tag}</Text>
    </View>
  );
}
const chip = StyleSheet.create({
  wrap: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  text: { fontSize: 11, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.4 },
  small: { paddingHorizontal: 6, paddingVertical: 2 },
  smallText: { fontSize: 9 },
});

function PersonAvatar({ person, size = 44 }: { person: Person; size?: number }) {
  const C = useColors();
  const initials = person.name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
  const tColor = trustColor(person.trustLevel, C);
  const ringColor = person.trustLevel !== null && person.trustLevel !== undefined
    ? tColor + 'BB'
    : C.border;

  if (person.photoUri && person.photoUri.startsWith('preset:')) {
    const id = person.photoUri.slice(7);
    const preset = PRESET_AVATARS.find(a => a.id === id);
    if (preset) {
      return (
        <View style={[av.ring, { width: size + 6, height: size + 6, borderRadius: (size + 6) / 2, borderColor: ringColor }]}>
          <Image source={{ uri: preset.uri }} style={[av.photo, { width: size, height: size, borderRadius: size / 2 }]} />
        </View>
      );
    }
  }

  if (person.photoUri && !person.photoUri.startsWith('preset:')) {
    return (
      <View style={[av.ring, { width: size + 6, height: size + 6, borderRadius: (size + 6) / 2, borderColor: ringColor }]}>
        <Image source={{ uri: person.photoUri }} style={[av.photo, { width: size, height: size, borderRadius: size / 2 }]} />
      </View>
    );
  }

  const nameColors = avatarColorForName(person.name);
  return (
    <View style={[av.ring, { width: size + 6, height: size + 6, borderRadius: (size + 6) / 2, borderColor: ringColor }]}>
      <View style={[av.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: nameColors.bg }]}>
        <Text style={[av.text, { fontSize: size * 0.35, color: nameColors.text }]}>{initials}</Text>
      </View>
    </View>
  );
}
const av = StyleSheet.create({
  ring: { borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  wrap: { alignItems: 'center', justifyContent: 'center' },
  photo: {},
  text: { fontFamily: 'Inter_700Bold' },
});

// ─── Coming Up Strip ──────────────────────────────────────────────────────────

interface UpcomingEvent {
  person: Person;
  type: 'birthday' | 'meeting';
  date: Date;
  days: number;
}

function ComingUpStrip({ events, onPress }: {
  events: UpcomingEvent[];
  onPress: (person: Person) => void;
}) {
  const C = useColors();
  if (events.length === 0) return null;
  return (
    <View style={cu.wrap}>
      <Text style={[cu.label, { color: C.textMuted }]}>COMING UP</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={cu.scroll}>
        {events.map((ev, i) => {
          const isBirthday = ev.type === 'birthday';
          const isToday = ev.days === 0;
          const accent = isBirthday ? '#C678DD' : C.accent;
          return (
            <Pressable
              key={`${ev.person.id}-${ev.type}`}
              style={({ pressed }) => [cu.card, { backgroundColor: C.panel, borderColor: C.border }, pressed && { backgroundColor: C.panelHigh }, isToday && { borderColor: accent + '55' }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(ev.person); }}
            >
              <View style={[cu.iconWrap, { backgroundColor: accent + '22' }]}>
                <Feather name={isBirthday ? 'gift' : 'calendar'} size={14} color={accent} />
              </View>
              <View style={cu.cardContent}>
                <Text style={[cu.cardName, { color: C.textBright }]} numberOfLines={1}>{ev.person.name}</Text>
                <Text style={[cu.cardType, { color: accent }]}>
                  {isBirthday ? 'Birthday' : 'Meeting'}
                </Text>
              </View>
              <View style={[cu.daysBadge, isToday && { backgroundColor: accent + '33' }]}>
                <Text style={[cu.daysText, { color: isToday ? accent : C.textMuted }]}>
                  {daysLabel(ev.days)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
const cu = StyleSheet.create({
  wrap: { marginBottom: 4 },
  label: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: C.textMuted, letterSpacing: 2, marginHorizontal: 18, marginBottom: 8 },
  scroll: { paddingHorizontal: 14, gap: 10 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.panel, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: C.border,
    minWidth: 200,
  },
  cardPressed: { backgroundColor: C.panelHigh },
  cardToday: { borderColor: C.accent + '55' },
  iconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1 },
  cardName: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: C.textBright },
  cardType: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 },
  daysBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  daysText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});

// ─── Sort Header Cell ─────────────────────────────────────────────────────────

type SortKey = 'name' | 'trustLevel' | 'lastMet' | 'notes';
type SortDir = 'asc' | 'desc';

function SortHeader({
  label, sortKey, current, dir, onPress, flex,
}: {
  label: string; sortKey: SortKey; current: SortKey; dir: SortDir;
  onPress: (k: SortKey) => void; flex: number;
}) {
  const C = useColors();
  const active = current === sortKey;
  return (
    <Pressable style={[ssh.cell, { flex }]} onPress={() => onPress(sortKey)}>
      <Text style={[ssh.text, { color: active ? C.accent : C.textMuted }]}>{label}</Text>
      {active ? (
        <Feather name={dir === 'asc' ? 'chevron-up' : 'chevron-down'} size={12} color={C.accent} />
      ) : null}
    </Pressable>
  );
}
const ssh = StyleSheet.create({
  cell: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 8, paddingHorizontal: 6 },
  text: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: C.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' },
  active: { color: C.accent },
});

// ─── Card View Row ────────────────────────────────────────────────────────────

function PersonCard({ person, onPress, onDelete }: {
  person: Person; onPress: () => void; onDelete: () => void;
}) {
  const C = useColors();
  return (
    <Pressable
      style={({ pressed }) => [pcard.row, { backgroundColor: C.panel, borderColor: C.border }, pressed && { backgroundColor: C.panelHigh, borderColor: C.borderLight }]}
      onPress={onPress}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(`Delete ${person.name}?`, 'This cannot be undone.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: onDelete },
        ]);
      }}
    >
      <PersonAvatar person={person} />
      <View style={pcard.info}>
        <View style={pcard.nameRow}>
          <Text style={[pcard.name, { color: C.textBright }]} numberOfLines={1}>{person.name}</Text>
          <TrustBadge level={person.trustLevel} />
        </View>
        {person.tags.length > 0 && (
          <View style={pcard.tagRow}>
            {person.tags.slice(0, 3).map(t => <TagChip key={t} tag={t} />)}
          </View>
        )}
        {person.description ? (
          <Text style={[pcard.desc, { color: C.textMuted }]} numberOfLines={1}>{person.description}</Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={16} color={C.textDim} />
    </Pressable>
  );
}
const pcard = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.panel, borderRadius: 14,
    padding: 13, marginHorizontal: 14, marginVertical: 4,
    borderWidth: 1, borderColor: C.border,
  },
  pressed: { backgroundColor: C.panelHigh, borderColor: C.borderLight },
  info: { flex: 1, gap: 5 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: C.textBright, flex: 1 },
  tagRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  desc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted },
});

// ─── Table View Row ───────────────────────────────────────────────────────────

function TableRow({ person, onPress, onDelete, isEven }: {
  person: Person; onPress: () => void; onDelete: () => void; isEven: boolean;
}) {
  const C = useColors();
  return (
    <Pressable
      style={({ pressed }) => [trow.row, { borderBottomColor: C.border }, isEven && { backgroundColor: C.panel + '55' }, pressed && { backgroundColor: C.accent + '15' }]}
      onPress={onPress}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(`Delete ${person.name}?`, 'This cannot be undone.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: onDelete },
        ]);
      }}
    >
      <View style={{ flex: 3, paddingHorizontal: 6 }}>
        <Text style={[trow.name, { color: C.textBright }]} numberOfLines={1}>{person.name}</Text>
      </View>
      <View style={{ flex: 2, flexDirection: 'row', flexWrap: 'wrap', gap: 3, paddingHorizontal: 4 }}>
        {person.tags.slice(0, 2).map(t => <TagChip key={t} tag={t} small />)}
      </View>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <TrustBadge level={person.trustLevel} />
      </View>
      <View style={{ flex: 2, paddingHorizontal: 6 }}>
        <Text style={[trow.cell, { color: C.textMuted }]} numberOfLines={1}>{formatDate(person.lastMet)}</Text>
      </View>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={[trow.cell, { color: C.textMuted }]}>{notesCount(person)}</Text>
      </View>
    </Pressable>
  );
}
const trow = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  even: { backgroundColor: C.panel + '55' },
  pressed: { backgroundColor: C.accent + '15' },
  name: { fontSize: 13, fontFamily: 'Inter_500Medium', color: C.textBright },
  cell: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted },
});

// ─── App Logo ─────────────────────────────────────────────────────────────────

function AppLogo() {
  const C = useColors();
  return (
    <View style={logo.wrap}>
      <View style={logo.iconWrap}>
        <View style={[logo.dot1, { backgroundColor: C.accent }]} />
        <View style={[logo.line1, { backgroundColor: C.accent + '66' }]} />
        <View style={[logo.dot2, { backgroundColor: C.accentGlow }]} />
        <View style={[logo.line2, { backgroundColor: C.accentGlow + '55' }]} />
        <View style={[logo.dot3, { backgroundColor: C.accentGlow + 'AA' }]} />
        <View style={[logo.center, { backgroundColor: C.accent + '88' }]} />
      </View>
      <Text style={[logo.text, { color: C.textBright }]}>PEOPLE</Text>
    </View>
  );
}
const logo = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconWrap: { width: 28, height: 28, position: 'relative' },
  dot1: { position: 'absolute', top: 0, left: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent },
  dot2: { position: 'absolute', top: 0, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: C.accentGlow },
  dot3: { position: 'absolute', bottom: 0, left: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: C.accentGlow + 'AA' },
  center: { position: 'absolute', bottom: 0, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent + '88' },
  line1: { position: 'absolute', top: 3, left: 11, width: 10, height: 1.5, backgroundColor: C.accent + '66', transform: [{ rotate: '20deg' }] },
  line2: { position: 'absolute', top: 14, left: 8, width: 12, height: 1.5, backgroundColor: C.accentGlow + '55', transform: [{ rotate: '-15deg' }] },
  text: { fontSize: 24, fontFamily: 'Inter_700Bold', color: C.textBright, letterSpacing: 4 },
});

// ─── Add Tag Modal ─────────────────────────────────────────────────────────────

function AddTagModal({ visible, onClose, onAdd }: { visible: boolean; onClose: () => void; onAdd: (tag: string) => void }) {
  const C = useColors();
  const [text, setText] = useState('');
  const submit = () => {
    if (text.trim()) { onAdd(text.trim()); setText(''); onClose(); }
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={atm.overlay} onPress={onClose} />
      <View style={[atm.box, { backgroundColor: C.panel, borderColor: C.border }]}>
        <Text style={[atm.title, { color: C.textBright }]}>Filter by tag</Text>
        <TextInput
          style={[atm.input, { backgroundColor: C.bg, borderColor: C.border, color: C.text }]}
          value={text}
          onChangeText={setText}
          placeholder="Tag name…"
          placeholderTextColor={C.textDim}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        <View style={atm.row}>
          <Pressable style={[atm.cancel, { backgroundColor: C.panelHigh }]} onPress={onClose}>
            <Text style={[atm.cancelText, { color: C.textMuted }]}>Cancel</Text>
          </Pressable>
          <Pressable style={[atm.confirm, { backgroundColor: C.accent }]} onPress={submit}>
            <Text style={atm.confirmText}>Filter</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
const atm = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000088' },
  box: {
    position: 'absolute', left: 20, right: 20, top: '38%',
    backgroundColor: C.panel, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: C.border,
  },
  title: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.textBright, marginBottom: 12 },
  input: {
    backgroundColor: C.bg, borderRadius: 10, borderWidth: 1, borderColor: C.border,
    color: C.text, fontSize: 14, fontFamily: 'Inter_400Regular',
    paddingHorizontal: 12, height: 44, marginBottom: 14,
  },
  row: { flexDirection: 'row', gap: 10 },
  cancel: { flex: 1, height: 40, borderRadius: 10, backgroundColor: C.panelHigh, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: C.textMuted },
  confirm: { flex: 1, height: 40, borderRadius: 10, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  confirmText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.textBright },
});

// ─── Quick Log Modal ──────────────────────────────────────────────────────────

function QuickLogModal({ visible, people, onClose, onSave }: {
  visible: boolean;
  people: Person[];
  onClose: () => void;
  onSave: (personId: string, note: string) => Promise<void>;
}) {
  const [step, setStep] = useState<'pick' | 'note'>('pick');
  const [selected, setSelected] = useState<Person | null>(null);
  const [note, setNote] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => { setStep('pick'); setSelected(null); setNote(''); setSearch(''); };
  const handleClose = () => { reset(); onClose(); };

  const filtered = useMemo(() =>
    people.filter(p => p.name.toLowerCase().includes(search.toLowerCase())),
    [people, search]
  );

  const handlePick = (person: Person) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(person);
    setStep('note');
  };

  const handleSave = async () => {
    if (!selected || !note.trim()) return;
    setSaving(true);
    await onSave(selected.id, note);
    setSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    reset();
    onClose();
  };

  const C = useColors();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={ql.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={ql.backdrop} onPress={handleClose} />
        <View style={[ql.sheet, { backgroundColor: C.panel, borderColor: C.border }]}>
          <View style={[ql.handle, { backgroundColor: C.border }]} />

          {step === 'pick' ? (
            <>
              <Text style={[ql.title, { color: C.textBright }]}>Who did you interact with?</Text>
              <View style={[ql.searchWrap, { backgroundColor: C.bg, borderColor: C.border }]}>
                <Feather name="search" size={14} color={C.textDim} />
                <TextInput
                  style={[ql.searchInput, { color: C.text }]}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search name…"
                  placeholderTextColor={C.textDim}
                  autoFocus
                />
              </View>
              <ScrollView style={ql.list} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {filtered.length === 0 ? (
                  <Text style={[ql.empty, { color: C.textMuted }]}>No people found</Text>
                ) : (
                  filtered.map(p => {
                    const initials = p.name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
                    const nc = avatarColorForName(p.name);
                    return (
                      <Pressable key={p.id} style={({ pressed }) => [ql.personRow, { borderBottomColor: C.border }, pressed && { backgroundColor: C.panelHigh }]} onPress={() => handlePick(p)}>
                        <View style={[ql.personAvatar, { backgroundColor: nc.bg }]}>
                          <Text style={[ql.personInitials, { color: nc.text }]}>{initials}</Text>
                        </View>
                        <Text style={[ql.personName, { color: C.textBright }]}>{p.name}</Text>
                        <Feather name="chevron-right" size={15} color={C.textDim} />
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            </>
          ) : (
            <>
              <Pressable style={ql.backRow} onPress={() => setStep('pick')}>
                <Feather name="arrow-left" size={16} color={C.accent} />
                <Text style={[ql.backText, { color: C.accent }]}>Change person</Text>
              </Pressable>
              <Text style={[ql.title, { color: C.textBright }]}>What happened with <Text style={{ color: C.accentGlow }}>{selected?.name}</Text>?</Text>
              <TextInput
                style={[ql.noteInput, { backgroundColor: C.bg, borderColor: C.border, color: C.text }]}
                value={note}
                onChangeText={setNote}
                placeholder="e.g. Caught up over coffee, talked about the move to Berlin…"
                placeholderTextColor={C.textDim}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoFocus
                maxLength={500}
              />
              <Text style={[ql.charCount, { color: C.textDim }]}>{note.length}/500</Text>
              <View style={ql.actions}>
                <Pressable style={[ql.cancelBtn, { backgroundColor: C.bg, borderColor: C.border }]} onPress={handleClose}>
                  <Text style={[ql.cancelText, { color: C.textMuted }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[ql.saveBtn, { backgroundColor: C.accent }, (!note.trim() || saving) && ql.saveBtnDisabled]}
                  onPress={handleSave}
                  disabled={!note.trim() || saving}
                >
                  <Text style={ql.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const ql = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: C.panel, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, maxHeight: '80%',
    borderWidth: 1, borderColor: C.border,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 17, fontFamily: 'Inter_700Bold', color: C.textBright, marginBottom: 14 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 12, height: 44, marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: C.text },
  list: { maxHeight: 280 },
  empty: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textMuted, textAlign: 'center', paddingVertical: 20 },
  personRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  personPressed: { backgroundColor: C.panelHigh },
  personAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  personInitials: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  personName: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium', color: C.textBright },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  backText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: C.accent },
  noteInput: {
    backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    padding: 14, fontSize: 14, fontFamily: 'Inter_400Regular', color: C.text,
    minHeight: 100, marginBottom: 6,
  },
  charCount: { fontSize: 11, color: C.textDim, fontFamily: 'Inter_400Regular', textAlign: 'right', marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: C.bg, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  cancelText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: C.textMuted },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: C.accent, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.4 },
  saveText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const C = useColors();
  const { people, deletePerson, lock, hasSeenTutorial, markTutorialSeen, addInteraction } = useApp();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [addTagOpen, setAddTagOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [quickLogOpen, setQuickLogOpen] = useState(false);

  const handleSort = useCallback((key: SortKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSortDir(prev => (sortKey === key ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'));
    setSortKey(key);
  }, [sortKey]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = people.filter(p => {
      const matchTag = !activeTag || p.tags.includes(activeTag);
      const matchQ = !q || (
        p.name.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        p.description.toLowerCase().includes(q) ||
        p.likes.toLowerCase().includes(q) ||
        p.dislikes.toLowerCase().includes(q) ||
        p.thingsToRemember.toLowerCase().includes(q) ||
        p.quickFacts.toLowerCase().includes(q)
      );
      return matchTag && matchQ;
    });
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'trustLevel': cmp = (a.trustLevel ?? -1) - (b.trustLevel ?? -1); break;
        case 'lastMet': cmp = (a.lastMet ?? '').localeCompare(b.lastMet ?? ''); break;
        case 'notes': cmp = notesCount(a) - notesCount(b); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [people, query, activeTag, sortKey, sortDir]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    people.forEach(p => p.tags.forEach(t => set.add(t)));
    return [...set].sort();
  }, [people]);

  const upcomingEvents = useMemo<UpcomingEvent[]>(() => {
    const events: UpcomingEvent[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (const person of people) {
      if (person.birthday) {
        const bd = new Date(person.birthday);
        const thisYear = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
        if (thisYear < now) thisYear.setFullYear(now.getFullYear() + 1);
        if (thisYear <= in30) {
          events.push({ person, type: 'birthday', date: thisYear, days: daysUntil(thisYear) });
        }
      }
      if (person.nextMeeting) {
        const nm = new Date(person.nextMeeting);
        if (nm >= now && nm <= in30) {
          events.push({ person, type: 'meeting', date: nm, days: daysUntil(nm) });
        }
      }
    }
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [people]);

  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPadding = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  const closeFab = () => setFabOpen(false);

  return (
    <View style={[s.root, { paddingTop: topPadding, backgroundColor: C.bg }]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <AppLogo />
          <Text style={[s.count, { color: C.textMuted }]}>{people.length} {people.length === 1 ? 'person' : 'people'}</Text>
        </View>
        <View style={s.headerActions}>
          <Pressable
            style={[s.iconBtn, { backgroundColor: C.panel, borderColor: C.border }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/settings'); }}
          >
            <Feather name="settings" size={18} color={C.textMuted} />
          </Pressable>
          <Pressable
            style={[s.iconBtn, { backgroundColor: C.panel, borderColor: C.border }, view === 'table' && { borderColor: C.accent + '55', backgroundColor: C.accent + '18' }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setView(v => v === 'cards' ? 'table' : 'cards'); }}
          >
            <Feather name={view === 'cards' ? 'grid' : 'list'} size={17} color={view === 'table' ? C.accent : C.textMuted} />
          </Pressable>
          <Pressable style={[s.iconBtn, { backgroundColor: C.panel, borderColor: C.border }]} onPress={lock}>
            <Feather name="lock" size={17} color={C.textMuted} />
          </Pressable>
        </View>
      </View>

      {/* Search */}
      <View style={[s.searchWrap, { backgroundColor: C.panel, borderColor: C.border }]}>
        <Feather name="search" size={15} color={C.textMuted} />
        <TextInput
          style={[s.search, { color: C.text }]}
          placeholder="Search name, tags, notes…"
          placeholderTextColor={C.textDim}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {query.length > 0 && Platform.OS !== 'ios' && (
          <Pressable onPress={() => setQuery('')}>
            <Feather name="x" size={15} color={C.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Tag Filters */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.tagFilters}
        style={s.tagFiltersContainer}
      >
        <Pressable
          style={[s.tagFilter, { backgroundColor: C.panel, borderColor: C.border }, !activeTag && { backgroundColor: C.accent + '20', borderColor: C.accent + '55' }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTag(null); }}
        >
          <Text style={[s.tagFilterText, { color: !activeTag ? C.accent : C.textMuted }]}>All</Text>
        </Pressable>
        {allTags.map(t => {
          const key = t.toLowerCase() as keyof typeof C.tag;
          const colors = C.tag[key] ?? C.tag.custom;
          const isActive = activeTag === t;
          return (
            <Pressable
              key={t}
              style={[s.tagFilter, { backgroundColor: C.panel, borderColor: C.border }, isActive && { backgroundColor: colors.bg, borderColor: colors.text + '55' }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTag(isActive ? null : t); }}
            >
              <Text style={[s.tagFilterText, { color: isActive ? colors.text : C.textMuted }]}>{t}</Text>
            </Pressable>
          );
        })}
        <Pressable style={[s.tagFilterAdd, { backgroundColor: C.panel, borderColor: C.border }]} onPress={() => setAddTagOpen(true)}>
          <Feather name="plus" size={14} color={C.textMuted} />
        </Pressable>
      </ScrollView>

      <AddTagModal visible={addTagOpen} onClose={() => setAddTagOpen(false)} onAdd={tag => setActiveTag(tag)} />

      {/* Content */}
      {people.length === 0 ? (
        <View style={s.empty}>
          <Feather name="users" size={52} color={C.textDim} />
          <Text style={[s.emptyTitle, { color: C.textMuted }]}>No people yet</Text>
          <Text style={[s.emptyText, { color: C.textDim }]}>Tap + to add someone</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.empty}>
          <Feather name="search" size={44} color={C.textDim} />
          <Text style={[s.emptyTitle, { color: C.textMuted }]}>No results</Text>
          <Text style={[s.emptyText, { color: C.textDim }]}>Try a different search or filter</Text>
        </View>
      ) : view === 'cards' ? (
        <FlatList
          data={filtered}
          keyExtractor={p => p.id}
          ListHeaderComponent={
            <ComingUpStrip
              events={upcomingEvents}
              onPress={p => router.push({ pathname: '/profile/[id]', params: { id: p.id } })}
            />
          }
          renderItem={({ item }) => (
            <PersonCard
              person={item}
              onPress={() => router.push({ pathname: '/profile/[id]', params: { id: item.id } })}
              onDelete={() => deletePerson(item.id)}
            />
          )}
          contentContainerStyle={{ paddingTop: 2, paddingBottom: bottomPadding + 90 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={{ flex: 1 }}>
          {upcomingEvents.length > 0 && (
            <ComingUpStrip
              events={upcomingEvents}
              onPress={p => router.push({ pathname: '/profile/[id]', params: { id: p.id } })}
            />
          )}
          <View style={[tbl.header, { marginHorizontal: 14, borderBottomColor: C.border, backgroundColor: C.header }]}>
            <SortHeader label="NAME" sortKey="name" current={sortKey} dir={sortDir} onPress={handleSort} flex={3} />
            <View style={{ flex: 2, paddingHorizontal: 6, paddingVertical: 8 }}>
              <Text style={ssh.text}>TAGS</Text>
            </View>
            <SortHeader label="TRUST" sortKey="trustLevel" current={sortKey} dir={sortDir} onPress={handleSort} flex={1} />
            <SortHeader label="LAST MET" sortKey="lastMet" current={sortKey} dir={sortDir} onPress={handleSort} flex={2} />
            <SortHeader label="NOTES" sortKey="notes" current={sortKey} dir={sortDir} onPress={handleSort} flex={1} />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={p => p.id}
            renderItem={({ item, index }) => (
              <TableRow
                person={item}
                isEven={index % 2 === 0}
                onPress={() => router.push({ pathname: '/profile/[id]', params: { id: item.id } })}
                onDelete={() => deletePerson(item.id)}
              />
            )}
            contentContainerStyle={{ marginHorizontal: 14, paddingBottom: bottomPadding + 90 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Expandable FAB */}
      {fabOpen && (
        <Pressable style={StyleSheet.absoluteFill} onPress={closeFab} />
      )}
      <View style={[s.fabGroup, { bottom: bottomPadding + 24 }]}>
        {fabOpen && (
          <>
            <View style={s.fabOptionRow}>
              <View style={[s.fabLabel, { backgroundColor: C.panel, borderColor: C.border }]}>
                <Text style={[s.fabLabelText, { color: C.textBright }]}>Log Interaction</Text>
              </View>
              <Pressable
                style={[s.fabOption, { backgroundColor: C.accentDim }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFabOpen(false);
                  setQuickLogOpen(true);
                }}
              >
                <Feather name="message-circle" size={20} color={C.textBright} />
              </Pressable>
            </View>
            <View style={s.fabOptionRow}>
              <View style={[s.fabLabel, { backgroundColor: C.panel, borderColor: C.border }]}>
                <Text style={[s.fabLabelText, { color: C.textBright }]}>Add Person</Text>
              </View>
              <Pressable
                style={[s.fabOption, { backgroundColor: C.accentDim }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFabOpen(false);
                  router.push('/add');
                }}
              >
                <Feather name="user-plus" size={20} color={C.textBright} />
              </Pressable>
            </View>
          </>
        )}
        <Pressable
          style={({ pressed }) => [s.fab, { backgroundColor: fabOpen ? C.accentDim : C.accent, shadowColor: C.accent }, pressed && s.fabPressed]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setFabOpen(v => !v);
          }}
        >
          <Feather name={fabOpen ? 'x' : 'plus'} size={26} color={C.textBright} />
        </Pressable>
      </View>

      {/* Quick Log Modal */}
      <QuickLogModal
        visible={quickLogOpen}
        people={people}
        onClose={() => setQuickLogOpen(false)}
        onSave={addInteraction}
      />

      {/* One-time tutorial */}
      {!hasSeenTutorial && <Tutorial onDone={markTutorialSeen} />}
    </View>
  );
}

const tbl = StyleSheet.create({
  header: {
    flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: C.border,
    backgroundColor: C.header, borderRadius: 10, overflow: 'hidden', marginBottom: 4,
  },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14,
  },
  count: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted, marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: C.panel, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  iconBtnActive: { borderColor: C.accent + '55', backgroundColor: C.accent + '18' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 14, marginBottom: 10,
    backgroundColor: C.panel, borderRadius: 13,
    paddingHorizontal: 14, height: 44,
    borderWidth: 1, borderColor: C.border,
  },
  search: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: C.text },
  tagFiltersContainer: { maxHeight: 42, marginBottom: 6 },
  tagFilters: { paddingHorizontal: 14, gap: 8, alignItems: 'center' },
  tagFilter: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: C.panel, borderWidth: 1, borderColor: C.border,
  },
  tagFilterActive: { backgroundColor: C.accent + '20', borderColor: C.accent + '55' },
  tagFilterText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: C.textMuted },
  tagFilterTextActive: { color: C.accent },
  tagFilterAdd: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.panel, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: C.textMuted },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textDim },
  fabGroup: { position: 'absolute', right: 20, alignItems: 'flex-end', gap: 12 },
  fab: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  fabPressed: { opacity: 0.85 },
  fabActive: { backgroundColor: C.accentDim },
  fabOption: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 5,
  },
  fabOptionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fabLabel: {
    backgroundColor: C.panel, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: C.border,
  },
  fabLabelText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: C.textBright },
});
