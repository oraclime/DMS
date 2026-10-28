// Browser compatibility polyfills for ES2024 APIs used by pdfjs-dist v6
const PromiseWithResolvers = Promise as unknown as {
  withResolvers?: <T>() => {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
  };
};
if (typeof PromiseWithResolvers.withResolvers !== 'function') {
  PromiseWithResolvers.withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

if (typeof URL !== 'undefined' && typeof (URL as unknown as { parse?: unknown }).parse !== 'function') {
  (URL as unknown as { parse: (url: string | URL, base?: string | URL) => URL | null }).parse = function (
    url: string | URL,
    base?: string | URL
  ): URL | null {
    try {
      return base !== undefined ? new URL(url, base) : new URL(url);
    } catch {
      return null;
    }
  };
}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

