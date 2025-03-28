/**
 * This file contains browser-compatible build utilities
 * For Node.js-specific utilities, see node-build-utils.ts
 */

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