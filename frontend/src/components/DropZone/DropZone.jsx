/**
 * components/DropZone/DropZone.jsx
 * ---------------------------------------------------------------
 * Reusable drag-and-drop PDF upload zone.
 *
 * Props
 * -----
 *   onFileSelect (file: File) => void   — called when user picks a file
 *   disabled     boolean                — disables interaction
 *
 * The component manages drag state internally.
 * The parent owns the selected file (controlled pattern).
 * ---------------------------------------------------------------
 */

import { useState, useRef } from "react";
import "./DropZone.css";

/* Format bytes → "1.2 MB", "340 KB", etc. */
const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const DropZone = ({ onFileSelect, selectedFile, onRemove, disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  // ---- Drag events -----------------------------------------------

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false when leaving the dropzone itself, not a child element
    if (e.currentTarget === e.target) setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // required to allow drop
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    validateAndSelect(file);
  };

  // ---- Click-to-browse -------------------------------------------

  const handleClick = () => {
    if (!disabled && !selectedFile) inputRef.current?.click();
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    validateAndSelect(file);
    // Reset input so the same file can be re-selected if removed
    e.target.value = "";
  };

  // ---- Validation ------------------------------------------------

  const validateAndSelect = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Only PDF files are supported. Please select a .pdf file.");
      return;
    }
    onFileSelect(file);
  };

  // ---- Derived class names ---------------------------------------

  const zoneClass = [
    "dropzone",
    isDragging ? "dropzone--active" : "",
    selectedFile ? "dropzone--has-file" : "",
    disabled ? "dropzone--disabled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      {/* Drop zone area */}
      <div
        className={zoneClass}
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        role="button"
        aria-label="Upload resume PDF by clicking or dragging"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
      >
        {/* Hidden real file input */}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="dropzone__input"
          onChange={handleInputChange}
          disabled={disabled}
          aria-hidden="true"
          tabIndex={-1}
        />

        {selectedFile ? (
          <>
            <div className="dropzone__icon">✅</div>
            <p className="dropzone__title">File ready to analyze!</p>
            <p className="dropzone__subtitle">Click below to start analysis</p>
          </>
        ) : isDragging ? (
          <>
            <div className="dropzone__icon">📂</div>
            <p className="dropzone__title">Drop your PDF here</p>
            <p className="dropzone__subtitle">Release to select</p>
          </>
        ) : (
          <>
            <div className="dropzone__icon">📄</div>
            <p className="dropzone__title">Drag &amp; drop your resume here</p>
            <p className="dropzone__subtitle">
              or <strong style={{ color: "var(--brand)" }}>click to browse</strong>
            </p>
            <span className="dropzone__badge">PDF only · Max 16 MB</span>
          </>
        )}
      </div>

      {/* File preview card — shown once a file is chosen */}
      {selectedFile && (
        <div className="file-preview">
          <span className="file-preview__icon" aria-hidden="true">📋</span>

          <div className="file-preview__info">
            <p className="file-preview__name" title={selectedFile.name}>
              {selectedFile.name}
            </p>
            <p className="file-preview__meta">
              PDF · {formatBytes(selectedFile.size)}
            </p>
          </div>

          <button
            className="file-preview__remove"
            onClick={onRemove}
            disabled={disabled}
            aria-label="Remove selected file"
            title="Remove file"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default DropZone;
