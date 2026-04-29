import React, { useState, useEffect } from 'react';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const [theme, setTheme] = useState(() => {
    // 从 localStorage 读取主题，默认为 dark
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'dark';
  });

  useEffect(() => {
    // 应用主题到 document
    document.documentElement.setAttribute('data-theme', theme);
    // 保存到 localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      className="action-btn theme-toggle"
      onClick={toggleTheme}
      title={theme === 'light' ? '切换到夜间模式' : '切换到白天模式'}
    >
      {theme === 'light' ? '☾' : '☀'}
    </button>
  );
};

export default ThemeToggle;
