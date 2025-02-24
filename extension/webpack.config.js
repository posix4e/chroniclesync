import { resolve } from 'path';
import { fileURLToPath } from 'url';
import CopyPlugin from 'copy-webpack-plugin';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default {
  entry: {
    background: './src/background.ts',
    popup: './src/popup.tsx',
    history: './src/history.tsx'
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
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'popup.html', to: '.' },
        { from: 'popup.css', to: '.' },
        { from: 'history.html', to: '.' },
        { from: 'history.css', to: '.' },
        { from: 'settings.html', to: '.' },
        { from: 'settings.css', to: '.' },
        { from: 'manifest.json', to: '.' }
      ]
    })
  ]
};