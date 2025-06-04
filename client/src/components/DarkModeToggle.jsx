import React, { useState, useEffect } from 'react';

export default function DarkModeToggle() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      // Check if user preference is saved in localStorage
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      // Otherwise, get system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="ml-4 p-2 rounded bg-gray-200 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
      aria-label="Toggle Dark Mode"
      title="Toggle Dark Mode"
      type="button"
    >
      {darkMode ? '🌙' : '☀️'}
    </button>
  );
}
