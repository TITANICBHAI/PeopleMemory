import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarPicker, AvatarValue } from '@/components/AvatarPicker';
import C from '@/constants/colors';
import { Person, useApp } from '@/context/AppContext';

const PRESET_TAGS = ['Friend', 'Work', 'Family', 'Online'];

function FieldLabel({ text }: { text: string }) {
  return <Text style={fl.text}>{text}</Text>;
}
const fl = StyleSheet.create({
  text: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: C.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
});

function Field({ label, value, onChange, multiline, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; placeholder?: string;
}) {
  return (
    <View style={f.wrap}>
      <FieldLabel text={label} />
      <TextInput
        style={[f.input, multiline && f.multi]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.textDim}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}
const f = StyleSheet.create({
  wrap: { marginBottom: 18 },
  input: {
    backgroundColor: C.panel,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    color: C.text,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: 14,
    paddingVertical: 12,
    height: 48,
  },
  multi: {
    height: 80,
    lineHeight: 20,
  },
});

function TagsEditor({
  tags, onAdd, onRemove,
}: { tags: string[]; onAdd: (t: string) => void; onRemove: (t: string) => void }) {
  const [custom, setCustom] = useState('');
  return (
    <View style={te.wrap}>
      <FieldLabel text="Tags" />
      <View style={te.presets}>
        {PRESET_TAGS.map(t => {
          const active = tags.includes(t);
          return (
            <Pressable
              key={t}
              style={[te.preset, active && te.presetActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); active ? onRemove(t) : onAdd(t); }}
            >
              <Text style={[te.presetText, active && te.presetTextActive]}>{t}</Text>
            </Pressable>
          );
        })}
      </View>
      {tags.filter(t => !PRESET_TAGS.includes(t)).length > 0 && (
        <View style={te.customs}>
          {tags.filter(t => !PRESET_TAGS.includes(t)).map(t => (
            <Pressable key={t} style={te.customTag} onPress={() => onRemove(t)}>
              <Text style={te.customTagText}>{t}</Text>
              <Feather name="x" size={12} color={C.textMuted} />
            </Pressable>
          ))}
        </View>
      )}
      <View style={te.addRow}>
        <TextInput
          style={te.input}
          value={custom}
          onChangeText={setCustom}
          placeholder="Custom tag…"
          placeholderTextColor={C.textDim}
          returnKeyType="done"
          onSubmitEditing={() => {
            if (custom.trim()) { onAdd(custom.trim()); setCustom(''); }
          }}
        />
        <Pressable
          style={te.addBtn}
          onPress={() => { if (custom.trim()) { onAdd(custom.trim()); setCustom(''); } }}
        >
          <Feather name="plus" size={18} color={C.accent} />
        </Pressable>
      </View>
    </View>
  );
}
const te = StyleSheet.create({
  wrap: { marginBottom: 18 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  preset: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.border,
  },
  presetActive: { backgroundColor: C.accent + '22', borderColor: C.accent },
  presetText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: C.textMuted },
  presetTextActive: { color: C.accent },
  customs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  customTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: C.panelHigh,
    borderWidth: 1,
    borderColor: C.border,
  },
  customTagText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: C.text },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: C.panel,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    color: C.text,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: 14,
    height: 44,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

function TrustSlider({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const active = value !== null;
  const num = value ?? 5;
  const color = num <= 3 ? C.red : num <= 6 ? C.yellow : C.green;
  return (
    <View style={ts.wrap}>
      <View style={ts.header}>
        <FieldLabel text={active ? `Trust Level — ${num}/10` : 'Trust Level'} />
        <Pressable
          style={[ts.naBtn, !active && ts.naBtnOn]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(active ? null : 5); }}
        >
          <Text style={[ts.naBtnText, !active && ts.naBtnTextOn]}>N/A</Text>
        </Pressable>
      </View>
      {active && (
        <>
          <View style={ts.track}>
            {[...Array(11)].map((_, i) => (
              <Pressable
                key={i}
                style={[ts.pip, i <= num ? { backgroundColor: color } : { backgroundColor: C.border }, i === num && { width: 18, height: 18, borderRadius: 9 }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(i); }}
              />
            ))}
          </View>
          <View style={ts.labels}>
            <Text style={ts.labelText}>No trust</Text>
            <Text style={[ts.levelText, { color }]}>{num <= 3 ? 'Low' : num <= 6 ? 'Moderate' : 'High'}</Text>
            <Text style={ts.labelText}>Full trust</Text>
          </View>
        </>
      )}
    </View>
  );
}
const ts = StyleSheet.create({
  wrap: { marginBottom: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  naBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.border, backgroundColor: C.panel },
  naBtnOn: { borderColor: C.accent, backgroundColor: C.accent + '22' },
  naBtnText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: C.textMuted },
  naBtnTextOn: { color: C.accent },
  track: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2, height: 36 },
  pip: { width: 12, height: 12, borderRadius: 6 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  labelText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textDim },
  levelText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});

type FormData = Omit<Person, 'id' | 'createdAt' | 'updatedAt'>;

const blank: FormData = {
  name: '',
  photoUri: undefined,
  tags: [],
  trustLevel: null,
  description: '',
  likes: '',
  dislikes: '',
  thingsToRemember: '',
  quickFacts: '',
  customDates: [],
};

function avatarValueToPhotoUri(av: AvatarValue): string | undefined {
  if (av.type === 'preset' && av.presetId) return `preset:${av.presetId}`;
  if (av.type === 'photo' && av.photoUri) return av.photoUri;
  return undefined;
}

function photoUriToAvatarValue(uri?: string): AvatarValue {
  if (!uri) return { type: 'initials' };
  if (uri.startsWith('preset:')) return { type: 'preset', presetId: uri.slice(7) };
  return { type: 'photo', photoUri: uri };
}

export default function AddScreen() {
  const { addPerson } = useApp();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<FormData>(blank);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof FormData, value: any) => setForm(f => ({ ...f, [key]: value }));

  const avatarValue = photoUriToAvatarValue(form.photoUri);

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Name required', 'Please enter the person\'s name.');
      return;
    }
    setSaving(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const person = await addPerson({ ...form, name: form.name.trim() });
      router.replace({ pathname: '/profile/[id]', params: { id: person.id } });
    } catch {
      Alert.alert('Error', 'Failed to save. Please try again.');
      setSaving(false);
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) }]}>
      <View style={s.navbar}>
        <Pressable style={s.closeBtn} onPress={() => router.back()}>
          <Feather name="x" size={20} color={C.text} />
        </Pressable>
        <Text style={s.title}>ADD PERSON</Text>
        <Pressable
          style={[s.saveBtn, (!form.name.trim() || saving) && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!form.name.trim() || saving}
        >
          <Text style={s.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
      >
        <AvatarPicker
          value={avatarValue}
          name={form.name}
          onChange={av => set('photoUri', avatarValueToPhotoUri(av))}
        />

        <Field
          label="Name *"
          value={form.name}
          onChange={v => set('name', v)}
          placeholder="Full name…"
        />

        <TagsEditor
          tags={form.tags}
          onAdd={t => !form.tags.includes(t) && set('tags', [...form.tags, t])}
          onRemove={t => set('tags', form.tags.filter(x => x !== t))}
        />

        <TrustSlider value={form.trustLevel} onChange={v => set('trustLevel', v)} />

        <View style={s.divider}><Text style={s.dividerText}>NOTES</Text></View>

        <Field label="Description" value={form.description} onChange={v => set('description', v)} multiline placeholder="Who is this person?" />
        <Field label="Likes" value={form.likes} onChange={v => set('likes', v)} multiline placeholder="Interests, hobbies…" />
        <Field label="Dislikes" value={form.dislikes} onChange={v => set('dislikes', v)} multiline placeholder="Pet peeves, avoidances…" />
        <Field label="Things to Remember" value={form.thingsToRemember} onChange={v => set('thingsToRemember', v)} multiline placeholder="Key reminders, sensitive info…" />
        <Field label="Quick Facts" value={form.quickFacts} onChange={v => set('quickFacts', v)} multiline placeholder="Job, city, how you know them…" />
      </KeyboardAwareScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.panel,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  title: { fontSize: 12, fontFamily: 'Inter_700Bold', color: C.textMuted, letterSpacing: 3 },
  saveBtn: {
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  saveBtnDisabled: { backgroundColor: C.border },
  saveBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.textBright },
  divider: { borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 18, paddingBottom: 8 },
  dividerText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: C.textMuted,
    letterSpacing: 2,
  },
});
