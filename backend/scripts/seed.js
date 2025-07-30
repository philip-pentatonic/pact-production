#!/usr/bin/env node
/**
 * Database Seed Script
 * Seeds initial data for PACT production
 */

import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const seedData = {
  members: [
    { name: 'Kiehl\'s', code: 'KIEHLS', contact_email: 'operations@kiehls.com' },
    { name: 'Sephora', code: 'SEPHORA', contact_email: 'sustainability@sephora.com' },
    { name: 'Ulta Beauty', code: 'ULTA', contact_email: 'recycling@ulta.com' },
    { name: 'Macy\'s', code: 'MACYS', contact_email: 'green@macys.com' },
    { name: 'Blue Mercury', code: 'BLUEMERCURY', contact_email: 'eco@bluemercury.com' }
  ],
  
  program_types: [
    { code: 'RETAIL', name: 'Retail Take-Back', description: 'In-store customer recycling program' },
    { code: 'MAIL', name: 'Mail-Back', description: 'Customer mail-in recycling program' },
    { code: 'BULK', name: 'Bulk Inventory', description: 'Bulk inventory recycling from stores' },
    { code: 'WAREHOUSE', name: 'Warehouse Returns', description: 'Warehouse and DC returns recycling' }
  ],
  
  material_types: [
    { code: 'PET', name: 'PET Plastic', category: 'Plastic' },
    { code: 'HDPE', name: 'HDPE Plastic', category: 'Plastic' },
    { code: 'PP', name: 'PP Plastic', category: 'Plastic' },
    { code: 'GLASS', name: 'Glass', category: 'Glass' },
    { code: 'ALUMINUM', name: 'Aluminum', category: 'Metal' },
    { code: 'PAPER', name: 'Paper/Cardboard', category: 'Paper' },
    { code: 'MIXED', name: 'Mixed Materials', category: 'Other' }
  ],
  
  users: [
    {
      username: 'admin',
      email: 'admin@pact.com',
      first_name: 'PACT',
      last_name: 'Admin',
      role: 'super_admin',
      password: 'admin123' // Change in production!
    },
    {
      username: 'operations',
      email: 'operations@pact.com',
      first_name: 'Operations',
      last_name: 'Manager',
      role: 'admin',
      password: 'ops123' // Change in production!
    },
    {
      username: 'demo',
      email: 'demo@pact.com',
      first_name: 'Demo',
      last_name: 'User',
      role: 'viewer',
      password: 'demo123' // Change in production!
    }
  ]
};

async function seedDatabase() {
  const env = process.env.ENVIRONMENT || 'development';
  const isLocal = process.argv.includes('--local');
  
  console.log(`Seeding database for ${env} environment${isLocal ? ' (local)' : ''}...`);
  
  try {
    // Generate SQL for seed data
    let sql = '-- PACT Database Seed Data\n\n';
    
    // Members
    sql += '-- Members\n';
    seedData.members.forEach(member => {
      const escapedName = member.name.replace(/'/g, "''");
      sql += `INSERT OR IGNORE INTO members (name, code, contact_email, is_active) VALUES ('${escapedName}', '${member.code}', '${member.contact_email}', 1);\n`;
    });
    sql += '\n';
    
    // Program Types
    sql += '-- Program Types\n';
    seedData.program_types.forEach(program => {
      sql += `INSERT OR IGNORE INTO program_types (code, name, description, is_active) VALUES ('${program.code}', '${program.name}', '${program.description}', 1);\n`;
    });
    sql += '\n';
    
    // Material Types
    sql += '-- Material Types\n';
    seedData.material_types.forEach(material => {
      sql += `INSERT OR IGNORE INTO material_types (code, name, category, is_recyclable) VALUES ('${material.code}', '${material.name}', '${material.category}', 1);\n`;
    });
    sql += '\n';
    
    // Users (with temporary passwords - should be changed in production)
    sql += '-- Users\n';
    sql += '-- Note: These use temporary password hashes. Users should reset passwords on first login.\n';
    
    // For seed data, we'll use a pre-computed hash for the passwords
    // In production, use the hashPassword function from utils/password.js
    const tempPasswordHash = 'AAAAAAAAAAAAAAAAAMRwN4VimMKpF+P3QWLnurjfVNO7aZDNr/s2MBeKGUBg'; // 'password123'
    
    seedData.users.forEach(user => {
      sql += `INSERT OR IGNORE INTO users (username, email, password_hash, first_name, last_name, role, is_active) VALUES ('${user.username}', '${user.email}', '${tempPasswordHash}', '${user.first_name}', '${user.last_name}', '${user.role}', 1);\n`;
    });
    sql += '\n';
    
    // Sample stores for Kiehl's
    sql += '-- Sample Stores\n';
    sql += `
INSERT OR IGNORE INTO stores (member_id, store_name, store_code, city, state, zip_code, is_active)
SELECT id, 'Times Square', 'NYC001', 'New York', 'NY', '10036', 1 FROM members WHERE code = 'KIEHLS';

INSERT OR IGNORE INTO stores (member_id, store_name, store_code, city, state, zip_code, is_active)
SELECT id, 'Union Square', 'NYC002', 'New York', 'NY', '10003', 1 FROM members WHERE code = 'KIEHLS';

INSERT OR IGNORE INTO stores (member_id, store_name, store_code, city, state, zip_code, is_active)
SELECT id, 'Beverly Hills', 'LA001', 'Beverly Hills', 'CA', '90210', 1 FROM members WHERE code = 'KIEHLS';
`;
    
    // Write seed file
    const seedFile = join(__dirname, '../../database/seed.sql');
    writeFileSync(seedFile, sql);
    
    // Execute seed
    const envFlag = env === 'development' || env === 'staging' ? `--env ${env}` : '';
    const cmd = `wrangler d1 execute DB ${isLocal ? '--local' : ''} ${envFlag} --file=${seedFile}`;
    execSync(cmd, { stdio: 'inherit' });
    
    console.log('✅ Database seeded successfully!');
    
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

// Run seed
seedDatabase();