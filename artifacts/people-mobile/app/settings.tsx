import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { cacheDirectory, EncodingType, readAsStringAsync, writeAsStringAsync } from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
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

import { useColors } from '@/constants/colors';
import { THEME_META, ThemeMeta } from '@/constants/themes';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { decryptBackup, encryptBackup } from '@/utils/backup';

const VERSION = '1.0.0';
const BUILD = '1';

// ─── Theme Picker ──────────────────────────────────────────────────────────────

function ThemeInfoModal({ theme, visible, onClose }: {
  theme: ThemeMeta | null; visible: boolean; onClose: () => void;
}) {
  const C = useColors();
  if (!theme) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[tim.overlay]} onPress={onClose} />
      <View style={[tim.box, { backgroundColor: C.panel, borderColor: C.border }]}>
        <View style={[tim.swatch, { backgroundColor: theme.previewBg, borderColor: C.border }]}>
          <View style={[tim.swatchPanel, { backgroundColor: theme.previewPanel }]} />
          <View style={[tim.swatchAccent, { backgroundColor: theme.previewAccent }]} />
        </View>
        <Text style={[tim.name, { color: C.textBright }]}>{theme.name}</Text>
        <Text style={[tim.subtitle, { color: theme.previewAccent }]}>{theme.subtitle}</Text>
        <Text style={[tim.desc, { color: C.textMuted }]}>{theme.description}</Text>
        <Pressable style={[tim.closeBtn, { backgroundColor: C.accent }]} onPress={onClose}>
          <Text style={tim.closeBtnText}>Got it</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
const tim = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  box: {
    position: 'absolute', left: 24, right: 24, top: '30%',
    borderRadius: 20, padding: 24, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  swatch: {
    height: 60, borderRadius: 12, marginBottom: 16, borderWidth: 1,
    overflow: 'hidden', position: 'relative',
  },
  swatchPanel: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: '60%',
    borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.06)',
  },
  swatchAccent: {
    position: 'absolute', right: 16, top: 16, bottom: 16, width: 28, borderRadius: 14,
  },
  name: { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 12 },
  desc: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21, marginBottom: 20 },
  closeBtn: { height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});

function ThemeOption({ meta, isActive, onSelect, onInfo }: {
  meta: ThemeMeta; isActive: boolean; onSelect: () => void; onInfo: () => void;
}) {
  const C = useColors();
  return (
    <Pressable
      style={({ pressed }) => [
        topt.row,
        { borderColor: isActive ? meta.previewAccent + '88' : C.border },
        isActive && { backgroundColor: meta.previewAccent + '0A' },
        pressed && { backgroundColor: C.panelHigh },
      ]}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(); }}
    >
      {/* Color swatch */}
      <View style={[topt.swatch, { backgroundColor: meta.previewBg, borderColor: C.border }]}>
        <View style={[topt.swatchInner, { backgroundColor: meta.previewPanel }]} />
        <View style={[topt.swatchDot, { backgroundColor: meta.previewAccent }]} />
      </View>

      {/* Labels */}
      <View style={topt.labels}>
        <Text style={[topt.name, { color: C.textBright }]}>{meta.name}</Text>
        <Text style={[topt.sub, { color: C.textMuted }]}>{meta.subtitle}</Text>
      </View>

      {/* Info button */}
      <Pressable
        style={[topt.infoBtn, { backgroundColor: C.panelHigh, borderColor: C.border }]}
        onPress={e => { e.stopPropagation(); onInfo(); }}
        hitSlop={8}
      >
        <Feather name="info" size={14} color={C.textMuted} />
      </Pressable>

      {/* Active checkmark */}
      {isActive ? (
        <View style={[topt.check, { backgroundColor: meta.previewAccent }]}>
          <Feather name="check" size={12} color="#fff" />
        </View>
      ) : (
        <View style={[topt.checkEmpty, { borderColor: C.border }]} />
      )}
    </Pressable>
  );
}
const topt = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 13,
    borderRadius: 14, borderWidth: 1.5, marginBottom: 8,
  },
  swatch: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1,
    flexShrink: 0, overflow: 'hidden', position: 'relative',
  },
  swatchInner: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: '55%',
    borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.06)',
  },
  swatchDot: {
    position: 'absolute', right: 7, top: 7, width: 12, height: 12, borderRadius: 6,
  },
  labels: { flex: 1 },
  name: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  infoBtn: {
    width: 28, height: 28, borderRadius: 8, alignItems: 'center',
    justifyContent: 'center', borderWidth: 1,
  },
  check: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  checkEmpty: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },
});

// ─── Settings helpers ──────────────────────────────────────────────────────────

function Row({ icon, label, sub, onPress, danger }: {
  icon: string; label: string; sub?: string; onPress?: () => void; danger?: boolean;
}) {
  const C = useColors();
  return (
    <Pressable
      style={[r.row]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[r.iconWrap, { backgroundColor: danger ? C.red + '18' : C.accent + '18' }]}>
        <Feather name={icon as any} size={17} color={danger ? C.red : C.accent} />
      </View>
      <View style={r.text}>
        <Text style={[r.label, { color: danger ? C.red : C.text }]}>{label}</Text>
        {sub ? <Text style={[r.sub, { color: C.textDim }]}>{sub}</Text> : null}
      </View>
      {onPress ? <Feather name="chevron-right" size={16} color={C.textDim} /> : null}
    </Pressable>
  );
}
const r = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
  label: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
});

function SectionHeader({ label }: { label: string }) {
  const C = useColors();
  return <Text style={[sh.text, { color: C.textMuted }]}>{label}</Text>;
}
const sh = StyleSheet.create({
  text: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 2, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 },
});

function Card({ children }: { children: React.ReactNode }) {
  const C = useColors();
  return (
    <View style={[cd.wrap, { backgroundColor: C.panel, borderColor: C.border }]}>
      {children}
    </View>
  );
}
const cd = StyleSheet.create({
  wrap: { borderRadius: 14, marginHorizontal: 16, borderWidth: 1, overflow: 'hidden' },
});

function Divider() {
  const C = useColors();
  return <View style={{ height: 1, backgroundColor: C.border, marginLeft: 66 }} />;
}

type PasswordModalMode = 'export' | 'import' | null;

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { people, clearAllData, getRawData, importRawData } = useApp();
  const { themeId, setTheme } = useTheme();

  const [passwordModal, setPasswordModal] = useState<PasswordModalMode>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingFile, setPendingFile] = useState<string | null>(null);
  const [infoTheme, setInfoTheme] = useState<ThemeMeta | null>(null);

  const handleClearData = () => {
    Alert.alert(
      'Delete All Data?',
      `This will permanently delete all ${people.length} people and cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Everything', style: 'destructive', onPress: () => clearAllData?.() },
      ]
    );
  };

  const openExportModal = () => {
    setPassword(''); setConfirmPassword(''); setPasswordModal('export');
  };

  const openImportFlow = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: Platform.OS === 'ios' ? '*/*' : 'application/octet-stream',
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      setPendingFile(result.assets[0].uri);
      setPassword(''); setConfirmPassword(''); setPasswordModal('import');
    } catch {
      Alert.alert('Error', 'Could not open the file. Please try again.');
    }
  };

  const handleExport = async () => {
    if (!password) return;
    if (password !== confirmPassword) { Alert.alert('Passwords do not match', 'Please make sure both passwords are the same.'); return; }
    if (password.length < 4) { Alert.alert('Password too short', 'Please use at least 4 characters.'); return; }
    setBusy(true);
    try {
      const raw = getRawData();
      const encrypted = encryptBackup(raw, password);
      const filename = `PeopleMemory_${new Date().toISOString().slice(0, 10)}.pmbackup`;
      const fileUri = (cacheDirectory ?? '') + filename;
      await writeAsStringAsync(fileUri, encrypted, { encoding: EncodingType.UTF8 });
      setPasswordModal(null); setPassword(''); setConfirmPassword('');
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/octet-stream', dialogTitle: 'Save your backup' });
      } else {
        Alert.alert('Exported', `Backup saved to:\n${fileUri}`);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert('Export failed', e?.message ?? 'Something went wrong.');
    } finally { setBusy(false); }
  };

  const handleImport = async () => {
    if (!password || !pendingFile) return;
    setBusy(true);
    try {
      const encrypted = await readAsStringAsync(pendingFile, { encoding: EncodingType.UTF8 });
      const payload = decryptBackup(encrypted, password);
      setPasswordModal(null); setPassword(''); setPendingFile(null);
      Alert.alert(
        'Restore Backup?',
        `This will replace all current data with ${(payload.people as any[]).length} contact(s) from the backup. This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore', style: 'destructive',
            onPress: async () => {
              await importRawData(payload.people as any);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Restored', 'Your backup has been restored successfully.');
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('Import failed', e?.message ?? 'Wrong password or corrupted file.');
    } finally { setBusy(false); }
  };

  const isExporting = passwordModal === 'export';

  return (
    <View style={[s.root, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0), backgroundColor: C.bg }]}>
      <View style={[s.navbar, { borderBottomColor: C.border }]}>
        <Pressable style={[s.backBtn, { backgroundColor: C.panel, borderColor: C.border }]} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={C.text} />
        </Pressable>
        <Text style={[s.title, { color: C.textMuted }]}>SETTINGS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>

        {/* APPEARANCE — theme switcher */}
        <SectionHeader label="APPEARANCE" />
        <View style={[s.themeSection, { marginHorizontal: 16 }]}>
          {THEME_META.map(meta => (
            <ThemeOption
              key={meta.id}
              meta={meta}
              isActive={themeId === meta.id}
              onSelect={() => setTheme(meta.id)}
              onInfo={() => setInfoTheme(meta)}
            />
          ))}
        </View>

        <SectionHeader label="APP" />
        <Card>
          <Row icon="info" label="Version" sub={`${VERSION} (Build ${BUILD})`} />
          <Divider />
          <Row icon="users" label="People stored" sub={`${people.length} contact${people.length !== 1 ? 's' : ''} on this device`} />
          <Divider />
          <Row icon="lock" label="All data is stored locally" sub="Nothing ever leaves your device" />
        </Card>

        <SectionHeader label="BACKUP" />
        <Card>
          <Row icon="download" label="Export Backup" sub="Encrypt & save all your data to a file" onPress={openExportModal} />
          <Divider />
          <Row icon="upload" label="Import Backup" sub="Restore from an encrypted backup file" onPress={openImportFlow} />
        </Card>

        <SectionHeader label="LEGAL" />
        <Card>
          <Row icon="shield" label="Privacy Policy" onPress={() => router.push('/privacy')} />
        </Card>

        <SectionHeader label="DATA" />
        <Card>
          <Row icon="trash-2" label="Delete All Data" sub="Permanently remove all contacts" onPress={handleClearData} danger />
        </Card>

        <View style={s.footer}>
          <Text style={[s.footerText, { color: C.textDim }]}>People Memory</Text>
          <Text style={[s.footerSub, { color: C.textDim }]}>Made with care. Your data stays yours.</Text>
        </View>
      </ScrollView>

      {/* Theme info modal */}
      <ThemeInfoModal
        theme={infoTheme}
        visible={infoTheme !== null}
        onClose={() => setInfoTheme(null)}
      />

      {/* Password Modal */}
      <Modal
        visible={passwordModal !== null}
        transparent
        animationType="slide"
        onRequestClose={() => { setPasswordModal(null); setPassword(''); setConfirmPassword(''); }}
      >
        <KeyboardAvoidingView style={pm.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={pm.backdrop} onPress={() => { setPasswordModal(null); setPassword(''); setConfirmPassword(''); }} />
          <View style={[pm.sheet, { backgroundColor: C.panel, borderColor: C.border }]}>
            <View style={[pm.handle, { backgroundColor: C.border }]} />
            <View style={pm.iconRow}>
              <View style={[pm.iconCircle, { backgroundColor: C.accent + '20', borderColor: C.accent + '40' }]}>
                <Feather name={isExporting ? 'download' : 'upload'} size={22} color={C.accent} />
              </View>
            </View>
            <Text style={[pm.title, { color: C.textBright }]}>{isExporting ? 'Export Backup' : 'Import Backup'}</Text>
            <Text style={[pm.subtitle, { color: C.textMuted }]}>
              {isExporting
                ? 'Set a password to encrypt your backup. You\'ll need it to restore.'
                : 'Enter the password you used when creating this backup.'}
            </Text>
            <Text style={[pm.fieldLabel, { color: C.textMuted }]}>Password</Text>
            <TextInput
              style={[pm.input, { backgroundColor: C.bg, borderColor: C.border, color: C.text }]}
              placeholder="Enter password"
              placeholderTextColor={C.textDim}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoFocus
            />
            {isExporting && (
              <>
                <Text style={[pm.fieldLabel, { color: C.textMuted }]}>Confirm Password</Text>
                <TextInput
                  style={[pm.input, { backgroundColor: C.bg, borderColor: C.border, color: C.text }]}
                  placeholder="Re-enter password"
                  placeholderTextColor={C.textDim}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </>
            )}
            <View style={pm.actions}>
              <Pressable
                style={[pm.cancelBtn, { backgroundColor: C.bg, borderColor: C.border }]}
                onPress={() => { setPasswordModal(null); setPassword(''); setConfirmPassword(''); }}
              >
                <Text style={[pm.cancelText, { color: C.textMuted }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[pm.actionBtn, { backgroundColor: C.accent }, (!password || busy) && pm.actionBtnDisabled]}
                onPress={isExporting ? handleExport : handleImport}
                disabled={!password || busy}
              >
                <Feather name={isExporting ? 'download' : 'upload'} size={15} color="#fff" />
                <Text style={pm.actionText}>{busy ? 'Please wait...' : isExporting ? 'Export' : 'Import'}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const pm = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderWidth: 1 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  iconRow: { alignItems: 'center', marginBottom: 12 },
  iconCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 20, textAlign: 'center', lineHeight: 19 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, marginBottom: 6 },
  input: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 15, fontFamily: 'Inter_400Regular', marginBottom: 14 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  cancelText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  actionBtnDisabled: { opacity: 0.4 },
  actionText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});

const s = StyleSheet.create({
  root: { flex: 1 },
  themeSection: { marginBottom: 4 },
  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  title: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 3 },
  footer: { alignItems: 'center', paddingTop: 32, gap: 4 },
  footerText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  footerSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});
