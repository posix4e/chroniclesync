import '@testing-library/jest-dom';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

// Configure React 18 concurrent mode
globalThis.IS_REACT_ACT_ENVIRONMENT = true;