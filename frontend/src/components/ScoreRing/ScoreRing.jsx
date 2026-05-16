/**
 * components/ScoreRing/ScoreRing.jsx
 * ---------------------------------------------------------------
 * Animated SVG circular progress ring for the ATS score.
 *
 * Props
 * -----
 *   score : number  — 0 to 100
 *   size  : number  — SVG diameter in px (default 160)
 * ---------------------------------------------------------------
 */

import React, { useEffect, useState, memo } from "react";
import "./ScoreRing.css";

const ScoreRing = ({ score = 0, size = 160 }) => {
  const [animated, setAnimated] = useState(false);

  // Trigger animation after mount so the ring "fills in"
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = (size - 20) / 2;          // inner radius (leaves room for stroke)
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, score));
  const offset = circumference - (clampedScore / 100) * circumference;

  // Pick colour class based on score value
  const colorClass =
    clampedScore >= 80 ? "score-ring__progress--high"
    : clampedScore >= 50 ? "score-ring__progress--mid"
    : "score-ring__progress--low";

  return (
    <div className="score-ring">
      <div className="score-ring__wrapper" style={{ width: size, height: size }}>
        {/* SVG ring */}
        <svg
          className="score-ring__svg"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-label={`ATS Score: ${clampedScore} out of 100`}
          role="img"
        >
          {/* Grey background track */}
          <circle
            className="score-ring__track"
            cx={size / 2}
            cy={size / 2}
            r={radius}
          />

          {/* Coloured progress arc */}
          <circle
            className={`score-ring__progress ${colorClass}`}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={animated ? offset : circumference}
          />
        </svg>

        {/* Score number in the centre */}
        <div
          className="score-ring__center"
          style={{ width: size, height: size }}
        >
          <span className="score-ring__value">{clampedScore}</span>
          <span className="score-ring__label-inner">/ 100</span>
        </div>
      </div>

      <p className="score-ring__title">ATS Score</p>
    </div>
  );
};

export default memo(ScoreRing);
