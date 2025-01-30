import path from 'path';

export const config = {
  workerUrl: process.env.WORKER_URL || 'http://localhost:53217'
};

export const paths = {
  extension: path.resolve(__dirname, '../dist'),
  manifest: path.resolve(__dirname, '../dist/manifest.json'),
  background: path.resolve(__dirname, '../dist/background.js'),
  popup: path.resolve(__dirname, '../dist/popup.html')
};