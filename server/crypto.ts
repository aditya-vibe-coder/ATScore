/**
 * ATScore India - Cryptographic Utilities
 * AES-256 GCM encryption/decryption for sensitive data at rest (BYOK keys, etc.)
 */
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = process.env.ENCRYPTION_KEY || 'your-encryption-key';
const SALT = process.env.ENCRYPTION_SALT || 'your-encryption-salt';

function deriveKey(): Buffer {
  return crypto.scryptSync(KEY, SALT, 32);
}

/**
 * Encrypt plaintext using AES-256-GCM.
 * Returns base64-encoded ciphertext with iv and auth tag embedded.
 */
export function encrypt(plaintext: string): string {
  const key = deriveKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  // Package: iv + authTag + ciphertext as base64
  const payload = JSON.stringify({ iv: iv.toString('hex'), tag: authTag, data: ciphertext });
  return Buffer.from(payload).toString('base64');
}

/**
 * Decrypt a base64-encoded AES-256-GCM ciphertext.
 */
export function decrypt(encoded: string): string {
  const key = deriveKey();
  const payload = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
  const iv = Buffer.from(payload.iv, 'hex');
  const authTag = Buffer.from(payload.tag, 'hex');
  const ciphertext = payload.data;

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
  plaintext += decipher.final('utf8');
  return plaintext;
}
