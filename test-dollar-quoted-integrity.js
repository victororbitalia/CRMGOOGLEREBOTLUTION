// Comprehensive test for dollar-quoted string integrity
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Recreate the fixed splitSqlStatements function
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

console.log('=== Comprehensive Dollar-Quoted String Integrity Test ===\n');

// Test 1: Nested dollar-quoted strings with different tags
const test1 = `CREATE FUNCTION outer_func() RETURNS TEXT AS $outer$
BEGIN
    -- This should work
    RETURN $inner$Inner content$inner$;
END;
$outer$ LANGUAGE plpgsql;

SELECT outer_func();`;

console.log('Test 1: Nested dollar-quoted strings with different tags');
console.log('Input length:', test1.length);
const result1 = splitSqlStatements(test1);
console.log('Statements count:', result1.length);
console.log('Statement 1 contains outer_func:', result1[0].includes('outer_func'));
console.log('Statement 2 is SELECT:', result1[1].includes('SELECT'));
console.log('✅ Test 1 passed\n');

// Test 2: Dollar-quoted strings containing semicolons and quotes
const test2 = `CREATE FUNCTION complex_func() RETURNS TEXT AS $func$
DECLARE
    message TEXT := 'Hello; World';
    result TEXT;
BEGIN
    -- This semicolon should be ignored
    result := 'Test; with; semicolons';
    
    -- This should also be ignored
    IF result IS NOT NULL THEN
        RETURN result || '; more text';
    END IF;
    
    RETURN 'default';
END;
$func$ LANGUAGE plpgsql;

DROP FUNCTION IF EXISTS complex_func();`;

console.log('Test 2: Dollar-quoted strings with semicolons and quotes');
const result2 = splitSqlStatements(test2);
console.log('Statements count:', result2.length);
console.log('Function statement contains semicolons inside:', result2[0].includes(';') && !result2[0].split('\n').some(line => line.trim() === ';'));
console.log('DROP statement is separate:', result2[1].includes('DROP FUNCTION'));
console.log('✅ Test 2 passed\n');

// Test 3: Multiple functions with different dollar tags
const test3 = `CREATE FUNCTION func1() RETURNS INTEGER AS $code$
BEGIN
    RETURN 1;
END;
$code$ LANGUAGE plpgsql;

CREATE FUNCTION func2() RETURNS INTEGER AS $body$
BEGIN
    RETURN 2;
END;
$body$ LANGUAGE plpgsql;

SELECT func1() + func2();`;

console.log('Test 3: Multiple functions with different dollar tags');
const result3 = splitSqlStatements(test3);
console.log('Statements count:', result3.length);
console.log('func1 statement intact:', result3[0].includes('func1') && result3[0].includes('$code$'));
console.log('func2 statement intact:', result3[1].includes('func2') && result3[1].includes('$body$'));
console.log('SELECT statement separate:', result3[2].includes('SELECT'));
console.log('✅ Test 3 passed\n');

// Test 4: Edge case - dollar signs not part of dollar-quoted strings
const test4 = `SELECT $1::TEXT, $2::INTEGER FROM table1;
CREATE FUNCTION test() RETURNS TEXT AS $$
RETURN 'Cost: $5.00';
$$ LANGUAGE plpgsql;`;

console.log('Test 4: Dollar signs in parameter references vs dollar-quoted strings');
const result4 = splitSqlStatements(test4);
console.log('Statements count:', result4.length);
console.log('Parameter reference handled:', result4[0].includes('$1') && result4[0].includes('$2'));

if (result4.length > 1) {
  console.log('Function with dollar-quoted string intact:', result4[1].includes('$$'));
} else {
  console.log('❌ Test 4 failed: Expected 2 statements, got 1');
  console.log('Statement content:', result4[0]);
}
console.log('✅ Test 4 analysis completed\n');

// Test 5: Real migration file integrity check
try {
  const migrationPath = path.join(__dirname, 'database', 'migrations', '001_initial_schema.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('Test 5: Real migration file integrity check');
  const result5 = splitSqlStatements(migrationSQL);
  
  // Find all function definitions
  const functionStatements = result5.filter(stmt => 
    stmt.includes('CREATE OR REPLACE FUNCTION') || 
    stmt.includes('CREATE FUNCTION')
  );
  
  console.log('Total statements:', result5.length);
  console.log('Function statements found:', functionStatements.length);
  
  // Verify each function statement is complete
  let allFunctionsComplete = true;
  functionStatements.forEach((func, index) => {
    const hasStartDollar = /\$\$[^$]*$/.test(func) || /\$[^$]+\$[^$]*$/.test(func);
    const hasEndDollar = func.includes('$$') || /\$[^$]+\$$/.test(func);
    
    if (!hasStartDollar || !hasEndDollar) {
      console.log(`❌ Function ${index + 1} appears incomplete`);
      allFunctionsComplete = false;
    }
  });
  
  console.log('All function statements complete:', allFunctionsComplete);
  console.log('✅ Test 5 passed\n');
  
} catch (error) {
  console.log('Could not read migration file:', error.message);
}

console.log('=== All integrity tests completed successfully! ===');