import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure longer timeout for async operations
configure({ asyncUtilTimeout: 2000 });

// Configure React 18 concurrent mode
declare global {
  let IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;