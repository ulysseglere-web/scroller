import React, { useState, useRef } from 'react';

interface PinchZoomImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  loading?: 'lazy' | 'eager';
}

export const PinchZoomImage: React.FC<PinchZoomImageProps> = ({
  src,
  alt,
  className = '',
  onClick,
  loading = 'lazy',
}) => {
  const [isZooming, setIsZooming] = useState(false);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const initialDistRef = useRef<number>(0);
  const initialCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent<HTMLImageElement>) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };

      initialDistRef.current = dist;
      initialCenterRef.current = center;
      setIsZooming(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLImageElement>) => {
    if (isZooming && e.touches.length === 2) {
      // Prevent browser default scroll/zoom
      if (e.cancelable) {
        e.preventDefault();
      }

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };

      if (initialDistRef.current > 0) {
        const rawScale = dist / initialDistRef.current;
        const boundedScale = Math.min(3.8, Math.max(1, rawScale));
        const deltaX = (center.x - initialCenterRef.current.x) * 0.8;
        const deltaY = (center.y - initialCenterRef.current.y) * 0.8;

        setScale(boundedScale);
        setPan({ x: deltaX, y: deltaY });
      }
    }
  };

  const handleTouchEnd = () => {
    if (isZooming) {
      setScale(1);
      setPan({ x: 0, y: 0 });
      setIsZooming(false);
      initialDistRef.current = 0;
    }
  };

  return (
    <>
      {/* Backdrop overlay when pinching */}
      {isZooming && scale > 1.05 && (
        <div 
          className="pinch-backdrop-active" 
          style={{ opacity: Math.min(0.8, (scale - 1) * 0.6) }}
        />
      )}

      <img
        src={src}
        alt={alt}
        className={`${className} ${isZooming ? 'is-pinching' : ''}`}
        loading={loading}
        onClick={onClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          transform: isZooming 
            ? `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})` 
            : 'translate3d(0, 0, 0) scale(1)',
          transition: isZooming ? 'none' : 'transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
          zIndex: isZooming ? 9999 : 1,
          position: isZooming ? 'relative' : undefined,
          touchAction: 'none',
        }}
      />
    </>
  );
};
