import React, { useRef, useState, useCallback } from "react";
import { validateFile } from "../../utils/resumeValidation";
import "./ResumeInput.css";

const FileDropZone = React.memo(({ onFileReady }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const processFile = useCallback((file) => {
    if (!file) return;
    const validation = validateFile(file);
    setSelectedFile(file);
    onFileReady(file, validation);
  }, [onFileReady]);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear to force onChange even for the same file
      fileInputRef.current.click();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className="file-drop-container">
      <div
        className={`dropzone ${isDragActive ? "dropzone--active" : ""} ${selectedFile ? "dropzone--has-file" : ""}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex="0"
        aria-describedby="dropzone-hint"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="dropzone__input"
          onChange={handleFileInput}
          onClick={(e) => e.stopPropagation()}
          aria-hidden="true"
          tabIndex="-1"
        />
        <div className="dropzone__content">
          <span className="dropzone__icon">📄</span>
          <h3 className="dropzone__title">
            {selectedFile ? "Selected: " + selectedFile.name : "Drag & drop your PDF here"}
          </h3>
          <p className="dropzone__subtitle">
            {selectedFile ? "Click to change file" : "or click to browse from your device"}
          </p>
        </div>
      </div>
      <span id="dropzone-hint" className="sr-only">
        Accepts PDF files up to 16 megabytes. Drag and drop or press Enter to browse.
      </span>
    </div>
  );
});

export default FileDropZone;
