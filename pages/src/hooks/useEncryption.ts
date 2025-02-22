import { useState, useEffect } from 'react';
import { EncryptionManager } from '../utils/encryption';

export function useEncryption() {
  const [encryptionManager, setEncryptionManager] = useState<EncryptionManager | null>(null);

  useEffect(() => {
    const manager = new EncryptionManager();
    setEncryptionManager(manager);
  }, []);

  const decryptHistoryEntry = async (entry: any) => {
    if (!encryptionManager) return entry;

    const decryptedEntry = { ...entry };

    if (typeof entry.url === 'object' && entry.url.encrypted) {
      decryptedEntry.url = await encryptionManager.decrypt(entry.url);
    }

    if (typeof entry.title === 'object' && entry.title.encrypted) {
      decryptedEntry.title = await encryptionManager.decrypt(entry.title);
    }

    return decryptedEntry;
  };

  const decryptHistoryEntries = async (entries: any[]) => {
    if (!encryptionManager) return entries;
    return Promise.all(entries.map(decryptHistoryEntry));
  };

  return {
    encryptionManager,
    decryptHistoryEntry,
    decryptHistoryEntries,
  };
}