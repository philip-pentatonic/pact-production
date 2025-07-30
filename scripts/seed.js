#!/usr/bin/env node

/**
 * Database Seeder
 * Seeds the database with demo data
 */

const { execSync } = require('child_process');
const { readFileSync } = require('fs');
const { join } = require('path');

async function seed() {
  const args = process.argv.slice(2);
  const isLocal = args.includes('--local');
  const envArg = args.find(arg => arg.startsWith('--env'));
  const env = envArg ? envArg.split('=')[1] : null;
  
  console.log(`Seeding database ${isLocal ? 'locally' : env ? `on ${env}` : 'on production'}...`);
  
  // Read the seed file
  const seedPath = join(__dirname, '../database/seed.sql');
  const seedSql = readFileSync(seedPath, 'utf8');
  
  try {
    // Build wrangler command
    const envFlag = env === 'development' || env === 'staging' ? `--env ${env}` : '';
    const cmd = `cd backend && wrangler d1 execute DB ${isLocal ? '--local' : '--remote'} ${envFlag} --file=../database/seed.sql`;
    
    console.log(`Running seed command...`);
    execSync(cmd, { stdio: 'inherit' });
    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seed().catch(console.error);