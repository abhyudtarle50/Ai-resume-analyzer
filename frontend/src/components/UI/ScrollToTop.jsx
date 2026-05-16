import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop Component
 * ---------------------------------------------------------------
 * Automatically scrolls the window to the top (0,0) whenever
 * the route (pathname) changes. This prevents the "scroll reset"
 * glitch where you navigate to a new page but stay at the bottom.
 * ---------------------------------------------------------------
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Immediate scroll to prevent visual flicker
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
