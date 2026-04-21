// WebAuthn / Biometric Authentication Utilities

export interface BiometricCredential {
  id: string;
  rawId: ArrayBuffer;
  type: string;
}

// Check if biometric is supported
export async function isBiometricSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  // Check if WebAuthn is supported
  if (!window.PublicKeyCredential) {
    return false;
  }

  // Check if platform authenticator is available
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
}

// Get biometric type name
export function getBiometricType(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
    return 'Face ID / Touch ID';
  }
  
  if (userAgent.includes('android')) {
    return 'Fingerprint / Face Unlock';
  }
  
  if (userAgent.includes('mac')) {
    return 'Touch ID';
  }
  
  if (userAgent.includes('windows')) {
    return 'Windows Hello';
  }
  
  return 'Biometric';
}

// Register biometric credential
export async function registerBiometric(
  userId: string,
  userName: string,
  userDisplayName: string
): Promise<Credential | null> {
  try {
    // Generate challenge (in production, this should come from server)
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    
    // Generate user ID buffer
    const userIdBuffer = new TextEncoder().encode(userId);

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'Aturla Wallet',
        id: window.location.hostname,
      },
      user: {
        id: userIdBuffer,
        name: userName,
        displayName: userDisplayName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },   // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Use platform authenticator (fingerprint/face)
        userVerification: 'required',
        residentKey: 'preferred',
      },
      attestation: 'none',
      timeout: 60000,
    };

    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    });

    return credential;
  } catch (error) {
    console.error('Biometric registration failed:', error);
    throw error;
  }
}

// Authenticate with biometric
export async function authenticateWithBiometric(
  credentialId?: string
): Promise<boolean> {
  try {
    // Generate challenge (in production, this should come from server)
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      timeout: 60000,
      userVerification: 'required',
      rpId: window.location.hostname,
    };

    // If we have a specific credential ID, use it
    if (credentialId) {
      publicKeyCredentialRequestOptions.allowCredentials = [{
        id: base64ToArrayBuffer(credentialId),
        type: 'public-key',
        transports: ['internal'],
      }];
    }

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });

    return !!assertion;
  } catch (error) {
    console.error('Biometric authentication failed:', error);
    return false;
  }
}

// Helper: Convert ArrayBuffer to Base64
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper: Convert Base64 to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Store biometric credential ID locally
export function storeBiometricCredentialId(credentialId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('biometric_credential_id', credentialId);
    localStorage.setItem('biometric_enabled', 'true');
  }
}

// Get stored biometric credential ID
export function getBiometricCredentialId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('biometric_credential_id');
  }
  return null;
}

// Check if biometric is enabled for this user
export function isBiometricEnabled(): boolean {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('biometric_enabled') === 'true';
  }
  return false;
}

// Disable biometric for this user
export function disableBiometric(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('biometric_credential_id');
    localStorage.removeItem('biometric_enabled');
  }
}
