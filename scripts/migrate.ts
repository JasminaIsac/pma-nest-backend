#!/usr/bin/env node

/**
 * Database Migration Script
 * Ruleaza: prisma migrate deploy
 * Genereaza migrari noi: prisma migrate dev --name <name>
 */

import { spawn } from 'child_process';
import * as fs from 'fs';

const ENV_FILE = '.env';
const MIGRATIONS_DIR = 'prisma/migrations';

// Verifică dacă .env există
if (!fs.existsSync(ENV_FILE)) {
  console.error('❌ Error: .env file not found');
  console.error('Please create a .env file with DATABASE_URL');
  process.exit(1);
}

// Verifică dacă DATABASE_URL este definit
const envContent = fs.readFileSync(ENV_FILE, 'utf-8');
if (!envContent.includes('DATABASE_URL')) {
  console.error('❌ Error: DATABASE_URL not found in .env');
  process.exit(1);
}

console.log('📦 Starting database migration...\n');

// Funcție pentru a rula o comandă
function runCommand(command: string, args: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  try {
    console.log('🔄 Step 1: Generating Prisma Client...');
    await runCommand('npx', ['prisma', 'generate']);
    console.log('✅ Prisma Client generated successfully\n');

    // Verifică dacă există migrări
    if (fs.existsSync(MIGRATIONS_DIR)) {
      console.log('🔄 Step 2: Deploying migrations...');
      await runCommand('npx', ['prisma', 'migrate', 'deploy']);
      console.log('✅ Migrations deployed successfully\n');
    } else {
      console.log('⚠️  No migrations found. Running initial migration...');
      await runCommand('npx', ['prisma', 'migrate', 'dev', '--name', 'init']);
      console.log('✅ Initial migration created\n');
    }

    console.log('🔄 Step 3: Syncing database schema...');
    await runCommand('npx', ['prisma', 'db', 'push', '--skip-generate']);
    console.log('✅ Database schema synced\n');

    console.log('✨ Database migration completed successfully!');
    console.log('📊 Run "npx prisma studio" to browse your database\n');
  } catch (error) {
    console.error('❌ Migration failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

void main();
