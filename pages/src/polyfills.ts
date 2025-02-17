import { Buffer } from 'buffer';

// Add Buffer to window
(window as any).Buffer = Buffer;

// Add minimal process implementation to window
(window as any).process = {
  env: {},
  nextTick: (_fn: (..._args: any[]) => void, ..._args: any[]) => {
    setTimeout(() => _fn(..._args), 0);
  }
};