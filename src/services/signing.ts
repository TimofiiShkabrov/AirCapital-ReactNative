import { hmac } from '@noble/hashes/hmac.js';
import { sha256, sha512 } from '@noble/hashes/sha2.js';

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function encode(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/** Binance, BingX: HMAC-SHA256 → hex */
export function hmacSHA256Hex(message: string, secret: string): string {
  return toHex(hmac(sha256, encode(secret), encode(message)));
}

/** Gate.io: SHA-512 of body → hex */
export function sha512Hex(input: string): string {
  return toHex(sha512(encode(input)));
}

/** Gate.io: HMAC-SHA512 → hex */
export function hmacSHA512Hex(message: string, secret: string): string {
  return toHex(hmac(sha512, encode(secret), encode(message)));
}

/** OKX: HMAC-SHA256 → base64 */
export function hmacSHA256Base64(message: string, secret: string): string {
  return toBase64(hmac(sha256, encode(secret), encode(message)));
}

/** Gate.io sign string builder */
export function buildGateSignString(
  method: string,
  path: string,
  queryString: string,
  body: string,
  timestamp: string,
): string {
  const bodyHash = sha512Hex(body);
  return `${method}\n${path}\n${queryString}\n${bodyHash}\n${timestamp}`;
}
