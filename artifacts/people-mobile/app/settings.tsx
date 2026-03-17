import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import C from '@/constants/colors';
import { useApp } from '@/context/AppContext';

const VERSION = '1.0.0';
const BUILD = '1';

function Row({ icon, label, sub, onPress, danger }: {
  icon: string; label: string; sub?: string; onPress?: () => void; danger?: boolean;
}) {
  return (
    <Pressable style={r.row} onPress={onPress} disabled={!onPress}>
      <View style={[r.iconWrap, danger && r.iconDanger]}>
        <Feather name={icon as any} size={17} color={danger ? C.red : C.accent} />
      </View>
      <View style={r.text}>
        <Text style={[r.label, danger && r.labelDanger]}>{label}</Text>
        {sub ? <Text style={r.sub}>{sub}</Text> : null}
      </View>
      {onPress ? <Feather name="chevron-right" size={16} color={C.textDim} /> : null}
    </Pressable>
  );
}
const r = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.accent + '18', alignItems: 'center', justifyContent: 'center' },
  iconDanger: { backgroundColor: C.red + '18' },
  text: { flex: 1 },
  label: { fontSize: 15, fontFamily: 'Inter_500Medium', color: C.text },
  labelDanger: { color: C.red },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textDim, marginTop: 2 },
});

function SectionHeader({ label }: { label: string }) {
  return <Text style={sh.text}>{label}</Text>;
}
const sh = StyleSheet.create({
  text: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: C.textMuted, letterSpacing: 2, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 },
});

function Card({ children }: { children: React.ReactNode }) {
  return <View style={cd.wrap}>{children}</View>;
}
const cd = StyleSheet.create({
  wrap: { backgroundColor: C.panel, borderRadius: 14, marginHorizontal: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
});

function Divider() {
  return <View style={{ height: 1, backgroundColor: C.border, marginLeft: 66 }} />;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { people, clearAllData } = useApp();

  const handleClearData = () => {
    Alert.alert(
      'Delete All Data?',
      `This will permanently delete all ${people.length} people and cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => clearAllData?.(),
        },
      ]
    );
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) }]}>
      <View style={s.navbar}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </Pressable>
        <Text style={s.title}>SETTINGS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <SectionHeader label="APP" />
        <Card>
          <Row icon="info" label="Version" sub={`${VERSION} (Build ${BUILD})`} />
          <Divider />
          <Row icon="users" label="People stored" sub={`${people.length} contact${people.length !== 1 ? 's' : ''} on this device`} />
          <Divider />
          <Row icon="lock" label="All data is stored locally" sub="Nothing ever leaves your device" />
        </Card>

        <SectionHeader label="LEGAL" />
        <Card>
          <Row icon="shield" label="Privacy Policy" onPress={() => router.push('/privacy')} />
        </Card>

        <SectionHeader label="DATA" />
        <Card>
          <Row
            icon="trash-2"
            label="Delete All Data"
            sub="Permanently remove all contacts"
            onPress={handleClearData}
            danger
          />
        </Card>

        <View style={s.footer}>
          <Text style={s.footerText}>People Memory</Text>
          <Text style={s.footerSub}>Made with care. Your data stays yours.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.panel, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  title: { fontSize: 12, fontFamily: 'Inter_700Bold', color: C.textMuted, letterSpacing: 3 },
  footer: { alignItems: 'center', paddingTop: 32, gap: 4 },
  footerText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: C.textDim },
  footerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: C.textDim },
});
