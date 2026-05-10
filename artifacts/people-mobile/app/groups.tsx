import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/constants/colors';
import { Group, useApp } from '@/context/AppContext';
import { calculateHealthScore } from '@/utils/health';

const GROUP_EMOJIS = ['👥', '💼', '🎓', '🏠', '❤️', '🌍', '🎮', '⚽', '🎵', '🍕', '💡', '🔥'];
const GROUP_COLORS = ['#007ACC', '#C678DD', '#4EC94E', '#E5C07B', '#F44747', '#56B6C2', '#98C379', '#61AFEF'];

function GroupCard({ group, memberCount, avgHealth, onPress, onDelete }: {
  group: Group;
  memberCount: number;
  avgHealth: number;
  onPress: () => void;
  onDelete: () => void;
}) {
  const C = useColors();
  const healthColor = avgHealth >= 70 ? C.green : avgHealth >= 45 ? '#E5C07B' : C.red;

  return (
    <Pressable
      style={({ pressed }) => [gc.card, { backgroundColor: C.panel, borderColor: C.border }, pressed && { backgroundColor: C.panelHigh }]}
      onPress={onPress}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(`Delete "${group.name}"?`, 'The group will be removed. People will not be deleted.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: onDelete },
        ]);
      }}
    >
      <View style={[gc.emoji, { backgroundColor: group.color + '22' }]}>
        <Text style={gc.emojiText}>{group.emoji}</Text>
      </View>
      <View style={gc.info}>
        <Text style={[gc.name, { color: C.textBright }]}>{group.name}</Text>
        <Text style={[gc.meta, { color: C.textMuted }]}>{memberCount} {memberCount === 1 ? 'person' : 'people'}</Text>
      </View>
      {memberCount > 0 && (
        <View style={[gc.healthBadge, { backgroundColor: healthColor + '22', borderColor: healthColor + '55' }]}>
          <View style={[gc.healthDot, { backgroundColor: healthColor }]} />
          <Text style={[gc.healthText, { color: healthColor }]}>{Math.round(avgHealth)}%</Text>
        </View>
      )}
      <Feather name="chevron-right" size={16} color={C.textDim} />
    </Pressable>
  );
}
const gc = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1,
  },
  emoji: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emojiText: { fontSize: 22 },
  info: { flex: 1 },
  name: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  meta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  healthBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1,
  },
  healthDot: { width: 6, height: 6, borderRadius: 3 },
  healthText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});

export default function GroupsScreen() {
  const C = useColors();
  const { groups, people, addGroup, deleteGroup } = useApp();
  const insets = useSafeAreaInsets();

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('👥');
  const [newColor, setNewColor] = useState(GROUP_COLORS[0]);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    await addGroup({ name: newName.trim(), emoji: newEmoji, color: newColor, memberIds: [], description: '' });
    setCreating(false);
    setNewName('');
    setNewEmoji('👥');
    setNewColor(GROUP_COLORS[0]);
    setCreateOpen(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const getAvgHealth = (memberIds: string[]) => {
    const members = people.filter(p => memberIds.includes(p.id));
    if (members.length === 0) return 0;
    const scores = members.map(p => calculateHealthScore(p).score);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0), backgroundColor: C.bg }]}>
      <View style={[s.navbar, { borderBottomColor: C.border }]}>
        <Pressable style={[s.iconBtn, { backgroundColor: C.panel, borderColor: C.border }]} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </Pressable>
        <Text style={[s.title, { color: C.textBright }]}>Groups</Text>
        <Pressable
          style={[s.iconBtn, { backgroundColor: C.accent, borderColor: C.accent }]}
          onPress={() => setCreateOpen(true)}
        >
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      {groups.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>👥</Text>
          <Text style={[s.emptyTitle, { color: C.textMuted }]}>No groups yet</Text>
          <Text style={[s.emptyText, { color: C.textDim }]}>Tap + to create a group like "Work Team" or "Close Friends"</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={g => g.id}
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <GroupCard
              group={item}
              memberCount={item.memberIds.length}
              avgHealth={getAvgHealth(item.memberIds)}
              onPress={() => router.push({ pathname: '/group/[id]', params: { id: item.id } })}
              onDelete={() => deleteGroup(item.id)}
            />
          )}
        />
      )}

      {/* Create Group Modal */}
      <Modal visible={createOpen} transparent animationType="slide" onRequestClose={() => setCreateOpen(false)}>
        <Pressable style={m.backdrop} onPress={() => setCreateOpen(false)} />
        <View style={[m.sheet, { backgroundColor: C.panel, borderColor: C.border }]}>
          <View style={[m.handle, { backgroundColor: C.border }]} />
          <Text style={[m.title, { color: C.textBright }]}>New Group</Text>

          <Text style={[m.fieldLabel, { color: C.textMuted }]}>Name</Text>
          <TextInput
            style={[m.input, { backgroundColor: C.bg, borderColor: C.border, color: C.text }]}
            value={newName}
            onChangeText={setNewName}
            placeholder="e.g. Work Team, College Friends…"
            placeholderTextColor={C.textDim}
            autoFocus
            maxLength={40}
          />

          <Text style={[m.fieldLabel, { color: C.textMuted }]}>Emoji</Text>
          <View style={m.emojiGrid}>
            {GROUP_EMOJIS.map(e => (
              <Pressable
                key={e}
                style={[m.emojiBtn, newEmoji === e && { backgroundColor: C.accent + '33', borderColor: C.accent }]}
                onPress={() => setNewEmoji(e)}
              >
                <Text style={m.emojiBtnText}>{e}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[m.fieldLabel, { color: C.textMuted }]}>Color</Text>
          <View style={m.colorRow}>
            {GROUP_COLORS.map(col => (
              <Pressable
                key={col}
                style={[m.colorBtn, { backgroundColor: col }, newColor === col && m.colorBtnActive]}
                onPress={() => setNewColor(col)}
              >
                {newColor === col ? <Feather name="check" size={12} color="#fff" /> : null}
              </Pressable>
            ))}
          </View>

          <View style={m.actions}>
            <Pressable style={[m.cancelBtn, { backgroundColor: C.bg, borderColor: C.border }]} onPress={() => setCreateOpen(false)}>
              <Text style={[m.cancelText, { color: C.textMuted }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[m.createBtn, { backgroundColor: C.accent }, (!newName.trim() || creating) && m.disabled]}
              onPress={handleCreate}
              disabled={!newName.trim() || creating}
            >
              <Text style={m.createText}>{creating ? 'Creating…' : 'Create'}</Text>
            </Pressable>
          </View>
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
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  title: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  list: { padding: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 21 },
});

const m = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 48, borderWidth: 1,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 20 },
  fieldLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  emojiBtn: { width: 44, height: 44, borderRadius: 10, borderWidth: 1.5, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  emojiBtnText: { fontSize: 22 },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  colorBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  colorBtnActive: { borderWidth: 3, borderColor: '#fff' },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  cancelText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  createBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  disabled: { opacity: 0.4 },
  createText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
