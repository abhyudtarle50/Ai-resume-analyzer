/**
 * main.jsx
 * ---------------------------------------------------------------
 * Application entry point.
 * Mounts the React app into index.html's <div id="root">.
 * Global CSS is imported here — once — so it applies everywhere.
 * ---------------------------------------------------------------
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Global styles (must be first so component styles can override)
import "./styles/global.css";

import App from "./App";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
