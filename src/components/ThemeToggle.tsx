'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

const ThemeToggle = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // 初始化主题
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);

    // DEBUG: 检查CSS变量是否正确加载
    console.log('Theme Debug:', {
      theme: initialTheme,
      primaryColor: getComputedStyle(document.documentElement).getPropertyValue('--primary'),
      dataThemeAttr: document.documentElement.getAttribute('data-theme'),
      allCSSVars: Object.fromEntries(
        Array.from(getComputedStyle(document.documentElement))
          .filter(prop => prop.startsWith('--'))
          .map(prop => [prop, getComputedStyle(document.documentElement).getPropertyValue(prop)])
      )
    });
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // DEBUG: 检查主题切换是否生效
    console.log('Theme Toggle:', {
      newTheme,
      primaryColor: getComputedStyle(document.documentElement).getPropertyValue('--primary'),
      dataThemeAttr: document.documentElement.getAttribute('data-theme')
    });
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg text-primary hover:text-primary"
      aria-label="Toggle theme"
      style={{
        // DEBUG: 内联样式测试
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