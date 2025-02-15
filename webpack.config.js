const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    settings: './extension/src/settings/Settings.ts',
    encryption: './extension/src/services/encryption.ts'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'extension/dist'),
  },
};