import { Feather } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import C from '@/constants/colors';

export interface ContactFill {
  name: string;
  phone?: string;
  birthday?: string;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onFill: (data: ContactFill) => void;
}

export function ContactNameField({ value, onChange, onFill }: Props) {
  const [suggestions, setSuggestions] = useState<Contacts.Contact[]>([]);
  const [granted, setGranted] = useState<boolean | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestPermission = async () => {
    if (granted !== null) return;
    const { status } = await Contacts.requestPermissionsAsync();
    setGranted(status === 'granted');
  };

  useEffect(() => {
    if (!granted || value.length < 2) {
      setSuggestions([]);
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      try {
        const { data } = await Contacts.getContactsAsync({
          fields: [
            Contacts.Fields.Name,
            Contacts.Fields.PhoneNumbers,
            Contacts.Fields.Birthday,
            Contacts.Fields.Emails,
          ],
          name: value,
        });
        setSuggestions(data.filter(c => c.name).slice(0, 6));
      } catch {
        setSuggestions([]);
      }
    }, 280);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [value, granted]);

  const handleSelect = (contact: Contacts.Contact) => {
    const phone = contact.phoneNumbers?.[0]?.number;
    let birthday: string | undefined;
    if (contact.birthday) {
      const { year, month, day } = contact.birthday as any;
      if (month !== undefined && day !== undefined) {
        const y = year ?? new Date().getFullYear();
        const m = String(month + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        birthday = `${y}-${m}-${d}`;
      }
    }
    setSuggestions([]);
    onFill({ name: contact.name ?? '', phone, birthday });
  };

  return (
    <View>
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={value}
          onChangeText={onChange}
          onFocus={requestPermission}
          placeholder="Full name…"
          placeholderTextColor={C.textDim}
          autoCapitalize="words"
        />
        {granted && (
          <View style={s.badge}>
            <Feather name="users" size={12} color={C.accent} />
          </View>
        )}
      </View>
      {suggestions.length > 0 && (
        <View style={s.dropdown}>
          {suggestions.map((c, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [s.row, pressed && s.rowPressed, i > 0 && s.rowBorder]}
              onPress={() => handleSelect(c)}
            >
              <View style={s.initials}>
                <Text style={s.initialsText}>
                  {(c.name ?? '?').split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')}
                </Text>
              </View>
              <View style={s.info}>
                <Text style={s.name}>{c.name}</Text>
                {c.phoneNumbers?.[0]?.number ? (
                  <Text style={s.phone}>{c.phoneNumbers[0].number}</Text>
                ) : null}
              </View>
              <Feather name="corner-left-down" size={13} color={C.accent} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.panel, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, height: 48,
  },
  input: {
    flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: C.text,
  },
  badge: {
    backgroundColor: C.accent + '22', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 3,
    borderWidth: 1, borderColor: C.accent + '44',
  },
  dropdown: {
    backgroundColor: C.panel, borderRadius: 12,
    borderWidth: 1, borderColor: C.accent + '44',
    marginTop: 4, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  rowPressed: { backgroundColor: C.panelHigh },
  rowBorder: { borderTopWidth: 1, borderTopColor: C.border },
  initials: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: C.accent + '22', alignItems: 'center', justifyContent: 'center',
  },
  initialsText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: C.accent },
  info: { flex: 1 },
  name: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.textBright },
  phone: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textMuted, marginTop: 1 },
});
