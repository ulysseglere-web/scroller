import React, { useState } from 'react';
import { Moon, Sun, Sparkles, Command, Volume2, VolumeX } from 'lucide-react';
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
  onOpenCmd,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(sound.getEnabled());

  const handleToggleSound = () => {
    const next = sound.toggle();
    setSoundEnabled(next);
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="brand-group">
          <img src="/logo.png" alt="ANTISOCIAL" className="brand-app-logo" />
          <span className="brand-wordmark">ANTISOCIAL</span>
          <div className="status-live-pill" title="Réseau privé · 100% Hors-ligne">
            <span className="pulse-dot" />
            <span className="pill-text">SOLO</span>
          </div>
        </div>
      </div>

      <div className="header-actions">
        {/* Quick Command Palette Button */}
        <button 
          className="header-cmd-pill"
          onClick={() => {
            sound.playPop();
            onOpenCmd();
          }}
          title="Rechercher ou commander (⌘K / Ctrl+K)"
          aria-label="Recherche"
        >
          <Command size={13} />
          <span className="cmd-pill-key">⌘K</span>
        </button>

        {/* Resurface Flashback */}
        {totalPostsCount > 0 && (
          <button 
            className="header-glass-btn" 
            onClick={() => {
              sound.playTap();
              onOpenRandomMemory();
            }}
            title="Souvenir au hasard"
            aria-label="Écho"
          >
            <Sparkles size={16} strokeWidth={1.8} className="sparkle-icon" />
          </button>
        )}

        {/* Audio FX toggle */}
        <button
          className="header-glass-btn"
          onClick={handleToggleSound}
          title={soundEnabled ? 'Effets sonores actifs' : 'Effets sonores muets'}
          aria-label="Sons"
        >
          {soundEnabled ? <Volume2 size={16} strokeWidth={1.8} /> : <VolumeX size={16} strokeWidth={1.8} />}
        </button>

        {/* Theme Toggle */}
        <button 
          className="header-glass-btn" 
          onClick={() => {
            sound.playTap();
            onToggleTheme();
          }}
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          aria-label="Thème"
        >
          {theme === 'dark' ? (
            <Sun size={16} strokeWidth={1.8} />
          ) : (
            <Moon size={16} strokeWidth={1.8} />
          )}
        </button>
      </div>
    </header>
  );
};
