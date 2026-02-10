import * as React from 'react';

// Polyfill React.act for React 19 compatibility with @testing-library/react
// @ts-expect-error - React.act may be missing in types for React 19
if (!React.act) {
  // @ts-expect-error - assigning act polyfill
  React.act = async (callback: () => void | Promise<void>) => {
    const result = callback();
    if (result instanceof Promise) {
      await result;
    }
    return result;
  };
}
