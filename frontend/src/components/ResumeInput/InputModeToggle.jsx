import React from "react";
import "./ResumeInput.css";

const InputModeToggle = ({ mode, setMode }) => {
  return (
    <div className="input-toggle" role="radiogroup" aria-label="Resume input method">
      <button
        role="radio"
        aria-checked={mode === "upload"}
        className={`input-toggle__btn ${mode === "upload" ? "active" : ""}`}
        onClick={() => setMode("upload")}
      >
        📄 Upload PDF
      </button>
      <button
        role="radio"
        aria-checked={mode === "paste"}
        className={`input-toggle__btn ${mode === "paste" ? "active" : ""}`}
        onClick={() => setMode("paste")}
      >
        ✏️ Paste Text
      </button>
    </div>
  );
};

export default InputModeToggle;
