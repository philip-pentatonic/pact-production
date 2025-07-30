#!/usr/bin/env node
/**
 * Initialize Admin User Script
 * Creates the first admin user with a secure password
 */

import { execSync } from 'child_process';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

async function createAdminUser() {
  console.log('=== PACT Admin User Setup ===\n');
  
  try {
    // Get user details
    const username = await question('Admin username (default: admin): ') || 'admin';
    const email = await question('Admin email: ');
    const firstName = await question('First name: ');
    const lastName = await question('Last name: ');
    
    // Get password (in production, use a more secure method)
    const password = await question('Password (min 6 characters): ');
    
    if (!email || !password || password.length < 6) {
      console.error('\n❌ Email and password (min 6 chars) are required!');
      process.exit(1);
    }
    
    // Create a temporary Node.js script that uses the password utility
    const tempScript = `
import { hashPassword } from '../src/utils/password.js';

async function main() {
  const hash = await hashPassword('${password.replace(/'/g, "\\'")}');
  console.log(hash);
}

main();
    `;
    
    // Write temp script and execute it
    const fs = await import('fs');
    const tempFile = join(__dirname, '.temp-hash.js');
    fs.writeFileSync(tempFile, tempScript);
    
    // Get the password hash
    const result = execSync(`node ${tempFile}`, { encoding: 'utf8' }).trim();
    fs.unlinkSync(tempFile); // Clean up
    
    // Generate SQL to insert admin user
    const sql = `
-- Create initial admin user
INSERT INTO users (
  username, email, password_hash, first_name, last_name, role, is_active
) VALUES (
  '${username}',
  '${email}',
  '${result}',
  '${firstName}',
  '${lastName}',
  'super_admin',
  1
);
    `;
    
    // Write SQL file
    const sqlFile = join(__dirname, '../../database/create-admin.sql');
    fs.writeFileSync(sqlFile, sql);
    
    console.log('\n✅ Admin user SQL generated!');
    console.log('\nTo create the user, run:');
    console.log(`wrangler d1 execute pact-production --file=database/create-admin.sql`);
    console.log('\nFor local development:');
    console.log(`wrangler d1 execute pact-production --local --file=database/create-admin.sql`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the script
createAdminUser();