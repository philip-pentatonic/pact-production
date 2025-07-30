#!/usr/bin/env node

/**
 * Generate password hash for seeding
 */

const crypto = require('crypto');

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.randomBytes(16);
  
  // Use PBKDF2
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  
  // Combine salt and hash
  const combined = Buffer.concat([salt, hash]);
  
  // Convert to base64
  return combined.toString('base64');
}

async function main() {
  const passwords = {
    'admin123': 'admin',
    'ops123': 'operations',
    'demo123': 'demo'
  };
  
  console.log('Generated password hashes:\n');
  
  for (const [password, username] of Object.entries(passwords)) {
    const hash = await hashPassword(password);
    console.log(`-- ${username}: ${password}`);
    console.log(`UPDATE users SET password_hash = '${hash}' WHERE username = '${username}';`);
    console.log();
  }
}

main().catch(console.error);