import '@testing-library/jest-dom';

// Ensure unit tests run in mock dev environment, decoupled from local emulator state
(import.meta.env as Record<string, string>).VITE_USE_EMULATORS = 'false';

// Mock window.matchMedia for JSDOM
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Mock window.localStorage for JSDOM
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string): string | null => store[key] || null,
    setItem: (key: string, value: string): void => {
      store[key] = value.toString();
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock URL.createObjectURL and URL.revokeObjectURL for JSDOM
if (typeof URL !== 'undefined') {
  if (!URL.createObjectURL) {
    URL.createObjectURL = () => `blob:http://localhost/mock-blob-${Math.random().toString(36).substring(2)}`;
  }
  if (!URL.revokeObjectURL) {
    URL.revokeObjectURL = () => {};
  }
}
