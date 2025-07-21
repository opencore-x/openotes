import { FileOperations } from './file-operations.js';
import type { SearchResult, SearchMatch } from '../types/index.js';

export class SearchEngine {
  
  static async searchContent(
    rootDir: string, 
    query: string, 
    filePattern?: string,
    maxResults: number = 50
  ): Promise<SearchResult[]> {
    const files = await FileOperations.listMarkdownFiles(rootDir);
    const results: SearchResult[] = [];
    
    // Filter by file pattern if provided
    const filteredFiles = filePattern 
      ? files.filter(file => file.includes(filePattern))
      : files;

    for (const filePath of filteredFiles) {
      try {
        const content = await FileOperations.readFile(filePath);
        const matches = this.findMatches(content, query);
        
        if (matches.length > 0) {
          results.push({
            path: filePath,
            matches,
            score: this.calculateScore(matches, query)
          });
        }
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }

    // Sort by score (highest first) and limit results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  static async searchFilenames(
    rootDir: string, 
    query: string,
    maxResults: number = 50
  ): Promise<string[]> {
    const files = await FileOperations.listMarkdownFiles(rootDir);
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    
    return files
      .filter(file => {
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
          end: match.index + match[0].length
        });
        
        // Reset regex.lastIndex to find overlapping matches
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
      // Base score for each match
      score += 1;
      
      // Bonus for exact case match
      if (match.content.includes(query)) {
        score += 0.5;
      }
      
      // Bonus for matches at start of line
      if (match.start === 0 || match.content.charAt(match.start - 1) === ' ') {
        score += 0.3;
      }
      
      // Penalty for very long lines (less readable)
      if (match.content.length > 200) {
        score -= 0.1;
      }
    }

    return score;
  }

  static extractSections(content: string): Array<{heading: string, level: number, content: string, lineStart: number, lineEnd: number}> {
    const lines = content.split('\n');
    const sections = [];
    let currentSection = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      
      if (headingMatch) {
        // Save previous section
        if (currentSection) {
          currentSection.lineEnd = i - 1;
          sections.push(currentSection);
        }
        
        // Start new section
        currentSection = {
          heading: headingMatch[2],
          level: headingMatch[1].length,
          content: '',
          lineStart: i,
          lineEnd: lines.length - 1
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    }
    
    // Add final section
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  }
}