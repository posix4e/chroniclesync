import { copyFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Creates a Vite plugin that copies files after build
 * @param sourceDir - Source directory
 * @param targetDir - Target directory
 * @param files - Array of files to copy
 */
export function createCopyFilesPlugin(sourceDir: string, targetDir: string, files: string[]) {
  return {
    name: 'copy-files',
    closeBundle: () => {
      for (const file of files) {
        try {
          copyFileSync(resolve(sourceDir, file), resolve(targetDir, file));
        } catch (error) {
          console.warn(`Warning: Could not copy ${file}: ${error}`);
        }
      }
    }
  };
}

/**
 * Common Vite build configuration options
 */
export const commonBuildOptions = {
  emptyOutDir: true,
  rollupOptions: {
    output: {
      format: 'es',
    }
  }
};

/**
 * Common Vite server configuration
 */
export const commonServerOptions = {
  host: '0.0.0.0',
  cors: true
};