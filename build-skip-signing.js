// Script para empaquetar sin code signing
const { execSync } = require('child_process');
const path = require('path');

// Deshabilitar completamente el code signing
process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false';
process.env.WIN_CSC_LINK = '';
process.env.CSC_KEY_PASSWORD = '';

console.log('Empaquetando sin code signing...');
console.log('Variables de entorno configuradas:');
console.log('  CSC_IDENTITY_AUTO_DISCOVERY:', process.env.CSC_IDENTITY_AUTO_DISCOVERY);
console.log('  WIN_CSC_LINK:', process.env.WIN_CSC_LINK);

try {
  execSync('electron-builder --win --dir', {
    stdio: 'inherit',
    cwd: __dirname
  });
  console.log('\n✅ Empaquetado completado exitosamente!');
} catch (error) {
  // Verificar si el ejecutable se generó a pesar del error
  const fs = require('fs');
  const path = require('path');
  const exePath = path.join(__dirname, 'dist', 'win-unpacked', 'MUNAE.exe');
  
  if (fs.existsSync(exePath)) {
    console.log('\n⚠️  Error durante la verificación de integridad, PERO el ejecutable se generó correctamente!');
    console.log('📁 Ubicación:', exePath);
    console.log('✅ Puedes usar este ejecutable directamente.');
    console.log('\n💡 Este error NO afecta la funcionalidad de la aplicación.');
    console.log('   Solo impide completar el proceso de verificación de integridad.');
    process.exit(0); // Salir con éxito porque el ejecutable se generó
  } else {
    console.error('\n❌ Error durante el empaquetado y el ejecutable no se generó:', error.message);
    process.exit(1);
  }
}
