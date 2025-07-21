#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

console.log('🩺 openotes MCP Server Health Check');
console.log('=====================================');

let healthScore = 0;
const maxScore = 6;

// 1. Check if server is built
console.log('\n📦 Checking build status...');
const buildPath = path.join(projectRoot, 'build', 'index.js');
if (fs.existsSync(buildPath)) {
  console.log('✅ MCP server is built');
  healthScore++;
} else {
  console.log('❌ MCP server not built - run "npm run build"');
}

// 2. Check if CLI is globally installed
console.log('\n🌐 Checking global installation...');
try {
  execSync('which openotes', { stdio: 'pipe' });
  console.log('✅ openotes CLI is globally available');
  healthScore++;
} catch (error) {
  console.log('❌ openotes CLI not found - run "npm link" to install globally');
}

// 3. Check AI client registrations
console.log('\n🔗 Checking AI client registrations...');
let clientsRegistered = 0;

// Check Claude Code
try {
  const result = execSync('claude mcp get openotes', { encoding: 'utf8', stdio: 'pipe' });
  console.log('✅ Registered with Claude Code');
  clientsRegistered++;
} catch (error) {
  console.log('⚠️  Not registered with Claude Code');
}

// Check Gemini CLI
try {
  const geminiConfigPath = path.join(homedir(), '.gemini', 'settings.json');
  if (fs.existsSync(geminiConfigPath)) {
    const config = JSON.parse(fs.readFileSync(geminiConfigPath, 'utf-8'));
    if (config.mcpServers && config.mcpServers.openotes) {
      console.log('✅ Registered with Gemini CLI');
      clientsRegistered++;
    } else {
      console.log('⚠️  Not registered with Gemini CLI');
    }
  } else {
    console.log('⚠️  Gemini CLI config not found');
  }
} catch (error) {
  console.log('⚠️  Could not check Gemini CLI registration');
}

if (clientsRegistered > 0) {
  console.log(`✅ Registered with ${clientsRegistered} AI client(s)`);
  healthScore++;
} else {
  console.log('❌ Not registered with any AI clients - run "openotes setup"');
}

// 4. Check configuration directory
console.log('\n📁 Checking configuration...');
const configDir = path.join(homedir(), '.openotes');
if (fs.existsSync(configDir)) {
  console.log('✅ Configuration directory exists');
  healthScore++;
} else {
  console.log('⚠️  Configuration directory not found - will be created on first use');
}

// 5. Check default notes directory
console.log('\n📝 Checking default notes directory...');
const defaultNotesDir = path.join(homedir(), 'Documents', 'Notes');
if (fs.existsSync(defaultNotesDir)) {
  console.log('✅ Default notes directory exists');
  healthScore++;
} else {
  console.log('⚠️  Default notes directory not found');
  console.log(`   Expected: ${defaultNotesDir}`);
  console.log('   Use openotes_config_set to set your notes directory');
}

// 6. Test basic file operations
console.log('\n🧪 Testing file operations...');
try {
  const testDir = path.join(configDir, 'test');
  fs.mkdirSync(testDir, { recursive: true });
  const testFile = path.join(testDir, 'health-check.md');
  fs.writeFileSync(testFile, '# Health Check Test\nThis is a test file.\n');
  const content = fs.readFileSync(testFile, 'utf-8');
  fs.unlinkSync(testFile);
  fs.rmdirSync(testDir);
  
  if (content.includes('Health Check Test')) {
    console.log('✅ File operations working correctly');
    healthScore++;
  } else {
    console.log('❌ File operations failed');
  }
} catch (error) {
  console.log('❌ File operations failed:', error.message);
}

// Summary
console.log('\n📊 Health Check Summary');
console.log('=======================');
console.log(`Overall Health: ${healthScore}/${maxScore} checks passed`);

if (healthScore === maxScore) {
  console.log('🎉 Perfect! openotes MCP server is fully operational');
} else if (healthScore >= 4) {
  console.log('✅ Good! openotes should work with minor issues');
} else if (healthScore >= 2) {
  console.log('⚠️  Partial functionality - some setup needed');
} else {
  console.log('❌ Major issues found - run setup again');
}

console.log('\n🔧 Common fixes:');
console.log('   • Build issues: npm run build');
console.log('   • Global install: npm link');
console.log('   • Registration: openotes setup');
console.log('   • Notes directory: Use openotes_config_set in Claude Code');

process.exit(healthScore === maxScore ? 0 : 1);