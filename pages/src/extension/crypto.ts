export interface ICrypto {
    initialize(password: string): Promise<void>;
    encrypt(data: string): Promise<string>;
    decrypt(encryptedData: string): Promise<string>;
}

export class Crypto implements ICrypto {
    protected key: CryptoKey | null = null;
    protected salt: Uint8Array | null = null;

    async initialize(password: string) {
        // Generate a random salt if not exists
        if (!this.salt) {
            this.salt = crypto.getRandomValues(new Uint8Array(16));
        }

        // Derive key from password using PBKDF2
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(password),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        this.key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: this.salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    async encrypt(data: string): Promise<string> {
        if (!this.key) throw new Error('Crypto not initialized');

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encodedData = new TextEncoder().encode(data);

        const encryptedContent = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            this.key,
            encodedData
        );

        // Combine IV and encrypted content
        const encryptedArray = new Uint8Array(iv.length + encryptedContent.byteLength);
        encryptedArray.set(iv);
        encryptedArray.set(new Uint8Array(encryptedContent), iv.length);

        return btoa(String.fromCharCode(...encryptedArray));
    }

    async decrypt(encryptedData: string): Promise<string> {
        if (!this.key) throw new Error('Crypto not initialized');

        const encryptedArray = new Uint8Array(
            atob(encryptedData).split('').map(char => char.charCodeAt(0))
        );

        const iv = encryptedArray.slice(0, 12);
        const content = encryptedArray.slice(12);

        const decryptedContent = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            this.key,
            content
        );

        return new TextDecoder().decode(decryptedContent);
    }
}