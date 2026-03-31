import CryptoJS from 'crypto-js';

const BACKUP_MAGIC = 'PMBACKUP_V1';

export interface BackupPayload {
  magic: string;
  exportedAt: string;
  people: unknown[];
}

export function encryptBackup(data: object, password: string): string {
  const payload: BackupPayload = {
    magic: BACKUP_MAGIC,
    exportedAt: new Date().toISOString(),
    people: (data as any).people ?? [],
  };
  const json = JSON.stringify(payload);
  return CryptoJS.AES.encrypt(json, password).toString();
}

export function decryptBackup(encrypted: string, password: string): BackupPayload {
  let decrypted: string;
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, password);
    decrypted = bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    throw new Error('Failed to decrypt. Check your password and try again.');
  }
  if (!decrypted) {
    throw new Error('Wrong password or corrupted backup file.');
  }
  let parsed: BackupPayload;
  try {
    parsed = JSON.parse(decrypted);
  } catch {
    throw new Error('Backup file is corrupted or was encrypted with a different password.');
  }
  if (parsed.magic !== BACKUP_MAGIC) {
    throw new Error('This file is not a valid People Memory backup.');
  }
  return parsed;
}
