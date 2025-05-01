// Crypto utilities for P2P History Sync

/**
 * Compute SHA-256 hash of a string
 * @param {string} input - The input string to hash
 * @returns {Promise<string>} - The hex-encoded hash
 */
export async function sha256(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Derive an encryption key from a password using PBKDF2
 * @param {string} password - The password to derive the key from
 * @param {Uint8Array} salt - The salt to use for key derivation
 * @returns {Promise<CryptoKey>} - The derived key
 */
export async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  // Import the password as a key
  const importedKey = await crypto.subtle.importKey(
    'raw',
    passwordData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive the AES-GCM key
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    importedKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  return derivedKey;
}

/**
 * Encrypt data using AES-GCM
 * @param {CryptoKey} key - The encryption key
 * @param {string} data - The data to encrypt
 * @returns {Promise<{iv: Uint8Array, ciphertext: ArrayBuffer}>} - The encrypted data
 */
export async function encrypt(key, data) {
  // Generate a random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encode the data
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // Encrypt the data
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    dataBuffer
  );
  
  return { iv, ciphertext };
}

/**
 * Decrypt data using AES-GCM
 * @param {CryptoKey} key - The decryption key
 * @param {Uint8Array} iv - The initialization vector
 * @param {ArrayBuffer} ciphertext - The encrypted data
 * @returns {Promise<string>} - The decrypted data
 */
export async function decrypt(key, iv, ciphertext) {
  // Decrypt the data
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    ciphertext
  );
  
  // Decode the data
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}