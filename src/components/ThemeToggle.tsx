'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Initialize theme
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    // Default to light theme
    const initialTheme = savedTheme || 'light';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }


  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // DEBUG: Check if theme toggle works
    console.log('Theme Toggle:', {
      newTheme,
      primaryColor: getComputedStyle(document.documentElement).getPropertyValue('--primary'),
      dataThemeAttr: document.documentElement.getAttribute('data-theme')
    });
  };

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg text-foreground hover:text-primary ${className || ''}`}
      aria-label="Toggle theme"
      style={{
        // DEBUG: Inline style test
        // '--debug-primary': 'var(--primary)',
        // border: '1px solid var(--primary)'
      } as React.CSSProperties}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  );
};

export default ThemeToggle; 