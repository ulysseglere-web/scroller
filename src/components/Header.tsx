import React, { useState } from 'react';
import { Moon, Sun, Sparkles, SlidersHorizontal, Command, Volume2, VolumeX } from 'lucide-react';
import type { FeedFilter } from '../types';
import { sound } from '../services/sound';

interface HeaderProps {
  currentFilter: FeedFilter;
  onSelectFilter: (filter: FeedFilter) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenRandomMemory: () => void;
  totalPostsCount: number;
  onOpenCmd: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentFilter,
  onSelectFilter,
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
          <img src="/favicon.svg" alt="SCROLLER" className="brand-app-logo" />
          <span className="brand-wordmark">SCROLLER</span>
          <div className="status-live-pill" title="Vous êtes le seul utilisateur de ce réseau">
            <span className="pulse-dot" />
            <span className="pill-text">ALONE</span>
          </div>
        </div>
        <span className="tagline-sub">The social media where you're alone.</span>
      </div>

      <div className="header-actions">
        {/* Quick Command Palette Button */}
        <button 
          className="header-cmd-pill"
          onClick={() => {
            sound.playPop();
            onOpenCmd();
          }}
          title="Palette de commandes ultra-rapide (⌘K / Ctrl+K)"
          aria-label="Palette de commandes"
        >
          <Command size={13} />
          <span className="cmd-pill-key">⌘K</span>
        </button>

        {/* Flashback */}
        {totalPostsCount > 0 && (
          <button 
            className="header-glass-btn" 
            onClick={() => {
              sound.playTap();
              onOpenRandomMemory();
            }}
            title="Se remémorer un moment intime"
            aria-label="Flashback"
          >
            <Sparkles size={16} strokeWidth={1.8} className="sparkle-icon" />
          </button>
        )}

        {/* Audio FX switch */}
        <button
          className="header-glass-btn"
          onClick={handleToggleSound}
          title={soundEnabled ? 'Effets sonores actifs' : 'Effets sonores muets'}
          aria-label="Effets sonores"
        >
          {soundEnabled ? <Volume2 size={16} strokeWidth={1.8} /> : <VolumeX size={16} strokeWidth={1.8} />}
        </button>

        {/* Filter Dropdown */}
        <div className="filter-dropdown-wrapper">
          <button 
            className={`header-glass-btn ${currentFilter !== 'all' ? 'active-filter' : ''}`}
            title="Filtrer le contenu"
            aria-label="Filtrer"
          >
            <SlidersHorizontal size={15} strokeWidth={1.8} />
          </button>
          <select 
            aria-label="Filtrer le contenu"
            className="filter-select-overlay"
            value={currentFilter}
            onChange={(e) => {
              sound.playTap();
              onSelectFilter(e.target.value as FeedFilter);
            }}
          >
            <option value="all">Tout le flux</option>
            <option value="reels">Reels & Clips</option>
            <option value="photos">Photos & Séries</option>
            <option value="notes">Pensées & Notes</option>
            <option value="quotes">Citations</option>
            <option value="links">Liens & Lectures</option>
            <option value="favorites">Favoris personnels</option>
          </select>
        </div>

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
