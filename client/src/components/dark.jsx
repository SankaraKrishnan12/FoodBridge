import React, { useState, useEffect } from 'react';

function DarkModeToggle() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.theme === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      window.localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      window.localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="ml-4 px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
      aria-label="Toggle Dark Mode"
      title="Toggle Dark Mode"
    >
      {darkMode ? '🌙' : '☀️'}
    </button>
  );
}
export default DarkModeToggle;