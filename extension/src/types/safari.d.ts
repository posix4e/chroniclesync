/**
 * Type definitions for Safari extension API
 */

interface SafariExtensionSettings {
  getItem(key: string): any;
  setItem(key: string, value: any): void;
  removeItem(key: string): void;
  key(index: number): string | null;
  readonly length: number;
}

interface SafariExtension {
  settings: SafariExtensionSettings;
  dispatchMessage(name: string, message: any): void;
}

interface SafariPage {
  dispatchMessage(name: string, message: any): void;
}

interface SafariTab {
  id: number;
  url: string;
  title: string;
  page: SafariPage;
}

interface SafariBrowserWindow {
  activeTab: SafariTab;
  tabs: SafariTab[];
  openTab(): SafariTab;
}

interface SafariApplication {
  activeBrowserWindow: SafariBrowserWindow;
  browserWindows: SafariBrowserWindow[];
  addEventListener(type: string, listener: (event: any) => void): void;
}

interface SafariEventTarget {
  addEventListener(type: string, listener: (event: any) => void): void;
  removeEventListener(type: string, listener: (event: any) => void): void;
}

interface SafariGlobal {
  extension: SafariExtension;
  application: SafariApplication;
  self: SafariEventTarget;
}

declare var safari: SafariGlobal;