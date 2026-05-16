/**
 * App.jsx
 * ---------------------------------------------------------------
 * Root component — owns the router and the theme state.
 *
 * Route tree:
 *   /             → Home
 *   /analyze      → Analyze
 *   /history      → History
 *   /resources    → Resources
 *   *             → 404 (Not Found)
 *
 * The <Layout> component wraps every route and renders the
 * Navbar + Footer around the active page via <Outlet />.
 * ---------------------------------------------------------------
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useTheme from "./hooks/useTheme";

// Layout shell
import Layout from "./components/Layout/Layout";
import ScrollToTop from "./components/UI/ScrollToTop";

// Pages (lazy-loaded for better performance)
import { lazy, Suspense } from "react";

import Home      from "./pages/Home/Home";
import Analyze   from "./pages/Analyze/Analyze";
import History   from "./pages/History/History";
import Resources from "./pages/Resources/Resources";

// ---- Loading spinner shown while a page chunk is fetching ----
const PageLoader = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "60vh",
    }}
  >
    <div className="modern-spinner" />
  </div>
);

const App = () => {
  // Theme state lives here so Navbar can receive it as a prop
  const { theme, toggleTheme } = useTheme();

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout theme={theme} toggleTheme={toggleTheme} />}>
          <Route path="/"          element={<Home />} />
          <Route path="/analyze"   element={<Analyze />} />
          <Route path="/history"   element={<History />} />
          <Route path="/resources" element={<Resources />} />

          {/* Catch-all: redirect unknown URLs to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;

