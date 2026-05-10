import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/constants/colors';
import { Person, useApp } from '@/context/AppContext';

interface JournalEntry {
  id: string;
  date: Date;
  type: 'interaction' | 'birthday' | 'firstMet' | 'lastMet' | 'meeting' | 'customDate';
  person: Person;
  label: string;
  note?: string;
  icon: string;
  iconColor: string;
}

function formatDate(d: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatFull(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function EntryCard({ entry, onPress }: { entry: JournalEntry; onPress: () => void }) {
  const C = useColors();
  return (
    <Pressable
      style={({ pressed }) => [ec.card, { backgroundColor: C.panel, borderColor: C.border }, pressed && { backgroundColor: C.panelHigh }]}
      onPress={onPress}
    >
      <View style={[ec.iconWrap, { backgroundColor: entry.iconColor + '22' }]}>
        <Feather name={entry.icon as any} size={15} color={entry.iconColor} />
      </View>
      <View style={ec.content}>
        <View style={ec.topRow}>
          <Text style={[ec.personName, { color: C.textBright }]} numberOfLines={1}>
            {entry.person.name}
          </Text>
          <Text style={[ec.typeLabel, { color: entry.iconColor }]}>{entry.label}</Text>
        </View>
        {entry.note ? (
          <Text style={[ec.note, { color: C.textMuted }]} numberOfLines={2}>{entry.note}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}
const ec = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderRadius: 14, padding: 13, marginBottom: 8, borderWidth: 1,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 },
  personName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', flex: 1 },
  typeLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  note: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
});

type ListItem =
  | { type: 'header'; date: Date; key: string }
  | { type: 'entry'; entry: JournalEntry; key: string };

export default function JournalScreen() {
  const C = useColors();
  const { people } = useApp();
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const entries = useMemo<JournalEntry[]>(() => {
    const result: JournalEntry[] = [];
    const now = new Date();

    for (const person of people) {
      for (const interaction of person.interactions ?? []) {
        result.push({
          id: `int-${interaction.id}`,
          date: new Date(interaction.date),
          type: 'interaction',
          person,
          label: 'Interaction',
          note: interaction.note,
          icon: 'message-circle',
          iconColor: '#007ACC',
        });
      }
      if (person.birthday) {
        const bd = new Date(person.birthday);
        const thisYear = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
        if (thisYear <= now) {
          result.push({
            id: `bd-${person.id}`,
            date: thisYear,
            type: 'birthday',
            person,
            label: 'Birthday',
            note: undefined,
            icon: 'gift',
            iconColor: '#C678DD',
          });
        }
      }
      if (person.firstMet) {
        result.push({
          id: `fm-${person.id}`,
          date: new Date(person.firstMet),
          type: 'firstMet',
          person,
          label: 'First Met',
          note: undefined,
          icon: 'star',
          iconColor: '#E5C07B',
        });
      }
      if (person.lastMet) {
        result.push({
          id: `lm-${person.id}`,
          date: new Date(person.lastMet),
          type: 'lastMet',
          person,
          label: 'Last Met',
          note: undefined,
          icon: 'clock',
          iconColor: '#61AFEF',
        });
      }
      if (person.nextMeeting) {
        const nm = new Date(person.nextMeeting);
        result.push({
          id: `nm-${person.id}`,
          date: nm,
          type: 'meeting',
          person,
          label: nm >= now ? 'Upcoming Meeting' : 'Meeting',
          note: undefined,
          icon: 'calendar',
          iconColor: '#56B6C2',
        });
      }
      for (const cd of person.customDates ?? []) {
        result.push({
          id: `cd-${person.id}-${cd.id}`,
          date: new Date(cd.date),
          type: 'customDate',
          person,
          label: cd.label,
          note: undefined,
          icon: 'flag',
          iconColor: '#98C379',
        });
      }
    }

    return result.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [people]);

  const listData = useMemo(() => {
    const items: Array<{ type: 'header'; date: Date; key: string } | { type: 'entry'; entry: JournalEntry; key: string }> = [];
    let lastDay: Date | null = null;
    for (const entry of entries) {
      if (!lastDay || !isSameDay(lastDay, entry.date)) {
        items.push({ type: 'header', date: entry.date, key: `h-${entry.date.toDateString()}` });
        lastDay = entry.date;
      }
      items.push({ type: 'entry', entry, key: entry.id });
    }
    return items;
  }, [entries]);

  return (
    <View style={[s.root, { paddingTop: topPadding, backgroundColor: C.bg }]}>
      <View style={[s.navbar, { borderBottomColor: C.border }]}>
        <Pressable style={[s.backBtn, { backgroundColor: C.panel, borderColor: C.border }]} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </Pressable>
        <View style={s.titleWrap}>
          <Text style={[s.title, { color: C.textBright }]}>Life Journal</Text>
          <Text style={[s.subtitle, { color: C.textMuted }]}>{entries.length} events across {people.length} people</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {entries.length === 0 ? (
        <View style={s.empty}>
          <Feather name="book-open" size={52} color={C.textDim} />
          <Text style={[s.emptyTitle, { color: C.textMuted }]}>No events yet</Text>
          <Text style={[s.emptyText, { color: C.textDim }]}>Add people and log interactions to build your journal</Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={item => item.key}
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <View style={s.dayHeader}>
                  <View style={[s.dayLine, { backgroundColor: C.border }]} />
                  <Text style={[s.dayLabel, { color: C.textMuted, backgroundColor: C.bg }]}>
                    {formatFull(item.date)}
                  </Text>
                  <View style={[s.dayLine, { backgroundColor: C.border }]} />
                </View>
              );
            }
            return (
              <EntryCard
                entry={item.entry}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({ pathname: '/profile/[id]', params: { id: item.entry.person.id } });
                }}
              />
            );
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  titleWrap: { alignItems: 'center' },
  title: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  list: { padding: 14 },
  dayHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 10, marginTop: 6,
  },
  dayLine: { flex: 1, height: 1 },
  dayLabel: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5,
    paddingHorizontal: 8,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 21 },
});
