import path from 'path';

export const testConfig = {
  extensionPath: path.join(__dirname, '../../../extension'),
  headless: false,
  getExtensionArgs(extensionPath: string) {
    return [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ];
  }
};