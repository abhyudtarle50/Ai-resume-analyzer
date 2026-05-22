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
 * wakeUpServer
 * Pings the /health endpoint to wake up a sleeping Render free-tier server.
 * Returns true if server is awake, false otherwise.
 */
const wakeUpServer = async () => {
  try {
    await api.get("/health", { timeout: 60000 });
    return true;
  } catch {
    return false;
  }
};

export const analyzeResume = async (input, options = {}) => {
  // Analysis requests can take 30-90s depending on Sarvam AI load and resume length.
  // We set a generous 180s timeout to prevent premature "Network Error" failures.
  const analysisTimeout = 180000; 
  const MAX_RETRIES = 2;
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // On retry, wake up the server first (handles Render cold starts)
      if (attempt > 0) {
        console.log(`[RETRY] Attempt ${attempt + 1}: Waking up server...`);
        await wakeUpServer();
      }

      let responseData;
      let filename = "Pasted Text";

      if (input instanceof File) {
        const formData = new FormData();
        formData.append("resume", input);
        filename = input.name;
        const response = await api.post("/analyze-resume", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: analysisTimeout,
          signal: options.signal,
        });
        responseData = response.data;
      } else {
        // Text mode — send as JSON
        const response = await api.post("/analyze-resume", {
          resume_text: input,
        }, {
          timeout: analysisTimeout,
          signal: options.signal,
        });
        responseData = response.data;
      }

      // Save to Local Storage instead of relying on the backend DB
      if (responseData && responseData.status === "success") {
        const newRecord = saveToHistoryLocal(responseData.analysis, filename);
        responseData.record_id = newRecord.id; // Override with local ID
      }

      return responseData;
    } catch (err) {
      lastError = err;

      // Don't retry if the user cancelled
      if (err.name === 'CanceledError' || err.message === 'canceled') {
        throw err;
      }

      // Only retry on network errors or timeouts (not on 4xx/5xx server errors)
      const isNetworkError = !err.response && (err.message === 'Network Error' || err.code === 'ECONNABORTED');
      if (!isNetworkError || attempt >= MAX_RETRIES) {
        throw err;
      }

      console.warn(`[RETRY] Network error on attempt ${attempt + 1}, retrying...`);
    }
  }

  throw lastError;
};

const LOCAL_STORAGE_KEY = "resume_analyzer_history";

const saveToHistoryLocal = (analysisData, filename) => {
  const history = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
  
  const newRecord = {
    id: Date.now().toString(),
    filename: filename,
    ats_score: analysisData.ats_score,
    strengths: analysisData.strengths || [],
    weaknesses: analysisData.weaknesses || [],
    suggestions: analysisData.improvements || [],
    skills: (analysisData.skills_to_learn || []).map(s => typeof s === 'string' ? s : s.skill),
    roadmap: analysisData.summary || "",
    rich_data: analysisData,
    upload_date: new Date().toISOString()
  };

  history.unshift(newRecord); // Add to start
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
  return newRecord;
};

/**
 * getHistory
 * Returns history from local storage.
 *
 * @returns {Promise<object>}  { status, count, history: [...] }
 */
export const getHistory = async () => {
  const history = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
  return { status: "success", count: history.length, history };
};

/**
 * deleteHistory
 * Removes record from local storage.
 *
 * @param {string|number} recordId  — the ID to delete
 * @returns {Promise<object>}  { status, message }
 */
export const deleteHistory = async (recordId) => {
  let history = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
  history = history.filter(r => r.id !== recordId.toString());
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(history));
  return { status: "success", message: "Record deleted." };
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
