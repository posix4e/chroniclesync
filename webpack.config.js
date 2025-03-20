const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const extensionResourcesPath = path.resolve(__dirname, 'extension/ChronicleSync/Shared (Extension)/Resources');
const srcPath = path.resolve(__dirname, 'src');
const outputPath = path.resolve(__dirname, 'dist');

module.exports = {
  mode: 'production',
  entry: {
    // Use source files from extension directory for now
    // As we refactor, we'll move these to the src directory
    background: path.join(extensionResourcesPath, 'background.js'),
    'content-script': path.join(extensionResourcesPath, 'content-script.js'),
    popup: path.join(extensionResourcesPath, 'popup.js'),
    history: path.join(extensionResourcesPath, 'history.js'),
    settings: path.join(extensionResourcesPath, 'settings.js'),
    // Add common utilities
    'utils/common': path.join(srcPath, 'js/utils/common.js'),
    // Add database module
    'db/index': path.join(srcPath, 'js/db/index.js'),
  },
  output: {
    path: outputPath,
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'images/[name].[ext]',
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: path.join(extensionResourcesPath, 'popup.html'),
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new HtmlWebpackPlugin({
      template: path.join(extensionResourcesPath, 'history.html'),
      filename: 'history.html',
      chunks: ['history'],
    }),
    new HtmlWebpackPlugin({
      template: path.join(extensionResourcesPath, 'settings.html'),
      filename: 'settings.html',
      chunks: ['settings'],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.join(extensionResourcesPath, 'manifest.json'),
          to: outputPath,
          transform: (content) => {
            // Update manifest.json to use bundled files
            const manifest = JSON.parse(content.toString());
            
            // No need to modify manifest.json for now as we're keeping the same structure
            // If we need to update paths in the future, we can do it here
            
            return JSON.stringify(manifest, null, 2);
          },
        },
        {
          from: path.join(extensionResourcesPath, 'images'),
          to: path.join(outputPath, 'images'),
        },
        {
          from: path.join(extensionResourcesPath, '_locales'),
          to: path.join(outputPath, '_locales'),
        },
        {
          from: path.join(extensionResourcesPath, 'config.js'),
          to: path.join(outputPath, 'config.js'),
        },
        {
          from: path.join(extensionResourcesPath, 'db'),
          to: path.join(outputPath, 'db'),
        },
        {
          from: path.join(extensionResourcesPath, 'utils'),
          to: path.join(outputPath, 'utils'),
        },
        {
          from: path.join(extensionResourcesPath, 'popup.css'),
          to: path.join(outputPath, 'popup.css'),
        },
      ],
    }),
  ],
  resolve: {
    extensions: ['.js'],
    alias: {
      '@src': srcPath,
      '@extension': extensionResourcesPath,
      '@utils': path.join(srcPath, 'js/utils'),
      '@db': path.join(srcPath, 'js/db'),
    },
  },
};