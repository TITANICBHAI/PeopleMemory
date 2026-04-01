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
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarPicker, AvatarValue } from '@/components/AvatarPicker';
import { ContactNameField } from '@/components/ContactNameField';
import { useColors } from '@/constants/colors';
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
  const C = useColors();
  return <Text style={[fl.text, { color: C.textMuted }]}>{text}</Text>;
}
const fl = StyleSheet.create({
  text: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
});

function Field({ label, value, onChange, multiline, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; placeholder?: string; hint?: string;
}) {
  const C = useColors();
  return (
    <View style={fi.wrap}>
      <View style={fi.labelRow}>
        <FieldLabel text={label} />
        {hint ? <Text style={[fi.hint, { color: C.textDim }]}>{hint}</Text> : null}
      </View>
      <TextInput
        style={[fi.input, multiline && fi.multi, { backgroundColor: C.panel, borderColor: C.border, color: C.text }]}
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
  hint: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  input: { borderRadius: 12, borderWidth: 1, fontSize: 15, fontFamily: 'Inter_400Regular', paddingHorizontal: 14, paddingVertical: 12, height: 48 },
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
  const C = useColors();
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

      <View style={[dpf.inputRow, { backgroundColor: C.panel, borderColor: C.border }]}>
        <Text style={[dpf.valueText, { color: !value ? C.textDim : C.text }]} numberOfLines={1}>
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
          <Pressable style={[dpf.calBtn, { borderLeftColor: C.border, backgroundColor: C.panelHigh }]} onPress={openPicker} hitSlop={4}>
            <Feather name="calendar" size={16} color={C.accent} />
          </Pressable>
        </View>
      </View>

      {show && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide" visible={show} onRequestClose={() => setShow(false)}>
          <Pressable style={dpf.overlay} onPress={() => setShow(false)} />
          <View style={[dpf.sheet, { backgroundColor: C.panel }]}>
            <View style={dpf.sheetHeader}>
              <Pressable onPress={() => { onChange(undefined); setShow(false); }}>
                <Text style={[dpf.sheetClear, { color: C.red }]}>Clear</Text>
              </Pressable>
              <Text style={[dpf.sheetTitle, { color: C.text }]}>{label}</Text>
              <Pressable onPress={() => setShow(false)}>
                <Text style={[dpf.sheetDone, { color: C.accent }]}>Done</Text>
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
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingLeft: 14, height: 48, overflow: 'hidden' },
  valueText: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  inputActions: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  clearBtn: { width: 36, height: 48, alignItems: 'center', justifyContent: 'center' },
  calBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1 },
  overlay: { flex: 1, backgroundColor: '#00000066' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  sheetTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  sheetClear: { fontSize: 15, fontFamily: 'Inter_400Regular', minWidth: 48 },
  sheetDone: { fontSize: 15, fontFamily: 'Inter_600SemiBold', minWidth: 48, textAlign: 'right' },
});

function TagsEditor({ tags, onAdd, onRemove }: { tags: string[]; onAdd: (t: string) => void; onRemove: (t: string) => void }) {
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
              <Text style={[te.presetText, { color: active ? C.accent : C.textMuted }]}>{t}</Text>
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
          onSubmitEditing={() => { if (custom.trim()) { onAdd(custom.trim()); setCustom(''); } }}
        />
        <Pressable style={[te.addBtn, { backgroundColor: C.panel, borderColor: C.border }]} onPress={() => { if (custom.trim()) { onAdd(custom.trim()); setCustom(''); } }}>
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
          <Text style={[ts.naBtnText, { color: active ? C.textMuted : C.accent }]}>N/A</Text>
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
            <Text style={[ts.labelText, { color: C.textDim }]}>No trust</Text>
            <Text style={[ts.levelText, { color }]}>{num <= 3 ? 'Low' : num <= 6 ? 'Moderate' : 'High'}</Text>
            <Text style={[ts.labelText, { color: C.textDim }]}>Full trust</Text>
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

function TimeInput({ value, onChange, placeholder }: { value?: string; onChange: (v?: string) => void; placeholder?: string }) {
  const C = useColors();
  return (
    <View style={[ds.timeRow, { backgroundColor: C.panel, borderColor: C.border }]}>
      <Feather name="clock" size={14} color={C.textDim} />
      <TextInput
        style={[ds.timeInput, { color: C.text }]}
        value={value ?? ''}
        onChangeText={v => onChange(v || undefined)}
        placeholder={placeholder ?? 'HH:MM'}
        placeholderTextColor={C.textDim}
        keyboardType="numbers-and-punctuation"
      />
    </View>
  );
}

function DatesSection({
  birthday, birthdayReminderTime, firstMet, lastMet, nextMeeting, nextMeetingTime, customDates,
  onBirthday, onBirthdayReminderTime, onFirstMet, onLastMet, onNextMeeting, onNextMeetingTime, onCustomDates,
}: {
  birthday?: string; birthdayReminderTime?: string; firstMet?: string; lastMet?: string;
  nextMeeting?: string; nextMeetingTime?: string; customDates: PersonDate[];
  onBirthday: (v?: string) => void; onBirthdayReminderTime: (v?: string) => void;
  onFirstMet: (v?: string) => void;
  onLastMet: (v?: string) => void; onNextMeeting: (v?: string) => void;
  onNextMeetingTime: (v?: string) => void; onCustomDates: (d: PersonDate[]) => void;
}) {
  const C = useColors();
  const [open, setOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newCustomDate, setNewCustomDate] = useState<string | undefined>();
  const [newReminder, setNewReminder] = useState(false);
  const [newReminderTime, setNewReminderTime] = useState<string | undefined>();
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const hasDates = !!(birthday || firstMet || lastMet || nextMeeting || customDates.length > 0);

  const handleAddCustom = () => {
    if (newLabel.trim() && newCustomDate) {
      onCustomDates([...customDates, {
        id: uid(), label: newLabel.trim(), date: newCustomDate,
        reminder: newReminder, reminderTime: newReminder ? newReminderTime : undefined,
      }]);
      setNewLabel('');
      setNewCustomDate(undefined);
      setNewReminder(false);
      setNewReminderTime(undefined);
    }
  };

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
          <DatePickerField
            label="Birthday"
            value={birthday}
            onChange={v => { onBirthday(v); if (!v) onBirthdayReminderTime(undefined); }}
            hint="annual reminder"
          />
          {birthday ? (
            <>
              <TimeInput
                value={birthdayReminderTime}
                onChange={onBirthdayReminderTime}
                placeholder="HH:MM  (reminder time, default 9:00)"
              />
              <View style={[ds.notifHint, { marginTop: -10, marginBottom: 14 }]}>
                <Feather name="bell" size={12} color={C.green} />
                <Text style={[ds.notifHintText, { color: C.green }]}>
                  {birthdayReminderTime ? `Birthday reminder set at ${birthdayReminderTime}` : 'Reminder at 9:00 AM — set a time to change'}
                </Text>
              </View>
            </>
          ) : null}

          <DatePickerField label="First Met" value={firstMet} onChange={onFirstMet} hint="optional" />
          <DatePickerField label="Last Met" value={lastMet} onChange={onLastMet} hint="optional" />

          <View style={ds.nextMeetWrap}>
            <DatePickerField
              label="Next Meeting"
              value={nextMeeting}
              onChange={v => { onNextMeeting(v); if (!v) onNextMeetingTime(undefined); }}
              hint="optional"
            />
            {nextMeeting ? (
              <TimeInput
                value={nextMeetingTime}
                onChange={onNextMeetingTime}
                placeholder="HH:MM  (for reminder)"
              />
            ) : null}
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

          <FieldLabel text="Custom Events" />
          {customDates.map(d => (
            <View key={d.id}>
              <View style={[ds.item, { backgroundColor: C.panel, borderColor: C.border }]}>
                <View style={ds.itemText}>
                  <Text style={[ds.itemLabel, { color: C.text }]}>{d.label}</Text>
                  <Text style={[ds.itemDate, { color: C.textMuted }]}>{formatDateDisplay(d.date)}</Text>
                </View>
                <View style={ds.itemActions}>
                  <Pressable
                    style={[ds.bellBtn, { backgroundColor: C.panel, borderColor: C.border }, d.reminder && { borderColor: C.accent, backgroundColor: C.accent + '22' }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onCustomDates(customDates.map(x => x.id === d.id
                        ? { ...x, reminder: !x.reminder, reminderTime: x.reminder ? undefined : x.reminderTime }
                        : x));
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
              {d.reminder ? (
                <TimeInput
                  value={d.reminderTime}
                  onChange={v => onCustomDates(customDates.map(x => x.id === d.id ? { ...x, reminderTime: v } : x))}
                  placeholder="HH:MM  (reminder time, default 9:00)"
                />
              ) : null}
            </View>
          ))}

          <View style={ds.addCustomWrap}>
            <TextInput
              style={[ds.smallInput, { flex: 1, backgroundColor: C.panel, borderColor: C.border, color: C.text }]}
              value={newLabel}
              onChangeText={setNewLabel}
              placeholder="Event name…"
              placeholderTextColor={C.textDim}
            />
            <Pressable
              style={[ds.datePickBtn, { backgroundColor: C.panel, borderColor: newCustomDate ? C.accent : C.border }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowCustomPicker(true); }}
            >
              <Feather name="calendar" size={14} color={newCustomDate ? C.accent : C.textDim} />
              <Text style={[ds.datePickBtnText, { color: newCustomDate ? C.accent : C.textDim }]}>
                {newCustomDate ? newCustomDate : 'Date'}
              </Text>
            </Pressable>
            <Pressable
              style={[ds.bellBtn, { backgroundColor: C.panel, borderColor: C.border }, newReminder && { borderColor: C.accent, backgroundColor: C.accent + '22' }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setNewReminder(r => !r); if (newReminder) setNewReminderTime(undefined); }}
              hitSlop={6}
            >
              <Feather name={newReminder ? 'bell' : 'bell-off'} size={15} color={newReminder ? C.accent : C.textDim} />
            </Pressable>
            <Pressable
              style={[ds.addBtn, { backgroundColor: C.panel, borderColor: C.border }, !(newLabel.trim() && newCustomDate) && { opacity: 0.4 }]}
              onPress={handleAddCustom}
              disabled={!(newLabel.trim() && newCustomDate)}
            >
              <Feather name="plus" size={18} color={C.accent} />
            </Pressable>
          </View>
          {newReminder ? (
            <TimeInput
              value={newReminderTime}
              onChange={setNewReminderTime}
              placeholder="HH:MM  (reminder time, default 9:00)"
            />
          ) : null}

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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, padding: 14, borderWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  body: { marginTop: 10, gap: 0 },
  nextMeetWrap: { marginBottom: 18 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 44, marginTop: -8, marginBottom: 6 },
  timeInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  notifHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  notifHintText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1 },
  itemText: { gap: 2 },
  itemLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  itemDate: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  addCustomWrap: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 6 },
  smallInput: { borderRadius: 12, borderWidth: 1, fontSize: 13, fontFamily: 'Inter_400Regular', paddingHorizontal: 12, height: 44 },
  datePickBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, height: 44 },
  datePickBtnText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  addBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});

export default function EditScreen() {
  const C = useColors();
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
        await scheduleBirthdayNotification(form.id, form.name.trim(), form.birthday, form.birthdayReminderTime);
      } else {
        await cancelBirthdayNotification(form.id);
      }

      const currentIds = new Set(form.customDates.map(d => d.id));
      for (const d of (person?.customDates ?? [])) {
        if (!currentIds.has(d.id)) await cancelCustomDateNotification(form.id, d.id);
      }
      for (const d of form.customDates) {
        if (d.reminder) {
          await scheduleCustomDateNotification(form.id, form.name.trim(), d.id, d.label, d.date, d.reminderTime);
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
    <View style={[s.root, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0), backgroundColor: C.bg }]}>
      <View style={[s.navbar, { borderBottomColor: C.border }]}>
        <Pressable style={[s.closeBtn, { backgroundColor: C.panel, borderColor: C.border }]} onPress={() => router.back()}>
          <Feather name="x" size={20} color={C.text} />
        </Pressable>
        <Text style={[s.title, { color: C.textMuted }]}>EDIT PERSON</Text>
        <Pressable style={[s.saveBtn, { backgroundColor: C.accent }, saving && { opacity: 0.4 }]} onPress={handleSave} disabled={saving}>
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
          value={photoUriToAvatarValue(form.photoUri)}
          name={form.name}
          onChange={av => set('photoUri', avatarValueToPhotoUri(av))}
        />
        <View style={{ marginBottom: 18 }}>
          <Text style={[fl.text, { color: C.textMuted }]}>Name *</Text>
          <ContactNameField
            value={form.name}
            onChange={v => set('name', v)}
            onFill={data => {
              setForm(f => f ? ({
                ...f,
                name: data.name,
                phone: data.phone ?? f.phone,
                birthday: data.birthday ?? f.birthday,
              }) : f);
            }}
          />
        </View>

        <View style={{ marginBottom: 18 }}>
          <Text style={[fl.text, { color: C.textMuted }]}>Phone</Text>
          <TextInput
            style={[fi.input, { backgroundColor: C.panel, borderColor: C.border, color: C.text }]}
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
        <Field label="Things to Remember" value={form.thingsToRemember} onChange={v => set('thingsToRemember', v)} multiline placeholder="Key reminders…" />
        <Field label="Quick Facts" value={form.quickFacts} onChange={v => set('quickFacts', v)} multiline placeholder="Job, city, how you know them…" />

        <DatesSection
          birthday={form.birthday}
          birthdayReminderTime={form.birthdayReminderTime}
          firstMet={form.firstMet}
          lastMet={form.lastMet}
          nextMeeting={form.nextMeeting}
          nextMeetingTime={form.nextMeetingTime}
          customDates={form.customDates}
          onBirthday={v => set('birthday', v)}
          onBirthdayReminderTime={v => set('birthdayReminderTime', v)}
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
  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  closeBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  title: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 3 },
  saveBtn: { borderRadius: 10, paddingHorizontal: 18, paddingVertical: 9 },
  saveBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  divider: { borderBottomWidth: 1, marginBottom: 18, paddingBottom: 8 },
  dividerText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 2 },
});
