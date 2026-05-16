/**
 * hooks/useTheme.js
 * ---------------------------------------------------------------
 * Custom hook that manages dark / light mode for the whole app.
 *
 * HOW IT WORKS
 * ------------
 * - Reads the saved preference from localStorage on first load.
 * - Falls back to the OS preference (prefers-color-scheme) if
 *   nothing is saved yet.
 * - Applies [data-theme="dark"] to <html> so our CSS variables
 *   automatically switch colour sets.
 * - Saves the choice to localStorage so it persists on refresh.
 * ---------------------------------------------------------------
 */

import { useState, useLayoutEffect } from "react";

const useTheme = () => {
  // Determine the initial theme
  const getInitialTheme = () => {
    if (typeof window === "undefined") return "light"; // SSR safety
    const saved = localStorage.getItem("theme");
    if (saved) return saved;

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const [theme, setTheme] = useState(getInitialTheme);

  // Apply theme to <html> and persist to localStorage
  // useLayoutEffect runs BEFORE paint, preventing the flash.
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (root.getAttribute("data-theme") !== theme) {
      root.setAttribute("data-theme", theme);
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Toggle between dark and light
  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return { theme, toggleTheme };
};

export default useTheme;
