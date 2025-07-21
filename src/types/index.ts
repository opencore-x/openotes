export interface openotesConfig {
  notesDirectory: string;
  maxSearchResults?: number;
  defaultFilePattern?: string;
  excludePatterns?: string[];
}

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

export interface OrganizationStrategy {
  type: 'byTopic' | 'byDate' | 'byTag' | 'custom';
  criteria?: any;
}