import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default {
  experiments: {
    topLevelAwait: true,
  },
  entry: {
    background: './src/background.ts',
    popup: './src/popup.tsx',
    history: './src/history.tsx',
    devtools: './src/devtools.tsx',
    'devtools-page': './src/devtools-page.ts'
  },
  output: {
    path: resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  }
};