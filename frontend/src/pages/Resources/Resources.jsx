import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HiAcademicCap, HiExclamationCircle, HiPlay, 
  HiInformationCircle, HiClock, HiArrowLeft,
  HiOutlineDocumentText, HiCalendar
} from "react-icons/hi";
import { Spinner, ErrorMessage } from "../../components/UI/UI";
import { getResources, getHistory } from "../../services/api";
import VideoCard from "../../components/VideoCard/VideoCard";
import "./Resources.css";

const Resources = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [videos, setVideos] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeFilename, setActiveFilename] = useState("");

  const recordId = searchParams.get("record_id");
  const skillsParam = searchParams.get("skills");
  const filenameParam = searchParams.get("filename");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchVideos = useCallback(async (params) => {
    setLoading(true);
    setError("");
    
    try {
      const data = await getResources(params);
      if (data.status === "success") {
        setVideos(data.videos || []);
      } else {
        setError(data.message || "Failed to load resources.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        "An error occurred while fetching resources."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVideosForSelection = useCallback(() => {
    if (!recordId && !skillsParam) return;
    
    if (recordId) {
      const record = history.find(h => h.id.toString() === recordId.toString());
      if (record) {
        setActiveFilename(record.filename);
        const skillsList = record.skills || (record.rich_data?.skills_to_learn || []).map(s => typeof s === 'string' ? s : s.skill) || [];
        if (skillsList.length > 0) {
          fetchVideos({ skills: skillsList.join(",") });
        } else {
          setVideos([]);
          setError("No skills identified in this resume to recommend tutorials for.");
        }
      } else if (!historyLoading) {
        setError("Resume analysis record not found.");
      }
    } else {
      fetchVideos({ skills: skillsParam });
    }
  }, [recordId, skillsParam, history, historyLoading, fetchVideos]);

  useEffect(() => {
    if (recordId || skillsParam) {
      fetchVideosForSelection();
    } else {
      setVideos([]);
      setActiveFilename("");
    }
  }, [recordId, skillsParam, fetchVideosForSelection]);

  useEffect(() => {
    if (filenameParam) {
      setActiveFilename(filenameParam);
    }
  }, [filenameParam]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await getHistory();
      if (data.status === "success") {
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSearchParams({});
    setActiveFilename("");
    setVideos([]);
  }, [setSearchParams]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const hasSelection = recordId || skillsParam;

  return (
    <div className="resources-page">
      <header className="resources-page__header">
        <motion.div 
          className="resources-page__eyebrow"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <HiAcademicCap /> Learning Hub
        </motion.div>
        <motion.h1 
          className="resources-page__title"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {activeFilename ? (
            <>Tutorials for <span className="gradient-text">{activeFilename}</span></>
          ) : (
            <>Recommended <span className="gradient-text">Tutorials</span></>
          )}
        </motion.h1>
        <motion.p 
          className="resources-page__subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {activeFilename 
            ? "Showing curated video tutorials based on this specific resume analysis."
            : "Curated video tutorials based on the skills identified in your resume analysis."
          }
        </motion.p>
      </header>

      {hasSelection && (
        <motion.button 
          className="btn btn-ghost resources-back-btn"
          onClick={clearSelection}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <HiArrowLeft /> View All Analysis History
        </motion.button>
      )}

      {/* Disclaimer */}
      {hasSelection && !loading && videos.length > 0 && (
        <motion.div
          className="resources-disclaimer"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <HiInformationCircle className="resources-disclaimer__icon" />
          <p>
            These recommendations are tailored to the skills missing in your analysis.
            Watch these to improve your resume's ATS score and industry readiness.
          </p>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {error && (
          <ErrorMessage message={error} onRetry={fetchVideosForSelection} />
        )}
      </AnimatePresence>

      <div className="resources-layout">
        {/* Main Content Area */}
        <div className="resources-main">
          {loading && videos.length === 0 ? (
            <div className="resources-grid resources-grid--loading">
              {[1, 2, 3, 4].map((i) => (
                <VideoCard key={i} isLoading={true} />
              ))}
            </div>
          ) : videos.length > 0 ? (
            <div className={`resources-grid ${loading ? "resources-grid--loading" : ""}`}>
              {videos.map((video, idx) => (
                <VideoCard key={`${video.skill}-${idx}`} video={video} />
              ))}
            </div>
          ) : !error && !hasSelection ? (
            <div className="resources-welcome">
              <div className="resources-welcome__card">
                <div className="resources-welcome__icon"><HiClock /></div>
                <h2 className="resources-welcome__title">Tutorial History Hub</h2>
                <p className="resources-welcome__text">
                  Select a previous analysis from the sidebar to view its recommended tutorials, 
                  or upload a new resume to get fresh insights.
                </p>
                <Link to="/analyze" className="btn btn-primary">
                  <HiPlay /> Analyze New Resume
                </Link>
              </div>
            </div>
          ) : !error && hasSelection ? (
            <div className="resources-empty">
              <div className="resources-empty__icon"><HiExclamationCircle /></div>
              <h2 className="resources-empty__title">No tutorials found</h2>
              <p className="resources-empty__text">
                We couldn't find specific tutorials for this analysis. 
                Try analyzing a different resume or check your skills list.
              </p>
            </div>
          ) : null}
        </div>

        {/* Sidebar: History List */}
        <aside className="resources-sidebar">
            <h3 className="resources-sidebar__title">
              <HiClock /> Analysis History
            </h3>
            <div className="resources-history-list">
              {historyLoading ? (
                <div className="resources-history-loading"><Spinner size="sm" /> Loading history...</div>
              ) : history.length === 0 ? (
                <div className="resources-history-empty">No analyses yet.</div>
              ) : (
                history.map((record) => (
                  <button
                    key={record.id}
                    className={`resources-history-item ${recordId?.toString() === record.id.toString() ? "active" : ""}`}
                    onClick={() => setSearchParams({ record_id: record.id, filename: record.filename })}
                  >
                    <div className="resources-history-item__icon">
                      <HiOutlineDocumentText />
                    </div>
                    <div className="resources-history-item__info">
                      <span className="resources-history-item__name">{record.filename}</span>
                      <span className="resources-history-item__date">
                        <HiCalendar /> {formatDate(record.upload_date)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>
      </div>
    </div>
  );
};

export default Resources;

