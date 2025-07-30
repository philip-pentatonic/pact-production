#!/usr/bin/env node

/**
 * Database Migration Runner
 * 
 * Usage:
 *   node scripts/migrate.js --local           # Run on local D1
 *   node scripts/migrate.js                   # Run on production
 *   node scripts/migrate.js --env staging     # Run on staging
 */

const { execSync } = require('child_process');
const { readdir } = require('fs/promises');
const { join } = require('path');

async function runMigrations() {
  const args = process.argv.slice(2);
  const isLocal = args.includes('--local');
  const envArg = args.find(arg => arg.startsWith('--env'));
  const env = envArg ? envArg.split('=')[1] : null;
  
  console.log(`Running migrations ${isLocal ? 'locally' : env ? `on ${env}` : 'on production'}...`);
  
  // Get all migration files
  const migrationsDir = join(__dirname, '../database/migrations');
  const files = await readdir(migrationsDir);
  const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
  
  console.log(`Found ${sqlFiles.length} migration files`);
  
  for (const file of sqlFiles) {
    console.log(`\nRunning migration: ${file}`);
    const migrationPath = join(migrationsDir, file);
    
    try {
      // Build wrangler command
      const envFlag = env === 'development' || env === 'staging' ? `--env ${env}` : '';
      const cmd = `cd backend && wrangler d1 execute DB ${isLocal ? '--local' : ''} ${envFlag} --file=../database/migrations/${file}`;
      
      console.log(`Command: ${cmd}`);
      execSync(cmd, { stdio: 'inherit' });
      console.log(`✓ ${file} completed`);
    } catch (error) {
      console.error(`✗ ${file} failed:`, error.message);
      process.exit(1);
    }
  }
  
  console.log('\n✅ All migrations completed successfully');
}

runMigrations().catch(console.error);