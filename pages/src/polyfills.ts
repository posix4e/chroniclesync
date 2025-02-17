import { Buffer } from 'buffer';

// Add Buffer to window
(window as any).Buffer = Buffer;

// Add process to window
(window as any).process = {
  env: {},
  browser: true,
  version: '',
  nextTick: (fn: Function, ...args: any[]) => setTimeout(() => fn(...args), 0)
};