# Tool Reference

openotes provides 14 tools organized into 5 categories.

## Overview

| Category | Tools |
|----------|-------|
| **Discovery** | `list`, `search`, `search_files`, `get_structure` |
| **Reading** | `read`, `read_multiple` |
| **Writing** | `create`, `write`, `append`, `edit` |
| **Organization** | `create_directory`, `move`, `delete` |
| **Utility** | `health` |

## Discovery

### `list`
List markdown files in the vault.

```json
{ "filter": "Projects/" }
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `filter` | string | Optional. Filter by path prefix |

### `search`
Full-text content search with relevance scoring.

```json
{ "query": "kubernetes deployment", "max_results": 20 }
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | Search query |
| `max_results` | number | Optional. Max results (default: 50) |

### `search_files`
Search by filename pattern.

```json
{ "query": "meeting" }
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | Filename search pattern |

### `get_structure`
Get directory tree of the vault.

```json
{}
```

No parameters.

## Reading

### `read`
Read a single file.

```json
{ "filepath": "Projects/openotes.md" }
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `filepath` | string | Path to file (relative to vault) |

### `read_multiple`
Read multiple files at once.

```json
{ "filepaths": ["README.md", "Projects/ideas.md"] }
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `filepaths` | string[] | Array of file paths |

## Writing

### `create`
Create a new file. Fails if file already exists.

```json
{ "filepath": "Notes/new-note.md", "content": "# New Note\n\nContent here" }
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `filepath` | string | Path for new file |
| `content` | string | File content |

### `write`
Overwrite a file (creates if doesn't exist).

```json
{ "filepath": "Notes/note.md", "content": "# Updated content" }
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `filepath` | string | Path to file |
| `content` | string | New content |

### `append`
Append content to end of file.

```json
{ "filepath": "Notes/log.md", "content": "\n- New entry" }
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `filepath` | string | Path to file |
| `content` | string | Content to append |

### `edit`
Find and replace text in a file.

```json
{ "filepath": "Notes/note.md", "old_content": "old text", "new_content": "new text" }
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `filepath` | string | Path to file |
| `old_content` | string | Text to find |
| `new_content` | string | Replacement text |

## Organization

### `create_directory`
Create a new folder.

```json
{ "dirpath": "Projects/NewProject" }
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `dirpath` | string | Path for new directory |

### `move`
Move or rename a file.

```json
{ "source": "inbox/note.md", "destination": "Projects/note.md" }
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `source` | string | Current file path |
| `destination` | string | New file path |

### `delete`
Delete a file. Requires explicit confirmation.

```json
{ "filepath": "trash/old-note.md", "confirm": true }
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `filepath` | string | Path to file |
| `confirm` | boolean | Must be `true` to delete |

## Utility

### `health`
Check server health and configuration.

```json
{}
```

No parameters. Returns server status and vault info.

## Security

All file operations are sandboxed to the configured vault path:
- Path traversal attempts (e.g., `../`) are blocked
- Symlinks pointing outside the vault are rejected
- Null bytes in paths are rejected
