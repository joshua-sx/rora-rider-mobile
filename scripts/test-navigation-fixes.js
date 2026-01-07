#!/usr/bin/env node

/**
 * Navigation Fixes Verification Script
 * 
 * Tests that all navigation-related fixes are correctly implemented:
 * 1. StickyCtaButton uses hook with parameter
 * 2. Venue detail screen uses hook correctly
 * 3. Trip preview doesn't calculate tab bar
 * 4. DetailScreenTemplate uses hook correctly
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

// Color codes for terminal output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let passed = 0;
let failed = 0;
let warnings = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`${GREEN}✓${RESET} ${name}`);
    passed++;
  } catch (error) {
    console.error(`${RED}✗${RESET} ${name}`);
    console.error(`  ${RED}Error:${RESET} ${error.message}`);
    failed++;
  }
}

function warn(message) {
  console.log(`${YELLOW}⚠${RESET} ${message}`);
  warnings++;
}

// Test 1: StickyCtaButton uses hook with parameter
test('StickyCtaButton uses useStickyCta with cardHeight parameter', () => {
  const filePath = path.join(PROJECT_ROOT, 'src/ui/templates/StickyCtaButton.tsx');
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check that useStickyCta is called with a parameter (not empty)
  const hookCallMatch = content.match(/useStickyCta\([^)]+\)/);
  if (!hookCallMatch) {
    throw new Error('useStickyCta hook not found');
  }
  
  const hookCall = hookCallMatch[0];
  if (hookCall === 'useStickyCta()') {
    throw new Error('useStickyCta called without required parameter');
  }
  
  // Check that cardHeight is being used
  if (!content.includes('cardHeight')) {
    throw new Error('cardHeight variable not found - hook parameter may not be calculated');
  }
  
  // Check that cardBottomPosition is used (returned from hook)
  if (!content.includes('cardBottomPosition')) {
    throw new Error('cardBottomPosition not used - hook return value not used');
  }
});

// Test 2: Venue detail screen uses hook correctly
test('Venue detail screen uses useStickyCta hook with RIDE_CTA_CARD_HEIGHT', () => {
  const filePath = path.join(PROJECT_ROOT, 'app/venue/[id].tsx');
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check that useStickyCta is imported (allow for @/ or relative paths)
  const hasUseStickyCtaImport = content.includes("from '@/src/hooks/use-sticky-cta'") ||
                                 content.includes('use-sticky-cta') ||
                                 content.includes('useStickyCta');
  if (!hasUseStickyCtaImport || !content.includes('import') && content.includes('useStickyCta')) {
    throw new Error('useStickyCta hook not imported');
  }
  
  // Check that RIDE_CTA_CARD_HEIGHT is imported or used
  if (!content.includes('RIDE_CTA_CARD_HEIGHT')) {
    throw new Error('RIDE_CTA_CARD_HEIGHT not found in file');
  }
  
  // Check that hook is called with RIDE_CTA_CARD_HEIGHT
  if (!content.includes('useStickyCta(RIDE_CTA_CARD_HEIGHT)')) {
    throw new Error('useStickyCta not called with RIDE_CTA_CARD_HEIGHT');
  }
  
  // Check that scrollViewPadding is used
  if (!content.includes('scrollViewPadding')) {
    throw new Error('scrollViewPadding not used in ScrollView');
  }
  
  // Check that manual padding calculation is removed
  if (content.includes('getTabBarHeight(insets) + 180')) {
    throw new Error('Manual padding calculation still present - should use hook value');
  }
});

// Test 3: Trip preview doesn't calculate tab bar
test('Trip preview screen does not calculate tab bar height', () => {
  const filePath = path.join(PROJECT_ROOT, 'app/trip-preview.tsx');
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check that tabBarHeight variable with hardcoded calculation is removed
  if (content.includes('const tabBarHeight = 50 + insets.bottom')) {
    throw new Error('Hardcoded tab bar calculation still present');
  }
  
  // Check that comment explains why tab bar isn't needed
  if (!content.includes('NOT in tab layout')) {
    warn('Comment explaining tab layout status not found');
  }
  
  // Check that only insets.bottom is used for padding
  const paddingMatch = content.match(/paddingBottom.*insets\.bottom/);
  if (!paddingMatch) {
    throw new Error('Safe area bottom inset not used for padding');
  }
});

// Test 4: DetailScreenTemplate uses hook correctly
test('DetailScreenTemplate uses useStickyCta with parameter', () => {
  const filePath = path.join(PROJECT_ROOT, 'src/ui/templates/DetailScreenTemplate.tsx');
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check that useStickyCta is called with parameter
  const hookCallMatch = content.match(/useStickyCta\([^)]+\)/);
  if (!hookCallMatch) {
    throw new Error('useStickyCta hook not found');
  }
  
  const hookCall = hookCallMatch[0];
  if (hookCall === 'useStickyCta()') {
    throw new Error('useStickyCta called without parameter');
  }
  
  // Check that scrollViewPadding is used (not paddingBottom)
  if (!content.includes('scrollViewPadding')) {
    throw new Error('scrollViewPadding not used - incorrect property name');
  }
  
  // Check that DEFAULT_STICKY_BUTTON_HEIGHT constant exists
  if (!content.includes('DEFAULT_STICKY_BUTTON_HEIGHT')) {
    throw new Error('DEFAULT_STICKY_BUTTON_HEIGHT constant not found');
  }
});

// Test 5: use-scroll-padding hook exists and is properly structured
test('useScrollPadding hook exists and is properly structured', () => {
  const filePath = path.join(PROJECT_ROOT, 'src/hooks/use-scroll-padding.ts');
  
  if (!fs.existsSync(filePath)) {
    throw new Error('useScrollPadding hook file does not exist');
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check that it exports the hook
  if (!content.includes('export function useScrollPadding')) {
    throw new Error('useScrollPadding function not exported');
  }
  
  // Check that it uses getTabBarHeight utility
  if (!content.includes('getTabBarHeight')) {
    throw new Error('getTabBarHeight utility not used');
  }
  
  // Check that it handles hasTabBar parameter
  if (!content.includes('hasTabBar')) {
    throw new Error('hasTabBar parameter not found');
  }
  
  // Check that it handles extraPadding parameter
  if (!content.includes('extraPadding')) {
    throw new Error('extraPadding parameter not found');
  }
});

// Test 6: No useStickyCta() calls without parameters in implementation files
test('No useStickyCta() calls without parameters in implementation files', () => {
  const srcDir = path.join(PROJECT_ROOT, 'src');
  const appDir = path.join(PROJECT_ROOT, 'app');
  
  const files = [
    ...findFiles(srcDir, ['.ts', '.tsx']),
    ...findFiles(appDir, ['.ts', '.tsx']),
  ].filter(f => !f.includes('test') && !f.includes('spec'));
  
  const errors = [];
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for useStickyCta() calls without parameters
    // Allow comments and documentation, but not actual code
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      // Skip comment lines and markdown/doc blocks
      if (line.trim().startsWith('//') || 
          line.trim().startsWith('*') ||
          line.includes('```') ||
          line.includes('example')) {
        return;
      }
      
      // Check for useStickyCta() without parameter in actual code
      if (line.match(/useStickyCta\s*\(\s*\)/)) {
        errors.push(`${file}:${index + 1} - useStickyCta() called without parameter`);
      }
    });
  }
  
  if (errors.length > 0) {
    throw new Error(`Found ${errors.length} instances:\n  ${errors.join('\n  ')}`);
  }
});

// Helper function to find files
function findFiles(dir, extensions) {
  let results = [];
  
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat && stat.isDirectory()) {
        // Skip node_modules and other irrelevant directories
        if (!['node_modules', '.git', 'build', 'dist', '.expo'].includes(file)) {
          results = results.concat(findFiles(filePath, extensions));
        }
      } else {
        const ext = path.extname(file);
        if (extensions.includes(ext)) {
          results.push(filePath);
        }
      }
    });
  } catch (error) {
    // Skip directories we can't read
  }
  
  return results;
}

// Run all tests
console.log(`${BOLD}Navigation Fixes Verification${RESET}\n`);
console.log('Running tests...\n');

// Execute all tests defined above
// (Tests are defined as functions above)

// Test 1
test('StickyCtaButton uses useStickyCta with cardHeight parameter', () => {
  const filePath = path.join(PROJECT_ROOT, 'src/ui/templates/StickyCtaButton.tsx');
  const content = fs.readFileSync(filePath, 'utf8');
  
  const hookCallMatch = content.match(/useStickyCta\([^)]+\)/);
  if (!hookCallMatch) {
    throw new Error('useStickyCta hook not found');
  }
  
  const hookCall = hookCallMatch[0];
  if (hookCall === 'useStickyCta()') {
    throw new Error('useStickyCta called without required parameter');
  }
  
  if (!content.includes('cardHeight')) {
    throw new Error('cardHeight variable not found');
  }
  
  if (!content.includes('cardBottomPosition')) {
    throw new Error('cardBottomPosition not used');
  }
});

// Test 2
test('Venue detail screen uses useStickyCta hook with RIDE_CTA_CARD_HEIGHT', () => {
  const filePath = path.join(PROJECT_ROOT, 'app/venue/[id].tsx');
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check that useStickyCta is imported (check for import statement containing use-sticky-cta)
  const hasUseStickyCtaImport = content.includes("from '@/src/hooks/use-sticky-cta'") ||
                                 (content.includes('import') && content.includes('useStickyCta') && content.includes('use-sticky-cta'));
  if (!hasUseStickyCtaImport) {
    throw new Error('useStickyCta hook not imported - check import statement');
  }
  
  if (!content.includes('RIDE_CTA_CARD_HEIGHT')) {
    throw new Error('RIDE_CTA_CARD_HEIGHT not found');
  }
  
  if (!content.includes('useStickyCta(RIDE_CTA_CARD_HEIGHT)')) {
    throw new Error('useStickyCta not called with RIDE_CTA_CARD_HEIGHT');
  }
  
  if (!content.includes('scrollViewPadding')) {
    throw new Error('scrollViewPadding not used');
  }
  
  if (content.includes('getTabBarHeight(insets) + 180')) {
    throw new Error('Manual padding calculation still present');
  }
});

// Test 3
test('Trip preview screen does not calculate tab bar height', () => {
  const filePath = path.join(PROJECT_ROOT, 'app/trip-preview.tsx');
  const content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('const tabBarHeight = 50 + insets.bottom')) {
    throw new Error('Hardcoded tab bar calculation still present');
  }
  
  if (!content.includes('NOT in tab layout')) {
    warn('Comment explaining tab layout status not found');
  }
  
  const paddingMatch = content.match(/paddingBottom.*insets\.bottom/);
  if (!paddingMatch) {
    throw new Error('Safe area bottom inset not used for padding');
  }
});

// Test 4
test('DetailScreenTemplate uses useStickyCta with parameter', () => {
  const filePath = path.join(PROJECT_ROOT, 'src/ui/templates/DetailScreenTemplate.tsx');
  const content = fs.readFileSync(filePath, 'utf8');
  
  const hookCallMatch = content.match(/useStickyCta\([^)]+\)/);
  if (!hookCallMatch) {
    throw new Error('useStickyCta hook not found');
  }
  
  const hookCall = hookCallMatch[0];
  if (hookCall === 'useStickyCta()') {
    throw new Error('useStickyCta called without parameter');
  }
  
  if (!content.includes('scrollViewPadding')) {
    throw new Error('scrollViewPadding not used');
  }
  
  if (!content.includes('DEFAULT_STICKY_BUTTON_HEIGHT')) {
    throw new Error('DEFAULT_STICKY_BUTTON_HEIGHT constant not found');
  }
});

// Test 5
test('useScrollPadding hook exists and is properly structured', () => {
  const filePath = path.join(PROJECT_ROOT, 'src/hooks/use-scroll-padding.ts');
  
  if (!fs.existsSync(filePath)) {
    throw new Error('useScrollPadding hook file does not exist');
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('export function useScrollPadding')) {
    throw new Error('useScrollPadding function not exported');
  }
  
  if (!content.includes('getTabBarHeight')) {
    throw new Error('getTabBarHeight utility not used');
  }
  
  if (!content.includes('hasTabBar')) {
    throw new Error('hasTabBar parameter not found');
  }
  
  if (!content.includes('extraPadding')) {
    throw new Error('extraPadding parameter not found');
  }
});

// Test 6 - Check for invalid hook calls
test('No useStickyCta() calls without parameters in implementation files', () => {
  const srcDir = path.join(PROJECT_ROOT, 'src');
  const appDir = path.join(PROJECT_ROOT, 'app');
  
  const files = [
    ...findFiles(srcDir, ['.ts', '.tsx']),
    ...findFiles(appDir, ['.ts', '.tsx']),
  ].filter(f => !f.includes('test') && !f.includes('spec') && !f.includes('node_modules'));
  
  const errors = [];
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // Skip comment lines and documentation
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || 
            trimmed.startsWith('*') ||
            trimmed.startsWith('```') ||
            line.includes('example') ||
            line.includes('```tsx') ||
            line.includes('```typescript')) {
          return;
        }
        
        // Check for useStickyCta() without parameter in actual code
        if (line.match(/useStickyCta\s*\(\s*\)/)) {
          errors.push(`${path.relative(PROJECT_ROOT, file)}:${index + 1}`);
        }
      });
    } catch (error) {
      // Skip files we can't read
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Found ${errors.length} instances:\n  ${errors.join('\n  ')}`);
  }
});

// Print summary
console.log('\n' + '='.repeat(50));
console.log(`${BOLD}Test Summary${RESET}`);
console.log('='.repeat(50));
console.log(`${GREEN}Passed:${RESET} ${passed}`);
if (warnings > 0) {
  console.log(`${YELLOW}Warnings:${RESET} ${warnings}`);
}
if (failed > 0) {
  console.log(`${RED}Failed:${RESET} ${failed}`);
  process.exit(1);
} else {
  console.log(`\n${GREEN}${BOLD}All tests passed!${RESET} Navigation fixes verified.`);
  process.exit(0);
}

