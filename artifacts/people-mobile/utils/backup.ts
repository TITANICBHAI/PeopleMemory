import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';

const BACKUP_MAGIC = 'PMBACKUP_V1';
const ENC_V2_PREFIX = 'PMENC_V2:';

export interface BackupPayload {
  magic: string;
  exportedAt: string;
  people: unknown[];
}

async function deriveKey(password: string): Promise<CryptoJS.lib.WordArray> {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password,
  );
  return CryptoJS.enc.Hex.parse(hash);
}

export async function encryptBackup(data: object, password: string): Promise<string> {
  const payload: BackupPayload = {
    magic: BACKUP_MAGIC,
    exportedAt: new Date().toISOString(),
    people: (data as any).people ?? [],
  };
  const json = JSON.stringify(payload);
  const key = await deriveKey(password);
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(json, key, { iv });
  const ivHex = CryptoJS.enc.Hex.stringify(iv);
  return `${ENC_V2_PREFIX}${ivHex}:${encrypted.toString()}`;
}

export async function decryptBackup(encrypted: string, password: string): Promise<BackupPayload> {
  let decrypted: string;
  try {
    if (encrypted.startsWith(ENC_V2_PREFIX)) {
      const rest = encrypted.slice(ENC_V2_PREFIX.length);
      const colonIdx = rest.indexOf(':');
      if (colonIdx === -1) throw new Error('Corrupted backup format.');
      const ivHex = rest.slice(0, colonIdx);
      const cipherText = rest.slice(colonIdx + 1);
      const key = await deriveKey(password);
      const iv = CryptoJS.enc.Hex.parse(ivHex);
      const bytes = CryptoJS.AES.decrypt(cipherText, key, { iv });
      decrypted = bytes.toString(CryptoJS.enc.Utf8);
    } else {
      const bytes = CryptoJS.AES.decrypt(encrypted, password);
      decrypted = bytes.toString(CryptoJS.enc.Utf8);
    }
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
