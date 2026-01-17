# openotes MCP Server

An MCP (Model Context Protocol) server that gives AI agents access to your markdown knowledge base. Designed to run 24/7 on a home server and accessed remotely via Cloudflare Tunnel.

## Ideal Setup

```
┌─────────────────┐     Cloudflare      ┌──────────────────┐
│   Claude Code   │◄────Tunnel─────────►│   Mac Mini M4    │
│   (anywhere)    │     (secure)        │   (home server)  │
└─────────────────┘                     │                  │
                                        │  openotes:3000   │
                                        │  ┌────────────┐  │
                                        │  │ Obsidian   │  │
                                        │  │ Vault      │  │
                                        │  └────────────┘  │
                                        └──────────────────┘
```

**Best with:**
- **Mac Mini M4** running 24/7 at home
- **Obsidian vault** synced via iCloud
- **Cloudflare Tunnel** for secure remote access
- **Claude Code** as the AI client

## Features

- **HTTP Transport** - Remote access via Streamable HTTP (not stdio)
- **Path Security** - Traversal protection, symlink escape detection
- **14 Tools** - Full CRUD operations for markdown notes
- **Session Management** - UUID-based MCP sessions

## Available Tools

| Category | Tools |
|----------|-------|
| **Discovery** | `list`, `search`, `search_files`, `get_structure` |
| **Reading** | `read`, `read_multiple` |
| **Writing** | `create`, `write`, `append`, `edit` |
| **Organization** | `create_directory`, `move`, `delete` |
| **Utility** | `health` |

## Quick Start

### 1. Install & Configure

```bash
git clone https://github.com/opencore-x/openotes.git
cd openotes
npm install
npm run build

# Create .env file
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000
VAULT_PATH=~/Library/Mobile Documents/iCloud~md~obsidian/Documents/Notes
MAX_SEARCH_RESULTS=50
```

### 2. Run the Server

```bash
npm start
# or for development with hot reload
npm run dev
```

Server runs at `http://127.0.0.1:3000/mcp`

### 3. Connect Claude Code (Local)

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "openotes": {
      "type": "streamableHttp",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

## Remote Access with Cloudflare Tunnel

### Setup Tunnel

```bash
# Install cloudflared
brew install cloudflared

# Login and create tunnel
cloudflared login
cloudflared tunnel create openotes

# Route DNS (replace with your domain)
cloudflared tunnel route dns openotes notes.yourdomain.com
```

Create `~/.cloudflared/config-openotes.yml`:
```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: /Users/you/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: notes.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

### Run Tunnel

```bash
cloudflared tunnel --config ~/.cloudflared/config-openotes.yml run
```

### Connect Claude Code (Remote)

```json
{
  "mcpServers": {
    "openotes": {
      "type": "streamableHttp",
      "url": "https://notes.yourdomain.com/mcp"
    }
  }
}
```

### Secure with Cloudflare Access

1. Go to [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
2. Access → Applications → Add an application
3. Select Self-hosted, enter your hostname
4. Add authentication policy (email OTP recommended)

## Tool Reference

### Discovery

**`list`** - List markdown files
```json
{ "filter": "Projects/" }
```

**`search`** - Full-text content search
```json
{ "query": "kubernetes deployment", "max_results": 20 }
```

**`search_files`** - Search by filename
```json
{ "query": "meeting" }
```

**`get_structure`** - Directory tree
```json
{}
```

### Reading

**`read`** - Read single file
```json
{ "filepath": "Projects/openotes.md" }
```

**`read_multiple`** - Read multiple files
```json
{ "filepaths": ["README.md", "Projects/ideas.md"] }
```

### Writing

**`create`** - Create new file (fails if exists)
```json
{ "filepath": "Notes/new-note.md", "content": "# New Note\n\nContent here" }
```

**`write`** - Overwrite file
```json
{ "filepath": "Notes/note.md", "content": "# Updated content" }
```

**`append`** - Append to file
```json
{ "filepath": "Notes/log.md", "content": "\n- New entry" }
```

**`edit`** - Find and replace
```json
{ "filepath": "Notes/note.md", "old_content": "old text", "new_content": "new text" }
```

### Organization

**`create_directory`** - Create folder
```json
{ "dirpath": "Projects/NewProject" }
```

**`move`** - Move/rename file
```json
{ "source": "inbox/note.md", "destination": "Projects/note.md" }
```

**`delete`** - Delete file (requires confirmation)
```json
{ "filepath": "trash/old-note.md", "confirm": true }
```

### Utility

**`health`** - Server health check
```json
{}
```

## Project Structure

```
src/
├── index.ts           # HTTP server with Express
├── core/
│   ├── config.ts      # Environment configuration
│   ├── paths.ts       # Path security validation
│   ├── files.ts       # File operations
│   └── search.ts      # Search engine
├── tools/
│   ├── discovery.ts   # list, search, search_files, get_structure
│   ├── reading.ts     # read, read_multiple
│   ├── writing.ts     # create, write, append, edit
│   ├── organization.ts # create_directory, move, delete
│   └── utility.ts     # health
└── types/
    └── index.ts       # TypeScript definitions
```

## Scripts

```bash
npm run dev      # Development with hot reload
npm run build    # Build for production
npm start        # Run production server
npm test         # Run tests
```

## License

MIT

---

*openotes - Your notes, accessible to AI, from anywhere*
