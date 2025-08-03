// src/theme.js

export function toggleThemeFactory(ctx) {
  return function toggleTheme() {
    ctx.isDarkMode = !ctx.isDarkMode;
    localStorage.setItem('darkMode', ctx.isDarkMode);
  };
}