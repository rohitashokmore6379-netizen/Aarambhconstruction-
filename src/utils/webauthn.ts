/**
 * WebAuthn Biometric Authentication Helper Utilities
 * Compatible with modern browser WebAuthn API (Fingerprint, Touch ID, Face ID, Windows Hello, Android Biometrics)
 */

export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential === 'function'
  );
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    if (window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    return false;
  } catch (err) {
    return false;
  }
}

// Convert base64url string to Uint8Array (casted to any / BufferSource for TS 5+ strict DOM lib compatibility)
export function base64urlToUint8Array(base64url: string): any {
  // Replace base64url characters with base64 characters
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  // Pad with '=' to make length multiple of 4
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes as any;
}

// Convert ArrayBuffer / Uint8Array to base64url string
export function bufferToBase64url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = window.btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
