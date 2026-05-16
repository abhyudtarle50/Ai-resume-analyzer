import React from "react";
import "./ResumeInput.css";

const ValidationMessage = ({ status, message }) => {
  if (status === "idle" || !message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`validation-msg validation-msg--${status}`}
    >
      <span className="validation-msg__icon">
        {status === "valid" ? "✅" : status === "warning" ? "⚠️" : "❌"}
      </span>
      {message}
    </div>
  );
};

export default ValidationMessage;
