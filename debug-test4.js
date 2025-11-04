// Debug test for Test 4 issue
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Recreate the fixed splitSqlStatements function with debug logging
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
  
  console.log('=== Debug Analysis ===');
  console.log('Input SQL:');
  console.log(sql);
  console.log('\nProcessing character by character:\n');
  
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1];
    const prevChar = sql[i - 1];
    
    // Handle dollar-quoted strings (PostgreSQL syntax)
    if (!inComment && !inLineComment && !inString && char === '$') {
      if (!inDollarString) {
        console.log(`Found $ at position ${i}, looking ahead...`);
        
        // Look ahead to find the complete dollar delimiter for starting a string
        let j = i + 1;
        while (j < sql.length && sql[j] !== '$') {
          j++;
        }
        
        if (j < sql.length && sql[j] === '$') {
          // Found a complete dollar delimiter (e.g., $$ or $tag$)
          const dollarTag = sql.substring(i, j + 1);
          console.log(`Found dollar tag: "${dollarTag}" at positions ${i}-${j}`);
          
          // Check if this could be a parameter reference (like $1, $2, etc.)
          // Parameter references are digits only, while dollar-quoted strings can contain letters
          const tagContent = dollarTag.substring(1, dollarTag.length - 1);
          const isParameterReference = /^\d+$/.test(tagContent);
          console.log(`Tag content: "${tagContent}", isParameterReference: ${isParameterReference}`);
          
          // Additional check: dollar-quoted string tags should not contain special characters
          // Valid tags are empty ($$) or contain only letters, numbers, and underscores
          const isValidDollarTag = tagContent === '' || /^[a-zA-Z0-9_]+$/.test(tagContent);
          console.log(`isValidDollarTag: ${isValidDollarTag}`);
          
          if (!isParameterReference && isValidDollarTag) {
            console.log('Starting dollar-quoted string');
            // Starting a dollar-quoted string
            inDollarString = true;
            dollarStringTag = dollarTag;
            currentStatement += dollarTag;
            i = j; // Skip to the end of the delimiter
            continue;
          } else {
            console.log('Not treating as dollar-quoted string');
          }
        } else {
          console.log('No closing $ found, not a dollar-quoted string');
        }
      } else {
        console.log(`Inside dollar-quoted string, looking for closing tag "${dollarStringTag}" at position ${i}`);
        // We're inside a dollar-quoted string, look for the matching closing tag
        const expectedTag = dollarStringTag;
        const tagLength = expectedTag.length;
        
        // Check if the current position matches the expected closing tag
        if (i + tagLength <= sql.length) {
          const potentialTag = sql.substring(i, i + tagLength);
          if (potentialTag === expectedTag) {
            console.log(`Found matching closing tag "${potentialTag}"`);
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
      console.log(`Found statement terminator at position ${i}`);
      console.log(`Current statement: "${currentStatement.trim()}"`);
      console.log(`States: inString=${inString}, inDollarString=${inDollarString}, parenLevel=${parenLevel}`);
      
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
    console.log(`Adding remaining content: "${currentStatement.trim()}"`);
    statements.push(currentStatement.trim());
  }
  
  console.log(`\nFinal result: ${statements.length} statements`);
  statements.forEach((stmt, index) => {
    console.log(`Statement ${index + 1}: ${stmt.substring(0, 50)}...`);
  });
  
  return statements;
};

// Test 4: Dollar signs in parameter references vs dollar-quoted strings
const test4 = `SELECT $1::TEXT, $2::INTEGER FROM table1;
CREATE FUNCTION test() RETURNS TEXT AS $$
RETURN 'Cost: $5.00';
$$ LANGUAGE plpgsql;`;

console.log('=== Debug Test 4 ===\n');
const result4 = splitSqlStatements(test4);
console.log('\n=== Final Analysis ===');
console.log('Statements count:', result4.length);
console.log('Expected: 2 statements');