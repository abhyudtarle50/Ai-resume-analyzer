import React, { useReducer, useRef, useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiSparkles, HiCheckCircle, HiExclamationCircle, HiArrowLeft, HiOutlineDocumentText, HiAcademicCap } from "react-icons/hi";
import { Link } from "react-router-dom";
import ResumeInput from "../../components/ResumeInput/ResumeInput";
import LoadingStepper from "../../components/LoadingStepper/LoadingStepper";
import AtsScoreModule from "../../components/AtsScoreModule/AtsScoreModule";
import SampleResumes from "./SampleResumes";
import { analyzeResume } from "../../services/api";
import "./Analyze.css";

const initialState = {
  inputData: null,
  inputMode: "upload",
  validationStatus: "idle",
  phase: "input", // "input" | "loading" | "results" | "error"
  result: null,
  errorMsg: "",
};

function analyzeReducer(state, action) {
  switch (action.type) {
    case "SET_INPUT":
      return {
        ...state,
        inputData: action.payload.data,
        inputMode: action.payload.mode,
        validationStatus: action.payload.validation.status,
      };
    case "START_ANALYSIS":
      return { ...state, phase: "loading", errorMsg: "", result: null };
    case "ANALYSIS_SUCCESS":
      return { ...state, phase: "results", result: action.payload };
    case "ANALYSIS_ERROR":
      return { ...state, phase: "error", errorMsg: action.payload };
    case "RESET":
      return { ...initialState, inputMode: state.inputMode };
    default:
      return state;
  }
}

const Analyze = () => {
  // Try to recover state from session storage to prevent "reload" loss on navigation
  const getInitialState = (initial) => {
    try {
      const saved = sessionStorage.getItem("last_analysis_state");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure we have a valid result object if phase is results
        if (parsed.phase === "results" && !parsed.result) {
          return initial;
        }
        // Don't recover file objects (inputData) as they can't be JSON serialized
        return { ...initial, ...parsed, inputData: null };
      }
    } catch (e) {
      console.error("Failed to recover state:", e);
    }
    return initial;
  };

  const [state, dispatch] = useReducer(analyzeReducer, initialState, getInitialState);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const resultsRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Persist state changes with a small debounce to prevent jank during rapid state updates
  useEffect(() => {
    const timer = setTimeout(() => {
      const { inputData, ...persistableState } = state;
      try {
        sessionStorage.setItem("last_analysis_state", JSON.stringify(persistableState));
      } catch (e) {
        console.error("Failed to save state to session storage", e);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    if (state.phase === "results" && resultsRef.current) {
      // Small timeout to ensure animation has started/settled
      const timer = setTimeout(() => {
        resultsRef.current?.focus({ preventScroll: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [state.phase]);

  // Object URL for PDF Preview (with cleanup to prevent memory leaks/flicker)
  const pdfPreviewUrl = useMemo(() => {
    if (state.inputMode === "upload" && state.inputData) {
      try {
        return URL.createObjectURL(state.inputData);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, [state.inputData, state.inputMode]);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  const handleInputReady = useCallback((data, validation, mode) => {
    dispatch({ type: "SET_INPUT", payload: { data, validation, mode } });
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!state.inputData || state.validationStatus === "invalid" || isDebouncing) return;

    setIsDebouncing(true);
    dispatch({ type: "START_ANALYSIS" });

    abortControllerRef.current = new AbortController();

    try {
      const data = await analyzeResume(state.inputData, { signal: abortControllerRef.current.signal });

      if (data.status === "success") {
        const filename = state.inputMode === "upload" ? state.inputData.name : "Pasted Text";
        dispatch({
          type: "ANALYSIS_SUCCESS",
          payload: { ...data.analysis, _filename: filename },
        });
      } else {
        throw new Error(data.error || "Unknown error from server.");
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.message === 'canceled') {
        return;
      }
      let msg;
      if (!err.response && err.message === 'Network Error') {
        msg = "Could not reach the server. It may be waking up from sleep — please wait 30 seconds and click 'Try Again'.";
      } else if (err.code === 'ECONNABORTED') {
        msg = "The request timed out. The AI is taking longer than usual — please try again.";
      } else {
        msg = err.response?.data?.error || err.message || "Something went wrong. Please try again.";
      }
      dispatch({ type: "ANALYSIS_ERROR", payload: msg });
    } finally {
      setIsDebouncing(false);
      abortControllerRef.current = null;
    }
  }, [state.inputData, state.inputMode, state.validationStatus, isDebouncing]);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    dispatch({ type: "RESET" });
    setIsDebouncing(false);
  }, []);

  const handleReset = useCallback(() => {
    dispatch({ type: "RESET" });
    // Scroll to top when resetting to give a "fresh" feel without a reload
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className={`analyze-page ${state.phase === 'results' ? 'analyze-page--results-mode' : ''}`}>
      <AnimatePresence mode="popLayout">
        {state.phase === "input" && (
          <motion.div 
            key="input-section" 
            className="analyze-page__section"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            layout
          >
            <header className="analyze-page__header">
              <motion.div className="analyze-page__eyebrow" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <HiSparkles /> AI-Powered Analysis
              </motion.div>
              <motion.h1 className="analyze-page__title" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                Analyze Your <span className="gradient-text">Resume</span>
              </motion.h1>
              <motion.p className="analyze-page__subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                Upload your PDF resume or paste your text to get an instant ATS score, personalised strengths & weaknesses, skill recommendations, and a career roadmap.
              </motion.p>
            </header>

            <div className="upload-card">
              <ResumeInput onReady={handleInputReady} />

              <motion.button
                className="btn btn-primary analyze-btn"
                onClick={handleAnalyze}
                disabled={!state.inputData || state.validationStatus === "invalid" || isDebouncing}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ marginTop: "var(--space-6)" }}
              >
                <HiSparkles /> {state.inputData ? "Analyze Resume" : "Provide resume to analyze"}
              </motion.button>
            </div>

            <SampleResumes />
          </motion.div>
        )}

        {state.phase === "loading" && (
          <motion.div 
            key="loading-section" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            layout
          >
            <LoadingStepper />
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <button className="btn btn-outline" onClick={handleCancel}>Cancel Analysis</button>
            </div>
          </motion.div>
        )}

        {state.phase === "error" && (
          <motion.div 
            key="error-section" 
            className="analyze-page__section"
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="upload-card">
              <div className="error-state">
                <div className="error-state__icon">⚠️</div>
                <h3 className="error-state__title">Analysis Failed</h3>
                <p className="error-state__message">{state.errorMsg}</p>
                <div className="error-state__actions">
                  <motion.button className="btn btn-primary" onClick={handleAnalyze} disabled={isDebouncing} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <HiSparkles /> Try Again
                  </motion.button>
                  <button className="btn btn-outline" onClick={handleReset} disabled={isDebouncing}>
                    Start Over
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {state.phase === "results" && state.result && (
          <motion.section 
            key="results-section" 
            className="results-layout results-layout--full" 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            layout
          >
            
            <div className="results-content results-content--full">
              <div className="results-header">
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
                  <button className="btn btn-outline btn-sm" onClick={handleReset} style={{ padding: "0.4rem 0.8rem" }}>
                    <HiArrowLeft /> Back to Upload
                  </button>
                  <h2 className="results-header__title" ref={resultsRef} tabIndex={-1} style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    📊 Analysis Report
                  </h2>
                </div>
                <span className="results-header__meta">Powered by Sarvam AI</span>
              </div>

              {/* Top Row: AI Summary + ATS Score */}
              <div className="results-top-row">
                {state.result.summary && (
                    <div className="results-summary-card">
                      <h3 className="results-summary-card__title">
                        <HiSparkles /> AI Mentor Insight
                      </h3>
                      <div className="results-summary-card__content">
                        {state.result.summary}
                      </div>
                    </div>
                )}

                <AtsScoreModule 
                  score={state.result.ats_score} 
                  breakdown={state.result.score_breakdown || {}} 
                />
              </div>

              <div className="results-grid results-grid--four-cols">
                {/* Strengths */}
                {state.result.strengths && state.result.strengths.length > 0 && (
                  <div className="result-card">
                    <div className="result-card__header">
                      <span className="result-card__icon" style={{ color: "var(--success)" }}><HiCheckCircle /></span>
                      <h3 className="result-card__title">Strengths</h3>
                    </div>
                    <ul className="result-card__list">
                      {state.result.strengths.map((s, i) => (
                        <li key={i} className="result-card__item">
                          <span className="result-card__bullet" style={{ background: "var(--success)" }} /> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {state.result.weaknesses && state.result.weaknesses.length > 0 && (
                  <div className="result-card">
                    <div className="result-card__header">
                      <span className="result-card__icon" style={{ color: "var(--warning)" }}><HiExclamationCircle /></span>
                      <h3 className="result-card__title">Weaknesses</h3>
                    </div>
                    <ul className="result-card__list">
                      {state.result.weaknesses.map((w, i) => (
                        <li key={i} className="result-card__item">
                          <span className="result-card__bullet" style={{ background: "var(--warning)" }} /> {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Improvements */}
                {state.result.improvements && state.result.improvements.length > 0 && (
                  <div className="result-card">
                    <div className="result-card__header">
                      <span className="result-card__icon" style={{ color: "var(--brand)" }}><HiSparkles /></span>
                      <h3 className="result-card__title">Improvement Suggestions</h3>
                    </div>
                    <ul className="result-card__list">
                      {state.result.improvements.map((imp, i) => (
                        <li key={i} className="result-card__item">
                          <span className="result-card__bullet" style={{ background: "var(--brand)" }} /> {imp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Skills to Learn (converted to list style) */}
                {state.result.skills_to_learn && state.result.skills_to_learn.length > 0 && (
                  <div className="result-card">
                    <div className="result-card__header">
                      <span className="result-card__icon" style={{ color: "#3b82f6" }}>📘</span>
                      <h3 className="result-card__title">Skills to Learn</h3>
                    </div>
                    <ul className="result-card__list">
                      {state.result.skills_to_learn.map((skill, i) => (
                        <li key={i} className="result-card__item">
                          <span className="result-card__bullet" style={{ background: "#3b82f6" }} /> 
                          {typeof skill === 'string' ? skill : skill.skill}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Recommended Projects */}
              {((state.result.easy_projects && state.result.easy_projects.length > 0) || (state.result.hard_projects && state.result.hard_projects.length > 0)) && (
                <div className="projects-section">
                  <h3 className="section-title">🛠️ Recommended Projects</h3>
                  <p className="section-subtitle">Easy projects use your existing skills. Hard projects teach missing skills.</p>

                  <div className="projects-columns">
                    {state.result.easy_projects && state.result.easy_projects.length > 0 && (
                      <div className="project-column">
                        <h4 className="project-group-title">
                          <span className="project-group-badge project-group-badge--easy">Easy</span>
                          Build With Your Current Skills
                        </h4>
                        <div className="projects-grid">
                          {state.result.easy_projects.map((proj, idx) => (
                            <div className="project-card project-card--easy" key={`easy-${idx}`}>
                              <div className="project-card__header">
                                <h4 className="project-card__title">{proj.title}</h4>
                                <span className="project-card__time">⏱️ {proj.estimated_time}</span>
                              </div>
                              <p className="project-card__desc">{proj.description}</p>
                              <div className="project-card__tags">
                                {(proj.technologies || []).map((tech, i) => (
                                  <span className="project-card__tag" key={i}>{tech}</span>
                                ))}
                              </div>
                              <p className="project-card__why"><strong>Why:</strong> {proj.why_it_helps}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {state.result.hard_projects && state.result.hard_projects.length > 0 && (
                      <div className="project-column">
                        <h4 className="project-group-title">
                          <span className="project-group-badge project-group-badge--hard">Hard</span>
                          Learn Missing Skills By Building
                        </h4>
                        <div className="projects-grid">
                          {state.result.hard_projects.map((proj, idx) => (
                            <div className="project-card project-card--hard" key={`hard-${idx}`}>
                              <div className="project-card__header">
                                <h4 className="project-card__title">{proj.title}</h4>
                                <span className="project-card__time">⏱️ {proj.estimated_time}</span>
                              </div>
                              <p className="project-card__desc">{proj.description}</p>
                              <div className="project-card__tags">
                                {(proj.technologies || []).map((tech, i) => (
                                  <span className="project-card__tag" key={i}>{tech}</span>
                                ))}
                                <span className="project-card__tag project-card__tag--missing">
                                  Uses Missing Skills
                                </span>
                              </div>
                              <p className="project-card__why"><strong>Why:</strong> {proj.why_it_helps}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Find Tutorials CTA — Prominent */}
              {state.result.skills_to_learn && state.result.skills_to_learn.length > 0 && (
                <div className="tutorials-cta">
                  <div className="tutorials-cta__content">
                    <span className="tutorials-cta__icon">🎓</span>
                    <div>
                      <h3 className="tutorials-cta__title">Learn These Skills Now</h3>
                      <p className="tutorials-cta__subtitle">Curated YouTube tutorials that match your missing skills, recommended projects, and career roadmap.</p>
                    </div>
                  </div>
                  <Link 
                    to={`/resources?skills=${(state.result.skills_to_learn || []).map(s => typeof s === 'string' ? s : s.skill).join(",")}`} 
                    className="tutorials-cta__btn"
                  >
                    <HiAcademicCap /> Find Tutorials →
                  </Link>
                </div>
              )}

              {/* Career Roadmap (Timeline) */}
              {state.result.roadmap && state.result.roadmap.length > 0 && (
                <div className="roadmap-timeline-section">
                  <h3 className="section-title">🗺️ Career Roadmap</h3>
                  <p className="section-subtitle">A logical path from your current skills to your career goal.</p>
                  <div className="timeline">
                    {state.result.roadmap.map((step, idx) => (
                      <div className="timeline-item" key={idx}>
                        <div className="timeline-marker">{step.step}</div>
                        <div className="timeline-content">
                          <h4 className="timeline-title">{step.title}</h4>
                          <p className="timeline-desc">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Analyze;
