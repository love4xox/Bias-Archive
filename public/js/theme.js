/* global localStorage, window, document */

const ThemeManager = {
    init: function () {
      const savedTheme = localStorage.getItem('bias_archive_theme');
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        this.setDarkMode(true);
      } else {
        this.setDarkMode(false);
      }
  
      const toggleBtn = document.getElementById('themeToggle');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => this.toggle());
      }
    },
  
    setDarkMode: function (isDark) {
      const themeIcon = document.getElementById('themeIcon');
      const themeText = document.getElementById('themeText');
      
      if (isDark) {
        document.body.classList.add('dark-mode');
        if (themeIcon) themeIcon.textContent = '🌙';
        if (themeText) themeText.textContent = '다크';
        localStorage.setItem('bias_archive_theme', 'dark');
      } else {
        document.body.classList.remove('dark-mode');
        if (themeIcon) themeIcon.textContent = '☀️';
        if (themeText) themeText.textContent = '라이트';
        localStorage.setItem('bias_archive_theme', 'light');
      }
    },
  
    toggle: function () {
      const isDark = document.body.classList.contains('dark-mode');
      this.setDarkMode(!isDark);
    }
  };
  
  document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
  });