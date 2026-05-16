/**
 * components/ProgressBar/ProgressBar.jsx
 * ---------------------------------------------------------------
 * Animated horizontal progress bar for the ATS score.
 *
 * Props
 * -----
 *   score : number  — 0 to 100
 *   label : string  — text above the bar (default "ATS Score")
 * ---------------------------------------------------------------
 */

import { useEffect, useState } from "react";
import "./ProgressBar.css";

const ProgressBar = ({ score = 0, label = "ATS Score" }) => {
  // Start at 0 so the bar animates in on mount
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(score), 120);
    return () => clearTimeout(timer);
  }, [score]);

  const clamp = Math.min(100, Math.max(0, score));

  // Pick colour class based on score
  const colorClass =
    clamp >= 80 ? "progress-bar__fill--high"
    : clamp >= 50 ? "progress-bar__fill--mid"
    : "progress-bar__fill--low";

  // Plain-English rating
  const rating =
    clamp >= 80 ? "Excellent"
    : clamp >= 70 ? "Good"
    : clamp >= 50 ? "Average"
    : "Needs Work";

  const ratingColor =
    clamp >= 80 ? "var(--success)"
    : clamp >= 70 ? "#10b981"
    : clamp >= 50 ? "var(--warning)"
    : "var(--danger)";

  return (
    <div className="progress-bar" role="meter" aria-valuenow={clamp} aria-valuemin={0} aria-valuemax={100} aria-label={`${label}: ${clamp} out of 100`}>
      <div className="progress-bar__header">
        <span className="progress-bar__label">{label}</span>
        <span className="progress-bar__value" style={{ color: ratingColor }}>
          {clamp}
          <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-muted)" }}>/100</span>
        </span>
      </div>

      <div className="progress-bar__track">
        <div
          className={`progress-bar__fill ${colorClass}`}
          style={{ width: `${width}%` }}
        />
      </div>

      <div className="progress-bar__footer">
        <span className="progress-bar__foot-label">0 — Needs Work</span>
        <span className="progress-bar__foot-label" style={{ color: ratingColor, fontWeight: 600 }}>
          {rating}
        </span>
        <span className="progress-bar__foot-label">100 — Perfect</span>
      </div>
    </div>
  );
};

export default ProgressBar;
