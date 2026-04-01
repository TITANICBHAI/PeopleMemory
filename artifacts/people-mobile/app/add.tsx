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
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarPicker, AvatarValue } from '@/components/AvatarPicker';
import { ContactNameField } from '@/components/ContactNameField';
import { useColors } from '@/constants/colors';
import { Person, PersonDate, useApp } from '@/context/AppContext';
import { scheduleNextMeetingNotification } from '@/utils/notifications';

const PRESET_TAGS = ['Friend', 'Work', 'Family', 'Online'];

function FieldLabel({ text }: { text: string }) {
  const C = useColors();
  return <Text style={[fl.text, { color: C.textMuted }]}>{text}</Text>;
}
const fl = StyleSheet.create({
  text: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
});

function Field({ label, value, onChange, multiline, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; placeholder?: string;
}) {
  const C = useColors();
  return (
    <View style={f.wrap}>
      <FieldLabel text={label} />
      <TextInput
        style={[f.input, multiline && f.multi, { backgroundColor: C.panel, borderColor: C.border, color: C.text }]}
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
    borderRadius: 12,
    borderWidth: 1,
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
  const C = useColors();
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
              style={[te.preset, { backgroundColor: C.panel, borderColor: C.border }, active && { backgroundColor: C.accent + '22', borderColor: C.accent }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); active ? onRemove(t) : onAdd(t); }}
            >
              <Text style={[te.presetText, { color: C.textMuted }, active && { color: C.accent }]}>{t}</Text>
            </Pressable>
          );
        })}
      </View>
      {tags.filter(t => !PRESET_TAGS.includes(t)).length > 0 && (
        <View style={te.customs}>
          {tags.filter(t => !PRESET_TAGS.includes(t)).map(t => (
            <Pressable key={t} style={[te.customTag, { backgroundColor: C.panelHigh, borderColor: C.border }]} onPress={() => onRemove(t)}>
              <Text style={[te.customTagText, { color: C.text }]}>{t}</Text>
              <Feather name="x" size={12} color={C.textMuted} />
            </Pressable>
          ))}
        </View>
      )}
      <View style={te.addRow}>
        <TextInput
          style={[te.input, { backgroundColor: C.panel, borderColor: C.border, color: C.text }]}
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
          style={[te.addBtn, { backgroundColor: C.panel, borderColor: C.border }]}
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
  preset: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  presetText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  customs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  customTag: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
  customTagText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, borderRadius: 12, borderWidth: 1, fontSize: 14, fontFamily: 'Inter_400Regular', paddingHorizontal: 14, height: 44 },
  addBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

function TrustSlider({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const C = useColors();
  const active = value !== null;
  const num = value ?? 5;
  const color = num <= 3 ? C.red : num <= 6 ? C.yellow : C.green;
  return (
    <View style={ts.wrap}>
      <View style={ts.header}>
        <FieldLabel text={active ? `Trust Level — ${num}/10` : 'Trust Level'} />
        <Pressable
          style={[ts.naBtn, { borderColor: C.border, backgroundColor: C.panel }, !active && { borderColor: C.accent, backgroundColor: C.accent + '22' }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(active ? null : 5); }}
        >
          <Text style={[ts.naBtnText, { color: C.textMuted }, !active && { color: C.accent }]}>N/A</Text>
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
  naBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  naBtnText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  track: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2, height: 36 },
  pip: { width: 12, height: 12, borderRadius: 6 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  labelText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  levelText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 9); }

function DatesSection({
  birthday, firstMet, lastMet, nextMeeting, nextMeetingTime, customDates,
  onBirthday, onFirstMet, onLastMet, onNextMeeting, onNextMeetingTime, onCustomDates,
}: {
  birthday?: string; firstMet?: string; lastMet?: string;
  nextMeeting?: string; nextMeetingTime?: string; customDates: PersonDate[];
  onBirthday: (v?: string) => void; onFirstMet: (v?: string) => void;
  onLastMet: (v?: string) => void; onNextMeeting: (v?: string) => void;
  onNextMeetingTime: (v?: string) => void; onCustomDates: (d: PersonDate[]) => void;
}) {
  const C = useColors();
  const [open, setOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newDate, setNewDate] = useState('');
  const hasDates = !!(birthday || firstMet || lastMet || nextMeeting || customDates.length > 0);

  return (
    <View style={ds.wrap}>
      <Pressable
        style={[ds.header, { backgroundColor: C.panel, borderColor: C.border }]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setOpen(o => !o); }}
      >
        <View style={ds.headerLeft}>
          <Feather name="calendar" size={15} color={C.accent} />
          <Text style={[ds.headerText, { color: C.text }]}>Dates & Meetings</Text>
          {hasDates && <View style={[ds.dot, { backgroundColor: C.accent }]} />}
        </View>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={C.textMuted} />
      </Pressable>

      {open && (
        <View style={ds.body}>
          <View style={ds.dateField}>
            <Text style={[ds.dateLabel, { color: C.textMuted }]}>BIRTHDAY</Text>
            <TextInput style={[ds.dateInput, { backgroundColor: C.panel, borderColor: C.border, color: C.text }]} value={birthday ?? ''} onChangeText={v => onBirthday(v || undefined)} placeholder="YYYY-MM-DD" placeholderTextColor={C.textDim} />
          </View>
          <View style={ds.dateField}>
            <Text style={[ds.dateLabel, { color: C.textMuted }]}>FIRST MET</Text>
            <TextInput style={[ds.dateInput, { backgroundColor: C.panel, borderColor: C.border, color: C.text }]} value={firstMet ?? ''} onChangeText={v => onFirstMet(v || undefined)} placeholder="YYYY-MM-DD" placeholderTextColor={C.textDim} />
          </View>
          <View style={ds.dateField}>
            <Text style={[ds.dateLabel, { color: C.textMuted }]}>LAST MET</Text>
            <TextInput style={[ds.dateInput, { backgroundColor: C.panel, borderColor: C.border, color: C.text }]} value={lastMet ?? ''} onChangeText={v => onLastMet(v || undefined)} placeholder="YYYY-MM-DD" placeholderTextColor={C.textDim} />
          </View>

          <View style={ds.nextMeetWrap}>
            <Text style={[ds.dateLabel, { color: C.textMuted }]}>NEXT MEETING</Text>
            <View style={ds.nextMeetRow}>
              <TextInput style={[ds.dateInput, { flex: 1, backgroundColor: C.panel, borderColor: C.border, color: C.text }]} value={nextMeeting ?? ''} onChangeText={v => onNextMeeting(v || undefined)} placeholder="YYYY-MM-DD" placeholderTextColor={C.textDim} />
              {nextMeeting ? (
                <TextInput style={[ds.dateInput, { width: 110, backgroundColor: C.panel, borderColor: C.border, color: C.text }]} value={nextMeetingTime ?? ''} onChangeText={v => onNextMeetingTime(v || undefined)} placeholder="HH:MM" placeholderTextColor={C.textDim} keyboardType="numbers-and-punctuation" />
              ) : null}
            </View>
            {nextMeeting && nextMeetingTime ? (
              <View style={ds.notifHint}>
                <Feather name="bell" size={12} color={C.green} />
                <Text style={[ds.notifHintText, { color: C.green }]}>Reminder will be set for this meeting</Text>
              </View>
            ) : nextMeeting ? (
              <View style={ds.notifHint}>
                <Feather name="bell-off" size={12} color={C.textDim} />
                <Text style={[ds.notifHintText, { color: C.textDim }]}>Add a time to enable reminder</Text>
              </View>
            ) : null}
          </View>

          <Text style={[ds.dateLabel, { color: C.textMuted }]}>CUSTOM EVENTS</Text>
          {customDates.map(d => (
            <View key={d.id} style={[ds.item, { backgroundColor: C.panel, borderColor: C.border }]}>
              <View>
                <Text style={[ds.itemLabel, { color: C.text }]}>{d.label}</Text>
                <Text style={[ds.itemDate, { color: C.textMuted }]}>{d.date}</Text>
              </View>
              <Pressable onPress={() => onCustomDates(customDates.filter(x => x.id !== d.id))}>
                <Feather name="x" size={16} color={C.red} />
              </Pressable>
            </View>
          ))}
          <View style={ds.addRow}>
            <TextInput style={[ds.dateInput, { flex: 1, backgroundColor: C.panel, borderColor: C.border, color: C.text }]} value={newLabel} onChangeText={setNewLabel} placeholder="Event name…" placeholderTextColor={C.textDim} />
            <TextInput style={[ds.dateInput, { width: 120, backgroundColor: C.panel, borderColor: C.border, color: C.text }]} value={newDate} onChangeText={setNewDate} placeholder="YYYY-MM-DD" placeholderTextColor={C.textDim} />
            <Pressable style={[ds.addBtn, { backgroundColor: C.panel, borderColor: C.border }]} onPress={() => { if (newLabel.trim() && newDate.trim()) { onCustomDates([...customDates, { id: uid(), label: newLabel.trim(), date: newDate.trim() }]); setNewLabel(''); setNewDate(''); } }}>
              <Feather name="plus" size={18} color={C.accent} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
const ds = StyleSheet.create({
  wrap: { marginBottom: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, padding: 14, borderWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  body: { marginTop: 10 },
  dateField: { marginBottom: 12 },
  dateLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 2, marginBottom: 6 },
  dateInput: { borderRadius: 12, borderWidth: 1, fontSize: 14, fontFamily: 'Inter_400Regular', paddingHorizontal: 14, height: 46 },
  nextMeetWrap: { marginBottom: 12 },
  nextMeetRow: { flexDirection: 'row', gap: 8 },
  notifHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  notifHintText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1 },
  itemLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  itemDate: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 6 },
  addBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

type FormData = Omit<Person, 'id' | 'createdAt' | 'updatedAt'>;

const blank: FormData = {
  name: '',
  phone: undefined,
  photoUri: undefined,
  tags: [],
  trustLevel: null,
  description: '',
  likes: '',
  dislikes: '',
  thingsToRemember: '',
  quickFacts: '',
  nextMeetingTime: undefined,
  customDates: [],
  interactions: [],
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
  const C = useColors();
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
      if (form.nextMeeting && form.nextMeetingTime) {
        await scheduleNextMeetingNotification(person.id, form.name.trim(), form.nextMeeting, form.nextMeetingTime);
      }
      router.replace({ pathname: '/profile/[id]', params: { id: person.id } });
    } catch {
      Alert.alert('Error', 'Failed to save. Please try again.');
      setSaving(false);
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0), backgroundColor: C.bg }]}>
      <View style={[s.navbar, { borderBottomColor: C.border }]}>
        <Pressable style={[s.closeBtn, { backgroundColor: C.panel, borderColor: C.border }]} onPress={() => router.back()}>
          <Feather name="x" size={20} color={C.text} />
        </Pressable>
        <Text style={[s.title, { color: C.textMuted }]}>ADD PERSON</Text>
        <Pressable
          style={[s.saveBtn, { backgroundColor: C.accent }, (!form.name.trim() || saving) && { opacity: 0.4 }]}
          onPress={handleSave}
          disabled={!form.name.trim() || saving}
        >
          <Text style={[s.saveBtnText, { color: C.textBright }]}>{saving ? 'Saving…' : 'Save'}</Text>
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

        <View style={{ marginBottom: 18 }}>
          <Text style={[fl.text, { color: C.textMuted }]}>Name *</Text>
          <ContactNameField
            value={form.name}
            onChange={v => set('name', v)}
            onFill={data => {
              setForm(f => ({
                ...f,
                name: data.name,
                phone: data.phone ?? f.phone,
                birthday: data.birthday ?? f.birthday,
              }));
            }}
          />
        </View>

        <View style={{ marginBottom: 18 }}>
          <Text style={[fl.text, { color: C.textMuted }]}>Phone</Text>
          <TextInput
            style={[f.input, { backgroundColor: C.panel, borderColor: C.border, color: C.text }]}
            value={form.phone ?? ''}
            onChangeText={v => set('phone', v || undefined)}
            placeholder="Mobile number…"
            placeholderTextColor={C.textDim}
            keyboardType="phone-pad"
          />
        </View>

        <TagsEditor
          tags={form.tags}
          onAdd={t => !form.tags.includes(t) && set('tags', [...form.tags, t])}
          onRemove={t => set('tags', form.tags.filter(x => x !== t))}
        />

        <TrustSlider value={form.trustLevel} onChange={v => set('trustLevel', v)} />

        <View style={[s.divider, { borderTopColor: C.border }]}><Text style={[s.dividerText, { color: C.textDim, backgroundColor: C.bg }]}>NOTES</Text></View>

        <Field label="Description" value={form.description} onChange={v => set('description', v)} multiline placeholder="Who is this person?" />
        <Field label="Likes" value={form.likes} onChange={v => set('likes', v)} multiline placeholder="Interests, hobbies…" />
        <Field label="Dislikes" value={form.dislikes} onChange={v => set('dislikes', v)} multiline placeholder="Pet peeves, avoidances…" />
        <Field label="Things to Remember" value={form.thingsToRemember} onChange={v => set('thingsToRemember', v)} multiline placeholder="Key reminders, sensitive info…" />
        <Field label="Quick Facts" value={form.quickFacts} onChange={v => set('quickFacts', v)} multiline placeholder="Job, city, how you know them…" />

        <DatesSection
          birthday={form.birthday}
          firstMet={form.firstMet}
          lastMet={form.lastMet}
          nextMeeting={form.nextMeeting}
          nextMeetingTime={form.nextMeetingTime}
          customDates={form.customDates}
          onBirthday={v => set('birthday', v)}
          onFirstMet={v => set('firstMet', v)}
          onLastMet={v => set('lastMet', v)}
          onNextMeeting={v => set('nextMeeting', v)}
          onNextMeetingTime={v => set('nextMeetingTime', v)}
          onCustomDates={d => set('customDates', d)}
        />
      </KeyboardAwareScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  closeBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  title: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 3 },
  saveBtn: { borderRadius: 10, paddingHorizontal: 18, paddingVertical: 9 },
  saveBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  divider: { borderBottomWidth: 1, marginBottom: 18, paddingBottom: 8 },
  dividerText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 2 },
});
