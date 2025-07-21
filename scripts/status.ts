#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { homedir } from 'os';

console.log('📊 openotes MCP Integration Status');
console.log('===================================');

// Check Claude Code MCP registration
console.log('\n🔗 Claude Code Integration:');
try {
  const result = execSync('claude mcp list', { encoding: 'utf8' });
  if (result.includes('openotes')) {
    console.log('✅ openotes is registered with Claude Code');
    
    // Get detailed info
    try {
      const details = execSync('claude mcp get openotes', { encoding: 'utf8' });
      console.log('📋 Claude Code configuration:');
      console.log(details.trim());
    } catch (error) {
      console.log('⚠️  Could not get Claude Code configuration details');
    }
  } else {
    console.log('❌ openotes not found in Claude Code MCP servers');
    console.log('💡 Run: openotes setup');
  }
} catch (error) {
  console.log('⚠️  Could not check Claude Code registration');
  console.log('   • Claude Code may not be installed or available');
}

// Check Gemini CLI registration
console.log('\n🔗 Gemini CLI Integration:');
try {
  const geminiConfigPath = path.join(homedir(), '.gemini', 'settings.json');
  if (fs.existsSync(geminiConfigPath)) {
    const config = JSON.parse(fs.readFileSync(geminiConfigPath, 'utf-8'));
    if (config.mcpServers && config.mcpServers.openotes) {
      console.log('✅ openotes is registered with Gemini CLI');
      console.log('📋 Gemini CLI configuration:');
      console.log(JSON.stringify(config.mcpServers.openotes, null, 2));
    } else {
      console.log('❌ openotes not found in Gemini CLI MCP servers');
      console.log('💡 Run: openotes setup');
    }
  } else {
    console.log('⚠️  Gemini CLI configuration file not found');
    console.log(`   Expected: ${geminiConfigPath}`);
  }
} catch (error) {
  console.log('⚠️  Could not check Gemini CLI registration');
  console.log('   • Gemini CLI may not be installed or configured');
}

// Check openotes configuration
console.log('\n⚙️  openotes Configuration:');
const configPath = path.join(homedir(), '.openotes', 'config.json');
if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    console.log('✅ Configuration file found');
    console.log(`📁 Notes directory: ${config.notesDirectory}`);
    console.log(`🔍 Max search results: ${config.maxSearchResults}`);
    console.log(`📄 File pattern: ${config.defaultFilePattern}`);
    
    // Check if notes directory exists
    if (fs.existsSync(config.notesDirectory)) {
      const files = fs.readdirSync(config.notesDirectory);
      const mdFiles = files.filter(f => f.endsWith('.md')).length;
      console.log(`✅ Notes directory exists (${mdFiles} .md files found)`);
    } else {
      console.log(`⚠️  Notes directory does not exist: ${config.notesDirectory}`);
    }
  } catch (error) {
    console.log('❌ Configuration file exists but is invalid JSON');
  }
} else {
  console.log('⚠️  No configuration file found (will use defaults)');
  console.log(`   Default notes directory: ${path.join(homedir(), 'Documents', 'Notes')}`);
}

// Test MCP server availability
console.log('\n🚀 Server Status:');
const serverPath = path.join(process.cwd(), 'build', 'index.js');
if (fs.existsSync(serverPath)) {
  console.log('✅ MCP server executable found');
} else {
  console.log('❌ MCP server not built - run "npm run build"');
}

// Check for setup completion marker
const setupMarker = path.join(homedir(), '.openotes', 'SETUP-COMPLETE.md');
if (fs.existsSync(setupMarker)) {
  const stats = fs.statSync(setupMarker);
  console.log(`✅ Setup completed: ${stats.mtime.toLocaleDateString()}`);
} else {
  console.log('⚠️  Setup not completed or incomplete');
}

console.log('\n💡 Troubleshooting Tips:');
console.log('   • Server health check: openotes health');
console.log('   • Reinstall completely: openotes uninstall && openotes setup');
console.log('   • Manual config: Edit ~/.openotes/config.json');
console.log('   • Test in Claude Code: Ask "What\'s my openotes configuration?"');
console.log('   • Test in Gemini CLI: Use "/mcp" to see available tools');