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
  Send,
  ExternalLink,
  AlertTriangle,
  RefreshCw
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
  onUpdatePost?: (post: PostItem) => void;
}

export const ReelsFeed: React.FC<ReelsFeedProps> = ({
  posts,
  profile,
  onToggleFavorite,
  onArchive,
  onEdit,
  onOpenCreate,
  onUpdatePost,
}) => {
  const reels = posts.filter((p) => (p.type === 'reel' || p.type === 'video' || (Boolean(p.audioUrl) && p.type !== 'note')) && !p.isArchived);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [activeAnnotationPost, setActiveAnnotationPost] = useState<PostItem | null>(null);
  const [annotationText, setAnnotationText] = useState('');
  const [musicDetailPost, setMusicDetailPost] = useState<PostItem | null>(null);
  const [brokenVideoIds, setBrokenVideoIds] = useState<Record<string, boolean>>({});
  const [repairingReelId, setRepairingReelId] = useState<string | null>(null);
  const repairInputRef = useRef<HTMLInputElement>(null);

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

  const handleRepairFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !repairingReelId) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result && onUpdatePost) {
        const dataUrl = ev.target.result as string;
        const targetReel = reels.find((r) => r.id === repairingReelId);
        if (targetReel) {
          const updated = { ...targetReel, videoUrl: dataUrl };
          onUpdatePost(updated);
          setBrokenVideoIds((prev) => ({ ...prev, [repairingReelId]: false }));
          sound.playPop();
        }
      }
    };
    reader.readAsDataURL(file);
    if (repairInputRef.current) repairInputRef.current.value = '';
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
      {/* Hidden file input for one-click video repair */}
      <input
        ref={repairInputRef}
        type="file"
        accept="video/*"
        style={{ display: 'none' }}
        onChange={handleRepairFile}
      />

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
          const isBlobVideo = Boolean(reel.videoUrl && reel.videoUrl.startsWith('blob:'));
          const isBroken = brokenVideoIds[reel.id] || isBlobVideo;

          return (
            <div 
              key={reel.id} 
              className="reel-item-slide"
              onClick={() => handleTapScreen(reel)}
            >
              {/* Vertical Media (Video OR Visual Audio Reel) */}
              {reel.videoUrl ? (
                <>
                  <video
                    ref={(el) => { videoRefs.current[index] = el; }}
                    src={reel.videoUrl}
                    className="reel-video-element"
                    loop
                    playsInline
                    muted={isMuted}
                    poster={reel.mediaUrls?.[0]}
                    onError={() => {
                      setBrokenVideoIds((prev) => ({ ...prev, [reel.id]: true }));
                    }}
                  />

                  {/* Message & Bouton de Réparation si la vidéo est corrompue (ancien blob) */}
                  {isBroken && (
                    <div className="reel-broken-video-overlay" onClick={(e) => e.stopPropagation()}>
                      <div className="broken-video-content">
                        <AlertTriangle size={36} className="text-crimson" />
                        <h4>Vidéo expirée ou non synchronisée</h4>
                        <p>Cette vidéo utilise un lien temporaire qui a expiré après rechargement. Ré-attachez votre fichier pour le sécuriser définitivement sur tous vos appareils.</p>
                        <button
                          type="button"
                          className="btn-repair-video-action"
                          onClick={() => {
                            setRepairingReelId(reel.id);
                            repairInputRef.current?.click();
                          }}
                        >
                          <RefreshCw size={14} />
                          <span>Ré-attacher et réparer ma vidéo</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="reel-audio-visual-stage">
                  <img 
                    src={reel.mediaUrls?.[0] || reel.audioCover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80'} 
                    alt="Audio Reel Visual" 
                    className="reel-audio-cover-backdrop"
                  />
                  <div className="audio-visual-ambient-blur" />
                  <div className="audio-visual-center-art">
                    <div className={`audio-vinyl-hero ${isPlaying && isSelected ? 'spinning' : ''}`}>
                      <img 
                        src={reel.audioCover || reel.mediaUrls?.[0] || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80'} 
                        alt="Cover" 
                        className="vinyl-center-sticker" 
                      />
                    </div>
                    <div className="audio-hero-waveform">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <span 
                          key={i} 
                          className={`wave-bar ${isPlaying && isSelected ? 'pulsing' : ''}`} 
                          style={{ animationDelay: `${(i * 0.08) % 1.2}s` }} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

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

                {/* Spinning Audio Disc with Cover or Music Icon */}
                <div 
                  className={`spinning-disc-wrap ${isPlaying && isSelected ? 'spinning' : ''}`}
                  onClick={() => setMusicDetailPost(reel)}
                  title="Voir les détails de la musique"
                >
                  <div className="disc-inner">
                    {reel.audioCover ? (
                      <img src={reel.audioCover} alt="Pochette" className="disc-cover-art" />
                    ) : (
                      <Music size={12} color="#ffffff" />
                    )}
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

                {/* Modern Soundwave Audio Ticker (Clickable to open Spotify/Details) */}
                <div 
                  className="reel-audio-ticker clickable-ticker"
                  onClick={() => setMusicDetailPost(reel)}
                  title="Ouvrir la fiche du morceau"
                >
                  <div className="soundwave-anim-bars" title="Audio">
                    <span className={`sw-bar bar-1 ${isPlaying && isSelected ? 'active' : ''}`} />
                    <span className={`sw-bar bar-2 ${isPlaying && isSelected ? 'active' : ''}`} />
                    <span className={`sw-bar bar-3 ${isPlaying && isSelected ? 'active' : ''}`} />
                    <span className={`sw-bar bar-4 ${isPlaying && isSelected ? 'active' : ''}`} />
                  </div>
                  <div className="ticker-track-name">
                    <span>{reel.audioTrack || (reel.audioArtist ? `${reel.audioArtist} - Son` : 'Audio · ' + profile.displayName)}</span>
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

      {/* Music Track & Spotify Info Sheet */}
      {musicDetailPost && (
        <div className="modal-backdrop" onClick={() => setMusicDetailPost(null)}>
          <div className="music-detail-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Bande-son du Reel</h3>
              <button className="btn-close-modal" onClick={() => setMusicDetailPost(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="music-sheet-content">
              <div className="music-sheet-cover-box">
                {musicDetailPost.audioCover ? (
                  <img src={musicDetailPost.audioCover} alt="Cover HD" className="music-sheet-cover-img" />
                ) : (
                  <div className="music-sheet-vinyl-placeholder">
                    <Music size={44} color="#ff1e27" />
                  </div>
                )}
              </div>

              <div className="music-sheet-meta">
                <h4 className="music-sheet-title">{musicDetailPost.audioTrack || 'Piste audio'}</h4>
                <p className="music-sheet-artist">{musicDetailPost.audioArtist || profile.displayName}</p>
                <div className="music-sheet-badge-row">
                  {musicDetailPost.audioUrl?.startsWith('data:audio') ? (
                    <span className="audio-nature-badge creator-sound">🎙️ Fichier audio du créateur (WAV / MP3)</span>
                  ) : musicDetailPost.audioUrl?.startsWith('preset:') ? (
                    <span className="audio-nature-badge ambient-sound">✨ Ambiance sonore Web Audio</span>
                  ) : (
                    <span className="audio-nature-badge official-sound">🎧 Extrait officiel haute fidélité (30s)</span>
                  )}
                </div>
              </div>

              {/* Bouton Spotify officiel */}
              <div className="music-sheet-spotify-action">
                <a
                  href={musicDetailPost.spotifyUrl || `https://open.spotify.com/search/${encodeURIComponent(musicDetailPost.audioTrack || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-open-spotify"
                  onClick={() => sound.playTap()}
                >
                  <svg className="spotify-icon-svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  <span>Écouter le morceau complet sur Spotify</span>
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
