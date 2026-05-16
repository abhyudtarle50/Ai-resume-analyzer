import React, { useState, useEffect } from "react";
import { validateText } from "../../utils/resumeValidation";
import "./ResumeInput.css";

const TextPasteArea = ({ onTextReady }) => {
  const [localText, setLocalText] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      const validation = validateText(localText);
      onTextReady(localText, validation);
    }, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [localText, onTextReady]);

  const handleChange = (e) => {
    setLocalText(e.target.value);
  };

  return (
    <div className="text-paste-area">
      <textarea
        className="text-paste-area__input"
        placeholder="Paste your resume text here (e.g., from LinkedIn or a Word doc)..."
        value={localText}
        onChange={handleChange}
        aria-label="Paste resume text"
      />
    </div>
  );
};

export default TextPasteArea;
