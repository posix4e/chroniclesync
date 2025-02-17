import { Buffer } from 'buffer';

// Extend Window interface to include our additions
declare global {
  interface Window {
    Buffer: typeof Buffer;
    process: NodeJS.Process;
  }
}

// Add Buffer to window
window.Buffer = Buffer;

// Add minimal process implementation to window
const minimalProcess: Partial<NodeJS.Process> = {
  env: {},
  nextTick<T extends unknown[]>(fn: (..._args: T) => void, ..._args: T): void {
    setTimeout(() => fn(..._args), 0);
  }
};

window.process = minimalProcess as NodeJS.Process;