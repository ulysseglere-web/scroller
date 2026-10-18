import React, { useState, useRef, useEffect } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Send, 
  MoreHorizontal, 
  Pin, 
  Volume2, 
  VolumeX, 
  Play, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink, 
  BookOpen, 
  Calendar,
  Check,
  Edit3,
  Trash2,
  Archive,
  Maximize2,
  AlertTriangle,
  RefreshCw,
  Music
} from 'lucide-react';
import type { PostItem, UserProfile } from '../types';
import { sound } from '../services/sound';
import { PinchZoomImage } from './PinchZoomImage';

interface PostCardProps {
  post: PostItem;
  profile: UserProfile;
  onToggleFavorite: (id: string) => void;
  onTogglePin: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (post: PostItem) => void;
  onOpenMediaViewer: (mediaUrls: string[], initialIndex: number) => void;
  onTagClick?: (tag: string) => void;
  onUpdatePost?: (post: PostItem) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  profile,
  onToggleFavorite,
  onTogglePin,
  onArchive,
  onDelete,
  onEdit,
  onOpenMediaViewer,
  onTagClick,
  onUpdatePost,
}) => {
  // State for carousels
  const [carouselIndex, setCarouselIndex] = useState(0);
  // State for video playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const repairInputRef = useRef<HTMLInputElement>(null);

  const isBlobVideo = Boolean(post.videoUrl && post.videoUrl.startsWith('blob:'));
  const isVideoBroken = isBlobVideo || videoError;

  // Context menu dropdown
  const [showMenu, setShowMenu] = useState(false);
  // Expand long caption
  const [isExpanded, setIsExpanded] = useState(false);
  // Comments state
  const [showAnnotationInput, setShowAnnotationInput] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  // Heart pop animation on double tap
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const lastTapRef = useRef<number>(0);

  // Audio playback for feed posts with attached music/wav
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, []);

  const handleToggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post.audioUrl) {
      if (post.spotifyUrl) {
        window.open(post.spotifyUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(post.audioUrl);
      audioPlayerRef.current.onended = () => setIsPlayingAudio(false);
    }

    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      sound.playTap();
      audioPlayerRef.current.play()
        .then(() => setIsPlayingAudio(true))
        .catch((err) => {
          console.warn('Erreur lecture audio:', err);
          setIsPlayingAudio(false);
        });
    }
  };

  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(post.createdAt));

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!post.isFavorite) {
        onToggleFavorite(post.id);
      }
      sound.playHeart();
      setShowHeartPop(true);
      setTimeout(() => setShowHeartPop(false), 900);
    }
    lastTapRef.current = now;
  };

  const handleVideoToggle = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn('Lecture normale bloquée, bascule en mode silencieux:', err);
            video.muted = true;
            setIsMuted(true);
            video.play()
              .then(() => setIsPlaying(true))
              .catch((err2) => {
                console.error('Échec complet de la lecture vidéo:', err2);
                setVideoError(true);
              });
          });
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleRepairVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        const dataUrl = ev.target.result as string;
        const updated = {
          ...post,
          videoUrl: dataUrl,
        };
        if (onUpdatePost) {
          onUpdatePost(updated);
        } else {
          onEdit(updated);
        }
        setVideoError(false);
        sound.playPop();
        if (videoRef.current) {
          videoRef.current.src = dataUrl;
          videoRef.current.load();
        }
      }
    };
    reader.readAsDataURL(file);
    if (repairInputRef.current) repairInputRef.current.value = '';
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleShare = async () => {
    const shareText = `${post.caption || 'Un souvenir de mon journal ANTISOCIAL'}\n— ${post.quoteData ? post.quoteData.quote : ''}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ANTISOCIAL — Souvenir privé',
          text: shareText,
          url: window.location.href,
        });
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(shareText);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSaveComment = (text: string) => {
    const clean = text.trim();
    const updated = { ...post, privateAnnotation: clean || undefined };
    if (onUpdatePost) {
      onUpdatePost(updated);
    } else {
      onEdit(updated);
    }
    sound.playPop();
    setCommentDraft('');
    setShowAnnotationInput(false);
  };

  const userInitial = (profile.displayName || profile.username || 'A').slice(0, 1).toUpperCase();

  return (
    <article className={`post-card ${post.isPinned ? 'is-pinned' : ''}`}>
      {/* Post Header (Instagram style) */}
      <div className="post-header">
        <div className="post-author-row">
          <div className="author-avatar-wrap">
            {!avatarError && profile.avatarUrl ? (
              <img 
                src={profile.avatarUrl} 
                alt={profile.displayName} 
                className="post-author-avatar"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className="post-author-monogram">
                {userInitial}
              </div>
            )}
          </div>
          <div className="post-author-meta">
            <div className="author-name-line">
              <span className="post-author-name">{profile.username}</span>
              {post.isPinned && (
                <span className="pinned-badge" title="Épinglé">
                  <Pin size={11} className="pin-icon" />
                </span>
              )}
              <span className="meta-dot">·</span>
              <span className="post-time">{formattedDate}</span>
            </div>
            {post.location && (
              <span className="post-location">{post.location}</span>
            )}
            {post.audioTrack && (
              <div 
                className={`post-header-audio-badge ${isPlayingAudio ? 'is-playing' : ''}`}
                onClick={handleToggleAudio}
                title={post.audioUrl ? (isPlayingAudio ? 'Mettre en pause' : 'Écouter le morceau') : (post.spotifyUrl ? 'Ouvrir sur Spotify' : post.audioTrack)}
                role="button"
                tabIndex={0}
              >
                <Music size={11} className={`music-note-icon ${isPlayingAudio ? 'sw-anim' : ''}`} />
                <span className="post-music-name">{post.audioTrack}</span>
                {post.spotifyUrl && <span className="post-spotify-badge">Spotify</span>}
              </div>
            )}
          </div>
        </div>

        <div className="post-header-menu">
          <button 
            className="post-menu-btn" 
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Options du souvenir"
          >
            <MoreHorizontal size={20} />
          </button>

          {showMenu && (
            <div className="post-context-menu">
              <button onClick={() => { onTogglePin(post.id); setShowMenu(false); }}>
                <Pin size={16} /> {post.isPinned ? 'Détacher' : 'Épingler au sommet'}
              </button>
              <button onClick={() => { onEdit(post); setShowMenu(false); }}>
                <Edit3 size={16} /> Modifier le souvenir
              </button>
              <button onClick={() => { onArchive(post.id); setShowMenu(false); }}>
                <Archive size={16} /> Archiver ce souvenir
              </button>
              <button onClick={handleShare}>
                {copiedLink ? <Check size={16} /> : <Send size={16} />} 
                {copiedLink ? 'Copié dans le presse-papier' : 'Copier / Partager'}
              </button>
              <div className="menu-divider" />
              <button 
                className="text-danger" 
                onClick={() => {
                  if (confirm('Voulez-vous supprimer définitivement ce souvenir ?')) {
                    onDelete(post.id);
                  }
                  setShowMenu(false);
                }}
              >
                <Trash2 size={16} /> Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Post Media Area */}
      <div className="post-media-wrapper" onClick={handleDoubleTap}>
        {/* Heart pop animation */}
        {showHeartPop && (
          <div className="heart-pop-overlay">
            <Heart size={84} className="heart-pop-icon" />
          </div>
        )}

        {/* 1. PHOTO OR CAROUSEL */}
        {(post.type === 'photo' || post.type === 'carousel') && post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className="media-carousel-container">
            <PinchZoomImage
              src={post.mediaUrls[carouselIndex] || post.mediaUrls[0]}
              alt={post.caption || 'Souvenir'}
              className="post-media-image"
              loading="lazy"
              onClick={() => onOpenMediaViewer(post.mediaUrls || [], carouselIndex)}
            />

            <button 
              className="fullscreen-expand-btn"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMediaViewer(post.mediaUrls || [], carouselIndex);
              }}
              title="Agrandir en plein écran"
            >
              <Maximize2 size={16} />
            </button>

            {/* Carousel navigation controls if multiple */}
            {post.mediaUrls.length > 1 && (
              <>
                {carouselIndex > 0 && (
                  <button
                    className="carousel-nav-btn prev-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCarouselIndex(carouselIndex - 1);
                    }}
                    aria-label="Image précédente"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                {carouselIndex < post.mediaUrls.length - 1 && (
                  <button
                    className="carousel-nav-btn next-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCarouselIndex(carouselIndex + 1);
                    }}
                    aria-label="Image suivante"
                  >
                    <ChevronRight size={20} />
                  </button>
                )}
                <div className="carousel-dots-indicator">
                  {post.mediaUrls.map((_, idx) => (
                    <span
                      key={idx}
                      className={`carousel-dot ${idx === carouselIndex ? 'active' : ''}`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Floating Music Pill on Photo (Instagram Feed style) */}
            {post.audioTrack && (
              <div 
                className={`post-media-floating-music ${isPlayingAudio ? 'is-playing' : ''}`}
                onClick={handleToggleAudio}
                title={post.audioUrl ? (isPlayingAudio ? 'Pause' : 'Écouter le son') : (post.spotifyUrl ? 'Ouvrir sur Spotify' : post.audioTrack)}
              >
                <div className="mini-soundwave-bars">
                  <span className={`sw-b ${isPlayingAudio ? 'anim-1' : ''}`} />
                  <span className={`sw-b ${isPlayingAudio ? 'anim-2' : ''}`} />
                  <span className={`sw-b ${isPlayingAudio ? 'anim-3' : ''}`} />
                </div>
                <span className="floating-music-title">{post.audioTrack}</span>
              </div>
            )}
          </div>
        )}

        {/* 2. VIDEO OR REEL */}
        {(post.type === 'video' || post.type === 'reel') && post.videoUrl && (
          <div className="video-player-container" onClick={handleVideoToggle}>
            <input 
              type="file" 
              ref={repairInputRef} 
              accept="video/*" 
              style={{ display: 'none' }} 
              onChange={handleRepairVideoFile} 
            />

            <video
              ref={videoRef}
              src={post.videoUrl}
              className="post-video-element"
              playsInline
              webkit-playsinline="true"
              loop
              preload="auto"
              muted={isMuted}
              poster={post.mediaUrls?.[0]}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={() => setVideoError(true)}
            />
            
            {isVideoBroken ? (
              <div className="video-broken-notice-box" onClick={(e) => e.stopPropagation()}>
                <AlertTriangle size={32} className="broken-video-icon text-crimson" />
                <span className="broken-video-title">Vidéo initiale expirée</span>
                <p className="broken-video-desc">
                  Ce souvenir a été créé avec un lien de session temporaire. Ré-attachez votre fichier pour le sécuriser définitivement sur tous vos appareils.
                </p>
                <button
                  type="button"
                  className="btn-repair-post-video"
                  onClick={() => repairInputRef.current?.click()}
                >
                  <RefreshCw size={14} />
                  <span>Ré-attacher et réparer la vidéo</span>
                </button>
              </div>
            ) : (
              <div className="video-overlay-controls">
                {!isPlaying && (
                  <div className="video-center-play">
                    <Play size={36} fill="#ffffff" color="#ffffff" />
                  </div>
                )}
                <div className="video-corner-controls" onClick={(e) => e.stopPropagation()}>
                  <button 
                    type="button"
                    className="video-mute-btn" 
                    onClick={handleMuteToggle}
                    aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <button
                    type="button"
                    className="video-fullscreen-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (videoRef.current) {
                        const v = videoRef.current as any;
                        if (v.requestFullscreen) {
                          v.requestFullscreen();
                        } else if (v.webkitEnterFullscreen) {
                          v.webkitEnterFullscreen();
                        }
                      }
                    }}
                    title="Plein écran"
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. NOTE / SPONTANEOUS THOUGHT */}
        {post.type === 'note' && (
          <div className={`note-card-display theme-${post.noteStyle?.bgTheme || 'midnight-violet'}`}>
            <div className="note-card-pattern" />
            <div className="note-quote-sign">“</div>
            <div className="note-card-body">
              <p className={`note-text-content ${post.noteStyle?.fontSize === 'huge' ? 'font-huge' : 'font-large'}`}>
                {post.noteBody || post.caption}
              </p>
            </div>
            <div className="note-card-footer">
              <span>Pensée privée</span>
              <Calendar size={13} />
            </div>
          </div>
        )}

        {/* 4. QUOTE / BOOK PASSAGE */}
        {post.type === 'quote' && post.quoteData && (
          <div className="quote-card-display">
            <div className="quote-header-tag">
              <BookOpen size={16} />
              <span>Extrait de lecture</span>
            </div>
            <blockquote className="quote-text-body">
              « {post.quoteData.quote} »
            </blockquote>
            <div className="quote-author-block">
              <div className="quote-author-name">{post.quoteData.author}</div>
              {post.quoteData.source && (
                <div className="quote-book-title">
                  {post.quoteData.source} {post.quoteData.page ? `· ${post.quoteData.page}` : ''}
                </div>
              )}
            </div>
            {post.quoteData.reflection && (
              <div className="quote-reflection-box">
                <span className="reflection-label">Mon ancrage :</span>
                <p className="reflection-text">{post.quoteData.reflection}</p>
              </div>
            )}
          </div>
        )}

        {/* 5. LINK / WEB BOOKMARK */}
        {post.type === 'link' && post.linkData && (
          <div className="link-card-display">
            {post.linkData.image && (
              <div className="link-image-holder">
                <img src={post.linkData.image} alt={post.linkData.title} />
              </div>
            )}
            <div className="link-info-holder">
              <span className="link-domain">{post.linkData.domain || 'Lien web'}</span>
              <h3 className="link-title">{post.linkData.title}</h3>
              {post.linkData.description && (
                <p className="link-desc">{post.linkData.description}</p>
              )}
              <a 
                href={post.linkData.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="link-open-btn"
                onClick={(e) => e.stopPropagation()}
              >
                <span>Consulter la source</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Post Action Buttons Bar (Instagram Style) */}
      <div className="post-actions-bar">
        <div className="actions-left">
          <button
            className={`action-btn ${post.isFavorite ? 'favorited' : ''}`}
            onClick={() => onToggleFavorite(post.id)}
            title={post.isFavorite ? "Je n'aime plus" : "J'aime"}
            aria-label="J'aime"
          >
            <Heart 
              size={24} 
              strokeWidth={post.isFavorite ? 0 : 1.8} 
              fill={post.isFavorite ? '#ff1e27' : 'none'} 
              color={post.isFavorite ? '#ff1e27' : 'currentColor'}
            />
          </button>

          <button
            className={`action-btn ${post.privateAnnotation ? 'annotated' : ''}`}
            onClick={() => setShowAnnotationInput(!showAnnotationInput)}
            title="Commentaires"
            aria-label="Commentaires"
          >
            <MessageCircle size={24} strokeWidth={1.8} />
          </button>

          <button
            className="action-btn"
            onClick={handleShare}
            title="Partager"
            aria-label="Partager"
          >
            <Send size={22} strokeWidth={1.8} />
          </button>
        </div>

        <div className="actions-right">
          <button
            className="action-btn"
            onClick={() => onArchive(post.id)}
            title="Enregistrer"
            aria-label="Enregistrer"
          >
            <Bookmark size={23} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Likes count (Instagram) */}
      <div className="post-likes-line">
        <span className="likes-bold">
          {post.isFavorite ? '1 mention J’aime' : '0 mention J’aime'}
        </span>
      </div>

      {/* Caption & Comments Section */}
      <div className="post-caption-area">
        {post.caption && (
          <div className="post-caption-text">
            <span className="caption-username">{profile.username}</span>{' '}
            <span className="caption-body">
              {isExpanded || post.caption.length <= 110
                ? post.caption
                : `${post.caption.slice(0, 110)}...`}
            </span>
            {post.caption.length > 110 && (
              <button
                className="btn-expand-more"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? ' moins' : ' plus'}
              </button>
            )}
            {post.tags && post.tags.length > 0 && (
              <span className="inline-post-tags">
                {' '}
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="tag-inline-text"
                    onClick={() => onTagClick && onTagClick(tag)}
                  >
                    #{tag}{' '}
                  </span>
                ))}
              </span>
            )}
          </div>
        )}

        {/* Comments Stream (Instagram/Threads style) */}
        {post.privateAnnotation && (
          <div className="post-comments-wrap">
            <div className="post-comment-line">
              <span className="comment-author">{profile.username}</span>{' '}
              <span className="comment-text">{post.privateAnnotation}</span>
              <button
                type="button"
                className="btn-edit-comment-inline"
                onClick={() => {
                  setCommentDraft(post.privateAnnotation || '');
                  setShowAnnotationInput(true);
                }}
                title="Modifier le commentaire"
              >
                <Edit3 size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Clean Comment Composer */}
        {(showAnnotationInput || !post.privateAnnotation) && (
          <div className="post-comment-composer">
            <textarea
              rows={1}
              className="comment-clean-input"
              placeholder="Ajouter un commentaire..."
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && commentDraft.trim()) {
                  e.preventDefault();
                  handleSaveComment(commentDraft);
                }
              }}
            />
            {commentDraft.trim() && (
              <button
                type="button"
                className="btn-comment-publish"
                onClick={() => handleSaveComment(commentDraft)}
              >
                Publier
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
};
