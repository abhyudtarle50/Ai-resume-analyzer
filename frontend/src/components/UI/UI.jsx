import { motion } from "framer-motion";
import { HiExclamationCircle, HiRefresh } from "react-icons/hi";

/**
 * Spinner - A modern, high-quality loading indicator.
 */
export const Spinner = ({ size = "md", color = "var(--brand)" }) => {
  const sizes = {
    sm: "20px",
    md: "40px",
    lg: "64px"
  };

  return (
    <motion.div
      style={{
        width: sizes[size],
        height: sizes[size],
        border: `3px solid var(--border-color)`,
        borderTopColor: color,
        borderRadius: "50%",
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
};

/**
 * ErrorMessage - Displays errors with an icon and a retry button.
 */
export const ErrorMessage = ({ message, onRetry }) => (
  <motion.div 
    className="error-banner"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <HiExclamationCircle className="error-banner__icon" />
    <div className="error-banner__text">
      <p>{message}</p>
      {onRetry && (
        <button className="btn-text" onClick={onRetry} style={{ marginTop: "4px", color: "inherit", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
          <HiRefresh /> Try Again
        </button>
      )}
    </div>
  </motion.div>
);

/**
 * Badge - Small status pill.
 */
export const Badge = ({ children, variant = "default" }) => (
  <span className={`badge badge--${variant}`}>
    {children}
  </span>
);
