import React, { useEffect, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface MediaViewerModalProps {
  isOpen: boolean;
  mediaUrls: string[];
  initialIndex: number;
  onClose: () => void;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
  isOpen,
  mediaUrls,
  initialIndex,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Swipe down to close physics
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setDragOffsetY(0);
    setIsDragging(false);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) setCurrentIndex((i) => i - 1);
      if (e.key === 'ArrowRight' && currentIndex < mediaUrls.length - 1) setCurrentIndex((i) => i + 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, mediaUrls.length, onClose]);

  if (!isOpen || mediaUrls.length === 0) return null;

  const currentMedia = mediaUrls[currentIndex];

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = currentMedia;
    a.download = `scroller_media_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const dy = e.touches[0].clientY - touchStartPos.current.y;
    const dx = e.touches[0].clientX - touchStartPos.current.x;

    if (dy > 0 && Math.abs(dy) > Math.abs(dx)) {
      setDragOffsetY(dy);
      setIsDragging(true);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffsetY > 80) {
      onClose();
    } else {
      setDragOffsetY(0);
      setIsDragging(false);
    }
    touchStartPos.current = null;
  };

  return (
    <div 
      className="media-viewer-backdrop" 
      onClick={onClose}
      style={{
        backgroundColor: dragOffsetY > 0 ? `rgba(0, 0, 0, ${Math.max(0.15, 0.95 - dragOffsetY / 300)})` : undefined,
      }}
    >
      <div 
        className="media-viewer-content" 
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: dragOffsetY > 0 
            ? `translate3d(0, ${dragOffsetY}px, 0) scale(${Math.max(0.82, 1 - dragOffsetY / 1000)})` 
            : undefined,
          opacity: dragOffsetY > 0 ? Math.max(0.2, 1 - dragOffsetY / 350) : undefined,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.25s ease',
        }}
      >
        {/* Top actions */}
        <div className="viewer-top-bar">
          <span className="viewer-counter">
            {currentIndex + 1} / {mediaUrls.length}
          </span>
          <div className="viewer-actions">
            <button className="viewer-icon-btn" onClick={handleDownload} title="Télécharger">
              <Download size={22} />
            </button>
            <button className="viewer-icon-btn" onClick={onClose} title="Fermer">
              <X size={26} />
            </button>
          </div>
        </div>

        {/* Media area */}
        <div className="viewer-stage">
          <img src={currentMedia} alt="Agrandissement" className="viewer-image" />
        </div>

        {/* Navigation arrows */}
        {mediaUrls.length > 1 && (
          <>
            {currentIndex > 0 && (
              <button
                className="viewer-nav-btn prev"
                onClick={() => setCurrentIndex((i) => i - 1)}
                aria-label="Précédent"
              >
                <ChevronLeft size={36} />
              </button>
            )}
            {currentIndex < mediaUrls.length - 1 && (
              <button
                className="viewer-nav-btn next"
                onClick={() => setCurrentIndex((i) => i + 1)}
                aria-label="Suivant"
              >
                <ChevronRight size={36} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
