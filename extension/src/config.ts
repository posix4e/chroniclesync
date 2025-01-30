import * as path from 'path';

export const config = {
  workerUrl: process.env.WORKER_URL || 'http://localhost:53217'
};

export const paths = {
  extension: path.resolve(process.cwd(), 'dist'),
  manifest: path.resolve(process.cwd(), 'dist/manifest.json'),
  background: path.resolve(process.cwd(), 'dist/background.js'),
  popup: path.resolve(process.cwd(), 'dist/popup.html')
};