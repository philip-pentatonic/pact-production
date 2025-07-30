#!/usr/bin/env node
/**
 * Database Migration Script
 * Runs database migrations for PACT production
 */

import { execSync } from 'child_process';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '../../database/migrations');

async function runMigrations() {
  const env = process.env.ENVIRONMENT || 'development';
  const isLocal = process.argv.includes('--local');
  
  console.log(`Running migrations for ${env} environment${isLocal ? ' (local)' : ''}...`);
  
  try {
    // Get all migration files
    const migrations = readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    if (migrations.length === 0) {
      console.log('No migrations found.');
      return;
    }
    
    console.log(`Found ${migrations.length} migration(s)`);
    
    // Run each migration
    for (const migration of migrations) {
      console.log(`Running migration: ${migration}`);
      const migrationPath = join(MIGRATIONS_DIR, migration);
      
      const envFlag = env === 'development' || env === 'staging' ? `--env ${env}` : '';
      const cmd = `wrangler d1 execute DB ${isLocal ? '--local' : ''} ${envFlag} --file=${migrationPath}`;
      
      try {
        execSync(cmd, { stdio: 'inherit' });
        console.log(`✅ ${migration} completed`);
      } catch (error) {
        console.error(`❌ ${migration} failed:`, error.message);
        throw error;
      }
    }
    
    console.log('All migrations completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations
runMigrations();