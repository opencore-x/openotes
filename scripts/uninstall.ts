#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { homedir } from 'os';

console.log('🗑️  Uninstalling openotes MCP server...');
console.log('=========================================');

let uninstallSteps = 0;

// Remove from AI clients
console.log('\n🔗 Removing from AI clients...');

// Remove from Claude Code
try {
  execSync('claude mcp remove openotes -s local', { stdio: 'inherit' });
  console.log('✅ Removed openotes from Claude Code');
  uninstallSteps++;
} catch (error) {
  console.log('⚠️  Could not remove from Claude Code (may not be registered)');
}

// Remove from Gemini CLI
try {
  const geminiConfigPath = path.join(homedir(), '.gemini', 'settings.json');
  if (fs.existsSync(geminiConfigPath)) {
    const config = JSON.parse(fs.readFileSync(geminiConfigPath, 'utf-8'));
    if (config.mcpServers && config.mcpServers.openotes) {
      delete config.mcpServers.openotes;
      fs.writeFileSync(geminiConfigPath, JSON.stringify(config, null, 2));
      console.log('✅ Removed openotes from Gemini CLI');
      uninstallSteps++;
    } else {
      console.log('⚠️  openotes not found in Gemini CLI configuration');
    }
  } else {
    console.log('⚠️  Gemini CLI configuration not found');
  }
} catch (error: any) {
  console.log('⚠️  Could not remove from Gemini CLI:', error.message);
}

// Ask about configuration cleanup
console.log('\n📁 Configuration cleanup...');
const configDir = path.join(homedir(), '.openotes');
if (fs.existsSync(configDir)) {
  console.log('Found configuration directory:', configDir);
  console.log('This contains your notes directory settings and setup history.');
  console.log('');
  
  // For now, we'll leave it - user can manually delete if they want
  console.log('⚠️  Configuration directory preserved');
  console.log('   To completely remove: rm -rf ~/.openotes');
  console.log('   This will reset your notes directory settings');
} else {
  console.log('✅ No configuration directory found');
}

// Global CLI removal instructions
console.log('\n🌐 Global CLI cleanup...');
console.log('To remove the global openotes command:');
console.log('   1. In this project directory, run: npm unlink');
console.log('   2. Or globally: npm uninstall -g openotes-mcp-server');

// Verify removal
console.log('\n🔍 Verifying removal...');
try {
  const result = execSync('claude mcp list', { encoding: 'utf8' });
  if (result.includes('openotes')) {
    console.log('⚠️  openotes still appears in Claude Code MCP list');
    console.log('   You may need to restart Claude Code');
  } else {
    console.log('✅ openotes successfully removed from Claude Code');
    uninstallSteps++;
  }
} catch (error) {
  console.log('⚠️  Could not verify removal from Claude Code');
}

console.log('\n📊 Uninstall Summary:');
if (uninstallSteps >= 1) {
  console.log('✅ openotes MCP server successfully uninstalled');
  console.log('');
  console.log('🔄 Next steps:');
  console.log('   • Restart Claude Code to complete removal');
  console.log('   • Configuration preserved in ~/.openotes (optional to remove)');
  console.log('   • Project files remain intact for reinstallation');
} else {
  console.log('⚠️  Uninstall completed with warnings');
  console.log('   Some components may need manual removal');
}

console.log('\n💡 To reinstall later: openotes setup');