#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import http from 'http';

// Colores para la salida
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Función para imprimir mensajes coloreados
const log = (message: string, color: keyof typeof colors = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Función para verificar si un servicio está disponible
const checkService = (url: string, serviceName: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
  });
};

// Función para ejecutar comandos y capturar salida
const runCommand = (command: string, description: string): { success: boolean; output: string } => {
  try {
    log(`\n🔍 ${description}...`, 'cyan');
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return { success: true, output };
  } catch (error: any) {
    return { 
      success: false, 
      output: error.stdout || error.stderr || error.message 
    };
  }
};

// Función principal de validación
async function main() {
  log('\n🚀 Iniciando validación del despliegue del CRM GOOGLE\n', 'bright');
  
  const results = {
    envValidation: false,
    dbMigrations: false,
    appRunning: false,
    appFunctional: false,
    overall: false
  };
  
  // 1. Validar variables de entorno
  log('\n📋 1. Validando variables de entorno...', 'yellow');
  const envResult = runCommand('npm run validate-env', 'Validación de variables de entorno');
  
  if (envResult.success && envResult.output.includes('✅ Todas las variables de entorno son válidas')) {
    log('✅ Variables de entorno validadas correctamente', 'green');
    results.envValidation = true;
  } else {
    log('❌ Error en la validación de variables de entorno', 'red');
    log(envResult.output, 'red');
  }
  
  // 2. Probar migraciones de base de datos
  log('\n🗄️ 2. Probando migraciones de base de datos...', 'yellow');
  const migrateStatusResult = runCommand('npm run db status', 'Estado de migraciones');
  
  if (migrateStatusResult.success) {
    log('✅ Sistema de migraciones funcionando correctamente', 'green');
    results.dbMigrations = true;
    
    // Mostrar estado de migraciones
    if (migrateStatusResult.output.includes('Pending (mock mode)')) {
      log('ℹ️  Modo mock detectado - migraciones simuladas', 'blue');
    }
  } else {
    log('❌ Error en el sistema de migraciones', 'red');
    log(migrateStatusResult.output, 'red');
  }
  
  // 3. Verificar que la aplicación esté en ejecución
  log('\n🌐 3. Verificando que la aplicación esté en ejecución...', 'yellow');
  
  const appRunning = await checkService('http://localhost:3000', 'Aplicación CRM');
  
  if (appRunning) {
    log('✅ Aplicación respondiendo en http://localhost:3000', 'green');
    results.appRunning = true;
  } else {
    log('❌ La aplicación no está respondiendo en http://localhost:3000', 'red');
  }
  
  // 4. Validar funcionalidad básica de la aplicación
  if (results.appRunning) {
    log('\n🧪 4. Validando funcionalidad básica de la aplicación...', 'yellow');
    
    // Verificar páginas principales
    const pages = [
      { path: '/', name: 'Página principal' },
      { path: '/api/health', name: 'Endpoint de salud' }
    ];
    
    let functionalChecks = 0;
    for (const page of pages) {
      const isWorking = await checkService(`http://localhost:3000${page.path}`, page.name);
      if (isWorking) {
        log(`✅ ${page.name} funcionando correctamente`, 'green');
        functionalChecks++;
      } else {
        log(`❌ ${page.name} no responde`, 'red');
      }
    }
    
    if (functionalChecks === pages.length) {
      log('✅ Funcionalidad básica validada correctamente', 'green');
      results.appFunctional = true;
    } else {
      log(`⚠️  ${functionalChecks}/${pages.length} componentes funcionando`, 'yellow');
    }
  }
  
  // 5. Verificar archivos de configuración importantes
  log('\n📁 5. Verificando archivos de configuración...', 'yellow');
  
  const requiredFiles = [
    'package.json',
    'Dockerfile',
    'docker-compose.yml',
    '.env.local',
    'database/migrations/001_initial_schema.sql',
    'database/migrations/002_initial_data.sql'
  ];
  
  let configChecks = 0;
  for (const file of requiredFiles) {
    if (existsSync(file)) {
      log(`✅ ${file} encontrado`, 'green');
      configChecks++;
    } else {
      log(`❌ ${file} no encontrado`, 'red');
    }
  }
  
  // 6. Generar reporte final
  log('\n📊 6. Generando reporte de validación...', 'yellow');
  
  results.overall = results.envValidation && results.dbMigrations && results.appRunning;
  
  log('\n' + '='.repeat(60), 'cyan');
  log('📋 REPORTE DE VALIDACIÓN DE DESPLIEGUE', 'bright');
  log('='.repeat(60), 'cyan');
  
  log(`\nVariables de Entorno: ${results.envValidation ? '✅' : '❌'}`, results.envValidation ? 'green' : 'red');
  log(`Migraciones de BD: ${results.dbMigrations ? '✅' : '❌'}`, results.dbMigrations ? 'green' : 'red');
  log(`Aplicación en Ejecución: ${results.appRunning ? '✅' : '❌'}`, results.appRunning ? 'green' : 'red');
  log(`Funcionalidad Básica: ${results.appFunctional ? '✅' : '❌'}`, results.appFunctional ? 'green' : 'red');
  log(`Archivos de Configuración: ${configChecks}/${requiredFiles.length} encontrados`, configChecks === requiredFiles.length ? 'green' : 'yellow');
  
  log(`\n🎯 Estado General del Despliegue: ${results.overall ? '✅ EXITOSO' : '❌ CON ERRORES'}`, results.overall ? 'green' : 'red');
  
  // 7. Recomendaciones
  log('\n💡 Recomendaciones:', 'yellow');
  
  if (!results.envValidation) {
    log('• Revisar y corregir las variables de entorno requeridas', 'red');
  }
  
  if (!results.dbMigrations) {
    log('• Verificar la configuración de la base de datos y ejecutar migraciones', 'red');
  }
  
  if (!results.appRunning) {
    log('• Asegurarse de que la aplicación se esté ejecutando en el puerto 3000', 'red');
  }
  
  if (results.overall) {
    log('• El despliegue está listo para producción', 'green');
    log('• Considerar ejecutar pruebas de integración adicionales', 'green');
    log('• Monitorear el rendimiento y los logs en producción', 'green');
  }
  
  log('\n' + '='.repeat(60), 'cyan');
  
  // Salir con código apropiado
  process.exit(results.overall ? 0 : 1);
}

// Ejecutar validación
main().catch(error => {
  log(`\n❌ Error durante la validación: ${error.message}`, 'red');
  process.exit(1);
});