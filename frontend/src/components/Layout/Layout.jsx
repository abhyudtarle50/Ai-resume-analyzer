import { Outlet, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../Navbar/Navbar";
import { HiLightningBolt, HiStar, HiHeart } from "react-icons/hi";
import "./Layout.css";

const Layout = ({ theme, toggleTheme }) => {
  const location = useLocation();

  return (
    <div className="layout">

      {/* Sticky top navbar */}
      <Navbar theme={theme} toggleTheme={toggleTheme} />

      {/* Active page renders here with motion transitions */}
      <main className="layout__main" id="main-content">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="layout__footer" aria-label="Site footer">
        <div className="layout__footer-inner">

          <div className="layout__footer-brand">
            <span className="footer-logo"><HiLightningBolt /></span>
            <div className="footer-text">
              <strong>ResumeAI</strong>
              <span>Powered by Sarvam AI</span>
            </div>
          </div>

          <div className="layout__footer-center">
            <p className="layout__footer-copy">
              Built with <HiHeart style={{ color: "#ef4444" }} /> for modern job seekers.
            </p>
          </div>

          <ul className="layout__footer-links">
            <li><Link to="/analyze">Analyze</Link></li>
            <li><Link to="/history">History</Link></li>
            <li><Link to="/resources">Resources</Link></li>
          </ul>

        </div>
      </footer>

    </div>
  );
};

export default Layout;
