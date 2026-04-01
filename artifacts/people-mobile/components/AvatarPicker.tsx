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

import { useColors, avatarColorForName } from '@/constants/colors';

const BASE = 'https://api.dicebear.com/9.x/avataaars/png?size=200&backgroundColor=1a3a6b';

export const PRESET_AVATARS = [
  // --- Male ---
  {
    id: 'm1', label: 'Alex', gender: 'male',
    uri: `${BASE}&seed=Alex&top[]=shortHairShortWaved&hairColor[]=brownDark&skin[]=light&facialHair[]=beardLight&clothesColor[]=blue01`,
  },
  {
    id: 'm2', label: 'Marcus', gender: 'male',
    uri: `${BASE}&seed=Marcus&top[]=shortHairTheCaesar&hairColor[]=black&skin[]=light&clothesColor[]=black`,
  },
  {
    id: 'm3', label: 'Jordan', gender: 'male',
    uri: `${BASE}&seed=Jordan&top[]=shortHairShortFlat&hairColor[]=auburn&skin[]=pale&clothesColor[]=gray01`,
  },
  {
    id: 'm4', label: 'Ethan', gender: 'male',
    uri: `${BASE}&seed=Ethan&top[]=shortHairShortRound&hairColor[]=blonde&skin[]=pale&clothesColor[]=blue02`,
  },
  {
    id: 'm5', label: 'Carlos', gender: 'male',
    uri: `${BASE}&seed=Carlos&top[]=shortHairTheCaesarSidePart&hairColor[]=black&skin[]=brown&clothesColor[]=gray02`,
  },
  {
    id: 'm6', label: 'Omar', gender: 'male',
    uri: `${BASE}&seed=Omar&top[]=shortHairDreads01&hairColor[]=black&skin[]=darkBrown&clothesColor[]=blue01`,
  },
  {
    id: 'm7', label: 'Liam', gender: 'male',
    uri: `${BASE}&seed=Liam&top[]=shortHairShortCurly&hairColor[]=red&skin[]=pale&clothesColor[]=pastelRed`,
  },
  {
    id: 'm8', label: 'Noah', gender: 'male',
    uri: `${BASE}&seed=Noah&top[]=shortHairSides&hairColor[]=brown&skin[]=light&facialHair[]=moustacheMagnum&clothesColor[]=black`,
  },
  // --- Female ---
  {
    id: 'f1', label: 'Emma', gender: 'female',
    uri: `${BASE}&seed=Emma&top[]=longHairStraight&hairColor[]=brownDark&skin[]=light&clothesColor[]=pink`,
  },
  {
    id: 'f2', label: 'Sofia', gender: 'female',
    uri: `${BASE}&seed=Sofia&top[]=longHairCurly&hairColor[]=black&skin[]=brown&clothesColor[]=blue01`,
  },
  {
    id: 'f3', label: 'Ava', gender: 'female',
    uri: `${BASE}&seed=Ava&top[]=longHairBob&hairColor[]=blonde&skin[]=pale&clothesColor[]=pastelBlue`,
  },
  {
    id: 'f4', label: 'Mia', gender: 'female',
    uri: `${BASE}&seed=Mia&top[]=longHairBigHair&hairColor[]=auburn&skin[]=light&clothesColor[]=pastelOrange`,
  },
  {
    id: 'f5', label: 'Zara', gender: 'female',
    uri: `${BASE}&seed=Zara&top[]=longHairFroBands&hairColor[]=black&skin[]=darkBrown&clothesColor[]=blue02`,
  },
  {
    id: 'f6', label: 'Layla', gender: 'female',
    uri: `${BASE}&seed=Layla&top[]=longHairStraight2&hairColor[]=black&skin[]=brown&clothesColor[]=gray01`,
  },
  {
    id: 'f7', label: 'Chloe', gender: 'female',
    uri: `${BASE}&seed=Chloe&top[]=longHairCurvy&hairColor[]=blonde&skin[]=pale&clothesColor[]=pastelGreen`,
  },
  {
    id: 'f8', label: 'Nora', gender: 'female',
    uri: `${BASE}&seed=Nora&top[]=longHairDreads&hairColor[]=red&skin[]=light&clothesColor[]=pink`,
  },
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
  const C = useColors();
  const initials = name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?';

  if (value.type === 'photo' && value.photoUri) {
    return (
      <Image
        source={{ uri: value.photoUri }}
        style={[ad.circle, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  if (value.type === 'preset' && value.presetId) {
    const preset = PRESET_AVATARS.find(a => a.id === value.presetId);
    if (preset) {
      return (
        <View style={[ad.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: '#1a3a6b', overflow: 'hidden' }]}>
          <Image
            source={{ uri: preset.uri }}
            style={{ width: size, height: size }}
            resizeMode="cover"
          />
        </View>
      );
    }
  }

  const colors = avatarColorForName(name);
  return (
    <View style={[ad.circle, ad.initials, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.bg, borderColor: colors.text + '66' }]}>
      <Text style={[ad.initialsText, { fontSize: size * 0.35, color: colors.text }]}>{initials}</Text>
    </View>
  );
}

const ad = StyleSheet.create({
  circle: { borderWidth: 2 },
  initials: { alignItems: 'center', justifyContent: 'center' },
  initialsText: { fontFamily: 'Inter_700Bold' },
});

const MALES = PRESET_AVATARS.filter(a => a.gender === 'male');
const FEMALES = PRESET_AVATARS.filter(a => a.gender === 'female');

export function AvatarPicker({ value, onChange, name, size = 72 }: Props) {
  const C = useColors();
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

  const select = (id: string) => {
    onChange({ type: 'preset', presetId: id });
    setOpen(false);
  };

  return (
    <>
      <Pressable style={p.wrap} onPress={() => setOpen(true)}>
        <AvatarDisplay value={value} name={name} size={size} />
        <View style={[p.editBadge, { backgroundColor: C.accent, borderColor: C.bg }]}>
          <Feather name="camera" size={12} color={C.textBright} />
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={m.overlay} onPress={() => setOpen(false)} />
        <View style={[m.sheet, { backgroundColor: C.bg }]}>
          <View style={[m.handle, { backgroundColor: C.border }]} />
          <Text style={[m.title, { color: C.textBright }]}>Choose Avatar</Text>

          <Pressable style={[m.deviceBtn, { backgroundColor: C.panel, borderColor: C.accent + '55' }]} onPress={pickFromDevice}>
            <Feather name="image" size={18} color={C.accent} />
            <Text style={[m.deviceBtnText, { color: C.accent }]}>Pick from Device Photos</Text>
          </Pressable>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[m.sectionLabel, { color: C.textMuted }]}>MALE</Text>
            <View style={m.grid}>
              {MALES.map(a => (
                <Pressable
                  key={a.id}
                  style={[m.gridItem, value.type === 'preset' && value.presetId === a.id && { borderColor: C.accent, backgroundColor: C.accent + '18' }]}
                  onPress={() => select(a.id)}
                >
                  <View style={[m.avatarWrap, { borderColor: C.border }]}>
                    <Image source={{ uri: a.uri }} style={m.avatarImg} resizeMode="cover" />
                  </View>
                  <Text style={[m.gridLabel, { color: C.textMuted }]}>{a.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[m.sectionLabel, { color: C.textMuted, marginTop: 16 }]}>FEMALE</Text>
            <View style={m.grid}>
              {FEMALES.map(a => (
                <Pressable
                  key={a.id}
                  style={[m.gridItem, value.type === 'preset' && value.presetId === a.id && { borderColor: C.accent, backgroundColor: C.accent + '18' }]}
                  onPress={() => select(a.id)}
                >
                  <View style={[m.avatarWrap, { borderColor: C.border }]}>
                    <Image source={{ uri: a.uri }} style={m.avatarImg} resizeMode="cover" />
                  </View>
                  <Text style={[m.gridLabel, { color: C.textMuted }]}>{a.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[m.sectionLabel2, { color: C.textMuted }]}>OR USE INITIALS</Text>
            <Pressable
              style={[m.initialsBtn, { backgroundColor: C.panel, borderColor: C.border }, value.type === 'initials' && { borderColor: C.accent, backgroundColor: C.accent + '15' }]}
              onPress={() => { onChange({ type: 'initials' }); setOpen(false); }}
            >
              {(() => {
                const nc = avatarColorForName(name);
                return (
                  <View style={[m.initialsCircle, { backgroundColor: nc.bg }]}>
                    <Text style={[m.initialsText, { color: nc.text }]}>
                      {name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '?'}
                    </Text>
                  </View>
                );
              })()}
              <Text style={[m.initialsBtnLabel, { color: C.text }]}>Use Initials</Text>
            </Pressable>

            <View style={{ height: 16 }} />
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
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#00000088' },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 16 },
  title: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 14, textAlign: 'center' },
  deviceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1,
    marginBottom: 18,
  },
  deviceBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  sectionLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 2, marginBottom: 10 },
  sectionLabel2: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 2, marginBottom: 10, marginTop: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: {
    width: '22%',
    alignItems: 'center',
    gap: 5,
    padding: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarWrap: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: '#1a3a6b',
    overflow: 'hidden',
    borderWidth: 2,
  },
  avatarImg: { width: 58, height: 58 },
  gridLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  initialsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 1,
  },
  initialsCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  initialsText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  initialsBtnLabel: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
