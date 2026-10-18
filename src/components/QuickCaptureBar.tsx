import React, { useState, useRef, useEffect } from 'react';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea seamlessly as text grows
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const newHeight = Math.min(220, Math.max(26, el.scrollHeight));
    el.style.height = `${newHeight}px`;
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    sound.playChime();
    onSubmitText(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // If Ctrl+Enter or Cmd+Enter: submit immediately
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
      return;
    }
    // If desktop Enter on short single line without shift: submit
    if (e.key === 'Enter' && !e.shiftKey && text.length < 80 && !text.includes('\n')) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCameraClick = () => {
    sound.playPop();
    onDirectMediaClick();
  };

  const hasText = text.trim().length > 0;
  const isMultiLine = text.includes('\n') || text.length > 55;

  return (
    <div className={`quick-capture-wrap ${isFocused ? 'focused' : ''} ${isMultiLine ? 'is-multiline' : ''}`}>
      <div className="quick-capture-card">
        {/* User avatar */}
        <div className="quick-avatar-wrap">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="quick-avatar-img"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="post-author-monogram" style={{ fontSize: '12px' }}>
              {(profile.displayName || profile.username || 'A').slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        {/* Inline auto-resizing textarea */}
        <div className="quick-input-col">
          <textarea
            ref={textareaRef}
            rows={1}
            className="quick-capture-input quick-capture-textarea"
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

      {isMultiLine && (
        <div className="quick-capture-helper-row">
          <span className="helper-stats">{text.length} caractères</span>
          <span className="helper-hint">Appuyez sur Publier ↑ ou Ctrl+Entrée</span>
        </div>
      )}
    </div>
  );
};
