/**
 * components/VideoCard/VideoCard.jsx
 * ---------------------------------------------------------------
 * Displays a YouTube video recommendation with real thumbnail,
 * channel name, and a direct link to watch the video.
 *
 * Props
 * -----
 *   video: {
 *     skill: string,
 *     title: string,
 *     thumbnail: string,
 *     video_url: string,
 *     channel: string,
 *     video_id: string | null,
 *     is_search_link: boolean
 *   }
 *   isLoading: boolean - If true, renders a skeleton placeholder
 * ---------------------------------------------------------------
 */

import { useState } from "react";
import { HiPlay, HiExternalLink } from "react-icons/hi";
import "./VideoCard.css";

const VideoCard = ({ video, isLoading = false }) => {
  const [thumbError, setThumbError] = useState(false);

  if (isLoading) {
    return (
      <div className="video-card video-card--skeleton">
        <div className="video-card__thumbnail-container" />
        <div className="video-card__content">
          <div className="skeleton-line" style={{ width: "30%" }} />
          <div className="skeleton-line" style={{ marginTop: "8px" }} />
          <div className="skeleton-line skeleton-line--short" />
          <div className="skeleton-line" style={{ width: "40%", marginTop: "16px" }} />
          <div className="skeleton-line" style={{ height: "36px", marginTop: "auto" }} />
        </div>
      </div>
    );
  }

  // Handle edge case where video was not found
  if (video.title === "No video found" || video.title.startsWith("Error")) {
    return (
      <div className="video-card" style={{ opacity: 0.6 }}>
        <div className="video-card__thumbnail-container video-card__thumbnail--empty">
          <span style={{ fontSize: '2.5rem' }}>🔍</span>
        </div>
        <div className="video-card__content">
          <span className="video-card__skill">{video.skill}</span>
          <h3 className="video-card__title">No tutorial found</h3>
          <p className="video-card__channel">Try searching YouTube directly.</p>
        </div>
      </div>
    );
  }

  const hasRealVideo = video.video_id && !video.is_search_link;
  
  // Use the actual thumbnail provided by the API backend, or fallback
  const getThumbnailUrl = () => {
    if (thumbError || !hasRealVideo) return null;
    if (video.thumbnail) return video.thumbnail;
    return `https://img.youtube.com/vi/${video.video_id}/hqdefault.jpg`;
  };
  
  const thumbnailUrl = getThumbnailUrl();

  return (
    <a
      href={video.video_url}
      target="_blank"
      rel="noopener noreferrer"
      className="video-card"
      aria-label={`Watch ${video.title} on YouTube`}
    >
      <div className="video-card__thumbnail-container">
        {thumbnailUrl && !thumbError ? (
          <img
            src={thumbnailUrl}
            alt={video.title}
            className="video-card__thumbnail"
            loading="lazy"
            onError={() => setThumbError(true)}
          />
        ) : (
          <div className="video-card__thumbnail video-card__thumbnail--placeholder">
            <span className="video-card__placeholder-icon">🎥</span>
          </div>
        )}
        {/* YouTube play button overlay */}
        <div className="video-card__play-overlay">
          <div className="video-card__play-btn">
            <HiPlay />
          </div>
        </div>
      </div>

      <div className="video-card__content">
        <span className="video-card__skill">{video.skill}</span>
        <h3 className="video-card__title" title={video.title}>
          {video.title}
        </h3>
        <p className="video-card__channel">
          <span className="video-card__channel-dot" />
          {video.channel || "YouTube"}
        </p>

        <div className="video-card__footer">
          <div className="video-card__button">
            {hasRealVideo ? "Watch Tutorial" : "Search on YouTube"} 
            <HiExternalLink />
          </div>
        </div>
      </div>
    </a>
  );
};

export default VideoCard;
