import React, { useState, useEffect, useRef } from 'react';
import { X, Pause, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import type { StoryHighlight, UserProfile } from '../types';

interface StoryViewerModalProps {
  isOpen: boolean;
  highlight: StoryHighlight | null;
  profile: UserProfile;
  onClose: () => void;
}

const STORY_DURATION_MS = 5000;

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  isOpen,
  highlight,
  profile,
  onClose,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0 to 100 for current slide
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  const stories = highlight?.stories || [];
  const currentStory = stories[currentSlideIndex];

  // Reset when opening a new highlight
  useEffect(() => {
    if (isOpen) {
      setCurrentSlideIndex(0);
      setProgress(0);
      setIsPaused(false);
    }
  }, [isOpen, highlight?.id]);

  // Story timer ticker
  useEffect(() => {
    if (!isOpen || isPaused || stories.length === 0) return;

    const intervalStep = 50; // update every 50ms
    const stepIncrement = (intervalStep / STORY_DURATION_MS) * 100;

    timerRef.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Go to next slide
          if (currentSlideIndex < stories.length - 1) {
            setCurrentSlideIndex((idx) => idx + 1);
            return 0;
          } else {
            // Reached end of highlight
            onClose();
            return 100;
          }
        }
        return prev + stepIncrement;
      });
    }, intervalStep);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPaused, currentSlideIndex, stories.length, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === ' ') setIsPaused((p) => !p);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentSlideIndex, stories.length]);

  if (!isOpen || !highlight || stories.length === 0) return null;

  const handleNext = () => {
    if (currentSlideIndex < stories.length - 1) {
      setCurrentSlideIndex((idx) => idx + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((idx) => idx - 1);
      setProgress(0);
    }
  };

  const handleScreenTouch = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.35) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  return (
    <div className="story-viewer-backdrop" onClick={onClose}>
      <div 
        className="story-viewer-card" 
        onClick={(e) => e.stopPropagation()}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Progress Bars at top */}
        <div className="story-progress-row">
          {stories.map((s, idx) => {
            let fillPercent = 0;
            if (idx < currentSlideIndex) fillPercent = 100;
            else if (idx === currentSlideIndex) fillPercent = progress;

            return (
              <div key={s.id} className="story-progress-track">
                <div 
                  className="story-progress-fill" 
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Story Header */}
        <div className="story-header-overlay">
          <div className="story-user-info">
            <div className="story-avatar-small">
              <img src={profile.avatarUrl} alt={profile.displayName} />
            </div>
            <div className="story-meta-names">
              <span className="story-username">{profile.username}</span>
              <span className="story-highlight-title">· {highlight.title}</span>
            </div>
          </div>

          <div className="story-header-btns">
            <button 
              className="story-icon-btn" 
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? 'Reprendre' : 'Pause'}
            >
              {isPaused ? <Play size={16} fill="#ffffff" /> : <Pause size={16} />}
            </button>
            <button className="story-icon-btn" onClick={onClose} title="Fermer">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Story Media Canvas with tap navigation */}
        <div className="story-media-stage" onClick={handleScreenTouch}>
          {currentStory.type === 'video' ? (
            <video
              src={currentStory.mediaUrl}
              autoPlay
              playsInline
              loop
              className="story-media-asset"
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt="Story"
              className="story-media-asset"
            />
          )}

          {/* Optional Caption */}
          {currentStory.caption && (
            <div className="story-caption-overlay">
              <p>{currentStory.caption}</p>
            </div>
          )}
        </div>

        {/* Desktop Previous/Next Arrows */}
        {currentSlideIndex > 0 && (
          <button 
            className="story-desktop-arrow left" 
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          >
            <ChevronLeft size={28} />
          </button>
        )}
        <button 
          className="story-desktop-arrow right" 
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
        >
          <ChevronRight size={28} />
        </button>
      </div>
    </div>
  );
};
