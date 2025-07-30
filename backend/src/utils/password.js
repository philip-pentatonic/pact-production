/**
 * Password Hashing Utilities
 * Using Web Crypto API for Cloudflare Workers
 */

// Hash password using PBKDF2
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  // Combine salt and hash
  const hashArray = new Uint8Array(hash);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  
  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

// Verify password against hash
export async function verifyPassword(password, storedHash) {
  const encoder = new TextEncoder();
  
  // Decode the stored hash
  const combined = Uint8Array.from(atob(storedHash), c => c.charCodeAt(0));
  const salt = combined.slice(0, 16);
  const hashArray = combined.slice(16);
  
  // Hash the provided password with the same salt
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  // Compare hashes
  const newHashArray = new Uint8Array(hash);
  if (hashArray.length !== newHashArray.length) return false;
  
  for (let i = 0; i < hashArray.length; i++) {
    if (hashArray[i] !== newHashArray[i]) return false;
  }
  
  return true;
}