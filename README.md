# openotes

**Your markdown notes, accessible to Claude, from anywhere.**

openotes lets Claude read, search, and manage your Obsidian vault (or any markdown folder). Run it on a home server, access it from your phone.

```
You:     "What did I write about kubernetes last month?"
Claude:  *searches your notes* "Found 3 notes about kubernetes..."

You:     "Add this to my project ideas"
Claude:  *appends to Projects/Ideas.md*
```

## How It Works

openotes is an [MCP server](https://modelcontextprotocol.io/) that connects Claude to your notes via HTTP.

```
┌─────────────────┐                     ┌──────────────────┐
│  Claude.ai      │                     │   Your Server    │
│  (web/mobile)   │                     │   (Mac Mini/PC)  │
├─────────────────┤     Cloudflare      │                  │
│  Claude Code    │◄────Tunnel─────────►│  openotes:3000   │
│  (CLI)          │     (secure)        │       ↓          │
├─────────────────┤                     │  ┌────────────┐  │
│  Claude Desktop │                     │  │ Your Notes │  │
└─────────────────┘                     │  └────────────┘  │
                                        └──────────────────┘
```

## What Claude Can Do

| | |
|---|---|
| **Search** | Full-text search across all notes, find files by name |
| **Read** | Read any note, read multiple notes at once |
| **Write** | Create new notes, edit existing ones, append content |
| **Organize** | Move files, create folders, delete notes |

See [TOOLS.md](./TOOLS.md) for the complete tool reference.

## Quick Start

### 1. Install

```bash
git clone https://github.com/opencore-x/openotes.git
cd openotes
npm install && npm run build
```

### 2. Configure

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000
VAULT_PATH=/path/to/your/notes
```

### 3. Run

```bash
npm start
```

### 4. Connect Claude Code

Add to your MCP settings (`~/.claude/settings.json`):

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

That's it for local use. For remote access, keep reading.

## Remote Access

To access your notes from anywhere (Claude.ai web, mobile app, laptop away from home), expose openotes through Cloudflare Tunnel.

### 1. Create Tunnel

```bash
brew install cloudflared
cloudflared login
cloudflared tunnel create openotes
cloudflared tunnel route dns openotes notes.yourdomain.com
```

### 2. Configure Tunnel

Create `~/.cloudflared/config-openotes.yml`:
```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: ~/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: notes.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

### 3. Run Tunnel

```bash
cloudflared tunnel --config ~/.cloudflared/config-openotes.yml run
```

### 4. Secure It

Add authentication via [Cloudflare Access](https://one.dash.cloudflare.com/):
1. Access → Applications → Add application
2. Select Self-hosted, enter your hostname
3. Add policy (email OTP works great)

### 5. Connect Remotely

**Claude Code** - update your MCP settings:
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

**Claude.ai (web/mobile)** - add as custom connector:
1. Go to [claude.ai/settings/connectors](https://claude.ai/settings/connectors)
2. Add custom connector → enter your URL
3. Authenticate via Cloudflare Access

Once added on web, it works on the mobile app too.

## Ideal Setup

- **Mac Mini** running 24/7 as home server
- **Obsidian vault** synced via iCloud
- **Cloudflare Tunnel** for secure remote access
- **Claude.ai Pro/Max** for web and mobile access

## Development

```bash
npm run dev      # Dev server with hot reload
npm run build    # Build for production
npm start        # Run production server
npm test         # Run tests
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

## License

MIT
