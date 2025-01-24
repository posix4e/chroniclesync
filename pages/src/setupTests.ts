import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure longer timeout for async operations
configure({ asyncUtilTimeout: 2000 });

// Configure React 18 concurrent mode
declare global {
  interface Window {
    IS_REACT_ACT_ENVIRONMENT: boolean;
  }
}

window.IS_REACT_ACT_ENVIRONMENT = true;