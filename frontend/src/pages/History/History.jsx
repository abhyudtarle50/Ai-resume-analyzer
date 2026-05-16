import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiOutlineDocumentText, HiTrash, HiCalendar, HiFolderOpen, 
  HiSparkles, HiExclamationCircle, HiChevronDown, HiChevronUp,
  HiAcademicCap, HiX, HiArrowLeft, HiCheckCircle
} from "react-icons/hi";
import { Spinner, ErrorMessage } from "../../components/UI/UI";
import ScoreRing from "../../components/ScoreRing/ScoreRing";
import { getHistory, deleteHistory } from "../../services/api";
import AtsScoreModule from "../../components/AtsScoreModule/AtsScoreModule";
import "./History.css";

const DETAIL_CARDS = [
  { key: "strengths", title: "Strengths", bulletColor: "var(--success)", icon: <HiSparkles /> },
  { key: "weaknesses", title: "Weaknesses", bulletColor: "var(--warning)", icon: <HiExclamationCircle /> },
  { key: "suggestions", title: "Improvement Suggestions", bulletColor: "var(--brand)", icon: <HiSparkles /> },
  { key: "skills", title: "Recommended Skills", bulletColor: "var(--info)", icon: <HiAcademicCap /> },
];

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHistory();
      if (data.status === "success") {
        setHistory(data.history || []);
      } else {
        setError("Failed to load history.");
      }
    } catch (err) {
      setError("An error occurred while fetching history.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = useCallback(async (e, id) => {
    e.stopPropagation(); // Prevent card click
    if (!window.confirm("Are you sure you want to delete this analysis?")) return;

    try {
      const data = await deleteHistory(id);
      if (data.status === "success") {
        setHistory((prev) => prev.filter((item) => item.id !== id));
        if (selectedRecord?.id === id) setSelectedRecord(null);
      } else {
        alert("Failed to delete the record.");
      }
    } catch (err) {
      alert("An error occurred while deleting.");
    }
  }, [selectedRecord]);

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "var(--success)";
    if (score >= 50) return "var(--warning)";
    return "var(--danger)";
  };

  if (loading) {
    return (
      <div className="history-page container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="history-page container">
      <AnimatePresence mode="wait">
        {selectedRecord ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            style={{ maxWidth: "1400px", margin: "0 auto", width: "100%" }}
          >
            <motion.section className="results-layout">
              {/* Split layout on desktop */}
              <div className="results-sidebar" style={{ height: "fit-content" }}>
                <div className="results-sidebar__header">
                  <button className="btn btn-outline btn-sm" onClick={() => setSelectedRecord(null)}>
                    <HiArrowLeft /> Back to History
                  </button>
                  <span className="results-sidebar__filename"><HiOutlineDocumentText /> {selectedRecord.filename}</span>
                </div>
                
                <div className="text-preview-panel" style={{ padding: "var(--space-6)", textAlign: "center" }}>
                  <HiCalendar style={{ fontSize: "2rem", color: "var(--text-muted)", marginBottom: "1rem" }} />
                  <p>Analyzed on {formatDate(selectedRecord.upload_date)}</p>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                    (PDF preview is not saved in history)
                  </p>
                  
                  <button 
                    className="btn btn-outline" 
                    style={{ marginTop: "2rem", color: "var(--danger)", borderColor: "var(--danger)" }}
                    onClick={(e) => handleDelete(e, selectedRecord.id)}
                  >
                    <HiTrash style={{ marginRight: "8px" }} /> Delete This Record
                  </button>
                </div>
              </div>

              <div className="results-content">
                <div className="results-header">
                  <h2 className="results-header__title">📊 Analysis Report</h2>
                  <span className="results-header__meta">Powered by Sarvam AI</span>
                </div>

                {selectedRecord.rich_data?.summary && (
                  <div className="results-summary-card">
                    <h3 className="results-summary-card__title">
                      <HiSparkles /> AI Mentor Insight
                    </h3>
                    <div className="results-summary-card__content">
                      {selectedRecord.rich_data.summary}
                    </div>
                  </div>
                )}

                <AtsScoreModule 
                  score={selectedRecord.rich_data?.ats_score || selectedRecord.ats_score} 
                  breakdown={selectedRecord.rich_data?.score_breakdown || {}} 
                />

                <div className="results-grid">
                  {/* Strengths */}
                  {selectedRecord.rich_data?.strengths && selectedRecord.rich_data.strengths.length > 0 && (
                    <div className="result-card">
                      <div className="result-card__header">
                        <span className="result-card__icon" style={{ color: "var(--success)" }}><HiCheckCircle /></span>
                        <h3 className="result-card__title">Strengths</h3>
                      </div>
                      <ul className="result-card__list">
                        {selectedRecord.rich_data.strengths.map((s, i) => (
                          <li key={i} className="result-card__item">
                            <span className="result-card__bullet" style={{ background: "var(--success)" }} /> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {selectedRecord.rich_data?.weaknesses && selectedRecord.rich_data.weaknesses.length > 0 && (
                    <div className="result-card">
                      <div className="result-card__header">
                        <span className="result-card__icon" style={{ color: "var(--warning)" }}><HiExclamationCircle /></span>
                        <h3 className="result-card__title">Weaknesses</h3>
                      </div>
                      <ul className="result-card__list">
                        {selectedRecord.rich_data.weaknesses.map((w, i) => (
                          <li key={i} className="result-card__item">
                            <span className="result-card__bullet" style={{ background: "var(--warning)" }} /> {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Improvements */}
                  {((selectedRecord.rich_data?.improvements && selectedRecord.rich_data.improvements.length > 0) || (selectedRecord.suggestions && selectedRecord.suggestions.length > 0)) && (
                    <div className="result-card" style={{ gridColumn: "1 / -1" }}>
                      <div className="result-card__header">
                        <span className="result-card__icon" style={{ color: "var(--brand)" }}><HiSparkles /></span>
                        <h3 className="result-card__title">Quick Improvements</h3>
                      </div>
                      <ul className="result-card__list">
                        {(selectedRecord.rich_data?.improvements || selectedRecord.suggestions || []).map((imp, i) => (
                          <li key={i} className="result-card__item">
                            <span className="result-card__bullet" style={{ background: "var(--brand)" }} /> {imp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Skills to Learn */}
                {((selectedRecord.rich_data?.skills_to_learn && selectedRecord.rich_data.skills_to_learn.length > 0) || (selectedRecord.skills && selectedRecord.skills.length > 0)) && (
                  <div className="skills-section">
                    <h3 className="section-title">🎯 Missing Skills</h3>
                    <p className="section-subtitle">These skills connect your weaknesses to the projects and roadmap below.</p>
                    <div className="skills-grid">
                      {selectedRecord.rich_data?.skills_to_learn ? selectedRecord.rich_data.skills_to_learn.map((skill, idx) => (
                        <div className="skill-card" key={idx}>
                          <div className="skill-card__header">
                            <h4 className="skill-card__name">{skill.skill}</h4>
                            <span className={`priority-badge priority-${skill.priority?.toLowerCase()}`}>
                              {skill.priority}
                            </span>
                          </div>
                          <p className="skill-card__reason">{skill.reason}</p>
                        </div>
                      )) : selectedRecord.skills.map((skill, idx) => (
                        <div className="skill-card" key={idx}>
                          <div className="skill-card__header">
                            <h4 className="skill-card__name">{skill}</h4>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Projects */}
                {((selectedRecord.rich_data?.easy_projects && selectedRecord.rich_data.easy_projects.length > 0) || (selectedRecord.rich_data?.hard_projects && selectedRecord.rich_data.hard_projects.length > 0)) && (
                  <div className="projects-section">
                    <h3 className="section-title">🛠️ Recommended Projects</h3>
                    <p className="section-subtitle">Easy projects use your existing skills. Hard projects teach missing skills.</p>

                    {selectedRecord.rich_data?.easy_projects && selectedRecord.rich_data.easy_projects.length > 0 && (
                      <>
                        <h4 className="project-group-title">
                          <span className="project-group-badge project-group-badge--easy">Easy</span>
                          Build With Your Current Skills
                        </h4>
                        <div className="projects-grid">
                          {selectedRecord.rich_data.easy_projects.map((proj, idx) => (
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
                      </>
                    )}

                    {selectedRecord.rich_data?.hard_projects && selectedRecord.rich_data.hard_projects.length > 0 && (
                      <>
                        <h4 className="project-group-title" style={{ marginTop: "var(--space-5)" }}>
                          <span className="project-group-badge project-group-badge--hard">Hard</span>
                          Learn Missing Skills By Building
                        </h4>
                        <div className="projects-grid">
                          {selectedRecord.rich_data.hard_projects.map((proj, idx) => (
                            <div className="project-card project-card--hard" key={`hard-${idx}`}>
                              <div className="project-card__header">
                                <h4 className="project-card__title">{proj.title}</h4>
                                <span className="project-card__time">⏱️ {proj.estimated_time}</span>
                              </div>
                              <p className="project-card__desc">{proj.description}</p>
                              <div className="project-card__tags">
                                {(proj.technologies || []).map((tech, i) => (
                                  <span className="project-card__tag project-card__tag--missing" key={i}>{tech}</span>
                                ))}
                              </div>
                              <p className="project-card__why"><strong>Why:</strong> {proj.why_it_helps}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Find Tutorials CTA */}
                {((selectedRecord.rich_data?.skills_to_learn && selectedRecord.rich_data.skills_to_learn.length > 0) || (selectedRecord.skills && selectedRecord.skills.length > 0)) && (
                  <div className="tutorials-cta">
                    <div className="tutorials-cta__content">
                      <span className="tutorials-cta__icon">🎓</span>
                      <div>
                        <h3 className="tutorials-cta__title">Learn These Skills Now</h3>
                        <p className="tutorials-cta__subtitle">Curated YouTube tutorials that match your missing skills, recommended projects, and career roadmap.</p>
                      </div>
                    </div>
                    <Link 
                      to={`/resources?record_id=${selectedRecord.id}&filename=${encodeURIComponent(selectedRecord.filename)}`}
                      className="tutorials-cta__btn"
                    >
                      <HiAcademicCap /> Find Tutorials →
                    </Link>
                  </div>
                )}

                {/* Career Roadmap */}
                {selectedRecord.rich_data?.roadmap && Array.isArray(selectedRecord.rich_data.roadmap) && selectedRecord.rich_data.roadmap.length > 0 && (
                  <div className="roadmap-timeline-section">
                    <h3 className="section-title">🗺️ Career Roadmap</h3>
                    <p className="section-subtitle">A logical path from your current skills to your career goal.</p>
                    <div className="timeline">
                      {selectedRecord.rich_data.roadmap.map((step, idx) => (
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
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{ width: "100%" }}
          >
            <header className="history-page__header">
              <div className="history-page__title-group">
                <motion.h1 
                  className="history-page__title"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  Analysis History
                </motion.h1>
                <motion.p 
                  className="text-secondary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  Click any card to view the full analysis report.
                </motion.p>
              </div>
              {history.length > 0 && (
                <motion.span 
                  className="history-page__count"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {history.length} {history.length === 1 ? "Record" : "Records"}
                </motion.span>
              )}
            </header>

            {error && (
              <ErrorMessage message={error} onRetry={fetchHistory} />
            )}

            <AnimatePresence mode="popLayout">
              {history.length === 0 ? (
                <motion.div 
                  key="empty"
                  className="history-empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <div className="history-empty__icon"><HiFolderOpen /></div>
                  <h2 className="history-empty__title">No History Found</h2>
                  <p className="history-empty__text">
                    You haven't analyzed any resumes yet. Start by uploading your first
                    resume to see it here!
                  </p>
                  <Link to="/analyze" className="btn btn-primary" style={{ marginTop: "1rem" }}>
                    Analyze Now
                  </Link>
                </motion.div>
              ) : (
                <motion.div 
                  key="grid"
                  className="history-grid"
                  layout
                >
                  {history.map((record, index) => (
                    <motion.div 
                      key={record.id} 
                      className="history-card history-card--clickable"
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedRecord(record)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && setSelectedRecord(record)}
                    >
                      <div className="history-card__header">
                        <div className="history-card__icon"><HiOutlineDocumentText /></div>
                        <div className="history-card__score">
                          <span
                            className="history-card__score-value"
                            style={{ color: getScoreColor(record.ats_score) }}
                          >
                            {record.ats_score}
                          </span>
                          <span className="history-card__score-label">ATS Score</span>
                        </div>
                      </div>

                      <h3 className="history-card__filename" title={record.filename}>
                        {record.filename}
                      </h3>

                      {/* Quick preview of strengths */}
                      <p className="history-card__preview">
                        {record.strengths?.[0]?.slice(0, 80)}{record.strengths?.[0]?.length > 80 ? "…" : ""}
                      </p>

                      <div className="history-card__footer">
                        <span className="history-card__date">
                          <HiCalendar /> {formatDate(record.upload_date)}
                        </span>
                        <div className="history-card__actions">
                          <span className="history-card__view-label">View Details →</span>
                          <motion.button
                            className="btn-delete"
                            onClick={(e) => handleDelete(e, record.id)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label="Delete analysis"
                          >
                            <HiTrash />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default History;
