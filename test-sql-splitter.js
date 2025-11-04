// Test script for SQL splitter with dollar-quoted strings
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the splitSqlStatements function from migrate.ts
// Since we're in a JS environment, we'll recreate the function here for testing
const splitSqlStatements = (sql) => {
  const statements = [];
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
      // Look ahead to find the complete dollar delimiter
      let j = i + 1;
      while (j < sql.length && sql[j] !== '$') {
        j++;
      }
      
      if (j < sql.length && sql[j] === '$') {
        // Found a complete dollar delimiter (e.g., $$ or $tag$)
        const dollarTag = sql.substring(i, j + 1);
        
        if (!inDollarString) {
          // Starting a dollar-quoted string
          inDollarString = true;
          dollarStringTag = dollarTag;
          currentStatement += dollarTag;
          i = j; // Skip to the end of the delimiter
          continue;
        } else if (dollarTag === dollarStringTag) {
          // Ending the current dollar-quoted string
          inDollarString = false;
          dollarStringTag = '';
          currentStatement += dollarTag;
          i = j; // Skip to the end of the delimiter
          continue;
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

// Test cases
console.log('Testing SQL splitter with dollar-quoted strings...\n');

// Test case 1: Simple dollar-quoted string
const test1 = `CREATE FUNCTION test() RETURNS INTEGER AS $$
BEGIN
    RETURN 1;
END;
$$ LANGUAGE plpgsql;`;

console.log('Test 1: Simple dollar-quoted string');
console.log('Input:', test1);
const result1 = splitSqlStatements(test1);
console.log('Statements:', result1);
console.log('Count:', result1.length);
console.log('---\n');

// Test case 2: The problematic function from the migration
const test2 = `CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';`;

console.log('Test 2: Function from migration file');
console.log('Input:', test2);
const result2 = splitSqlStatements(test2);
console.log('Statements:', result2);
console.log('Count:', result2.length);
console.log('---\n');

// Test case 3: Multiple statements with dollar-quoted strings
const test3 = `CREATE TABLE test (id INTEGER);
INSERT INTO test VALUES (1);
CREATE OR REPLACE FUNCTION test_func() RETURNS INTEGER AS $function$
DECLARE
    result INTEGER;
BEGIN
    SELECT COUNT(*) INTO result FROM test;
    RETURN result;
END;
$function$ LANGUAGE plpgsql;
SELECT test_func();`;

console.log('Test 3: Multiple statements with tagged dollar-quoted strings');
console.log('Input:', test3);
const result3 = splitSqlStatements(test3);
console.log('Statements:', result3);
console.log('Count:', result3.length);
console.log('---\n');

// Test case 4: Read and test the actual migration file
try {
  const migrationPath = path.join(__dirname, 'database', 'migrations', '001_initial_schema.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('Test 4: Actual migration file');
  console.log('Testing 001_initial_schema.sql...');
  const result4 = splitSqlStatements(migrationSQL);
  console.log('Total statements:', result4.length);
  
  // Find the function definition
  const functionStatement = result4.find(stmt => stmt.includes('update_updated_at_column'));
  if (functionStatement) {
    console.log('✅ Function statement found and properly parsed:');
    console.log(functionStatement.substring(0, 100) + '...');
  } else {
    console.log('❌ Function statement not found or incorrectly split');
  }
  
  console.log('---\n');
} catch (error) {
  console.log('Could not read migration file:', error.message);
}

console.log('Testing completed!');