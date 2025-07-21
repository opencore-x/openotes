# openotes MCP Server

A powerful MCP (Model Context Protocol) server that bridges AI agents with your markdown knowledge base for seamless reading, writing, and organizing notes.

## Features

### Core Capabilities
- **Configuration Management**: Set and manage your notes directory
- **File Discovery**: List, search, and explore your markdown files
- **Content Search**: Full-text search across all your notes
- **File Operations**: Read, write, create, and organize markdown files
- **Directory Management**: Create directories and move files for better organization

### Available Tools

#### Configuration Tools
- `openotes_config_set` - Configure notes directory path  
- `openotes_config_get` - Get current configuration

#### Discovery Tools
- `openotes_list` - List markdown files with optional filtering
- `openotes_search_files` - Search by filename patterns
- `openotes_search_content` - Full-text content search
- `openotes_get_structure` - Get complete directory tree

#### Reading Tools
- `openotes_read` - Read specific markdown file
- `openotes_read_multiple` - Read multiple files efficiently
- `openotes_get_metadata` - Get file metadata (size, dates, etc.)

#### Writing Tools
- `openotes_create` - Create new markdown file
- `openotes_write` - Write/overwrite entire file
- `openotes_append` - Append content to existing file

#### Organization Tools
- `openotes_create_directory` - Create subdirectories
- `openotes_move_file` - Move/rename files

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```

## Usage

### With Claude Code

1. **Locate your Claude Code configuration file:**
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/claude/claude_desktop_config.json`

2. **Add the openotes MCP server to your configuration:**

```json
{
  "mcpServers": {
    "openotes": {
      "command": "node",
      "args": ["/path/to/your/openotes/project/build/index.js"],
      "env": {
        "NODE_PATH": "/path/to/your/openotes/project/node_modules"
      }
    }
  }
}
```
**Note:** Replace `/path/to/your/openotes/project` with the absolute path to your `openotes` project directory.

3. **Restart Claude Code** to load the new MCP server

4. **Verify the connection** by asking Claude Code to list available tools - you should see all the `openotes_*` tools

### With Gemini CLI

1. **Install Gemini CLI** if you haven't already:
```bash
npm install -g @google/gemini-cli
```

2. **Configure MCP server** by creating or updating your Gemini CLI configuration file at `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "openotes": {
      "command": "node",
      "args": ["/path/to/your/openotes/project/build/index.js"],
      "env": {
        "NODE_PATH": "/path/to/your/openotes/project/node_modules"
      }
    }
  }
}
```
**Note:** Replace `/path/to/your/openotes/project` with the absolute path to your `openotes` project directory.

3. **Start Gemini CLI with MCP support**:
```bash
echo "Use openotes_config_get to show my current configuration" | gemini --allowed-mcp-server-names=openotes
```

4. **Test the connection** by running the command above. You should see a response like:
```
OK. Your notes directory is /Users/your-username/Documents/Notes.
```

## Configuration

On first use, openotes will create a default configuration at `~/.openotes/config.json`:

```json
{
  "notesDirectory": "/Users/your-username/Documents/Notes",
  "maxSearchResults": 50,
  "defaultFilePattern": "**/*.md",
  "excludePatterns": ["node_modules/**", ".git/**", "**/.*"]
}
```

Use `openotes_config_set` to update your notes directory with an absolute path:

```json
{
  "notesDirectory": "/Users/your-username/path/to/your/notes"
}
```

**Important**: Always use absolute paths for `notesDirectory` to avoid configuration issues. Examples:
- ✅ **Good**: `/Users/john/Documents/MyNotes`
- ✅ **Good**: `/home/user/Obsidian/vault`
- ❌ **Avoid**: `~/Documents/Notes`
- ❌ **Avoid**: `../my-notes`

## Example Workflows

### Save Conversation Insights
1. During a conversation with an AI agent, use `openotes_create` to save interesting insights
2. Organize them using `openotes_create_directory` and `openotes_move_file`

### Research and Retrieval
1. Use `openotes_search_content` to find relevant information from your notes
2. Use `openotes_read_multiple` to efficiently load several related files
3. The AI agent can then use this information to provide informed responses

### Note Organization
1. Use `openotes_list` to see all your notes
2. Use `openotes_get_structure` to understand your current organization
3. Use organization tools to restructure as needed

## Development

### Scripts
- `npm run dev` - Run in development mode with hot reload
- `npm run build` - Build the project
- `npm run test` - Run tests
- `npm run lint` - Lint the code

### Project Structure
```
src/
├── index.ts              # Main MCP server
├── config/
│   └── manager.ts        # Configuration management
├── tools/                # (Future: Individual tool implementations)
├── utils/
│   ├── file-operations.ts
│   └── search.ts
└── types/
    └── index.ts          # TypeScript definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

---

*openotes MCP Server - Supercharge your notes with AI*