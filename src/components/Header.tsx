import React from 'react';
import { sound } from '../services/sound';

interface HeaderProps {
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onOpenRandomMemory?: () => void;
  onReshuffleFeed?: () => void;
  totalPostsCount?: number;
  onOpenCmd?: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const handleScrollTop = () => {
    sound.playTap();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="app-header insta-clean-header">
      <div className="header-left">
        <div
          className="brand-group"
          onClick={handleScrollTop}
          role="button"
          tabIndex={0}
          title="ANTISOCIAL - Retour en haut"
        >
          <img src="/logo.png" alt="ANTISOCIAL" className="brand-app-logo" />
          <span className="brand-wordmark">ANTISOCIAL</span>
        </div>
      </div>
    </header>
  );
};
