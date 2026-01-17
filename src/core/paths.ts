import { promises as fs } from 'fs';
import { join, normalize, isAbsolute } from 'path';

export class PathValidator {
  private vaultRoot: string;

  constructor(vaultRoot: string) {
    this.vaultRoot = vaultRoot;
  }

  async resolve(relativePath: string): Promise<string> {
    // 1. Reject absolute paths
    if (isAbsolute(relativePath)) {
      throw new Error('Absolute paths are not allowed');
    }

    // 2. Reject path traversal attempts
    if (relativePath.includes('..')) {
      throw new Error('Path traversal (..) is not allowed');
    }

    // 3. Reject null bytes (security vulnerability)
    if (relativePath.includes('\0')) {
      throw new Error('Null bytes in path are not allowed');
    }

    // 4. Normalize the path
    const normalizedPath = normalize(relativePath);

    // 5. Join with vault root
    const resolvedPath = join(this.vaultRoot, normalizedPath);

    // 6. Verify result is within vault root
    if (!resolvedPath.startsWith(this.vaultRoot)) {
      throw new Error('Path escapes vault directory');
    }

    // 7. Check for symlink escape (follow symlinks and verify real path)
    try {
      const realPath = await fs.realpath(resolvedPath);
      if (!realPath.startsWith(this.vaultRoot)) {
        throw new Error('Symlink escapes vault directory');
      }
    } catch (error) {
      // File doesn't exist yet - that's OK for create operations
      // We still validate parent directory for symlink escape
      const parentDir = join(resolvedPath, '..');
      try {
        const realParentPath = await fs.realpath(parentDir);
        if (!realParentPath.startsWith(this.vaultRoot)) {
          throw new Error('Parent directory symlink escapes vault directory');
        }
      } catch {
        // Parent doesn't exist either - we'll handle during file creation
      }
    }

    return resolvedPath;
  }

  toRelative(absolutePath: string): string {
    if (!absolutePath.startsWith(this.vaultRoot)) {
      throw new Error('Path is not within vault directory');
    }
    return absolutePath.slice(this.vaultRoot.length + 1);
  }
}
