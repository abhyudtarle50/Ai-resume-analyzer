"""
============================================================
PDF Parser Utility
============================================================
Handles text extraction from PDF documents using pdfminer.six.

This module provides a clean interface for extracting text
from uploaded resumes, which can then be processed by the
AI analysis engine.
============================================================
"""

from pdfminer.high_level import extract_text
import logging

# Set up logging for this module
logger = logging.getLogger(__name__)

def parse_resume_text(file_path: str) -> str:
    """
    Extract raw text from a PDF file.

    Parameters:
    file_path (str): The absolute path to the PDF file.

    Returns:
    str: The extracted text if successful, or an empty string if it fails.
    """
    try:
        # extract_text is a high-level function from pdfminer.six
        # it handles opening the file and processing it
        text = extract_text(file_path)
        
        # Clean up the text (basic stripping)
        if text:
            return text.strip()
        return ""

    except Exception as e:
        logger.error(f"Error extracting text from PDF {file_path}: {str(e)}")
        # Raise the exception so the caller can handle it if needed,
        # or return a specific error message.
        raise Exception(f"Failed to extract text from PDF: {str(e)}")
