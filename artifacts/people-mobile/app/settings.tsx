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

import C from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { decryptBackup, encryptBackup } from '@/utils/backup';

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

type PasswordModalMode = 'export' | 'import' | null;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { people, clearAllData, getRawData, importRawData } = useApp();

  const [passwordModal, setPasswordModal] = useState<PasswordModalMode>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingFile, setPendingFile] = useState<string | null>(null);

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

  const openExportModal = () => {
    setPassword('');
    setConfirmPassword('');
    setPasswordModal('export');
  };

  const openImportFlow = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: Platform.OS === 'ios' ? '*/*' : 'application/octet-stream',
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      setPendingFile(result.assets[0].uri);
      setPassword('');
      setConfirmPassword('');
      setPasswordModal('import');
    } catch {
      Alert.alert('Error', 'Could not open the file. Please try again.');
    }
  };

  const handleExport = async () => {
    if (!password) return;
    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please make sure both passwords are the same.');
      return;
    }
    if (password.length < 4) {
      Alert.alert('Password too short', 'Please use at least 4 characters.');
      return;
    }
    setBusy(true);
    try {
      const raw = getRawData();
      const encrypted = encryptBackup(raw, password);
      const filename = `PeopleMemory_${new Date().toISOString().slice(0, 10)}.pmbackup`;
      const fileUri = (cacheDirectory ?? '') + filename;
      await writeAsStringAsync(fileUri, encrypted, { encoding: EncodingType.UTF8 });
      setPasswordModal(null);
      setPassword('');
      setConfirmPassword('');
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/octet-stream', dialogTitle: 'Save your backup' });
      } else {
        Alert.alert('Exported', `Backup saved to:\n${fileUri}`);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert('Export failed', e?.message ?? 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    if (!password || !pendingFile) return;
    setBusy(true);
    try {
      const encrypted = await readAsStringAsync(pendingFile, { encoding: EncodingType.UTF8 });
      const payload = decryptBackup(encrypted, password);
      setPasswordModal(null);
      setPassword('');
      setPendingFile(null);
      Alert.alert(
        'Restore Backup?',
        `This will replace all current data with ${(payload.people as any[]).length} contact(s) from the backup. This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
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
    } finally {
      setBusy(false);
    }
  };

  const isExporting = passwordModal === 'export';

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

        <SectionHeader label="BACKUP" />
        <Card>
          <Row
            icon="download"
            label="Export Backup"
            sub="Encrypt & save all your data to a file"
            onPress={openExportModal}
          />
          <Divider />
          <Row
            icon="upload"
            label="Import Backup"
            sub="Restore from an encrypted backup file"
            onPress={openImportFlow}
          />
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

      {/* Password Modal */}
      <Modal
        visible={passwordModal !== null}
        transparent
        animationType="slide"
        onRequestClose={() => { setPasswordModal(null); setPassword(''); setConfirmPassword(''); }}
      >
        <KeyboardAvoidingView
          style={pm.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={pm.backdrop} onPress={() => { setPasswordModal(null); setPassword(''); setConfirmPassword(''); }} />
          <View style={pm.sheet}>
            <View style={pm.handle} />
            <View style={pm.iconRow}>
              <View style={pm.iconCircle}>
                <Feather name={isExporting ? 'download' : 'upload'} size={22} color={C.accent} />
              </View>
            </View>
            <Text style={pm.title}>{isExporting ? 'Export Backup' : 'Import Backup'}</Text>
            <Text style={pm.subtitle}>
              {isExporting
                ? 'Set a password to encrypt your backup. You\'ll need it to restore.'
                : 'Enter the password you used when creating this backup.'}
            </Text>

            <Text style={pm.fieldLabel}>Password</Text>
            <TextInput
              style={pm.input}
              placeholder="Enter password"
              placeholderTextColor={C.textDim}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoFocus
            />

            {isExporting && (
              <>
                <Text style={pm.fieldLabel}>Confirm Password</Text>
                <TextInput
                  style={pm.input}
                  placeholder="Re-enter password"
                  placeholderTextColor={C.textDim}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </>
            )}

            <View style={pm.actions}>
              <Pressable style={pm.cancelBtn} onPress={() => { setPasswordModal(null); setPassword(''); setConfirmPassword(''); }}>
                <Text style={pm.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[pm.actionBtn, (!password || busy) && pm.actionBtnDisabled]}
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
  sheet: {
    backgroundColor: C.panel, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    borderWidth: 1, borderColor: C.border,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 20 },
  iconRow: { alignItems: 'center', marginBottom: 12 },
  iconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.accent + '20', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.accent + '40' },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: C.textBright, marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: C.textMuted, marginBottom: 20, textAlign: 'center', lineHeight: 19 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: C.textMuted, letterSpacing: 1, marginBottom: 6 },
  input: {
    backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    padding: 14, fontSize: 15, fontFamily: 'Inter_400Regular', color: C.text, marginBottom: 14,
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: C.bg, alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  cancelText: { fontSize: 15, fontFamily: 'Inter_500Medium', color: C.textMuted },
  actionBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: C.accent, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  actionBtnDisabled: { opacity: 0.4 },
  actionText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});

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
