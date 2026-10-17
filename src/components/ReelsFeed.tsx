import React, { useState, useRef, useEffect } from 'react';
import { 
  Heart, 
  MessageSquare, 
  Bookmark, 
  Share2, 
  Volume2, 
  VolumeX, 
  Play, 
  Music, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Send
} from 'lucide-react';
import type { PostItem, UserProfile } from '../types';
import { sound } from '../services/sound';
import { ambientAudio } from '../services/ambientAudio';

interface ReelsFeedProps {
  posts: PostItem[];
  profile: UserProfile;
  onToggleFavorite: (id: string) => void;
  onArchive: (id: string) => void;
  onEdit: (post: PostItem) => void;
  onOpenCreate: () => void;
}

export const ReelsFeed: React.FC<ReelsFeedProps> = ({
  posts,
  profile,
  onToggleFavorite,
  onArchive,
  onEdit,
  onOpenCreate,
}) => {
  const reels = posts.filter((p) => (p.type === 'reel' || p.type === 'video') && !p.isArchived);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [activeAnnotationPost, setActiveAnnotationPost] = useState<PostItem | null>(null);
  const [annotationText, setAnnotationText] = useState('');

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);

  // Keyboard navigation for reels (Space, ArrowUp, ArrowDown, M, L)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (e.code === 'Space') {
        e.preventDefault();
        const currentVideo = videoRefs.current[currentIndex];
        if (currentVideo) {
          if (currentVideo.paused) {
            currentVideo.play();
            setIsPlaying(true);
            sound.playTap();
          } else {
            currentVideo.pause();
            setIsPlaying(false);
            sound.playTap();
          }
        }
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        if (currentIndex < reels.length - 1 && containerRef.current) {
          sound.playSwitch();
          containerRef.current.scrollTo({
            top: (currentIndex + 1) * containerRef.current.clientHeight,
            behavior: 'smooth',
          });
        }
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        if (currentIndex > 0 && containerRef.current) {
          sound.playSwitch();
          containerRef.current.scrollTo({
            top: (currentIndex - 1) * containerRef.current.clientHeight,
            behavior: 'smooth',
          });
        }
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        sound.playTap();
        const nextMuted = !isMuted;
        setIsMuted(nextMuted);
        videoRefs.current.forEach((v) => {
          if (v) v.muted = nextMuted;
        });
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        const currentReel = reels[currentIndex];
        if (currentReel) {
          sound.playHeart();
          onToggleFavorite(currentReel.id);
          setShowHeartPop(true);
          setTimeout(() => setShowHeartPop(false), 900);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isMuted, reels, onToggleFavorite]);

  // Play current video and pause others
  useEffect(() => {
    videoRefs.current.forEach((vid, idx) => {
      if (vid) {
        if (idx === currentIndex) {
          vid.currentTime = 0;
          vid.play().catch(() => {
            // Autoplay policy might require mute
            vid.muted = true;
            setIsMuted(true);
            vid.play().catch(() => {});
          });
          setIsPlaying(true);
        } else {
          vid.pause();
        }
      }
    });
  }, [currentIndex, reels.length]);

  // Synchronize custom soundscape / audio file with current Reel
  useEffect(() => {
    const currentReel = reels[currentIndex];
    if (currentReel?.audioUrl) {
      ambientAudio.play(currentReel.audioUrl, isMuted);
    } else {
      ambientAudio.stop();
    }

    return () => {
      ambientAudio.stop();
    };
  }, [currentIndex, reels]);

  useEffect(() => {
    ambientAudio.setMuted(isMuted);
  }, [isMuted]);

  useEffect(() => {
    if (isPlaying) {
      ambientAudio.resume();
    } else {
      ambientAudio.pause();
    }
  }, [isPlaying]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const height = e.currentTarget.clientHeight;
    const index = Math.round(scrollTop / height);
    if (index !== currentIndex && index >= 0 && index < reels.length) {
      sound.playTap();
      setCurrentIndex(index);
    }
  };

  const handleTapScreen = (reel: PostItem) => {
    const now = Date.now();
    // Double tap
    if (now - lastTapRef.current < 300) {
      if (!reel.isFavorite) {
        onToggleFavorite(reel.id);
      }
      sound.playHeart();
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 900);
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    // Single tap toggles playback
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      sound.playTap();
      if (currentVideo.paused) {
        currentVideo.play();
        setIsPlaying(true);
      } else {
        currentVideo.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playTap();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRefs.current.forEach((v) => {
      if (v) v.muted = nextMuted;
    });
  };

  const handleSaveAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAnnotationPost || !annotationText.trim()) return;
    onEdit({
      ...activeAnnotationPost,
      privateAnnotation: annotationText.trim(),
    });
    setActiveAnnotationPost(null);
    setAnnotationText('');
  };

  if (reels.length === 0) {
    return (
      <div className="reels-empty-container">
        <div className="reels-empty-icon">🎬</div>
        <h2>Aucun Reel pour le moment</h2>
        <p>Enregistrez votre première vidéo courte et dynamique avec la caméra.</p>
        <button className="btn-create-first" onClick={onOpenCreate}>
          Créer un Reel
        </button>
      </div>
    );
  }

  return (
    <div className="reels-main-wrapper">
      {/* Sound toggle at top right */}
      <div className="reels-top-controls">
        <span className="reels-mode-title">Reels</span>
        <button 
          className="reels-control-icon-btn" 
          onClick={handleMuteToggle}
          aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      {/* Snap Scroll Video Feed */}
      <div 
        className="reels-scroll-container" 
        ref={containerRef} 
        onScroll={handleScroll}
      >
        {reels.map((reel, index) => {
          const isSelected = index === currentIndex;

          return (
            <div 
              key={reel.id} 
              className="reel-item-slide"
              onClick={() => handleTapScreen(reel)}
            >
              {/* Vertical 9:16 Video */}
              <video
                ref={(el) => { videoRefs.current[index] = el; }}
                src={reel.videoUrl}
                className="reel-video-element"
                loop
                playsInline
                muted={isMuted}
                poster={reel.mediaUrls?.[0]}
              />

              {/* Play/Pause Center Indicator */}
              {!isPlaying && isSelected && (
                <div className="reel-center-badge">
                  <Play size={44} fill="#ffffff" color="#ffffff" />
                </div>
              )}

              {/* Double Tap Heart Pop with floating particles */}
              {showHeartPop && isSelected && (
                <div className="reel-heart-pop-wrap">
                  <Heart size={96} className="heart-pop-icon" fill="#ff1e27" color="#ff1e27" />
                  <span className="heart-particle p-1">❤️</span>
                  <span className="heart-particle p-2">✨</span>
                  <span className="heart-particle p-3">❤️</span>
                  <span className="heart-particle p-4">✨</span>
                </div>
              )}

              {/* Right Vertical Action Bar (Instagram / TikTok Style) */}
              <div className="reel-actions-column" onClick={(e) => e.stopPropagation()}>
                {/* User avatar */}
                <div className="reel-avatar-bubble">
                  <img src={profile.avatarUrl} alt={profile.displayName} />
                  <div className="reel-avatar-sparkle">
                    <Sparkles size={10} />
                  </div>
                </div>

                {/* Heart / Favorite */}
                <button
                  className={`reel-action-btn ${reel.isFavorite ? 'active-fav' : ''}`}
                  onClick={() => onToggleFavorite(reel.id)}
                  aria-label="Favori"
                >
                  <Heart 
                    size={28} 
                    strokeWidth={reel.isFavorite ? 0 : 2} 
                    fill={reel.isFavorite ? '#ff1e27' : 'none'} 
                    color={reel.isFavorite ? '#ff1e27' : '#ffffff'} 
                  />
                  <span className="reel-action-label">Favori</span>
                </button>

                {/* Private Reflection Annotation */}
                <button
                  className={`reel-action-btn ${reel.privateAnnotation ? 'active-note' : ''}`}
                  onClick={() => {
                    setActiveAnnotationPost(reel);
                    setAnnotationText(reel.privateAnnotation || '');
                  }}
                  aria-label="Note intime"
                >
                  <MessageSquare size={26} strokeWidth={2} color="#ffffff" />
                  <span className="reel-action-label">Note</span>
                </button>

                {/* Archive */}
                <button
                  className="reel-action-btn"
                  onClick={() => onArchive(reel.id)}
                  aria-label="Archiver"
                >
                  <Bookmark size={26} strokeWidth={2} color="#ffffff" />
                  <span className="reel-action-label">Sauver</span>
                </button>

                {/* Share */}
                <button
                  className="reel-action-btn"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: 'Reel ANTISOCIAL', text: reel.caption, url: window.location.href });
                    }
                  }}
                  aria-label="Partager"
                >
                  <Share2 size={26} strokeWidth={2} color="#ffffff" />
                  <span className="reel-action-label">Partager</span>
                </button>

                {/* Spinning Audio Disc */}
                <div className={`spinning-disc-wrap ${isPlaying && isSelected ? 'spinning' : ''}`}>
                  <div className="disc-inner">
                    <Music size={12} color="#ffffff" />
                  </div>
                </div>
              </div>

              {/* Bottom Info Overlay */}
              <div className="reel-bottom-overlay" onClick={(e) => e.stopPropagation()}>
                <div className="reel-user-row">
                  <span className="reel-username">@{profile.username}</span>
                  {reel.location && (
                    <span className="reel-location">· {reel.location}</span>
                  )}
                </div>

                {reel.caption && (
                  <p className="reel-caption-text">{reel.caption}</p>
                )}

                {reel.tags && reel.tags.length > 0 && (
                  <div className="reel-tags-line">
                    {reel.tags.map((t) => (
                      <span key={t} className="reel-tag">#{t}</span>
                    ))}
                  </div>
                )}

                {/* Private note pill if present */}
                {reel.privateAnnotation && (
                  <div className="reel-annotation-bubble">
                    <span className="bubble-label">Note privée :</span>
                    <p>{reel.privateAnnotation}</p>
                  </div>
                )}

                {/* Modern Soundwave Audio Ticker */}
                <div className="reel-audio-ticker">
                  <div className="soundwave-anim-bars" title="Audio">
                    <span className={`sw-bar bar-1 ${isPlaying && isSelected ? 'active' : ''}`} />
                    <span className={`sw-bar bar-2 ${isPlaying && isSelected ? 'active' : ''}`} />
                    <span className={`sw-bar bar-3 ${isPlaying && isSelected ? 'active' : ''}`} />
                    <span className={`sw-bar bar-4 ${isPlaying && isSelected ? 'active' : ''}`} />
                  </div>
                  <div className="ticker-track-name">
                    <span>{reel.audioTrack || 'Audio · ' + profile.displayName}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Up/Down Navigation Helpers for Desktop */}
      <div className="reels-desktop-arrows">
        <button
          className="reels-arrow-btn"
          disabled={currentIndex === 0}
          onClick={() => {
            if (containerRef.current && currentIndex > 0) {
              containerRef.current.scrollTo({
                top: (currentIndex - 1) * containerRef.current.clientHeight,
                behavior: 'smooth',
              });
            }
          }}
          title="Reel précédent"
        >
          <ChevronUp size={22} />
        </button>

        <button
          className="reels-arrow-btn"
          disabled={currentIndex === reels.length - 1}
          onClick={() => {
            if (containerRef.current && currentIndex < reels.length - 1) {
              containerRef.current.scrollTo({
                top: (currentIndex + 1) * containerRef.current.clientHeight,
                behavior: 'smooth',
              });
            }
          }}
          title="Reel suivant"
        >
          <ChevronDown size={22} />
        </button>
      </div>

      {/* Private Note / Comment Drawer Modal */}
      {activeAnnotationPost && (
        <div className="modal-backdrop" onClick={() => setActiveAnnotationPost(null)}>
          <div className="annotation-drawer-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Réflexion intime sur ce Reel</h3>
              <button className="btn-close-modal" onClick={() => setActiveAnnotationPost(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAnnotation} className="drawer-form">
              <p className="drawer-sub">
                Cette note n'est visible que par vous. Notez vos ressentis, ce que ce moment vous inspire ou une idée à creuser.
              </p>
              <textarea
                rows={4}
                value={annotationText}
                onChange={(e) => setAnnotationText(e.target.value)}
                placeholder="Votre réflexion personnelle..."
                autoFocus
              />
              <div className="drawer-actions">
                <button type="submit" className="btn-send-annotation">
                  <Send size={15} /> <span>Enregistrer ma note</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
