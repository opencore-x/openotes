export interface FileMetadata {
  path: string;
  name: string;
  size: number;
  createdAt: Date;
  modifiedAt: Date;
  isDirectory: boolean;
}

export interface SearchResult {
  path: string;
  matches: SearchMatch[];
  score: number;
}

export interface SearchMatch {
  line: number;
  content: string;
  start: number;
  end: number;
}

export interface DirectoryStructure {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: DirectoryStructure[];
}

export interface NoteSection {
  heading: string;
  level: number;
  content: string;
  lineStart: number;
  lineEnd: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface ToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ToolHandler = (args: any) => Promise<ToolResponse>;

export interface EditArgs {
  filepath: string;
  old_content: string;
  new_content: string;
}

export interface DeleteArgs {
  filepath: string;
  confirm: boolean;
}
