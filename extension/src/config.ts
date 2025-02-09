import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const paths = {
  extensionDist: resolve(__dirname, '../../dist'),
  popup: resolve(__dirname, '../../popup.html'),
  background: resolve(__dirname, '../../background.js'),
  extension: resolve(__dirname, '../../dist')
};