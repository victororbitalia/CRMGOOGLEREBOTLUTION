#!/usr/bin/env node

import { runMigrations, rollbackLastMigration, getMigrationStatus, resetDatabase } from './migrate';
import { testConnection } from './connection';
import { USE_MOCK_DATA } from './config';

// Parse command line arguments
const args = globalThis.process.argv.slice(2);
const command = args[0];

async function main() {
  try {
    // Skip database connection test if using mock data
    if (!USE_MOCK_DATA) {
      // Test database connection first
      console.log('Testing database connection...');
      const isConnected = await testConnection();
      
      if (!isConnected) {
        console.error('Failed to connect to database. Please check your connection settings.');
        globalThis.process.exit(1);
      }
    } else {
      console.log('⚠️ Using mock data mode - skipping database connection');
    }
    
    switch (command) {
      case 'migrate':
      case 'up':
        console.log('Running migrations...');
        await runMigrations();
        break;
        
      case 'rollback':
      case 'down':
        console.log('Rolling back last migration...');
        await rollbackLastMigration();
        break;
        
      case 'status':
        console.log('Checking migration status...');
        await getMigrationStatus();
        break;
        
      case 'reset':
        console.log('Resetting database...');
        await resetDatabase();
        break;
        
      case 'fresh':
        console.log('Creating fresh database...');
        await resetDatabase();
        break;
        
      default:
        console.log(`
Database Migration CLI

Usage: npm run db <command>

Commands:
  migrate, up    Run all pending migrations
  rollback, down Rollback the last migration
  status         Show migration status
  reset, fresh   Drop all tables and re-run all migrations

Examples:
  npm run db migrate
  npm run db rollback
  npm run db status
  npm run db reset
        `);
        break;
    }
  } catch (error) {
    console.error('Error:', error);
    globalThis.process.exit(1);
  }
}

main();