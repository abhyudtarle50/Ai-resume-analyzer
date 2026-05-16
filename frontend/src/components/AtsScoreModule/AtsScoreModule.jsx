import React from "react";
import { motion } from "framer-motion";
import ScoreRing from "../ScoreRing/ScoreRing";
import "./AtsScoreModule.css";

const scoreDescription = (score) => {
  if (score >= 85) return "Excellent! Your resume is highly ATS-optimised.";
  if (score >= 70) return "Good score. A few targeted improvements could push you into the top tier.";
  if (score >= 50) return "Moderate score. There are clear areas to work on.";
  return "Your resume needs significant improvement to clear ATS systems.";
};

const factorNames = {
  formatting: "Formatting & Structure",
  keywords: "Keyword Optimization",
  projects: "Project Quality",
  experience: "Experience Relevance",
  readability: "Readability & Tone"
};

const AtsScoreModule = ({ score, breakdown = {} }) => {
  return (
    <motion.div 
      className="ats-module-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="ats-module-header">
        <h3 className="ats-module-title">ATS Compatibility</h3>
        <span className="ats-module-badge">Powered by AI</span>
      </div>

      <div className="ats-module-content">
        <div className="ats-module-score-section">
          <ScoreRing score={score} size={140} />
          <div className="ats-module-score-text">
            <h4 className="ats-module-score-value">{score}/100</h4>
            <p className="ats-module-score-desc">{scoreDescription(score)}</p>
          </div>
        </div>

        {Object.keys(breakdown).length > 0 && (
          <div className="ats-module-breakdown">
            <h4 className="ats-module-factors-title">Score Breakdown</h4>
            <div className="ats-module-bars">
              {Object.entries(breakdown).map(([key, val], idx) => {
                const label = factorNames[key] || key;
                return (
                  <motion.div 
                    key={key}
                    className="ats-bar-container"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + (idx * 0.1) }}
                  >
                    <div className="ats-bar-header">
                      <span className="ats-bar-label">{label}</span>
                      <span className="ats-bar-value">{val}%</span>
                    </div>
                    <div className="ats-bar-track">
                      <motion.div 
                        className="ats-bar-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${val}%` }}
                        transition={{ duration: 0.8, delay: 0.3 + (idx * 0.1) }}
                        style={{
                          backgroundColor: val >= 80 ? "var(--success)" : val >= 50 ? "var(--warning)" : "var(--error)"
                        }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default React.memo(AtsScoreModule);
