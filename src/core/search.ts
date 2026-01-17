import { FileOperations } from './files.js';
import type { SearchResult, SearchMatch, NoteSection } from '../types/index.js';

export class SearchEngine {
  static async searchContent(
    rootDir: string,
    query: string,
    filePattern?: string,
    maxResults: number = 50
  ): Promise<SearchResult[]> {
    const files = await FileOperations.listMarkdownFiles(rootDir);
    const results: SearchResult[] = [];

    const filteredFiles = filePattern
      ? files.filter((file) => file.includes(filePattern))
      : files;

    for (const filePath of filteredFiles) {
      try {
        const content = await FileOperations.readFile(filePath);
        const matches = this.findMatches(content, query);

        if (matches.length > 0) {
          results.push({
            path: filePath,
            matches,
            score: this.calculateScore(matches, query),
          });
        }
      } catch {
        continue;
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
  }

  static async searchFilenames(
    rootDir: string,
    query: string,
    maxResults: number = 50
  ): Promise<string[]> {
    const files = await FileOperations.listMarkdownFiles(rootDir);
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    return files
      .filter((file) => {
        const filename = file.split('/').pop() || '';
        return regex.test(filename);
      })
      .slice(0, maxResults);
  }

  private static findMatches(content: string, query: string): SearchMatch[] {
    const matches: SearchMatch[] = [];
    const lines = content.split('\n');
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

    lines.forEach((line, lineIndex) => {
      let match;
      while ((match = regex.exec(line)) !== null) {
        matches.push({
          line: lineIndex + 1,
          content: line.trim(),
          start: match.index,
          end: match.index + match[0].length,
        });

        if (match[0].length === 0) {
          regex.lastIndex++;
        }
      }
    });

    return matches;
  }

  private static calculateScore(matches: SearchMatch[], query: string): number {
    let score = 0;

    for (const match of matches) {
      score += 1;

      if (match.content.includes(query)) {
        score += 0.5;
      }

      if (match.start === 0 || match.content.charAt(match.start - 1) === ' ') {
        score += 0.3;
      }

      if (match.content.length > 200) {
        score -= 0.1;
      }
    }

    return score;
  }

  static extractSections(content: string): NoteSection[] {
    const lines = content.split('\n');
    const sections: NoteSection[] = [];
    let currentSection: NoteSection | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headingMatch) {
        if (currentSection) {
          currentSection.lineEnd = i - 1;
          sections.push(currentSection);
        }

        currentSection = {
          heading: headingMatch[2],
          level: headingMatch[1].length,
          content: '',
          lineStart: i,
          lineEnd: lines.length - 1,
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }
}
