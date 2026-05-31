import crypto from 'crypto';

/**
 * Calculates SHA-256 hash of a file buffer
 */
export function calculateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}
