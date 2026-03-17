import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import C from '@/constants/colors';

export const PRESET_AVATARS = [
  { id: 'a1',  bg: '#1C3247', icon: '🧑🏻', label: 'Light' },
  { id: 'a2',  bg: '#2B2218', icon: '🧑🏼', label: 'Sandy' },
  { id: 'a3',  bg: '#1E2E1E', icon: '🧑🏽', label: 'Olive' },
  { id: 'a4',  bg: '#27201A', icon: '🧑🏾', label: 'Warm' },
  { id: 'a5',  bg: '#1A1A2A', icon: '🧑🏿', label: 'Deep' },
  { id: 'a6',  bg: '#2E1A2E', icon: '👩🏻', label: 'Rose' },
  { id: 'a7',  bg: '#1A2C2C', icon: '👩🏽', label: 'Jade' },
  { id: 'a8',  bg: '#1A1E30', icon: '👩🏿', label: 'Indigo' },
  { id: 'a9',  bg: '#23291A', icon: '👨🏻', label: 'Sage' },
  { id: 'a10', bg: '#2A1E1E', icon: '👨🏽', label: 'Amber' },
  { id: 'a11', bg: '#1A2A20', icon: '👨🏿', label: 'Forest' },
  { id: 'a12', bg: '#28221A', icon: '🧔🏽', label: 'Rugged' },
];

export interface AvatarValue {
  type: 'initials' | 'preset' | 'photo';
  presetId?: string;
  photoUri?: string;
}

interface Props {
  value: AvatarValue;
  onChange: (v: AvatarValue) => void;
  name: string;
  size?: number;
}

export function AvatarDisplay({ value, name, size = 72 }: { value: AvatarValue; name: string; size?: number }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?';

  if (value.type === 'photo' && value.photoUri) {
    return (
      <Image
        source={{ uri: value.photoUri }}
        style={[ad.photo, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  if (value.type === 'preset' && value.presetId) {
    const preset = PRESET_AVATARS.find(a => a.id === value.presetId);
    if (preset) {
      return (
        <View style={[ad.preset, { width: size, height: size, borderRadius: size / 2, backgroundColor: preset.bg }]}>
          <Text style={{ fontSize: size * 0.42 }}>{preset.icon}</Text>
        </View>
      );
    }
  }

  return (
    <View style={[ad.initials, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[ad.initialsText, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
}

const ad = StyleSheet.create({
  photo: { borderWidth: 2, borderColor: C.accent + '77' },
  preset: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.border },
  initials: { backgroundColor: C.header, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  initialsText: { fontFamily: 'Inter_700Bold', color: C.text },
});

export function AvatarPicker({ value, onChange, name, size = 72 }: Props) {
  const [open, setOpen] = useState(false);

  const pickFromDevice = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access in your device settings to pick a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      onChange({ type: 'photo', photoUri: result.assets[0].uri });
      setOpen(false);
    }
  };

  return (
    <>
      <Pressable
        style={p.wrap}
        onPress={() => setOpen(true)}
      >
        <AvatarDisplay value={value} name={name} size={size} />
        <View style={p.editBadge}>
          <Feather name="camera" size={12} color={C.textBright} />
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={m.overlay} onPress={() => setOpen(false)} />
        <View style={m.sheet}>
          <View style={m.handle} />
          <Text style={m.title}>Choose Avatar</Text>

          <Pressable style={m.deviceBtn} onPress={pickFromDevice}>
            <Feather name="image" size={18} color={C.accent} />
            <Text style={m.deviceBtnText}>Pick from Device Photos</Text>
          </Pressable>

          <Text style={m.sectionLabel}>PRESET AVATARS</Text>
          <ScrollView contentContainerStyle={m.grid} showsVerticalScrollIndicator={false}>
            <Pressable
              style={[m.gridItem, value.type === 'initials' && m.gridItemActive]}
              onPress={() => { onChange({ type: 'initials' }); setOpen(false); }}
            >
              <View style={[m.initialsPreview]}>
                <Text style={m.initialsPreviewText}>
                  {name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'}
                </Text>
              </View>
              <Text style={m.gridLabel}>Initials</Text>
            </Pressable>

            {PRESET_AVATARS.map(a => (
              <Pressable
                key={a.id}
                style={[m.gridItem, value.type === 'preset' && value.presetId === a.id && m.gridItemActive]}
                onPress={() => { onChange({ type: 'preset', presetId: a.id }); setOpen(false); }}
              >
                <View style={[m.presetPreview, { backgroundColor: a.bg }]}>
                  <Text style={{ fontSize: 24 }}>{a.icon}</Text>
                </View>
                <Text style={m.gridLabel}>{a.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const p = StyleSheet.create({
  wrap: { position: 'relative', alignSelf: 'center', marginBottom: 20 },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.bg,
  },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#00000088' },
  sheet: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingBottom: 32,
    maxHeight: '75%',
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: 10, marginBottom: 16 },
  title: { fontSize: 16, fontFamily: 'Inter_700Bold', color: C.textBright, marginBottom: 14, textAlign: 'center' },
  deviceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.panel, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: C.accent + '55',
    marginBottom: 18,
  },
  deviceBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: C.accent },
  sectionLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: C.textMuted, letterSpacing: 2, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 8 },
  gridItem: {
    width: '22%',
    alignItems: 'center',
    gap: 5,
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  gridItemActive: { borderColor: C.accent, backgroundColor: C.accent + '15' },
  initialsPreview: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.header,
    borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  initialsPreviewText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: C.text },
  presetPreview: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  gridLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', color: C.textMuted, textAlign: 'center' },
});
