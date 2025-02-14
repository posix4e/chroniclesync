// Encryption service using Web Crypto API for service worker context
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  return btoa(String.fromCharCode(...bytes));
}

function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

async function generateEncryptionKey() {
  const key = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );
  
  const exportedKey = await crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(exportedKey);
}

async function importEncryptionKey(keyBase64) {
  const keyBuffer = base64ToArrayBuffer(keyBase64);
  return crypto.subtle.importKey(
    'raw',
    keyBuffer,
    'AES-GCM',
    true,
    ['encrypt', 'decrypt']
  );
}

async function encrypt(data, keyBase64) {
  const key = await importEncryptionKey(keyBase64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(JSON.stringify(data));
  
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    encodedData
  );
  
  return {
    encrypted: arrayBufferToBase64(encryptedData),
    iv: arrayBufferToBase64(iv)
  };
}

async function decrypt(encryptedData, iv, keyBase64) {
  const key = await importEncryptionKey(keyBase64);
  const encryptedBuffer = base64ToArrayBuffer(encryptedData);
  const ivBuffer = base64ToArrayBuffer(iv);
  
  const decryptedBuffer = await crypto.subtle.decrypt(
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