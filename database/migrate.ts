import fs from 'fs';
import path from 'path';
import pool from './connection';
import { USE_MOCK_DATA } from './config';

// Get the current directory for ES modules
const __dirname = path.dirname(new URL(import.meta.url).pathname).substring(1);

// Helper function to find the migrations directory
const findMigrationsDir = () => {
  // List of possible paths to check in order of preference
  const possiblePaths = [
    // Standard path based on __dirname
    path.join(__dirname, 'migrations'),
    // Container-specific paths
    path.join('/app', 'database', 'migrations'),
    path.join('/app', 'app', 'database', 'migrations'),
    // Relative to current working directory
    path.join(process.cwd(), 'database', 'migrations'),
    path.join(process.cwd(), 'app', 'database', 'migrations'),
    // Fallback paths
    path.join(process.cwd(), 'dist', 'database', 'migrations'),
    'database/migrations',
    'app/database/migrations'
  ];

  for (const dirPath of possiblePaths) {
    if (fs.existsSync(dirPath)) {
      console.log(`Found migrations directory at: ${dirPath}`);
      return dirPath;
    }
  }

  // If none of the paths exist, return the most likely one and let the error occur
  console.log('Migrations directory not found in any of the expected paths');
  console.log('Checked paths:', possiblePaths);
  return possiblePaths[0]; // Return the first path as fallback
};

// Function to split SQL file into individual statements
const splitSqlStatements = (sql: string): string[] => {
  const statements: string[] = [];
  let currentStatement = '';
  let inString = false;
  let stringChar = '';
  let inDollarString = false;
  let dollarStringTag = '';
  let inComment = false;
  let inLineComment = false;
  let parenLevel = 0;
  
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1];
    const prevChar = sql[i - 1];
    
    // Handle dollar-quoted strings (PostgreSQL syntax)
    if (!inComment && !inLineComment && !inString && char === '$') {
      if (!inDollarString) {
        // Look ahead to find the complete dollar delimiter for starting a string
        let j = i + 1;
        while (j < sql.length && sql[j] !== '$') {
          j++;
        }
        
        if (j < sql.length && sql[j] === '$') {
          // Found a complete dollar delimiter (e.g., $$ or $tag$)
          const dollarTag = sql.substring(i, j + 1);
          
          // Check if this could be a parameter reference (like $1, $2, etc.)
          // Parameter references are digits only, while dollar-quoted strings can contain letters
          const tagContent = dollarTag.substring(1, dollarTag.length - 1);
          const isParameterReference = /^\d+$/.test(tagContent);
          
          // Additional check: dollar-quoted string tags should not contain special characters
          // Valid tags are empty ($$) or contain only letters, numbers, and underscores
          const isValidDollarTag = tagContent === '' || /^[a-zA-Z0-9_]+$/.test(tagContent);
          
          if (!isParameterReference && isValidDollarTag) {
            // Starting a dollar-quoted string
            inDollarString = true;
            dollarStringTag = dollarTag;
            currentStatement += dollarTag;
            i = j; // Skip to the end of the delimiter
            continue;
          }
        }
      } else {
        // We're inside a dollar-quoted string, look for the matching closing tag
        const expectedTag = dollarStringTag;
        const tagLength = expectedTag.length;
        
        // Check if the current position matches the expected closing tag
        if (i + tagLength <= sql.length) {
          const potentialTag = sql.substring(i, i + tagLength);
          if (potentialTag === expectedTag) {
            // Found the matching closing tag
            inDollarString = false;
            dollarStringTag = '';
            currentStatement += potentialTag;
            i = i + tagLength - 1; // Skip to the end of the delimiter
            continue;
          }
        }
      }
    }
    
    // Handle regular string literals
    if (!inComment && !inLineComment && !inDollarString && (char === "'" || char === '"')) {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar && prevChar !== '\\') {
        inString = false;
        stringChar = '';
      }
    }
    
    // Handle comments (not inside any type of string)
    if (!inString && !inDollarString) {
      if (char === '-' && nextChar === '-' && !inComment) {
        inLineComment = true;
      }
      if (char === '/' && nextChar === '*' && !inLineComment) {
        inComment = true;
      }
      if (char === '*' && nextChar === '/' && inComment) {
        inComment = false;
        currentStatement += char + nextChar;
        i++; // Skip next character
        continue;
      }
      if (char === '\n' && inLineComment) {
        inLineComment = false;
      }
    }
    
    // Skip content in comments
    if (inComment || inLineComment) {
      currentStatement += char;
      continue;
    }
    
    // Track parenthesis level for CREATE TABLE statements (not inside any string)
    if (!inString && !inDollarString && !inComment && !inLineComment) {
      if (char === '(') {
        parenLevel++;
      } else if (char === ')') {
        parenLevel--;
      }
    }
    
    // Add character to current statement
    currentStatement += char;
    
    // Check for statement terminator (semicolon) outside of all string types and parentheses
    if (char === ';' && !inString && !inDollarString && !inComment && !inLineComment && parenLevel === 0) {
      // Trim whitespace and add to statements if not empty
      const trimmedStatement = currentStatement.trim();
      if (trimmedStatement) {
        statements.push(trimmedStatement);
      }
      currentStatement = '';
    }
  }
  
  // Add any remaining content
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }
  
  return statements;
};

// Run migration files in order
export const runMigrations = async () => {
  try {
    if (USE_MOCK_DATA) {
      console.log('⚠️ Mock data mode - skipping migrations');
      return;
    }

    const client = await pool.connect();
    
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get migration files using the helper function
    const finalMigrationsDir = findMigrationsDir();
    const migrationFiles = fs.readdirSync(finalMigrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    // Get executed migrations
    const executedResult = await client.query('SELECT filename FROM migrations ORDER BY filename');
    const executedMigrations = executedResult.rows.map(row => row.filename);
    
    // Run pending migrations
    for (const file of migrationFiles) {
      if (!executedMigrations.includes(file)) {
        console.log(`Running migration: ${file}`);
        const filePath = path.join(finalMigrationsDir, file);
        const migrationSQL = fs.readFileSync(filePath, 'utf8');
        
        await client.query('BEGIN');
        try {
          // Split SQL into individual statements and execute them sequentially
          const statements = splitSqlStatements(migrationSQL);
          
          for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            if (statement) {
              console.log(`Executing statement ${i + 1}/${statements.length}`);
              await client.query(statement);
            }
          }
          
          await client.query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
          await client.query('COMMIT');
          console.log(`Migration ${file} completed successfully`);
        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`Error running migration ${file}:`, error);
          throw error;
        }
      }
    }
    
    client.release();
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
};

// Rollback the last migration
export const rollbackLastMigration = async () => {
  try {
    if (USE_MOCK_DATA) {
      console.log('⚠️ Mock data mode - skipping rollback');
      return;
    }

    const client = await pool.connect();
    
    // Get the last executed migration
    const result = await client.query(
      'SELECT filename FROM migrations ORDER BY executed_at DESC LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      console.log('No migrations to rollback');
      client.release();
      return;
    }
    
    const lastMigration = result.rows[0].filename;
    console.log(`Rolling back migration: ${lastMigration}`);
    
    // Check if rollback file exists
    const rollbackFile = lastMigration.replace('.sql', '_rollback.sql');
    const migrationsDir = findMigrationsDir();
    const rollbackPath = path.join(migrationsDir, rollbackFile);
    
    if (!fs.existsSync(rollbackPath)) {
      console.log(`No rollback file found for ${lastMigration}`);
      client.release();
      return;
    }
    
    const rollbackSQL = fs.readFileSync(rollbackPath, 'utf8');
    
    await client.query('BEGIN');
    try {
      await client.query(rollbackSQL);
      await client.query('DELETE FROM migrations WHERE filename = $1', [lastMigration]);
      await client.query('COMMIT');
      console.log(`Rollback of ${lastMigration} completed successfully`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Error rolling back ${lastMigration}:`, error);
      throw error;
    }
    
    client.release();
  } catch (error) {
    console.error('Rollback error:', error);
    throw error;
  }
};

// Get migration status
export const getMigrationStatus = async () => {
  try {
    if (USE_MOCK_DATA) {
      console.log('\nMigration Status:');
      console.log('==================');
      console.log('001_initial_schema.sql: ⏳ Pending (mock mode)');
      console.log('002_initial_data.sql: ⏳ Pending (mock mode)');
      console.log('\nTotal: 2 migrations');
      console.log('Executed: 0');
      console.log('Pending: 2');
      return {
        migrationFiles: ['001_initial_schema.sql', '002_initial_data.sql'],
        executedMigrations: {},
        pendingCount: 2,
        executedCount: 0
      };
    }

    const client = await pool.connect();
    
    // Get all migration files using the helper function
    const migrationsDir = findMigrationsDir();
    
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql') && !file.endsWith('_rollback.sql'))
      .sort();
    
    // Get executed migrations
    const executedResult = await client.query('SELECT filename, executed_at FROM migrations ORDER BY filename');
    const executedMigrations = executedResult.rows.reduce((acc, row) => {
      acc[row.filename] = row.executed_at;
      return acc;
    }, {});
    
    console.log('\nMigration Status:');
    console.log('==================');
    
    for (const file of migrationFiles) {
      const status = executedMigrations[file] ? `✅ Executed at ${executedMigrations[file]}` : '⏳ Pending';
      console.log(`${file}: ${status}`);
    }
    
    const pendingCount = migrationFiles.filter(file => !executedMigrations[file]).length;
    const executedCount = migrationFiles.length - pendingCount;
    
    console.log(`\nTotal: ${migrationFiles.length} migrations`);
    console.log(`Executed: ${executedCount}`);
    console.log(`Pending: ${pendingCount}`);
    
    client.release();
    return { migrationFiles, executedMigrations, pendingCount, executedCount };
  } catch (error) {
    console.error('Error getting migration status:', error);
    throw error;
  }
};

// Reset database (drop all tables and re-run all migrations)
export const resetDatabase = async () => {
  try {
    if (USE_MOCK_DATA) {
      console.log('⚠️ Mock data mode - skipping database reset');
      return;
    }

    console.log('⚠️  WARNING: This will drop all tables and data!');
    console.log('Type "yes" to confirm:');
    
    // This would be better handled with a command line argument
    // For now, we'll proceed with the reset
    
    const client = await pool.connect();
    
    // Drop all tables in correct order (respecting foreign keys)
    await client.query('DROP TABLE IF EXISTS migrations CASCADE');
    await client.query('DROP TABLE IF EXISTS reservations CASCADE');
    await client.query('DROP TABLE IF EXISTS opening_hours CASCADE');
    await client.query('DROP TABLE IF EXISTS restaurant_tables CASCADE');
    await client.query('DROP TABLE IF EXISTS settings CASCADE');
    
    console.log('All tables dropped successfully');
    
    client.release();
    
    // Re-run all migrations
    await runMigrations();
    
    console.log('Database reset completed');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
};

export default runMigrations;