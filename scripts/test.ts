#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..');

console.log('🧪 Testing openotes MCP Server');
console.log('==============================');

console.log('\n📦 Starting MCP server for testing...');
console.log('   (Press Ctrl+C to stop)');
console.log('');
console.log('💡 Test commands you can try:');
console.log('   {"jsonrpc": "2.0", "id": 1, "method": "tools/list"}');
console.log('   {"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "openotes_config_get", "arguments": {}}}');
console.log('');

const serverPath = path.join(projectRoot, 'build', 'index.js');

const child = spawn('node', [serverPath], {
  stdio: 'inherit',
  cwd: projectRoot
});

child.on('exit', (code) => {
  console.log('\n🏁 Server stopped');
  process.exit(code || 0);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n⏹️  Stopping server...');
  child.kill('SIGINT');
});