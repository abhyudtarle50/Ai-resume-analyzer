/**
 * services/api.js
 * ---------------------------------------------------------------
 * Central Axios instance for communicating with the Flask backend.
 *
 * HOW IT WORKS
 * ------------
 * 1. We create ONE axios instance with the backend's base URL.
 * 2. All API functions are exported from this single file.
 * 3. Any page/component just imports the function it needs —
 *    no one ever has to type the full URL again.
 *
 * ENVIRONMENT
 * -----------
 * The base URL is read from the .env file in the frontend folder.
 * Create  frontend/.env  and add:
 *
 *     VITE_API_BASE_URL=http://127.0.0.1:5000
 *
 * Vite exposes env variables that start with VITE_ to the browser.
 * ---------------------------------------------------------------
 */

import axios from "axios";

// ---------------------------------------------------------------
// 1. Create the shared Axios instance
// ---------------------------------------------------------------
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || "https://ai-resume-analyzer-1-fw7l.onrender.com") + "/api",
  timeout: 120000, // 120 seconds — Sarvam AI pipeline can take a while
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------------------------------------------------------------
// 2. Request interceptor — runs before every request is sent
//    Useful for adding auth tokens later, or logging.
// ---------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    // Example: config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------
// 3. Response interceptor — runs after every response is received
//    Centralises error logging so individual functions stay clean.
// ---------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Detailed error logging for debugging
    console.group("API Error Details");
    console.error("Message:", error.message);
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    console.error("Config URL:", error.config?.url);
    console.error("Full Error:", error);
    console.groupEnd();

    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------
// 4. API functions — one per backend endpoint
//    Each function returns the `data` object from the response,
//    so callers get clean results without digging into `.data`.
// ---------------------------------------------------------------

/**
 * analyzeResume
 * POST /analyze-resume
 *
 * @param {File} file  — the PDF File object from an <input type="file">
 * @returns {Promise<object>}  analysis result from Sarvam AI + record_id
 *
 * Usage:
 *   const result = await analyzeResume(selectedFile);
 *   console.log(result.analysis.ats_score);
 */
export const analyzeResume = async (input) => {
  // Analysis requests can take 30-90s depending on Sarvam AI load and resume length.
  // We set a generous 120s timeout to prevent premature "Network Error" failures.
  const analysisTimeout = 120000; 

  if (input instanceof File) {
    const formData = new FormData();
    formData.append("resume", input);
    const response = await api.post("/analyze-resume", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: analysisTimeout,
    });
    return response.data;
  }

  // Text mode — send as JSON
  const response = await api.post("/analyze-resume", {
    resume_text: input,
  }, {
    timeout: analysisTimeout,
  });
  return response.data;
};

/**
 * getHistory
 * GET /history
 *
 * @returns {Promise<object>}  { status, count, history: [...] }
 *
 * Usage:
 *   const { history } = await getHistory();
 */
export const getHistory = async () => {
  const response = await api.get("/history");
  return response.data;
};

/**
 * deleteHistory
 * DELETE /history/<id>
 *
 * @param {number} recordId  — the ID to delete
 * @returns {Promise<object>}  { status, message }
 *
 * Usage:
 *   await deleteHistory(3);
 */
export const deleteHistory = async (recordId) => {
  const response = await api.delete(`/history/${recordId}`);
  return response.data;
};

/**
 * getResources
 * GET /resources
 *
 * @param {object} params  — either { skills: "Docker,AWS" }
 *                           or     { record_id: 3 }
 * @returns {Promise<object>}  { status, count, videos: [...] }
 *
 * Usage:
 *   const { videos } = await getResources({ record_id: result.record_id });
 *   const { videos } = await getResources({ skills: "Docker,React" });
 */
export const getResources = async (params) => {
  const response = await api.get("/resources", { params });
  return response.data;
};

/**
 * getLatestAnalysis
 * Helper to fetch only the most recent analysis record.
 * @returns {Promise<object|null>}
 */
export const getLatestAnalysis = async () => {
  const data = await getHistory();
  if (data.status === "success" && data.history?.length > 0) {
    return data.history[0];
  }
  return null;
};

// Export the base instance too — useful if you need custom calls later
export default api;
