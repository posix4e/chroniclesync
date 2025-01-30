export const config = {
  workerUrl: process.env.WORKER_URL || 'http://localhost:53217'
};

export const paths = {
  extension: './dist',
  manifest: './dist/manifest.json',
  background: './dist/background.js',
  popup: './dist/popup.html'
};