import React, { useState } from 'react';
import { Moon, Sun, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { sound } from '../services/sound';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenRandomMemory: () => void;
  totalPostsCount: number;
  onOpenCmd: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  onOpenRandomMemory,
  totalPostsCount,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(sound.getEnabled());

  const handleToggleSound = () => {
    const next = sound.toggle();
    setSoundEnabled(next);
  };

  return (
    <header className="app-header insta-clean-header">
      <div className="header-left">
        <div className="brand-group">
          <img src="/logo.png" alt="ANTISOCIAL" className="brand-app-logo" />
          <span className="brand-wordmark">ANTISOCIAL</span>
        </div>
      </div>

      <div className="header-actions">
        {/* Flashback Souvenir aléatoire */}
        {totalPostsCount > 0 && (
          <button 
            className="header-icon-btn" 
            onClick={() => {
              sound.playTap();
              onOpenRandomMemory();
            }}
            title="Souvenir au hasard"
            aria-label="Flashback"
          >
            <Sparkles size={20} strokeWidth={1.8} />
          </button>
        )}

        {/* Audio FX toggle */}
        <button
          className="header-icon-btn"
          onClick={handleToggleSound}
          title={soundEnabled ? 'Sons actifs' : 'Sons muets'}
          aria-label="Sons"
        >
          {soundEnabled ? <Volume2 size={20} strokeWidth={1.8} /> : <VolumeX size={20} strokeWidth={1.8} />}
        </button>

        {/* Theme Toggle */}
        <button 
          className="header-icon-btn" 
          onClick={() => {
            sound.playTap();
            onToggleTheme();
          }}
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          aria-label="Thème"
        >
          {theme === 'dark' ? (
            <Sun size={20} strokeWidth={1.8} />
          ) : (
            <Moon size={20} strokeWidth={1.8} />
          )}
        </button>
      </div>
    </header>
  );
};
