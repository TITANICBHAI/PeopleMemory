import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
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
import { Person, PersonDate, useApp } from '@/context/AppContext';
import {
  cancelBirthdayNotification,
  cancelCustomDateNotification,
  cancelNextMeetingNotification,
  scheduleBirthdayNotification,
  scheduleCustomDateNotification,
  scheduleNextMeetingNotification,
} from '@/utils/notifications';

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

const PRESET_TAGS = ['Friend', 'Work', 'Family', 'Online'];

function FieldLabel({ text }: { text: string }) {
  return <Text style={fl.text}>{text}</Text>;
}
const fl = StyleSheet.create({
  text: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: C.textMuted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
});

function Field({ label, value, onChange, multiline, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; placeholder?: string; hint?: string;
}) {
  return (
    <View style={fi.wrap}>
      <View style={fi.labelRow}>
        <FieldLabel text={label} />
        {hint ? <Text style={fi.hint}>{hint}</Text> : null}
      </View>
      <TextInput
        style={[fi.input, multiline && fi.multi]}
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
const fi = StyleSheet.create({
  wrap: { marginBottom: 18 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  hint: { fontSize: 10, fontFamily: 'Inter_400Regular', color: C.textDim },
  input: {
    backgroundColor: C.panel, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    color: C.text, fontSize: 15, fontFamily: 'Inter_400Regular',
    paddingHorizontal: 14, paddingVertical: 12, height: 48,
  },
  multi: { height: 80, lineHeight: 20 },
});

function formatDateDisplay(v?: string): string {
  if (!v) return 'Tap to set date';
  const d = new Date(v + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function dateToString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function DatePickerField({ label, value, onChange, hint, rightSlot }: {
  label: string;
  value?: string;
  onChange: (v?: string) => void;
  hint?: string;
  rightSlot?: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  const dateObj = value ? new Date(value + 'T00:00:00') : new Date();

  const openPicker = () => {
    if (Platform.OS === 'web') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShow(true);
  };

  const handleChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (selectedDate) onChange(dateToString(selectedDate));
  };

  return (
    <View style={dpf.wrap}>
      <View style={dpf.labelRow}>
        <FieldLabel text={label} />
        <View style={dpf.labelRight}>
          {hint ? <Text style={fi.hint}>{hint}</Text> : null}
          {rightSlot}
        </View>
      </View>

      <View style={dpf.inputRow}>
        <Text style={[dpf.valueText, !value && dpf.valuePlaceholder]} numberOfLines={1}>
          {value ? formatDateDisplay(value) : 'Not set'}
        </Text>
        <View style={dpf.inputActions}>
          {value ? (
            <Pressable
              style={dpf.clearBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(undefined); }}
              hitSlop={8}
            >
              <Feather name="x" size={13} color={C.textMuted} />
            </Pressable>
          ) : null}
          <Pressable style={dpf.calBtn} onPress={openPicker} hitSlop={4}>
            <Feather name="calendar" size={16} color={C.accent} />
          </Pressable>
        </View>
      </View>

      {show && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide" visible={show} onRequestClose={() => setShow(false)}>
          <Pressable style={dpf.overlay} onPress={() => setShow(false)} />
          <View style={dpf.sheet}>
            <View style={dpf.sheetHeader}>
              <Pressable onPress={() => { onChange(undefined); setShow(false); }}>
                <Text style={dpf.sheetClear}>Clear</Text>
              </Pressable>
              <Text style={dpf.sheetTitle}>{label}</Text>
              <Pressable onPress={() => setShow(false)}>
                <Text style={dpf.sheetDone}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={dateObj}
              mode="date"
              display="spinner"
              onChange={handleChange}
              themeVariant="dark"
              style={{ width: '100%' }}
            />
          </View>
        </Modal>
      )}

      {show && Platform.OS === 'android' && (
        <DateTimePicker
          value={dateObj}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      )}
    </View>
  );
}

const dpf = StyleSheet.create({
  wrap: { marginBottom: 18 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  labelRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.panel, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    paddingLeft: 14, height: 48, overflow: 'hidden',
  },
  valueText: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: C.text },
  valuePlaceholder: { color: C.textDim },
  inputActions: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  clearBtn: {
    width: 36, height: 48, alignItems: 'center', justifyContent: 'center',
  },
  calBtn: {
    width: 48, height: 48, alignItems: 'center', justifyContent: 'center',
    borderLeftWidth: 1, borderLeftColor: C.border,
    backgroundColor: C.panelHigh,
  },
  overlay: { flex: 1, backgroundColor: '#00000066' },
  sheet: {
    backgroundColor: C.panel,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sheetTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: C.text },
  sheetClear: { fontSize: 15, fontFamily: 'Inter_400Regular', color: C.red, minWidth: 48 },
  sheetDone: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: C.accent, minWidth: 48, textAlign: 'right' },
});

function TagsEditor({ tags, onAdd, onRemove }: { tags: string[]; onAdd: (t: string) => void; onRemove: (t: string) => void }) {
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
          onSubmitEditing={() => { if (custom.trim()) { onAdd(custom.trim()); setCustom(''); } }}
        />
        <Pressable style={te.addBtn} onPress={() => { if (custom.trim()) { onAdd(custom.trim()); setCustom(''); } }}>
          <Feather name="plus" size={18} color={C.accent} />
        </Pressable>
      </View>
    </View>
  );
}
const te = StyleSheet.create({
  wrap: { marginBottom: 18 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  preset: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: C.panel, borderWidth: 1, borderColor: C.border },
  presetActive: { backgroundColor: C.accent + '22', borderColor: C.accent },
  presetText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: C.textMuted },
  presetTextActive: { color: C.accent },
  customs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  customTag: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: C.panelHigh, borderWidth: 1, borderColor: C.border },
  customTagText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: C.text },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, backgroundColor: C.panel, borderRadius: 12, borderWidth: 1, borderColor: C.border, color: C.text, fontSize: 14, fontFamily: 'Inter_400Regular', paddingHorizontal: 14, height: 44 },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.panel, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
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
  const [open, setOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newCustomDate, setNewCustomDate] = useState<string | undefined>();
  const [newReminder, setNewReminder] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const hasDates = !!(birthday || firstMet || lastMet || nextMeeting || customDates.length > 0);

  const handleAddCustom = () => {
    if (newLabel.trim() && newCustomDate) {
      onCustomDates([...customDates, { id: uid(), label: newLabel.trim(), date: newCustomDate, reminder: newReminder }]);
      setNewLabel('');
      setNewCustomDate(undefined);
      setNewReminder(false);
    }
  };

  return (
    <View style={ds.wrap}>
      <Pressable
        style={ds.header}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setOpen(o => !o); }}
      >
        <View style={ds.headerLeft}>
          <Feather name="calendar" size={15} color={C.accent} />
          <Text style={ds.headerText}>Dates & Meetings</Text>
          {hasDates && <View style={ds.dot} />}
        </View>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={18} color={C.textMuted} />
      </Pressable>

      {open && (
        <View style={ds.body}>
          <DatePickerField
            label="Birthday"
            value={birthday}
            onChange={onBirthday}
            hint="annual reminder"
          />
          <DatePickerField
            label="First Met"
            value={firstMet}
            onChange={onFirstMet}
            hint="optional"
          />
          <DatePickerField
            label="Last Met"
            value={lastMet}
            onChange={onLastMet}
            hint="optional"
          />

          <View style={ds.nextMeetWrap}>
            <DatePickerField
              label="Next Meeting"
              value={nextMeeting}
              onChange={v => { onNextMeeting(v); if (!v) onNextMeetingTime(undefined); }}
              hint="optional"
            />
            {nextMeeting ? (
              <View style={ds.timeRow}>
                <Feather name="clock" size={14} color={C.textDim} />
                <TextInput
                  style={ds.timeInput}
                  value={nextMeetingTime ?? ''}
                  onChangeText={v => onNextMeetingTime(v || undefined)}
                  placeholder="HH:MM  (for reminder)"
                  placeholderTextColor={C.textDim}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            ) : null}
            {nextMeeting && nextMeetingTime ? (
              <View style={ds.notifHint}>
                <Feather name="bell" size={12} color={C.green} />
                <Text style={ds.notifHintText}>Reminder will be set for this meeting</Text>
              </View>
            ) : nextMeeting ? (
              <View style={ds.notifHint}>
                <Feather name="bell-off" size={12} color={C.textDim} />
                <Text style={[ds.notifHintText, { color: C.textDim }]}>Add a time to enable reminder</Text>
              </View>
            ) : null}
          </View>

          <FieldLabel text="Custom Events" />
          {customDates.map(d => (
            <View key={d.id} style={ds.item}>
              <View style={ds.itemText}>
                <Text style={ds.itemLabel}>{d.label}</Text>
                <Text style={ds.itemDate}>{formatDateDisplay(d.date)}</Text>
              </View>
              <View style={ds.itemActions}>
                <Pressable
                  style={[ds.bellBtn, d.reminder && ds.bellBtnOn]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onCustomDates(customDates.map(x => x.id === d.id ? { ...x, reminder: !x.reminder } : x));
                  }}
                  hitSlop={6}
                >
                  <Feather name={d.reminder ? 'bell' : 'bell-off'} size={14} color={d.reminder ? C.accent : C.textDim} />
                </Pressable>
                <Pressable onPress={() => onCustomDates(customDates.filter(x => x.id !== d.id))} hitSlop={6}>
                  <Feather name="x" size={16} color={C.red} />
                </Pressable>
              </View>
            </View>
          ))}

          <View style={ds.addCustomWrap}>
            <TextInput
              style={[ds.smallInput, { flex: 1 }]}
              value={newLabel}
              onChangeText={setNewLabel}
              placeholder="Event name…"
              placeholderTextColor={C.textDim}
            />
            <Pressable
              style={[ds.datePickBtn, newCustomDate && ds.datePickBtnSet]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowCustomPicker(true); }}
            >
              <Feather name="calendar" size={14} color={newCustomDate ? C.accent : C.textDim} />
              <Text style={[ds.datePickBtnText, !newCustomDate && { color: C.textDim }]}>
                {newCustomDate ? newCustomDate : 'Date'}
              </Text>
            </Pressable>
            <Pressable
              style={[ds.bellBtn, newReminder && ds.bellBtnOn]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNewReminder(r => !r); }}
              hitSlop={6}
            >
              <Feather name={newReminder ? 'bell' : 'bell-off'} size={15} color={newReminder ? C.accent : C.textDim} />
            </Pressable>
            <Pressable
              style={[ds.addBtn, !(newLabel.trim() && newCustomDate) && { opacity: 0.4 }]}
              onPress={handleAddCustom}
              disabled={!(newLabel.trim() && newCustomDate)}
            >
              <Feather name="plus" size={18} color={C.accent} />
            </Pressable>
          </View>

          {showCustomPicker && Platform.OS === 'ios' && (
            <Modal transparent animationType="slide" visible={showCustomPicker} onRequestClose={() => setShowCustomPicker(false)}>
              <Pressable style={dpf.overlay} onPress={() => setShowCustomPicker(false)} />
              <View style={dpf.sheet}>
                <View style={dpf.sheetHeader}>
                  <Pressable onPress={() => { setNewCustomDate(undefined); setShowCustomPicker(false); }}>
                    <Text style={dpf.sheetClear}>Clear</Text>
                  </Pressable>
                  <Pressable onPress={() => setShowCustomPicker(false)}>
                    <Text style={dpf.sheetDone}>Done</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={newCustomDate ? new Date(newCustomDate + 'T00:00:00') : new Date()}
                  mode="date"
                  display="spinner"
                  onChange={(_, d) => { if (d) setNewCustomDate(dateToString(d)); }}
                  themeVariant="dark"
                  style={{ width: '100%' }}
                />
              </View>
            </Modal>
          )}
          {showCustomPicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={newCustomDate ? new Date(newCustomDate + 'T00:00:00') : new Date()}
              mode="date"
              display="default"
              onChange={(_, d) => { setShowCustomPicker(false); if (d) setNewCustomDate(dateToString(d)); }}
            />
          )}
        </View>
      )}
    </View>
  );
}

const ds = StyleSheet.create({
  wrap: { marginBottom: 18 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.panel, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: C.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: C.text },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.accent },
  body: { marginTop: 10, gap: 0 },
  nextMeetWrap: { marginBottom: 18 },
  timeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.panel, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, height: 44, marginTop: -8, marginBottom: 6,
  },
  timeInput: { flex: 1, color: C.text, fontSize: 14, fontFamily: 'Inter_400Regular' },
  notifHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  notifHintText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.green },
  item: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.panel, borderRadius: 10, padding: 12, marginBottom: 6,
    borderWidth: 1, borderColor: C.border,
  },
  itemText: { gap: 2 },
  itemLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: C.text },
  itemDate: { fontSize: 11, fontFamily: 'Inter_400Regular', color: C.textMuted },
  addCustomWrap: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 6 },
  smallInput: { backgroundColor: C.panel, borderRadius: 12, borderWidth: 1, borderColor: C.border, color: C.text, fontSize: 13, fontFamily: 'Inter_400Regular', paddingHorizontal: 12, height: 44 },
  datePickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.panel, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 10, height: 44,
  },
  datePickBtnSet: { borderColor: C.accent },
  datePickBtnText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.accent },
  addBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.panel, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: C.panel, borderWidth: 1, borderColor: C.border },
  bellBtnOn: { borderColor: C.accent, backgroundColor: C.accent + '22' },
});

export default function EditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPersonById, updatePerson } = useApp();
  const insets = useSafeAreaInsets();
  const person = getPersonById(id);

  const [form, setForm] = useState<Person | null>(
    person ? { ...person, tags: [...person.tags], customDates: person.customDates.map(d => ({ ...d })) } : null
  );
  const [saving, setSaving] = useState(false);

  const set = (key: keyof Person, value: any) => setForm(f => f ? { ...f, [key]: value } : f);

  if (!form) return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Pressable style={s.closeBtn} onPress={() => router.back()}>
        <Feather name="arrow-left" size={20} color={C.text} />
      </Pressable>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.textMuted }}>Person not found</Text>
      </View>
    </View>
  );

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Name required', 'Please enter a name.'); return; }
    setSaving(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await updatePerson({ ...form, name: form.name.trim() });

      if (form.nextMeeting && form.nextMeetingTime) {
        await scheduleNextMeetingNotification(form.id, form.name.trim(), form.nextMeeting, form.nextMeetingTime);
      } else {
        await cancelNextMeetingNotification(form.id);
      }

      if (form.birthday) {
        await scheduleBirthdayNotification(form.id, form.name.trim(), form.birthday);
      } else {
        await cancelBirthdayNotification(form.id);
      }

      const currentIds = new Set(form.customDates.map(d => d.id));
      for (const d of (person?.customDates ?? [])) {
        if (!currentIds.has(d.id)) await cancelCustomDateNotification(form.id, d.id);
      }
      for (const d of form.customDates) {
        if (d.reminder) {
          await scheduleCustomDateNotification(form.id, form.name.trim(), d.id, d.label, d.date);
        } else {
          await cancelCustomDateNotification(form.id, d.id);
        }
      }

      router.replace({ pathname: '/profile/[id]', params: { id: form.id } });
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
        <Text style={s.title}>EDIT PERSON</Text>
        <Pressable style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
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
          value={photoUriToAvatarValue(form.photoUri)}
          name={form.name}
          onChange={av => set('photoUri', avatarValueToPhotoUri(av))}
        />
        <Field label="Name *" value={form.name} onChange={v => set('name', v)} placeholder="Full name…" />
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
        <Field label="Things to Remember" value={form.thingsToRemember} onChange={v => set('thingsToRemember', v)} multiline placeholder="Key reminders…" />
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
  root: { flex: 1, backgroundColor: C.bg },
  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  closeBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.panel, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  title: { fontSize: 12, fontFamily: 'Inter_700Bold', color: C.textMuted, letterSpacing: 3 },
  saveBtn: { backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 9 },
  saveBtnDisabled: { backgroundColor: C.border },
  saveBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.textBright },
  divider: { borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 18, paddingBottom: 8 },
  dividerText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: C.textMuted, letterSpacing: 2 },
});
