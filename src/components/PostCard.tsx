import React, { useState, useRef } from 'react';
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
  Maximize2
} from 'lucide-react';
import type { PostItem, UserProfile } from '../types';
import { sound } from '../services/sound';

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
}) => {
  // State for carousels
  const [carouselIndex, setCarouselIndex] = useState(0);
  // State for video playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Context menu dropdown
  const [showMenu, setShowMenu] = useState(false);
  // Expand long caption
  const [isExpanded, setIsExpanded] = useState(false);
  // Private annotation drawer
  const [showAnnotationInput, setShowAnnotationInput] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  // Heart pop animation on double tap
  const [showHeartPop, setShowHeartPop] = useState(false);
  const lastTapRef = useRef<number>(0);

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

  const handleVideoToggle = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
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

  return (
    <article className={`post-card ${post.isPinned ? 'is-pinned' : ''}`}>
      {/* Post Header (Instagram style) */}
      <div className="post-header">
        <div className="post-author-row">
          <div className="author-avatar-wrap">
            <img 
              src={profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
              alt={profile.displayName} 
              className="post-author-avatar"
            />
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
            <img
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
          </div>
        )}

        {/* 2. VIDEO */}
        {post.type === 'video' && post.videoUrl && (
          <div className="video-player-container" onClick={handleVideoToggle}>
            <video
              ref={videoRef}
              src={post.videoUrl}
              className="post-video-element"
              playsInline
              loop
              muted={isMuted}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            <div className="video-overlay-controls">
              {!isPlaying && (
                <div className="video-center-play">
                  <Play size={32} fill="#ffffff" />
                </div>
              )}
              <div className="video-corner-controls">
                <button 
                  className="video-mute-btn" 
                  onClick={handleMuteToggle}
                  aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              </div>
            </div>
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
            title="Note privée"
            aria-label="Commenter / Note intime"
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

      {/* Caption & Annotation Section */}
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

        {/* Private Annotation Display */}
        {post.privateAnnotation && (
          <div className="private-annotation-card">
            <span className="annotation-lead">Note intime :</span>
            <p className="annotation-body">{post.privateAnnotation}</p>
          </div>
        )}

        {/* Quick inline annotation toggle if user clicks comment */}
        {showAnnotationInput && !post.privateAnnotation && (
          <div className="annotation-input-box">
            <input
              type="text"
              placeholder="Ajouter une réflexion personnelle..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  onEdit({ ...post, privateAnnotation: e.currentTarget.value.trim() });
                  setShowAnnotationInput(false);
                }
              }}
            />
          </div>
        )}
      </div>
    </article>
  );
};
