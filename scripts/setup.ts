#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');

console.log('🔧 Setting up openotes MCP server...');
console.log('📝 This will register the server with available AI clients');
console.log('');

// Ensure the project is built
console.log('📦 Checking if MCP server is built...');
const buildPath = path.join(projectRoot, 'build', 'index.js');
if (!fs.existsSync(buildPath)) {
  console.log('🔨 Building MCP server...');
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: projectRoot });
    console.log('✅ MCP server built successfully');
  } catch (error: any) {
    console.error('❌ Failed to build MCP server:', error.message);
    console.log('💡 Please run "npm run build" manually and try again');
    process.exit(1);
  }
} else {
  console.log('✅ MCP server already built');
}

// Get current working directory as the default notes directory
const defaultNotesDirectory = path.join(homedir(), 'Documents', 'Notes');
console.log('📁 Default notes directory will be:', defaultNotesDirectory);
console.log('   You can change this later using openotes_config_set');
console.log('');

// Check for available AI clients
console.log('🔍 Detecting available AI clients...');
const availableClients = [];

// Check for Claude Code
let claudeAvailable = false;
try {
  execSync('claude mcp list', { stdio: 'pipe' });
  claudeAvailable = true;
  availableClients.push('Claude Code');
  console.log('✅ Claude Code detected');
} catch (error) {
  console.log('⚠️  Claude Code not detected');
}

// Check for Gemini CLI
let geminiAvailable = false;
try {
  execSync('gemini --version', { stdio: 'pipe' });
  geminiAvailable = true;
  availableClients.push('Gemini CLI');
  console.log('✅ Gemini CLI detected');
} catch (error) {
  // Also check if ~/.gemini/settings.json exists as indication of prior Gemini CLI setup
  const geminiConfigPath = path.join(homedir(), '.gemini', 'settings.json');
  if (fs.existsSync(geminiConfigPath)) {
    geminiAvailable = true;
    availableClients.push('Gemini CLI');
    console.log('✅ Gemini CLI detected (config found)');
  } else {
    console.log('⚠️  Gemini CLI not detected');
  }
}

if (availableClients.length === 0) {
  console.log('❌ No supported AI clients found');
  console.log('');
  console.log('💡 Install one of these clients:');
  console.log('   • Claude Code: https://claude.ai/download');
  console.log('   • Gemini CLI: https://cloud.google.com/gemini/docs/codeassist/gemini-cli');
  console.log('');
  process.exit(1);
}

console.log(`🎯 Setting up openotes for: ${availableClients.join(', ')}`);
console.log('');

// Create MCP server configuration
const mcpConfig = {
  command: 'node',
  args: [path.join(projectRoot, 'build', 'index.js')],
  env: {
    NODE_ENV: 'development',
    NODE_PATH: path.join(projectRoot, 'node_modules')
  }
};

let setupSuccess = false;

// Setup for Claude Code
if (claudeAvailable) {
  console.log('⚙️  Registering with Claude Code...');
  try {
    // Remove existing server if it exists
    try {
      execSync('claude mcp remove openotes -s local', { stdio: 'pipe' });
      console.log('🗑️  Removed existing openotes MCP server');
    } catch (error) {
      // Ignore error if server doesn't exist
    }

    // Add MCP server using Claude Code's official command
    const configJson = JSON.stringify(mcpConfig);
    execSync(`claude mcp add-json openotes '${configJson}'`, { stdio: 'inherit' });
    console.log('✅ openotes registered with Claude Code');
    
    // Verify registration
    try {
      const result = execSync('claude mcp get openotes', { encoding: 'utf8' });
      console.log('📋 Claude Code registration verified');
    } catch (error) {
      console.warn('⚠️  Could not verify Claude Code registration (but should work)');
    }
    
    setupSuccess = true;
  } catch (error: any) {
    console.error('❌ Failed to register with Claude Code');
    console.log('💡 Manual Claude Code setup:');
    console.log('   1. Open configuration file:');
    console.log('      macOS: ~/Library/Application Support/Claude/claude_desktop_config.json');
    console.log('      Windows: %APPDATA%\\Claude\\claude_desktop_config.json');
    console.log('      Linux: ~/.config/claude/claude_desktop_config.json');
    console.log('');
    console.log('   2. Add this configuration:');
    console.log('   {');
    console.log('     "mcpServers": {');
    console.log('       "openotes": {');
    console.log(`         "command": "node",`);
    console.log(`         "args": ["${path.join(projectRoot, 'build', 'index.js')}"],`);
    console.log(`         "env": {`);
    console.log(`           "NODE_PATH": "${path.join(projectRoot, 'node_modules')}"`);
    console.log(`         }`);
    console.log('       }');
    console.log('     }');
    console.log('   }');
    console.log('');
  }
}

// Setup for Gemini CLI
if (geminiAvailable) {
  console.log('⚙️  Registering with Gemini CLI...');
  try {
    const geminiConfigDir = path.join(homedir(), '.gemini');
    const geminiConfigFile = path.join(geminiConfigDir, 'settings.json');
    
    // Ensure config directory exists
    fs.mkdirSync(geminiConfigDir, { recursive: true });
    
    // Read existing config or create new one
    let geminiConfig: any = { mcpServers: {} };
    if (fs.existsSync(geminiConfigFile)) {
      try {
        const existingConfig = fs.readFileSync(geminiConfigFile, 'utf-8');
        geminiConfig = JSON.parse(existingConfig);
        if (!geminiConfig.mcpServers) {
          geminiConfig.mcpServers = {};
        }
      } catch (error) {
        console.warn('⚠️  Invalid existing Gemini config, creating new one');
        geminiConfig = { mcpServers: {} };
      }
    }
    
    // Add openotes server configuration
    geminiConfig.mcpServers.openotes = {
      command: 'node',
      args: [path.join(projectRoot, 'build', 'index.js')],
      env: {
        NODE_ENV: 'development',
        NODE_PATH: path.join(projectRoot, 'node_modules')
      },
      timeout: 30000
    };
    
    // Write updated config
    fs.writeFileSync(geminiConfigFile, JSON.stringify(geminiConfig, null, 2));
    console.log('✅ openotes registered with Gemini CLI');
    console.log(`📁 Configuration saved to: ${geminiConfigFile}`);
    
    setupSuccess = true;
  } catch (error: any) {
    console.error('❌ Failed to register with Gemini CLI:', error.message);
    console.log('💡 Manual Gemini CLI setup:');
    console.log(`   1. Create/edit: ~/.gemini/settings.json`);
    console.log('   2. Add this configuration:');
    console.log('   {');
    console.log('     "mcpServers": {');
    console.log('       "openotes": {');
    console.log('         "command": "node",');
    console.log(`         "args": ["${path.join(projectRoot, 'build', 'index.js')}"],`);
    console.log('         "env": {');
    console.log('           "NODE_ENV": "development",');
    console.log(`           "NODE_PATH": "${path.join(projectRoot, 'node_modules')}"`);
    console.log('         },');
    console.log('         "timeout": 30000');
    console.log('       }');
    console.log('     }');
    console.log('   }');
    console.log('');
  }
}

if (!setupSuccess) {
  console.log('❌ Setup failed for all detected clients');
  process.exit(1);
}

// Create a quick start guide
const quickStartGuide = `# openotes MCP Server - Ready! 🎉

Your openotes MCP server is now configured and ready to use with: ${availableClients.join(', ')}

## 🚀 Quick Start

${claudeAvailable ? `### Claude Code
Ask Claude Code these questions to test the MCP tools:` : ''}${geminiAvailable ? `

### Gemini CLI
Ask Gemini these questions to test the MCP tools:
- Use the \`/mcp\` command to see available tools` : ''}

### Test Commands (both platforms):

### Configuration & Setup
- "What's my current openotes configuration?" → \`openotes_config_get\`
- "Set my notes directory to /Users/myname/Notes" → \`openotes_config_set\`

### File Discovery
- "What markdown files do I have?" → \`openotes_list\`
- "Search for files containing 'project'" → \`openotes_search_content\`
- "Show me my notes directory structure" → \`openotes_get_structure\`

### Reading Notes
- "Read my meeting notes file" → \`openotes_read\`
- "Show me the content of these 3 files" → \`openotes_read_multiple\`

### Creating & Writing
- "Create a new note about today's meeting" → \`openotes_create\`
- "Add a summary to my project notes" → \`openotes_append\`

### Organization
- "Create a folder for my projects" → \`openotes_create_directory\`
- "Move this file to my projects folder" → \`openotes_move_file\`

## 📊 Available Tools

${[
  'openotes_config_set', 'openotes_config_get',
  'openotes_list', 'openotes_search_files', 'openotes_search_content', 'openotes_get_structure',
  'openotes_read', 'openotes_read_multiple', 'openotes_get_metadata',
  'openotes_create', 'openotes_write', 'openotes_append',
  'openotes_create_directory', 'openotes_move_file'
].map(tool => `- **${tool}**`).join('\n')}

## 🛠️ Troubleshooting

If tools aren't working:
1. Check server health: \`openotes health\`
2. Check integration status: \`openotes status\`${claudeAvailable ? `
3. Restart Claude Code completely` : ''}${geminiAvailable ? `
4. In Gemini CLI, use \`/mcp\` to verify server connection` : ''}

## 📁 Default Configuration

- **Notes Directory**: ${defaultNotesDirectory}
- **File Pattern**: \`**/*.md\` (all markdown files)
- **Max Results**: 50 files per search

Generated: ${new Date().toISOString()}
`;

// Ensure .openotes directory exists and write the guide
const openotesDir = path.join(homedir(), '.openotes');
fs.mkdirSync(openotesDir, { recursive: true });
fs.writeFileSync(path.join(openotesDir, 'SETUP-COMPLETE.md'), quickStartGuide);
console.log('✅ Created setup guide at ~/.openotes/SETUP-COMPLETE.md');

console.log('');
console.log('🎉 Setup Complete!');
console.log('');
console.log('📋 Next steps:');
if (claudeAvailable) {
  console.log('   Claude Code:');
  console.log('   • Restart Claude Code completely');
  console.log('   • Ask: "What\'s my openotes configuration?"');
}
if (geminiAvailable) {
  console.log('   Gemini CLI:');
  console.log('   • Run: gemini');
  console.log('   • Use: /mcp to see available tools');
  console.log('   • Ask: "List my markdown files using openotes"');
}
console.log('');
console.log('🔧 Common commands:');
console.log('   • Test health: openotes health');
console.log('   • Check status: openotes status');
console.log('   • Uninstall: openotes uninstall');
console.log('');
console.log('📚 Quick reference: ~/.openotes/SETUP-COMPLETE.md');