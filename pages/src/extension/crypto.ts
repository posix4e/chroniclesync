export async function encryptData(password: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  const encryptedContent = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    encoder.encode(data)
  );

  const encryptedArray = new Uint8Array(encryptedContent);
  const resultArray = new Uint8Array(salt.length + iv.length + encryptedArray.length);
  resultArray.set(salt, 0);
  resultArray.set(iv, salt.length);
  resultArray.set(encryptedArray, salt.length + iv.length);

  return btoa(String.fromCharCode(...resultArray));
}

export async function decryptData(password: string, encryptedData: string): Promise<string> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const dataArray = new Uint8Array(
    atob(encryptedData)
      .split('')
      .map(char => char.charCodeAt(0))
  );

  const salt = dataArray.slice(0, 16);
  const iv = dataArray.slice(16, 28);
  const data = dataArray.slice(28);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  const decryptedContent = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    data
  );

  return decoder.decode(decryptedContent);
}