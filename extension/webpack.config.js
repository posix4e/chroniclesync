import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Get browser target from environment variable (defaults to chrome)
const browserTarget = process.env.BROWSER || 'chrome';

// Define browser-specific configurations
const browserConfigs = {
  chrome: {
    outputPath: resolve(__dirname, 'dist/chrome'),
    // Chrome-specific settings if needed
  },
  firefox: {
    outputPath: resolve(__dirname, 'dist/firefox'),
    // Firefox-specific settings if needed
  },
  safari: {
    outputPath: resolve(__dirname, 'dist/safari'),
    // Safari-specific settings if needed
  }
};

// Get config for the current browser target
const currentBrowserConfig = browserConfigs[browserTarget] || browserConfigs.chrome;

export default {
  entry: {
    background: './src/background.ts',
    popup: './src/popup.tsx',
    history: './src/history.tsx',
    devtools: './src/devtools.tsx',
    'devtools-page': './src/devtools-page.ts',
    'content-script': './src/content-script.ts'
  },
  output: {
    path: currentBrowserConfig.outputPath,
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              compilerOptions: {
                // Define browser-specific compiler options if needed
              }
            }
          }
        ],
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      // Define browser-specific aliases if needed
      '@browser-api': resolve(__dirname, `src/browser-api/${browserTarget}`),
    }
  },
  // Pass the browser target to the code
  plugins: [
    new (class BrowserEnvPlugin {
      apply(compiler) {
        compiler.hooks.thisCompilation.tap('BrowserEnvPlugin', compilation => {
          compilation.hooks.processAssets.tap(
            {
              name: 'BrowserEnvPlugin',
              stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
            },
            () => {
              // This will be available at build time
              process.env.BROWSER_TARGET = browserTarget;
            }
          );
        });
      }
    })()
  ]
};