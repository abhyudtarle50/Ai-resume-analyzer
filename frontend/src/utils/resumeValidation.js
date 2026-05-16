export const FILE_RULES = {
  maxSizeBytes: 16 * 1024 * 1024, // 16 MB
  allowedTypes: [".pdf"],
};

export const TEXT_RULES = {
  minLength: 100,
  maxLength: 50000,
  minWordCount: 30,
  warnWordCount: 100,
};

export function validateFile(file) {
  if (!file) return { status: "idle", message: "" };

  const ext = file.name.toLowerCase().split(".").pop();
  if (!FILE_RULES.allowedTypes.includes(`.${ext}`)) {
    return { status: "invalid", message: "Only PDF files are supported." };
  }

  if (file.size > FILE_RULES.maxSizeBytes) {
    return {
      status: "invalid",
      message: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 16 MB.`,
    };
  }

  if (file.size < 1024) {
    return { status: "warning", message: "This file seems very small. Make sure it contains your resume." };
  }

  return { status: "valid", message: "PDF ready for analysis." };
}

export function validateText(text) {
  if (!text.trim()) return { status: "idle", message: "" };

  const wordCount = text.trim().split(/\s+/).length;

  if (text.trim().length < TEXT_RULES.minLength) {
    return { status: "invalid", message: `Text is too short (${text.trim().length} chars). Minimum is ${TEXT_RULES.minLength}.` };
  }

  if (wordCount < TEXT_RULES.minWordCount) {
    return { status: "invalid", message: `Only ${wordCount} words detected. Paste your full resume for accurate analysis.` };
  }

  if (text.trim().length > TEXT_RULES.maxLength) {
    return { status: "invalid", message: "Text exceeds maximum length. Please trim to your core resume content." };
  }

  if (wordCount < TEXT_RULES.warnWordCount) {
    return { status: "warning", message: `Only ${wordCount} words. Results may be limited.` };
  }

  return { status: "valid", message: `${wordCount} words — ready for analysis.` };
}
