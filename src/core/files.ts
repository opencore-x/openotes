import { promises as fs } from 'fs';
import { join, dirname, extname, basename } from 'path';
import type { FileMetadata, DirectoryStructure } from '../types/index.js';

export class FileOperations {
  static async exists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  static async ensureDirectory(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  static async listMarkdownFiles(
    rootDir: string,
    pattern: string = '**/*.md',
    excludePatterns: string[] = []
  ): Promise<string[]> {
    const files: string[] = [];
    await this.walkDirectory(rootDir, (filePath) => {
      if (extname(filePath).toLowerCase() === '.md') {
        const relativePath = filePath.replace(rootDir, '').substring(1);
        const shouldExclude = excludePatterns.some((pattern) =>
          relativePath.includes(pattern.replace('**/', '').replace('/**', ''))
        );
        if (!shouldExclude) {
          files.push(filePath);
        }
      }
    });

    return files;
  }

  private static async walkDirectory(
    dir: string,
    callback: (filePath: string) => void
  ): Promise<void> {
    const items = await fs.readdir(dir);

    for (const item of items) {
      if (item.startsWith('.')) continue;

      const itemPath = join(dir, item);
      const stats = await fs.stat(itemPath);

      if (stats.isDirectory()) {
        await this.walkDirectory(itemPath, callback);
      } else {
        callback(itemPath);
      }
    }
  }

  static async getFileMetadata(filePath: string): Promise<FileMetadata> {
    const stats = await fs.stat(filePath);

    return {
      path: filePath,
      name: basename(filePath),
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      isDirectory: stats.isDirectory(),
    };
  }

  static async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }

  static async writeFile(filePath: string, content: string): Promise<void> {
    await this.ensureDirectory(dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
  }

  static async appendFile(filePath: string, content: string): Promise<void> {
    await fs.appendFile(filePath, content, 'utf-8');
  }

  static async editFile(
    filePath: string,
    oldContent: string,
    newContent: string
  ): Promise<void> {
    const content = await this.readFile(filePath);

    if (!content.includes(oldContent)) {
      throw new Error('old_content not found in file');
    }

    const updatedContent = content.replace(oldContent, newContent);
    await fs.writeFile(filePath, updatedContent, 'utf-8');
  }

  static async moveFile(source: string, destination: string): Promise<void> {
    await this.ensureDirectory(dirname(destination));
    await fs.rename(source, destination);
  }

  static async deleteFile(filePath: string): Promise<void> {
    await fs.unlink(filePath);
  }

  static async getDirectoryStructure(
    rootDir: string
  ): Promise<DirectoryStructure> {
    const stats = await fs.stat(rootDir);
    const name = basename(rootDir);

    if (!stats.isDirectory()) {
      return {
        name,
        path: rootDir,
        isDirectory: false,
      };
    }

    const children: DirectoryStructure[] = [];
    const items = await fs.readdir(rootDir);

    for (const item of items) {
      if (item.startsWith('.')) continue;

      const itemPath = join(rootDir, item);
      const childStructure = await this.getDirectoryStructure(itemPath);
      children.push(childStructure);
    }

    return {
      name,
      path: rootDir,
      isDirectory: true,
      children: children.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      }),
    };
  }

  static async readMultipleFiles(
    filePaths: string[]
  ): Promise<{ path: string; content: string }[]> {
    const results = await Promise.allSettled(
      filePaths.map(async (path) => ({
        path,
        content: await this.readFile(path),
      }))
    );

    return results
      .filter(
        (result): result is PromiseFulfilledResult<{ path: string; content: string }> =>
          result.status === 'fulfilled'
      )
      .map((result) => result.value);
  }
}
