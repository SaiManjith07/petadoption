/**
 * Frontend Structure Validation Script
 * Run with: node validate_structure.js
 */
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, 'src');

const REQUIRED_STRUCTURE = {
  'api': ['apiClient.ts', 'authApi.ts', 'petsApi.ts', 'chatApi.ts', 'adminApi.ts', 'index.ts'],
  'models': ['index.ts'],
  'lib': ['auth.tsx'],
  'components': [],
  'pages': ['auth', 'pets', 'admin'],
};

function checkDirectory(dirPath, requiredFiles = []) {
  const results = {
    exists: fs.existsSync(dirPath),
    files: [],
    missing: [],
  };

  if (!results.exists) {
    return results;
  }

  const items = fs.readdirSync(dirPath);
  
  if (requiredFiles.length > 0) {
    requiredFiles.forEach(file => {
      const filePath = path.join(dirPath, file);
      if (fs.existsSync(filePath)) {
        results.files.push(file);
      } else {
        results.missing.push(file);
      }
    });
  }

  return results;
}

function main() {
  console.log('='.repeat(60));
  console.log('Frontend Structure Validation');
  console.log('='.repeat(60));
  console.log();

  let allValid = true;

  // Check API layer
  console.log('Checking src/api/');
  const apiCheck = checkDirectory(path.join(BASE_DIR, 'api'), REQUIRED_STRUCTURE.api);
  if (apiCheck.exists && apiCheck.missing.length === 0) {
    console.log('  ✅ All API files present');
    apiCheck.files.forEach(file => console.log(`     ✓ ${file}`));
  } else {
    allValid = false;
    if (!apiCheck.exists) {
      console.log('  ❌ api/ directory does not exist');
    } else {
      console.log('  ❌ Missing files:');
      apiCheck.missing.forEach(file => console.log(`     ✗ ${file}`));
    }
  }
  console.log();

  // Check models
  console.log('Checking src/models/');
  const modelsCheck = checkDirectory(path.join(BASE_DIR, 'models'), REQUIRED_STRUCTURE.models);
  if (modelsCheck.exists && modelsCheck.missing.length === 0) {
    console.log('  ✅ Models present');
  } else {
    allValid = false;
    console.log('  ❌ Models missing');
  }
  console.log();

  // Check lib
  console.log('Checking src/lib/');
  const libCheck = checkDirectory(path.join(BASE_DIR, 'lib'), REQUIRED_STRUCTURE.lib);
  if (libCheck.exists && libCheck.missing.length === 0) {
    console.log('  ✅ Core libraries present');
  } else {
    allValid = false;
    console.log('  ❌ Core libraries missing');
  }
  console.log();

  // Check pages structure
  console.log('Checking src/pages/');
  const pagesPath = path.join(BASE_DIR, 'pages');
  if (fs.existsSync(pagesPath)) {
    REQUIRED_STRUCTURE.pages.forEach(pageDir => {
      const pagePath = path.join(pagesPath, pageDir);
      if (fs.existsSync(pagePath)) {
        console.log(`  ✅ pages/${pageDir}/ exists`);
      } else {
        allValid = false;
        console.log(`  ❌ pages/${pageDir}/ missing`);
      }
    });
  } else {
    allValid = false;
    console.log('  ❌ pages/ directory does not exist');
  }
  console.log();

  // Check package.json
  console.log('Checking project files:');
  const packageJson = path.join(__dirname, 'package.json');
  if (fs.existsSync(packageJson)) {
    console.log('  ✅ package.json');
    const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
    if (pkg.dependencies && pkg.dependencies.axios) {
      console.log('  ✅ axios installed');
    } else {
      console.log('  ⚠️  axios not in dependencies');
    }
  } else {
    allValid = false;
    console.log('  ❌ package.json missing');
  }

  console.log();
  console.log('='.repeat(60));
  if (allValid) {
    console.log('✅ Structure is VALID - All files in place!');
  } else {
    console.log('❌ Structure has ISSUES - See above for details');
  }
  console.log('='.repeat(60));
}

main();

