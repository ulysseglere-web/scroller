import React, { useState, useRef } from 'react';
import { Camera, ArrowUp } from 'lucide-react';
import type { UserProfile } from '../types';
import { sound } from '../services/sound';

interface QuickCaptureBarProps {
  profile: UserProfile;
  onSubmitText: (text: string) => void;
  onDirectMediaClick: () => void;
}

export const QuickCaptureBar: React.FC<QuickCaptureBarProps> = ({
  profile,
  onSubmitText,
  onDirectMediaClick,
}) => {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    sound.playChime();
    onSubmitText(trimmed);
    setText('');
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCameraClick = () => {
    sound.playPop();
    onDirectMediaClick();
  };

  const hasText = text.trim().length > 0;

  return (
    <div className={`quick-capture-wrap ${isFocused ? 'focused' : ''}`}>
      <div className="quick-capture-card">
        {/* User avatar */}
        <div className="quick-avatar-wrap">
          <img
            src={profile.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
            alt={profile.displayName}
            className="quick-avatar-img"
          />
        </div>

        {/* Inline input */}
        <div className="quick-input-col">
          <input
            ref={inputRef}
            type="text"
            className="quick-capture-input"
            placeholder="Une pensée, un souvenir fugace..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            aria-label="Capture rapide"
          />
        </div>

        {/* Action icons */}
        <div className="quick-actions-row">
          <button
            type="button"
            className="btn-quick-cam"
            onClick={handleCameraClick}
            title="Capturer une photo ou vidéo depuis la pellicule"
            aria-label="Photo ou vidéo directe"
          >
            <Camera size={19} strokeWidth={1.8} />
          </button>

          {hasText && (
            <button
              type="button"
              className="btn-quick-send"
              onClick={() => handleSubmit()}
              title="Publier instantanément cette note"
              aria-label="Publier la note"
            >
              <ArrowUp size={16} strokeWidth={2.6} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
