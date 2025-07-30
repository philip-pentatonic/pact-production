#!/usr/bin/env node
/**
 * Test password hashing and verification
 */

import { hashPassword, verifyPassword } from '../src/utils/password.js';

async function test() {
  console.log('Testing password hashing...\n');
  
  const password = 'admin123';
  console.log(`Password: ${password}`);
  
  // Hash the password
  const hash = await hashPassword(password);
  console.log(`Hash: ${hash}`);
  console.log(`Hash length: ${hash.length}`);
  
  // Verify the password
  const isValid = await verifyPassword(password, hash);
  console.log(`\nVerification: ${isValid ? 'SUCCESS' : 'FAILED'}`);
  
  // Test with wrong password
  const wrongValid = await verifyPassword('wrong', hash);
  console.log(`Wrong password: ${wrongValid ? 'FAILED' : 'SUCCESS (correctly rejected)'}`);
  
  // Generate hashes for demo users
  console.log('\n--- Demo User Hashes ---');
  const demoPasswords = {
    'admin': 'admin123',
    'operations': 'ops123',
    'demo': 'demo123'
  };
  
  for (const [user, pass] of Object.entries(demoPasswords)) {
    const userHash = await hashPassword(pass);
    console.log(`${user}: ${pass} -> ${userHash}`);
  }
}

test().catch(console.error);