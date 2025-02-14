// Encryption service using Web Crypto API
async function generateEncryptionKey() {
  const key = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );
  
  // Export the key to store it
  const exportedKey = await window.crypto.subtle.exportKey('raw', key);
  const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
  return keyBase64;
}

async function importEncryptionKey(keyBase64) {
  const keyBuffer = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
  return window.crypto.subtle.importKey(
    'raw',
    keyBuffer,
    'AES-GCM',
    true,
    ['encrypt', 'decrypt']
  );
}

async function encrypt(data, keyBase64) {
  const key = await importEncryptionKey(keyBase64);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(JSON.stringify(data));
  
  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    encodedData
  );
  
  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
    iv: btoa(String.fromCharCode(...iv))
  };
}

async function decrypt(encryptedData, iv, keyBase64) {
  const key = await importEncryptionKey(keyBase64);
  const encryptedBuffer = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  const ivBuffer = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
  
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBuffer
    },
    key,
    encryptedBuffer
  );
  
  const decryptedText = new TextDecoder().decode(decryptedBuffer);
  return JSON.parse(decryptedText);
}

async function ensureEncryptionKey() {
  const stored = await chrome.storage.local.get(['encryptionKey']);
  if (stored.encryptionKey) {
    return stored.encryptionKey;
  }
  
  const newKey = await generateEncryptionKey();
  await chrome.storage.local.set({ encryptionKey: newKey });
  return newKey;
}

export { encrypt, decrypt, ensureEncryptionKey };