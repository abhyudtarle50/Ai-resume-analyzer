import React, { useState, useCallback } from "react";
import InputModeToggle from "./InputModeToggle";
import FileDropZone from "./FileDropZone";
import TextPasteArea from "./TextPasteArea";
import ValidationMessage from "./ValidationMessage";
import "./ResumeInput.css";

const ResumeInput = ({ onReady }) => {
  const [mode, setMode] = useState("upload"); // "upload" | "paste"
  const [validation, setValidation] = useState({ status: "idle", message: "" });
  const [inputData, setInputData] = useState(null); // File or String

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setValidation({ status: "idle", message: "" });
    setInputData(null);
    onReady(null, { status: "idle", message: "" }, newMode); // Reset parent
  };

  const handleInputReady = useCallback((data, valResult) => {
    setInputData(data);
    setValidation(valResult);
    onReady(data, valResult, mode);
  }, [onReady, mode]);

  return (
    <div className="resume-input-system">
      <InputModeToggle mode={mode} setMode={handleModeChange} />
      
      <div className="resume-input-zone">
        {mode === "upload" ? (
          <FileDropZone onFileReady={handleInputReady} />
        ) : (
          <TextPasteArea onTextReady={handleInputReady} />
        )}
      </div>

      <ValidationMessage status={validation.status} message={validation.message} />
    </div>
  );
};

export default ResumeInput;
