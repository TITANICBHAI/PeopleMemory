import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
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
import C, { avatarColorForName } from '@/constants/colors';
import { Person, useApp } from '@/context/AppContext';

// ─── helpers ────────────────────────────────────────────────────────────────

function trustColor(n: number | null) {
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

// ─── micro-components ────────────────────────────────────────────────────────

function TrustBadge({ level }: { level: number | null }) {
  if (level === null || level === undefined) {
    return (
      <View style={[tb.wrap, { borderColor: C.border }]}>
        <Text style={[tb.num, { color: C.textDim }]}>—</Text>
      </View>
    );
  }
  const color = trustColor(level);
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
  const initials = person.name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
  const color = trustColor(person.trustLevel);

  if (person.photoUri && person.photoUri.startsWith('preset:')) {
    const id = person.photoUri.slice(7);
    const preset = PRESET_AVATARS.find(a => a.id === id);
    if (preset) {
      return (
        <View style={[av.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: preset.bg, borderColor: color + '77' }]}>
          <Text style={{ fontSize: size * 0.42 }}>{preset.icon}</Text>
        </View>
      );
    }
  }

  if (person.photoUri && !person.photoUri.startsWith('preset:')) {
    return (
      <Image
        source={{ uri: person.photoUri }}
        style={[av.photo, { width: size, height: size, borderRadius: size / 2, borderColor: color + '77' }]}
      />
    );
  }

  const nameColors = avatarColorForName(person.name);
  return (
    <View style={[av.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: nameColors.bg, borderColor: nameColors.text + '77' }]}>
      <Text style={[av.text, { fontSize: size * 0.35, color: nameColors.text }]}>{initials}</Text>
    </View>
  );
}
const av = StyleSheet.create({
  wrap: { borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  photo: { borderWidth: 2 },
  text: { fontFamily: 'Inter_700Bold' },
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
  const active = current === sortKey;
  return (
    <Pressable style={[sh.cell, { flex }]} onPress={() => onPress(sortKey)}>
      <Text style={[sh.text, active && sh.active]}>{label}</Text>
      {active ? (
        <Feather name={dir === 'asc' ? 'chevron-up' : 'chevron-down'} size={12} color={C.accent} />
      ) : null}
    </Pressable>
  );
}
const sh = StyleSheet.create({
  cell: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 8, paddingHorizontal: 6 },
  text: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: C.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' },
  active: { color: C.accent },
});

// ─── Card View Row ────────────────────────────────────────────────────────────

function PersonCard({ person, onPress, onDelete }: {
  person: Person; onPress: () => void; onDelete: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [card.row, pressed && card.pressed]}
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
      <View style={card.info}>
        <View style={card.nameRow}>
          <Text style={card.name} numberOfLines={1}>{person.name}</Text>
          <TrustBadge level={person.trustLevel} />
        </View>
        {person.tags.length > 0 && (
          <View style={card.tagRow}>
            {person.tags.slice(0, 3).map(t => <TagChip key={t} tag={t} />)}
          </View>
        )}
        {person.description ? (
          <Text style={card.desc} numberOfLines={1}>{person.description}</Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={16} color={C.textDim} />
    </Pressable>
  );
}
const card = StyleSheet.create({
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
  return (
    <Pressable
      style={({ pressed }) => [
        tr.row,
        isEven && tr.even,
        pressed && tr.pressed,
      ]}
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
        <Text style={tr.name} numberOfLines={1}>{person.name}</Text>
      </View>
      <View style={{ flex: 2, flexDirection: 'row', flexWrap: 'wrap', gap: 3, paddingHorizontal: 4 }}>
        {person.tags.slice(0, 2).map(t => <TagChip key={t} tag={t} small />)}
      </View>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <TrustBadge level={person.trustLevel} />
      </View>
      <View style={{ flex: 2, paddingHorizontal: 6 }}>
        <Text style={tr.cell} numberOfLines={1}>{formatDate(person.lastMet)}</Text>
      </View>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={tr.cell}>{notesCount(person)}</Text>
      </View>
    </Pressable>
  );
}
const tr = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  even: { backgroundColor: C.panel + '55' },
  pressed: { backgroundColor: C.accent + '15' },
  name: { fontSize: 13, fontFamily: 'Inter_500Medium', color: C.textBright },
  cell: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted },
});

// ─── App Logo ─────────────────────────────────────────────────────────────────

function AppLogo() {
  return (
    <View style={logo.wrap}>
      <View style={logo.iconWrap}>
        <View style={logo.dot1} />
        <View style={logo.line1} />
        <View style={logo.dot2} />
        <View style={logo.line2} />
        <View style={logo.dot3} />
        <View style={logo.center} />
      </View>
      <Text style={logo.text}>PEOPLE</Text>
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
  const [text, setText] = useState('');
  const submit = () => {
    if (text.trim()) { onAdd(text.trim()); setText(''); onClose(); }
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={atm.overlay} onPress={onClose} />
      <View style={atm.box}>
        <Text style={atm.title}>Filter by tag</Text>
        <TextInput
          style={atm.input}
          value={text}
          onChangeText={setText}
          placeholder="Tag name…"
          placeholderTextColor={C.textDim}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        <View style={atm.row}>
          <Pressable style={atm.cancel} onPress={onClose}>
            <Text style={atm.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={atm.confirm} onPress={submit}>
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
    position: 'absolute', left: 20, right: 20,
    top: '38%',
    backgroundColor: C.panel,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
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

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { people, deletePerson, lock, hasSeenTutorial, markTutorialSeen } = useApp();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [addTagOpen, setAddTagOpen] = useState(false);

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

  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const bottomPadding = insets.bottom + (Platform.OS === 'web' ? 34 : 0);

  return (
    <View style={[s.root, { paddingTop: topPadding }]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <AppLogo />
          <Text style={s.count}>{people.length} {people.length === 1 ? 'person' : 'people'}</Text>
        </View>
        <View style={s.headerActions}>
          <Pressable
            style={[s.iconBtn, view === 'table' && s.iconBtnActive]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setView(v => v === 'cards' ? 'table' : 'cards'); }}
          >
            <Feather name={view === 'cards' ? 'grid' : 'list'} size={17} color={view === 'table' ? C.accent : C.textMuted} />
          </Pressable>
          <Pressable style={s.iconBtn} onPress={lock}>
            <Feather name="lock" size={17} color={C.textMuted} />
          </Pressable>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Feather name="search" size={15} color={C.textMuted} />
        <TextInput
          style={s.search}
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

      {/* Tag Filters — always visible */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.tagFilters}
        style={s.tagFiltersContainer}
      >
        <Pressable
          style={[s.tagFilter, !activeTag && s.tagFilterActive]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTag(null); }}
        >
          <Text style={[s.tagFilterText, !activeTag && s.tagFilterTextActive]}>All</Text>
        </Pressable>
        {allTags.map(t => {
          const key = t.toLowerCase() as keyof typeof C.tag;
          const colors = C.tag[key] ?? C.tag.custom;
          const isActive = activeTag === t;
          return (
            <Pressable
              key={t}
              style={[s.tagFilter, isActive && { backgroundColor: colors.bg, borderColor: colors.text + '55' }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTag(isActive ? null : t); }}
            >
              <Text style={[s.tagFilterText, isActive && { color: colors.text }]}>{t}</Text>
            </Pressable>
          );
        })}
        <Pressable
          style={s.tagFilterAdd}
          onPress={() => setAddTagOpen(true)}
        >
          <Feather name="plus" size={14} color={C.textMuted} />
        </Pressable>
      </ScrollView>

      <AddTagModal
        visible={addTagOpen}
        onClose={() => setAddTagOpen(false)}
        onAdd={tag => { setActiveTag(tag); }}
      />

      {/* Content */}
      {people.length === 0 ? (
        <View style={s.empty}>
          <Feather name="users" size={52} color={C.textDim} />
          <Text style={s.emptyTitle}>No people yet</Text>
          <Text style={s.emptyText}>Tap + to add someone</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.empty}>
          <Feather name="search" size={44} color={C.textDim} />
          <Text style={s.emptyTitle}>No results</Text>
          <Text style={s.emptyText}>Try a different search or filter</Text>
        </View>
      ) : view === 'cards' ? (
        <FlatList
          data={filtered}
          keyExtractor={p => p.id}
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
          <View style={[tbl.header, { marginHorizontal: 14 }]}>
            <SortHeader label="NAME" sortKey="name" current={sortKey} dir={sortDir} onPress={handleSort} flex={3} />
            <View style={{ flex: 2, paddingHorizontal: 6, paddingVertical: 8 }}>
              <Text style={sh.text}>TAGS</Text>
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

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [s.fab, pressed && s.fabPressed]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/add');
        }}
      >
        <Feather name="plus" size={26} color={C.textBright} />
      </Pressable>

      {/* One-time tutorial */}
      {!hasSeenTutorial && (
        <Tutorial onDone={markTutorialSeen} />
      )}
    </View>
  );
}

const tbl = StyleSheet.create({
  header: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: C.border,
    backgroundColor: C.header,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 4,
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
  iconBtnActive: { borderColor: C.accent, backgroundColor: C.accent + '22' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.panel, borderRadius: 12,
    marginHorizontal: 14, marginBottom: 4,
    paddingHorizontal: 14, borderWidth: 1, borderColor: C.border, height: 44,
  },
  search: { flex: 1, color: C.text, fontSize: 14, fontFamily: 'Inter_400Regular', height: 44 },
  tagFiltersContainer: { flexGrow: 0, flexShrink: 0 },
  tagFilters: {
    paddingHorizontal: 14,
    paddingTop: 2,
    paddingBottom: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagFilter: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.border,
  },
  tagFilterActive: { backgroundColor: C.accent + '22', borderColor: C.accent },
  tagFilterAdd: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagFilterText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: C.textMuted },
  tagFilterTextActive: { color: C.accent },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 80 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: C.text },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: C.textMuted },
  fab: {
    position: 'absolute', bottom: 28, right: 22,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center',
    elevation: 8,
    ...Platform.select({
      ios: { shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 },
      default: {},
    }),
  },
  fabPressed: { backgroundColor: C.accentDim, transform: [{ scale: 0.94 }] },
});
