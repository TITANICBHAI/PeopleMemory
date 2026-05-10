import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
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
import { avatarColorForName, useColors } from '@/constants/colors';
import { Person, useApp } from '@/context/AppContext';
import { calculateHealthScore } from '@/utils/health';
import { Image } from 'react-native';

function PersonAvatar({ person, size = 36 }: { person: Person; size?: number }) {
  const C = useColors();
  const initials = person.name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
  if (person.photoUri?.startsWith('preset:')) {
    const preset = PRESET_AVATARS.find(a => a.id === person.photoUri!.slice(7));
    if (preset) return <Image source={{ uri: preset.uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  if (person.photoUri && !person.photoUri.startsWith('preset:')) {
    return <Image source={{ uri: person.photoUri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  const nc = avatarColorForName(person.name);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: nc.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.36, fontFamily: 'Inter_700Bold', color: nc.text }}>{initials}</Text>
    </View>
  );
}

export default function GroupDetailScreen() {
  const C = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { groups, people, updateGroup } = useApp();
  const insets = useSafeAreaInsets();
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [search, setSearch] = useState('');

  const group = groups.find(g => g.id === id);

  const members = useMemo(
    () => people.filter(p => group?.memberIds.includes(p.id)),
    [people, group]
  );
  const nonMembers = useMemo(
    () => people.filter(p => !group?.memberIds.includes(p.id)).filter(p =>
      !search || p.name.toLowerCase().includes(search.toLowerCase())
    ),
    [people, group, search]
  );

  const avgHealth = useMemo(() => {
    if (members.length === 0) return null;
    const scores = members.map(p => calculateHealthScore(p).score);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [members]);

  const upcomingEvents = useMemo(() => {
    const events: { person: Person; label: string; date: Date; days: number }[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const in30 = new Date(now.getTime() + 30 * 86400000);
    for (const person of members) {
      if (person.birthday) {
        const bd = new Date(person.birthday);
        const thisYear = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
        if (thisYear < now) thisYear.setFullYear(now.getFullYear() + 1);
        if (thisYear <= in30) {
          const days = Math.round((thisYear.getTime() - now.getTime()) / 86400000);
          events.push({ person, label: 'Birthday', date: thisYear, days });
        }
      }
      if (person.nextMeeting) {
        const nm = new Date(person.nextMeeting);
        if (nm >= now && nm <= in30) {
          const days = Math.round((nm.getTime() - now.getTime()) / 86400000);
          events.push({ person, label: 'Meeting', date: nm, days });
        }
      }
    }
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [members]);

  if (!group) {
    return (
      <View style={[s.root, { paddingTop: insets.top, backgroundColor: C.bg }]}>
        <Text style={[{ color: C.textMuted, textAlign: 'center', marginTop: 40 }]}>Group not found</Text>
      </View>
    );
  }

  const removeMember = async (personId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateGroup({ ...group, memberIds: group.memberIds.filter(id => id !== personId) });
  };

  const addMember = async (personId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateGroup({ ...group, memberIds: [...group.memberIds, personId] });
  };

  const healthColor = avgHealth === null ? C.textDim
    : avgHealth >= 70 ? C.green : avgHealth >= 45 ? '#E5C07B' : C.red;

  return (
    <View style={[s.root, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0), backgroundColor: C.bg }]}>
      <View style={[s.navbar, { borderBottomColor: C.border }]}>
        <Pressable style={[s.iconBtn, { backgroundColor: C.panel, borderColor: C.border }]} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </Pressable>
        <View style={s.navCenter}>
          <Text style={s.groupEmoji}>{group.emoji}</Text>
          <Text style={[s.groupName, { color: C.textBright }]}>{group.name}</Text>
        </View>
        <Pressable
          style={[s.iconBtn, { backgroundColor: C.accent + '20', borderColor: C.accent + '55' }]}
          onPress={() => setAddMemberOpen(true)}
        >
          <Feather name="user-plus" size={18} color={C.accent} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={[s.statCard, { backgroundColor: C.panel, borderColor: C.border }]}>
            <Text style={[s.statNum, { color: C.textBright }]}>{members.length}</Text>
            <Text style={[s.statLabel, { color: C.textMuted }]}>Members</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: C.panel, borderColor: C.border }]}>
            <Text style={[s.statNum, { color: healthColor }]}>{avgHealth !== null ? `${avgHealth}%` : '—'}</Text>
            <Text style={[s.statLabel, { color: C.textMuted }]}>Avg Health</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: C.panel, borderColor: C.border }]}>
            <Text style={[s.statNum, { color: C.accent }]}>{upcomingEvents.length}</Text>
            <Text style={[s.statLabel, { color: C.textMuted }]}>Upcoming</Text>
          </View>
        </View>

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <View style={[s.section, { backgroundColor: C.panel, borderColor: C.border }]}>
            <Text style={[s.sectionTitle, { color: C.textMuted }]}>UPCOMING EVENTS</Text>
            {upcomingEvents.map((ev, i) => (
              <Pressable
                key={`${ev.person.id}-${ev.label}`}
                style={[s.evRow, i > 0 && { borderTopColor: C.border, borderTopWidth: 1 }]}
                onPress={() => router.push({ pathname: '/profile/[id]', params: { id: ev.person.id } })}
              >
                <PersonAvatar person={ev.person} size={32} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.evName, { color: C.textBright }]}>{ev.person.name}</Text>
                  <Text style={[s.evLabel, { color: C.textMuted }]}>{ev.label}</Text>
                </View>
                <Text style={[s.evDays, { color: ev.days === 0 ? C.accent : C.textMuted }]}>
                  {ev.days === 0 ? 'Today' : ev.days === 1 ? 'Tomorrow' : `In ${ev.days}d`}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Members */}
        <Text style={[s.sectionTitle, { color: C.textMuted, marginHorizontal: 0, marginBottom: 8 }]}>MEMBERS</Text>
        {members.length === 0 ? (
          <View style={[s.emptyCard, { backgroundColor: C.panel, borderColor: C.border }]}>
            <Text style={[s.emptyText, { color: C.textDim }]}>No members yet. Tap + to add people to this group.</Text>
          </View>
        ) : (
          members.map(person => {
            const health = calculateHealthScore(person);
            return (
              <Pressable
                key={person.id}
                style={({ pressed }) => [s.memberCard, { backgroundColor: C.panel, borderColor: C.border }, pressed && { backgroundColor: C.panelHigh }]}
                onPress={() => router.push({ pathname: '/profile/[id]', params: { id: person.id } })}
              >
                <PersonAvatar person={person} size={42} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.memberName, { color: C.textBright }]}>{person.name}</Text>
                  <Text style={[s.memberHealth, { color: health.color }]}>{health.label} · {health.reason}</Text>
                </View>
                <Pressable
                  style={[s.removeBtn, { backgroundColor: C.red + '15' }]}
                  onPress={() => removeMember(person.id)}
                  hitSlop={8}
                >
                  <Feather name="user-minus" size={14} color={C.red} />
                </Pressable>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* Add Member Modal */}
      <Modal visible={addMemberOpen} transparent animationType="slide" onRequestClose={() => setAddMemberOpen(false)}>
        <Pressable style={am.backdrop} onPress={() => setAddMemberOpen(false)} />
        <View style={[am.sheet, { backgroundColor: C.panel, borderColor: C.border }]}>
          <View style={[am.handle, { backgroundColor: C.border }]} />
          <Text style={[am.title, { color: C.textBright }]}>Add to {group.name}</Text>
          <View style={[am.searchWrap, { backgroundColor: C.bg, borderColor: C.border }]}>
            <Feather name="search" size={14} color={C.textDim} />
            <TextInput
              style={[am.searchInput, { color: C.text }]}
              value={search}
              onChangeText={setSearch}
              placeholder="Search people…"
              placeholderTextColor={C.textDim}
              autoFocus
            />
          </View>
          <FlatList
            data={nonMembers}
            keyExtractor={p => p.id}
            style={am.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={[am.empty, { color: C.textDim }]}>
                {people.length === members.length ? 'Everyone is already in this group' : 'No people found'}
              </Text>
            }
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [am.personRow, { borderBottomColor: C.border }, pressed && { backgroundColor: C.panelHigh }]}
                onPress={() => addMember(item.id)}
              >
                <PersonAvatar person={item} size={36} />
                <Text style={[am.personName, { color: C.textBright }]}>{item.name}</Text>
                <Feather name="plus" size={18} color={C.accent} />
              </Pressable>
            )}
          />
        </View>
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
  navCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupEmoji: { fontSize: 20 },
  groupName: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  scroll: { padding: 16, gap: 12 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1, alignItems: 'center', gap: 4 },
  statNum: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  section: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 0 },
  sectionTitle: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 2, marginBottom: 10 },
  evRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  evName: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  evLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  evDays: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  memberCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1,
  },
  memberName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  memberHealth: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  removeBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { borderRadius: 14, padding: 20, borderWidth: 1, alignItems: 'center' },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});

const am = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 48, maxHeight: '75%', borderWidth: 1,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 17, fontFamily: 'Inter_700Bold', marginBottom: 14 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, height: 42, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  list: { maxHeight: 300 },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  personName: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
  empty: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingVertical: 20 },
});
