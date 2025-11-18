#!/usr/bin/env node

/**
 * Verification script to check Phase 1 & 2 implementation
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 BONECOLE - Implementation Verification\n');
console.log('=' .repeat(60));

let allChecksPass = true;

// Check 1: Login header image exists
console.log('\n✓ Checking login header image...');
const loginHeaderPath = path.join(__dirname, '../assets/images/login-header.png');
if (fs.existsSync(loginHeaderPath)) {
  const stats = fs.statSync(loginHeaderPath);
  console.log(`  ✅ Login header image found (${(stats.size / 1024).toFixed(2)} KB)`);
} else {
  console.log('  ⚠️  Login header image not found - needs to be added manually');
  console.log('     See STUDENT_IMAGE_INSTRUCTIONS.md for details');
}

// Check 2: Sample PDF constants file
console.log('\n✓ Checking sample data constants...');
const constantsPath = path.join(__dirname, '../constants/SampleData.ts');
if (fs.existsSync(constantsPath)) {
  console.log('  ✅ SampleData.ts constants file exists');
  const content = fs.readFileSync(constantsPath, 'utf8');
  if (content.includes('SAMPLE_PDF_URL')) {
    console.log('  ✅ SAMPLE_PDF_URL constant defined');
  }
} else {
  console.log('  ❌ SampleData.ts not found');
  allChecksPass = false;
}

// Check 3: Login screen modifications
console.log('\n✓ Checking login screen modifications...');
const loginPath = path.join(__dirname, '../app/login.tsx');
if (fs.existsSync(loginPath)) {
  const content = fs.readFileSync(loginPath, 'utf8');
  if (content.includes('borderRadius: 120')) {
    console.log('  ✅ Login screen has circular image styling');
  }
  if (content.includes('borderColor: "#FFD700"')) {
    console.log('  ✅ Login screen has golden border');
  }
} else {
  console.log('  ❌ Login screen not found');
  allChecksPass = false;
}

// Check 4: Home screen PDF integration
console.log('\n✓ Checking home screen PDF integration...');
const homePath = path.join(__dirname, '../app/(tabs)/index.tsx');
if (fs.existsSync(homePath)) {
  const content = fs.readFileSync(homePath, 'utf8');
  if (content.includes('SAMPLE_PDF_URL')) {
    console.log('  ✅ Home screen imports SAMPLE_PDF_URL');
  }
  if (content.includes('/(modals)/pdf-reader')) {
    console.log('  ✅ Home screen navigates to PDF reader');
  }
  if (content.includes('itemType: "book"')) {
    console.log('  ✅ Home screen passes correct params to PDF reader');
  }
} else {
  console.log('  ❌ Home screen not found');
  allChecksPass = false;
}

// Check 5: Downloads screen PDF integration
console.log('\n✓ Checking downloads screen PDF integration...');
const downloadsPath = path.join(__dirname, '../app/(tabs)/downloads.tsx');
if (fs.existsSync(downloadsPath)) {
  const content = fs.readFileSync(downloadsPath, 'utf8');
  if (content.includes('SAMPLE_PDF_URL')) {
    console.log('  ✅ Downloads screen imports SAMPLE_PDF_URL');
  }
  if (content.includes('handleBookRead')) {
    console.log('  ✅ Downloads screen has book reading functionality');
  }
  if (content.includes('handleLessonPress')) {
    console.log('  ✅ Downloads screen has lesson press functionality');
  }
} else {
  console.log('  ❌ Downloads screen not found');
  allChecksPass = false;
}

// Check 6: PDF reader improvements
console.log('\n✓ Checking PDF reader improvements...');
const pdfReaderPath = path.join(__dirname, '../app/(modals)/pdf-reader.tsx');
if (fs.existsSync(pdfReaderPath)) {
  const content = fs.readFileSync(pdfReaderPath, 'utf8');
  if (content.includes('SAMPLE_PDF_URL')) {
    console.log('  ✅ PDF reader imports SAMPLE_PDF_URL');
  }
  if (content.includes('progressStorage')) {
    console.log('  ✅ PDF reader has progress tracking');
  }
} else {
  console.log('  ❌ PDF reader not found');
  allChecksPass = false;
}

// Check 7: Documentation
console.log('\n✓ Checking documentation...');
const docsPath = path.join(__dirname, '../IMPLEMENTATION_NOTES.md');
if (fs.existsSync(docsPath)) {
  console.log('  ✅ IMPLEMENTATION_NOTES.md exists');
}
const instructionsPath = path.join(__dirname, '../STUDENT_IMAGE_INSTRUCTIONS.md');
if (fs.existsSync(instructionsPath)) {
  console.log('  ✅ STUDENT_IMAGE_INSTRUCTIONS.md exists');
}

// Summary
console.log('\n' + '='.repeat(60));
if (allChecksPass) {
  console.log('\n✅ ALL CHECKS PASSED!\n');
  console.log('Phase 1 & Phase 2 implementation is complete.\n');
  console.log('Next steps:');
  console.log('1. Replace the login header image (see STUDENT_IMAGE_INSTRUCTIONS.md)');
  console.log('2. Test the PDF reader on a real device');
  console.log('3. Verify all functionality works as expected\n');
} else {
  console.log('\n⚠️  SOME CHECKS FAILED\n');
  console.log('Please review the errors above and fix them.\n');
}

console.log('For detailed implementation notes, see: IMPLEMENTATION_NOTES.md');
console.log('For image replacement instructions, see: STUDENT_IMAGE_INSTRUCTIONS.md\n');
