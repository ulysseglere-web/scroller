import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    setCurrentIndex(initialIndex);
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

  return (
    <div className="media-viewer-backdrop" onClick={onClose}>
      <div className="media-viewer-content" onClick={(e) => e.stopPropagation()}>
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
