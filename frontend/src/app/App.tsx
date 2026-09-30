import React, { useState } from 'react';
import { ShieldCheck, Moon, Sun } from 'lucide-react';

export default function App(): React.ReactElement {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = (): void => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <header className="border-b border-surface-borderLight dark:border-surface-borderDark bg-surface-cardLight dark:bg-surface-cardDark px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-brand-600 flex items-center justify-center text-white font-semibold">
            CR
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Contract Review System v2.0
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Food Empire Vietnam • Firestore & Modular Architecture
            </p>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="p-2 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 flex flex-col items-center justify-center text-center">
        <div className="p-4 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mb-4 border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
          Hệ thống Đã Sẵn Sàng (Phase 1 Initialized)
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
          Kiến trúc Clean Modular, Firestore Security Rules và Shared Primitives đã được thiết lập thành công.
        </p>
      </main>

      <footer className="border-t border-surface-borderLight dark:border-surface-borderDark py-4 text-center text-xs text-slate-400">
        © 2026 Food Empire Vietnam. All rights reserved.
      </footer>
    </div>
  );
}
