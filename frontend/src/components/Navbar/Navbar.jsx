import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { HiHome, HiDocumentSearch, HiClipboardList, HiAcademicCap, HiMoon, HiSun, HiMenu, HiX } from "react-icons/hi";
import "./Navbar.css";

const NAV_LINKS = [
  { to: "/",         label: "Home",      icon: <HiHome /> },
  { to: "/analyze",  label: "Analyze",   icon: <HiDocumentSearch /> },
  { to: "/history",  label: "History",   icon: <HiClipboardList /> },
  { to: "/resources",label: "Resources", icon: <HiAcademicCap /> },
];

const Navbar = ({ theme, toggleTheme }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Handle body scroll lock when menu is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isMenuOpen]);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar__inner">

        {/* ---- Brand / Logo ---- */}
        <NavLink to="/" className="navbar__brand" aria-label="Go to home" onClick={() => isMenuOpen && setIsMenuOpen(false)}>
          <motion.div 
            className="navbar__logo-icon" 
            aria-hidden="true"
            whileHover={{ rotate: 12, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            ✨
          </motion.div>
          <div className="navbar__brand-text">
            <span className="navbar__brand-name">ResumeAI</span>
            <span className="navbar__brand-sub">Career Analyzer</span>
          </div>
        </NavLink>

        {/* ---- Desktop Links ---- */}
        <ul className="navbar__links">
          {NAV_LINKS.map(({ to, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  "navbar__link" + (isActive ? " active" : "")
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* ---- Right side controls ---- */}
        <div className="navbar__controls">
          <motion.button
            className="theme-toggle"
            onClick={toggleTheme}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <HiSun /> : <HiMoon />}
          </motion.button>

          <button 
            className={`navbar__hamburger ${isMenuOpen ? "is-active" : ""}`}
            onClick={toggleMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <HiX /> : <HiMenu />}
          </button>
        </div>
      </div>

      {/* ---- Mobile Menu Dropdown ---- */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              className="navbar__overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div 
              className="navbar__mobile-menu"
              initial={{ x: "-50%", y: -20, opacity: 0 }}
              animate={{ x: "-50%", y: 0, opacity: 1 }}
              exit={{ x: "-50%", y: -20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <ul className="navbar__mobile-links">
                {NAV_LINKS.map(({ to, label, icon }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={to === "/"}
                      className={({ isActive }) =>
                        "navbar__mobile-link" + (isActive ? " active" : "")
                      }
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="nav-icon">{icon}</span>
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;

